// Beacon endpoint for the client-side analytics tracker.
// POST { path, referrer, sessionId } — IP/UA are extracted from the request.

import { NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';
import crypto from 'node:crypto';
import { insertRow, nowIso } from '@/lib/db';

export const dynamic = 'force-dynamic';

function hashIp(ip) {
    if (!ip) return null;
    return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32);
}

function getIp(request) {
    return (
        request.headers.get('x-real-ip') ||
        (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
        ''
    );
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const path = String(body.path || '/').slice(0, 1024);
        const referrer = body.referrer ? String(body.referrer).slice(0, 1024) : null;
        const sessionId = body.sessionId ? String(body.sessionId).slice(0, 64) : null;

        const userAgentString = request.headers.get('user-agent') || '';
        const ua = new UAParser(userAgentString);
        const device = (ua.getDevice().type || 'desktop');
        const browser = `${ua.getBrowser().name || ''} ${ua.getBrowser().version || ''}`.trim();
        const os = `${ua.getOS().name || ''} ${ua.getOS().version || ''}`.trim();

        await insertRow('analytics_visits', {
            path,
            referrer,
            host: request.headers.get('host') || null,
            userAgent: userAgentString || null,
            device,
            browser,
            os,
            country: request.headers.get('x-vercel-ip-country') || null,
            sessionId,
            ipHash: hashIp(getIp(request)),
            ts: nowIso(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // Don't let analytics failures break the page.
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
}
