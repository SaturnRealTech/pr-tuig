import { NextResponse } from 'next/server';
import { findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';
import { pingSearchEngines } from '@/lib/seoPing';
import { deleteFromS3 } from '@/lib/s3-upload';

function buildUpdate(body) {
    const out = { ...body, updatedAt: nowIso() };
    // Strip undefined and the synthetic `id` field if present (Mongo uses _id).
    delete out.id;
    Object.keys(out).forEach(k => { if (out[k] === undefined) delete out[k]; });
    return out;
}

// GET - Fetch a single blog post by ID or slug
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('blog_posts', id);
        if (!row) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT - Update a blog post
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const updateData = buildUpdate(body);

        const changes = await updateByAnyId('blog_posts', id, updateData);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
        }

        const row = await findOneByAnyId('blog_posts', id);
        const isPublished = !row?.publishStatus || row.publishStatus === 'published';
        const slug = row?.slug || (row?._id ? String(row._id) : '');
        if (slug && isPublished) pingSearchEngines([`/blog/${slug}`]);

        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete a blog post
export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    try {
        const { id } = await params;
        const row = await findOneByAnyId('blog_posts', id);
        if (!row) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
        }

        const imagesToDelete = [row.heroImage, row.image].filter(u => typeof u === 'string' && u);
        if (imagesToDelete.length > 0) {
            await Promise.all(imagesToDelete.map(u =>
                deleteFromS3(u).catch(e => console.error('[blog] S3 delete failed:', u, e.message))
            ));
        }

        const slug = row.slug || (row._id ? String(row._id) : '');
        const wasPublished = !row.publishStatus || row.publishStatus === 'published';
        await deleteByAnyId('blog_posts', id);
        if (slug && wasPublished) pingSearchEngines([`/blog/${slug}`], { type: 'URL_DELETED' });
        return NextResponse.json({ success: true, message: 'Blog post and images deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
