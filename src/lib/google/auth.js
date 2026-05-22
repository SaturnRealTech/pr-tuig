// Google Service Account → access token helper.
//
// Reads the service account JSON the admin saved into settings.brand.data.google
// and returns a per-scope OAuth2 access token. Tokens are cached in memory for
// 55 minutes (Google issues 1-hour tokens). Soft-fails: returns null when not
// configured so call sites can skip the API call gracefully.

import jwt from 'jsonwebtoken';
import { col } from '@/lib/db';
import { hasOAuthConnection, refreshAccessToken } from './oauth';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

// Module-level cache survives request boundaries inside a single process.
// OAuth user tokens cover every scope so they share a single cache key.
const tokenCache = new Map(); // scope -> { token, exp }
const OAUTH_CACHE_KEY = '__oauth_user__';

export async function readGoogleSettings() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const blob = row?.data || {};
        const g = blob.google || {};
        return {
            serviceAccount: g.serviceAccount || null,
            searchConsole: g.searchConsole || { siteUrl: '' },
            analytics: g.analytics || { propertyId: '' },
        };
    } catch {
        return { serviceAccount: null, searchConsole: { siteUrl: '' }, analytics: { propertyId: '' } };
    }
}

export async function hasServiceAccount() {
    const s = (await readGoogleSettings()).serviceAccount;
    return !!(s && s.client_email && s.private_key);
}

export async function hasAnyCredential() {
    return (await hasOAuthConnection()) || (await hasServiceAccount());
}

// Returns an access token for the given scope, or null if not configured.
// Preference order: OAuth user-account refresh token > Service Account JWT.
export async function getAccessToken(scope) {
    // OAuth user tokens grant every scope at once, so we cache them under a
    // single key and return the same token regardless of `scope`.
    if (await hasOAuthConnection()) {
        const cached = tokenCache.get(OAUTH_CACHE_KEY);
        if (cached && cached.exp > Date.now() + 30_000) return cached.token;
        try {
            const t = await refreshAccessToken();
            if (t?.token) {
                tokenCache.set(OAUTH_CACHE_KEY, {
                    token: t.token,
                    exp: Date.now() + (t.expiresIn * 1000) - 5 * 60_000,
                });
                return t.token;
            }
        } catch (err) {
            // Fall through to Service Account if OAuth refresh fails.
            console.error('[google.auth] OAuth refresh failed, trying SA:', err.message);
        }
    }

    const cached = tokenCache.get(scope);
    if (cached && cached.exp > Date.now() + 30_000) return cached.token;

    const { serviceAccount } = await readGoogleSettings();
    if (!serviceAccount?.client_email || !serviceAccount?.private_key) return null;

    const now = Math.floor(Date.now() / 1000);
    const claim = {
        iss: serviceAccount.client_email,
        scope,
        aud: TOKEN_ENDPOINT,
        iat: now,
        exp: now + 3600,
    };

    let assertion;
    try {
        // PEM strings stored as JSON often arrive with escaped newlines.
        const key = String(serviceAccount.private_key).replace(/\\n/g, '\n');
        assertion = jwt.sign(claim, key, { algorithm: 'RS256' });
    } catch (err) {
        throw new Error(`Service account private key is invalid: ${err.message}`);
    }

    const params = new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
    });

    const res = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.access_token) {
        const reason = json.error_description || json.error || `HTTP ${res.status}`;
        throw new Error(`Google token exchange failed: ${reason}`);
    }

    tokenCache.set(scope, {
        token: json.access_token,
        exp: Date.now() + ((json.expires_in || 3600) * 1000) - 5 * 60_000,
    });
    return json.access_token;
}

export function invalidateTokenCache() {
    tokenCache.clear();
}

export const SCOPES = {
    indexing: 'https://www.googleapis.com/auth/indexing',
    searchConsole: 'https://www.googleapis.com/auth/webmasters.readonly',
    analytics: 'https://www.googleapis.com/auth/analytics.readonly',
};

// Wraps fetch with the access token. Returns { ok, status, data, error }.
export async function authedFetch(scope, url, init = {}) {
    try {
        const token = await getAccessToken(scope);
        if (!token) return { ok: false, status: 0, error: 'Google Service Account not configured' };
        const res = await fetch(url, {
            ...init,
            headers: {
                ...(init.headers || {}),
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });
        const text = await res.text();
        let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
        if (!res.ok) {
            const message = (data && data.error && data.error.message) || (typeof data === 'string' ? data : `HTTP ${res.status}`);
            return { ok: false, status: res.status, error: message, data };
        }
        return { ok: true, status: res.status, data };
    } catch (err) {
        return { ok: false, status: 0, error: err.message };
    }
}
