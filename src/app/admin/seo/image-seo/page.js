'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const CASING_OPTIONS = [
    { value: 'none', label: 'No change' },
    { value: 'lower', label: 'lowercase' },
    { value: 'upper', label: 'UPPERCASE' },
    { value: 'title', label: 'Title Case' },
    { value: 'sentence', label: 'Sentence case' },
];

const TOGGLES = [
    {
        key: 'addMissingAlt',
        label: 'Add missing ALT attributes',
        hint: 'Adds an ALT attribute to images without one. Derived from the filename and the post title when possible. Dynamically applied at render time — the stored content is not changed.',
    },
    {
        key: 'addMissingTitle',
        label: 'Add missing TITLE attributes',
        hint: 'Adds a TITLE attribute to images without one. Falls back to ALT or the post title.',
    },
    {
        key: 'addMissingCaption',
        label: 'Add missing image caption',
        hint: 'Wraps images in <figure> with a <figcaption> derived from ALT/title/post title. Stored content is not changed.',
    },
    {
        key: 'addMissingDescription',
        label: 'Add missing image description',
        hint: 'Adds an aria-label to images that don’t have one, so screen readers describe them.',
    },
    {
        key: 'addAvatarAlt',
        label: 'Add ALT attributes for avatars',
        hint: 'Adds ALT to commenter avatars (no-op until a comments feature exists on the site).',
    },
];

const CASING_FIELDS = [
    { key: 'titleCasing', label: 'Change title casing', hint: 'Capitalisation applied to image TITLE attribute values.' },
    { key: 'altCasing', label: 'Change alt attribute casing', hint: 'Capitalisation applied to image ALT attribute values.' },
    { key: 'descriptionCasing', label: 'Change description casing', hint: 'Capitalisation applied to image descriptions.' },
    { key: 'captionCasing', label: 'Change caption casing', hint: 'Capitalisation applied to image captions.' },
];

export default function ImageSeoPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState({
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
    });

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        fetch('/api/image-seo')
            .then(r => r.json())
            .then(j => { if (!cancelled && j.success) setData(j.data); })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const setBool = (k) => (v) => setData(d => ({ ...d, [k]: !!v }));
    const setStr = (k) => (e) => setData(d => ({ ...d, [k]: e.target.value }));

    const addReplacement = () => setData(d => ({
        ...d,
        replacements: [...(d.replacements || []), { find: '', replace: '', alt: true, title: true, caption: true }],
    }));
    const updateReplacement = (i, patch) => setData(d => ({
        ...d,
        replacements: d.replacements.map((r, idx) => idx === i ? { ...r, ...patch } : r),
    }));
    const removeReplacement = (i) => setData(d => ({
        ...d,
        replacements: d.replacements.filter((_, idx) => idx !== i),
    }));

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/image-seo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const j = await res.json();
            if (j.success) Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
            else Swal.fire('Error', j.error || 'Save failed', 'error');
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-5xl">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Image SEO</h1>
                            <p className="text-sm text-gray-500 mt-1">Settings related to images appearing in your post content. Applied at render time — your stored content is not modified.</p>
                        </div>
                        <button type="button" onClick={save} disabled={saving}
                            className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-gray-500 text-sm">Loading…</p>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg divide-y divide-gray-100">
                            {/* Toggles */}
                            {TOGGLES.map(t => (
                                <div key={t.key} className="p-5 flex items-start gap-6">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">{t.label}</p>
                                        <p className="text-xs text-gray-500 mt-1">{t.hint}</p>
                                    </div>
                                    <Toggle checked={!!data[t.key]} onChange={setBool(t.key)} />
                                </div>
                            ))}

                            {/* Casing */}
                            {CASING_FIELDS.map(f => (
                                <div key={f.key} className="p-5 flex items-start gap-6">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">{f.label}</p>
                                        <p className="text-xs text-gray-500 mt-1">{f.hint}</p>
                                    </div>
                                    <select value={data[f.key] || 'none'} onChange={setStr(f.key)}
                                        className="w-44 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-gold">
                                        {CASING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            ))}

                            {/* Replacements */}
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Replacements</p>
                                        <p className="text-xs text-gray-500 mt-1">Replace characters or words inside ALT, TITLE, and CAPTION at render time. Case-insensitive.</p>
                                    </div>
                                    <button type="button" onClick={addReplacement}
                                        className="px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:opacity-90 transition shrink-0">
                                        + Add another
                                    </button>
                                </div>
                                {data.replacements.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No replacements yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {data.replacements.map((r, i) => (
                                            <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                                <input type="text" value={r.find} onChange={e => updateReplacement(i, { find: e.target.value })}
                                                    placeholder="Find"
                                                    className="col-span-4 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 font-mono focus:outline-none focus:border-gold" />
                                                <input type="text" value={r.replace} onChange={e => updateReplacement(i, { replace: e.target.value })}
                                                    placeholder="Replace"
                                                    className="col-span-4 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 font-mono focus:outline-none focus:border-gold" />
                                                <label className="col-span-1 flex items-center justify-center gap-1 text-xs text-gray-600">
                                                    <input type="checkbox" checked={r.alt} onChange={e => updateReplacement(i, { alt: e.target.checked })} className="accent-gold" />
                                                    Alt
                                                </label>
                                                <label className="col-span-1 flex items-center justify-center gap-1 text-xs text-gray-600">
                                                    <input type="checkbox" checked={r.title} onChange={e => updateReplacement(i, { title: e.target.checked })} className="accent-gold" />
                                                    Title
                                                </label>
                                                <label className="col-span-1 flex items-center justify-center gap-1 text-xs text-gray-600">
                                                    <input type="checkbox" checked={r.caption} onChange={e => updateReplacement(i, { caption: e.target.checked })} className="accent-gold" />
                                                    Cap
                                                </label>
                                                <button type="button" onClick={() => removeReplacement(i)}
                                                    className="col-span-1 text-red-500 hover:text-red-700 text-xs font-semibold">
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
            <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors w-7 text-right ${checked ? 'text-gold' : 'text-gray-400'}`}>
                {checked ? 'On' : 'Off'}
            </span>
            <span
                role="switch"
                aria-checked={checked}
                tabIndex={0}
                onClick={() => onChange(!checked)}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); } }}
                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-gold' : 'bg-gray-300'}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </span>
        </label>
    );
}
