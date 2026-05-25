import { S3Client, DeleteObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const REGION = process.env.AWS_REGION;
const BUCKET = process.env.AWS_BUCKET_NAME;
const KEY_PREFIX = ('tuig').replace(/^\/+|\/+$/g, '');

if (!REGION || !BUCKET) {
    console.warn('[s3] AWS_REGION or AWS_BUCKET_NAME not set — uploads will fail.');
}

// Reuse the client across hot reloads.
const cacheKey = '__saturn_s3_client__';
function getClient() {
    if (!globalThis[cacheKey]) {
        globalThis[cacheKey] = new S3Client({
            region: REGION,
            credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
                ? {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                }
                : undefined,
        });
    }
    return globalThis[cacheKey];
}

// Public URL helper. Uses path-style as a fallback; switch to a custom CDN
// host by setting S3_PUBLIC_BASE_URL.
function publicUrlFor(key) {
    const custom = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, '');
    if (custom) return `${custom}/${key}`;
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

function sanitiseSegment(s) {
    return String(s || '')
        .replace(/[^A-Za-z0-9._/-]+/g, '-')
        .replace(/^\/+|\/+$/g, '')
        .replace(/-+/g, '-');
}

function buildKey(folder, fileName, fileType) {
    const timestamp = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const ext = (fileName && fileName.includes('.')
        ? fileName.split('.').pop()
        : (fileType && fileType.split('/')[1])) || 'bin';
    const safeFolder = sanitiseSegment(folder || 'uploads');
    return `${KEY_PREFIX}/${safeFolder}/${timestamp}-${rand}.${ext.toLowerCase()}`;
}

// Core upload. Accepts a Buffer / Uint8Array / Stream and returns the public
// URL. Uses lib-storage's `Upload` so it handles big files (>5MB) via
// multipart automatically.
export async function uploadToS3(file, folder = 'uploads', fileName = null, fileType = 'image/jpeg') {
    if (!BUCKET) throw new Error('AWS_BUCKET_NAME is not set');
    const Key = buildKey(folder, fileName, fileType);

    const uploader = new Upload({
        client: getClient(),
        params: {
            Bucket: BUCKET,
            Key,
            Body: file,
            ContentType: fileType || 'application/octet-stream',
            CacheControl: 'public, max-age=31536000, immutable',
        },
    });

    await uploader.done();
    const url = publicUrlFor(Key);
    console.log('✅ S3 upload:', Key);
    return url;
}

export async function uploadMultipleToS3(files, folder = 'uploads') {
    return Promise.all(
        files.map(f => uploadToS3(f.buffer, folder, f.name, f.type))
    );
}

// Extract the S3 object key from any of the URL shapes we might be given:
//   - absolute S3 URL: https://<bucket>.s3.<region>.amazonaws.com/tuig/foo/x.jpg
//   - custom CDN URL:  https://cdn.example.com/tuig/foo/x.jpg  (when S3_PUBLIC_BASE_URL is set)
//   - legacy local path: /api/files/uploads/x.jpg or /images/uploads/x.jpg
//   - bare key:        tuig/foo/x.jpg or foo/x.jpg
function extractKey(input) {
    if (!input) return null;
    const s = String(input).trim();
    if (!s) return null;

    // Absolute URL?
    if (/^https?:\/\//i.test(s)) {
        try {
            const u = new URL(s);
            const path = u.pathname.replace(/^\/+/, '');
            // Strip the bucket name if the URL was path-style with the bucket in the path.
            if (path.startsWith(BUCKET + '/')) return path.slice(BUCKET.length + 1);
            return path;
        } catch { return null; }
    }

    // Legacy disk-style paths used by the old uploader.
    if (s.startsWith('/api/files/')) {
        const rest = s.replace('/api/files/', '');
        // Prefix with KEY_PREFIX so old DB rows still resolve to bucket keys.
        return rest.startsWith(KEY_PREFIX + '/') ? rest : `${KEY_PREFIX}/${rest}`;
    }
    if (s.startsWith('/images/')) {
        const rest = s.replace('/images/', '');
        return rest.startsWith(KEY_PREFIX + '/') ? rest : `${KEY_PREFIX}/${rest}`;
    }

    // Already a bare key.
    return s.replace(/^\/+/, '');
}

export async function deleteFromS3(input) {
    if (!input || !BUCKET) return true;
    const Key = extractKey(input);
    if (!Key) {
        console.log('⚠️ Could not parse S3 key, skipping delete:', input);
        return true;
    }

    try {
        await getClient().send(new DeleteObjectCommand({ Bucket: BUCKET, Key }));
        console.log('✅ S3 delete:', Key);
        return true;
    } catch (error) {
        // 404 / NoSuchKey is fine — object already gone.
        if (error.$metadata?.httpStatusCode === 404 || error.Code === 'NoSuchKey') return true;
        console.error('❌ S3 delete failed:', error.message);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
}

// One-shot smoke test — verifies credentials + bucket access. Not used at
// runtime, but handy from a script: `node -e 'require("@/lib/s3-upload").pingS3()'`
export async function pingS3() {
    if (!BUCKET) throw new Error('AWS_BUCKET_NAME is not set');
    await getClient().send(new HeadBucketCommand({ Bucket: BUCKET }));
    return { ok: true, bucket: BUCKET, region: REGION, prefix: KEY_PREFIX };
}
