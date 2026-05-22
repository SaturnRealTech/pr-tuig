import { notFound } from 'next/navigation';
import { col, findOneByAnyId } from '@/lib/db';
import { processProject } from '@/lib/imageSeo';
import ProjectDetailPage from '@/features/projects/ProjectDetailPage';
import {
    SITE_URL,
    createBreadcrumbSchema,
    createPageMetadata,
} from '@/lib/seo';

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
                const description = project.metaDescription || project.description || project.title || '';
                return createPageMetadata({
                    title: project.metaTitle || `${project.title} - Saturn RealCon`,
                    description,
                    path: `/${slug}`,
                    keywords: project.keywords
                        ? String(project.keywords).split(',').map(k => k.trim()).filter(Boolean)
                        : [],
                    image: project.desktopBanner || project.mobileBanner,
                    type: 'article',
                });
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
