import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Fetch a single blog post by ID or slug
export async function GET(request, { params }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { id } = await params;

        // Try to find by slug first, then numeric ID, then MongoDB _id
        let post = await db.collection('blog_posts').findOne({ slug: id });

        if (!post) {
            post = await db.collection('blog_posts').findOne({ id: parseInt(id) });
        }

        if (!post && ObjectId.isValid(id)) {
            post = await db.collection('blog_posts').findOne({ _id: new ObjectId(id) });
        }

        if (!post) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: post });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update a blog post
export async function PUT(request, { params }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { id } = await params;
        const body = await request.json();

        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        let result;
        if (ObjectId.isValid(id)) {
            result = await db.collection('blog_posts').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
        } else {
            result = await db.collection('blog_posts').updateOne(
                { id: parseInt(id) },
                { $set: updateData }
            );
        }

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: updateData });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete a blog post
export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { id } = await params;

        // Find the blog post first to get image URLs
        let blog;
        if (ObjectId.isValid(id)) {
            blog = await db.collection('blog_posts').findOne({ _id: new ObjectId(id) });
        } else {
            blog = await db.collection('blog_posts').findOne({ id: parseInt(id) });
        }

        if (!blog) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        // Delete local images if they exist
        const imagesToDelete = [];
        if (blog.heroImage) imagesToDelete.push(blog.heroImage);
        if (blog.image) imagesToDelete.push(blog.image);

        if (imagesToDelete.length > 0) {
            try {
                const deletePromises = imagesToDelete
                    .filter(imageUrl => imageUrl.startsWith('/images/'))
                    .map(async (imageUrl) => {
                        const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/s3-delete`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ key: imageUrl })
                        });
                        return deleteResponse.json();
                    });

                await Promise.all(deletePromises);
            } catch (error) {
                console.error('Error deleting images:', error);
            }
        }

        // Delete the blog post
        let result;
        if (ObjectId.isValid(id)) {
            result = await db.collection('blog_posts').deleteOne({ _id: new ObjectId(id) });
        } else {
            result = await db.collection('blog_posts').deleteOne({ id: parseInt(id) });
        }

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Blog post not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, message: 'Blog post and images deleted' });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
