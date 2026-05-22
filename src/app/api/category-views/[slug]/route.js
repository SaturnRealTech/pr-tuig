import { NextResponse } from 'next/server';
import { col } from '@/lib/db';

// POST - Increment category view count
export async function POST(request, { params }) {
    try {
        const { slug } = await params;
        const categories = await col('categories');
        const category = await categories.findOne({ slug });
        if (!category) {
            return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
        }
        await categories.updateOne({ _id: category._id }, { $inc: { views: 1 } });
        return NextResponse.json({ success: true, views: (category.views || 0) + 1 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
