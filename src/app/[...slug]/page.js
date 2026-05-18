import { notFound } from 'next/navigation';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import ProjectDetailPage from '@/features/projects/ProjectDetailPage';
import {
    SITE_URL,
    createBreadcrumbSchema,
    createOrganizationSchema,
    createPageMetadata,
} from '@/lib/seo';

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeProject(project) {
    if (!project) return null;
    return {
        ...project,
        _id: project?._id?.toString?.() || project?._id,
        slug: project?.slug || (project?.id ? String(project.id) : project?._id?.toString?.()),
    };
}

function toIsoDate(value) {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getDb() {
    const client = await clientPromise;
    return client.db(process.env.DB_NAME || 'SaturnRealcon');
}

async function findProject(db, slug) {
    let project = await db.collection('projects').findOne({ slug });
    if (!project) {
        const numericId = Number(slug);
        if (!Number.isNaN(numericId)) {
            project = await db.collection('projects').findOne({ id: numericId });
        }
    }
    if (!project && ObjectId.isValid(slug)) {
        project = await db.collection('projects').findOne({ _id: new ObjectId(slug) });
    }
    return normalizeProject(project);
}

// ── Static params: projects only ─────────────────────────────────────────────

export async function generateStaticParams() {
    try {
        const db = await getDb();
        const projects = await db
            .collection('projects')
            .find({}, { projection: { slug: 1, id: 1, _id: 1 } })
            .toArray();

        return projects
            .map(p => normalizeProject(p)?.slug)
            .filter(s => s && !s.includes('/'))
            .map(s => ({ slug: [s] }));
    } catch {
        return [];
    }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
    const { slug: slugArr } = await params;
    const slug = slugArr.join('/');

    try {
        const db = await getDb();

        if (slugArr.length === 1) {
            const project = await findProject(db, slug);
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SlugPage({ params }) {
    const { slug: slugArr } = await params;
    const slug = slugArr.join('/');

    const db = await getDb();

    if (slugArr.length === 1) {
        const project = await findProject(db, slug);

        if (project) {
            db.collection('projects').updateOne(
                { slug: project.slug },
                { $inc: { views: 1 } }
            ).catch(() => { });

            const brandSettings = await db.collection('settings').findOne({ type: 'brand' }).catch(() => null);

            const projectPath = `/${slug}`;
            const publishedAt = toIsoDate(project.publishedAt || project.createdAt || project.date);

            // Build Organization schema from structured fields + brand settings
            const orgName = project.orgSchemaName || brandSettings?.siteName || '';
            const sameAsRaw = project.orgSchemaSameAs || '';
            const sameAs = (Array.isArray(sameAsRaw)
                ? sameAsRaw
                : sameAsRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean));
            const hasAddress = project.orgSchemaStreetAddress || project.orgSchemaAddressLocality ||
                project.orgSchemaAddressRegion || project.orgSchemaPostalCode || project.orgSchemaAddressCountry;
            const organizationSchema = orgName ? {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: orgName,
                url: SITE_URL + '/',
                ...(brandSettings?.siteLogo ? { logo: { '@type': 'ImageObject', url: brandSettings.siteLogo } } : {}),
                ...(brandSettings?.contactPhone ? { telephone: brandSettings.contactPhone } : {}),
                ...(project.orgSchemaEmail ? { email: project.orgSchemaEmail } : {}),
                ...(project.orgSchemaDescription ? { description: project.orgSchemaDescription } : {}),
                ...(hasAddress ? {
                    address: {
                        '@type': 'PostalAddress',
                        ...(project.orgSchemaStreetAddress ? { streetAddress: project.orgSchemaStreetAddress } : {}),
                        ...(project.orgSchemaAddressLocality ? { addressLocality: project.orgSchemaAddressLocality } : {}),
                        ...(project.orgSchemaAddressRegion ? { addressRegion: project.orgSchemaAddressRegion } : {}),
                        ...(project.orgSchemaPostalCode ? { postalCode: project.orgSchemaPostalCode } : {}),
                        ...(project.orgSchemaAddressCountry ? { addressCountry: project.orgSchemaAddressCountry } : {}),
                    },
                } : {}),
                ...(sameAs.length ? { sameAs } : {}),
            } : null;

            const projectGraphItems = [
                // createOrganizationSchema({ sameAs: ['https://www.linkedin.com/company/SaturnRealcon/'] }),
                // createBreadcrumbSchema([
                //     { name: 'Home', path: '/' },
                //     { name: project.title, path: projectPath },
                // ]),
                {
                    '@type': 'Product',
                    '@id': `${SITE_URL}${projectPath}/#product`,
                    name: project.schemaName || project.title,
                    description: project.schemaDescription || project.metaDescription || project.description || project.title,
                    url: `${SITE_URL}${projectPath}`,
                    image: [project.desktopBanner, project.mobileBanner].filter(Boolean),
                    // ...((project.schemaBrand || project.company) ? {
                    //     brand: { '@type': 'Brand', name: project.schemaBrand || project.company },
                    // } : {}),
                    ...(publishedAt ? { releaseDate: publishedAt } : {}),
                    // offers: {
                    //     '@type': 'Offer',
                    //     priceCurrency: project.schemaPriceCurrency || 'INR',
                    //     availability: `https://schema.org/${project.schemaAvailability || 'InStock'}`,
                    //     url: `${SITE_URL}${projectPath}`,
                    //     seller: { '@id': `${SITE_URL}/#organization` },
                    //     ...((project.schemaPrice || project.price) ? { price: project.schemaPrice || project.price } : {}),
                    // },
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
                    {organizationSchema && (
                        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
                    )}
                    <ProjectDetailPage project={project} />
                </>
            );
        }
    }

    notFound();
}
