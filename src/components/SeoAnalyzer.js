'use client';

// Rank-Math-style SEO checker. Runs a battery of rules client-side against
// whatever the editor currently has and shows a coloured checklist + score.
//
// Usage:
//   <SeoAnalyzer
//     title={formData.title}
//     slug={formData.slug}
//     metaTitle={formData.metaTitle}
//     metaDescription={formData.metaDescription}
//     content={formData.content}          // rich-text HTML
//     keywords={formData.keywords}        // comma-separated string
//     image={formData.contentImage}
//   />

import { useMemo, useState } from 'react';

function stripHtml(html) {
    if (!html) return '';
    return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(text) {
    const t = stripHtml(text);
    if (!t) return 0;
    return t.split(/\s+/).length;
}

function countAt(haystack, needle) {
    if (!haystack || !needle) return 0;
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (haystack.match(re) || []).length;
}

function fleschReadingEase(text) {
    const t = stripHtml(text);
    if (!t) return 0;
    const sentences = (t.match(/[.!?]+/g) || []).length || 1;
    const words = t.split(/\s+/);
    const wc = words.length;
    const syllables = words.reduce((s, w) => s + Math.max(1, (w.toLowerCase().match(/[aeiouy]+/g) || []).length), 0);
    if (wc === 0) return 0;
    return Math.round(206.835 - 1.015 * (wc / sentences) - 84.6 * (syllables / wc));
}

function buildChecks({ title, slug, metaTitle, metaDescription, content, focusKeyword, keywords, image }) {
    const fk = (focusKeyword || keywords || '').split(',')[0]?.trim() || '';
    const plain = stripHtml(content || '');
    const wc = wordCount(content || '');
    const checks = [];

    const push = (name, status, why) => checks.push({ name, status, why });

    // --- Title checks
    if (!metaTitle) push('Meta title is set', 'fail', 'Add a meta title (50–60 chars).');
    else {
        const len = metaTitle.length;
        if (len < 30) push('Meta title length', 'warn', `${len} chars — aim for 50–60.`);
        else if (len > 60) push('Meta title length', 'warn', `${len} chars — Google may truncate at 60.`);
        else push('Meta title length', 'pass', `${len} chars — perfect.`);
    }

    // --- Description checks
    if (!metaDescription) push('Meta description is set', 'fail', 'Add a meta description (140–160 chars).');
    else {
        const len = metaDescription.length;
        if (len < 70) push('Meta description length', 'warn', `${len} chars — too short. Aim for 140–160.`);
        else if (len > 160) push('Meta description length', 'warn', `${len} chars — Google may truncate at 160.`);
        else push('Meta description length', 'pass', `${len} chars — good.`);
    }

    // --- Slug
    if (!slug) push('URL slug', 'fail', 'Set a clean, lowercase URL slug.');
    else if (!/^[a-z0-9-]+$/.test(slug)) push('URL slug', 'warn', 'Use only lowercase letters, numbers and dashes.');
    else if (slug.length > 75) push('URL slug', 'warn', `${slug.length} chars — keep under 75.`);
    else push('URL slug', 'pass', `/${slug}`);

    // --- Focus keyword
    if (!fk) push('Focus keyword', 'warn', 'Set a focus keyword (in the Keywords field) so we can check density.');
    else {
        if ((metaTitle || '').toLowerCase().includes(fk.toLowerCase())) push('Keyword in meta title', 'pass', `"${fk}" appears in the title.`);
        else push('Keyword in meta title', 'warn', `Add "${fk}" to the meta title.`);

        if ((metaDescription || '').toLowerCase().includes(fk.toLowerCase())) push('Keyword in meta description', 'pass', '');
        else push('Keyword in meta description', 'warn', `Add "${fk}" to the meta description.`);

        if (plain.toLowerCase().includes(fk.toLowerCase())) push('Keyword in content', 'pass', '');
        else push('Keyword in content', 'warn', `Mention "${fk}" inside the content.`);

        const slugMatch = (slug || '').toLowerCase().includes(fk.toLowerCase().replace(/\s+/g, '-'));
        if (slugMatch) push('Keyword in URL', 'pass', '');
        else push('Keyword in URL', 'warn', `Include "${fk.replace(/\s+/g, '-')}" in the URL slug.`);

        const occurrences = countAt(plain, fk);
        const density = wc ? (occurrences / wc) * 100 : 0;
        if (occurrences === 0) push('Keyword density', 'fail', 'Focus keyword does not appear in content.');
        else if (density < 0.5) push('Keyword density', 'warn', `${density.toFixed(2)}% — try for 0.5–2.5%.`);
        else if (density > 3) push('Keyword density', 'warn', `${density.toFixed(2)}% — looks like keyword stuffing.`);
        else push('Keyword density', 'pass', `${density.toFixed(2)}% — good.`);
    }

    // --- Content length
    if (wc === 0) push('Content length', 'fail', 'Add some content.');
    else if (wc < 300) push('Content length', 'warn', `${wc} words — pages under 300 rarely rank.`);
    else if (wc < 800) push('Content length', 'pass', `${wc} words — decent.`);
    else push('Content length', 'pass', `${wc} words — great.`);

    // --- Headings
    const headingCount = (content || '').match(/<h[1-6][^>]*>/gi)?.length || 0;
    if (headingCount === 0) push('Headings present', 'warn', 'Add at least one heading (H2/H3) inside the body.');
    else push('Headings present', 'pass', `${headingCount} heading(s) found.`);

    // --- Image alt coverage
    const imgs = [...(content || '').matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
    if (imgs.length === 0 && !image) push('Images', 'warn', 'No images yet — add at least one with descriptive alt text.');
    else if (imgs.length > 0) {
        const missingAlt = imgs.filter(t => !/\balt\s*=\s*"[^"]+"/i.test(t)).length;
        if (missingAlt === 0) push('All images have alt text', 'pass', `${imgs.length} image(s), all alt-tagged.`);
        else push('All images have alt text', 'fail', `${missingAlt} of ${imgs.length} image(s) missing alt.`);
    }

    // --- Links
    const links = [...(content || '').matchAll(/<a\b[^>]*href\s*=\s*"([^"]+)"[^>]*>/gi)].map(m => m[1]);
    const externalLinks = links.filter(h => /^https?:\/\//i.test(h));
    const internalLinks = links.filter(h => h.startsWith('/'));
    if (links.length === 0) push('Outbound links', 'warn', 'No links found — add 1–2 external authority links and a few internal ones.');
    else {
        if (internalLinks.length > 0) push('Internal links', 'pass', `${internalLinks.length} internal link(s).`);
        else push('Internal links', 'warn', 'Add at least one link to another page on your site.');
        if (externalLinks.length > 0) push('External links', 'pass', `${externalLinks.length} external link(s).`);
        else push('External links', 'warn', 'Add at least one external authority link.');
    }

    // --- Readability
    const flesch = fleschReadingEase(content || '');
    if (!plain) push('Readability', 'warn', 'Add some content to score readability.');
    else if (flesch >= 60) push('Readability', 'pass', `Flesch score ${flesch} — easy to read.`);
    else if (flesch >= 30) push('Readability', 'warn', `Flesch score ${flesch} — moderately difficult.`);
    else push('Readability', 'fail', `Flesch score ${flesch} — hard to read. Shorten sentences.`);

    return checks;
}

function score(checks) {
    if (checks.length === 0) return 0;
    const points = { pass: 1, warn: 0.5, fail: 0 };
    const total = checks.reduce((s, c) => s + (points[c.status] ?? 0), 0);
    return Math.round((total / checks.length) * 100);
}

const STATUS_STYLES = {
    pass: { dot: 'bg-green-500', text: 'text-green-700' },
    warn: { dot: 'bg-amber-500', text: 'text-amber-700' },
    fail: { dot: 'bg-red-500', text: 'text-red-700' },
};

export default function SeoAnalyzer(props) {
    const [collapsed, setCollapsed] = useState(false);
    const [focusKeyword, setFocusKeyword] = useState('');

    const checks = useMemo(
        () => buildChecks({ ...props, focusKeyword }),
        [props, focusKeyword]
    );
    const total = score(checks);
    const fails = checks.filter(c => c.status === 'fail').length;
    const warns = checks.filter(c => c.status === 'warn').length;

    const scoreColor = total >= 80 ? 'bg-green-500' : total >= 50 ? 'bg-amber-500' : 'bg-red-500';

    return (
        <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gold mb-6">
            <div className="p-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <div className={`relative w-14 h-14 rounded-full ${scoreColor} text-white flex items-center justify-center text-lg font-bold shadow`}>
                        {total}
                    </div>
                    <div>
                        <p className="text-base font-bold text-gray-800">SEO Score</p>
                        <p className="text-xs text-gray-500 mt-0.5">{fails} fail · {warns} warn · {checks.length - fails - warns} pass</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={focusKeyword}
                        onChange={e => setFocusKeyword(e.target.value)}
                        placeholder="Focus keyword (optional)"
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-gold w-56"
                    />
                    <button type="button" onClick={() => setCollapsed(c => !c)}
                        className="text-xs px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700 font-semibold">
                        {collapsed ? 'Show' : 'Hide'}
                    </button>
                </div>
            </div>
            {!collapsed && (
                <div className="px-5 pb-5">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
                        {checks.map((c, i) => {
                            const s = STATUS_STYLES[c.status];
                            return (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                                    <div className="min-w-0">
                                        <p className={`font-medium ${s.text}`}>{c.name}</p>
                                        {c.why && <p className="text-xs text-gray-500 mt-0.5">{c.why}</p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}
