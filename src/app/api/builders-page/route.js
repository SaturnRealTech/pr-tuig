import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const doc = await db.collection('pages').findOne({ type: 'builders' });
        return NextResponse.json({ success: true, data: doc || {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        await db.collection('pages').updateOne(
            { type: 'builders' },
            { $set: { type: 'builders', ...body, updatedAt: new Date() } },
            { upsert: true }
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
