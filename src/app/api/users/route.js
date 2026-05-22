import { NextResponse } from 'next/server';
import { col, deleteByAnyId } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';

// GET - Fetch all users (excluding password)
export async function GET() {
    try {
        const users = await col('users');
        const rows = await users
            .find({})
            .project({ password: 0 })
            .sort({ createdAt: -1 })
            .toArray();
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete a user
export async function DELETE(request) {
    const guard = await requirePermission(request, 'users', 'delete');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');
        if (!userId) {
            return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
        }
        const changes = await deleteByAnyId('users', userId);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
