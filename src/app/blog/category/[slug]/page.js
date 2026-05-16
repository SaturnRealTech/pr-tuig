import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import { createBreadcrumbSchema, createOrganizationSchema, createPageMetadata, createWebPageSchema } from '@/lib/seo';
import BlogCategoryPageClient from '@/features/blog/BlogCategoryPageClient';

function normalizePost(post) {
    return {
        ...post,
        _id: post?._id?.toString?.() || post?._id,
        slug: post?.slug || (post?.id ? String(post.id) : post?._id?.toString?.()),
    };
}

async function getData(slug) {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

    const [category, allPosts] = await Promise.all([
        db.collection('blogCategories').findOne({ slug }),
        db.collection('blog_posts').find({ category: { $exists: true } }).sort({ date: -1, createdAt: -1 }).toArray(),
    ]);

    if (!category) return null;

    const posts = allPosts
        .filter((p) => p.category === category.name)
        .map(normalizePost);

    return {
        category: { ...category, _id: category._id?.toString() },
        posts,
    };
}

export async function generateStaticParams() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const cats = await db.collection('blogCategories').find({}, { projection: { slug: 1 } }).toArray();
        return cats.filter((c) => c?.slug).map((c) => ({ slug: c.slug }));
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
