'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';
import { MdInsertLink, MdContentCopy, MdOpenInNew, MdSearch } from 'react-icons/md';

const GROUPS = [
    { key: 'static', title: 'Static Pages', hint: 'Built-in routes such as the home page and the blog index.' },
    { key: 'projects', title: 'Pages / Projects', hint: 'Every published page or project.' },
    { key: 'blogs', title: 'Blogs', hint: 'Every published blog post.' },
    { key: 'blogCategories', title: 'Blog Categories', hint: 'Category landing pages that appear in /sitemap.xml.' },
];

export default function SitemapAdminPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState({ static: [], blogs: [], blogCategories: [], projects: [] });
    const [excludes, setExcludes] = useState({ static: new Set(), blogs: new Set(), blogCategories: new Set(), projects: new Set() });
    const [search, setSearch] = useState({});
    const [siteUrl, setSiteUrl] = useState('');

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
        fetch('/api/sitemap-settings')
            .then(r => r.json())
            .then(j => {
                if (cancelled || !j.success) return;
                setItems(j.data.items || { static: [], blogs: [], blogCategories: [], projects: [] });
                const ex = j.data.excludes || {};
                setExcludes({
                    static: new Set(ex.static || []),
                    blogs: new Set(ex.blogs || []),
                    blogCategories: new Set(ex.blogCategories || []),
                    projects: new Set(ex.projects || []),
                });
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const toggleItem = (group, id) => setExcludes(cur => {
        const next = new Set(cur[group]);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { ...cur, [group]: next };
    });

    const bulkSet = (group, allOn) => setExcludes(cur => {
        const list = items[group] || [];
        const next = new Set();
        if (!allOn) for (const it of list) next.add(it.id);
        return { ...cur, [group]: next };
    });

    const save = async () => {
        setSaving(true);
        try {
            const payload = {
                excludes: Object.fromEntries(Object.entries(excludes).map(([k, set]) => [k, [...set]])),
            };
            const res = await fetch('/api/sitemap-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
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

    const sitemapUrl = `${siteUrl}/sitemap.xml`;
    const copyUrl = async () => {
        try { await navigator.clipboard.writeText(sitemapUrl); Swal.fire({ icon: 'success', title: 'Copied', timer: 1000, showConfirmButton: false }); } catch { }
    };

    const counts = useMemo(() => {
        const out = {};
        for (const g of GROUPS) {
            const total = (items[g.key] || []).length;
            const excluded = excludes[g.key]?.size || 0;
            out[g.key] = { total, included: total - excluded };
        }
        return out;
    }, [items, excludes]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-5xl">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Sitemap</h1>
                            <p className="text-sm text-gray-500 mt-1">Toggle which pages, posts and categories appear in your XML sitemap. Items toggled ON are included.</p>
                        </div>
                        <button type="button" onClick={save} disabled={saving}
                            className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
                        <MdInsertLink className="text-blue-600 flex-shrink-0" size={22} />
                        <span className="text-sm text-blue-900 break-all">
                            Your Sitemap URL:{' '}
                            <a target="_blank" rel="noopener noreferrer" href={sitemapUrl} className="font-semibold underline">{sitemapUrl}</a>
                        </span>
                        <button type="button" onClick={copyUrl} className="ml-auto p-2 text-blue-700 hover:bg-blue-100 rounded-lg" title="Copy URL">
                            <MdContentCopy size={18} />
                        </button>
                        <a target="_blank" rel="noopener noreferrer" href={sitemapUrl} className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg" title="Open in new tab">
                            <MdOpenInNew size={18} />
                        </a>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : (
                        <div className="space-y-6">
                            {GROUPS.map(group => {
                                const list = items[group.key] || [];
                                const q = (search[group.key] || '').trim().toLowerCase();
                                const filtered = q
                                    ? list.filter(i => (i.label || '').toLowerCase().includes(q) || (i.sublabel || '').toLowerCase().includes(q))
                                    : list;
                                const allOn = list.length > 0 && (excludes[group.key]?.size || 0) === 0;
                                return (
                                    <section key={group.key} className="bg-white rounded-xl shadow-md">
                                        <header className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
                                            <div className="flex-1 min-w-[220px]">
                                                <h3 className="text-base font-bold text-gray-800">{group.title}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{group.hint}</p>
                                            </div>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {counts[group.key]?.included} / {counts[group.key]?.total} in sitemap
                                            </span>
                                            <button type="button" onClick={() => bulkSet(group.key, !allOn)}
                                                className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                                {allOn ? 'Disable all' : 'Enable all'}
                                            </button>
                                        </header>

                                        {list.length > 8 ? (
                                            <div className="px-5 pt-4">
                                                <div className="relative">
                                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input type="text" value={search[group.key] || ''}
                                                        onChange={e => setSearch(s => ({ ...s, [group.key]: e.target.value }))}
                                                        placeholder="Search…"
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-gold" />
                                                </div>
                                            </div>
                                        ) : null}

                                        {list.length === 0 ? (
                                            <p className="px-5 py-6 text-xs text-gray-400 italic">No items in this group.</p>
                                        ) : (
                                            <div className="divide-y divide-gray-100">
                                                {filtered.map(item => {
                                                    const checked = !excludes[group.key].has(item.id);
                                                    return (
                                                        <div key={item.id} className="px-5 py-3 flex items-center gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                                                                <p className="text-[11px] text-gray-400 truncate">{item.sublabel}</p>
                                                            </div>
                                                            <a target="_blank" rel="noopener noreferrer" href={item.url}
                                                                className="text-[11px] text-gray-400 hover:text-gold" title="Open page">
                                                                <MdOpenInNew size={16} />
                                                            </a>
                                                            <Toggle checked={checked} onChange={() => toggleItem(group.key, item.id)} />
                                                        </div>
                                                    );
                                                })}
                                                {filtered.length === 0 ? (
                                                    <p className="px-5 py-4 text-xs text-gray-400 italic">No items match your search.</p>
                                                ) : null}
                                            </div>
                                        )}
                                    </section>
                                );
                            })}
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
                onClick={onChange}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(); } }}
                className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-gold' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
            </span>
        </label>
    );
}
