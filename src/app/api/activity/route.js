import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { col } from '@/lib/db';
import { requireAdminOnly } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

// GET /api/activity?type=project&action=delete&userEmail=foo@bar&q=hero&from=ISO&to=ISO&limit=100&skip=0
//
// Admin-only — the activity log is an accountability tool, so editors must
// not be able to read (or hide) entries about other admins.
export async function GET(request) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || '';
        const action = searchParams.get('action') || '';
        const userEmail = searchParams.get('userEmail') || '';
        const q = searchParams.get('q') || '';
        const from = searchParams.get('from') || '';
        const to = searchParams.get('to') || '';
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10) || 100, 1), 500);
        const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0);

        const filter = {};
        if (type) filter.type = type;
        if (action) filter.action = action;
        if (userEmail) filter.userEmail = userEmail;
        if (q) {
            const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [{ refTitle: re }, { section: re }, { userEmail: re }, { note: re }];
        }
        if (from || to) {
            filter.at = {};
            if (from) filter.at.$gte = from;
            if (to) filter.at.$lte = to;
        }

        const c = await col('activity_log');
        const [rows, total] = await Promise.all([
            c.find(filter).sort({ at: -1 }).skip(skip).limit(limit).toArray(),
            c.countDocuments(filter),
        ]);
        return NextResponse.json({ success: true, data: rows, total, limit, skip });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE /api/activity — admin-only bulk delete by ids. Body: { ids: [...] }.
//
// We deliberately do NOT log this delete as another activity entry: the
// caller's identity is already on the request, and a delete-of-delete would
// just clutter the trail with mod actions that the surviving admins can see
// from MongoDB anyway.
export async function DELETE(request) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const body = await request.json().catch(() => ({}));
        const ids = Array.isArray(body?.ids) ? body.ids : [];
        if (ids.length === 0) {
            return NextResponse.json({ success: false, error: 'ids[] is required' }, { status: 400 });
        }

        // Activity entries always store an ObjectId-backed _id. Skip anything
        // that doesn't look like one rather than throwing — keeps a bad input
        // from blocking the rest.
        const objectIds = [];
        for (const raw of ids) {
            try {
                if (ObjectId.isValid(raw)) objectIds.push(new ObjectId(raw));
            } catch { /* skip */ }
        }
        if (objectIds.length === 0) {
            return NextResponse.json({ success: false, error: 'No valid ids provided' }, { status: 400 });
        }

        const c = await col('activity_log');
        const result = await c.deleteMany({ _id: { $in: objectIds } });
        return NextResponse.json({ success: true, deletedCount: result.deletedCount || 0 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
