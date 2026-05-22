// Sitemap index — points search engines at every sitemap on the site.
// Submit /sitemap-index.xml in Google Search Console (or each individually).

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

export async function GET() {
    const now = new Date().toISOString();
    const items = [
        `${siteUrl}/sitemap.xml`,
        `${siteUrl}/sitemap-images.xml`,
        `${siteUrl}/sitemap-videos.xml`,
    ];
    const body = items.map(loc => `    <sitemap>
        <loc>${loc}</loc>
        <lastmod>${now}</lastmod>
    </sitemap>`).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
