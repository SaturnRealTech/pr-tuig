import { NextResponse } from 'next/server';
import { col, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { pingSearchEngines } from '@/lib/seoPing';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const admin = searchParams.get('admin') === '1';
        const category = searchParams.get('category');
        const status = searchParams.get('status'); // 'draft' | 'published' | '' (all, admin only)

        // Admin-mode listing requires view permission. Public listing is open.
        if (admin) {
            const guard = await requirePermission(request, 'projects', 'view');
            if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
        }

        const filter = {};
        if (!admin) {
            filter.publishStatus = 'published';
        } else if (status === 'draft' || status === 'published') {
            filter.publishStatus = status;
        }
        if (category && category !== 'All') filter.category = category;

        const projects = await col('projects');
        const rows = await projects
            .find(filter)
            .sort({ createdDate: -1, createdAt: -1 })
            .toArray();

        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const guard = await requirePermission(request, 'projects', 'create');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json();
        const now = nowIso();

        const doc = {
            ...body,
            publishStatus: body.publishStatus || 'draft',
            createdAt: now,
            updatedAt: now,
        };
        // Strip undefined and the synthetic numeric `id` if present.
        delete doc.id;
        Object.keys(doc).forEach(k => { if (doc[k] === undefined) delete doc[k]; });

        const projects = await col('projects');
        const result = await projects.insertOne(doc);
        const row = await projects.findOne({ _id: result.insertedId });

        if (row?.publishStatus === 'published') {
            const slug = row.isHomePage ? '/' : (row.slug || (row._id ? String(row._id) : ''));
            const path = slug === '/' ? '/' : (slug.startsWith('/') ? slug : `/${slug}`);
            pingSearchEngines([path]);
        }

        return NextResponse.json(
            { success: true, data: row },
            { status: 201 }
        );
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
