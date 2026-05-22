import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { collectSitemapItems, readSitemapSettings, GROUP_KEYS } from '@/lib/sitemap';
import { requirePermission } from '@/lib/authHelper';

const TYPE = 'brand';

export async function GET() {
    try {
        const settings = await readSitemapSettings();
        const items = await collectSitemapItems();
        return NextResponse.json({ success: true, data: { items, excludes: settings.excludes } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json();
        const incoming = body.excludes || {};
        const clean = {};
        for (const k of GROUP_KEYS) {
            const arr = Array.isArray(incoming[k]) ? incoming[k] : [];
            clean[k] = [...new Set(arr.map(s => String(s)).filter(Boolean))];
        }

        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        blob.sitemap = { excludes: clean };

        const now = nowIso();
        const payload = { data: blob, updatedAt: now };
        if (!existing) payload.createdAt = now;
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true, data: { excludes: clean } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
