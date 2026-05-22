import { NextResponse } from 'next/server';
import { col, findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { deleteFromS3 } from '@/lib/s3-upload';
import { requireAdmin } from '@/lib/authHelper';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const folder = searchParams.get('folder') || '';
        const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '60', 10), 1), 500);

        const filter = {};
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$or = [{ fileName: re }, { name: re }, { customName: re }];
        }
        if (folder) filter.folder = folder;

        const media = await col('media');
        const [total, items] = await Promise.all([
            media.countDocuments(filter),
            media
                .find(filter)
                .sort({ uploadedAt: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .toArray(),
        ]);

        return NextResponse.json({ success: true, data: items, total, page, limit });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        const { customName, alt, imageType } = await request.json();
        await updateByAnyId('media', id, { customName, alt, imageType, updatedAt: nowIso() });

        return NextResponse.json({ success: true, message: 'Updated' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

        const item = await findOneByAnyId('media', id, { withSlug: false });
        if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

        try { await deleteFromS3(item.url); } catch { /* ignore */ }
        await deleteByAnyId('media', id);

        return NextResponse.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
