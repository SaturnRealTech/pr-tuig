import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Fetch all categories or by slug
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');

        const query = {};
        if (slug) query.slug = slug;

        const categories = await db
            .collection('categories')
            .find(query)
            .sort({ name: 1 })
            .toArray();

        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
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
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        // ── Group: just a name, no slug ──────────────────────────────────────
        if (bodyType === 'group') {
            const existing = await db.collection('categories').findOne({ name, type: 'group' });
            if (existing) {
                return NextResponse.json({ success: false, error: 'Group already exists' }, { status: 400 });
            }
            const group = { name, type: 'group', createdAt: new Date(), updatedAt: new Date() };
            const result = await db.collection('categories').insertOne(group);
            return NextResponse.json({ success: true, data: { _id: result.insertedId, ...group } }, { status: 201 });
        }

        // ── Category: has slug, groupId, SEO ─────────────────────────────────
        const categorySlug = slug || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

        const existing = await db.collection('categories').findOne({
            $or: [{ name, type: { $ne: 'group' } }, { slug: categorySlug }],
        });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Category name or slug already exists' }, { status: 400 });
        }

        let resolvedGroupId = null;
        if (groupId && ObjectId.isValid(groupId)) {
            resolvedGroupId = new ObjectId(groupId);
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
            groupId: resolvedGroupId,
            type: 'category',
            createdAt: new Date(),
            updatedAt: new Date(),
            count: 0,
        };

        const result = await db.collection('categories').insertOne(category);
        return NextResponse.json({ success: true, data: { _id: result.insertedId, ...category } }, { status: 201 });
    } catch (error) {
        console.error('Error creating category:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete category (also removes children's parent reference)
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Category ID is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const objectId = new ObjectId(id);

        // Promote children to parent when their parent is deleted
        await db.collection('categories').updateMany(
            { parentId: objectId },
            { $set: { parentId: null, type: 'parent' } }
        );

        const result = await db.collection('categories').deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
