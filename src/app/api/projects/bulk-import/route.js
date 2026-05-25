import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { col, nowIso } from '@/lib/db';

export const dynamic = 'force-dynamic';

function reEscape(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function slugify(title) {
    return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function unwrap(raw) {
    if (raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object') {
        return raw.data;
    }
    return raw;
}

// POST /api/projects/bulk-import
// Body: { items: [<project | { success, data: project }>, ...] }
// Inserts each project into `projects`, skipping any whose title already
// exists (case-insensitive exact match). Returns a per-item summary.
export async function POST(request) {
    const guard = await requirePermission(request, 'projects', 'create');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    // Accept either `items` (new) or `projects` (legacy) for forward compat.
    const items = Array.isArray(body?.items) ? body.items
                : Array.isArray(body?.projects) ? body.projects
                : null;
    if (!items || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Expected { items: [...] } with at least one entry' }, { status: 400 });
    }

    const projects = await col('projects');
    const now = nowIso();
    const details = [];
    let inserted = 0, skipped = 0, failed = 0;

    for (let i = 0; i < items.length; i++) {
        const sourceName = items[i]?.__source || `#${i + 1}`;
        try {
            const project = unwrap(items[i]);
            const title = project?.title;
            if (!title) {
                failed++;
                details.push({ source: sourceName, status: 'failed', error: 'Missing "title"' });
                continue;
            }

            const titleRegex = new RegExp(`^${reEscape(title)}$`, 'i');
            const existing = await projects.findOne({ title: titleRegex }, { projection: { _id: 1 } });
            if (existing) {
                skipped++;
                details.push({ source: sourceName, title, status: 'skipped', reason: 'title already exists' });
                continue;
            }

            const { __source, _id, id, createdAt, updatedAt, ...rest } = project;
            const doc = {
                ...rest,
                slug: rest.slug || slugify(title),
                publishStatus: rest.publishStatus || 'draft',
                createdAt: createdAt || now,
                updatedAt: now,
            };
            Object.keys(doc).forEach(k => { if (doc[k] === undefined) delete doc[k]; });

            const result = await projects.insertOne(doc);
            inserted++;
            details.push({ source: sourceName, title, status: 'inserted', _id: String(result.insertedId) });
        } catch (e) {
            failed++;
            details.push({ source: sourceName, status: 'failed', error: e.message });
        }
    }

    return NextResponse.json({ success: true, inserted, skipped, failed, total: items.length, details });
}
