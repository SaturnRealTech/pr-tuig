// Video sitemap. Scans the selected post types for YouTube / Vimeo embeds
// (plus any admin-defined custom fields) and emits a Google Video Sitemap.
// Settings live at /admin/seo/video-sitemap.

import { NextResponse } from 'next/server';
import { col } from '@/lib/db';
import {
    readVideoSitemap,
    extractVideos,
    gatherHtml,
    enrichYouTube,
    BLOG_FIELDS_DEFAULT,
    PROJECT_FIELDS_DEFAULT,
} from '@/lib/videoSitemap';

export const dynamic = 'force-dynamic';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://saturnrealcon.com').replace(/\/$/, '');

function escXml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function urlNode(loc, video) {
    const lines = [
        `  <url>`,
        `    <loc>${escXml(loc)}</loc>`,
        `    <video:video>`,
    ];
    if (video.thumbnailLoc) lines.push(`      <video:thumbnail_loc>${escXml(video.thumbnailLoc)}</video:thumbnail_loc>`);
    lines.push(`      <video:title>${escXml(video.title || 'Video')}</video:title>`);
    lines.push(`      <video:description>${escXml(video.description || video.title || 'Video')}</video:description>`);
    lines.push(`      <video:content_loc>${escXml(video.contentLoc)}</video:content_loc>`);
    lines.push(`      <video:player_loc>${escXml(video.playerLoc)}</video:player_loc>`);
    if (video.duration) lines.push(`      <video:duration>${escXml(video.duration)}</video:duration>`);
    if (video.publishedAt) lines.push(`      <video:publication_date>${escXml(video.publishedAt)}</video:publication_date>`);
    lines.push(`    </video:video>`);
    lines.push(`  </url>`);
    return lines.join('\n');
}

// ISO8601 PT#H#M#S → total seconds. Google accepts both — emit seconds for
// max compatibility.
function isoToSeconds(iso) {
    if (!iso) return '';
    const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
    if (!m) return '';
    const h = parseInt(m[1] || '0', 10);
    const min = parseInt(m[2] || '0', 10);
    const s = parseInt(m[3] || '0', 10);
    return String(h * 3600 + min * 60 + s);
}

export async function GET() {
    const cfg = await readVideoSitemap();

    if (cfg.hideSitemap) {
        return new NextResponse('Not Found', { status: 404 });
    }

    try {
        const entries = [];
        const ytIds = new Set();
        const pending = [];

        if (cfg.postTypes?.blogs) {
            try {
                const blogPosts = await col('blog_posts');
                const rows = await blogPosts
                    .find({ $or: [{ publishStatus: null }, { publishStatus: 'published' }] })
                    .toArray();
                for (const r of rows) {
                    const html = gatherHtml(r, BLOG_FIELDS_DEFAULT, cfg.customFields);
                    const videos = extractVideos(html);
                    if (videos.length === 0) continue;
                    const slug = r.slug || (r._id ? String(r._id) : '');
                    const loc = `${siteUrl}/blog/${encodeURIComponent(slug)}`;
                    for (const v of videos) {
                        if (v.provider === 'youtube') ytIds.add(v.id);
                        pending.push({
                            loc,
                            video: v,
                            fallbackTitle: r.title,
                            fallbackDescription: r.metaDescription || r.excerpt || r.title,
                        });
                    }
                }
            } catch { /* collection missing */ }
        }

        if (cfg.postTypes?.projects) {
            try {
                const projects = await col('projects');
                const rows = await projects.find({ publishStatus: 'published' }).toArray();
                for (const r of rows) {
                    const html = gatherHtml(r, PROJECT_FIELDS_DEFAULT, cfg.customFields);
                    const videos = extractVideos(html);
                    if (videos.length === 0) continue;
                    const slug = r.slug || (r._id ? String(r._id) : '');
                    const loc = `${siteUrl}/${encodeURIComponent(slug)}`;
                    const title = r.title || r.name;
                    for (const v of videos) {
                        if (v.provider === 'youtube') ytIds.add(v.id);
                        pending.push({
                            loc,
                            video: v,
                            fallbackTitle: title,
                            fallbackDescription: r.metaDescription || title,
                        });
                    }
                }
            } catch { /* collection missing */ }
        }

        const enrichment = await enrichYouTube([...ytIds], cfg.youtubeApiKey);

        for (const p of pending) {
            const yt = p.video.provider === 'youtube' ? enrichment.get(p.video.id) : null;
            entries.push(urlNode(p.loc, {
                ...p.video,
                title: yt?.title || p.fallbackTitle,
                description: yt?.description || p.fallbackDescription,
                duration: yt?.duration ? isoToSeconds(yt.duration) : '',
                publishedAt: yt?.publishedAt || '',
            }));
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${entries.join('\n')}\n</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            },
        });
    } catch (error) {
        console.error('[video-sitemap] failed:', error.message);
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"></urlset>`;
        return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
    }
}
