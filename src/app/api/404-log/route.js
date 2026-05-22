// 404 Monitor API.
//
//   POST   /api/404-log               — anonymous beacon from not-found.js
//   GET    /api/404-log               — admin: list 404s, paginated
//   DELETE /api/404-log               — admin: clear ALL rows
//
// Storage: `not_found_log` collection. Each URL is one document; the count
// auto-increments and `lastSeen` updates on every hit.

import { NextResponse } from 'next/server';
import { col, nowIso, toObjectId } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Common crawler/headless-browser fingerprints. Anything matching is silently
// dropped so the table stays focused on real users hitting broken URLs.
const BOT_UA_RE = /(googlebot|adsbot|mediapartners|bingbot|slurp|duckduckbot|baiduspider|yandex|ahrefs|semrush|mj12bot|dotbot|petalbot|applebot|facebot|facebookexternalhit|twitterbot|linkedinbot|embedly|whatsapp|telegrambot|pinterest|discordbot|skypeuripreview|slackbot|archive\.org|wayback|chrome-lighthouse|headlesschrome|phantomjs|puppeteer|playwright|curl\/|wget\/|python-requests|go-http-client|axios\/|node-fetch|httpx|libwww-perl|httrack|nutch|bot[\s/);]|crawler|spider|scraper)/i;
function isBot(ua) {
    if (!ua) return true; // missing UA is overwhelmingly bots
    return BOT_UA_RE.test(ua);
}

function normalisePath(raw) {
    let s = String(raw || '').trim();
    if (!s) return null;
    if (/^https?:\/\//i.test(s)) {
        try {
            const u = new URL(s);
            s = u.pathname + (u.search || '');
        } catch { /* leave as-is */ }
    }
    if (!s.startsWith('/')) s = '/' + s;
    s = s.replace(/\/{2,}/g, '/');
    if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
    // Cap length so a malicious huge URL can't bloat the DB.
    return s.slice(0, 2048);
}

// POST — anonymous. No permission check; this is hit by every 404 page view.
export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const path = normalisePath(body.path);
        if (!path) return NextResponse.json({ success: false, error: 'path is required' }, { status: 400 });

        // Drop noise: anything inside /admin, /api, /_next.
        if (path.startsWith('/admin') || path.startsWith('/api') || path.startsWith('/_next')) {
            return NextResponse.json({ success: true, ignored: true });
        }

        const referrer = String(body.referrer || '').slice(0, 1024);
        const userAgent = String(request.headers.get('user-agent') || '').slice(0, 512);

        // Crawlers generate the bulk of 404 noise. Drop them silently so admins
        // only see real-user broken-link hits worth fixing.
        if (isBot(userAgent)) {
            return NextResponse.json({ success: true, ignored: 'bot' });
        }

        const now = nowIso();

        const log = await col('not_found_log');
        await log.updateOne(
            { path },
            {
                $set: { lastSeen: now, lastReferrer: referrer, lastUserAgent: userAgent },
                $inc: { count: 1 },
                $setOnInsert: { path, firstSeen: now },
            },
            { upsert: true },
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        // Beacons must never throw back to the page.
        return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
}

// GET — admin only. ?search= filters by path; sortBy=hits|recent.
export async function GET(request) {
    const guard = await requirePermission(request, 'redirects', 'view');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const { searchParams } = new URL(request.url);
        const search = (searchParams.get('search') || '').trim();
        const sortBy = searchParams.get('sortBy') || 'recent';
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 500);

        const filter = {};
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$or = [{ path: re }, { lastReferrer: re }];
        }

        const sort = sortBy === 'hits' ? { count: -1, lastSeen: -1 } : { lastSeen: -1 };
        const log = await col('not_found_log');
        const [total, rows] = await Promise.all([
            log.countDocuments(filter),
            log.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).toArray(),
        ]);

        return NextResponse.json({
            success: true,
            data: rows,
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE — admin only. With ?ids=a,b,c clears just those; without, clears all.
export async function DELETE(request) {
    const guard = await requirePermission(request, 'redirects', 'delete');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const { searchParams } = new URL(request.url);
        const ids = (searchParams.get('ids') || '').split(',').map(s => s.trim()).filter(Boolean);
        const log = await col('not_found_log');
        if (ids.length === 0) {
            const r = await log.deleteMany({});
            return NextResponse.json({ success: true, deletedCount: r.deletedCount });
        }
        const objectIds = ids.map(toObjectId).filter(Boolean);
        const r = await log.deleteMany({ $or: [{ _id: { $in: objectIds } }, { _id: { $in: ids } }] });
        return NextResponse.json({ success: true, deletedCount: r.deletedCount });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
