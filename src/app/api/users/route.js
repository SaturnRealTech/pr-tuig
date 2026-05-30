import { NextResponse } from 'next/server';
import { col, deleteByAnyId, findOneByAnyId, updateByAnyId, nowIso } from '@/lib/db';
import { getUserFromRequest, requirePermission } from '@/lib/authHelper';

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

// PATCH - Toggle the `disabled` flag on a user.
// Body: { id: string, disabled: boolean }
export async function PATCH(request) {
    const guard = await requirePermission(request, 'users', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const { id, disabled } = await request.json();
        if (!id || typeof disabled !== 'boolean') {
            return NextResponse.json({ success: false, error: 'id and boolean `disabled` are required' }, { status: 400 });
        }

        // Block the caller from disabling themselves — that would lock them out
        // of the admin and there'd be no easy way back in.
        const caller = getUserFromRequest(request);
        if (caller?.userId && String(caller.userId) === String(id) && disabled === true) {
            return NextResponse.json({ success: false, error: 'You cannot disable your own account.' }, { status: 400 });
        }

        const target = await findOneByAnyId('users', id);
        if (!target) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        await updateByAnyId('users', id, { disabled, updatedAt: nowIso() });
        return NextResponse.json({ success: true, message: disabled ? 'User disabled' : 'User enabled' });
    } catch (error) {
        console.error('Error toggling user disabled:', error);
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
