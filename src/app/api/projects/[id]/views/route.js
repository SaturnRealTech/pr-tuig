import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// POST - Increment project view count
export async function POST(request, { params }) {
    try {
        const resolvedParams = await params;
        const { id } = resolvedParams;

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        // Try to find by _id (ObjectId) or by numeric id
        let query;
        let project;

        if (ObjectId.isValid(id)) {
            query = { _id: new ObjectId(id) };
            project = await db.collection('projects').findOne(query);
        }

        if (!project && !isNaN(id)) {
            query = { id: parseInt(id) };
            project = await db.collection('projects').findOne(query);
        }

        if (!project) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        // Increment view count
        await db.collection('projects').updateOne(
            query,
            { $inc: { views: 1 } }
        );

        const updatedViews = (project.views || 0) + 1;

        return NextResponse.json({
            success: true,
            views: updatedViews
        });
    } catch (error) {
        console.error('[POST /api/projects/[id]/views] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
