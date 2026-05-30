import BlogPageClient from '@/features/blog/BlogPageClient';
import { col } from '@/lib/db';
import {
    SITE_URL,
    createBreadcrumbSchema,
    createOrganizationSchema,
    createPageMetadata,
    loadOrgSchemaConfig,
} from '@/lib/seo';

const blogPath = '/blog';
const blogTitle = 'Blog';
const blogDescription = '';

function normalizePost(post) {
    if (!post) return null;
    return {
        ...post,
        _id: post._id ? String(post._id) : null,
        slug: post.slug || (post._id ? String(post._id) : ''),
    };
}

async function getBlogPageData() {
    const [blogPosts, blogCats, pages] = await Promise.all([
        col('blog_posts'),
        col('blogCategories'),
        col('pages'),
    ]);

    const [posts, categories, pageRow] = await Promise.all([
        blogPosts.find({}).sort({ publishedAt: -1, createdAt: -1 }).toArray().then(rs => rs.map(normalizePost).filter(Boolean)),
        blogCats.find({}).collation({ locale: 'en', strength: 2 }).sort({ name: 1 }).toArray(),
        pages.findOne({ type: 'blog' }),
    ]);

    const pageDoc = pageRow ? { ...(pageRow.data || {}), ...pageRow } : null;

    const categoriesWithCount = categories.map((c) => ({
        _id: c._id ? String(c._id) : '',
        name: c.name || '',
        slug: c.slug || '',
        description: c.description || '',
        heroImage: c.heroImage || '',
        mobileBanner: c.mobileBanner || '',
        count: posts.filter((p) => p.category === c.name).length,
    }));

    const pageData = pageDoc ? {
        desktopBanner: pageDoc.desktopBanner || '',
        desktopBannerAlt: pageDoc.desktopBannerAlt || '',
        mobileBanner: pageDoc.mobileBanner || '',
        mobileBannerAlt: pageDoc.mobileBannerAlt || '',
        bannerTitle: pageDoc.bannerTitle || '',
        bannerDescription: pageDoc.bannerDescription || '',
        metaTitle: pageDoc.metaTitle || '',
        metaDescription: pageDoc.metaDescription || '',
        keywords: pageDoc.keywords || '',
    } : {};

    return { posts, categories: categoriesWithCount, pageData };
}

export async function generateMetadata() {
    try {
        const pages = await col('pages');
        const pageRow = await pages.findOne({ type: 'blog' });
        const pageDoc = pageRow ? { ...(pageRow.data || {}), ...pageRow } : null;
        if (pageDoc?.metaTitle || pageDoc?.metaDescription) {
            return createPageMetadata({
                title: pageDoc.metaTitle || blogTitle,
                description: pageDoc.metaDescription || blogDescription,
                path: blogPath,
                keywords: pageDoc.keywords ? String(pageDoc.keywords).split(',').map(k => k.trim()).filter(Boolean) : [],
            });
        }
    } catch { /* fallback */ }
    return createPageMetadata({
        title: blogTitle,
        description: blogDescription,
        path: blogPath,
        keywords: [],
    });
}

function toIsoDate(value) {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
}

export default async function BlogPage() {
    const { posts, categories, pageData } = await getBlogPageData();

    const title = pageData.metaTitle || blogTitle;
    const description = pageData.metaDescription || blogDescription;

    const blogSchema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Blog',
                '@id': `${SITE_URL}${blogPath}#blog`,
                name: title,
                description,
                url: `${SITE_URL}${blogPath}`,
                ...(pageData.desktopBanner ? { image: pageData.desktopBanner } : {}),
                publisher: { '@id': `${SITE_URL}/#organization` },
                blogPost: posts.slice(0, 20).map(post => ({
                    '@type': 'BlogPosting',
                    headline: post.title,
                    url: `${SITE_URL}/blog/${post.slug}`,
                    ...(toIsoDate(post.date || post.createdAt) ? { datePublished: toIsoDate(post.date || post.createdAt) } : {}),
                    ...(post.author ? { author: { '@type': 'Person', name: post.author } } : {}),
                    ...(post.heroImage ? { image: post.heroImage } : {}),
                    ...(post.excerpt ? { description: post.excerpt } : {}),
                })),
            },
            {
                '@type': 'ItemList',
                name: 'Latest Blog Posts',
                itemListElement: posts.slice(0, 20).map((post, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    item: {
                        '@type': 'BlogPosting',
                        url: `${SITE_URL}/blog/${post.slug}`,
                        headline: post.title,
                        ...(post.heroImage ? { image: post.heroImage } : {}),
                        ...(toIsoDate(post.date || post.createdAt) ? { datePublished: toIsoDate(post.date || post.createdAt) } : {}),
                        ...(post.author ? { author: { '@type': 'Person', name: post.author } } : {}),
                        ...(post.excerpt ? { description: post.excerpt } : {}),
                    },
                })),
            },
            createOrganizationSchema(await loadOrgSchemaConfig()),
            createBreadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'Blog', path: blogPath },
            ]),
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
            />
            <BlogPageClient posts={posts} categories={categories} recentPosts={posts.slice(0, 6)} pageData={pageData} />
        </>
    );
}
