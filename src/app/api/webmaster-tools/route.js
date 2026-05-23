// GET  /api/webmaster-tools  — read verification IDs + custom <meta> tags
// PUT  /api/webmaster-tools  — admin save
//
// Storage: settings.brand.data.webmasterTools (alongside titlesMeta).

import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { readWebmasterTools, normaliseWebmasterTools } from '@/lib/webmasterTools';

const TYPE = 'brand';

export async function GET() {
    try {
        const data = await readWebmasterTools();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const body = await request.json();
        const clean = normaliseWebmasterTools(body);

        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        blob.webmasterTools = clean;

        const payload = { data: blob, updatedAt: nowIso() };
        if (!existing) payload.createdAt = nowIso();
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true, data: clean });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
