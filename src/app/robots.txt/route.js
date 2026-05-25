// Dynamic /robots.txt — reads admin-configured content from Mongo and
// returns it as plain text. Falls back to defaultRobotsTxt() when nothing
// is saved, so the site is always crawlable correctly even on day one.

import { readRobotsTxt } from '@/lib/robotsTxt';

export const dynamic = 'force-dynamic';

export async function GET() {
    const content = await readRobotsTxt();
    return new Response(content, {
        status: 200,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            // Edge cache for 1 hour, stale-while-revalidate for a day so
            // updates from admin propagate quickly without hammering the DB.
            'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
