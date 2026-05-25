// Robots.txt helper — single source of truth for the default content and the
// "read from settings or fall back" logic. Used by:
//   - /robots.txt          (dynamic public route)
//   - /api/robots-txt      (admin read/save)
//   - /admin/seo/edit-robots-txt  (editor UI)

import { col } from '@/lib/db';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tangledupingreen.in').replace(/\/$/, '');

// Sensible default — based on the existing /public/robots.txt with the
// /api path also blocked from bots.
export function defaultRobotsTxt(siteUrl = SITE_URL) {
    return [
        '# robots.txt — managed in admin → SEO → Edit robots.txt',
        '',
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin',
        'Disallow: /admin/',
        'Disallow: /api/',
        '',
        `Sitemap: ${siteUrl}/sitemap.xml`,
        '',
    ].join('\n');
}

export async function readRobotsTxt() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const stored = row?.data?.robotsTxt;
        if (typeof stored === 'string' && stored.trim().length > 0) return stored;
    } catch { /* fall through */ }
    return defaultRobotsTxt();
}
