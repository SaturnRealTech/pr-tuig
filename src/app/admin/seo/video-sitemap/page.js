'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';
import { MdInsertLink, MdContentCopy, MdRefresh } from 'react-icons/md';

const POST_TYPES = [
    { id: 'blogs', label: 'Blogs' },
    { id: 'projects', label: 'Pages / Projects' },
];

const EMPTY = {
    hideSitemap: false,
    postTypes: { blogs: true, projects: true },
    youtubeApiKey: '',
    customFields: [],
};

export default function VideoSitemapPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState(EMPTY);
    const [siteUrl, setSiteUrl] = useState('');
    const [customFieldsText, setCustomFieldsText] = useState('');

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
        if (typeof window !== 'undefined') setSiteUrl(window.location.origin);
    }, [router]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        fetch('/api/video-sitemap')
            .then(r => r.json())
            .then(j => {
                if (cancelled || !j.success) return;
                const next = {
                    ...EMPTY,
                    ...j.data,
                    postTypes: { ...EMPTY.postTypes, ...(j.data.postTypes || {}) },
                    customFields: Array.isArray(j.data.customFields) ? j.data.customFields : [],
                };
                setData(next);
                setCustomFieldsText((next.customFields || []).join('\n'));
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const setBool = (k) => (v) => setData(d => ({ ...d, [k]: !!v }));
    const togglePostType = (id) => setData(d => ({
        ...d,
        postTypes: { ...d.postTypes, [id]: !d.postTypes?.[id] },
    }));
    const selectAll = () => setData(d => {
        const allOn = POST_TYPES.every(t => d.postTypes?.[t.id]);
        const next = {};
        for (const t of POST_TYPES) next[t.id] = !allOn;
        return { ...d, postTypes: next };
    });

    const save = async () => {
        setSaving(true);
        try {
            const customFields = customFieldsText.split(/\n+/).map(s => s.trim()).filter(Boolean);
            const payload = { ...data, customFields };
            const res = await fetch('/api/video-sitemap', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const j = await res.json();
            if (j.success) {
                setData(j.data);
                Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire('Error', j.error || 'Save failed', 'error');
            }
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const reset = async () => {
        const c = await Swal.fire({
            title: 'Reset all video sitemap options?',
            text: 'Defaults will be restored — but nothing is saved until you click Save Changes.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Reset',
        });
        if (!c.isConfirmed) return;
        setData(EMPTY);
        setCustomFieldsText('');
    };

    const sitemapUrl = `${siteUrl}/video-sitemap.xml`;
    const copyUrl = async () => {
        try { await navigator.clipboard.writeText(sitemapUrl); Swal.fire({ icon: 'success', title: 'Copied', timer: 1000, showConfirmButton: false }); } catch { }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-4xl">
                    <div className="bg-white rounded-t-xl shadow-md p-6 border-b border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-800 text-center">Video Sitemap</h1>
                        <p className="text-sm text-gray-500 text-center mt-1 max-w-2xl mx-auto">
                            Video sitemaps give search engines information about video content on your site.
                            Auto-built by scanning YouTube and Vimeo embeds inside your selected post types.
                        </p>
                    </div>

                    {loading ? (
                        <div className="bg-white p-6"><p className="text-sm text-gray-500">Loading…</p></div>
                    ) : (
                        <div className="bg-white shadow-md">
                            <div className="m-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
                                <MdInsertLink className="text-blue-600 flex-shrink-0" size={22} />
                                <span className="text-sm text-blue-900">
                                    Your Video Sitemap can be found here:{' '}
                                    <a target="_blank" rel="noopener noreferrer" href={sitemapUrl} className="font-semibold underline break-all">{sitemapUrl}</a>
                                </span>
                                <button type="button" onClick={copyUrl} className="ml-auto p-2 text-blue-700 hover:bg-blue-100 rounded-lg" title="Copy URL">
                                    <MdContentCopy size={18} />
                                </button>
                            </div>

                            <Row label="Hide Sitemap" hint="Hide the video sitemap from normal visitors? Search engines can still fetch it.">
                                <Toggle checked={!!data.hideSitemap} onChange={setBool('hideSitemap')} />
                            </Row>

                            <Row label="Video Post Type" hint="Select the post types where you use videos and want them shown in the Video search.">
                                <div className="w-full">
                                    <button type="button" onClick={selectAll}
                                        className="mb-3 px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                        Select / Deselect All
                                    </button>
                                    <div className="grid grid-cols-2 gap-2">
                                        {POST_TYPES.map(t => (
                                            <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                                <input type="checkbox" checked={!!data.postTypes?.[t.id]} onChange={() => togglePostType(t.id)} className="accent-gold w-4 h-4" />
                                                {t.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </Row>

                            <Row label="YouTube API Key" hint="Optional. Used to fetch video title, description and duration automatically. Leave blank to skip enrichment.">
                                <input type="text" value={data.youtubeApiKey} onChange={e => setData(d => ({ ...d, youtubeApiKey: e.target.value }))}
                                    placeholder="AIza..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:border-gold" />
                            </Row>

                            <Row label="Custom Fields" hint="One field name per line. The scanner will also check these database columns for video content." last>
                                <textarea rows={5} value={customFieldsText} onChange={e => setCustomFieldsText(e.target.value)}
                                    placeholder={`videoUrl\nembedHtml`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:border-gold" />
                            </Row>

                            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
                                <button type="button" onClick={reset}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2">
                                    <MdRefresh size={18} /> Reset Options
                                </button>
                                <button type="button" onClick={save} disabled={saving}
                                    className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function Row({ label, hint, children, last }) {
    return (
        <div className={`px-6 py-5 grid grid-cols-1 md:grid-cols-[200px,1fr] gap-4 items-start ${last ? '' : 'border-b border-gray-100'}`}>
            <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                {hint ? <p className="text-xs text-gray-500 mt-1">{hint}</p> : null}
            </div>
            <div className="min-w-0">{children}</div>
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
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
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
        </label>
    );
}
