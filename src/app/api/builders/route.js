import { NextResponse } from 'next/server';
import { col, nowIso } from '@/lib/db';

async function getBuilderGroupId(categories) {
    const group = await categories.findOne(
        { type: 'group', name: { $regex: /^builder$/i } },
        { projection: { _id: 1 } },
    );
    return group?._id || null;
}

export async function GET() {
    try {
        const categories = await col('categories');
        const groupId = await getBuilderGroupId(categories);
        if (!groupId) return NextResponse.json({ success: true, data: [] });

        const rows = await categories
            .find({ groupId: String(groupId), type: { $ne: 'group' } })
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
        const { name, slug, title, description, content, heroImage, mobileBanner, logo, faqs } = body;

        if (!name) {
            return NextResponse.json({ success: false, error: 'Builder name is required' }, { status: 400 });
        }
        const now = nowIso();
        const categories = await col('categories');

        let groupId = await getBuilderGroupId(categories);
        if (!groupId) {
            const groupResult = await categories.insertOne({ name: 'Builder', type: 'group', createdAt: now, updatedAt: now });
            groupId = groupResult.insertedId;
        }
        const groupIdStr = String(groupId);

        const builderSlug = slug || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

        const existing = await categories.findOne(
            { $or: [{ name, groupId: groupIdStr }, { slug: builderSlug }] },
            { projection: { _id: 1 } },
        );
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
            groupId: groupIdStr,
            type: 'category',
            createdAt: now,
            updatedAt: now,
        };
        const result = await categories.insertOne(doc);
        return NextResponse.json({ success: true, data: { _id: String(result.insertedId), ...doc } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
