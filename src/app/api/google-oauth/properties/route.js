// GET /api/google-oauth/properties
// Returns the list of Search Console sites + GA4 properties the connected
// Google account has access to — used to populate the admin dropdowns.

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authHelper';
import { authedFetch, SCOPES } from '@/lib/google/auth';

const GSC_SITES = 'https://www.googleapis.com/webmasters/v3/sites';
const GA_ACCOUNT_SUMMARIES = 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries';

export async function GET(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    const [sitesRes, accountsRes] = await Promise.all([
        authedFetch(SCOPES.searchConsole, GSC_SITES),
        authedFetch(SCOPES.analytics, GA_ACCOUNT_SUMMARIES),
    ]);

    const sites = sitesRes.ok
        ? (sitesRes.data?.siteEntry || []).map(s => ({
            siteUrl: s.siteUrl,
            permission: s.permissionLevel,
        }))
        : [];

    // GA4 returns nested accountSummaries[].propertySummaries[]. Flatten to a
    // simple { displayName, propertyId, parent } list.
    const properties = accountsRes.ok
        ? (accountsRes.data?.accountSummaries || []).flatMap(acc =>
            (acc.propertySummaries || []).map(p => ({
                propertyId: (p.property || '').replace(/^properties\//, ''),
                displayName: p.displayName,
                parent: acc.displayName,
            }))
        )
        : [];

    return NextResponse.json({
        success: true,
        sites,
        properties,
        searchConsoleError: sitesRes.ok ? null : sitesRes.error,
        analyticsError: accountsRes.ok ? null : accountsRes.error,
    });
}
