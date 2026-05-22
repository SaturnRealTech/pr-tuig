import { NextResponse } from 'next/server';
import { col, nowIso } from '@/lib/db';

export async function GET() {
    try {
        const blogCats = await col('blogCategories');
        const rows = await blogCats
            .find({})
            .collation({ locale: 'en', strength: 2 })
            .sort({ name: 1 })
            .toArray();
        return NextResponse.json({ success: true, data: rows });
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

        const blogCats = await col('blogCategories');
        const existing = await blogCats.findOne({ slug }, { projection: { _id: 1 } });
        if (existing) {
            return NextResponse.json({ success: false, error: 'A blog category with this slug already exists' }, { status: 400 });
        }

        const doc = {
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
            createdAt: nowIso(),
        };
        const result = await blogCats.insertOne(doc);
        const row = await blogCats.findOne({ _id: result.insertedId });
        return NextResponse.json({ success: true, data: row }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
