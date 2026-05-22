// POST /api/404-log/redirect
//
// One-click "fix this 404" action. Takes a 404 log entry's source path + the
// destination the admin typed, inserts a redirect into the `redirects`
// collection (the existing Redirections module), and removes the 404 log row.

import { NextResponse } from 'next/server';
import { col, nowIso, toObjectId } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';

function normaliseSource(raw) {
    let s = String(raw || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) {
        try { const u = new URL(s); s = u.pathname + (u.search || ''); } catch { /* noop */ }
    }
    if (!s.startsWith('/')) s = '/' + s;
    s = s.replace(/\/{2,}/g, '/');
    if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
    return s;
}
function normaliseDestination(raw) {
    let d = String(raw || '').trim();
    if (!d) return '';
    if (/^https?:\/\//i.test(d)) return d;
    if (d.startsWith('/')) return d;
    if (/^[\w-]+(\.[\w-]+)+/.test(d)) return 'https://' + d;
    return '/' + d;
}

export async function POST(request) {
    const guard = await requirePermission(request, 'redirects', 'create');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const body = await request.json();
        const source = normaliseSource(body.source);
        const destination = normaliseDestination(body.destination);
        const logId = String(body.logId || '').trim();

        if (!source || !destination) {
            return NextResponse.json({ success: false, error: 'source and destination required' }, { status: 400 });
        }
        if (source === destination) {
            return NextResponse.json({ success: false, error: 'source and destination must differ' }, { status: 400 });
        }

        const statusCode = [301, 302, 307, 308, 410].includes(Number(body.statusCode)) ? Number(body.statusCode) : 301;
        const matchType = ['exact', 'prefix', 'regex'].includes(body.matchType) ? body.matchType : 'exact';

        const redirects = await col('redirects');
        const now = nowIso();

        // Upsert by source so re-running on the same 404 just updates the dest.
        const result = await redirects.findOneAndUpdate(
            { source },
            {
                $set: { source, destination, statusCode, matchType, isActive: true, updatedAt: now },
                $setOnInsert: { hits: 0, createdAt: now, note: '404 Monitor → redirect' },
            },
            { upsert: true, returnDocument: 'after' },
        );

        // Remove the 404 log row now that it's a real redirect.
        if (logId) {
            try {
                const log = await col('not_found_log');
                const oid = toObjectId(logId);
                await log.deleteOne({ $or: [{ _id: oid }, { _id: logId }] });
            } catch { /* ignore */ }
        }

        return NextResponse.json({ success: true, data: result.value || result });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
