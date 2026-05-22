// Google Analytics Data API (GA4) client. Reports pageviews and users for
// a given page path over the last N days.

import { authedFetch, SCOPES, readGoogleSettings } from './auth';

function propertyId() {
    const cfg = readGoogleSettings();
    return cfg.analytics?.propertyId?.trim() || null;
}

function endpoint() {
    const id = propertyId();
    if (!id) return null;
    return `https://analyticsdata.googleapis.com/v1beta/properties/${id}:runReport`;
}

export async function getPageStats(pagePath, days = 28) {
    const url = endpoint();
    if (!url) return { ok: false, error: 'GA4 property ID not configured' };

    const body = {
        dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
            { name: 'screenPageViews' },
            { name: 'totalUsers' },
            { name: 'sessions' },
            { name: 'averageSessionDuration' },
        ],
        dimensionFilter: {
            filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'EXACT', value: pagePath },
            },
        },
        limit: 1,
    };

    const res = await authedFetch(SCOPES.analytics, url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: res.error };
    const row = (res.data?.rows || [])[0];
    const v = (i) => Number(row?.metricValues?.[i]?.value || 0);
    return {
        ok: true,
        days,
        pageviews: v(0),
        users: v(1),
        sessions: v(2),
        avgSessionDuration: v(3),
    };
}

// Smoke test — runs a 1-row report so we know auth + property ID work.
export async function pingAnalytics() {
    const url = endpoint();
    if (!url) return { ok: false, error: 'GA4 property ID not configured' };
    const body = {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 1,
    };
    return authedFetch(SCOPES.analytics, url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}
