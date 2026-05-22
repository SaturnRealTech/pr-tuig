// Tiny IndexNow helper. Reads the admin-saved key from settings and submits a
// list of URLs to the IndexNow protocol so search engines (Bing, Yandex, Naver,
// Seznam — and Google via shared infra) re-crawl them within minutes.

import { col } from '@/lib/db';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || '';

async function brandData() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        return row?.data || {};
    } catch {
        return {};
    }
}

export async function getIndexNowKey() {
    const data = await brandData();
    const key = String(data.indexNowKey || '').trim();
    return key || null;
}

function absolute(urlOrPath) {
    if (/^https?:\/\//i.test(urlOrPath)) return urlOrPath;
    const root = SITE_URL.replace(/\/$/, '');
    const path = urlOrPath.startsWith('/') ? urlOrPath : '/' + urlOrPath;
    return root + path;
}

// Submit one or many URLs. Returns { submitted, status, body }.
export async function submitToIndexNow(urls) {
    const key = await getIndexNowKey();
    if (!key) return { submitted: 0, status: 0, body: 'IndexNow key not configured' };
    if (!SITE_URL) return { submitted: 0, status: 0, body: 'NEXT_PUBLIC_SITE_URL not configured' };

    const list = (Array.isArray(urls) ? urls : [urls]).map(absolute).filter(Boolean);
    if (list.length === 0) return { submitted: 0, status: 0, body: 'No URLs' };

    const host = new URL(SITE_URL).host;
    const payload = {
        host,
        key,
        keyLocation: `${SITE_URL.replace(/\/$/, '')}/indexnow/${key}.txt`,
        urlList: list,
    };

    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
            body: JSON.stringify(payload),
        });
        const text = await res.text().catch(() => '');
        return { submitted: list.length, status: res.status, body: text };
    } catch (err) {
        return { submitted: 0, status: 0, body: err.message };
    }
}

// Fire-and-forget — never throws, useful from API routes after publish.
export function pingIndexNow(urls) {
    submitToIndexNow(urls).catch(err => {
        console.error('[indexnow] background ping failed:', err.message);
    });
}
