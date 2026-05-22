'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

const RANGES = [
    { id: '24h', label: 'Last 24 h' },
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
    { id: '365d', label: 'Last 365 days' },
];

function nFmt(n) {
    if (n == null) return '0';
    return n.toLocaleString('en-IN');
}

function shortReferrer(r) {
    if (!r || r === '(direct)') return '(direct)';
    try { return new URL(r).host; } catch { return r; }
}

function timeAgo(iso) {
    if (!iso) return '';
    const d = Date.now() - new Date(iso).getTime();
    if (d < 60_000) return 'just now';
    if (d < 3600_000) return `${Math.floor(d / 60_000)} m ago`;
    if (d < 86400_000) return `${Math.floor(d / 3600_000)} h ago`;
    return `${Math.floor(d / 86400_000)} d ago`;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [range, setRange] = useState('30d');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        fetch(`/api/analytics/summary?range=${range}`)
            .then(r => r.json())
            .then(j => { if (!cancelled && j.success) setData(j.data); })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [range, user]);

    const maxDaily = useMemo(() => {
        if (!data?.daily?.length) return 0;
        return Math.max(...data.daily.map(d => d.count));
    }, [data]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-7xl">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Analytics</h1>
                            <p className="text-sm text-gray-500 mt-1">Self-hosted page-view analytics. No third-party tracking.</p>
                        </div>
                        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                            {RANGES.map(r => (
                                <button key={r.id} type="button"
                                    onClick={() => setRange(r.id)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${range === r.id ? 'bg-gold text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading || !data ? (
                        <p className="text-gray-500 text-sm">Loading…</p>
                    ) : (
                        <>
                            {/* KPI cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-xl shadow p-5">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Page views</p>
                                    <p className="mt-1 text-3xl font-bold text-gray-800">{nFmt(data.totals?.pageViews)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow p-5">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Sessions</p>
                                    <p className="mt-1 text-3xl font-bold text-gray-800">{nFmt(data.totals?.sessions)}</p>
                                </div>
                                <div className="bg-white rounded-xl shadow p-5">
                                    <p className="text-[11px] uppercase tracking-wider text-gray-500">Unique visitors (hashed IP)</p>
                                    <p className="mt-1 text-3xl font-bold text-gray-800">{nFmt(data.totals?.uniqueIps)}</p>
                                </div>
                            </div>

                            {/* Daily bars */}
                            <div className="bg-white rounded-xl shadow p-5 mb-6">
                                <p className="text-sm font-semibold text-gray-700 mb-3">Daily page views</p>
                                {data.daily.length === 0 ? (
                                    <p className="text-xs text-gray-400">No traffic yet in this range.</p>
                                ) : (
                                    <div className="flex items-end gap-1 h-40">
                                        {data.daily.map(d => {
                                            const h = maxDaily ? Math.max(3, Math.round((d.count / maxDaily) * 100)) : 0;
                                            return (
                                                <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
                                                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-500 transition">{d.count}</span>
                                                    <div className="w-full bg-gold/80 rounded-t" style={{ height: `${h}%` }} title={`${d.day}: ${d.count}`} />
                                                    <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.day.slice(5)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Two-column tables */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <RankList title="Top pages" rows={data.topPages} labelKey="path" />
                                <RankList title="Top referrers" rows={data.topReferrers} labelKey="referrer" formatLabel={shortReferrer} />
                                <RankList title="Devices" rows={data.devices} labelKey="device" />
                                <RankList title="Browsers" rows={data.browsers} labelKey="browser" />
                            </div>

                            {/* Recent visits */}
                            <div className="bg-white rounded-xl shadow overflow-hidden">
                                <p className="px-5 py-3 text-sm font-semibold text-gray-700 border-b border-gray-100">Recent visits</p>
                                {data.recent.length === 0 ? (
                                    <p className="px-5 py-6 text-xs text-gray-400">No visits captured yet.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                                                <tr>
                                                    <th className="px-4 py-2 text-left">Time</th>
                                                    <th className="px-4 py-2 text-left">Path</th>
                                                    <th className="px-4 py-2 text-left">Referrer</th>
                                                    <th className="px-4 py-2 text-left">Device</th>
                                                    <th className="px-4 py-2 text-left">Browser</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.recent.map((v, i) => (
                                                    <tr key={i} className={i % 2 ? 'bg-gray-50/40' : ''}>
                                                        <td className="px-4 py-2 text-xs text-gray-500" title={v.ts}>{timeAgo(v.ts)}</td>
                                                        <td className="px-4 py-2 text-gray-800 font-mono text-xs break-all">{v.path}</td>
                                                        <td className="px-4 py-2 text-gray-500 text-xs break-all">{shortReferrer(v.referrer)}</td>
                                                        <td className="px-4 py-2 text-gray-700 text-xs capitalize">{v.device || 'desktop'}</td>
                                                        <td className="px-4 py-2 text-gray-700 text-xs">{v.browser || ''}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

function RankList({ title, rows, labelKey, formatLabel }) {
    const total = rows.reduce((a, r) => a + (r.count || 0), 0);
    return (
        <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
            {rows.length === 0 ? (
                <p className="text-xs text-gray-400">No data.</p>
            ) : (
                <ul className="space-y-2">
                    {rows.map((r, i) => {
                        const label = formatLabel ? formatLabel(r[labelKey]) : r[labelKey];
                        const pct = total ? Math.round((r.count / total) * 100) : 0;
                        return (
                            <li key={i} className="relative">
                                <div className="flex items-center justify-between text-xs gap-3">
                                    <span className="truncate text-gray-700 font-mono" title={r[labelKey]}>{label || '(empty)'}</span>
                                    <span className="text-gray-500 font-semibold shrink-0">{nFmt(r.count)}<span className="ml-1 text-gray-400 font-normal">({pct}%)</span></span>
                                </div>
                                <div className="absolute inset-x-0 -bottom-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gold/70 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
