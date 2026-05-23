import { NextResponse } from 'next/server';
import { updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requireAdminOnly } from '@/lib/authHelper';

export async function PATCH(request, { params }) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const body = await request.json();
        const updateData = { ...body, updatedAt: nowIso() };
        delete updateData.id;
        Object.keys(updateData).forEach(k => { if (updateData[k] === undefined) delete updateData[k]; });
        await updateByAnyId('leads', id, updateData);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        await deleteByAnyId('leads', id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
