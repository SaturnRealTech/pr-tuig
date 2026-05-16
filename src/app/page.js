// import HomeClient from '@/features/home/HomeClient';
import ProjectDetailPage from '@/features/projects/ProjectDetailPage';
import clientPromise from '@/lib/mongodb';

const siteUrl = 'https://SaturnRealcon.com';


const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: 'Saturn RealCon',
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
      name: 'Saturn RealCon',
      url: `${siteUrl}/`,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logos/SaturnRealcon.png`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
      sameAs: [
        'https://www.linkedin.com/company/SaturnRealcon/',
      ],
    },
    {
      '@type': 'RealEstateAgent',
      '@id': `${siteUrl}/#realestate`,
      name: 'Saturn RealCon',
      url: `${siteUrl}/`,
      image: `${siteUrl}/logos/SaturnRealcon.png`,
      description: 'Buy, sell, and rent verified residential and commercial properties across India. Expert agents, zero hassle.',
      areaServed: {
        '@type': 'Country',
        name: 'India',
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Real Estate Properties',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Residential Properties' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Commercial Properties' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Property Rentals' } },
        ],
      },
    },
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${siteUrl}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Properties',
      item: `${siteUrl}/projects`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Builders',
      item: `${siteUrl}/builders`,
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'Blog',
      item: `${siteUrl}/blog`,
    },
    {
      '@type': 'ListItem',
      position: 5,
      name: 'Contact',
      item: `${siteUrl}/contact`,
    },
  ],
};


export async function generateMetadata() {
  let metaTitle = '';
  let metaDescription = '';
  let metaKeywords = [];

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'SaturnRealcon');
    const homepage = await db.collection('homepage').findOne({}, { projection: { metaTitle: 1, metaDescription: 1, keywords: 1 } });
    metaTitle = homepage?.metaTitle || '';
    metaDescription = homepage?.metaDescription || '';
    metaKeywords = homepage?.keywords
      ? homepage.keywords.split(',').map(k => k.trim()).filter(Boolean)
      : [];
  } catch {}

  const title = metaTitle || 'Saturn RealCon — Buy, Sell & Rent Properties in India';
  const description = metaDescription || 'Discover verified residential and commercial properties across India. Expert agents, zero hassle. Trusted by 1000+ families.';
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
      siteName: 'SaturnRealcon',
      type: 'website',
      images: [
        {
          url: `${siteUrl}/logos/SaturnRealcon.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/logos/SaturnRealcon.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function Page() {
  let project = null;

  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'SaturnRealcon');

    let doc = await db
      .collection('projects')
      .findOne({ publishStatus: 'published', isHomePage: true });

    if (!doc) {
      doc = await db
        .collection('projects')
        .findOne({ publishStatus: 'published' }, { sort: { createdAt: 1 } });
    }

    if (doc) {
      project = {
        ...doc,
        _id: doc._id?.toString?.() || doc._id,
        slug: doc.slug || doc._id?.toString?.(),
      };
    }
  } catch (error) {
    console.error('[home] Failed to fetch project:', error.message);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProjectDetailPage project={project} isHome={true} />
    </>
  );

  /* Home page sections — commented out
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <HomeClient testimonials={testimonials} bannerSlides={bannerSlides} aboutSection={aboutSection} homeWriteup={homeWriteup} whyChooseUs={whyChooseUs} allProjects={allProjects} groupedCategories={groupedCategories} locationCategories={locationCategories} builderCategories={builderCategories} blogPosts={blogPosts} />
    </>
  );
  */
}

