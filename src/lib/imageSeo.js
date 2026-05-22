// Rank-Math-style Image SEO processor.
//
// Reads settings.brand.data.imageSeo from MongoDB and applies the configured
// rules to any HTML string that contains <img> tags, plus exposes a simple
// alt-text formatter for structured fields (gallery alt, amenity alt, etc.).
//
// Settings shape (all optional, all default to "no change"):
//   addMissing* (alt/title/caption/description/avatarAlt),
//   *Casing: 'none'|'lower'|'upper'|'title'|'sentence',
//   replacements: [{ find, replace, alt, title, caption }]

import { col } from '@/lib/db';

export const DEFAULT_IMAGE_SEO = {
    addMissingAlt: false,
    addMissingTitle: false,
    addMissingCaption: false,
    addMissingDescription: false,
    addAvatarAlt: false,
    titleCasing: 'none',
    altCasing: 'none',
    descriptionCasing: 'none',
    captionCasing: 'none',
    replacements: [],
};

let cache = null;
let cacheAt = 0;
const CACHE_MS = 30_000;

export async function getImageSeoSettings() {
    const now = Date.now();
    if (cache && now - cacheAt < CACHE_MS) return cache;
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const blob = row?.data || {};
        cache = { ...DEFAULT_IMAGE_SEO, ...(blob.imageSeo || {}) };
        cacheAt = now;
        return cache;
    } catch {
        return { ...DEFAULT_IMAGE_SEO };
    }
}

// Bust the cache after the admin saves new settings.
export function invalidateImageSeoCache() {
    cache = null;
    cacheAt = 0;
}

// -------------------- text utilities --------------------

function altFromSrc(src) {
    if (!src) return '';
    try {
        const path = src.split('?')[0].split('#')[0];
        const base = path.split('/').pop() || '';
        const noExt = base.replace(/\.[^.]+$/, '');
        return titleCase(noExt.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim());
    } catch {
        return '';
    }
}

function titleCase(s) {
    return String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function sentenceCase(s) {
    const t = String(s || '').toLowerCase().trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

function applyCasing(text, mode) {
    if (!text || !mode || mode === 'none') return text || '';
    switch (mode) {
        case 'lower': return String(text).toLowerCase();
        case 'upper': return String(text).toUpperCase();
        case 'title': return titleCase(text);
        case 'sentence': return sentenceCase(text);
        default: return text;
    }
}

function applyReplacements(text, target, settings) {
    if (!text || !Array.isArray(settings.replacements)) return text || '';
    let out = String(text);
    for (const r of settings.replacements) {
        if (!r || !r[target]) continue;
        const find = String(r.find || '');
        const replace = String(r.replace || '');
        if (!find) continue;
        const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        out = out.replace(re, replace);
    }
    return out;
}

// Sync variants — caller is responsible for passing settings (loaded via
// `await getImageSeoSettings()` once per request).
export function formatAlt(text, settings) {
    if (!settings) return text || '';
    return applyCasing(applyReplacements(text, 'alt', settings), settings.altCasing);
}
export function formatTitle(text, settings) {
    if (!settings) return text || '';
    return applyCasing(applyReplacements(text, 'title', settings), settings.titleCasing);
}
export function formatCaption(text, settings) {
    if (!settings) return text || '';
    return applyCasing(applyReplacements(text, 'caption', settings), settings.captionCasing);
}

// -------------------- HTML processor --------------------

function escapeAttr(v) {
    return String(v || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getAttr(tag, name) {
    const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i'));
    return m ? m[1] : null;
}

function setOrInsertAttr(tag, name, value) {
    const has = new RegExp(`\\b${name}\\s*=\\s*"[^"]*"`, 'i').test(tag);
    if (has) {
        return tag.replace(new RegExp(`\\b${name}\\s*=\\s*"[^"]*"`, 'i'), `${name}="${escapeAttr(value)}"`);
    }
    return tag.replace(/\s*\/?>$/, ` ${name}="${escapeAttr(value)}"$&`);
}

export function applyImageSeoToHtml(html, opts = {}) {
    if (!html || typeof html !== 'string') return html || '';
    const settings = opts.settings;
    if (!settings) return html;
    const postTitle = String(opts.postTitle || '').trim();

    return html.replace(/<img\b[^>]*>/gi, (tag) => {
        let next = tag;
        const src = getAttr(next, 'src') || '';

        const altRaw = getAttr(next, 'alt');
        let alt = altRaw == null ? null : altRaw;
        if ((alt == null || alt === '') && settings.addMissingAlt) {
            alt = altFromSrc(src) || postTitle || '';
        }
        if (alt != null) {
            alt = formatAlt(alt, settings);
            next = setOrInsertAttr(next, 'alt', alt);
        }

        const titleRaw = getAttr(next, 'title');
        let title = titleRaw;
        if ((title == null || title === '') && settings.addMissingTitle) {
            title = alt || altFromSrc(src) || postTitle || '';
        }
        if (title != null && title !== '') {
            title = formatTitle(title, settings);
            next = setOrInsertAttr(next, 'title', title);
        }

        if (settings.addMissingCaption) {
            const caption = formatCaption(alt || title || altFromSrc(src) || postTitle || '', settings);
            if (caption && !/<figure[\s\S]*<figcaption/i.test(tag)) {
                return `<figure>${next}<figcaption>${escapeAttr(caption)}</figcaption></figure>`;
            }
        }

        if (settings.addMissingDescription) {
            const desc = applyCasing(applyReplacements(alt || title || postTitle || '', 'alt', settings), settings.descriptionCasing);
            if (desc && !getAttr(next, 'aria-label')) {
                next = setOrInsertAttr(next, 'aria-label', desc);
            }
        }

        return next;
    });
}

// -------------------- high-level helpers (async) --------------------

function applyToHtml(html, settings, postTitle) {
    if (!html) return html;
    return applyImageSeoToHtml(html, { settings, postTitle });
}

export async function processProject(project) {
    if (!project || typeof project !== 'object') return project;
    const settings = await getImageSeoSettings();
    const postTitle = project.title || '';
    const html = (v) => applyToHtml(v, settings, postTitle);
    const alt = (v) => formatAlt(v, settings);

    const out = {
        ...project,
        content: html(project.content),
        keyHighlights: html(project.keyHighlights),
        amenitiesContent: html(project.amenitiesContent),
        configurations: html(project.configurations),
        contentImageAlt: alt(project.contentImageAlt),
    };

    if (Array.isArray(project.amenities)) {
        out.amenities = project.amenities.map(a => ({ ...a, alt: alt(a?.alt) }));
    }
    if (project.gallery) {
        out.gallery = {
            ...project.gallery,
            content: html(project.gallery.content),
            images: Array.isArray(project.gallery.images)
                ? project.gallery.images.map(g => ({ ...g, alt: alt(g?.alt) }))
                : project.gallery.images,
        };
    }
    if (project.masterFloorPlan) {
        const mp = project.masterFloorPlan;
        out.masterFloorPlan = {
            ...mp,
            content: html(mp.content),
            masterPlans: Array.isArray(mp.masterPlans) ? mp.masterPlans.map(p => ({ ...p, alt: alt(p?.alt) })) : mp.masterPlans,
            floorPlans: Array.isArray(mp.floorPlans) ? mp.floorPlans.map(p => ({ ...p, alt: alt(p?.alt) })) : mp.floorPlans,
        };
    }
    if (project.projectSpecifications) {
        const ps = project.projectSpecifications;
        out.projectSpecifications = {
            ...ps,
            content: html(ps.content),
            specs: Array.isArray(ps.specs) ? ps.specs.map(s => ({ ...s, content: html(s.content) })) : ps.specs,
        };
    }
    if (project.location) {
        out.location = { ...project.location, content: html(project.location.content) };
    }
    if (Array.isArray(project.faqs)) {
        out.faqs = project.faqs.map(f => ({ ...f, question: html(f?.question), answer: html(f?.answer) }));
    }
    if (Array.isArray(project.detailedOverview)) {
        out.detailedOverview = project.detailedOverview.map(b => ({
            ...b,
            content: html(b?.content),
            imageAlt: alt(b?.imageAlt),
        }));
    }
    return out;
}

export async function processBlogPost(post) {
    if (!post || typeof post !== 'object') return post;
    const settings = await getImageSeoSettings();
    const postTitle = post.title || '';
    return {
        ...post,
        content: applyImageSeoToHtml(post.content, { settings, postTitle }),
        heroImageAlt: formatAlt(post.heroImageAlt, settings),
    };
}
