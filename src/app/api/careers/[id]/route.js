import { NextResponse } from 'next/server';
import { findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('careers', id, { withSlug: false });
        if (!row) {
            return NextResponse.json({ success: false, error: 'Job position not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const guard = await requirePermission(request, 'careers', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const body = await request.json();
        const updateData = { ...body, updatedAt: nowIso() };
        delete updateData.id;
        delete updateData._id;
        Object.keys(updateData).forEach(k => { if (updateData[k] === undefined) delete updateData[k]; });
        const changes = await updateByAnyId('careers', id, updateData);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Job position not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Job position updated successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const guard = await requirePermission(request, 'careers', 'delete');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const changes = await deleteByAnyId('careers', id);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Job position not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Job position deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
