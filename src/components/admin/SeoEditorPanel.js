'use client';

// Re-usable SEO controls block for the blog / project edit pages.
// Renders two sub-sections:
//   1. Robots meta override — null means "use type default", object means
//      override. Stored on the record as `robotsMeta`.
//   2. Schema Templates picker — pulls /api/schema-templates, lets you tick
//      which templates apply. Stored on the record as `schemaTemplates: [_id]`.

import { useEffect, useState } from 'react';
import { MdInfo } from 'react-icons/md';

const ROBOTS_FLAGS = [
    { key: 'index', label: 'Index', invertedHint: 'Off = noindex (hide from search)' },
    { key: 'follow', label: 'Follow', invertedHint: 'Off = nofollow (don\'t pass link equity)' },
    { key: 'noarchive', label: 'No archive', hint: 'Block cached copy in search results' },
    { key: 'nosnippet', label: 'No snippet', hint: 'Block the description snippet' },
    { key: 'noimageindex', label: 'No image index', hint: 'Block images on this page from image search' },
];

const OG_OVERRIDE_OPTIONS = [
    { value: 'inherit', label: 'Inherit', hint: 'Use the Titles & Meta default for this post type.' },
    { value: 'on', label: 'Force on', hint: 'Always auto-generate an OG image when the post has no featured image.' },
    { value: 'off', label: 'Force off', hint: 'Never auto-generate — leave OG image blank if no featured image.' },
];

export default function SeoEditorPanel({ value, onChange, kind = 'blog' }) {
    const robotsActive = !!value.robotsMeta;
    const robots = value.robotsMeta || { index: true, follow: true, noarchive: false, nosnippet: false, noimageindex: false };
    const selectedTemplates = Array.isArray(value.schemaTemplates) ? value.schemaTemplates : [];
    const ogOverride = OG_OVERRIDE_OPTIONS.find(o => o.value === value.autogenerateImageOverride)?.value || 'inherit';

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch('/api/schema-templates')
            .then(r => r.json())
            .then(j => { if (!cancelled && j.success) setTemplates(j.data || []); })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const setRobotsActive = (on) => {
        onChange({ ...value, robotsMeta: on ? { ...robots } : null });
    };
    const setRobotsFlag = (k, v) => {
        onChange({ ...value, robotsMeta: { ...robots, [k]: !!v } });
    };
    const toggleTemplate = (id) => {
        const next = selectedTemplates.includes(id)
            ? selectedTemplates.filter(x => x !== id)
            : [...selectedTemplates, id];
        onChange({ ...value, schemaTemplates: next });
    };
    const setOgOverride = (v) => onChange({ ...value, autogenerateImageOverride: v });

    return (
        <div className="space-y-6">
            {/* Robots */}
            <section className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800">Robots Meta Override</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Off uses the Titles &amp; Meta default for {kind === 'blog' ? 'Posts' : 'Pages'}.
                            Turning it on lets you override `&lt;meta name="robots"&gt;` just for this {kind}.
                        </p>
                    </div>
                    <Toggle checked={robotsActive} onChange={setRobotsActive} />
                </div>
                {robotsActive ? (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                        {ROBOTS_FLAGS.map(f => (
                            <label key={f.key} className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={!!robots[f.key]} onChange={e => setRobotsFlag(f.key, e.target.checked)} className="accent-gold mt-0.5" />
                                <span>
                                    <span className="font-semibold text-gray-800">{f.label}</span>
                                    {f.hint ? <span className="block text-gray-500">{f.hint}</span> : null}
                                    {f.invertedHint ? <span className="block text-gray-500">{f.invertedHint}</span> : null}
                                </span>
                            </label>
                        ))}
                    </div>
                ) : null}
            </section>

            {/* Auto-generate OG image override */}
            <section className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="mb-3">
                    <h3 className="text-sm font-bold text-gray-800">Auto-generate OG image</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Override the Titles &amp; Meta default just for this {kind}. Only kicks in when no featured/hero image is set.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {OG_OVERRIDE_OPTIONS.map(opt => {
                        const checked = ogOverride === opt.value;
                        return (
                            <label key={opt.value}
                                className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition ${checked ? 'bg-gold/5 border-gold/40' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name={`og-override-${kind}`}
                                    value={opt.value}
                                    checked={checked}
                                    onChange={() => setOgOverride(opt.value)}
                                    className="accent-gold mt-0.5"
                                />
                                <span className="min-w-0">
                                    <span className="block text-xs font-semibold text-gray-800">{opt.label}</span>
                                    <span className="block text-[11px] text-gray-500 mt-0.5">{opt.hint}</span>
                                </span>
                            </label>
                        );
                    })}
                </div>
            </section>

            {/* Schema Templates picker */}
            <section className="border border-gray-200 rounded-xl p-5 bg-white">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800">Schema Templates</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Tick the structured-data templates you want emitted in this {kind}&apos;s JSON-LD.{' '}
                            <a href="/admin/seo/schema-templates" target="_blank" rel="noopener noreferrer" className="text-gold underline">Manage templates →</a>
                        </p>
                    </div>
                </div>

                {loading ? (
                    <p className="text-xs text-gray-500 mt-2">Loading templates…</p>
                ) : templates.length === 0 ? (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 inline-flex items-center gap-2">
                        <MdInfo size={16} /> No schema templates yet — create one in <strong>SEO → Schema Templates</strong>.
                    </div>
                ) : (
                    <div className="mt-3 space-y-2">
                        {templates.map(t => {
                            const id = String(t._id);
                            const checked = selectedTemplates.includes(id);
                            const targetsAll = kind === 'blog' ? t.attachTo?.allBlogPosts : t.attachTo?.allProjects;
                            return (
                                <label key={id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${checked ? 'bg-gold/5 border-gold/40' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                    <input type="checkbox" checked={checked} onChange={() => toggleTemplate(id)} className="accent-gold mt-1" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-800 truncate">{t.name}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gold/10 text-gold">{t.schemaType}</span>
                                            {targetsAll ? (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                                    Already attached to all {kind === 'blog' ? 'posts' : 'projects'}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
            <span className={`text-[11px] font-bold uppercase tracking-wider w-7 text-right ${checked ? 'text-gold' : 'text-gray-400'}`}>
                {checked ? 'On' : 'Off'}
            </span>
            <span
                role="switch"
                aria-checked={!!checked}
                tabIndex={0}
                onClick={() => onChange(!checked)}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); } }}
                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
        </label>
    );
}
