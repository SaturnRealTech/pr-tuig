import BlogPageClient from '@/features/blog/BlogPageClient';
import clientPromise from '@/lib/mongodb';
import {
    SITE_URL,
    createBreadcrumbSchema,
    createOrganizationSchema,
    createPageMetadata,
    createWebPageSchema,
} from '@/lib/seo';

const blogPath = '/blog';
const blogTitle = 'Blog - Saturnrealcon';
const blogDescription =
    'Read practical insights on SaaS development, product strategy, AI implementation, and startup execution from the Saturnrealcon team.';

function normalizePost(post) {
    return {
        ...post,
        _id: post?._id?.toString?.() || post?._id,
        slug: post?.slug || (post?.id ? String(post.id) : post?._id?.toString?.()),
    };
}

async function getBlogPageData() {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

    const [posts, blogCategories, pageDoc] = await Promise.all([
        db.collection('blog_posts').find({}).sort({ date: -1, createdAt: -1 }).toArray(),
        db.collection('blogCategories').find({}).sort({ name: 1 }).toArray(),
        db.collection('pages').findOne({ type: 'blog' }),
    ]);

    const normalizedPosts = posts.map(normalizePost);

    const categoriesWithCount = blogCategories.map((c) => ({
        _id: c._id?.toString(),
        name: c.name || '',
        slug: c.slug || '',
        description: c.description || '',
        heroImage: c.heroImage || '',
        mobileBanner: c.mobileBanner || '',
        count: normalizedPosts.filter((p) => p.category === c.name).length,
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

    return { posts: normalizedPosts, categories: categoriesWithCount, pageData };
}

export async function generateMetadata() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const pageDoc = await db.collection('pages').findOne({ type: 'blog' });
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
        keywords: ['real estate blog', 'property tips', 'market trends', 'Saturnrealcon blog'],
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
            // Blog — most specific type for a blog listing page
            {
                '@type': 'Blog',
                '@id': `${SITE_URL}${blogPath}#blog`,
                name: title,
                description,
                url: `${SITE_URL}${blogPath}`,
                ...(pageData.desktopBanner ? { image: pageData.desktopBanner } : {}),
                publisher: {
                    '@type': 'Organization',
                    name: 'Saturn RealCon',
                    url: SITE_URL,
                },
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
            // ItemList — Google uses this for search carousels
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
            createOrganizationSchema({
                sameAs: ['https://www.linkedin.com/company/Saturnrealcon/'],
            }),
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
