import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Fetch a single project by ID
export async function GET(request, { params }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { id } = await params;

        // Try to find by numeric ID first, then by MongoDB _id
        let project = await db.collection('projects').findOne({ id: parseInt(id) });

        if (!project && ObjectId.isValid(id)) {
            project = await db.collection('projects').findOne({ _id: new ObjectId(id) });
        }

        if (!project) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: project });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PATCH - Quick field update (e.g. toggle publishStatus)
export async function PATCH(request, { params }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const { id } = await params;
        const body = await request.json();

        const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id: parseInt(id) };
        await db.collection('projects').updateOne(filter, { $set: { ...body, updatedAt: new Date() } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT - Update a project
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
            result = await db.collection('projects').updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            );
        } else {
            result = await db.collection('projects').updateOne(
                { id: parseInt(id) },
                { $set: updateData }
            );
        }

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Project not found' },
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

// DELETE - Delete a project
export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { id } = await params;

        console.log('[DELETE] Attempting to delete project with id:', id);

        // Find project first to get image URL
        let project;
        if (ObjectId.isValid(id)) {
            project = await db.collection('projects').findOne({ _id: new ObjectId(id) });
        } else {
            project = await db.collection('projects').findOne({ id: parseInt(id) });
        }

        console.log('[DELETE] Project found:', project ? 'Yes' : 'No');

        if (!project) {
            console.log('[DELETE] Project not found in database');
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        // Delete local image if exists
        if (project.image) {
            try {
                const imageUrl = project.image;
                console.log('[DELETE] Project has image:', imageUrl);

                if (imageUrl.startsWith('/images/')) {
                    const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/s3-delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ key: imageUrl })
                    });
                    const deleteResult = await deleteResponse.json();
                    console.log('[DELETE] Image delete result:', deleteResult);
                } else {
                    console.log('[DELETE] Image is not a local file, skipping deletion');
                }
            } catch (deleteError) {
                console.error('[DELETE] Failed to delete image:', deleteError);
            }
        } else {
            console.log('[DELETE] Project has no image to delete');
        }

        // Delete project from database
        let result;
        if (ObjectId.isValid(id)) {
            result = await db.collection('projects').deleteOne({ _id: new ObjectId(id) });
        } else {
            result = await db.collection('projects').deleteOne({ id: parseInt(id) });
        }

        console.log('[DELETE] Delete result:', result);
        console.log('[DELETE] Deleted count:', result.deletedCount);

        if (result.deletedCount === 0) {
            console.log('[DELETE] No documents were deleted');
            return NextResponse.json(
                { success: false, error: 'Project not found' },
                { status: 404 }
            );
        }

        console.log('[DELETE] Project successfully deleted');
        return NextResponse.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        console.error('[DELETE] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
