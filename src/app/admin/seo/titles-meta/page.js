'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';
import {
    MdArticle, MdDescription, MdLayers, MdLanguage,
} from 'react-icons/md';

const SCHEMA_TYPES = [
    { value: 'Article', label: 'Article' },
    { value: 'BlogPosting', label: 'Blog Post' },
    { value: 'NewsArticle', label: 'News Article' },
];

const ARTICLE_TYPES = [
    { value: 'Article', label: 'Article' },
    { value: 'BlogPost', label: 'Blog Post' },
    { value: 'NewsArticle', label: 'News Article' },
];

const BULK_MODES = [
    { value: 'disabled', label: 'Disabled' },
    { value: 'enabled', label: 'Enabled' },
    { value: 'readonly', label: 'Read Only' },
];

const WATERMARKS = [
    { value: 'off', label: 'Off' },
    { value: 'play', label: 'Play icon' },
    { value: 'gif', label: 'GIF icon' },
];

const SECTIONS = [
    { id: 'global', label: 'Global Meta', icon: MdLanguage, group: 'global' },
    { id: 'post', label: 'Posts', icon: MdArticle, group: 'type' },
    { id: 'page', label: 'Pages', icon: MdDescription, group: 'type' },
    { id: 'category', label: 'Categories', icon: MdLayers, group: 'type' },
];

const VARIABLES = [
    ['%title%', 'Post / page title'],
    ['%excerpt%', 'Post excerpt (auto-truncated)'],
    ['%sep%', 'Configured separator'],
    ['%sitename%', 'Site name'],
    ['%sitedesc%', 'Site description'],
    ['%page%', '"Page N" on paginated lists'],
    ['%category%', 'Primary category'],
    ['%author%', 'Author name'],
    ['%currentyear%', 'Current year'],
    ['%currentdate%', 'Current date (YYYY-MM-DD)'],
    ['%focuskw%', 'Focus keyword'],
];

const DEFAULT_TYPE = {
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
    linkSuggestionTitles: 'titles',
    primaryTaxonomy: '',
    slackEnhancedSharing: true,
    addSeoControls: true,
    bulkEditing: 'enabled',
    customFields: '',
    defaultThumbnailWatermark: 'off',
};

const DEFAULT_DATA = {
    global: { separator: '—', capitalizeTitle: false },
    post: { ...DEFAULT_TYPE },
    page: { ...DEFAULT_TYPE, autodetectVideo: false, linkSuggestions: false },
    category: { ...DEFAULT_TYPE, schemaType: 'CollectionPage' },
};

export default function TitlesMetaPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [section, setSection] = useState('post');
    const [data, setData] = useState(DEFAULT_DATA);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        fetch('/api/titles-meta')
            .then(r => r.json())
            .then(j => { if (!cancelled && j.success) setData(j.data); })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const save = async () => {
        setSaving(true);
        try {
            const { apiFetch } = await import('@/lib/apiClient');
            const { data: j } = await apiFetch('/api/titles-meta', { method: 'PUT', body: data });
            if (j.success) {
                setData(j.data);
                Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire('Error', j.error || 'Save failed', 'error');
            }
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally { setSaving(false); }
    };

    const reset = async () => {
        const c = await Swal.fire({ title: 'Reset this section?', icon: 'warning', showCancelButton: true });
        if (!c.isConfirmed) return;
        if (section === 'global') {
            setData(d => ({ ...d, global: DEFAULT_DATA.global }));
        } else {
            setData(d => ({ ...d, [section]: DEFAULT_DATA[section] || DEFAULT_TYPE }));
        }
    };

    const isType = SECTIONS.find(s => s.id === section)?.group === 'type';
    const cfg = isType ? (data[section] || DEFAULT_TYPE) : data.global;
    const update = (patch) => setData(d => ({
        ...d,
        [section]: isType
            ? { ...(d[section] || DEFAULT_TYPE), ...patch }
            : (d.global || {}),
        ...(isType ? {} : { global: { ...(d.global || {}), ...patch } }),
    }));
    const updateRobots = (k, v) => setData(d => ({
        ...d,
        [section]: {
            ...(d[section] || DEFAULT_TYPE),
            robotsMeta: { ...(d[section]?.robotsMeta || DEFAULT_TYPE.robotsMeta), [k]: !!v },
        },
    }));

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-6xl">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Titles &amp; Meta</h1>
                            <p className="text-sm text-gray-500 mt-1">Per-post-type title and description templates, schema defaults, and editor controls.</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={reset} className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50">Reset section</button>
                            <button type="button" onClick={save} disabled={saving} className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50">
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : (
                        <div className="grid grid-cols-12 gap-6">
                            <aside className="col-span-3">
                                <nav className="bg-white rounded-xl shadow-md p-2 space-y-1">
                                    {SECTIONS.map(s => {
                                        const Icon = s.icon;
                                        const active = s.id === section;
                                        return (
                                            <button key={s.id} type="button" onClick={() => setSection(s.id)}
                                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-left transition ${active ? 'bg-gold text-white' : 'text-gray-700 hover:bg-gray-50'}`}>
                                                <Icon size={18} /> {s.label}
                                            </button>
                                        );
                                    })}
                                </nav>

                                <details className="mt-4 bg-white rounded-xl shadow-md p-4 text-xs text-gray-600">
                                    <summary className="cursor-pointer font-semibold text-gray-800">Available variables</summary>
                                    <ul className="mt-2 space-y-1">
                                        {VARIABLES.map(([k, label]) => (
                                            <li key={k} className="flex justify-between gap-2">
                                                <code className="font-mono text-gold">{k}</code>
                                                <span className="text-right text-gray-500">{label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            </aside>

                            <section className="col-span-9">
                                {!isType ? (
                                    <GlobalSettings cfg={cfg} update={update} />
                                ) : (
                                    <TypeSettings section={section} cfg={cfg} update={update} updateRobots={updateRobots} />
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function GlobalSettings({ cfg, update }) {
    return (
        <Card title="Global Meta" subtitle="Defaults that apply across every post type.">
            <Field label="Title separator" hint="The character that replaces %sep% in any title template.">
                <input type="text" value={cfg.separator || '—'} onChange={e => update({ separator: e.target.value })} className={inputCls} />
            </Field>
            <Toggle label="Capitalize titles" checked={!!cfg.capitalizeTitle} onChange={v => update({ capitalizeTitle: v })}
                hint="Convert the substituted title to Title Case before output." />
        </Card>
    );
}

function TypeSettings({ section, cfg, update, updateRobots }) {
    const label = section === 'post' ? 'Posts' : section === 'page' ? 'Pages' : 'Categories';
    return (
        <div className="bg-white rounded-xl shadow-md">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">{label}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    Change Global SEO, Schema, and other settings for single {label.toLowerCase()}.
                </p>
            </div>
            <div className="divide-y divide-gray-100">
                <Row label="Single Post Title" hint="Default <title> for single pages of this type.">
                    <input type="text" value={cfg.title || ''} onChange={e => update({ title: e.target.value })} className={inputCls + ' font-mono'} />
                    <Example>{cfg.title}</Example>
                </Row>

                <Row label="Single Post Description" hint="Default <meta name=description> for single pages.">
                    <textarea rows={2} value={cfg.description || ''} onChange={e => update({ description: e.target.value })} className={inputCls + ' font-mono'} />
                </Row>

                <Row label="Schema Type" hint="Default schema.org type when rich snippets are emitted.">
                    <select value={cfg.schemaType || 'Article'} onChange={e => update({ schemaType: e.target.value })} className={inputCls}>
                        {SCHEMA_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </Row>

                <Row label="Headline" hint="JSON-LD headline template.">
                    <input type="text" value={cfg.headline || ''} onChange={e => update({ headline: e.target.value })} className={inputCls + ' font-mono'} />
                </Row>

                <Row label="Description" hint="JSON-LD description template.">
                    <textarea rows={2} value={cfg.schemaDescription || ''} onChange={e => update({ schemaDescription: e.target.value })} className={inputCls + ' font-mono'} />
                </Row>

                <Row label="Article Type" hint="JSON-LD article variant.">
                    <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
                        {ARTICLE_TYPES.map(t => (
                            <button key={t.value} type="button" onClick={() => update({ articleType: t.value })}
                                className={`px-4 py-2 text-sm ${cfg.articleType === t.value ? 'bg-gold text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </Row>

                <RowToggle label="Autodetect Video" hint="Populate Video schema automatically when a YouTube / Vimeo embed exists in the content."
                    checked={cfg.autodetectVideo} onChange={v => update({ autodetectVideo: v })} />

                <RowToggle label="Autogenerate Image" hint="Auto-generate an Open Graph image from the hero / title when none is set."
                    checked={cfg.autogenerateImage} onChange={v => update({ autogenerateImage: v })} />

                <Row label="Post Robots Meta" hint="Override the global robots meta for this post type.">
                    <Toggle checked={cfg.customRobotsMeta} onChange={v => update({ customRobotsMeta: v })} />
                    {cfg.customRobotsMeta ? (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {[
                                ['index', 'Index'], ['follow', 'Follow'], ['noarchive', 'No Archive'],
                                ['nosnippet', 'No Snippet'], ['noimageindex', 'No Image Index'],
                            ].map(([k, lbl]) => (
                                <label key={k} className="flex items-center gap-2 text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked={!!cfg.robotsMeta?.[k]} onChange={e => updateRobots(k, e.target.checked)} className="accent-gold" />
                                    {lbl}
                                </label>
                            ))}
                        </div>
                    ) : null}
                </Row>

                <RowToggle label="Link Suggestions" hint="Show related-link suggestions when editing this type."
                    checked={cfg.linkSuggestions} onChange={v => update({ linkSuggestions: v })} />

                <Row label="Link Suggestion Titles" hint="What to use as the default link text when accepting a suggestion.">
                    <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
                        {[['titles', 'Titles'], ['keywords', 'Focus Keywords']].map(([val, lbl]) => (
                            <button key={val} type="button" onClick={() => update({ linkSuggestionTitles: val })}
                                className={`px-4 py-2 text-sm ${cfg.linkSuggestionTitles === val ? 'bg-gold text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                {lbl}
                            </button>
                        ))}
                    </div>
                </Row>

                <Row label="Primary Taxonomy" hint="Taxonomy used for breadcrumbs + %category% variable.">
                    <select value={cfg.primaryTaxonomy || ''} onChange={e => update({ primaryTaxonomy: e.target.value })} className={inputCls + ' max-w-xs'}>
                        <option value="">None</option>
                        <option value="category">Category</option>
                        <option value="tag">Tag</option>
                    </select>
                </Row>

                <RowToggle label="Slack Enhanced Sharing" hint="Adds reading-time + author meta tags when shared on Slack."
                    checked={cfg.slackEnhancedSharing} onChange={v => update({ slackEnhancedSharing: v })} />

                <RowToggle label="Add SEO Controls" hint="Show the SEO controls panel in the post editor."
                    checked={cfg.addSeoControls} onChange={v => update({ addSeoControls: v })} />

                <Row label="Bulk Editing" hint="Column on the list page so you can toggle SEO fields across many rows.">
                    <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
                        {BULK_MODES.map(m => (
                            <button key={m.value} type="button" onClick={() => update({ bulkEditing: m.value })}
                                className={`px-4 py-2 text-sm ${cfg.bulkEditing === m.value ? 'bg-gold text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                </Row>

                <Row label="Custom Fields" hint="One field name per line. Used by the on-page SEO analysis.">
                    <textarea rows={3} value={cfg.customFields || ''} onChange={e => update({ customFields: e.target.value })} className={inputCls + ' font-mono'} />
                </Row>

                <Row label="Default Thumbnail Watermark" hint="Overlay on auto-generated OG images.">
                    <div className="inline-flex border border-gray-300 rounded-lg overflow-hidden">
                        {WATERMARKS.map(w => (
                            <button key={w.value} type="button" onClick={() => update({ defaultThumbnailWatermark: w.value })}
                                className={`px-4 py-2 text-sm ${cfg.defaultThumbnailWatermark === w.value ? 'bg-gold text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                                {w.label}
                            </button>
                        ))}
                    </div>
                </Row>
            </div>
        </div>
    );
}

// ---------- helpers ----------

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-gold';

function Card({ title, subtitle, children }) {
    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-base font-bold text-gray-800">{title}</h3>
            {subtitle ? <p className="text-xs text-gray-500 mt-0.5 mb-4">{subtitle}</p> : <div className="mb-4" />}
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function Row({ label, hint, children }) {
    return (
        <div className="p-6 grid grid-cols-1 md:grid-cols-[260px,1fr] gap-4 items-start">
            <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                {hint ? <p className="text-xs text-gray-500 mt-1">{hint}</p> : null}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function RowToggle({ label, hint, checked, onChange }) {
    return (
        <Row label={label} hint={hint}>
            <Toggle checked={checked} onChange={onChange} />
        </Row>
    );
}

function Field({ label, hint, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
            {children}
            {hint ? <p className="text-[11px] text-gray-400 mt-1">{hint}</p> : null}
        </div>
    );
}

function Example({ children }) {
    return children ? (
        <p className="mt-2 text-[11px] text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-gray-400">Example</span>{' '}
            <span className="font-mono text-gray-700">{String(children)}</span>
        </p>
    ) : null;
}

function Toggle({ checked, onChange }) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <span className={`text-[11px] font-bold uppercase tracking-wider w-7 text-right ${checked ? 'text-gold' : 'text-gray-400'}`}>
                {checked ? 'On' : 'Off'}
            </span>
            <span role="switch" aria-checked={!!checked} tabIndex={0}
                onClick={() => onChange(!checked)}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); } }}
                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
        </label>
    );
}
