import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST - Increment blog view count
export async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        // Try to find by slug first, then by ID, then by ObjectId
        let query = { slug: id };
        let post = await db.collection('blog_posts').findOne(query);

        if (!post && !isNaN(id)) {
            query = { id: parseInt(id) };
            post = await db.collection('blog_posts').findOne(query);
        }

        if (!post && ObjectId.isValid(id)) {
            query = { _id: new ObjectId(id) };
            post = await db.collection('blog_posts').findOne(query);
        }

        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        // Increment view count
        await db.collection('blog_posts').updateOne(
            query,
            { $inc: { views: 1 } }
        );

        const updatedViews = (post.views || 0) + 1;

        return NextResponse.json({
            success: true,
            views: updatedViews
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
