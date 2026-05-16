import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

function getUploadRoot() {
    if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
    return path.join(process.cwd(), 'uploads');
}

const MIME_TYPES = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
    avif: 'image/avif', ico: 'image/x-icon',
};

export async function GET(request, { params }) {
    const { path: segments } = await params;
    const relativePath = segments.join('/');

    // Prevent directory traversal
    const uploadRoot = getUploadRoot();
    const filePath = path.resolve(uploadRoot, relativePath);
    if (!filePath.startsWith(path.resolve(uploadRoot))) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    if (!existsSync(filePath)) {
        return new NextResponse('Not Found', { status: 404 });
    }

    const ext = filePath.split('.').pop().toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    });
}
