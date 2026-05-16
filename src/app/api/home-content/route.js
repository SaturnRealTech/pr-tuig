import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

async function getDb() {
    const client = await clientPromise;
    return client.db(process.env.DB_NAME || 'Saturnrealcon');
}

export async function GET() {
    try {
        const db = await getDb();
        const doc = await db.collection('homepage').findOne({});
        return NextResponse.json({
            success: true,
            data: {
                homeWriteupTitle: doc?.homeWriteupTitle || '',
                homeWriteup: doc?.homeWriteup || '',
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { homeWriteupTitle, homeWriteup } = await request.json();
        const db = await getDb();

        await db.collection('homepage').updateOne(
            {},
            { $set: { homeWriteupTitle: homeWriteupTitle || '', homeWriteup: homeWriteup || '', updatedAt: new Date() } },
            { upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
