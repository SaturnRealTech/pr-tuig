import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// On production set UPLOAD_DIR to an absolute path outside the project
// e.g. /var/uploads/saturnrealcon
// On local dev it defaults to <project_root>/uploads (gitignored)
function getUploadRoot() {
    if (process.env.UPLOAD_DIR) return process.env.UPLOAD_DIR;
    return path.join(process.cwd(), 'uploads');
}

export async function uploadToS3(file, folder = 'uploads', fileName = null, fileType = 'image/jpeg') {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = fileName ? fileName.split('.').pop() : (fileType.split('/')[1] || 'jpg');
    const finalFileName = `${timestamp}-${randomString}.${ext}`;

    const uploadDir = path.join(getUploadRoot(), folder);
    if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, finalFileName);
    await writeFile(filePath, file);

    const url = `/api/files/${folder}/${finalFileName}`;
    console.log('✅ File saved:', filePath);
    return url;
}

export async function uploadMultipleToS3(files, folder = 'uploads') {
    return Promise.all(
        files.map(file => uploadToS3(file.buffer, folder, file.name, file.type))
    );
}

export async function deleteFromS3(fileUrl) {
    if (!fileUrl) return true;

    // Strip domain for absolute URLs (e.g. https://example.com/api/files/...)
    let pathname = fileUrl;
    try {
        const parsed = new URL(fileUrl);
        pathname = parsed.pathname;
    } catch {
        // relative path — use as-is
    }

    // Skip external images that aren't served from this server
    if (!pathname.startsWith('/api/files/') && !pathname.startsWith('/images/')) {
        console.log('⚠️ External image, skipping local delete:', fileUrl);
        return true;
    }

    const relativePath = pathname.startsWith('/api/files/')
        ? pathname.replace('/api/files/', '')
        : pathname.replace('/images/', '');

    const filePath = path.join(getUploadRoot(), relativePath);
    try {
        await unlink(filePath);
        console.log('✅ File deleted:', filePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') return true; // already gone
        console.error('❌ Error deleting file:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}
