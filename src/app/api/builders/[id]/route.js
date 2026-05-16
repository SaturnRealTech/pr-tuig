import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const builder = await db.collection('categories').findOne({ _id: new ObjectId(id) });
        if (!builder) return NextResponse.json({ success: false, error: 'Builder not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: builder });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, slug, title, description, content, heroImage, mobileBanner, logo, faqs } = body;

        if (!name) return NextResponse.json({ success: false, error: 'Builder name is required' }, { status: 400 });

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const builderSlug = slug || name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

        const existing = await db.collection('categories').findOne({
            $or: [{ slug: builderSlug }],
            _id: { $ne: new ObjectId(id) },
        });
        if (existing) return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 });

        await db.collection('categories').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name,
                    slug: builderSlug,
                    title: title || '',
                    description: description || '',
                    content: content || '',
                    heroImage: heroImage || '',
                    mobileBanner: mobileBanner || '',
                    logo: logo || '',
                    faqs: Array.isArray(faqs) ? faqs.filter(f => f.question || f.answer) : [],
                    updatedAt: new Date(),
                },
            }
        );

        return NextResponse.json({ success: true, message: 'Builder updated successfully' });
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
        const result = await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return NextResponse.json({ success: false, error: 'Builder not found' }, { status: 404 });
        return NextResponse.json({ success: true, message: 'Builder deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
