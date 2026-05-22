import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { DEFAULT_TITLES_META, POST_TYPES, readTitlesMeta } from '@/lib/titlesMeta';

const TYPE = 'brand';

export async function GET() {
    try {
        const data = await readTitlesMeta();
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
        const clean = { global: { ...DEFAULT_TITLES_META.global, ...(body.global || {}) } };

        for (const t of POST_TYPES) {
            const incoming = body[t] || {};
            const merged = { ...DEFAULT_TITLES_META[t], ...incoming };
            // Boolean coerce
            for (const k of ['autodetectVideo', 'autogenerateImage', 'customRobotsMeta',
                'linkSuggestions', 'slackEnhancedSharing', 'addSeoControls']) {
                merged[k] = !!merged[k];
            }
            // Robots flags
            merged.robotsMeta = {
                index: !!(incoming.robotsMeta?.index ?? merged.robotsMeta?.index),
                follow: !!(incoming.robotsMeta?.follow ?? merged.robotsMeta?.follow),
                noarchive: !!(incoming.robotsMeta?.noarchive ?? merged.robotsMeta?.noarchive),
                nosnippet: !!(incoming.robotsMeta?.nosnippet ?? merged.robotsMeta?.nosnippet),
                noimageindex: !!(incoming.robotsMeta?.noimageindex ?? merged.robotsMeta?.noimageindex),
            };
            clean[t] = merged;
        }

        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        blob.titlesMeta = clean;

        const payload = { data: blob, updatedAt: nowIso() };
        if (!existing) payload.createdAt = nowIso();
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true, data: clean });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
