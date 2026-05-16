export const SITE_URL = 'https://SaturnRealcon.com';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logos/SaturnRealcon.png`;

function toAbsoluteUrl(path) {
    if (!path) return SITE_URL;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${SITE_URL}${normalized}`;
}

export function createPageMetadata({
    title,
    description,
    path,
    keywords = [],
    image = DEFAULT_OG_IMAGE,
    siteName = 'SaturnRealcon',
    type = 'website',
}) {
    const canonical = toAbsoluteUrl(path);
    const resolvedImage = toAbsoluteUrl(image);

    return {
        title,
        description,
        ...(keywords.length ? { keywords } : {}),
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            url: canonical,
            siteName,
            type,
            images: [
                {
                    url: resolvedImage,
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
            images: [resolvedImage],
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export function createWebPageSchema({
    path,
    name,
    description,
    type = 'WebPage',
    isPartOfWebsite = true,
    aboutOrg = false,
}) {
    const url = toAbsoluteUrl(path);
    const schema = {
        '@type': type,
        '@id': `${url}/#webpage`,
        url,
        name,
        description,
        inLanguage: 'en',
    };

    if (isPartOfWebsite) {
        schema.isPartOf = { '@id': `${SITE_URL}/#website` };
    }

    if (aboutOrg) {
        schema.about = { '@id': `${SITE_URL}/#organization` };
    }

    return schema;
}

export function createOrganizationSchema({
    description,
    sameAs = [],
    contactPoint = [],
}) {
    return {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'SaturnRealcon',
        url: `${SITE_URL}/`,
        logo: {
            '@type': 'ImageObject',
            url: DEFAULT_OG_IMAGE,
        },
        ...(description ? { description } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(contactPoint.length ? { contactPoint } : {}),
    };
}

export function createBreadcrumbSchema(items = []) {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: toAbsoluteUrl(item.path),
        })),
    };
}
