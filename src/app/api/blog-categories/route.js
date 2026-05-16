import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const categories = await db
            .collection('blogCategories')
            .find({})
            .sort({ name: 1 })
            .toArray();
        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
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

        const existing = await db.collection('blogCategories').findOne({ slug });
        if (existing) {
            return NextResponse.json({ success: false, error: 'A blog category with this slug already exists' }, { status: 400 });
        }

        const result = await db.collection('blogCategories').insertOne({
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
            createdAt: new Date(),
        });

        return NextResponse.json({ success: true, data: { _id: result.insertedId } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
