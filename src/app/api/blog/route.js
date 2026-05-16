import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET - Fetch all blog posts
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        let query = {};

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }

        const posts = await db
            .collection('blog_posts')
            .find(query)
            .sort({ date: -1 })
            .toArray();

        return NextResponse.json({ success: true, data: posts });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create a new blog post
export async function POST(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const body = await request.json();
        const newPost = {
            ...body,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('blog_posts').insertOne(newPost);

        return NextResponse.json(
            { success: true, data: { _id: result.insertedId, ...newPost } },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
