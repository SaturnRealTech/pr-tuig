import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { DEFAULT_IMAGE_SEO, invalidateImageSeoCache } from '@/lib/imageSeo';
import { requireAdmin } from '@/lib/authHelper';

const TYPE = 'brand';

const CASING_VALUES = new Set(['none', 'lower', 'upper', 'title', 'sentence']);

async function readBlob() {
    const settings = await col('settings');
    const row = await settings.findOne({ type: TYPE });
    return row?.data || {};
}

export async function GET() {
    try {
        const blob = await readBlob();
        const data = { ...DEFAULT_IMAGE_SEO, ...(blob.imageSeo || {}) };
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
        const clean = { ...DEFAULT_IMAGE_SEO };
        for (const k of ['addMissingAlt', 'addMissingTitle', 'addMissingCaption', 'addMissingDescription', 'addAvatarAlt']) {
            if (typeof body[k] === 'boolean') clean[k] = body[k];
        }
        for (const k of ['titleCasing', 'altCasing', 'descriptionCasing', 'captionCasing']) {
            if (CASING_VALUES.has(body[k])) clean[k] = body[k];
        }
        clean.replacements = Array.isArray(body.replacements)
            ? body.replacements
                .filter(r => r && typeof r === 'object')
                .map(r => ({
                    find: String(r.find || ''),
                    replace: String(r.replace || ''),
                    alt: !!r.alt,
                    title: !!r.title,
                    caption: !!r.caption,
                }))
                .filter(r => r.find)
            : [];

        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        blob.imageSeo = clean;

        const now = nowIso();
        const payload = { data: blob, updatedAt: now };
        if (!existing) payload.createdAt = now;
        await upsertByKey('settings', 'type', TYPE, payload);
        invalidateImageSeoCache();

        return NextResponse.json({ success: true, data: clean });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
