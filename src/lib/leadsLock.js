// Leads vault — extra password gate + end-to-end AES encryption on top of
// the normal admin auth. Threat model: shoulder-surfers, anyone watching the
// DevTools Network tab on the admin's machine.
//
// Flow:
//   1. Admin sets a "Leads Password" in /admin/dashboard. We store
//      bcrypt(password) and a per-install salt — never the plaintext.
//   2. /api/leads/unlock POST { password } verifies via bcrypt, derives an
//      AES-256-GCM key (PBKDF2-SHA256, 100k iters, password + salt), stores
//      that key on a short-lived `lead_sessions` row keyed to a random token,
//      and sets an HTTP-only `leads_unlock=<token>` cookie.
//   3. /api/leads GET checks the cookie, fetches leads, AES-GCM encrypts the
//      JSON with the session key, and returns `{ encrypted: true, salt, iv,
//      ct }`. The Network tab only ever sees ciphertext.
//   4. The browser re-derives the same key with PBKDF2 (password kept in JS
//      memory only) and decrypts via WebCrypto before rendering.

import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { col, nowIso } from '@/lib/db';

const SESSION_TTL_SECS = 30 * 60;     // 30 minutes
const PBKDF2_ITERS = 100_000;
const PBKDF2_KEYLEN = 32;             // 256-bit
const PBKDF2_DIGEST = 'sha256';

// ---------- password setup ----------

export async function setLeadsPassword(password) {
    if (typeof password !== 'string' || password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    const hash = await bcrypt.hash(password, 12);
    const salt = crypto.randomBytes(16).toString('base64');
    return { leadsPasswordHash: hash, leadsSalt: salt };
}

export async function readLeadsCrypto() {
    const settings = await col('settings');
    const row = await settings.findOne({ type: 'brand' });
    const data = row?.data || {};
    return {
        hash: data.leadsPasswordHash || '',
        salt: data.leadsSalt || '',
        configured: !!(data.leadsPasswordHash && data.leadsSalt),
    };
}

// ---------- key derivation ----------

export function deriveKey(password, saltB64) {
    const salt = Buffer.from(saltB64, 'base64');
    return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
}

// ---------- AES-GCM payload ----------

export function encryptPayload(plaintext, keyBuf) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf, iv);
    const ct1 = cipher.update(plaintext, 'utf8');
    const ct2 = cipher.final();
    const tag = cipher.getAuthTag();
    // pack tag at the end of the ciphertext so the browser only needs iv + ct
    const ctWithTag = Buffer.concat([ct1, ct2, tag]);
    return { iv: iv.toString('base64'), ct: ctWithTag.toString('base64') };
}

// ---------- session store (lead_sessions collection) ----------

export async function createUnlockSession(keyBuf, userId) {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_SECS * 1000);
    const sessions = await col('lead_sessions');
    await sessions.insertOne({
        token,
        keyB64: keyBuf.toString('base64'),
        userId: userId ? String(userId) : null,
        createdAt: nowIso(),
        expiresAt,                  // Date — picked up by TTL index when present
    });
    // Best-effort TTL index (idempotent). If indexes can't be created here
    // (e.g. read-only user) we silently skip; Mongo will keep the rows
    // forever but we still expire them in-memory via expiresAt check.
    try { await sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); } catch { /* noop */ }
    return { token, expiresAt };
}

export async function lookupUnlockSession(token) {
    if (!token) return null;
    const sessions = await col('lead_sessions');
    const row = await sessions.findOne({ token });
    if (!row) return null;
    if (row.expiresAt && new Date(row.expiresAt).getTime() < Date.now()) {
        await sessions.deleteOne({ token }).catch(() => {});
        return null;
    }
    return { key: Buffer.from(row.keyB64, 'base64'), userId: row.userId };
}

export async function destroyUnlockSession(token) {
    if (!token) return;
    const sessions = await col('lead_sessions');
    await sessions.deleteOne({ token }).catch(() => {});
}

// ---------- cookie helpers ----------

export const UNLOCK_COOKIE = 'leads_unlock';

export function buildUnlockSetCookie(token, maxAgeSecs = SESSION_TTL_SECS) {
    const attrs = [
        `${UNLOCK_COOKIE}=${token}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        `Max-Age=${maxAgeSecs}`,
    ];
    if (process.env.NODE_ENV === 'production') attrs.push('Secure');
    return attrs.join('; ');
}

export function buildUnlockClearCookie() {
    const attrs = [
        `${UNLOCK_COOKIE}=`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        'Max-Age=0',
    ];
    if (process.env.NODE_ENV === 'production') attrs.push('Secure');
    return attrs.join('; ');
}

export function readUnlockTokenFromRequest(request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const m = cookieHeader.match(new RegExp(`${UNLOCK_COOKIE}=([^;]+)`));
    return m ? m[1] : null;
}
