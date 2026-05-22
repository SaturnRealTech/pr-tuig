import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { deleteFromS3 } from '@/lib/s3-upload';

export async function POST(request) {
    const guard = await requirePermission(request, 'media', 'delete');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { key } = await request.json();

        if (!key) {
            return NextResponse.json(
                { success: false, error: 'File key is required' },
                { status: 400 }
            );
        }

        await deleteFromS3(key);

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('[DELETE] Error deleting file:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
