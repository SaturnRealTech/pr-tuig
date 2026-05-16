import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { requireAdmin } from '@/lib/authHelper';

// GET - Fetch all users
export async function GET(request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        const users = await db
            .collection('users')
            .find({})
            .project({ password: 0 }) // Exclude password field
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete a user
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const { ObjectId } = require('mongodb');

        const result = await db.collection('users').deleteOne({
            _id: new ObjectId(userId),
        });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
