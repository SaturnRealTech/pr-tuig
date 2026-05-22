import { NextResponse } from 'next/server';
import { findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';
import { deleteFromS3 } from '@/lib/s3-upload';

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('applications', id, { withSlug: false });
        if (!row) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const updateData = { ...body, updatedAt: nowIso() };
        delete updateData.id;
        delete updateData._id;
        Object.keys(updateData).forEach(k => { if (updateData[k] === undefined) delete updateData[k]; });
        const changes = await updateByAnyId('applications', id, updateData);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Application updated successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { id } = await params;
        const row = await findOneByAnyId('applications', id, { withSlug: false });
        if (!row) {
            return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
        }
        if (row.resumeUrl) {
            await deleteFromS3(row.resumeUrl).catch(e => console.error('[application] S3 delete failed:', row.resumeUrl, e.message));
        }
        await deleteByAnyId('applications', id);
        return NextResponse.json({ success: true, message: 'Application deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
