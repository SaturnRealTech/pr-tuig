// Combined per-URL stats panel. Hits all three Google APIs in parallel and
// returns whatever it can — gracefully skips services that aren't
// configured so the admin sees partial data instead of an error.

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import { getIndexingMetadata } from '@/lib/google/indexing';
import { getUrlStats, getTopQueries } from '@/lib/google/searchConsole';
import { getPageStats } from '@/lib/google/analytics';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

function toAbsolute(input) {
    const v = String(input || '').trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    if (!SITE_URL) return null;
    return SITE_URL + (v.startsWith('/') ? v : '/' + v);
}

function toPath(absolute) {
    try {
        return new URL(absolute).pathname || '/';
    } catch { return null; }
}

export async function GET(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('url');
    const days = Math.min(Math.max(parseInt(searchParams.get('days') || '28', 10) || 28, 1), 90);

    const absolute = toAbsolute(raw);
    if (!absolute) {
        return NextResponse.json({ success: false, error: 'Provide ?url=<path-or-absolute>' }, { status: 400 });
    }
    const pagePath = toPath(absolute);

    const [indexingRes, gscRes, queriesRes, gaRes] = await Promise.all([
        getIndexingMetadata(absolute),
        getUrlStats(absolute, days),
        getTopQueries(absolute, days, 10),
        getPageStats(pagePath, days),
    ]);

    return NextResponse.json({
        success: true,
        url: absolute,
        path: pagePath,
        days,
        indexing: indexingRes.ok ? indexingRes.data : { error: indexingRes.error },
        searchConsole: gscRes,
        topQueries: queriesRes,
        analytics: gaRes,
    });
}
