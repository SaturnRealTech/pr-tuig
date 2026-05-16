import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const limit = parseInt(searchParams.get('limit') || '100');

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const query = { type: 'lead' };
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } },
                { project: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await db.collection('leads').countDocuments(query);
        const data = await db.collection('leads').find(query).sort({ submittedAt: -1 }).limit(limit).toArray();

        return NextResponse.json({ success: true, data, total });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const lead = {
            ...body,
            type: 'lead',
            status: 'new',
            submittedAt: new Date(),
        };

        const result = await db.collection('leads').insertOne(lead);
        return NextResponse.json({ success: true, data: { _id: result.insertedId } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
