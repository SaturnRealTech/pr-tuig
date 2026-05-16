import { NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3-upload';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('resume');

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type (PDF, DOC, DOCX)
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Please upload PDF, DOC, or DOCX files only.' },
                { status: 400 }
            );
        }

        // Max file size: 10MB
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'File size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to S3 using the existing utility
        const fileUrl = await uploadToS3(buffer, 'resumes', file.name, file.type);

        return NextResponse.json({
            success: true,
            data: {
                url: fileUrl,
                fileName: file.name
            }
        });
    } catch (error) {
        console.error('Resume upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload resume: ' + error.message },
            { status: 500 }
        );
    }
}

