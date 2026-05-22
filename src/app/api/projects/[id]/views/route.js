import { NextResponse } from 'next/server';
import { col, findOneByAnyId } from '@/lib/db';

// POST - Increment project view count
export async function POST(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('projects', id);
        if (!row) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }
        const projects = await col('projects');
        await projects.updateOne({ _id: row._id }, { $inc: { views: 1 } });
        return NextResponse.json({ success: true, views: (row.views || 0) + 1 });
    } catch (error) {
        console.error('[POST /api/projects/[id]/views] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
