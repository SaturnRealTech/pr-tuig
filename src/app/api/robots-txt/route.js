// GET  /api/robots-txt  — read the current robots.txt content (admin)
// PUT  /api/robots-txt  — save new content (admin)
//
// Storage: settings.brand.data.robotsTxt (alongside titlesMeta etc.).

import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { readRobotsTxt, defaultRobotsTxt } from '@/lib/robotsTxt';

const TYPE = 'brand';

export async function GET() {
    try {
        const content = await readRobotsTxt();
        return NextResponse.json({
            success: true,
            data: {
                content,
                defaultContent: defaultRobotsTxt(),
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const body = await request.json();
        // Trim trailing whitespace; cap at 16KB so a malicious / accidental
        // huge paste can't blow up the brand doc. robots.txt should never be
        // anywhere near that big.
        const raw = String(body.content || '').slice(0, 16384);
        const content = raw.replace(/\s+$/g, '\n');

        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        blob.robotsTxt = content;

        const payload = { data: blob, updatedAt: nowIso() };
        if (!existing) payload.createdAt = nowIso();
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true, data: { content } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    // "Reset" — drop the override so the default content takes over again.
    try {
        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        if (existing?.data?.robotsTxt) {
            const blob = { ...existing.data };
            delete blob.robotsTxt;
            await upsertByKey('settings', 'type', TYPE, { data: blob, updatedAt: nowIso() });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
