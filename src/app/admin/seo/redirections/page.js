'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const STATUS_OPTIONS = [
    { value: 301, label: '301 — Permanent' },
    { value: 302, label: '302 — Temporary' },
    { value: 307, label: '307 — Temporary (POST preserved)' },
    { value: 308, label: '308 — Permanent (POST preserved)' },
    { value: 410, label: '410 — Gone' },
];

const MATCH_OPTIONS = [
    { value: 'exact', label: 'Exact' },
    { value: 'prefix', label: 'Prefix' },
];

export default function RedirectionsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState({
        source: '',
        destination: '',
        statusCode: 301,
        matchType: 'exact',
        isActive: true,
        note: '',
    });
    const [creating, setCreating] = useState(false);
    const [perPage, setPerPage] = useState(100);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, totalPages: 1 });

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        fetchRedirects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, perPage, page]);

    // Reset to page 1 whenever the page-size changes so we don't end up on a
    // page that no longer exists.
    useEffect(() => { setPage(1); }, [perPage]);

    const fetchRedirects = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/redirects?limit=${perPage}&page=${page}`);
            const json = await res.json();
            if (json.success) {
                setItems(json.data || []);
                if (json.pagination) setPagination(json.pagination);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const create = async (e) => {
        e.preventDefault();
        if (!form.source.trim() || !form.destination.trim()) {
            Swal.fire('Missing fields', 'Source and destination are required.', 'warning');
            return;
        }
        setCreating(true);
        try {
            const res = await fetch('/api/redirects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (json.success) {
                setForm({ source: '', destination: '', statusCode: 301, matchType: 'exact', isActive: true, note: '' });
                fetchRedirects();
            } else {
                Swal.fire('Error', json.error || 'Failed to create redirect', 'error');
            }
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setCreating(false);
        }
    };

    const update = async (id, patch) => {
        try {
            const res = await fetch(`/api/redirects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            const json = await res.json();
            if (!json.success) Swal.fire('Error', json.error || 'Update failed', 'error');
            fetchRedirects();
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        }
    };

    const remove = async (id) => {
        const res = await Swal.fire({
            title: 'Delete redirect?',
            text: 'This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, delete',
        });
        if (!res.isConfirmed) return;
        try {
            const r = await fetch(`/api/redirects/${id}`, { method: 'DELETE' });
            const json = await r.json();
            if (json.success) fetchRedirects();
            else Swal.fire('Error', json.error || 'Delete failed', 'error');
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        }
    };

    const visible = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return items;
        return items.filter(r =>
            (r.source || '').toLowerCase().includes(q) ||
            (r.destination || '').toLowerCase().includes(q) ||
            (r.note || '').toLowerCase().includes(q)
        );
    }, [items, search]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-6xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Redirections</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage 301/302 redirects without redeploying. Hits are counted automatically.</p>
                    </div>

                    {/* Create form */}
                    <form onSubmit={create} className="bg-white rounded-xl shadow-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-12 text-xs text-gray-500 -mb-1">
                            <strong className="text-gray-700">Tip:</strong> Source must be a path on this site (e.g. <code className="bg-gray-100 px-1 rounded">/old-page</code>). Destination can be a path or a full external URL (<code className="bg-gray-100 px-1 rounded">https://example.com</code>).
                        </div>
                        <input type="text" value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                            placeholder="From  /old-url"
                            className="md:col-span-4 px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:border-gold" />
                        <input type="text" value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}
                            placeholder="To  /new-url  or  https://example.com"
                            className="md:col-span-4 px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:border-gold" />
                        <select value={form.statusCode} onChange={e => setForm(p => ({ ...p, statusCode: Number(e.target.value) }))}
                            className="md:col-span-2 px-3 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gold">
                            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <select value={form.matchType} onChange={e => setForm(p => ({ ...p, matchType: e.target.value }))}
                            className="md:col-span-1 px-3 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gold">
                            {MATCH_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <button type="submit" disabled={creating}
                            className="md:col-span-1 px-4 py-3 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
                            {creating ? '…' : 'Add'}
                        </button>
                        <input type="text" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                            placeholder="Optional note"
                            className="md:col-span-12 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-gold" />
                    </form>

                    {/* Filter */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search source, destination or note…"
                            className="flex-1 min-w-[220px] px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-gold" />
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="font-semibold">Show</span>
                            <select
                                value={perPage}
                                onChange={e => setPerPage(Number(e.target.value))}
                                className="px-2.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-gold"
                            >
                                {[10, 50, 100, 500, 1000, 1500].map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                                <option value={0}>All</option>
                            </select>
                        </label>
                        <span className="text-sm text-gray-500">
                            {(() => {
                                const start = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
                                const end = Math.min(pagination.page * pagination.limit, pagination.total);
                                return `${start}–${end} of ${pagination.total}`;
                            })()}
                        </span>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        {loading ? (
                            <p className="p-8 text-center text-gray-500 text-sm">Loading…</p>
                        ) : visible.length === 0 ? (
                            <p className="p-8 text-center text-gray-400 text-sm">No redirects yet — add your first one above.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3 text-left">From</th>
                                            <th className="px-4 py-3 text-left">To</th>
                                            <th className="px-4 py-3 text-center w-16">Code</th>
                                            <th className="px-4 py-3 text-center w-20">Match</th>
                                            <th className="px-4 py-3 text-center w-16">Hits</th>
                                            <th className="px-4 py-3 text-center w-20">Active</th>
                                            <th className="px-4 py-3 text-right w-20">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visible.map((r, i) => (
                                            <tr key={r.id} className={`border-t border-gray-100 ${i % 2 ? 'bg-gray-50/40' : ''}`}>
                                                <td className="px-4 py-3 font-mono text-gray-800 break-all">{r.source}</td>
                                                <td className="px-4 py-3 font-mono text-gray-800 break-all">{r.destination}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <select value={r.statusCode} onChange={e => update(r.id, { statusCode: Number(e.target.value) })}
                                                        className="text-xs bg-transparent text-gray-700 focus:outline-none">
                                                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-3 text-center text-xs uppercase tracking-wider text-gray-500">{r.matchType}</td>
                                                <td className="px-4 py-3 text-center font-mono text-gray-700">{r.hits || 0}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button type="button" onClick={() => update(r.id, { isActive: !r.isActive })}
                                                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${r.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                        {r.isActive ? 'ON' : 'OFF'}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button type="button" onClick={() => remove(r.id)}
                                                        className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Pager */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                            <span className="text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button type="button" onClick={() => setPage(1)} disabled={pagination.page <= 1}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                    « First
                                </button>
                                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.page <= 1}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                    ‹ Prev
                                </button>
                                <input
                                    type="number"
                                    min={1}
                                    max={pagination.totalPages}
                                    value={pagination.page}
                                    onChange={e => {
                                        const n = Math.max(1, Math.min(Number(e.target.value) || 1, pagination.totalPages));
                                        setPage(n);
                                    }}
                                    className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-center text-gray-700 focus:outline-none focus:border-gold"
                                />
                                <button type="button" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={pagination.page >= pagination.totalPages}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                    Next ›
                                </button>
                                <button type="button" onClick={() => setPage(pagination.totalPages)} disabled={pagination.page >= pagination.totalPages}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                                    Last »
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
