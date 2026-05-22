import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { col, findOneByAnyId, updateByAnyId, nowIso } from '@/lib/db';

// GET - Fetch single category
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('categories', id);
        if (!row) {
            return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT - Update category
export async function PUT(request, { params }) {
    const guard = await requirePermission(request, 'categories', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const {
            name, slug, title, description, content,
            metaTitle, metaDescription, keywords,
            heroImage, heroImageAlt, mobileBanner, mobileBannerAlt, logo,
            parentId, faqs,
        } = await request.json();

        if (!name) {
            return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
        }

        const current = await findOneByAnyId('categories', id);
        if (!current) {
            return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
        }

        const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-');

        const categories = await col('categories');
        const duplicate = await categories.findOne(
            { $or: [{ name }, { slug: categorySlug }], _id: { $ne: current._id } },
            { projection: { _id: 1 } },
        );
        if (duplicate) {
            return NextResponse.json({ success: false, error: 'Category name or slug already exists' }, { status: 400 });
        }

        await updateByAnyId('categories', id, {
            name,
            slug: categorySlug,
            title: title || name,
            description: description || '',
            content: content || '',
            metaTitle: metaTitle || name,
            metaDescription: metaDescription || description || '',
            keywords: keywords || '',
            heroImage: heroImage || '',
            heroImageAlt: heroImageAlt || '',
            mobileBanner: mobileBanner || '',
            mobileBannerAlt: mobileBannerAlt || '',
            logo: logo || '',
            faqs: Array.isArray(faqs) ? faqs.filter(f => f.question || f.answer) : [],
            parentId: parentId || null,
            type: parentId ? 'child' : 'parent',
            updatedAt: nowIso(),
        });

        return NextResponse.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
