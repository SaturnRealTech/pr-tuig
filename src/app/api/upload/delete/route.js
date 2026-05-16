import { NextResponse } from 'next/server';
import { deleteFromS3 } from '@/lib/s3-upload';
import { requireAdmin } from '@/lib/authHelper';

// DELETE - Delete file from S3
export async function DELETE(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
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
