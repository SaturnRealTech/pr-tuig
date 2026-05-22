// Video Sitemap settings + scanner. Mirrors Rank Math's Video Sitemap module:
// hide toggle, per-post-type opt-in, optional YouTube API enrichment and a
// list of custom field names that the scanner should also check for video
// embeds. Stored under settings.brand.data.videoSitemap.

import { col } from '@/lib/db';

export const POST_TYPES = [
    { id: 'blogs', label: 'Blogs', table: 'blog_posts' },
    { id: 'projects', label: 'Pages / Projects', table: 'projects' },
];

export const DEFAULT_VIDEO_SITEMAP = {
    hideSitemap: false,
    postTypes: { blogs: true, projects: true },
    youtubeApiKey: '',
    customFields: [],   // additional column names to also scan
};

export async function readVideoSitemap() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const blob = row?.data || {};
        const stored = blob.videoSitemap || {};
        return {
            ...DEFAULT_VIDEO_SITEMAP,
            ...stored,
            postTypes: { ...DEFAULT_VIDEO_SITEMAP.postTypes, ...(stored.postTypes || {}) },
            customFields: Array.isArray(stored.customFields) ? stored.customFields : [],
        };
    } catch {
        return { ...DEFAULT_VIDEO_SITEMAP };
    }
}

const YT_PATTERNS = [
    /youtube\.com\/watch\?[^"'\s>]*v=([A-Za-z0-9_-]{6,})/g,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/g,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/g,
];
const VIMEO_PATTERN = /(?:vimeo\.com|player\.vimeo\.com\/video)\/(\d{5,})/g;

export function extractVideos(html) {
    if (!html || typeof html !== 'string') return [];
    const seen = new Set();
    const videos = [];
    for (const re of YT_PATTERNS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(html)) !== null) {
            const id = m[1];
            const key = 'yt:' + id;
            if (seen.has(key)) continue;
            seen.add(key);
            videos.push({
                provider: 'youtube',
                id,
                contentLoc: `https://www.youtube.com/watch?v=${id}`,
                playerLoc: `https://www.youtube.com/embed/${id}`,
                thumbnailLoc: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            });
        }
    }
    VIMEO_PATTERN.lastIndex = 0;
    let m;
    while ((m = VIMEO_PATTERN.exec(html)) !== null) {
        const id = m[1];
        const key = 'vm:' + id;
        if (seen.has(key)) continue;
        seen.add(key);
        videos.push({
            provider: 'vimeo',
            id,
            contentLoc: `https://vimeo.com/${id}`,
            playerLoc: `https://player.vimeo.com/video/${id}`,
            thumbnailLoc: '',
        });
    }
    return videos;
}

const BLOG_FIELDS_DEFAULT = ['content', 'heroImage', 'excerpt'];
const PROJECT_FIELDS_DEFAULT = ['overview', 'description', 'detailedDescription', 'highlights', 'amenities', 'location', 'specifications'];

export function gatherHtml(row, defaults, customFields) {
    const fields = [...defaults, ...((customFields || []).filter(Boolean))];
    return fields.map(k => row?.[k]).filter(v => typeof v === 'string').join('\n');
}

export { BLOG_FIELDS_DEFAULT, PROJECT_FIELDS_DEFAULT };

// Fetch video title / description / duration via YouTube Data API v3. Returns
// a Map keyed by video id, missing entries are simply absent. Soft-fails if
// no key or the request errors out — the sitemap still renders without
// enrichment in that case.
export async function enrichYouTube(ids, apiKey) {
    if (!apiKey || !ids?.length) return new Map();
    const out = new Map();
    const unique = [...new Set(ids)];
    for (let i = 0; i < unique.length; i += 50) {
        const batch = unique.slice(i, i + 50);
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${batch.join(',')}&key=${encodeURIComponent(apiKey)}`;
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const json = await res.json();
            for (const item of (json.items || [])) {
                out.set(item.id, {
                    title: item.snippet?.title || '',
                    description: item.snippet?.description || '',
                    duration: item.contentDetails?.duration || '', // ISO8601 PT#M#S
                    publishedAt: item.snippet?.publishedAt || '',
                });
            }
        } catch { /* ignore — soft fallback */ }
    }
    return out;
}
