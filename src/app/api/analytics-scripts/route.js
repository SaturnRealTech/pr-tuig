// GET  /api/analytics-scripts  — read tracking config
// PUT  /api/analytics-scripts  — admin save
//
// Storage: settings.brand.data.analyticsScripts.

import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { readAnalyticsScripts, normaliseAnalytics } from '@/lib/analyticsScripts';

const TYPE = 'brand';

export async function GET() {
    try {
        const data = await readAnalyticsScripts();
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
        const clean = normaliseAnalytics(body);

        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        blob.analyticsScripts = clean;

        const payload = { data: blob, updatedAt: nowIso() };
        if (!existing) payload.createdAt = nowIso();
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true, data: clean });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
