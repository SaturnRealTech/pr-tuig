// Role Manager API — read + persist the per-role permission matrix.
// The matrix is stored inside settings.brand.data.permissions so it ships
// alongside the other brand settings (no extra table needed).

import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import {
    requireAdmin,
    getPermissions,
    DEFAULT_PERMISSIONS,
    ROLES,
    MODULES,
    ACTIONS,
} from '@/lib/authHelper';

const TYPE = 'brand';

export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            data: {
                permissions: await getPermissions(),
                defaults: DEFAULT_PERMISSIONS,
                roles: ROLES,
                modules: MODULES,
                actions: ACTIONS,
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    try {
        const body = await request.json();
        const incoming = body?.permissions;
        if (!incoming || typeof incoming !== 'object') {
            return NextResponse.json({ success: false, error: 'permissions object is required' }, { status: 400 });
        }

        // Sanitise — only known roles, modules, and actions are persisted.
        const clean = {};
        for (const role of ROLES) {
            const roleMap = incoming[role];
            if (!roleMap || typeof roleMap !== 'object') continue;
            clean[role] = {};
            for (const mod of MODULES) {
                const arr = Array.isArray(roleMap[mod]) ? roleMap[mod] : [];
                clean[role][mod] = arr.filter(a => ACTIONS.includes(a));
            }
        }

        // Read existing brand row, merge `permissions` into its `data` blob,
        // write back.
        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const data = existing?.data || {};
        data.permissions = clean;

        const now = nowIso();
        const payload = { data, updatedAt: now };
        if (!existing) payload.createdAt = now;
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true, data: { permissions: clean } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
