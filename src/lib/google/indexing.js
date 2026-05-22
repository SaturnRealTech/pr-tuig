// Google Indexing API client. Two operations:
//   submitIndexingUrl(url, type='URL_UPDATED')  → publish a notification
//   getIndexingMetadata(url)                    → last update / latest indexed
//
// Officially the Indexing API only acts on JobPosting and BroadcastEvent
// content types, but we always pass the URL through — Google returns a
// useful error otherwise and Rank Math's UX shows the same response.

import { authedFetch, SCOPES } from './auth';

const PUBLISH = 'https://indexing.googleapis.com/v3/urlNotifications:publish';
const META = 'https://indexing.googleapis.com/v3/urlNotifications/metadata';

export async function submitIndexingUrl(url, type = 'URL_UPDATED') {
    return authedFetch(SCOPES.indexing, PUBLISH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type }),
    });
}

export async function getIndexingMetadata(url) {
    return authedFetch(SCOPES.indexing, `${META}?url=${encodeURIComponent(url)}`);
}

export async function submitIndexingBatch(urls, type = 'URL_UPDATED') {
    const results = [];
    for (const u of urls) {
        const r = await submitIndexingUrl(u, type);
        results.push({ url: u, ok: r.ok, status: r.status, error: r.error || null, response: r.data || null });
    }
    const submitted = results.filter(r => r.ok).length;
    return { submitted, total: urls.length, results };
}
