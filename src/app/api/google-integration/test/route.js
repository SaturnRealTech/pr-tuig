// Smoke-test endpoint: runs one cheap call against each configured Google
// service and returns ok / error per service. Used by the "Test connection"
// button on the admin page.

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import { getAccessToken, SCOPES, hasServiceAccount, readGoogleSettings } from '@/lib/google/auth';
import { pingSearchConsole } from '@/lib/google/searchConsole';
import { pingAnalytics } from '@/lib/google/analytics';

export async function POST(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    const out = {
        serviceAccount: { ok: false, error: null },
        indexing: { ok: false, error: null, skipped: false },
        searchConsole: { ok: false, error: null, skipped: false },
        analytics: { ok: false, error: null, skipped: false },
    };

    if (!(await hasServiceAccount())) {
        out.serviceAccount.error = 'Service Account JSON not configured';
        return NextResponse.json({ success: false, data: out });
    }

    // Token exchange = serves as the "service account works at all" check.
    try {
        const token = await getAccessToken(SCOPES.indexing);
        if (!token) out.serviceAccount.error = 'Token exchange returned no token';
        else { out.serviceAccount.ok = true; out.indexing.ok = true; }
    } catch (err) {
        out.serviceAccount.error = err.message;
        out.indexing.skipped = true;
    }

    const cfg = await readGoogleSettings();
    if (!cfg.searchConsole?.siteUrl) {
        out.searchConsole.skipped = true;
    } else {
        const r = await pingSearchConsole();
        out.searchConsole.ok = r.ok;
        out.searchConsole.error = r.ok ? null : (r.error || 'Search Console call failed');
    }

    if (!cfg.analytics?.propertyId) {
        out.analytics.skipped = true;
    } else {
        const r = await pingAnalytics();
        out.analytics.ok = r.ok;
        out.analytics.error = r.ok ? null : (r.error || 'Analytics call failed');
    }

    const success = out.serviceAccount.ok &&
        (out.searchConsole.skipped || out.searchConsole.ok) &&
        (out.analytics.skipped || out.analytics.ok);

    return NextResponse.json({ success, data: out });
}
