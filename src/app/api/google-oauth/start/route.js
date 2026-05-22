// GET /api/google-oauth/start
// Initiates the OAuth flow — must be called from an admin browser session.
// Generates a CSRF nonce, sets a short-lived cookie and 302s to Google.

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/authHelper';
import { buildAuthUrl, hasOAuthClient } from '@/lib/google/oauth';

export async function GET(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    if (!(await hasOAuthClient())) {
        return NextResponse.json({ success: false, error: 'Save OAuth Client ID + Secret first.' }, { status: 400 });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    let url;
    try {
        url = await buildAuthUrl(nonce);
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }

    const res = NextResponse.redirect(url, 302);
    res.cookies.set('g-oauth-state', nonce, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });
    return res;
}
