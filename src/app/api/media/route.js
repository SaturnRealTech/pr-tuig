import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { deleteFromS3 } from '@/lib/s3-upload';
import { requireAdmin } from '@/lib/authHelper';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const folder = searchParams.get('folder') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '60');

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const query = {};
        if (search) query.fileName = { $regex: search, $options: 'i' };
        if (folder) query.folder = folder;

        const total = await db.collection('media').countDocuments(query);
        const items = await db.collection('media')
            .find(query)
            .sort({ uploadedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        return NextResponse.json({ success: true, data: items, total, page, limit });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        const { customName, alt, imageType } = await request.json();

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        await db.collection('media').updateOne(
            { _id: new ObjectId(id) },
            { $set: { customName, alt, imageType, updatedAt: new Date() } }
        );

        return NextResponse.json({ success: true, message: 'Updated' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const media = await db.collection('media').findOne({ _id: new ObjectId(id) });
        if (!media) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

        try { await deleteFromS3(media.url); } catch { }

        await db.collection('media').deleteOne({ _id: new ObjectId(id) });

        return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
