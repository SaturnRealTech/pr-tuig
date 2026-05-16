import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Get single career
export async function GET(request, { params }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { id } = await params;

        const career = await db.collection('careers').findOne({
            _id: new ObjectId(id)
        });

        if (!career) {
            return NextResponse.json(
                { success: false, error: 'Job position not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: career });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update career
export async function PUT(request, { params }) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { id } = await params;
        const body = await request.json();

        const result = await db.collection('careers').updateOne(
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
                { success: false, error: 'Job position not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Job position updated successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete single career
export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const { id } = await params;

        const result = await db.collection('careers').deleteOne({
            _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Job position not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Job position deleted successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
