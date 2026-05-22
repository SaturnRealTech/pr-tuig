// Sitemap index — points search engines at every sitemap we publish.
// Submit this URL (instead of sitemap.xml) in Search Console / Bing Webmaster.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://saturnrealcon.com').replace(/\/$/, '');

export async function GET() {
    const now = new Date().toISOString();
    const sitemaps = [
        `${siteUrl}/sitemap.xml`,
        `${siteUrl}/video-sitemap.xml`,
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(loc => `  <sitemap>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n  </sitemap>`).join('\n')}
</sitemapindex>`;

    return new NextResponse(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-store, max-age=0, must-revalidate',
        },
    });
}
