import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST - Increment category view count
export async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const { slug } = resolvedParams;

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const category = await db.collection('categories').findOne({ slug });

        if (!category) {
            return NextResponse.json(
                { success: false, error: 'Category not found' },
                { status: 404 }
            );
        }

        // Increment view count
        await db.collection('categories').updateOne(
            { slug },
            { $inc: { views: 1 } }
        );

        const updatedViews = (category.views || 0) + 1;

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
