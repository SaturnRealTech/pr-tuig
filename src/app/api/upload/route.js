import { NextResponse } from 'next/server';
import { uploadToS3, uploadMultipleToS3, deleteFromS3 } from '@/lib/s3-upload';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import sharp from 'sharp';

// POST - Upload single or multiple images with metadata
export async function POST(request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files');
        const folder = formData.get('folder') || 'uploads';

        // Per-file metadata (JSON string arrays sent alongside files)
        const namesRaw = formData.get('names');
        const altsRaw = formData.get('alts');
        const typesRaw = formData.get('types');

        const names = namesRaw ? JSON.parse(namesRaw) : [];
        const alts = altsRaw ? JSON.parse(altsRaw) : [];
        const types = typesRaw ? JSON.parse(typesRaw) : [];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
        }

        // Process files: read buffer + get image dimensions
        const fileBuffers = await Promise.all(
            files.map(async (file, i) => {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                let width = null, height = null;
                try {
                    const meta = await sharp(buffer).metadata();
                    width = meta.width || null;
                    height = meta.height || null;
                } catch { }

                const baseName = file.name.replace(/\.[^.]+$/, '');
                const autoAlt = baseName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
                    .replace(/\b\w/g, c => c.toUpperCase());
                return {
                    buffer,
                    type: file.type,
                    name: file.name,
                    size: file.size,
                    width,
                    height,
                    customName: names[i] || baseName,
                    alt: alts[i] || autoAlt,
                    imageType: types[i] || 'gallery',
                };
            })
        );

        // Upload files to local storage
        let urls;
        if (fileBuffers.length === 1) {
            const fb = fileBuffers[0];
            urls = [await uploadToS3(fb.buffer, folder, fb.name, fb.type)];
        } else {
            urls = await uploadMultipleToS3(
                fileBuffers.map(fb => ({ buffer: fb.buffer, type: fb.type, name: fb.name })),
                folder
            );
        }

        // Save to media library with full metadata
        try {
            const client = await clientPromise;
            const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

            const replaceId = formData.get('replaceId');

            if (replaceId && ObjectId.isValid(replaceId)) {
                // Replace mode: delete old file, update existing record
                const existing = await db.collection('media').findOne({ _id: new ObjectId(replaceId) });
                if (existing?.url) {
                    try { await deleteFromS3(existing.url); } catch { }
                }
                const fb = fileBuffers[0];
                await db.collection('media').updateOne(
                    { _id: new ObjectId(replaceId) },
                    {
                        $set: {
                            url: urls[0],
                            fileName: fb.name,
                            mimeType: fb.type,
                            size: fb.size,
                            width: fb.width,
                            height: fb.height,
                            updatedAt: new Date(),
                        },
                    }
                );
            } else {
                // Normal upload: insert new records
                const mediaRecords = urls.map((url, i) => ({
                    url,
                    fileName: fileBuffers[i]?.name || url.split('/').pop(),
                    customName: fileBuffers[i]?.customName || '',
                    alt: fileBuffers[i]?.alt || '',
                    imageType: fileBuffers[i]?.imageType || 'gallery',
                    folder,
                    mimeType: fileBuffers[i]?.type || 'image/jpeg',
                    size: fileBuffers[i]?.size || 0,
                    width: fileBuffers[i]?.width || null,
                    height: fileBuffers[i]?.height || null,
                    uploadedAt: new Date(),
                }));
                await db.collection('media').insertMany(mediaRecords);
            }
        } catch (dbErr) {
            console.error('[UPLOAD] Failed to save to media library:', dbErr.message);
        }

        return NextResponse.json({ success: true, urls, count: urls.length }, { status: 200 });

    } catch (error) {
        console.error('[UPLOAD] Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Image Upload API — POST with FormData (files, folder, names, alts, types)' });
}
