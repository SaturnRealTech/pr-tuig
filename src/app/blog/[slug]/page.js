import { notFound } from 'next/navigation';
import BlogDetailPage from '@/features/blog/BlogDetailPage';
import { col } from '@/lib/db';
import { processBlogPost } from '@/lib/imageSeo';
import { buildSeoFor, detectFirstVideo, robotsMetaString } from '@/lib/titlesMeta';
import { buildAttachedSchemas } from '@/lib/schemaTemplates';

async function loadBrand() {
    const settings = await col('settings');
    const row = await settings.findOne({ type: 'brand' });
    return row?.data || {};
}
import {
    SITE_URL,
    createBreadcrumbSchema,
    createOrganizationSchema,
    createPageMetadata,
    createWebPageSchema,
    loadOrgSchemaConfig,
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
    const row = await blogPosts.findOne({ slug });
    return normalizePost(row);
}

// Pick up to 4 related posts: same category first, then back-fill with the
// latest published posts so the section is never empty.
async function getRelatedPosts(post, limit = 4) {
    if (!post?._id) return [];
    const blogPosts = await col('blog_posts');
    const excludeFilter = { slug: { $ne: post.slug } };

    let rows = [];
    if (post.category) {
        rows = await blogPosts
            .find({ category: post.category, ...excludeFilter })
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(limit)
            .toArray();
    }

    if (rows.length < limit) {
        const excludeSlugs = [post.slug, ...rows.map(r => r.slug)].filter(Boolean);
        const fill = await blogPosts
            .find({ slug: { $nin: excludeSlugs } })
            .sort({ publishedAt: -1, createdAt: -1 })
            .limit(limit - rows.length)
            .toArray();
        rows = rows.concat(fill);
    }

    const normalized = await Promise.all(rows.map(normalizePost));
    return normalized.filter(Boolean);
}

export async function generateStaticParams() {
    try {
        const blogPosts = await col('blog_posts');
        const posts = await blogPosts.find({ slug: { $exists: true, $ne: '' } }).project({ slug: 1 }).toArray();
        return posts
            .map(p => p.slug)
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
            title: 'Blog Post Not Found',
            description: 'The requested blog post could not be found.',
            path: '/blog',
        });
    }

    const postPath = `/blog/${post.slug}`;
    const brand = await loadBrand();
    // Run the title/description through the Titles & Meta template engine.
    // Per-post overrides (post.metaTitle / metaDescription) still win.
    const seo = await buildSeoFor('post', {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        category: post.category,
        author: post.author,
        keywords: post.keywords,
    }, brand);

    // Per-post SEO overrides: the editor saves them under `post.seo.{title,description}`.
    // Older imports may use `post.metaTitle / metaDescription`. Honor both.
    const perPostTitle = post.metaTitle || post.seo?.title;
    const perPostDescription = post.metaDescription || post.seo?.description;

    // Fallback OG image when no heroImage exists. Per-post override wins:
    // 'on' forces auto-gen, 'off' disables it, anything else inherits the
    // post-type default from Titles & Meta.
    const override = post.autogenerateImageOverride;
    const shouldGenerate = override === 'on'
        ? true
        : override === 'off'
            ? false
            : !!seo.autogenerateImage;
    const image = post.heroImage || post.image
        || (shouldGenerate
            ? `/api/og-image?title=${encodeURIComponent(post.title || '')}&subtitle=${encodeURIComponent(post.category || '')}&watermark=${encodeURIComponent(seo.defaultThumbnailWatermark || 'off')}`
            : undefined);

    const meta = createPageMetadata({
        title: perPostTitle || seo.title,
        description: perPostDescription || seo.description || post.excerpt,
        path: postPath,
        keywords: post.keywords
            ? String(post.keywords).split(',').map((k) => k.trim()).filter(Boolean)
            : [],
        image,
        siteName: brand?.siteName,
        type: 'article',
    });

    const robots = robotsMetaString(post.robotsMeta || seo.robotsMeta);
    if (robots) meta.robots = robots;
    return meta;
}

export default async function BlogDetailRoute({ params }) {
    const resolvedParams = params?.then ? await params : params;
    const post = await getPostBySlug(resolvedParams.slug);

    if (!post) notFound();

    const postPath = `/blog/${post.slug}`;
    const publishedAt = toIsoDate(post.publishedAt || post.createdAt || post.date);
    const modifiedAt = toIsoDate(post.updatedAt || post.modifiedAt || post.createdAt || post.date);

    // Resolve the configured schema type + templated strings for this type.
    const brandForGraph = await loadBrand();
    const seoGraph = await buildSeoFor('post', {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        category: post.category,
        author: post.author,
        keywords: post.keywords,
    }, brandForGraph);

    const articleNode = {
        '@type': seoGraph.articleType || 'BlogPosting',
        mainEntityOfPage: `${SITE_URL}${postPath}`,
        headline: seoGraph.headline || post.title,
        description: seoGraph.schemaDescription || post.metaDescription || post.excerpt || post.title,
        articleSection: post.category,
        image: post.heroImage || post.image,
        ...(publishedAt ? { datePublished: publishedAt } : {}),
        ...(modifiedAt ? { dateModified: modifiedAt } : {}),
        ...(post.author ? { author: { '@type': 'Person', name: post.author } } : {}),
        publisher: { '@id': `${SITE_URL}/#organization` },
    };

    const graph = [
        createWebPageSchema({
            path: postPath,
            name: post.title,
            description: post.metaDescription || post.excerpt || post.title,
            type: 'WebPage',
            aboutOrg: true,
        }),
        createOrganizationSchema(await loadOrgSchemaConfig()),
        createBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: postPath },
        ]),
        articleNode,
    ];

    // Autodetect Video — emit a VideoObject for the first YouTube / Vimeo
    // embed inside the post content, if the type toggle is on.
    if (seoGraph.autodetectVideo) {
        const v = detectFirstVideo(post.content);
        if (v) {
            graph.push({
                '@type': 'VideoObject',
                name: post.title,
                description: seoGraph.schemaDescription || post.excerpt || post.title,
                ...(v.thumbnailLoc ? { thumbnailUrl: v.thumbnailLoc } : {}),
                contentUrl: v.contentLoc,
                embedUrl: v.playerLoc,
                ...(publishedAt ? { uploadDate: publishedAt } : {}),
            });
        }
    }

    // Push every Schema Template attached to this post (or to "all blog posts")
    // into the @graph so the JSON-LD ships with the page.
    const attached = await buildAttachedSchemas('blog', post);
    for (const node of attached) graph.push(node);

    const blogSchema = { '@context': 'https://schema.org', '@graph': graph };

    const relatedPosts = await getRelatedPosts(post, 4);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
            />
            <BlogDetailPage post={post} relatedPosts={relatedPosts} />
        </>
    );
}
