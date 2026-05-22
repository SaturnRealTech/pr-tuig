// POST /api/indexnow  { urls: [...], targets?: ['indexnow', 'google'] }
// Submits URLs to IndexNow (Bing/Yandex et al) AND Google's Indexing API in
// parallel when configured. Admin-only.

import { NextResponse } from 'next/server';
import { submitToIndexNow, getIndexNowKey } from '@/lib/indexnow';
import { submitIndexingBatch } from '@/lib/google/indexing';
import { hasServiceAccount } from '@/lib/google/auth';
import { requirePermission } from '@/lib/authHelper';
import { logEntries, entriesFromIndexNow, entriesFromGoogle } from '@/lib/indexingHistory';

export async function GET() {
    return NextResponse.json({
        success: true,
        configured: !!(await getIndexNowKey()),
        googleConfigured: await hasServiceAccount(),
    });
}

export async function POST(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json().catch(() => ({}));
        const urls = Array.isArray(body.urls) ? body.urls : (body.url ? [body.url] : []);
        if (urls.length === 0) {
            return NextResponse.json({ success: false, error: 'Provide { urls: [...] }' }, { status: 400 });
        }

        const targets = Array.isArray(body.targets) && body.targets.length
            ? body.targets
            : ['indexnow', 'google'];

        const runIndexNow = targets.includes('indexnow');
        const runGoogle = targets.includes('google') && (await hasServiceAccount());

        const [indexNowResult, googleResult] = await Promise.all([
            runIndexNow ? submitToIndexNow(urls) : Promise.resolve({ skipped: true }),
            runGoogle ? submitIndexingBatch(urls) : Promise.resolve({ skipped: true }),
        ]);

        const historyRows = [
            ...entriesFromIndexNow(indexNowResult, urls, 'manual'),
            ...entriesFromGoogle(googleResult, 'manual'),
        ];
        if (historyRows.length) logEntries(historyRows);

        const indexNowOk = !runIndexNow || (indexNowResult.status >= 200 && indexNowResult.status < 300);
        const googleOk = !runGoogle || (googleResult.submitted === googleResult.total);

        return NextResponse.json({
            success: indexNowOk && googleOk,
            // back-compat fields used by existing UI
            submitted: indexNowResult.submitted || 0,
            status: indexNowResult.status || 0,
            body: indexNowResult.body || '',
            // per-target detail
            indexNow: indexNowResult,
            google: googleResult,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
