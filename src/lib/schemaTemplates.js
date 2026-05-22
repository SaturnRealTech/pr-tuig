// Schema Templates — Rank Math's "Structured Data" library. Admin authors a
// reusable schema (FAQ / HowTo / Recipe / Event / LocalBusiness / Article),
// attaches it to one or more blog posts and/or projects, and the SSR layer
// emits the JSON-LD on those pages.
//
// Stored as its own MongoDB collection: `schema_templates`.
//
// Document shape:
//   {
//     _id, name, schemaType, fields, attachTo: {
//       posts: [postId|slug], projects: [projectId|slug],
//       allBlogPosts: bool, allProjects: bool,
//     },
//     createdAt, updatedAt,
//   }

import { col, ObjectId } from '@/lib/db';

export const SCHEMA_TYPES = [
    { value: 'FAQPage',      label: 'FAQ',           hint: 'Question + answer accordion' },
    { value: 'HowTo',        label: 'How-To',        hint: 'Step-by-step guide' },
    { value: 'Recipe',       label: 'Recipe',        hint: 'Recipe with ingredients + steps' },
    { value: 'Event',        label: 'Event',         hint: 'Event with date + location' },
    { value: 'Article',      label: 'Article',       hint: 'Generic article schema' },
    { value: 'LocalBusiness',label: 'Local Business',hint: 'Business profile schema' },
    { value: 'Product',      label: 'Product',       hint: 'Product schema (price + rating)' },
    { value: 'Review',       label: 'Review',        hint: 'Standalone review' },
];

// Per-schema-type default field shape. Used as the form skeleton in admin.
export const DEFAULT_FIELDS = {
    FAQPage: {
        questions: [{ question: '', answer: '' }],
    },
    HowTo: {
        name: '',
        description: '',
        totalTime: '',     // ISO-8601 duration e.g. PT30M
        steps: [{ name: '', text: '', image: '' }],
    },
    Recipe: {
        name: '',
        description: '',
        recipeYield: '',
        totalTime: '',
        recipeIngredient: [''],
        recipeInstructions: [{ name: '', text: '' }],
        nutrition: { calories: '' },
    },
    Event: {
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        eventStatus: 'EventScheduled',
        eventAttendanceMode: 'OfflineEventAttendanceMode',
        location: { name: '', streetAddress: '', addressLocality: '', addressRegion: '', postalCode: '', addressCountry: 'IN' },
        organizer: { name: '', url: '' },
        offers: { price: '', priceCurrency: 'INR', url: '', availability: 'InStock' },
    },
    Article: {
        headline: '',
        description: '',
        author: '',
        datePublished: '',
        image: '',
    },
    LocalBusiness: {
        name: '',
        description: '',
        telephone: '',
        priceRange: '',
        address: { streetAddress: '', addressLocality: '', addressRegion: '', postalCode: '', addressCountry: 'IN' },
        geo: { latitude: '', longitude: '' },
    },
    Product: {
        name: '',
        description: '',
        sku: '',
        brand: '',
        offers: { price: '', priceCurrency: 'INR', availability: 'InStock' },
        aggregateRating: { ratingValue: '', reviewCount: '' },
    },
    Review: {
        itemReviewed: { name: '', type: 'Thing' },
        author: '',
        reviewBody: '',
        reviewRating: { ratingValue: '', bestRating: '5', worstRating: '1' },
    },
};

export function emptyAttachTo() {
    return { posts: [], projects: [], allBlogPosts: false, allProjects: false };
}

// Build the JSON-LD node for one template. Strips empty values so the emitted
// node stays clean.
export function renderTemplate(tpl) {
    if (!tpl || !tpl.schemaType) return null;
    const fields = tpl.fields || {};
    const base = { '@context': 'https://schema.org', '@type': tpl.schemaType };
    switch (tpl.schemaType) {
        case 'FAQPage': {
            const qs = (fields.questions || [])
                .filter(q => (q?.question || '').trim() && (q?.answer || '').trim())
                .map(q => ({
                    '@type': 'Question',
                    name: q.question.trim(),
                    acceptedAnswer: { '@type': 'Answer', text: q.answer.trim() },
                }));
            if (qs.length === 0) return null;
            return { ...base, mainEntity: qs };
        }
        case 'HowTo': {
            const steps = (fields.steps || [])
                .filter(s => (s?.name || s?.text || '').trim())
                .map((s, i) => ({
                    '@type': 'HowToStep',
                    position: i + 1,
                    ...(s.name ? { name: s.name } : {}),
                    ...(s.text ? { text: s.text } : {}),
                    ...(s.image ? { image: s.image } : {}),
                }));
            if (steps.length === 0) return null;
            return omitEmpty({
                ...base,
                name: fields.name,
                description: fields.description,
                totalTime: fields.totalTime,
                step: steps,
            });
        }
        case 'Recipe': {
            const ingredients = (fields.recipeIngredient || []).filter(s => (s || '').trim());
            const instructions = (fields.recipeInstructions || [])
                .filter(s => (s?.text || '').trim())
                .map((s, i) => ({ '@type': 'HowToStep', position: i + 1, ...(s.name ? { name: s.name } : {}), text: s.text }));
            return omitEmpty({
                ...base,
                name: fields.name,
                description: fields.description,
                recipeYield: fields.recipeYield,
                totalTime: fields.totalTime,
                recipeIngredient: ingredients.length ? ingredients : undefined,
                recipeInstructions: instructions.length ? instructions : undefined,
                nutrition: fields.nutrition?.calories ? { '@type': 'NutritionInformation', calories: fields.nutrition.calories } : undefined,
            });
        }
        case 'Event': {
            return omitEmpty({
                ...base,
                name: fields.name,
                description: fields.description,
                startDate: fields.startDate,
                endDate: fields.endDate,
                eventStatus: fields.eventStatus ? `https://schema.org/${fields.eventStatus}` : undefined,
                eventAttendanceMode: fields.eventAttendanceMode ? `https://schema.org/${fields.eventAttendanceMode}` : undefined,
                location: hasAddress(fields.location) ? {
                    '@type': 'Place',
                    name: fields.location?.name || undefined,
                    address: omitEmpty({
                        '@type': 'PostalAddress',
                        streetAddress: fields.location?.streetAddress,
                        addressLocality: fields.location?.addressLocality,
                        addressRegion: fields.location?.addressRegion,
                        postalCode: fields.location?.postalCode,
                        addressCountry: fields.location?.addressCountry,
                    }),
                } : undefined,
                organizer: (fields.organizer?.name || fields.organizer?.url) ? omitEmpty({
                    '@type': 'Organization',
                    name: fields.organizer.name,
                    url: fields.organizer.url,
                }) : undefined,
                offers: fields.offers?.price ? omitEmpty({
                    '@type': 'Offer',
                    price: String(fields.offers.price),
                    priceCurrency: fields.offers.priceCurrency || 'INR',
                    url: fields.offers.url,
                    availability: fields.offers.availability ? `https://schema.org/${fields.offers.availability}` : undefined,
                }) : undefined,
            });
        }
        case 'Article':
            return omitEmpty({
                ...base,
                headline: fields.headline,
                description: fields.description,
                author: fields.author ? { '@type': 'Person', name: fields.author } : undefined,
                datePublished: fields.datePublished,
                image: fields.image,
            });
        case 'LocalBusiness':
            return omitEmpty({
                ...base,
                name: fields.name,
                description: fields.description,
                telephone: fields.telephone,
                priceRange: fields.priceRange,
                address: hasAddress(fields.address) ? omitEmpty({
                    '@type': 'PostalAddress', ...fields.address,
                }) : undefined,
                geo: (fields.geo?.latitude && fields.geo?.longitude) ? {
                    '@type': 'GeoCoordinates',
                    latitude: String(fields.geo.latitude),
                    longitude: String(fields.geo.longitude),
                } : undefined,
            });
        case 'Product':
            return omitEmpty({
                ...base,
                name: fields.name,
                description: fields.description,
                sku: fields.sku,
                brand: fields.brand ? { '@type': 'Brand', name: fields.brand } : undefined,
                offers: fields.offers?.price ? omitEmpty({
                    '@type': 'Offer',
                    price: String(fields.offers.price),
                    priceCurrency: fields.offers.priceCurrency || 'INR',
                    availability: fields.offers.availability ? `https://schema.org/${fields.offers.availability}` : undefined,
                }) : undefined,
                aggregateRating: (fields.aggregateRating?.ratingValue && fields.aggregateRating?.reviewCount) ? {
                    '@type': 'AggregateRating',
                    ratingValue: String(fields.aggregateRating.ratingValue),
                    reviewCount: String(fields.aggregateRating.reviewCount),
                    bestRating: '5',
                    worstRating: '1',
                } : undefined,
            });
        case 'Review':
            return omitEmpty({
                ...base,
                itemReviewed: fields.itemReviewed?.name ? {
                    '@type': fields.itemReviewed.type || 'Thing',
                    name: fields.itemReviewed.name,
                } : undefined,
                author: fields.author ? { '@type': 'Person', name: fields.author } : undefined,
                reviewBody: fields.reviewBody,
                reviewRating: fields.reviewRating?.ratingValue ? {
                    '@type': 'Rating',
                    ratingValue: String(fields.reviewRating.ratingValue),
                    bestRating: fields.reviewRating.bestRating || '5',
                    worstRating: fields.reviewRating.worstRating || '1',
                } : undefined,
            });
        default:
            return null;
    }
}

function hasAddress(a) {
    if (!a) return false;
    return Object.values(a).some(v => (v || '').toString().trim() !== '');
}

function omitEmpty(obj) {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v == null) continue;
        if (typeof v === 'string' && v.trim() === '') continue;
        if (Array.isArray(v) && v.length === 0) continue;
        if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) continue;
        out[k] = v;
    }
    return out;
}

// Fetch every template that applies to one record. Considers BOTH sides of
// the attachment relationship:
//   1. Template-side: template.attachTo.posts / projects contain this
//      record's _id or slug, OR attachTo.allBlogPosts / allProjects is on.
//   2. Record-side: record.schemaTemplates is an array of template _id values
//      the editor picked from the post / project edit page.
//
// `kind` is 'blog' or 'project'.
export async function templatesFor(kind, record) {
    if (!record) return [];
    const tpls = await col('schema_templates');
    const idStr = record._id ? String(record._id) : null;
    const slug = record.slug || idStr || '';
    const ids = [idStr, slug].filter(Boolean);

    // Record-side: build both string-id and ObjectId variants so we match
    // however the template _id ended up serialised on the post.
    const recordTpls = Array.isArray(record.schemaTemplates) ? record.schemaTemplates.filter(Boolean) : [];
    const recordTplStrings = recordTpls.map(String);
    const recordTplObjectIds = recordTpls
        .map(v => { try { return new ObjectId(String(v)); } catch { return null; } })
        .filter(Boolean);

    const ors = [];
    if (kind === 'blog') {
        ors.push({ 'attachTo.allBlogPosts': true });
        if (ids.length) ors.push({ 'attachTo.posts': { $in: ids } });
    } else {
        ors.push({ 'attachTo.allProjects': true });
        if (ids.length) ors.push({ 'attachTo.projects': { $in: ids } });
    }
    if (recordTplStrings.length) ors.push({ _id: { $in: recordTplStrings } });
    if (recordTplObjectIds.length) ors.push({ _id: { $in: recordTplObjectIds } });

    if (ors.length === 0) return [];
    return tpls.find({ $or: ors }).toArray();
}

// One-shot: build the JSON-LD nodes for every template attached to a record.
export async function buildAttachedSchemas(kind, record) {
    const tpls = await templatesFor(kind, record);
    return tpls.map(renderTemplate).filter(Boolean);
}
