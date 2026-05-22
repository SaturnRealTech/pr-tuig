import ProjectDetailPage from '@/features/projects/ProjectDetailPage';
import { col } from '@/lib/db';
import { processProject } from '@/lib/imageSeo';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const dynamic = 'force-dynamic';

async function loadHomepageProject() {
  const projects = await col('projects');
  return (
    (await projects.findOne({ publishStatus: 'published', isHomePage: true })) ||
    (await projects.findOne({ publishStatus: 'published' }, { sort: { createdAt: 1 } }))
  );
}

async function loadHomepageSettings() {
  const homepage = await col('homepage');
  const row = await homepage.findOne({});
  if (!row) return null;
  const data = row.data || {};
  return { ...data, localBusinessSchema: row.localBusinessSchema, organizationSchema: row.organizationSchema };
}

async function loadBrandSettings() {
  const settings = await col('settings');
  const row = await settings.findOne({ type: 'brand' });
  return row?.data || null;
}

export async function generateMetadata() {
  let metaTitle = '';
  let metaDescription = '';
  let metaKeywords = [];
  let siteLogo = '';
  let siteName = '';

  try {
    const doc = await loadHomepageProject();
    const settings = await loadBrandSettings();

    metaTitle = doc?.metaTitle || '';
    metaDescription = doc?.metaDescription || '';
    metaKeywords = doc?.keywords
      ? doc.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : [];

    if (settings?.siteLogo) siteLogo = settings.siteLogo;
    if (settings?.siteName) siteName = settings.siteName;
  } catch (err) {
    console.error('[SEO] error:', err.message);
  }

  const title = metaTitle;
  const description = metaDescription;
  const keywords = metaKeywords.length > 0 ? metaKeywords : [
    'real estate India',
    'buy property India',
    'sell property',
    'rent property',
    'Saturn RealCon',
    'verified properties',
  ];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `${siteUrl}/` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/`,
      siteName,
      type: 'website',
      ...(siteLogo && { images: [{ url: siteLogo, width: 1200, height: 630, alt: title }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(siteLogo && { images: [siteLogo] }),
    },
    robots: { index: true, follow: true },
  };
}

export default async function Page() {
  let project = null;
  let localBusinessSchema = null;

  try {
    const doc = await loadHomepageProject();
    const homepageSettings = await loadHomepageSettings();
    const brandSettings = await loadBrandSettings();

    if (doc) {
      project = await processProject({
        ...doc,
        _id: doc._id ? String(doc._id) : null,
        slug: doc.slug || (doc._id ? String(doc._id) : ''),
      });
    }

    // Build ONE combined RealEstateAgent schema (covers both LocalBusiness + Organization)
    let base = {};
    if (homepageSettings?.localBusinessSchema) {
      try { base = JSON.parse(homepageSettings.localBusinessSchema); } catch (e) {
        console.error('[home] Invalid localBusinessSchema JSON:', e.message);
      }
    }
    if (homepageSettings?.organizationSchema) {
      try {
        const orgJson = JSON.parse(homepageSettings.organizationSchema);
        Object.assign(base, orgJson);
      } catch { /* ignore */ }
    }

    const sameAsRaw = project?.orgSchemaSameAs || base.sameAs || '';
    const sameAs = Array.isArray(sameAsRaw)
      ? sameAsRaw
      : sameAsRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const hasStructuredAddress = project?.orgSchemaStreetAddress || project?.orgSchemaAddressLocality ||
      project?.orgSchemaAddressRegion || project?.orgSchemaPostalCode || project?.orgSchemaAddressCountry;

    base['@context'] = 'https://schema.org';
    base['@type'] = 'RealEstateAgent';
    base['@id'] = `${siteUrl}/#organization`;
    if (!base.name) base.name = project?.orgSchemaName || brandSettings?.siteName || project?.title || '';
    if (!base.url) base.url = siteUrl + '/';
    if (brandSettings?.siteLogo && !base.logo) base.logo = { '@type': 'ImageObject', url: brandSettings.siteLogo };
    if (brandSettings?.contactPhone) base.telephone = brandSettings.contactPhone;
    if (project?.price && !base.priceRange) base.priceRange = project.price;
    if (project?.orgSchemaEmail && !base.email) base.email = project.orgSchemaEmail;
    if (project?.orgSchemaDescription && !base.description) base.description = project.orgSchemaDescription;
    if (hasStructuredAddress) {
      base.address = {
        '@type': 'PostalAddress',
        ...(project.orgSchemaStreetAddress ? { streetAddress: project.orgSchemaStreetAddress } : {}),
        ...(project.orgSchemaAddressLocality ? { addressLocality: project.orgSchemaAddressLocality } : {}),
        ...(project.orgSchemaAddressRegion ? { addressRegion: project.orgSchemaAddressRegion } : {}),
        ...(project.orgSchemaPostalCode ? { postalCode: project.orgSchemaPostalCode } : {}),
        ...(project.orgSchemaAddressCountry ? { addressCountry: project.orgSchemaAddressCountry } : {}),
      };
    } else if (!base.address && project?.projectAddress) {
      base.address = { '@type': 'PostalAddress', streetAddress: project.projectAddress };
    }
    if (sameAs.length) base.sameAs = sameAs;
    if (base.name) localBusinessSchema = base;
  } catch (error) {
    console.error('[home] Failed to fetch project:', error.message);
  }

  let productSchema = null;
  if (project) {
    const projectUrl = `${siteUrl}/`;
    const publishedAt = project.publishedAt || project.createdAt || project.createdDate;
    const isoDate = publishedAt ? (() => { try { return new Date(publishedAt).toISOString(); } catch { return null; } })() : null;

    productSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${siteUrl}/#product`,
      name: project.schemaName || project.title,
      description: project.schemaDescription || project.metaDescription || project.description || project.title,
      url: projectUrl,
      image: [project.desktopBanner, project.mobileBanner].filter(Boolean),
      ...((project.schemaBrand || project.company) ? {
        brand: { '@type': 'Brand', name: project.schemaBrand || project.company },
      } : {}),
      ...(isoDate ? { releaseDate: isoDate } : {}),
      ...(project.schemaRatingValue && project.schemaRatingCount ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(project.schemaRatingValue),
          reviewCount: String(project.schemaRatingCount),
          bestRating: '5',
          worstRating: '1',
        },
      } : {}),
      additionalProperty: [
        ...((project.schemaLocation || project.projectAddress) ? [{ '@type': 'PropertyValue', name: 'Location', value: project.schemaLocation || project.projectAddress }] : []),
        ...((project.schemaPossession || project.possession) ? [{ '@type': 'PropertyValue', name: 'Possession', value: project.schemaPossession || project.possession }] : []),
      ],
    };
  }

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      {localBusinessSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      )}
      <ProjectDetailPage project={project} isHome={true} />
    </>
  );
}
