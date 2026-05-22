import { NextResponse } from 'next/server';
import { col, nowIso, toObjectId } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { SCHEMA_TYPES, DEFAULT_FIELDS, emptyAttachTo } from '@/lib/schemaTemplates';

const ALLOWED_TYPES = new Set(SCHEMA_TYPES.map(t => t.value));

export async function GET() {
    try {
        const tpls = await col('schema_templates');
        const rows = await tpls.find({}).sort({ updatedAt: -1, createdAt: -1 }).toArray();
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json();
        const name = String(body.name || '').trim();
        const schemaType = ALLOWED_TYPES.has(body.schemaType) ? body.schemaType : 'FAQPage';
        if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

        const fields = sanitiseFields(schemaType, body.fields);
        const attachTo = sanitiseAttach(body.attachTo);
        const now = nowIso();
        const doc = { name, schemaType, fields, attachTo, createdAt: now, updatedAt: now };
        const tpls = await col('schema_templates');
        const result = await tpls.insertOne(doc);
        return NextResponse.json({ success: true, data: { _id: String(result.insertedId), ...doc } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { ids } = await request.json();
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ success: false, error: 'No IDs' }, { status: 400 });
        }
        const objectIds = ids.map(toObjectId).filter(Boolean);
        const stringIds = ids.map(String);
        const tpls = await col('schema_templates');
        const r = await tpls.deleteMany({ $or: [{ _id: { $in: objectIds } }, { _id: { $in: stringIds } }] });
        return NextResponse.json({ success: true, deletedCount: r.deletedCount });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

function sanitiseFields(schemaType, raw) {
    const base = JSON.parse(JSON.stringify(DEFAULT_FIELDS[schemaType] || {}));
    if (!raw || typeof raw !== 'object') return base;
    return { ...base, ...raw };
}

function sanitiseAttach(raw) {
    const empty = emptyAttachTo();
    if (!raw || typeof raw !== 'object') return empty;
    return {
        posts: Array.isArray(raw.posts) ? raw.posts.map(String).filter(Boolean) : [],
        projects: Array.isArray(raw.projects) ? raw.projects.map(String).filter(Boolean) : [],
        allBlogPosts: !!raw.allBlogPosts,
        allProjects: !!raw.allProjects,
    };
}
