import { NextResponse } from 'next/server';
import { findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

function normaliseSource(raw) {
    let s = String(raw || '').trim();
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) {
        try { const u = new URL(s); s = u.pathname + (u.search || ''); } catch { /* noop */ }
    }
    if (!s.startsWith('/')) s = '/' + s;
    s = s.replace(/\/{2,}/g, '/');
    if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
    return s;
}
function normaliseDestination(raw) {
    let d = String(raw || '').trim();
    if (!d) return '';
    if (/^https?:\/\//i.test(d)) return d;
    if (d.startsWith('/')) return d;
    if (/^[\w-]+(\.[\w-]+)+/.test(d)) return 'https://' + d;
    return '/' + d;
}

export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('redirects', id, { withSlug: false });
        if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { id } = await params;
        const body = await request.json();

        const updateData = { updatedAt: nowIso() };
        for (const [k, v] of Object.entries(body || {})) {
            if (k === 'id' || k === '_id') continue;
            if (k === 'isActive') updateData[k] = !!v;
            else if (k === 'source') updateData[k] = normaliseSource(v);
            else if (k === 'destination') updateData[k] = normaliseDestination(v);
            else updateData[k] = v;
        }

        const changes = await updateByAnyId('redirects', id, updateData);
        if (!changes) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { id } = await params;
        const changes = await deleteByAnyId('redirects', id);
        if (!changes) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
