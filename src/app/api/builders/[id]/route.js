import { NextResponse } from 'next/server';
import { col, findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { deleteFromS3 } from '@/lib/s3-upload';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('categories', id);
        if (!row) return NextResponse.json({ success: false, error: 'Builder not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const guard = await requirePermission(request, 'builders', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, slug, title, description, content, heroImage, mobileBanner, logo, faqs } = body;

        if (!name) return NextResponse.json({ success: false, error: 'Builder name is required' }, { status: 400 });

        const current = await findOneByAnyId('categories', id);
        if (!current) return NextResponse.json({ success: false, error: 'Builder not found' }, { status: 404 });

        const builderSlug = slug || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

        const categories = await col('categories');
        const duplicate = await categories.findOne(
            { slug: builderSlug, _id: { $ne: current._id } },
            { projection: { _id: 1 } },
        );
        if (duplicate) return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 });

        await updateByAnyId('categories', id, {
            name,
            slug: builderSlug,
            title: title || '',
            description: description || '',
            content: content || '',
            heroImage: heroImage || '',
            mobileBanner: mobileBanner || '',
            logo: logo || '',
            faqs: Array.isArray(faqs) ? faqs.filter(f => f.question || f.answer) : [],
            updatedAt: nowIso(),
        });

        return NextResponse.json({ success: true, message: 'Builder updated successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const guard = await requirePermission(request, 'builders', 'delete');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const row = await findOneByAnyId('categories', id);
        if (!row) return NextResponse.json({ success: false, error: 'Builder not found' }, { status: 404 });
        const images = [row.heroImage, row.mobileBanner, row.logo].filter(Boolean);
        await Promise.all(images.map(u =>
            deleteFromS3(u).catch(e => console.error('[builder] S3 delete failed:', u, e.message))
        ));
        await deleteByAnyId('categories', id);
        return NextResponse.json({ success: true, message: 'Builder deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
