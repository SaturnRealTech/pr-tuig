import { NextResponse } from 'next/server';
import { findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';
import { pingSearchEngines } from '@/lib/seoPing';

function buildUpdate(body) {
    const out = { ...body, updatedAt: nowIso() };
    delete out.id;
    Object.keys(out).forEach(k => { if (out[k] === undefined) delete out[k]; });
    return out;
}

// GET - Fetch a single project by ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('projects', id);
        if (!row) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

function projectUrlFor(row) {
    if (!row) return null;
    if (row.isHomePage) return '/';
    const slug = row.slug || (row._id ? String(row._id) : '');
    return slug ? `/${slug}` : null;
}

// PATCH - Quick field update (e.g. toggle publishStatus)
export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const updateData = buildUpdate(body);
        const changes = await updateByAnyId('projects', id, updateData);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }
        if (body && body.publishStatus === 'published') {
            const row = await findOneByAnyId('projects', id);
            const url = projectUrlFor(row);
            if (url) pingSearchEngines([url]);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PUT - Update a project
export async function PUT(request, { params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const updateData = buildUpdate(body);

        const changes = await updateByAnyId('projects', id, updateData);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        const row = await findOneByAnyId('projects', id);
        if (row?.publishStatus === 'published') {
            const url = projectUrlFor(row);
            if (url) pingSearchEngines([url]);
        }
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE - Delete a project
export async function DELETE(request, { params }) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    try {
        const { id } = await params;
        const row = await findOneByAnyId('projects', id);
        if (!row) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        if (row.desktopBanner && row.desktopBanner.startsWith('/images/')) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/s3-delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: row.desktopBanner }),
                });
            } catch { /* ignore */ }
        }

        const wasPublishedUrl = row.publishStatus === 'published' ? projectUrlFor(row) : null;
        const changes = await deleteByAnyId('projects', id);
        if (!changes) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }
        if (wasPublishedUrl) pingSearchEngines([wasPublishedUrl], { type: 'URL_DELETED' });
        return NextResponse.json({ success: true, message: 'Project deleted' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
