// IndexNow ownership proof. Search engines verify by fetching
// https://yourdomain.com/indexnow/<key>.txt and expecting the same key back.
// The path /indexnow/* avoids colliding with the public catch-all [...slug].

import { getIndexNowKey } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
    const { key } = await params;
    if (!key || !key.endsWith('.txt')) {
        return new Response('Not found', { status: 404 });
    }
    const bare = key.replace(/\.txt$/i, '');
    const expected = await getIndexNowKey();
    if (!expected || bare !== expected) {
        return new Response('Not found', { status: 404 });
    }
    return new Response(expected, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
    });
}
