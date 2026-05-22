// Image sitemap — exposes every image attached to a published project or blog
// so Google can index them. Spec: https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps

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

function absoluteUrl(u) {
    if (!u) return null;
    const s = String(u).trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) return s;
    if (!siteUrl) return null;
    return siteUrl + (s.startsWith('/') ? s : '/' + s);
}

function collectProjectImages(p) {
    const out = [];
    const push = (url, caption, alt) => {
        const abs = absoluteUrl(url);
        if (abs) out.push({ url: abs, caption, title: alt || caption });
    };
    push(p.desktopBanner, p.title);
    push(p.mobileBanner, p.title);
    push(p.contentImage, p.contentTitle || p.title);
    const gallery = Array.isArray(p?.gallery?.images) ? p.gallery.images : [];
    for (const g of gallery) push(g.image || g.url, g.alt || p.title, g.alt);
    const masters = Array.isArray(p?.masterFloorPlan?.masterPlans) ? p.masterFloorPlan.masterPlans : [];
    for (const m of masters) push(m.image, m.label || `${p.title} master plan`, m.alt);
    const floors = Array.isArray(p?.masterFloorPlan?.floorPlans) ? p.masterFloorPlan.floorPlans : [];
    for (const f of floors) push(f.image, f.label || `${p.title} floor plan`, f.alt);
    const detailed = Array.isArray(p.detailedOverview) ? p.detailedOverview : [];
    for (const d of detailed) push(d.image, d.title || p.title, d.imageAlt);
    return out;
}

export async function GET() {
    try {
        const [projectsCol, blogPostsCol] = await Promise.all([col('projects'), col('blog_posts')]);
        const [projectRows, blogRows] = await Promise.all([
            projectsCol.find({ publishStatus: 'published' }).toArray(),
            blogPostsCol.find({}).project({ slug: 1, title: 1, heroImage: 1, image: 1 }).toArray(),
        ]);

        const entries = [];

        for (const p of projectRows) {
            const slug = p.isHomePage ? '' : (p.slug || (p._id ? String(p._id) : ''));
            const pageUrl = slug ? `${siteUrl}/${encodeURIComponent(slug)}` : `${siteUrl}/`;
            const images = collectProjectImages(p);
            if (images.length === 0) continue;
            entries.push({ pageUrl, images });
        }

        for (const b of blogRows) {
            const slug = b.slug || (b._id ? String(b._id) : '');
            const img = absoluteUrl(b.heroImage || b.image);
            if (!slug || !img) continue;
            entries.push({
                pageUrl: `${siteUrl}/blog/${encodeURIComponent(slug)}`,
                images: [{ url: img, caption: b.title, title: b.title }],
            });
        }

        const xmlBody = entries.map(e => {
            const imgs = e.images.map(i => `
        <image:image>
            <image:loc>${xmlEscape(i.url)}</image:loc>${i.caption ? `
            <image:caption>${xmlEscape(i.caption)}</image:caption>` : ''}${i.title ? `
            <image:title>${xmlEscape(i.title)}</image:title>` : ''}
        </image:image>`).join('');
            return `    <url>
        <loc>${xmlEscape(e.pageUrl)}</loc>${imgs}
    </url>`;
        }).join('\n');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlBody}
</urlset>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('[sitemap-images.xml] error:', error.message);
        return new NextResponse(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
            { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
        );
    }
}
