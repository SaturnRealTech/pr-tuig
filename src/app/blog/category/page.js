import clientPromise from '@/lib/mongodb';
import { SITE_URL, createBreadcrumbSchema, createOrganizationSchema, createPageMetadata, createWebPageSchema } from '@/lib/seo';
import BlogCategoriesListClient from '@/features/blog/BlogCategoriesListClient';

async function getData() {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

    const [categories, posts, pageDoc] = await Promise.all([
        db.collection('blogCategories').find({}).sort({ name: 1 }).toArray(),
        db.collection('blog_posts').find({}, { projection: { category: 1 } }).toArray(),
        db.collection('pages').findOne({ type: 'blog-category-list' }),
    ]);

    const normalizedCategories = categories.map((c) => ({
        _id: c._id?.toString(),
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

    return { categories: normalizedCategories, pageData };
}

export async function generateMetadata() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const pageDoc = await db.collection('pages').findOne({ type: 'blog-category-list' });
        if (pageDoc?.metaTitle || pageDoc?.metaDescription) {
            return createPageMetadata({
                title: pageDoc.metaTitle || 'Blog Categories',
                description: pageDoc.metaDescription || 'Browse all blog categories — news, articles, market updates and more.',
                path: '/blog/category',
                keywords: pageDoc.keywords ? String(pageDoc.keywords).split(',').map(k => k.trim()).filter(Boolean) : [],
            });
        }
    } catch { /* fallback */ }
    return createPageMetadata({
        title: 'Blog Categories',
        description: 'Browse all blog categories — news, articles, market updates and more.',
        path: '/blog/category',
    });
}

export default async function BlogCategoryListPage() {
    const { categories, pageData } = await getData();

    const title = pageData.metaTitle || 'Blog Categories';
    const description = pageData.metaDescription || 'Browse all blog categories — news, articles, market updates and more.';

    const schema = {
        '@context': 'https://schema.org',
        '@graph': [
            createWebPageSchema({
                path: '/blog/category',
                name: title,
                description,
                type: 'CollectionPage',
                aboutOrg: true,
            }),
            // ItemList — Google uses this for rich result carousels
            {
                '@type': 'ItemList',
                '@id': `${SITE_URL}/blog/category#category-list`,
                name: title,
                description,
                numberOfItems: categories.length,
                itemListElement: categories.map((cat, index) => ({
                    '@type': 'ListItem',
                    position: index + 1,
                    item: {
                        '@type': 'Thing',
                        '@id': `${SITE_URL}/blog/category/${cat.slug}`,
                        name: cat.name,
                        url: `${SITE_URL}/blog/category/${cat.slug}`,
                        ...(cat.description ? { description: cat.description } : {}),
                        ...(cat.heroImage ? { image: cat.heroImage } : {}),
                    },
                })),
            },
            createOrganizationSchema({ sameAs: ['https://www.linkedin.com/company/Saturnrealcon/'] }),
            createBreadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'Blog', path: '/blog' },
                { name: 'Categories', path: '/blog/category' },
            ]),
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <BlogCategoriesListClient categories={categories} pageData={pageData} />
        </>
    );
}
