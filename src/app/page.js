// import HomeClient from '@/features/home/HomeClient';
import ProjectDetailPage from '@/features/projects/ProjectDetailPage';
import clientPromise from '@/lib/mongodb';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;




export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  let metaTitle = '';
  let metaDescription = '';
  let metaKeywords = [];

  let siteLogo = '';
  let siteName = '';

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

    const [doc, settings] = await Promise.all([
      db.collection('projects').findOne({ publishStatus: 'published', isHomePage: true })
        .then(d => d || db.collection('projects').findOne({ publishStatus: 'published' }, { sort: { createdAt: 1 } })),
      db.collection('settings').findOne({ type: 'brand' }),
    ]);

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
    alternates: {
      canonical: `${siteUrl}/`,
    },
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
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Page() {
  let project = null;
  let localBusinessSchema = null;
  let organizationSchema = null;

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

    const [doc, homepageSettings, brandSettings] = await Promise.all([
      db.collection('projects').findOne({ publishStatus: 'published', isHomePage: true })
        .then(d => d || db.collection('projects').findOne({ publishStatus: 'published' }, { sort: { createdAt: 1 } })),
      db.collection('homepage').findOne({}),
      db.collection('settings').findOne({ type: 'brand' }),
    ]);

    if (doc) {
      project = {
        ...doc,
        _id: doc._id?.toString?.() || doc._id,
        slug: doc.slug || doc._id?.toString?.(),
      };
    }

    // Build Organization schema from project structured fields + brand settings
    // Falls back to homepage-admin JSON textarea for any fields not set on the project
    let orgBase = {};
    if (homepageSettings?.organizationSchema) {
      try { orgBase = JSON.parse(homepageSettings.organizationSchema); } catch (e) {
        console.error('[home] Invalid organizationSchema JSON:', e.message);
      }
    }
    const orgName = project?.orgSchemaName || orgBase.name || brandSettings?.siteName || '';
    const sameAsRaw = project?.orgSchemaSameAs || orgBase.sameAs || '';
    const sameAs = Array.isArray(sameAsRaw)
      ? sameAsRaw
      : sameAsRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    const hasAddress = project?.orgSchemaStreetAddress || project?.orgSchemaAddressLocality ||
      project?.orgSchemaAddressRegion || project?.orgSchemaPostalCode || project?.orgSchemaAddressCountry;
    if (orgName) {
      organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: orgName,
        url: siteUrl + '/',
        ...(brandSettings?.siteLogo ? { logo: { '@type': 'ImageObject', url: brandSettings.siteLogo } } : {}),
        ...(brandSettings?.contactPhone ? { telephone: brandSettings.contactPhone } : {}),
        ...(project?.orgSchemaEmail || orgBase.email ? { email: project?.orgSchemaEmail || orgBase.email } : {}),
        ...(project?.orgSchemaDescription || orgBase.description ? { description: project?.orgSchemaDescription || orgBase.description } : {}),
        ...(hasAddress ? {
          address: {
            '@type': 'PostalAddress',
            ...(project?.orgSchemaStreetAddress ? { streetAddress: project.orgSchemaStreetAddress } : {}),
            ...(project?.orgSchemaAddressLocality ? { addressLocality: project.orgSchemaAddressLocality } : {}),
            ...(project?.orgSchemaAddressRegion ? { addressRegion: project.orgSchemaAddressRegion } : {}),
            ...(project?.orgSchemaPostalCode ? { postalCode: project.orgSchemaPostalCode } : {}),
            ...(project?.orgSchemaAddressCountry ? { addressCountry: project.orgSchemaAddressCountry } : {}),
          },
        } : (orgBase.address ? { address: orgBase.address } : {})),
        ...(sameAs.length ? { sameAs } : {}),
      };
    }

    // Build local business schema: start from admin-pasted JSON or a blank base
    let base = {};
    if (homepageSettings?.localBusinessSchema) {
      try {
        base = JSON.parse(homepageSettings.localBusinessSchema);
      } catch (e) {
        console.error('[home] Invalid localBusinessSchema JSON:', e.message);
      }
    }

    // Always inject live fields from dashboard so schema is never empty
    const hasContent = base['@type'] || base.name || brandSettings?.siteName || project?.title;
    if (hasContent) {
      base['@context'] = 'https://schema.org';
      base['@type'] = 'RealEstateAgent';
      if (!base.name) base.name = brandSettings?.siteName || project?.title || '';
      if (!base.url) base.url = siteUrl + '/';
      if (brandSettings?.contactPhone) base.telephone = brandSettings.contactPhone;
      if (project?.price && !base.priceRange) base.priceRange = project.price;
      if (!base.address && project?.projectAddress) {
        base.address = { '@type': 'PostalAddress', streetAddress: project.projectAddress };
      }
      localBusinessSchema = base;
    }
  } catch (error) {
    console.error('[home] Failed to fetch project:', error.message);
  }


  // Build Product schema from the homepage project if schema fields are present
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
      {organizationSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
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

