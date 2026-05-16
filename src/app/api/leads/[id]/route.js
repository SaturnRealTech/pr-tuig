import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        await db.collection('leads').updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...body, updatedAt: new Date() } }
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

        await db.collection('leads').deleteOne({ _id: new ObjectId(id) });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
