// scripts/generate-sitemap.js
// Generate sitemap.xml for static pages + dynamic blog/project detail pages.

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://Saturnrealcon.com';
const dbName = process.env.DB_NAME || 'Saturnrealcon';

const staticRoutes = [
    '/',
    '/about',
    '/blog',
    '/projects',
    '/categories',
    '/careers',
    '/contact',
    '/cookies',
    '/privacy',
    '/sitemap',
    '/terms',
];

function toSafeRoute(prefix, value) {
    if (value === undefined || value === null) return null;
    const clean = String(value).trim();
    if (!clean) return null;
    return `${prefix}/${encodeURIComponent(clean)}`;
}

async function getDynamicRoutesFromMongo() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.warn('MONGODB_URI not found. Generating sitemap with static routes only.');
        return [];
    }

    const client = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 10000,
    });

    try {
        await client.connect();
        const db = client.db(dbName);

        const [blogPosts, projects, categories] = await Promise.all([
            db.collection('blog_posts').find({}, { projection: { slug: 1, id: 1 } }).toArray(),
            db.collection('projects').find({}, { projection: { slug: 1, id: 1 } }).toArray(),
            db.collection('categories').find({}, { projection: { slug: 1 } }).toArray(),
        ]);

        const blogRoutes = blogPosts
            .map((post) => toSafeRoute('/blog', post.slug || post.id))
            .filter(Boolean);

        const projectRoutes = projects
            .map((project) => toSafeRoute('/projects', project.slug || project.id))
            .filter(Boolean);

        const categoryRoutes = categories
            .map((category) => toSafeRoute('/category', category.slug))
            .filter(Boolean);

        const projectCategoryRoutes = categories
            .map((category) => toSafeRoute('/projects/category', category.slug))
            .filter(Boolean);

        return [...blogRoutes, ...projectRoutes, ...categoryRoutes, ...projectCategoryRoutes];
    } finally {
        await client.close();
    }
}

async function generateSitemap() {
    try {
        const dynamicRoutes = await getDynamicRoutesFromMongo();
        const allRoutes = [...new Set([...staticRoutes, ...dynamicRoutes])];

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
                .map(
                    (route) => `  <url>\n    <loc>${baseUrl}${route}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`
                )
                .join('\n')}
</urlset>`;

        fs.writeFileSync(path.join(__dirname, '../public/sitemap-static.xml'), sitemap);
        console.log(`sitemap-static.xml generated with ${allRoutes.length} routes.`);
    } catch (error) {
        console.error('Failed to generate sitemap:', error.message);
        process.exitCode = 1;
    }
}

generateSitemap();
