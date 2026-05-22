import { NextResponse } from 'next/server';
import { col, findOneByAnyId, nowIso } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';
import { deleteFromS3 } from '@/lib/s3-upload';

// GET - Fetch all categories or by slug
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        const categories = await col('categories');
        const filter = slug ? { slug } : {};
        const rows = await categories
            .find(filter)
            .collation({ locale: 'en', strength: 2 })
            .sort({ name: 1 })
            .toArray();

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST - Create new category or group
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            name, slug, title, description, content,
            metaTitle, metaDescription, keywords,
            heroImage, heroImageAlt, mobileBanner, mobileBannerAlt, logo,
            groupId, faqs,
            type: bodyType,
        } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
        }
        const now = nowIso();
        const categories = await col('categories');

        // ── Group ────────────────────────────────────────────────────────────
        if (bodyType === 'group') {
            const existing = await categories.findOne({ name, type: 'group' }, { projection: { _id: 1 } });
            if (existing) {
                return NextResponse.json({ success: false, error: 'Group already exists' }, { status: 400 });
            }
            const doc = { name, type: 'group', createdAt: now, updatedAt: now };
            const result = await categories.insertOne(doc);
            return NextResponse.json({ success: true, data: { _id: result.insertedId, ...doc } }, { status: 201 });
        }

        // ── Category ─────────────────────────────────────────────────────────
        const categorySlug = slug || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

        const existing = await categories.findOne(
            { $or: [{ name, type: { $ne: 'group' } }, { slug: categorySlug }] },
            { projection: { _id: 1 } },
        );
        if (existing) {
            return NextResponse.json({ success: false, error: 'Category name or slug already exists' }, { status: 400 });
        }

        const category = {
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
            groupId: groupId || null,
            type: 'category',
            createdAt: now,
            updatedAt: now,
            count: 0,
        };
        const result = await categories.insertOne(category);
        return NextResponse.json({ success: true, data: { _id: result.insertedId, ...category } }, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete category (also promotes its children to top-level)
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ success: false, error: 'Category ID is required' }, { status: 400 });
        }

        const categories = await col('categories');
        const target = await findOneByAnyId('categories', id, { withSlug: false });
        if (!target) {
            return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
        }

        const images = [target.heroImage, target.mobileBanner, target.logo].filter(Boolean);
        await Promise.all(images.map(u =>
            deleteFromS3(u).catch(e => console.error('[category] S3 delete failed:', u, e.message))
        ));

        const targetKey = String(target._id);
        await categories.updateMany(
            { parentId: targetKey },
            { $set: { parentId: null, type: 'parent' } },
        );
        await categories.deleteOne({ _id: target._id });
        return NextResponse.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
