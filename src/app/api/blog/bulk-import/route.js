import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { col, nowIso } from '@/lib/db';

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
// For each blog: if a doc with the same slug (or, fallback, the same title)
// already exists, update it in place. Otherwise insert a new doc.
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
    let inserted = 0, updated = 0, failed = 0;

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

            // Match by slug only. If slug exists → update; if not → insert below.
            const incomingSlug = blog?.slug || slugify(title);
            const existing = await blogPosts.findOne(
                { slug: incomingSlug },
                { projection: { _id: 1, slug: 1 } }
            );

            // Strip control fields the client shouldn't be able to override.
            const { __source, _id, createdAt, updatedAt, ...rest } = blog;

            if (existing) {
                const updateDoc = {
                    ...rest,
                    slug: rest.slug || existing.slug || incomingSlug,
                    updatedAt: now,
                };
                await blogPosts.updateOne({ _id: existing._id }, { $set: updateDoc });
                updated++;
                details.push({ source: sourceName, title, status: 'updated', _id: String(existing._id) });
                continue;
            }

            const doc = {
                ...rest,
                slug: rest.slug || incomingSlug,
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

    return NextResponse.json({ success: true, inserted, updated, failed, total: items.length, details });
}
