// Google OAuth 2.0 (user-account) helper. Mirrors Rank Math's "Connect with
// Google" flow: admin pastes their OAuth Client ID + Secret once, then a
// single click signs in and gives us a refresh_token that mints
// access tokens for the Indexing API, Search Console and GA4.
//
// Stored at: settings.brand.data.google.oauth = {
//   clientId, clientSecret, refreshToken, userEmail, connectedAt, scope
// }

import { col, upsertByKey, nowIso } from '@/lib/db';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export const OAUTH_SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/indexing',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/analytics.readonly',
];

export async function readOAuth() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const blob = row?.data || {};
        return blob.google?.oauth || null;
    } catch { return null; }
}

export async function writeOAuth(next) {
    const settings = await col('settings');
    const row = await settings.findOne({ type: 'brand' });
    const blob = row?.data || {};
    const google = blob.google || {};
    google.oauth = next ? { ...(google.oauth || {}), ...next } : null;
    blob.google = google;
    const now = nowIso();
    const payload = { data: blob, updatedAt: now };
    if (!row) payload.createdAt = now;
    await upsertByKey('settings', 'type', 'brand', payload);
}

export async function hasOAuthClient() {
    const o = await readOAuth();
    return !!(o && o.clientId && o.clientSecret);
}

export async function hasOAuthConnection() {
    const o = await readOAuth();
    return !!(o && o.refreshToken);
}

// Public redirect URI that the admin must register in Google Cloud →
// OAuth Client → "Authorized redirect URIs".
export function redirectUri() {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    return `${base}/api/google-oauth/callback`;
}

export async function buildAuthUrl(state) {
    const o = await readOAuth();
    if (!o?.clientId) throw new Error('OAuth Client ID not configured');
    const params = new URLSearchParams({
        client_id: o.clientId,
        redirect_uri: redirectUri(),
        response_type: 'code',
        scope: OAUTH_SCOPES.join(' '),
        access_type: 'offline',
        include_granted_scopes: 'true',
        prompt: 'consent',
        state,
    });
    return `${AUTH_URL}?${params.toString()}`;
}

export async function exchangeCode(code) {
    const o = await readOAuth();
    if (!o?.clientId || !o?.clientSecret) throw new Error('OAuth client not configured');

    const params = new URLSearchParams({
        code,
        client_id: o.clientId,
        client_secret: o.clientSecret,
        redirect_uri: redirectUri(),
        grant_type: 'authorization_code',
    });

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json.error_description || json.error || `HTTP ${res.status}`);
    }
    return json; // { access_token, refresh_token, expires_in, scope, id_token }
}

// Mint a fresh access token using the stored refresh_token. Returns null when
// not connected so the caller can fall back to Service Account.
export async function refreshAccessToken() {
    const o = await readOAuth();
    if (!o?.refreshToken || !o?.clientId || !o?.clientSecret) return null;

    const params = new URLSearchParams({
        client_id: o.clientId,
        client_secret: o.clientSecret,
        refresh_token: o.refreshToken,
        grant_type: 'refresh_token',
    });

    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.access_token) {
        const reason = json.error_description || json.error || `HTTP ${res.status}`;
        // If the refresh token is invalid (revoked / expired), clear it so the
        // UI shows "Connect" again instead of looping forever.
        if (json.error === 'invalid_grant') await writeOAuth({ refreshToken: '' });
        throw new Error(`OAuth refresh failed: ${reason}`);
    }
    return { token: json.access_token, expiresIn: json.expires_in || 3600 };
}

export async function fetchUserEmail(accessToken) {
    try {
        const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok) return '';
        const json = await res.json();
        return json.email || '';
    } catch { return ''; }
}

export async function revokeToken() {
    const o = await readOAuth();
    if (!o?.refreshToken) return;
    try {
        await fetch(`${REVOKE_URL}?token=${encodeURIComponent(o.refreshToken)}`, { method: 'POST' });
    } catch { /* best effort */ }
    await writeOAuth({ refreshToken: '', userEmail: '', connectedAt: '', scope: '' });
}
