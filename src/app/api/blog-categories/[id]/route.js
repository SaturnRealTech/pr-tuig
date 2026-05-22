import { NextResponse } from 'next/server';
import { col, findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

export async function GET(_request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('blogCategories', id);
        if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            name, slug, description, content,
            metaTitle, metaDescription, keywords,
            heroImage, heroImageAlt, mobileBanner, mobileBannerAlt,
        } = body;

        if (!name || !slug) {
            return NextResponse.json({ success: false, error: 'Name and slug are required' }, { status: 400 });
        }

        const current = await findOneByAnyId('blogCategories', id);
        if (!current) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }

        const blogCats = await col('blogCategories');
        const duplicate = await blogCats.findOne({ slug, _id: { $ne: current._id } }, { projection: { _id: 1 } });
        if (duplicate) {
            return NextResponse.json({ success: false, error: 'Another blog category with this slug already exists' }, { status: 400 });
        }

        await updateByAnyId('blogCategories', id, {
            name: name.trim(),
            slug: slug.trim(),
            description: description?.trim() || '',
            content: content || '',
            metaTitle: metaTitle?.trim() || '',
            metaDescription: metaDescription?.trim() || '',
            keywords: keywords?.trim() || '',
            heroImage: heroImage || '',
            heroImageAlt: heroImageAlt?.trim() || '',
            mobileBanner: mobileBanner || '',
            mobileBannerAlt: mobileBannerAlt?.trim() || '',
            updatedAt: nowIso(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { id } = await params;
        await deleteByAnyId('blogCategories', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
