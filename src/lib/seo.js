export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
export const DEFAULT_OG_IMAGE = process.env.NEXT_PUBLIC_DEFAULT_OG_IMAGE || '';

function toAbsoluteUrl(path) {
    if (!path) return SITE_URL;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${SITE_URL}${normalized}`;
}

// Loads brand + admin organization-schema JSON from the DB. Used by callers
// of createOrganizationSchema() so they can pass `siteName`, `logo`,
// `description`, `sameAs`, etc., without hardcoding anything.
export async function loadOrgSchemaConfig() {
    try {
        const { col } = await import('./db');
        const [settings, pages] = await Promise.all([col('settings'), col('pages')]);
        const [brandRow, homepageRow] = await Promise.all([
            settings.findOne({ type: 'brand' }),
            pages.findOne({ type: 'homepage' }),
        ]);
        const brand = brandRow?.data || {};
        let orgJson = {};
        const raw = homepageRow?.organizationSchema || homepageRow?.data?.organizationSchema;
        if (raw && typeof raw === 'string') {
            try { orgJson = JSON.parse(raw); } catch { /* invalid JSON — ignore */ }
        } else if (raw && typeof raw === 'object') {
            orgJson = raw;
        }
        return {
            siteName: brand.siteName || '',
            logo: brand.logo || brand.headerLogo || '',
            description: orgJson.description || '',
            sameAs: Array.isArray(orgJson.sameAs) ? orgJson.sameAs : [],
            email: orgJson.email || '',
            contactPoint: Array.isArray(orgJson.contactPoint) ? orgJson.contactPoint : [],
        };
    } catch {
        return { siteName: '', logo: '', description: '', sameAs: [], email: '', contactPoint: [] };
    }
}

export function createPageMetadata({
    title,
    description,
    path,
    keywords = [],
    image,
    siteName,
    type = 'website',
}) {
    const canonical = toAbsoluteUrl(path);
    const resolvedImage = image ? toAbsoluteUrl(image) : '';
    const images = resolvedImage
        ? [{ url: resolvedImage, width: 1200, height: 630, alt: title }]
        : [];

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
            ...(siteName ? { siteName } : {}),
            type,
            ...(images.length ? { images } : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...(images.length ? { images: [resolvedImage] } : {}),
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

// All fields are caller-supplied — typically from loadOrgSchemaConfig() which
// reads them out of admin brand settings + the homepage organizationSchema JSON.
// If the admin hasn't filled a field in, it's simply omitted from the schema.
export function createOrganizationSchema({
    name,
    logo,
    description,
    sameAs = [],
    contactPoint = [],
    email,
} = {}) {
    const schema = {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        url: `${SITE_URL}/`,
    };
    if (name) schema.name = name;
    if (logo) schema.logo = { '@type': 'ImageObject', url: toAbsoluteUrl(logo) };
    if (description) schema.description = description;
    if (email) schema.email = email;
    if (sameAs.length) schema.sameAs = sameAs;
    if (contactPoint.length) schema.contactPoint = contactPoint;
    return schema;
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
