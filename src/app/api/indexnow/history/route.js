// GET  /api/indexnow/history?page=1&limit=50&target=indexnow|google
// DELETE /api/indexnow/history     — clear all rows

import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { listHistory, clearHistory } from '@/lib/indexingHistory';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 50;
    const target = searchParams.get('target') || null;

    try {
        const data = listHistory({ page, limit, target });
        return NextResponse.json({ success: true, ...data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const ok = clearHistory();
        return NextResponse.json({ success: ok });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
