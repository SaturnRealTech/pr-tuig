// Link suggestions endpoint. Powers the "insert internal link" popover in
// the rich-text editor — searches blog posts and projects by title /
// keywords and returns candidates the author can drop into the post.
//
// Usage: GET /api/link-suggestions?q=foo&excludeId=<currentId>&limit=10

import { NextResponse } from 'next/server';
import { col } from '@/lib/db';
import { requireAdmin } from '@/lib/authHelper';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export async function GET(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });

    try {
        const { searchParams } = new URL(request.url);
        const q = (searchParams.get('q') || '').trim();
        const excludeId = (searchParams.get('excludeId') || '').trim();
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 30);

        if (!q) return NextResponse.json({ success: true, data: [] });

        const re = new RegExp(reEscape(q), 'i');
        const excludeFilter = excludeId
            ? { _id: { $ne: excludeId }, slug: { $ne: excludeId } }
            : {};

        const [blogPosts, projects] = await Promise.all([col('blog_posts'), col('projects')]);

        const [blogs, projs] = await Promise.all([
            blogPosts
                .find({
                    $and: [
                        { $or: [{ publishStatus: null }, { publishStatus: 'published' }] },
                        { $or: [{ title: re }, { excerpt: re }, { keywords: re }, { category: re }] },
                        ...(excludeId ? [excludeFilter] : []),
                    ],
                })
                .project({ _id: 1, slug: 1, title: 1, excerpt: 1 })
                .limit(limit)
                .toArray(),
            projects
                .find({
                    $and: [
                        { publishStatus: 'published' },
                        { $or: [{ title: re }, { projectAddress: re }, { company: re }, { keywords: re }] },
                        ...(excludeId ? [excludeFilter] : []),
                    ],
                })
                .project({ _id: 1, slug: 1, title: 1, projectAddress: 1, company: 1, isHomePage: 1 })
                .limit(limit)
                .toArray(),
        ]);

        const results = [
            ...blogs.map(b => ({
                kind: 'blog',
                _id: String(b._id),
                title: b.title || '(untitled)',
                url: `/blog/${b.slug || b._id}`,
                snippet: (b.excerpt || '').slice(0, 120),
            })),
            ...projs.map(p => ({
                kind: 'project',
                _id: String(p._id),
                title: p.title || '(untitled)',
                url: p.isHomePage ? '/' : `/${p.slug || p._id}`,
                snippet: p.projectAddress || p.company || '',
            })),
        ];

        return NextResponse.json({ success: true, data: results.slice(0, limit) });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
