// Sitemap admin module. Lets the admin tick / untick which exact URLs appear
// in /sitemap.xml. Settings live at settings.brand.data.sitemap.excludes —
// a per-group array of identifiers (slugs or paths) that are EXCLUDED from
// the sitemap. Toggle ON in the admin = identifier is NOT in the array.

import { col } from '@/lib/db';

export const STATIC_ROUTES = [
    { path: '/', label: 'Home' },
    { path: '/blog', label: 'Blog index' },
];

export const GROUP_KEYS = ['static', 'blogs', 'blogCategories', 'projects'];

const DEFAULT = {
    excludes: {
        static: [],         // paths
        blogs: [],          // slugs
        blogCategories: [], // category slugs/names
        projects: [],       // slugs
    },
};

export async function readSitemapSettings() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const blob = row?.data || {};
        const stored = blob.sitemap || {};
        const excludes = { ...DEFAULT.excludes, ...(stored.excludes || {}) };
        for (const k of GROUP_KEYS) {
            if (!Array.isArray(excludes[k])) excludes[k] = [];
        }
        return { excludes };
    } catch {
        return { ...DEFAULT, excludes: { ...DEFAULT.excludes } };
    }
}

export async function isIncluded(group, id) {
    const { excludes } = await readSitemapSettings();
    return !(excludes[group] || []).includes(id);
}

// Builds the full list of admin-visible items grouped by type. Each item has
// { id, label, sublabel, url } — the toggle works against `id`.
export async function collectSitemapItems() {
    const groups = {
        static: STATIC_ROUTES.map(r => ({ id: r.path, label: r.label, sublabel: r.path, url: r.path })),
        blogs: [],
        blogCategories: [],
        projects: [],
    };

    try {
        const blogPosts = await col('blog_posts');
        const rows = await blogPosts
            .find({ $or: [{ publishStatus: null }, { publishStatus: 'published' }] })
            .project({ _id: 1, slug: 1, title: 1, updatedAt: 1 })
            .sort({ updatedAt: -1 })
            .toArray();
        groups.blogs = rows.map(r => {
            const slug = r.slug || (r._id ? String(r._id) : '');
            return {
                id: slug,
                label: r.title || '(untitled)',
                sublabel: `/blog/${slug}`,
                url: `/blog/${slug}`,
            };
        });
    } catch { /* missing */ }

    try {
        const blogPosts = await col('blog_posts');
        const cats = await blogPosts.distinct('category', { category: { $nin: [null, ''] } });
        groups.blogCategories = cats
            .filter(Boolean)
            .sort()
            .map(cat => ({
                id: cat,
                label: cat,
                sublabel: `/blog?category=${cat}`,
                url: `/blog?category=${encodeURIComponent(cat)}`,
            }));
    } catch { /* missing */ }

    try {
        const projects = await col('projects');
        const rows = await projects
            .find({ publishStatus: 'published' })
            .project({ _id: 1, slug: 1, title: 1, name: 1, updatedAt: 1 })
            .sort({ updatedAt: -1 })
            .toArray();
        groups.projects = rows.map(r => {
            const slug = r.slug || (r._id ? String(r._id) : '');
            return {
                id: slug,
                label: r.title || r.name || '(untitled)',
                sublabel: `/${slug}`,
                url: `/${slug}`,
            };
        });
    } catch { /* missing */ }

    return groups;
}

export { DEFAULT as DEFAULT_SITEMAP_SETTINGS };
