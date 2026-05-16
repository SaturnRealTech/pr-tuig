import { notFound } from 'next/navigation';
import { ObjectId } from 'mongodb';
import BlogDetailPage from '@/features/blog/BlogDetailPage';
import clientPromise from '@/lib/mongodb';
import {
    SITE_URL,
    createBreadcrumbSchema,
    createOrganizationSchema,
    createPageMetadata,
    createWebPageSchema,
} from '@/lib/seo';

function normalizePost(post) {
    if (!post) return null;

    return {
        ...post,
        _id: post?._id?.toString?.() || post?._id,
        slug: post?.slug || (post?.id ? String(post.id) : post?._id?.toString?.()),
    };
}

function toIsoDate(value) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function getPostBySlug(slug) {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

    let post = await db.collection('blog_posts').findOne({ slug });

    if (!post) {
        const numericId = Number(slug);
        if (!Number.isNaN(numericId)) {
            post = await db.collection('blog_posts').findOne({ id: numericId });
        }
    }

    if (!post && ObjectId.isValid(slug)) {
        post = await db.collection('blog_posts').findOne({ _id: new ObjectId(slug) });
    }

    return normalizePost(post);
}

export async function generateStaticParams() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const posts = await db
            .collection('blog_posts')
            .find({}, { projection: { slug: 1, id: 1, _id: 1 } })
            .toArray();

        return posts
            .map((post) => normalizePost(post)?.slug)
            .filter(Boolean)
            .map((slug) => ({ slug }));
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
            ? String(post.keywords)
                .split(',')
                .map((keyword) => keyword.trim())
                .filter(Boolean)
            : ['SaaS insights', 'AI development', 'startup engineering'],
        image: post.heroImage || post.image,
        type: 'article',
    });
}

export default async function BlogDetailRoute({ params }) {
    const resolvedParams = params?.then ? await params : params;
    const post = await getPostBySlug(resolvedParams.slug);

    if (!post) {
        notFound();
    }

    const postPath = `/blog/${post.slug}`;
    const publishedAt = toIsoDate(post.publishedAt || post.createdAt || post.date);
    const modifiedAt = toIsoDate(post.updatedAt || post.modifiedAt || post.createdAt || post.date);

    const blogSchema = {
        '@context': 'https://schema.org',
        '@graph': [
            createWebPageSchema({
                path: postPath,
                name: post.title,
                description:
                    post.metaDescription ||
                    post.excerpt ||
                    'Detailed article from Saturnrealcon.',
                type: 'WebPage',
                aboutOrg: true,
            }),
            createOrganizationSchema({
                description:
                    'Saturnrealcon builds AI-first SaaS products for founders and fast-moving teams.',
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
                author: {
                    '@type': 'Person',
                    name: post.author || 'Saturnrealcon Team',
                },
                publisher: {
                    '@id': `${SITE_URL}/#organization`,
                },
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
