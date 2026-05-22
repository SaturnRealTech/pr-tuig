// Google Search Console (Webmasters v3) client. Returns search analytics
// rows: impressions, clicks, position, top queries — scoped to a single
// page URL by default so the admin can see per-URL performance.

import { authedFetch, SCOPES, readGoogleSettings } from './auth';

const BASE = 'https://www.googleapis.com/webmasters/v3/sites';

function isoDate(d) { return d.toISOString().slice(0, 10); }

function defaultRange(days = 28) {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 2); // GSC lags ~2 days
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days);
    return { startDate: isoDate(start), endDate: isoDate(end) };
}

function siteUrlEncoded() {
    const cfg = readGoogleSettings();
    const site = cfg.searchConsole?.siteUrl?.trim();
    if (!site) return null;
    return encodeURIComponent(site);
}

// Per-URL totals: impressions, clicks, ctr, position. Returns null when not
// configured so the admin page can just hide the panel.
export async function getUrlStats(pageUrl, days = 28) {
    const site = siteUrlEncoded();
    if (!site) return { ok: false, error: 'Search Console site URL not configured' };
    const { startDate, endDate } = defaultRange(days);

    const body = {
        startDate,
        endDate,
        dimensions: [],
        rowLimit: 1,
        dimensionFilterGroups: [{
            filters: [{ dimension: 'page', operator: 'equals', expression: pageUrl }],
        }],
    };

    const res = await authedFetch(SCOPES.searchConsole, `${BASE}/${site}/searchAnalytics/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: res.error };
    const row = (res.data?.rows || [])[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    return { ok: true, startDate, endDate, ...row };
}

// Top queries that surfaced a given page.
export async function getTopQueries(pageUrl, days = 28, limit = 10) {
    const site = siteUrlEncoded();
    if (!site) return { ok: false, error: 'Search Console site URL not configured' };
    const { startDate, endDate } = defaultRange(days);

    const body = {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit,
        dimensionFilterGroups: [{
            filters: [{ dimension: 'page', operator: 'equals', expression: pageUrl }],
        }],
    };

    const res = await authedFetch(SCOPES.searchConsole, `${BASE}/${site}/searchAnalytics/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: res.error };
    const rows = (res.data?.rows || []).map(r => ({
        query: r.keys?.[0] || '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
    }));
    return { ok: true, startDate, endDate, rows };
}

// Confirms the service account has access — used by the test endpoint.
export async function pingSearchConsole() {
    const cfg = readGoogleSettings();
    const site = cfg.searchConsole?.siteUrl?.trim();
    if (!site) return { ok: false, error: 'Search Console site URL not configured' };
    return authedFetch(SCOPES.searchConsole, `${BASE}/${encodeURIComponent(site)}`);
}
