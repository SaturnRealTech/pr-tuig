// Google News sitemap. Emits every blog post from the last 48 hours in the
// Google News XML format. Per spec only posts <48h old should appear here.
// Submit this URL alongside the regular sitemap in Search Console / Bing.

import { NextResponse } from 'next/server';
import { col } from '@/lib/db';

export const dynamic = 'force-dynamic';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://saturnrealcon.com').replace(/\/$/, '');
const TWO_DAYS_MS = 48 * 60 * 60 * 1000;

function escXml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function pickDate(post) {
    const candidates = [post.publishedAt, post.createdAt, post.date, post.updatedAt];
    for (const c of candidates) {
        if (!c) continue;
        const d = new Date(c);
        if (!Number.isNaN(d.getTime())) return d;
    }
    return null;
}

async function readBrand() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        return row?.data || {};
    } catch { return {}; }
}

export async function GET() {
    try {
        const brand = await readBrand();
        const publication = brand.siteName || 'Site';
        const language = brand.locale || 'en';

        const since = new Date(Date.now() - TWO_DAYS_MS).toISOString();
        const blogPosts = await col('blog_posts');
        const posts = await blogPosts
            .find({
                $or: [{ publishStatus: null }, { publishStatus: 'published' }],
                $and: [{
                    $or: [
                        { publishedAt: { $gte: since } },
                        { createdAt: { $gte: since } },
                        { date: { $gte: since } },
                    ],
                }],
            })
            .project({ slug: 1, title: 1, publishedAt: 1, createdAt: 1, date: 1, keywords: 1 })
            .sort({ publishedAt: -1, createdAt: -1 })
            .toArray();

        const entries = posts
            .map(p => {
                const slug = p.slug || (p._id ? String(p._id) : '');
                if (!slug) return null;
                const d = pickDate(p);
                if (!d || (Date.now() - d.getTime() > TWO_DAYS_MS)) return null;
                const loc = `${siteUrl}/blog/${encodeURIComponent(slug)}`;
                const keywords = p.keywords
                    ? String(p.keywords).split(',').map(s => s.trim()).filter(Boolean).join(', ')
                    : '';
                return `  <url>
    <loc>${escXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escXml(publication)}</news:name>
        <news:language>${escXml(language)}</news:language>
      </news:publication>
      <news:publication_date>${escXml(d.toISOString())}</news:publication_date>
      <news:title>${escXml(p.title || '')}</news:title>${keywords ? `
      <news:keywords>${escXml(keywords)}</news:keywords>` : ''}
    </news:news>
  </url>`;
            })
            .filter(Boolean);

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries.join('\n')}
</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            },
        });
    } catch (error) {
        console.error('[news-sitemap] failed:', error.message);
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"></urlset>`,
            { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
        );
    }
}
