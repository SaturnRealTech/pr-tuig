import { NextResponse } from 'next/server';
import { col, findOneByAnyId } from '@/lib/db';

// POST - Increment blog view count
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('blog_posts', id);
        if (!row) {
            return NextResponse.json({ success: false, error: 'Blog post not found' }, { status: 404 });
        }
        const blogPosts = await col('blog_posts');
        await blogPosts.updateOne({ _id: row._id }, { $inc: { views: 1 } });
        return NextResponse.json({ success: true, views: (row.views || 0) + 1 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
