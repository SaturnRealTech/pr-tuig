'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default function LinkCounterPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState([]);
    const [totals, setTotals] = useState({ internal: 0, external: 0, anchor: 0, total: 0 });
    const [typeFilter, setTypeFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        fetch('/api/link-counter')
            .then(r => r.json())
            .then(j => {
                if (cancelled || !j.success) return;
                setRecords(j.data.records || []);
                setTotals(j.data.totals || { internal: 0, external: 0, anchor: 0, total: 0 });
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return records
            .filter(r => typeFilter === 'all' || r.type === typeFilter)
            .filter(r => !q || (r.title || '').toLowerCase().includes(q) || (r.slug || '').toLowerCase().includes(q))
            .sort((a, b) => (b.total || 0) - (a.total || 0));
    }, [records, search, typeFilter]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-6xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Link Counter</h1>
                        <p className="text-sm text-gray-500 mt-1">Internal and external link counts across every blog post and project.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <StatCard label="Total links" value={totals.total} />
                        <StatCard label="Internal" value={totals.internal} tone="text-emerald-700" />
                        <StatCard label="External" value={totals.external} tone="text-blue-700" />
                        <StatCard label="Anchors / other" value={totals.anchor} tone="text-amber-700" />
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-4">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-gold">
                                <option value="all">All content</option>
                                <option value="blog">Blog posts</option>
                                <option value="project">Pages / projects</option>
                            </select>
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search title or slug…"
                                className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-gold" />
                            <span className="text-xs text-gray-500">{filtered.length} of {records.length}</span>
                        </div>

                        {loading ? (
                            <p className="text-sm text-gray-500">Scanning content…</p>
                        ) : filtered.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No matching records.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="py-2 pr-3">Type</th>
                                            <th className="py-2 pr-3">Title</th>
                                            <th className="py-2 pr-3 text-right">Internal</th>
                                            <th className="py-2 pr-3 text-right">External</th>
                                            <th className="py-2 pr-3 text-right">Anchors</th>
                                            <th className="py-2 pr-3 text-right">Total</th>
                                            <th className="py-2 pr-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filtered.map(r => (
                                            <tr key={`${r.type}-${r.id}`} className="hover:bg-gray-50">
                                                <td className="py-2 pr-3">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${r.type === 'blog' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                        {r.type}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-3 text-gray-800">
                                                    <div className="font-medium truncate max-w-[360px]">{r.title}</div>
                                                    <div className="text-[11px] text-gray-400">/{r.slug}</div>
                                                </td>
                                                <td className="py-2 pr-3 text-right text-emerald-700 font-medium">{r.internal}</td>
                                                <td className="py-2 pr-3 text-right text-blue-700 font-medium">{r.external}</td>
                                                <td className="py-2 pr-3 text-right text-amber-700">{r.anchor}</td>
                                                <td className="py-2 pr-3 text-right font-semibold text-gray-800">{r.total}</td>
                                                <td className="py-2 pr-3 text-right">
                                                    <a target="_blank" rel="noopener noreferrer"
                                                        href={r.type === 'blog' ? `/blog/${r.slug}` : `/${r.slug}`}
                                                        className="text-xs text-gold hover:underline">View</a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatCard({ label, value, tone = 'text-gray-800' }) {
    return (
        <div className="bg-white rounded-xl shadow-md p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
        </div>
    );
}
