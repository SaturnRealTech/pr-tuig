import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

export async function GET(_request, { params }) {
    try {
        const { id } = await params;
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const category = await db.collection('blogCategories').findOne({ _id: new ObjectId(id) });
        if (!category) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: category });
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

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const duplicate = await db.collection('blogCategories').findOne({
            slug,
            _id: { $ne: new ObjectId(id) },
        });
        if (duplicate) {
            return NextResponse.json({ success: false, error: 'Another blog category with this slug already exists' }, { status: 400 });
        }

        await db.collection('blogCategories').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
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
                    updatedAt: new Date(),
                },
            }
        );

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
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        await db.collection('blogCategories').deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
