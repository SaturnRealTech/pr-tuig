// Debug-only — dump exactly what the homepage SSR loader sees. Open this in
// the browser to verify whether the project being edited is actually the one
// rendered at `/`, and whether `keyHighlights` survived the save.
//
// Safe to leave around (admin-only) but feel free to delete once you've used it.

import { NextResponse } from 'next/server';
import { col } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    const projects = await col('projects');
    const home =
        (await projects.findOne({ publishStatus: 'published', isHomePage: true })) ||
        (await projects.findOne({ publishStatus: 'published' }, { sort: { createdAt: 1 } }));

    const allHomeFlags = await projects
        .find({ isHomePage: true })
        .project({ _id: 1, slug: 1, title: 1, publishStatus: 1 })
        .toArray();

    return NextResponse.json({
        success: true,
        loadedAt: new Date().toISOString(),
        homeProject: home ? {
            _id: String(home._id),
            slug: home.slug,
            title: home.title,
            publishStatus: home.publishStatus,
            isHomePage: home.isHomePage,
            keyHighlightsTitle: home.keyHighlightsTitle,
            keyHighlightsLength: typeof home.keyHighlights === 'string' ? home.keyHighlights.length : null,
            keyHighlightsSnippet: typeof home.keyHighlights === 'string' ? home.keyHighlights.slice(0, 300) : null,
            highlightItemsCount: Array.isArray(home.highlightItems) ? home.highlightItems.length : 0,
        } : null,
        allProjectsFlaggedAsHome: allHomeFlags.map(p => ({ _id: String(p._id), slug: p.slug, title: p.title, publishStatus: p.publishStatus })),
    });
}
