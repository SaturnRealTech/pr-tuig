// GET /api/google-oauth/callback?code=...&state=...
// Google redirects here after consent. Verifies the CSRF state cookie,
// exchanges the code for a refresh_token, stores everything and bounces back
// to the admin page with a status flag.

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import { exchangeCode, writeOAuth, fetchUserEmail } from '@/lib/google/oauth';

const ADMIN_PAGE = '/admin/seo/instant-indexing';

function redirectBack(status, message = '') {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
    const target = `${base || ''}${ADMIN_PAGE}?google=${encodeURIComponent(status)}${message ? `&error=${encodeURIComponent(message)}` : ''}`;
    return NextResponse.redirect(target || ADMIN_PAGE, 302);
}

export async function GET(request) {
    const authError = requireAdmin(request);
    if (authError) return redirectBack('unauthorized', authError.error);

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) return redirectBack('denied', error);
    if (!code || !state) return redirectBack('invalid', 'Missing code or state.');

    const cookieState = request.cookies.get('g-oauth-state')?.value;
    if (!cookieState || cookieState !== state) {
        return redirectBack('invalid', 'State mismatch — request expired.');
    }

    try {
        const tokens = await exchangeCode(code);
        if (!tokens.refresh_token) {
            return redirectBack('error', 'Google did not return a refresh_token. Remove the app from your Google account permissions and try again.');
        }
        const userEmail = await fetchUserEmail(tokens.access_token);
        await writeOAuth({
            refreshToken: tokens.refresh_token,
            scope: tokens.scope || '',
            userEmail,
            connectedAt: new Date().toISOString(),
        });

        const res = redirectBack('connected');
        res.cookies.set('g-oauth-state', '', { maxAge: 0, path: '/' });
        return res;
    } catch (err) {
        return redirectBack('error', err.message);
    }
}
