import { notFound } from 'next/navigation';
import BlogDetailPage from '@/features/blog/BlogDetailPage';
import { col, findOneByAnyId } from '@/lib/db';
import { processBlogPost } from '@/lib/imageSeo';
import {
    SITE_URL,
    createBreadcrumbSchema,
    createOrganizationSchema,
    createPageMetadata,
    createWebPageSchema,
} from '@/lib/seo';

async function normalizePost(post) {
    if (!post) return null;
    return processBlogPost({
        ...post,
        _id: post._id ? String(post._id) : null,
        slug: post.slug || (post._id ? String(post._id) : ''),
    });
}

function toIsoDate(value) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function getPostBySlug(slug) {
    const blogPosts = await col('blog_posts');
    let row = await blogPosts.findOne({ slug });
    if (!row) row = await findOneByAnyId('blog_posts', slug);
    return normalizePost(row);
}

export async function generateStaticParams() {
    try {
        const blogPosts = await col('blog_posts');
        const posts = await blogPosts.find({}).project({ slug: 1, _id: 1 }).toArray();
        return posts
            .map(p => p.slug || (p._id ? String(p._id) : null))
            .filter(Boolean)
            .map(slug => ({ slug: String(slug) }));
    } catch (error) {
        console.error('[blog] generateStaticParams failed:', error.message);
        return [];
    }
}

export async function generateMetadata({ params }) {
    const resolvedParams = params?.then ? await params : params;
    const post = await getPostBySlug(resolvedParams.slug);

    if (!post) {
        return createPageMetadata({
            title: 'Blog Post Not Found - Saturnrealcon',
            description: 'The requested blog post could not be found.',
            path: '/blog',
        });
    }

    const postPath = `/blog/${post.slug}`;
    const description =
        post.metaDescription ||
        post.excerpt ||
        'Read this SaaS and AI insight from Saturnrealcon.';

    return createPageMetadata({
        title: post.metaTitle || `${post.title} - Saturnrealcon`,
        description,
        path: postPath,
        keywords: post.keywords
            ? String(post.keywords).split(',').map((k) => k.trim()).filter(Boolean)
            : ['SaaS insights', 'AI development', 'startup engineering'],
        image: post.heroImage || post.image,
        type: 'article',
    });
}

export default async function BlogDetailRoute({ params }) {
    const resolvedParams = params?.then ? await params : params;
    const post = await getPostBySlug(resolvedParams.slug);

    if (!post) notFound();

    const postPath = `/blog/${post.slug}`;
    const publishedAt = toIsoDate(post.publishedAt || post.createdAt || post.date);
    const modifiedAt = toIsoDate(post.updatedAt || post.modifiedAt || post.createdAt || post.date);

    const blogSchema = {
        '@context': 'https://schema.org',
        '@graph': [
            createWebPageSchema({
                path: postPath,
                name: post.title,
                description: post.metaDescription || post.excerpt || 'Detailed article from Saturnrealcon.',
                type: 'WebPage',
                aboutOrg: true,
            }),
            createOrganizationSchema({
                description: 'Saturnrealcon builds AI-first SaaS products for founders and fast-moving teams.',
                sameAs: ['https://www.linkedin.com/company/Saturnrealcon/'],
            }),
            createBreadcrumbSchema([
                { name: 'Home', path: '/' },
                { name: 'Blog', path: '/blog' },
                { name: post.title, path: postPath },
            ]),
            {
                '@type': 'BlogPosting',
                mainEntityOfPage: `${SITE_URL}${postPath}`,
                headline: post.title,
                description: post.metaDescription || post.excerpt || post.title,
                articleSection: post.category,
                image: post.heroImage || post.image,
                ...(publishedAt ? { datePublished: publishedAt } : {}),
                ...(modifiedAt ? { dateModified: modifiedAt } : {}),
                author: { '@type': 'Person', name: post.author || 'Saturnrealcon Team' },
                publisher: { '@id': `${SITE_URL}/#organization` },
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
            />
            <BlogDetailPage post={post} />
        </>
    );
}
