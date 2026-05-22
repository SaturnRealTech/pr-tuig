import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { DEFAULT_VIDEO_SITEMAP, POST_TYPES } from '@/lib/videoSitemap';
import { requireAdmin } from '@/lib/authHelper';

const TYPE = 'brand';
const TYPE_IDS = new Set(POST_TYPES.map(t => t.id));

async function readBlob() {
    const settings = await col('settings');
    const row = await settings.findOne({ type: TYPE });
    return row?.data || {};
}

export async function GET() {
    try {
        const blob = await readBlob();
        const stored = blob.videoSitemap || {};
        const data = {
            ...DEFAULT_VIDEO_SITEMAP,
            ...stored,
            postTypes: { ...DEFAULT_VIDEO_SITEMAP.postTypes, ...(stored.postTypes || {}) },
            customFields: Array.isArray(stored.customFields) ? stored.customFields : [],
        };
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    try {
        const body = await request.json();
        const clean = { ...DEFAULT_VIDEO_SITEMAP };

        clean.hideSitemap = !!body.hideSitemap;
        clean.youtubeApiKey = String(body.youtubeApiKey || '').trim();

        clean.postTypes = { ...DEFAULT_VIDEO_SITEMAP.postTypes };
        if (body.postTypes && typeof body.postTypes === 'object') {
            for (const id of TYPE_IDS) clean.postTypes[id] = !!body.postTypes[id];
        }

        clean.customFields = Array.isArray(body.customFields)
            ? body.customFields.map(s => String(s || '').trim()).filter(Boolean)
            : [];

        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        blob.videoSitemap = clean;

        const now = nowIso();
        const payload = { data: blob, updatedAt: now };
        if (!existing) payload.createdAt = now;
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true, data: clean });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
