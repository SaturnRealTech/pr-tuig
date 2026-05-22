// Local SEO — global business identity used to emit schema.org JSON-LD on
// the homepage AND on every project / blog page. Stored inside
// settings.brand.data.localSeo so it lives alongside the rest of the brand
// configuration (no extra collection).

import { col } from '@/lib/db';

export const SCHEMA_TYPES = [
    'Organization',
    'LocalBusiness',
    'RealEstateAgent',
    'Corporation',
    'NewsMediaOrganization',
];

export const DAYS = [
    { id: 'monday', label: 'Monday', schema: 'Monday' },
    { id: 'tuesday', label: 'Tuesday', schema: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday', schema: 'Wednesday' },
    { id: 'thursday', label: 'Thursday', schema: 'Thursday' },
    { id: 'friday', label: 'Friday', schema: 'Friday' },
    { id: 'saturday', label: 'Saturday', schema: 'Saturday' },
    { id: 'sunday', label: 'Sunday', schema: 'Sunday' },
];

export const DEFAULT_LOCAL_SEO = {
    schemaType: 'RealEstateAgent',
    name: '',
    alternateName: '',
    legalName: '',
    description: '',
    url: '',
    email: '',
    telephone: '',
    priceRange: '',
    foundingDate: '',
    logo: '',
    image: '',
    address: {
        streetAddress: '',
        addressLocality: '',
        addressRegion: '',
        postalCode: '',
        addressCountry: 'IN',
    },
    geo: { latitude: '', longitude: '' },
    sameAs: '',            // newline-separated URLs
    openingHours: [],      // [{ day, open, close, closed }]
};

export async function readLocalSeo() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const blob = row?.data || {};
        return { ...DEFAULT_LOCAL_SEO, ...(blob.localSeo || {}) };
    } catch {
        return { ...DEFAULT_LOCAL_SEO };
    }
}

// Build a single schema.org JSON-LD node from the stored settings. Returns
// null if the user hasn't filled in even a name — never emit empty schema.
export async function buildLocalBusinessSchema(siteUrl) {
    const cfg = await readLocalSeo();
    const name = (cfg.name || '').trim();
    if (!name) return null;

    const sameAs = (cfg.sameAs || '')
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);

    const hours = (Array.isArray(cfg.openingHours) ? cfg.openingHours : [])
        .filter(h => h && h.day && !h.closed && h.open && h.close)
        .map(h => {
            const day = DAYS.find(d => d.id === h.day);
            if (!day) return null;
            return {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: `https://schema.org/${day.schema}`,
                opens: h.open,
                closes: h.close,
            };
        })
        .filter(Boolean);

    const addressFilled = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry']
        .some(k => (cfg.address?.[k] || '').toString().trim() !== '');

    const node = {
        '@context': 'https://schema.org',
        '@type': cfg.schemaType || 'Organization',
        '@id': `${(siteUrl || '').replace(/\/$/, '')}/#organization`,
        name,
        url: (cfg.url || siteUrl || '').replace(/\/$/, '') + '/',
        ...(cfg.alternateName ? { alternateName: cfg.alternateName } : {}),
        ...(cfg.legalName ? { legalName: cfg.legalName } : {}),
        ...(cfg.description ? { description: cfg.description } : {}),
        ...(cfg.email ? { email: cfg.email } : {}),
        ...(cfg.telephone ? { telephone: cfg.telephone } : {}),
        ...(cfg.priceRange ? { priceRange: cfg.priceRange } : {}),
        ...(cfg.foundingDate ? { foundingDate: cfg.foundingDate } : {}),
        ...(cfg.logo ? { logo: { '@type': 'ImageObject', url: cfg.logo } } : {}),
        ...(cfg.image ? { image: cfg.image } : {}),
        ...(addressFilled ? {
            address: {
                '@type': 'PostalAddress',
                ...(cfg.address.streetAddress ? { streetAddress: cfg.address.streetAddress } : {}),
                ...(cfg.address.addressLocality ? { addressLocality: cfg.address.addressLocality } : {}),
                ...(cfg.address.addressRegion ? { addressRegion: cfg.address.addressRegion } : {}),
                ...(cfg.address.postalCode ? { postalCode: cfg.address.postalCode } : {}),
                ...(cfg.address.addressCountry ? { addressCountry: cfg.address.addressCountry } : {}),
            },
        } : {}),
        ...(cfg.geo?.latitude && cfg.geo?.longitude ? {
            geo: { '@type': 'GeoCoordinates', latitude: String(cfg.geo.latitude), longitude: String(cfg.geo.longitude) },
        } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(hours.length ? { openingHoursSpecification: hours } : {}),
    };

    return node;
}
