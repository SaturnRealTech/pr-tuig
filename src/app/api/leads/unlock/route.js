// Leads vault unlock — verifies the leads password (bcrypt), derives the
// AES-GCM session key (PBKDF2), persists it in `lead_sessions` keyed to a
// random token, and sets an HTTP-only cookie. After this returns, the admin
// can call /api/leads (which is now gated on the cookie) and receive
// AES-encrypted payloads.
//
//   POST    /api/leads/unlock  { password }     → unlock
//   DELETE  /api/leads/unlock                   → re-lock (destroy session)
//   GET     /api/leads/unlock                   → status { configured, unlocked, salt? }

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAdminOnly } from '@/lib/authHelper';
import {
    readLeadsCrypto,
    deriveKey,
    createUnlockSession,
    lookupUnlockSession,
    destroyUnlockSession,
    buildUnlockSetCookie,
    buildUnlockClearCookie,
    readUnlockTokenFromRequest,
} from '@/lib/leadsLock';

// Tiny helper: pull the admin's _id out of the auth cookie if present so we
// can stamp the unlock session with it. Not load-bearing — just useful for
// audit ("which admin unlocked this").
function adminIdFromRequest(request) {
    try {
        // requirePermission already verified the JWT before we got here, so
        // just parse the same cookie to grab `_id`.
        const c = request.headers.get('cookie') || '';
        const m = c.match(/auth-token=([^;]+)/);
        if (!m) return null;
        const parts = m[1].split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        return payload._id || payload.id || null;
    } catch { return null; }
}

export async function POST(request) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const { password } = await request.json();
        if (typeof password !== 'string' || password.length === 0) {
            return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
        }

        const { hash, salt, configured } = await readLeadsCrypto();
        if (!configured) {
            return NextResponse.json(
                { success: false, error: 'Leads vault has not been configured. Set a password in Brand settings.' },
                { status: 412 },
            );
        }

        const ok = await bcrypt.compare(password, hash);
        if (!ok) {
            return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
        }

        const key = deriveKey(password, salt);
        const { token, expiresAt } = await createUnlockSession(key, adminIdFromRequest(request));

        const res = NextResponse.json({
            success: true,
            // Salt is needed by the browser so it can derive the same key
            // via WebCrypto PBKDF2 and decrypt the payload locally.
            salt,
            expiresAt: expiresAt.toISOString(),
        });
        res.headers.append('Set-Cookie', buildUnlockSetCookie(token));
        return res;
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const token = readUnlockTokenFromRequest(request);
        await destroyUnlockSession(token);
        const res = NextResponse.json({ success: true });
        res.headers.append('Set-Cookie', buildUnlockClearCookie());
        return res;
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const { configured, salt } = await readLeadsCrypto();
        const token = readUnlockTokenFromRequest(request);
        const session = token ? await lookupUnlockSession(token) : null;
        return NextResponse.json({
            success: true,
            configured,
            unlocked: !!session,
            // Salt is safe to ship while unlocked so the browser can re-derive
            // the AES key without prompting the admin again.
            salt: session ? salt : undefined,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
