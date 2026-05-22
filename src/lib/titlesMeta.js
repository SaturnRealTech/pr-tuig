// Rank Math-style "Titles & Meta" engine. Stores per-post-type templates +
// settings under settings.brand.data.titlesMeta and exposes a tiny variable
// substitution helper used by every generateMetadata() call.
//
// Supported variables (mirror Rank Math where possible):
//   %title%        — post/page title
//   %excerpt%      — post excerpt (truncated to ~160 chars)
//   %sep%          — separator (default " — ")
//   %sitename%     — settings.brand.data.siteName
//   %sitedesc%     — settings.brand.data.footerTagline
//   %page%         — "Page N" (only when paginated; otherwise blank)
//   %currentyear%  — current year
//   %currentdate%  — today's ISO date
//   %category%     — primary category / taxonomy name (post only)
//   %author%       — author name
//   %seo_title%    — per-post SEO override (post.metaTitle)
//   %focuskw%      — per-post focus keyword
//   %url%          — full canonical URL

import { col } from '@/lib/db';

export const POST_TYPES = ['post', 'page', 'category'];

export const SCHEMA_TYPES = [
    { value: 'Article', label: 'Article' },
    { value: 'BlogPosting', label: 'Blog Post' },
    { value: 'NewsArticle', label: 'News Article' },
];

export const ARTICLE_TYPES = [
    { value: 'Article', label: 'Article' },
    { value: 'BlogPost', label: 'Blog Post' },
    { value: 'NewsArticle', label: 'News Article' },
];

export const BULK_EDITING_MODES = [
    { value: 'disabled', label: 'Disabled' },
    { value: 'enabled', label: 'Enabled' },
    { value: 'readonly', label: 'Read Only' },
];

export const WATERMARK_MODES = [
    { value: 'off', label: 'Off' },
    { value: 'play', label: 'Play icon' },
    { value: 'gif', label: 'GIF icon' },
];

// One default config per post type. Matches Rank Math's defaults closely so
// the admin UI starts in a known-good state.
const DEFAULT_TYPE_CONFIG = {
    title: '%title% %page% %sep% %sitename%',
    description: '%excerpt%',
    schemaType: 'Article',
    articleType: 'Article',
    headline: '%title%',
    schemaDescription: '%excerpt%',
    autodetectVideo: true,
    autogenerateImage: false,
    customRobotsMeta: false,
    robotsMeta: { index: true, follow: true, noarchive: false, nosnippet: false, noimageindex: false },
    linkSuggestions: true,
    linkSuggestionTitles: 'titles',          // 'titles' | 'keywords'
    primaryTaxonomy: '',                     // 'category' | 'tag' | etc.
    slackEnhancedSharing: true,
    addSeoControls: true,
    bulkEditing: 'enabled',                  // 'disabled' | 'enabled' | 'readonly'
    customFields: '',                        // newline-separated field names for analysis
    defaultThumbnailWatermark: 'off',        // 'off' | 'play' | 'gif'
};

export const DEFAULT_TITLES_META = {
    global: {
        separator: '—',                      // %sep%
        capitalizeTitle: false,
    },
    post: { ...DEFAULT_TYPE_CONFIG },
    page: { ...DEFAULT_TYPE_CONFIG, autodetectVideo: false, linkSuggestions: false },
    category: { ...DEFAULT_TYPE_CONFIG, schemaType: 'CollectionPage', articleType: 'Article' },
};

export async function readTitlesMeta() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const stored = row?.data?.titlesMeta || {};
        // Deep-merge per type so newly added fields get sensible defaults.
        const merged = { global: { ...DEFAULT_TITLES_META.global, ...(stored.global || {}) } };
        for (const t of POST_TYPES) {
            merged[t] = { ...DEFAULT_TYPE_CONFIG, ...DEFAULT_TITLES_META[t], ...(stored[t] || {}) };
            merged[t].robotsMeta = { ...DEFAULT_TYPE_CONFIG.robotsMeta, ...(stored[t]?.robotsMeta || {}) };
        }
        return merged;
    } catch {
        return JSON.parse(JSON.stringify(DEFAULT_TITLES_META));
    }
}

// Convenience for SSR: read the config for a single type without spreading.
export async function readTypeConfig(type) {
    const all = await readTitlesMeta();
    return { global: all.global, type: all[type] || DEFAULT_TYPE_CONFIG };
}

// ---------- Variable substitution ----------

function truncate(s, n) {
    if (!s) return '';
    const t = String(s).replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1).replace(/[ ,.;:!?]+$/, '') + '…' : t;
}

function stripHtml(s) {
    return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Build a context bag for substitution. `ctx` describes the current document
// being rendered; `brand` is settings.brand.data; `globalCfg` is titlesMeta.global.
export function applyVariables(template, { ctx = {}, brand = {}, globalCfg = {} } = {}) {
    if (!template || typeof template !== 'string') return '';
    const sep = globalCfg.separator || '—';
    const siteName = brand.siteName || '';
    const siteDesc = brand.footerTagline || brand.footerDescription || '';
    const excerptSource = ctx.excerpt || ctx.metaDescription || ctx.description || stripHtml(ctx.content);
    const excerpt = truncate(excerptSource, 160);
    const now = new Date();

    const map = {
        '%title%': ctx.title || '',
        '%seo_title%': ctx.metaTitle || ctx.seoTitle || ctx.title || '',
        '%excerpt%': excerpt,
        '%excerpt_only%': truncate(ctx.excerpt || '', 160),
        '%sep%': ` ${sep} `,
        '%sitename%': siteName,
        '%sitedesc%': siteDesc,
        '%page%': ctx.pageNumber && ctx.pageNumber > 1 ? `Page ${ctx.pageNumber}` : '',
        '%currentyear%': String(now.getFullYear()),
        '%currentdate%': now.toISOString().slice(0, 10),
        '%category%': ctx.category || '',
        '%tag%': ctx.tag || '',
        '%author%': ctx.author || '',
        '%focuskw%': ctx.focusKeyword || ctx.keywords?.split(',')[0]?.trim() || '',
        '%url%': ctx.url || '',
    };

    let out = template;
    for (const [k, v] of Object.entries(map)) {
        out = out.split(k).join(v);
    }
    // Collapse double separators (e.g. when %page% is empty: "Title  —  Site" → "Title — Site").
    out = out.replace(/\s+/g, ' ').replace(/(?:\s*[—\-|·]\s*){2,}/g, ` ${sep} `).trim();
    // Trim trailing separator: "Title — " → "Title".
    out = out.replace(new RegExp(`\\s*${sep.replace(/[.*+?^${}()|[\\\\]/g, '\\$&')}\\s*$`), '');
    return out;
}

// Convenience: build a {title, description} from one document at SSR time.
export async function buildSeoFor(type, ctx, brand = {}) {
    const { global: g, type: cfg } = await readTypeConfig(type);
    const title = applyVariables(cfg.title || DEFAULT_TYPE_CONFIG.title, { ctx, brand, globalCfg: g });
    const description = applyVariables(cfg.description || DEFAULT_TYPE_CONFIG.description, { ctx, brand, globalCfg: g });
    const headline = applyVariables(cfg.headline || '%title%', { ctx, brand, globalCfg: g });
    const schemaDescription = applyVariables(cfg.schemaDescription || '%excerpt%', { ctx, brand, globalCfg: g });
    return {
        title,
        description,
        headline,
        schemaDescription,
        schemaType: cfg.schemaType,
        articleType: cfg.articleType,
        robotsMeta: cfg.customRobotsMeta ? cfg.robotsMeta : null,
        autodetectVideo: !!cfg.autodetectVideo,
        autogenerateImage: !!cfg.autogenerateImage,
        defaultThumbnailWatermark: cfg.defaultThumbnailWatermark || 'off',
    };
}

export { DEFAULT_TYPE_CONFIG };

// ---------- Video detection (for autodetectVideo toggle) ----------
//
// Mirrors the same parser used in /video-sitemap.xml so the data shape is
// identical. Returns null when no embed is found in the given HTML.
const YT_RES = [
    /youtube\.com\/watch\?[^"'\s>]*v=([A-Za-z0-9_-]{6,})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/i,
];
const VIMEO_RE = /(?:vimeo\.com|player\.vimeo\.com\/video)\/(\d{5,})/i;

export function detectFirstVideo(html) {
    if (!html || typeof html !== 'string') return null;
    for (const re of YT_RES) {
        const m = html.match(re);
        if (m) {
            const id = m[1];
            return {
                provider: 'youtube',
                id,
                contentLoc: `https://www.youtube.com/watch?v=${id}`,
                playerLoc: `https://www.youtube.com/embed/${id}`,
                thumbnailLoc: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            };
        }
    }
    const vm = html.match(VIMEO_RE);
    if (vm) {
        const id = vm[1];
        return {
            provider: 'vimeo',
            id,
            contentLoc: `https://vimeo.com/${id}`,
            playerLoc: `https://player.vimeo.com/video/${id}`,
            thumbnailLoc: '',
        };
    }
    return null;
}

// Build a Google-acceptable `robots` meta string from a robotsMeta object.
// Used by generateMetadata when `customRobotsMeta` is on.
export function robotsMetaString(robotsMeta) {
    if (!robotsMeta) return null;
    const parts = [];
    parts.push(robotsMeta.index ? 'index' : 'noindex');
    parts.push(robotsMeta.follow ? 'follow' : 'nofollow');
    if (robotsMeta.noarchive) parts.push('noarchive');
    if (robotsMeta.nosnippet) parts.push('nosnippet');
    if (robotsMeta.noimageindex) parts.push('noimageindex');
    return parts.join(', ');
}
