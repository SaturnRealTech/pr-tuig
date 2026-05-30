import { col } from '@/lib/db';
import { SITE_URL, createBreadcrumbSchema, createOrganizationSchema, createPageMetadata, createWebPageSchema, loadOrgSchemaConfig } from '@/lib/seo';
import BlogCategoriesListClient from '@/features/blog/BlogCategoriesListClient';

async function getData() {
    const [blogCats, blogPosts, pages] = await Promise.all([col('blogCategories'), col('blog_posts'), col('pages')]);
    const [categories, posts, pageRow] = await Promise.all([
        blogCats.find({}).collation({ locale: 'en', strength: 2 }).sort({ name: 1 }).toArray(),
        blogPosts.find({}).project({ category: 1 }).toArray(),
        pages.findOne({ type: 'blog-category-list' }),
    ]);
    const pageDoc = pageRow ? { ...(pageRow.data || {}), ...pageRow } : null;

    const normalizedCategories = categories.map((c) => ({
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

    return { categories: normalizedCategories, pageData };
}

export async function generateMetadata() {
    try {
        const pages = await col('pages');
        const pageRow = await pages.findOne({ type: 'blog-category-list' });
        const pageDoc = pageRow ? { ...(pageRow.data || {}), ...pageRow } : null;
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
            createOrganizationSchema(await loadOrgSchemaConfig()),
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
