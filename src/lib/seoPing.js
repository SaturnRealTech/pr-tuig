// Unified "ping the search engines" helper. Fires Google's Indexing API AND
// IndexNow (Bing/Yandex/etc) in parallel as a single fire-and-forget call so
// the publish flow doesn't have to know about either protocol.
//
// Use this whenever a public URL is created, updated or deleted in admin.

import { submitToIndexNow } from '@/lib/indexnow';
import { submitIndexingBatch } from '@/lib/google/indexing';
import { hasServiceAccount } from '@/lib/google/auth';
import { hasOAuthConnection } from '@/lib/google/oauth';
import { logEntries, entriesFromIndexNow, entriesFromGoogle } from '@/lib/indexingHistory';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

function absolutize(input) {
    const v = String(input || '').trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    if (!SITE_URL) return null;
    return SITE_URL + (v.startsWith('/') ? v : '/' + v);
}

// Fire both submissions in the background. Never throws. Returns immediately;
// errors are logged for ops visibility but don't block the publish response.
//
//   type: 'URL_UPDATED' (default) on create/publish/edit
//         'URL_DELETED' on unpublish/delete — only the Google call honours it
export function pingSearchEngines(urlsOrPath, { type = 'URL_UPDATED' } = {}) {
    const list = (Array.isArray(urlsOrPath) ? urlsOrPath : [urlsOrPath])
        .map(absolutize)
        .filter(Boolean);
    if (list.length === 0) return;

    // Async credential checks. Build promises lazily inside the runner.
    const googleEnabledPromise = (async () => (await hasOAuthConnection()) || (await hasServiceAccount()))();

    // IndexNow doesn't understand a delete signal — skip it on URL_DELETED.
    const indexNowPromise = type === 'URL_DELETED'
        ? Promise.resolve({ skipped: true })
        : submitToIndexNow(list).catch(err => ({ error: err.message }));

    const googlePromise = googleEnabledPromise.then(enabled =>
        enabled
            ? submitIndexingBatch(list, type).catch(err => ({ error: err.message }))
            : { skipped: true }
    );

    Promise.allSettled([indexNowPromise, googlePromise]).then(([inResult, gResult]) => {
        const inVal = inResult.status === 'fulfilled' ? inResult.value : { error: inResult.reason?.message };
        const gVal = gResult.status === 'fulfilled' ? gResult.value : { error: gResult.reason?.message };

        // Persist history.
        const rows = [
            ...entriesFromIndexNow(inVal, list, 'auto'),
            ...entriesFromGoogle(gVal, 'auto'),
        ];
        if (rows.length) logEntries(rows);

        const fmt = (label, v) => {
            if (!v || v.skipped) return null;
            if (v.error) return `${label}: error — ${v.error}`;
            if (typeof v.submitted === 'number' && typeof v.total === 'number') {
                return `${label}: ${v.submitted}/${v.total} accepted`;
            }
            if (typeof v.status === 'number') return `${label}: HTTP ${v.status}`;
            return `${label}: ok`;
        };
        const parts = [fmt('IndexNow', inVal), fmt('Google Indexing', gVal)].filter(Boolean);
        if (parts.length) console.log(`[seoPing] ${list.length} URL(s) — ` + parts.join(' · '));
    });
}
