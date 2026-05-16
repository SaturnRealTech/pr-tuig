import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Get single application
export async function GET(request, { params }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'SaturnRealcon');

        const { id } = await params;

        const application = await db.collection('applications').findOne({
            _id: new ObjectId(id)
        });

        if (!application) {
            return NextResponse.json(
                { success: false, error: 'Application not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: application });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update application status
export async function PUT(request, { params }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'SaturnRealcon');

        const { id } = await params;
        const body = await request.json();

        const result = await db.collection('applications').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...body,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Application not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Application updated successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete single application
export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'SaturnRealcon');

        const { id } = await params;

        const result = await db.collection('applications').deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Application not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Application deleted successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
