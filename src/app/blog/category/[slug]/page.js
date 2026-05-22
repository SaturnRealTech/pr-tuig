import { notFound } from 'next/navigation';
import { col } from '@/lib/db';
import { createBreadcrumbSchema, createOrganizationSchema, createPageMetadata, createWebPageSchema } from '@/lib/seo';
import BlogCategoryPageClient from '@/features/blog/BlogCategoryPageClient';

function normalizePost(post) {
    if (!post) return null;
    return {
        ...post,
        _id: post._id ? String(post._id) : null,
        slug: post.slug || (post._id ? String(post._id) : ''),
    };
}

async function getData(slug) {
    const [blogCats, blogPosts] = await Promise.all([col('blogCategories'), col('blog_posts')]);
    const category = await blogCats.findOne({ slug });
    if (!category) return null;
    const posts = (await blogPosts
        .find({ category: category.name })
        .sort({ date: -1, createdAt: -1 })
        .toArray()
    ).map(normalizePost).filter(Boolean);
    return {
        category: { ...category, _id: category._id ? String(category._id) : '' },
        posts,
    };
}

export async function generateStaticParams() {
    try {
        const blogCats = await col('blogCategories');
        const cats = await blogCats.find({ slug: { $ne: null } }).project({ slug: 1 }).toArray();
        return cats.filter((c) => c.slug).map((c) => ({ slug: c.slug }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    try {
        const data = await getData(slug);
        if (!data) return { title: 'Category Not Found' };
        const { category } = data;
        return createPageMetadata({
            title: category.metaTitle || `${category.name} - Blog`,
            description: category.metaDescription || category.description || `Read all ${category.name} articles.`,
            path: `/blog/category/${slug}`,
            image: category.heroImage,
        });
    } catch {
        return { title: 'Blog' };
    }
}

export default async function BlogCategoryPage({ params }) {
    const { slug } = await params;
    const data = await getData(slug);
    if (!data) notFound();

    const { category, posts } = data;
    const pagePath = `/blog/category/${slug}`;

    const schema = {
        '@context': 'https://schema.org',
        '@graph': [
            createWebPageSchema({
                path: pagePath,
                name: `${category.name} - Blog`,
                description: category.metaDescription || category.description || `Articles in ${category.name}`,
                type: 'CollectionPage',
                aboutOrg: true,
            }),
            createOrganizationSchema({ sameAs: ['https://www.linkedin.com/company/Saturnrealcon/'] }),
            createBreadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'Blog', path: '/blog' },
                { name: category.name, path: pagePath },
            ]),
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
            <BlogCategoryPageClient category={category} posts={posts} />
        </>
    );
}
