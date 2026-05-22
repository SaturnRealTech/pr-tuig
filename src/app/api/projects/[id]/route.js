import { NextResponse } from 'next/server';
import { findOneByAnyId, updateByAnyId, deleteByAnyId, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { pingSearchEngines } from '@/lib/seoPing';
import { deleteFromS3 } from '@/lib/s3-upload';
import { readJsonBody } from '@/lib/serverBody';

// Walk a project doc and return every image URL stored on it (top-level
// banners + nested gallery / master plan / floor plan / detailed-overview).
function collectProjectImages(row) {
    if (!row) return [];
    const urls = new Set();
    const push = (v) => { if (typeof v === 'string' && v) urls.add(v); };
    push(row.desktopBanner); push(row.mobileBanner); push(row.contentImage);

    const gallery = Array.isArray(row?.gallery?.images) ? row.gallery.images : [];
    for (const g of gallery) push(g?.image || g?.url);

    const masters = Array.isArray(row?.masterFloorPlan?.masterPlans) ? row.masterFloorPlan.masterPlans : [];
    for (const m of masters) push(m?.image);
    const floors = Array.isArray(row?.masterFloorPlan?.floorPlans) ? row.masterFloorPlan.floorPlans : [];
    for (const f of floors) push(f?.image);

    const detailed = Array.isArray(row?.detailedOverview) ? row.detailedOverview : [];
    for (const d of detailed) push(d?.image);

    return [...urls];
}

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
    const guard = await requirePermission(request, 'projects', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const body = await readJsonBody(request);
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
    const guard = await requirePermission(request, 'projects', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const body = await readJsonBody(request);
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
    const guard = await requirePermission(request, 'projects', 'delete');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { id } = await params;
        const row = await findOneByAnyId('projects', id);
        if (!row) {
            return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
        }

        // Best-effort cleanup of every image the project owns. Pulls top-level
        // banners + content image, plus every nested gallery / floor-plan /
        // detailed-overview image so the bucket doesn't accumulate orphans.
        const imageUrls = collectProjectImages(row);
        if (imageUrls.length > 0) {
            await Promise.all(imageUrls.map(u =>
                deleteFromS3(u).catch(e => console.error('[project] S3 delete failed:', u, e.message))
            ));
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

// POST handler used purely as a WAF-bypass channel. When the admin client
// retries a PATCH/PUT/DELETE that the host's mod_security blocked, it sends
// the same body via POST with `X-HTTP-Method-Override`. We dispatch to the
// real verb handler here so the route logic stays in one place.
export async function POST(request, ctx) {
    const guard = await requirePermission(request, 'projects', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    const override = (request.headers.get('x-http-method-override') || '').toUpperCase();
    if (override === 'PATCH') return PATCH(request, ctx);
    if (override === 'PUT') return PUT(request, ctx);
    if (override === 'DELETE') return DELETE(request, ctx);
    return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
}
