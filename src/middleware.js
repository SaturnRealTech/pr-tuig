// Redirect + analytics middleware (Node runtime — needed for the MongoDB
// driver). Configured in next.config.mjs:  experimental.nodeMiddleware = true.
//
// Every non-static request hits Mongo once for a redirect lookup (sub-ms with
// the unique index on `source`). On a hit we 301/302/308 to the destination
// and increment the hit counter asynchronously.

import { NextResponse } from 'next/server';
import { col } from '@/lib/db';

export const config = {
    runtime: 'nodejs',
    matcher: [
        '/((?!_next/|api/|admin/|favicon|robots|sitemap|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|woff2?|ttf|css|js|map)).*)',
    ],
};

async function findRedirect(pathname) {
    const redirects = await col('redirects');

    // 1) exact match — uses the unique index, O(1).
    const exact = await redirects.findOne(
        { source: pathname, isActive: true },
        { projection: { destination: 1, statusCode: 1, hits: 1 } },
    );
    if (exact) return { ...exact, match: 'exact' };

    // 2) prefix match — assumed small (<1000 rows). Sort by source length desc
    //    so the longest matching prefix wins.
    const prefixes = await redirects
        .find({ matchType: 'prefix', isActive: true })
        .project({ source: 1, destination: 1, statusCode: 1, hits: 1 })
        .toArray();
    prefixes.sort((a, b) => (b.source?.length || 0) - (a.source?.length || 0));

    for (const r of prefixes) {
        const src = r.source || '';
        if (pathname === src || pathname.startsWith(src.endsWith('/') ? src : src + '/')) {
            const trailing = pathname.slice(src.length);
            return { ...r, destination: r.destination.replace(/\/$/, '') + trailing, match: 'prefix' };
        }
    }

    return null;
}

async function recordHit(_id) {
    try {
        const redirects = await col('redirects');
        await redirects.updateOne({ _id }, { $inc: { hits: 1 }, $set: { lastHitAt: new Date().toISOString() } });
    } catch { /* ignore */ }
}

export async function middleware(request) {
    const { pathname, search } = request.nextUrl;
    if (!pathname) return NextResponse.next();

    let hit;
    try {
        hit = await findRedirect(pathname);
    } catch {
        return NextResponse.next();
    }
    if (!hit) return NextResponse.next();

    if (hit.destination === pathname || hit.destination === pathname + search) {
        return NextResponse.next();
    }

    recordHit(hit._id); // fire-and-forget

    const status = [301, 302, 307, 308, 410].includes(hit.statusCode) ? hit.statusCode : 301;
    if (status === 410) {
        return new NextResponse('Gone', { status: 410 });
    }

    let dest = hit.destination;
    if (/^https?:\/\//i.test(dest)) {
        return NextResponse.redirect(dest, status);
    }
    if (!dest.startsWith('/')) dest = '/' + dest;
    const url = request.nextUrl.clone();
    url.pathname = dest.split('?')[0];
    const destSearch = dest.includes('?') ? '?' + dest.split('?').slice(1).join('?') : search || '';
    url.search = destSearch;
    return NextResponse.redirect(url, status);
}
