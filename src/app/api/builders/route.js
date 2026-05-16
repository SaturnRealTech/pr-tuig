import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

async function getBuilderGroupId(db) {
    const group = await db.collection('categories').findOne({ type: 'group', name: { $regex: /^builder$/i } });
    return group?._id || null;
}

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const groupId = await getBuilderGroupId(db);
        if (!groupId) return NextResponse.json({ success: true, data: [] });

        const builders = await db
            .collection('categories')
            .find({ groupId, type: { $ne: 'group' } })
            .sort({ name: 1 })
            .toArray();

        return NextResponse.json({ success: true, data: builders });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, slug, title, description, content, heroImage, mobileBanner, logo, faqs } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Builder name is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        let groupId = await getBuilderGroupId(db);
        if (!groupId) {
            const result = await db.collection('categories').insertOne({
                name: 'Builder', type: 'group', createdAt: new Date(), updatedAt: new Date(),
            });
            groupId = result.insertedId;
        }

        const builderSlug = slug || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

        const existing = await db.collection('categories').findOne({
            $or: [{ name, groupId }, { slug: builderSlug }],
        });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Builder name or slug already exists' }, { status: 400 });
        }

        const doc = {
            name,
            slug: builderSlug,
            title: title || '',
            description: description || '',
            content: content || '',
            heroImage: heroImage || '',
            mobileBanner: mobileBanner || '',
            logo: logo || '',
            faqs: Array.isArray(faqs) ? faqs.filter(f => f.question || f.answer) : [],
            groupId,
            type: 'category',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('categories').insertOne(doc);
        return NextResponse.json({ success: true, data: { _id: result.insertedId, ...doc } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
