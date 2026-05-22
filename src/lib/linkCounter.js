// Link counter — scans HTML for <a href="..."> tags and classifies each as
// internal, external, or anchor. Mirrors Rank Math's Link Counter (count
// internal/external links per post, list broken ones).

import { col, findOneByAnyId } from '@/lib/db';

const HREF_RE = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>/gi;

function getSiteHost() {
    try {
        const u = process.env.NEXT_PUBLIC_SITE_URL || '';
        if (!u) return '';
        return new URL(u).host.replace(/^www\./, '');
    } catch { return ''; }
}

export function extractLinks(html) {
    if (!html || typeof html !== 'string') return [];
    const out = [];
    HREF_RE.lastIndex = 0;
    let m;
    while ((m = HREF_RE.exec(html)) !== null) {
        const href = (m[1] || m[2] || '').trim();
        if (href) out.push(href);
    }
    return out;
}

export function classifyLink(href, siteHost) {
    if (!href) return 'invalid';
    if (href.startsWith('#')) return 'anchor';
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return 'anchor';
    if (href.startsWith('/')) return 'internal';
    try {
        const u = new URL(href);
        const host = u.host.replace(/^www\./, '');
        if (!siteHost) return 'external';
        return host === siteHost ? 'internal' : 'external';
    } catch {
        return 'internal';
    }
}

export function countLinks(html) {
    const host = getSiteHost();
    const links = extractLinks(html);
    let internal = 0, external = 0, anchor = 0;
    for (const href of links) {
        const kind = classifyLink(href, host);
        if (kind === 'internal') internal += 1;
        else if (kind === 'external') external += 1;
        else if (kind === 'anchor') anchor += 1;
    }
    return { total: links.length, internal, external, anchor, links };
}

function safeJson(v) {
    if (v == null) return null;
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return null; }
}

function richBlogHtml(row) {
    const parts = [];
    if (typeof row.content === 'string') parts.push(row.content);
    const seo = safeJson(row.seo);
    if (seo?.description) parts.push(seo.description);
    return parts.join('\n');
}

function richProjectHtml(row) {
    const parts = [];
    for (const field of ['overview', 'description', 'detailedDescription', 'highlights', 'amenities', 'location', 'specifications']) {
        const v = row[field];
        if (typeof v === 'string' && v.includes('<')) parts.push(v);
    }
    return parts.join('\n');
}

export async function scanAllRecords() {
    const out = [];

    try {
        const blogPosts = await col('blog_posts');
        const rows = await blogPosts
            .find({})
            .project({ slug: 1, title: 1, content: 1, seo: 1, updatedAt: 1 })
            .toArray();
        for (const r of rows) {
            const stats = countLinks(richBlogHtml(r));
            out.push({
                type: 'blog',
                id: r._id ? String(r._id) : '',
                slug: r.slug || (r._id ? String(r._id) : ''),
                title: r.title || '(untitled)',
                updatedAt: r.updatedAt || null,
                internal: stats.internal,
                external: stats.external,
                anchor: stats.anchor,
                total: stats.total,
            });
        }
    } catch { /* collection missing */ }

    try {
        const projects = await col('projects');
        const rows = await projects.find({}).toArray();
        for (const r of rows) {
            const stats = countLinks(richProjectHtml(r));
            out.push({
                type: 'project',
                id: r._id ? String(r._id) : '',
                slug: r.slug || (r._id ? String(r._id) : ''),
                title: r.title || r.name || '(untitled)',
                updatedAt: r.updatedAt || null,
                internal: stats.internal,
                external: stats.external,
                anchor: stats.anchor,
                total: stats.total,
            });
        }
    } catch { /* collection missing */ }

    return out;
}

export async function scanOne(type, id) {
    if (type === 'blog') {
        const row = await findOneByAnyId('blog_posts', id);
        if (!row) return null;
        const stats = countLinks(richBlogHtml(row));
        return { type, id: row._id ? String(row._id) : '', slug: row.slug, title: row.title, ...stats };
    }
    if (type === 'project') {
        const row = await findOneByAnyId('projects', id);
        if (!row) return null;
        const stats = countLinks(richProjectHtml(row));
        return { type, id: row._id ? String(row._id) : '', slug: row.slug, title: row.title || row.name, ...stats };
    }
    return null;
}
