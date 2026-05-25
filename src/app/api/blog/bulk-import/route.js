import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { col, nowIso } from '@/lib/db';

function reEscape(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(title) {
    return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Unwrap `{ success, data: {...} }` wrappers, or pass the object through.
function unwrap(raw) {
    if (raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object') {
        return raw.data;
    }
    return raw;
}

// POST /api/blog/bulk-import
// Body: { blogs: [<blog | { success, data: blog }>, ...] }
// Inserts each blog into `blog_posts`, skipping any whose title already exists
// (case-insensitive exact match). Returns a per-item summary.
export async function POST(request) {
    const guard = await requirePermission(request, 'blog', 'create');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const items = Array.isArray(body?.blogs) ? body.blogs : null;
    if (!items || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Expected { blogs: [...] } with at least one entry' }, { status: 400 });
    }

    const blogPosts = await col('blog_posts');
    const now = nowIso();
    const details = [];
    let inserted = 0, skipped = 0, failed = 0;

    for (let i = 0; i < items.length; i++) {
        const sourceName = items[i]?.__source || `#${i + 1}`;
        try {
            const blog = unwrap(items[i]);
            const title = blog?.title;
            if (!title) {
                failed++;
                details.push({ source: sourceName, status: 'failed', error: 'Missing "title"' });
                continue;
            }

            const titleRegex = new RegExp(`^${reEscape(title)}$`, 'i');
            const existing = await blogPosts.findOne({ title: titleRegex }, { projection: { _id: 1 } });
            if (existing) {
                skipped++;
                details.push({ source: sourceName, title, status: 'skipped', reason: 'title already exists' });
                continue;
            }

            // Drop the source-file marker and any externally-supplied _id so
            // Mongo generates a fresh ObjectId.
            const { __source, _id, createdAt, updatedAt, ...rest } = blog;
            const doc = {
                ...rest,
                slug: rest.slug || slugify(title),
                createdAt: createdAt || now,
                updatedAt: now,
            };
            const result = await blogPosts.insertOne(doc);
            inserted++;
            details.push({ source: sourceName, title, status: 'inserted', _id: String(result.insertedId) });
        } catch (e) {
            failed++;
            details.push({ source: sourceName, status: 'failed', error: e.message });
        }
    }

    return NextResponse.json({ success: true, inserted, skipped, failed, total: items.length, details });
}
