import { NextResponse } from 'next/server';
import { findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { SCHEMA_TYPES, DEFAULT_FIELDS, emptyAttachTo } from '@/lib/schemaTemplates';

const ALLOWED_TYPES = new Set(SCHEMA_TYPES.map(t => t.value));

export async function GET(_request, { params }) {
    try {
        const { id } = await params;
        const row = await findOneByAnyId('schema_templates', id, { withSlug: false });
        if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true, data: row });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const body = await request.json();
        const update = { updatedAt: nowIso() };
        if (typeof body.name === 'string') update.name = body.name.trim();
        if (ALLOWED_TYPES.has(body.schemaType)) update.schemaType = body.schemaType;
        if (body.fields && typeof body.fields === 'object') {
            const seed = JSON.parse(JSON.stringify(DEFAULT_FIELDS[update.schemaType || body.schemaType] || {}));
            update.fields = { ...seed, ...body.fields };
        }
        if (body.attachTo && typeof body.attachTo === 'object') {
            update.attachTo = {
                ...emptyAttachTo(),
                posts: Array.isArray(body.attachTo.posts) ? body.attachTo.posts.map(String).filter(Boolean) : [],
                projects: Array.isArray(body.attachTo.projects) ? body.attachTo.projects.map(String).filter(Boolean) : [],
                allBlogPosts: !!body.attachTo.allBlogPosts,
                allProjects: !!body.attachTo.allProjects,
            };
        }
        const changes = await updateByAnyId('schema_templates', id, update);
        if (!changes) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const changes = await deleteByAnyId('schema_templates', id);
        if (!changes) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
