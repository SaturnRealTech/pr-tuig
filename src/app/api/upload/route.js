import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { uploadToS3, uploadMultipleToS3, deleteFromS3 } from '@/lib/s3-upload';
import { col, findOneByAnyId, updateByAnyId, nowIso } from '@/lib/db';
import sharp from 'sharp';

// POST - Upload single or multiple images with metadata
export async function POST(request) {
    const guard = await requirePermission(request, 'media', 'create');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const formData = await request.formData();
        const files = formData.getAll('files');
        const folder = formData.get('folder') || 'uploads';

        const namesRaw = formData.get('names');
        const altsRaw = formData.get('alts');
        const typesRaw = formData.get('types');

        const names = namesRaw ? JSON.parse(namesRaw) : [];
        const alts = altsRaw ? JSON.parse(altsRaw) : [];
        const types = typesRaw ? JSON.parse(typesRaw) : [];

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
        }

        const fileBuffers = await Promise.all(
            files.map(async (file, i) => {
                const bytes = await file.arrayBuffer();
                const buffer = Buffer.from(bytes);

                let width = null, height = null;
                try {
                    const meta = await sharp(buffer).metadata();
                    width = meta.width || null;
                    height = meta.height || null;
                } catch { /* ignore */ }

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

        try {
            const replaceId = formData.get('replaceId');
            const now = nowIso();
            const media = await col('media');

            if (replaceId) {
                const existing = await findOneByAnyId('media', replaceId, { withSlug: false });
                if (existing?.url) {
                    try { await deleteFromS3(existing.url); } catch { /* ignore */ }
                }
                const fb = fileBuffers[0];
                await updateByAnyId('media', replaceId, {
                    url: urls[0],
                    fileName: fb.name,
                    mimeType: fb.type,
                    size: fb.size,
                    width: fb.width,
                    height: fb.height,
                    updatedAt: now,
                });
            } else {
                const docs = urls.map((url, i) => {
                    const fb = fileBuffers[i] || {};
                    return {
                        url,
                        fileName: fb.name || url.split('/').pop(),
                        customName: fb.customName || '',
                        alt: fb.alt || '',
                        imageType: fb.imageType || 'gallery',
                        folder,
                        mimeType: fb.type || 'image/jpeg',
                        size: fb.size || 0,
                        width: fb.width || null,
                        height: fb.height || null,
                        uploadedAt: now,
                        createdAt: now,
                    };
                });
                if (docs.length) await media.insertMany(docs, { ordered: false });
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
