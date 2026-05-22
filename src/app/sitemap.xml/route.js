import { NextResponse } from 'next/server';
import { col } from '@/lib/db';
import { readSitemapSettings } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://SaturnRealcon.com';

const staticRoutes = ['/', '/blog'];

function toPath(prefix, value) {
    if (value === undefined || value === null) return null;
    const clean = String(value).trim();
    if (!clean) return null;
    return `${prefix}/${encodeURIComponent(clean)}`;
}

function toXml(routes) {
    const rows = routes
        .map((route) => {
            const lastMod = (route.lastModified || new Date()).toISOString();
            return `  <url>\n    <loc>${route.url}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`;
        })
        .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>`;
}

export async function GET() {
    try {
        const { excludes } = await readSitemapSettings();
        const ex = {
            static: new Set(excludes.static || []),
            blogs: new Set(excludes.blogs || []),
            blogCategories: new Set(excludes.blogCategories || []),
            projects: new Set(excludes.projects || []),
        };

        const [blogPostsCol, projectsCol] = await Promise.all([col('blog_posts'), col('projects')]);
        const [blogPosts, projects] = await Promise.all([
            blogPostsCol
                .find({ $or: [{ publishStatus: null }, { publishStatus: 'published' }] })
                .project({ slug: 1, category: 1, updatedAt: 1, createdAt: 1 })
                .toArray(),
            projectsCol
                .find({ publishStatus: 'published' })
                .project({ slug: 1, updatedAt: 1, createdAt: 1 })
                .toArray(),
        ]);

        const staticEntries = staticRoutes
            .filter((route) => !ex.static.has(route))
            .map((route) => ({
                url: `${siteUrl}${route}`,
                lastModified: new Date(),
                priority: route === '/' ? '1.0' : '0.8',
            }));

        const blogEntries = blogPosts
            .map((post) => {
                const slug = post.slug || (post._id ? String(post._id) : null);
                if (!slug || ex.blogs.has(slug)) return null;
                const path = toPath('/blog', slug);
                if (!path) return null;
                return {
                    url: `${siteUrl}${path}`,
                    lastModified: post.updatedAt ? new Date(post.updatedAt) : (post.createdAt ? new Date(post.createdAt) : new Date()),
                    priority: '0.8',
                };
            })
            .filter(Boolean);

        const projectEntries = projects
            .map((project) => {
                const slug = project.slug || (project._id ? String(project._id) : null);
                if (!slug || ex.projects.has(slug)) return null;
                return {
                    url: `${siteUrl}/${encodeURIComponent(String(slug).trim())}`,
                    lastModified: project.updatedAt ? new Date(project.updatedAt) : (project.createdAt ? new Date(project.createdAt) : new Date()),
                    priority: '0.9',
                };
            })
            .filter(Boolean);

        const blogCategories = [...new Set(blogPosts.map(p => p.category).filter(Boolean))]
            .filter(cat => !ex.blogCategories.has(cat));

        const blogCategoryEntries = blogCategories.map((cat) => ({
            url: `${siteUrl}/blog?category=${encodeURIComponent(cat)}`,
            lastModified: new Date(),
            priority: '0.6',
        }));

        const uniqueEntries = Array.from(
            new Map(
                [...staticEntries, ...projectEntries, ...blogEntries, ...blogCategoryEntries]
                    .map((entry) => [entry.url, entry])
            ).values()
        );

        const xml = toXml(uniqueEntries);

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            },
        });
    } catch (error) {
        console.error('[sitemap.xml] Failed to load dynamic routes:', error.message);

        const fallbackEntries = staticRoutes.map((route) => ({
            url: `${siteUrl}${route}`,
            lastModified: new Date(),
            priority: route === '/' ? '1.0' : '0.8',
        }));

        return new NextResponse(toXml(fallbackEntries), {
            headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        });
    }
}
