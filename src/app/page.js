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
  let siteName = '';
  let siteLogo = '';

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

    const [doc, settings] = await Promise.all([
      db.collection('projects').findOne({ publishStatus: 'published', isHomePage: true })
        .then(d => d || db.collection('projects').findOne({ publishStatus: 'published' }, { sort: { createdAt: 1 } })),
      db.collection('settings').findOne({ type: 'brand' }),
    ]);

    if (doc) {
      project = {
        ...doc,
        _id: doc._id?.toString?.() || doc._id,
        slug: doc.slug || doc._id?.toString?.(),
      };
    }
    siteName = settings?.siteName || '';
    siteLogo = settings?.siteLogo || '';
  } catch (error) {
    console.error('[home] Failed to fetch project:', error.message);
  }

  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        inLanguage: 'en',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}/projects?search={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        '@id': `${siteUrl}/#organization`,
        name: siteName,
        url: `${siteUrl}/`,
        ...(siteLogo && { logo: { '@type': 'ImageObject', url: siteLogo } }),
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          areaServed: 'IN',
          availableLanguage: ['English', 'Hindi'],
        },
      },
      {
        '@type': 'RealEstateAgent',
        '@id': `${siteUrl}/#realestate`,
        name: siteName,
        url: `${siteUrl}/`,
        ...(siteLogo && { image: siteLogo }),
        areaServed: { '@type': 'Country', name: 'India' },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <ProjectDetailPage project={project} isHome={true} />
    </>
  );
}

