import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - Fetch single category
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const category = await db.collection('categories').findOne({
            _id: new ObjectId(id),
        });

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update category
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const {
            name,
            slug,
            title,
            description,
            content,
            metaTitle,
            metaDescription,
            keywords,
            heroImage,
            heroImageAlt,
            mobileBanner,
            mobileBannerAlt,
            logo,
            parentId,
            faqs,
        } = await request.json();

        if (!name) {
            return NextResponse.json(
                { success: false, error: 'Category name is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        // Create slug from name if not provided
        const categorySlug = slug || name.toLowerCase().replace(/\s+/g, '-');

        // Check if another category with same name/slug exists
        const existing = await db.collection('categories').findOne({
            $or: [{ name }, { slug: categorySlug }],
            _id: { $ne: new ObjectId(id) }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Category name or slug already exists' },
                { status: 400 }
            );
        }

        // Resolve parentId to ObjectId or null
        let resolvedParentId = null;
        if (parentId && ObjectId.isValid(parentId)) {
            resolvedParentId = new ObjectId(parentId);
        }

        const updateData = {
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
            parentId: resolvedParentId,
            type: resolvedParentId ? 'child' : 'parent',
            updatedAt: new Date(),
        };

        const result = await db.collection('categories').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Category updated successfully',
        });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
