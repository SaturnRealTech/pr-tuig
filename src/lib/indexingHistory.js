// Instant Indexing history log. Persists one row per (URL × target) for
// every submission (auto-on-publish or manual). Used by the History tab.

import { col, nowIso } from '@/lib/db';

const MAX_ROWS = 5000;
let writeCount = 0;

async function maybeTrim() {
    writeCount += 1;
    if (writeCount < 200) return;
    writeCount = 0;
    try {
        const history = await col('instant_indexing_history');
        // Find the cutoff: the submittedAt of the MAX_ROWS-th newest doc.
        const skipDocs = await history
            .find({})
            .project({ submittedAt: 1 })
            .sort({ submittedAt: -1, _id: -1 })
            .skip(MAX_ROWS)
            .limit(1)
            .toArray();
        if (skipDocs.length === 0) return;
        const cutoff = skipDocs[0].submittedAt;
        if (cutoff) await history.deleteMany({ submittedAt: { $lt: cutoff } });
    } catch { /* not critical */ }
}

export async function logEntries(entries) {
    if (!Array.isArray(entries) || entries.length === 0) return;
    const ts = nowIso();
    const docs = entries.map(r => ({
        url: r.url,
        target: r.target,
        type: r.type || 'URL_UPDATED',
        source: r.source || 'auto',
        status: r.status,
        statusCode: r.statusCode == null ? null : Number(r.statusCode),
        message: r.message || null,
        submittedAt: r.submittedAt || ts,
    }));
    try {
        const history = await col('instant_indexing_history');
        await history.insertMany(docs, { ordered: false });
        maybeTrim(); // fire-and-forget
    } catch (err) {
        console.error('[indexingHistory] log failed:', err.message);
    }
}

export async function listHistory({ page = 1, limit = 50, target = null } = {}) {
    const lim = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const off = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

    const filter = {};
    if (target && ['indexnow', 'google'].includes(target)) filter.target = target;

    const history = await col('instant_indexing_history');
    const [total, rows] = await Promise.all([
        history.countDocuments(filter),
        history
            .find(filter)
            .sort({ submittedAt: -1, _id: -1 })
            .skip(off)
            .limit(lim)
            .toArray(),
    ]);

    return { rows, total, page: Math.max(parseInt(page, 10) || 1, 1), limit: lim };
}

export async function clearHistory() {
    try {
        const history = await col('instant_indexing_history');
        await history.deleteMany({});
        return true;
    } catch { return false; }
}

// Convenience: take the raw response shape produced by submitToIndexNow or
// submitIndexingBatch and turn it into row(s) we can log.
export function entriesFromIndexNow(result, urls, source) {
    if (!result || result.skipped) return [];
    const status = result.status >= 200 && result.status < 300 ? 'ok' : 'error';
    return urls.map(u => ({
        url: u,
        target: 'indexnow',
        source,
        status,
        statusCode: result.status || null,
        message: result.body || null,
    }));
}

export function entriesFromGoogle(result, source) {
    if (!result || result.skipped) return [];
    if (result.error) {
        return [{
            url: '(batch)',
            target: 'google',
            source,
            status: 'error',
            statusCode: null,
            message: result.error,
        }];
    }
    return (result.results || []).map(r => ({
        url: r.url,
        target: 'google',
        type: 'URL_UPDATED',
        source,
        status: r.ok ? 'ok' : 'error',
        statusCode: r.status || null,
        message: r.error || null,
    }));
}
