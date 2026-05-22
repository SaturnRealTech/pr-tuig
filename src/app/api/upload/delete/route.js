import { NextResponse } from 'next/server';
import { deleteFromS3 } from '@/lib/s3-upload';
import { requirePermission } from '@/lib/authHelper';

// DELETE - Delete file from S3
export async function DELETE(request) {
    const guard = await requirePermission(request, 'media', 'delete');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { success: false, error: 'File URL is required' },
                { status: 400 }
            );
        }

        await deleteFromS3(url);

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
        });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
