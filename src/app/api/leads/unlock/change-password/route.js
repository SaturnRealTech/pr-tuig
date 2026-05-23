// Rotate the leads vault password.
//
//   POST /api/leads/unlock/change-password { oldPassword, newPassword }
//
// Admin-only. Verifies the old password against the stored bcrypt hash, then
// writes a new bcrypt hash + a fresh per-install salt. All existing unlock
// sessions are destroyed so anyone holding a stale cookie is forced to
// re-enter the NEW password before they can see leads.

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { col, nowIso } from '@/lib/db';
import { requireAdminOnly } from '@/lib/authHelper';
import { readLeadsCrypto, setLeadsPassword } from '@/lib/leadsLock';

export async function POST(request) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const { oldPassword, newPassword } = await request.json();

        if (typeof oldPassword !== 'string' || oldPassword.length === 0) {
            return NextResponse.json({ success: false, error: 'Old password required' }, { status: 400 });
        }
        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return NextResponse.json({ success: false, error: 'New password must be at least 6 characters' }, { status: 400 });
        }
        if (oldPassword === newPassword) {
            return NextResponse.json({ success: false, error: 'New password must be different from the old one' }, { status: 400 });
        }

        const { hash, configured } = await readLeadsCrypto();
        if (!configured) {
            return NextResponse.json(
                { success: false, error: 'Leads vault is not configured. Set a password first in Brand settings.' },
                { status: 412 },
            );
        }

        const ok = await bcrypt.compare(oldPassword, hash);
        if (!ok) {
            return NextResponse.json({ success: false, error: 'Old password is incorrect' }, { status: 401 });
        }

        // Bcrypt + new random salt for the new password.
        const { leadsPasswordHash, leadsSalt } = await setLeadsPassword(newPassword);

        const settings = await col('settings');
        const existing = await settings.findOne({ type: 'brand' });
        const blob = existing?.data || {};
        blob.leadsPasswordHash = leadsPasswordHash;
        blob.leadsSalt = leadsSalt;
        await settings.updateOne(
            { type: 'brand' },
            { $set: { type: 'brand', data: blob, updatedAt: nowIso() } },
            { upsert: true },
        );

        // Nuke every active unlock session so the rotation takes effect
        // instantly — anyone currently unlocked has to re-enter the new
        // password before they can fetch leads again.
        try { await (await col('lead_sessions')).deleteMany({}); } catch { /* ignore */ }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
