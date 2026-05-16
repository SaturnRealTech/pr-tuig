import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { searchParams } = new URL(request.url);
        const admin = searchParams.get('admin') === '1';
        const category = searchParams.get('category');
        const status = searchParams.get('status'); // 'draft' | 'published' | '' (all, admin only)

        const query = {};

        // Public pages only see published projects
        if (!admin) {
            query.publishStatus = 'published';
        } else if (status === 'draft' || status === 'published') {
            query.publishStatus = status;
        }

        if (category && category !== 'All') {
            query.category = category;
        }

        const projects = await db
            .collection('projects')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ success: true, data: projects });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const body = await request.json();

        const newProject = {
            ...body,
            publishStatus: body.publishStatus || 'draft',
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await db.collection('projects').insertOne(newProject);

        return NextResponse.json(
            { success: true, data: { _id: result.insertedId, ...newProject } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
