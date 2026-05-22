// Video sitemap — exposes project walkthrough videos so Google Video can
// index them. Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps

import { NextResponse } from 'next/server';
import { col } from '@/lib/db';

export const dynamic = 'force-dynamic';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

function xmlEscape(s) {
    return String(s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Pull the video id out of any common YouTube URL. Returns { id, thumbnail, embed }.
function youTubeMeta(url) {
    if (!url) return null;
    const s = String(url).trim();
    let id = null;
    const m = s.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/);
    if (m) id = m[1];
    if (!id) return null;
    return {
        id,
        watch: `https://www.youtube.com/watch?v=${id}`,
        embed: `https://www.youtube.com/embed/${id}`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
}

function absoluteImage(u) {
    if (!u) return null;
    const s = String(u).trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    if (!siteUrl) return null;
    return siteUrl + (s.startsWith('/') ? s : '/' + s);
}

export async function GET() {
    try {
        const projects = await col('projects');
        const rows = await projects
            .find({ publishStatus: 'published' })
            .project({ slug: 1, title: 1, walkthroughUrl: 1, walkthroughTitle: 1, walkthroughDuration: 1, desktopBanner: 1, mobileBanner: 1, isHomePage: 1 })
            .toArray();

        const entries = [];

        for (const p of rows) {
            const yt = youTubeMeta(p.walkthroughUrl);
            if (!yt) continue;

            const slug = p.isHomePage ? '' : (p.slug || (p._id ? String(p._id) : ''));
            const pageUrl = slug ? `${siteUrl}/${encodeURIComponent(slug)}` : `${siteUrl}/`;
            const thumb = absoluteImage(p.desktopBanner || p.mobileBanner) || yt.thumbnail;

            entries.push({
                pageUrl,
                title: p.walkthroughTitle || `${p.title} — Walkthrough`,
                description: p.walkthroughTitle || `${p.title} project walkthrough`,
                thumbnail: thumb,
                contentLoc: yt.watch,
                playerLoc: yt.embed,
            });
        }

        const xmlBody = entries.map(e => `    <url>
        <loc>${xmlEscape(e.pageUrl)}</loc>
        <video:video>
            <video:thumbnail_loc>${xmlEscape(e.thumbnail)}</video:thumbnail_loc>
            <video:title>${xmlEscape(e.title)}</video:title>
            <video:description>${xmlEscape(e.description)}</video:description>
            <video:content_loc>${xmlEscape(e.contentLoc)}</video:content_loc>
            <video:player_loc allow_embed="yes" autoplay="ap=1">${xmlEscape(e.playerLoc)}</video:player_loc>
            <video:family_friendly>yes</video:family_friendly>
            <video:live>no</video:live>
        </video:video>
    </url>`).join('\n');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${xmlBody}
</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('[sitemap-videos.xml] error:', error.message);
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
            { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
        );
    }
}
