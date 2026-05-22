import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { col, nowIso } from '@/lib/db';
import { pingSearchEngines } from '@/lib/seoPing';

// Build a case-insensitive substring regex for Mongo $regex queries.
function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// GET - Fetch all blog posts (optional category + search)
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        const filter = {};
        if (category && category !== 'All') filter.category = category;
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$or = [{ title: re }, { excerpt: re }];
        }

        const blogPosts = await col('blog_posts');
        const posts = await blogPosts
            .find(filter)
            .sort({ date: -1, createdAt: -1 })
            .toArray();

        return NextResponse.json({ success: true, data: posts });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - Create a new blog post
export async function POST(request) {
    const guard = await requirePermission(request, 'blog', 'create');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json();
        const now = nowIso();
        const doc = { ...body, createdAt: now, updatedAt: now };
        // Strip undefined to keep the document clean.
        Object.keys(doc).forEach(k => { if (doc[k] === undefined) delete doc[k]; });

        const blogPosts = await col('blog_posts');
        const result = await blogPosts.insertOne(doc);
        const row = await blogPosts.findOne({ _id: result.insertedId });

        const isPublished = !row?.publishStatus || row.publishStatus === 'published';
        const slug = row?.slug || (row?._id ? String(row._id) : '');
        if (slug && isPublished) pingSearchEngines([`/blog/${slug}`]);

        return NextResponse.json(
            { success: true, data: row },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
