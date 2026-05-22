import { NextResponse } from 'next/server';
import { col, nowIso } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// Strip "https://localhost:3000" or "https://yourdomain.com" off a source URL
// so the middleware only ever compares pathnames. An empty result becomes "/".
function normaliseSource(raw) {
    let s = String(raw || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) {
        try {
            const u = new URL(s);
            s = u.pathname + (u.search || '');
        } catch { /* leave as-is */ }
    }
    if (!s.startsWith('/')) s = '/' + s;
    s = s.replace(/\/{2,}/g, '/');
    if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
    return s;
}

function normaliseDestination(raw) {
    let d = String(raw || '').trim();
    if (!d) return '';
    if (/^https?:\/\//i.test(d)) return d;
    if (d.startsWith('/')) return d;
    if (/^[\w-]+(\.[\w-]+)+/.test(d)) return 'https://' + d;
    return '/' + d;
}

// GET /api/redirects?page=1&limit=100&search=&active=1
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = (searchParams.get('search') || '').trim();
        const onlyActive = searchParams.get('active') === '1';
        const rawLimit = searchParams.get('limit');
        const wantAll = rawLimit === '0' || rawLimit === 'all';
        const limit = wantAll ? 5000 : Math.min(Math.max(parseInt(rawLimit || '100', 10), 1), 2000);
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const offset = (page - 1) * limit;

        const filter = {};
        if (onlyActive) filter.isActive = true;
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$or = [{ source: re }, { destination: re }, { note: re }];
        }

        const redirects = await col('redirects');
        const [total, rows] = await Promise.all([
            redirects.countDocuments(filter),
            redirects
                .find(filter)
                .sort({ updatedAt: -1, createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .toArray(),
        ]);

        return NextResponse.json({
            success: true,
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST /api/redirects  — create
export async function POST(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    try {
        const body = await request.json();
        const source = normaliseSource(body.source);
        const destination = normaliseDestination(body.destination);
        if (!source || !destination) {
            return NextResponse.json({ success: false, error: 'source and destination are required' }, { status: 400 });
        }
        if (source === destination) {
            return NextResponse.json({ success: false, error: 'source and destination must differ' }, { status: 400 });
        }

        const statusCode = [301, 302, 307, 308, 410].includes(Number(body.statusCode)) ? Number(body.statusCode) : 301;
        const matchType = ['exact', 'prefix', 'regex'].includes(body.matchType) ? body.matchType : 'exact';
        const isActive = body.isActive !== false;
        const now = nowIso();

        const redirects = await col('redirects');
        // Enforce uniqueness on `source` manually (Mongo unique index recommended on first deploy).
        const dup = await redirects.findOne({ source }, { projection: { _id: 1 } });
        if (dup) {
            return NextResponse.json({ success: false, error: `A redirect for "${source}" already exists` }, { status: 409 });
        }

        const doc = {
            source,
            destination,
            statusCode,
            matchType,
            isActive,
            hits: 0,
            note: body.note || null,
            createdAt: now,
            updatedAt: now,
        };
        const result = await redirects.insertOne(doc);
        const row = await redirects.findOne({ _id: result.insertedId });
        return NextResponse.json({ success: true, data: row }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
