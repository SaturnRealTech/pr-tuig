import { notFound } from 'next/navigation';
import { col, findOneByAnyId } from '@/lib/db';
import { processProject } from '@/lib/imageSeo';
import ProjectDetailPage from '@/features/projects/ProjectDetailPage';
import {
    SITE_URL,
    createBreadcrumbSchema,
    createPageMetadata,
} from '@/lib/seo';
import { buildSeoFor, detectFirstVideo, robotsMetaString } from '@/lib/titlesMeta';
import { buildAttachedSchemas } from '@/lib/schemaTemplates';

async function loadBrand() {
    const settings = await col('settings');
    const row = await settings.findOne({ type: 'brand' });
    return row?.data || {};
}

async function normalizeProject(project) {
    if (!project) return null;
    return processProject({
        ...project,
        _id: project._id ? String(project._id) : null,
        slug: project.slug || (project._id ? String(project._id) : ''),
    });
}

function toIsoDate(value) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

async function findProjectByAny(slug) {
    const projects = await col('projects');
    let row = await projects.findOne({ slug });
    if (!row) row = await findOneByAnyId('projects', slug);
    return normalizeProject(row);
}

export async function generateStaticParams() {
    try {
        const projects = await col('projects');
        const rows = await projects.find({}).project({ slug: 1, _id: 1 }).toArray();
        return rows
            .map(r => r.slug || (r._id ? String(r._id) : null))
            .filter(s => s && !String(s).includes('/'))
            .map(s => ({ slug: [String(s)] }));
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }) {
    const { slug: slugArr } = await params;
    const slug = slugArr.join('/');

    try {
        if (slugArr.length === 1) {
            const project = await findProjectByAny(slug);
            if (project) {
                const brand = await loadBrand();
                // Pages-type SEO template. Per-project overrides (metaTitle /
                // metaDescription) still win.
                const seo = await buildSeoFor('page', {
                    title: project.title,
                    excerpt: project.shortOverview,
                    content: project.content,
                    metaTitle: project.metaTitle,
                    metaDescription: project.metaDescription,
                    author: project.company,
                    keywords: project.keywords,
                }, brand);
                // Per-project override wins over the type-level default.
                const projOverride = project.autogenerateImageOverride;
                const projShouldGenerate = projOverride === 'on'
                    ? true
                    : projOverride === 'off'
                        ? false
                        : !!seo.autogenerateImage;
                const image = project.desktopBanner || project.mobileBanner
                    || (projShouldGenerate
                        ? `/api/og-image?title=${encodeURIComponent(project.title || '')}&subtitle=${encodeURIComponent(project.company || project.projectAddress || '')}&watermark=${encodeURIComponent(seo.defaultThumbnailWatermark || 'off')}`
                        : undefined);
                const meta = createPageMetadata({
                    title: project.metaTitle || seo.title,
                    description: project.metaDescription || seo.description || project.description || project.title || '',
                    path: `/${slug}`,
                    keywords: project.keywords
                        ? String(project.keywords).split(',').map(k => k.trim()).filter(Boolean)
                        : [],
                    image,
                    type: 'article',
                });
                // Per-project override wins over the type-level default.
                const robots = robotsMetaString(project.robotsMeta || seo.robotsMeta);
                if (robots) meta.robots = robots;
                return meta;
            }
        }
        return { title: 'Saturn RealCon' };
    } catch {
        return { title: 'Saturn RealCon' };
    }
}

export default async function SlugPage({ params }) {
    const { slug: slugArr } = await params;
    const slug = slugArr.join('/');

    if (slugArr.length === 1) {
        const project = await findProjectByAny(slug);

        if (project) {
            // Fire-and-forget view counter; ignore failures.
            try {
                const projects = await col('projects');
                await projects.updateOne({ _id: project._id }, { $inc: { views: 1 } });
            } catch { /* ignore */ }

            const projectPath = `/${slug}`;
            const publishedAt = toIsoDate(project.publishedAt || project.createdAt || project.date);

            const projectGraphItems = [
                createBreadcrumbSchema([
                    { name: 'Home', path: '/' },
                    { name: project.title, path: projectPath },
                ]),
                {
                    '@type': 'Product',
                    '@id': `${SITE_URL}${projectPath}/#product`,
                    name: project.schemaName || project.title,
                    description: project.schemaDescription || project.metaDescription || project.description || project.title,
                    url: `${SITE_URL}${projectPath}`,
                    image: [project.desktopBanner, project.mobileBanner].filter(Boolean),
                    ...(publishedAt ? { releaseDate: publishedAt } : {}),
                    additionalProperty: [
                        ...((project.schemaLocation || project.projectAddress) ? [{ '@type': 'PropertyValue', name: 'Location', value: project.schemaLocation || project.projectAddress }] : []),
                        ...((project.schemaPossession || project.possession) ? [{ '@type': 'PropertyValue', name: 'Possession', value: project.schemaPossession || project.possession }] : []),
                    ],
                    ...(project.schemaRatingValue && project.schemaRatingCount ? {
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: String(project.schemaRatingValue),
                            reviewCount: String(project.schemaRatingCount),
                            bestRating: '5',
                            worstRating: '1',
                        },
                    } : {}),
                },
            ];

            if (Array.isArray(project.faqs) && project.faqs.length > 0) {
                projectGraphItems.push({
                    '@type': 'FAQPage',
                    mainEntity: project.faqs.map(faq => ({
                        '@type': 'Question',
                        name: faq.question,
                        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                    })),
                });
            }

            // Autodetect Video — scan the project's rich-text fields for
            // YouTube / Vimeo embeds and emit a VideoObject when found.
            const brandForVideo = await loadBrand();
            const seoForVideo = await buildSeoFor('page', {
                title: project.title,
                excerpt: project.shortOverview,
                content: project.content,
                metaTitle: project.metaTitle,
                metaDescription: project.metaDescription,
            }, brandForVideo);
            if (seoForVideo.autodetectVideo) {
                const v =
                    detectFirstVideo(project.walkthroughUrl) ||
                    detectFirstVideo(project.content) ||
                    detectFirstVideo(project.detailedOverview && project.detailedOverview.map(d => d?.content).join(' '));
                if (v) {
                    projectGraphItems.push({
                        '@type': 'VideoObject',
                        name: project.walkthroughTitle || `${project.title} walkthrough`,
                        description: seoForVideo.schemaDescription || project.shortOverview || project.title,
                        ...(v.thumbnailLoc ? { thumbnailUrl: v.thumbnailLoc } : {}),
                        contentUrl: v.contentLoc,
                        embedUrl: v.playerLoc,
                        ...(publishedAt ? { uploadDate: publishedAt } : {}),
                    });
                }
            }

            // Push every Schema Template attached to this project (or to
            // "all projects") into the @graph.
            const attached = await buildAttachedSchemas('project', project);
            for (const node of attached) projectGraphItems.push(node);

            const schema = {
                '@context': 'https://schema.org',
                '@graph': projectGraphItems,
            };

            return (
                <>
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
                    <ProjectDetailPage project={project} />
                </>
            );
        }
    }

    notFound();
}
