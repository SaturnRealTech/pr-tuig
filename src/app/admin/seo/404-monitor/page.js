'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';
import {
    MdSearch, MdDelete, MdRedo, MdOpenInNew, MdRefresh, MdSwapHoriz, MdInfo,
} from 'react-icons/md';

export default function NotFoundMonitor() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [editing, setEditing] = useState(null); // row being converted to a redirect
    const [selected, setSelected] = useState(() => new Set()); // ids of bulk-selected rows
    const [bulkConverting, setBulkConverting] = useState(false); // bulk-convert modal open?

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, sortBy, pagination.page]);

    async function load() {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(pagination.page),
                limit: String(pagination.limit),
                sortBy,
                ...(search ? { search } : {}),
            });
            const j = await (await fetch(`/api/404-log?${params.toString()}`)).json();
            if (j.success) {
                setRows(j.data || []);
                setPagination(j.pagination || pagination);
            }
        } finally { setLoading(false); }
    }

    async function clearAll() {
        const c = await Swal.fire({
            title: 'Clear all 404 logs?',
            text: 'Removes every row. Existing redirects are NOT affected.',
            icon: 'warning', showCancelButton: true, confirmButtonText: 'Clear',
        });
        if (!c.isConfirmed) return;
        const { apiFetch } = await import('@/lib/apiClient');
        await apiFetch('/api/404-log', { method: 'DELETE' });
        load();
    }

    async function deleteRow(id) {
        const { apiFetch } = await import('@/lib/apiClient');
        await apiFetch(`/api/404-log?ids=${encodeURIComponent(id)}`, { method: 'DELETE' });
        setRows(r => r.filter(x => String(x._id) !== id));
        setSelected(s => { const n = new Set(s); n.delete(id); return n; });
    }

    function toggleRow(id) {
        setSelected(s => {
            const n = new Set(s);
            if (n.has(id)) n.delete(id); else n.add(id);
            return n;
        });
    }
    function toggleAll() {
        setSelected(s => {
            const all = rows.map(r => String(r._id));
            const everyone = all.every(id => s.has(id));
            return everyone ? new Set() : new Set(all);
        });
    }
    function clearSelection() { setSelected(new Set()); }

    async function bulkDelete() {
        const ids = [...selected];
        if (ids.length === 0) return;
        const c = await Swal.fire({
            title: `Delete ${ids.length} row(s)?`,
            text: 'They will be removed from the 404 log. Existing redirects are not affected.',
            icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete',
        });
        if (!c.isConfirmed) return;
        const { apiFetch } = await import('@/lib/apiClient');
        await apiFetch(`/api/404-log?ids=${ids.map(encodeURIComponent).join(',')}`, { method: 'DELETE' });
        clearSelection();
        load();
    }

    async function bulkCreateRedirects(destination, statusCode) {
        const ids = [...selected];
        if (ids.length === 0) return;
        const { apiFetch } = await import('@/lib/apiClient');
        const targets = rows.filter(r => selected.has(String(r._id)));
        const results = await Promise.allSettled(targets.map(row =>
            apiFetch('/api/404-log/redirect', {
                method: 'POST',
                body: { source: row.path, destination, statusCode: Number(statusCode) || 301, logId: String(row._id) },
            })
        ));
        const ok = results.filter(r => r.status === 'fulfilled' && r.value?.data?.success).length;
        const fail = results.length - ok;
        setBulkConverting(false);
        clearSelection();
        load();
        await Swal.fire({
            icon: fail === 0 ? 'success' : 'warning',
            title: fail === 0 ? `Created ${ok} redirect(s)` : `${ok} ok · ${fail} failed`,
            timer: 1800, showConfirmButton: false,
        });
    }

    async function createRedirect(row, destination, statusCode) {
        const { apiFetch } = await import('@/lib/apiClient');
        const { data: j } = await apiFetch('/api/404-log/redirect', {
            method: 'POST',
            body: {
                source: row.path,
                destination,
                statusCode: Number(statusCode) || 301,
                logId: String(row._id),
            },
        });
        if (j.success) {
            await Swal.fire({ icon: 'success', title: 'Redirect created', timer: 1500, showConfirmButton: false });
            setEditing(null);
            load();
        } else {
            Swal.fire('Error', j.error || 'Failed', 'error');
        }
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-6xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">404 Monitor</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Every visit to a non-existent URL is captured here. One click turns any row into a redirect.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md">
                        <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
                            <div className="relative flex-1 min-w-[200px]">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') load(); }}
                                    placeholder="Search path or referrer…"
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-gold"
                                />
                            </div>
                            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-gold">
                                <option value="recent">Sort: most recent</option>
                                <option value="hits">Sort: most hits</option>
                            </select>
                            <button type="button" onClick={load} className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
                                <MdRefresh size={14} /> Refresh
                            </button>
                            <button type="button" onClick={clearAll} className="px-3 py-2 border border-red-300 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
                                <MdDelete size={14} /> Clear all
                            </button>
                        </div>

                        {selected.size > 0 ? (
                            <div className="px-5 py-3 bg-gold/5 border-b border-gold/30 flex flex-wrap items-center gap-3 text-xs">
                                <span className="font-semibold text-gray-800">{selected.size} selected</span>
                                <button type="button" onClick={() => setBulkConverting(true)}
                                    className="px-3 py-1.5 bg-gold text-white rounded-lg font-semibold inline-flex items-center gap-1 hover:opacity-90">
                                    <MdSwapHoriz size={14} /> Convert selected to redirects…
                                </button>
                                <button type="button" onClick={bulkDelete}
                                    className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg font-semibold inline-flex items-center gap-1 hover:bg-red-50">
                                    <MdDelete size={14} /> Delete selected
                                </button>
                                <button type="button" onClick={clearSelection} className="text-gray-500 hover:text-gray-800 ml-auto">Clear</button>
                            </div>
                        ) : null}

                        {loading ? (
                            <p className="p-6 text-sm text-gray-500">Loading…</p>
                        ) : rows.length === 0 ? (
                            <div className="p-12 text-center">
                                <MdInfo size={32} className="mx-auto text-gray-300 mb-3" />
                                <p className="text-sm text-gray-500">No 404s logged yet. Any time a visitor hits a non-existent URL, it&apos;ll appear here.</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                            <tr>
                                                <th className="py-2 px-3 w-8">
                                                    <input
                                                        type="checkbox"
                                                        className="accent-gold"
                                                        checked={rows.length > 0 && rows.every(r => selected.has(String(r._id)))}
                                                        onChange={toggleAll}
                                                        aria-label="Select all"
                                                    />
                                                </th>
                                                <th className="py-2 px-4">URL</th>
                                                <th className="py-2 px-4 text-right">Hits</th>
                                                <th className="py-2 px-4">Last seen</th>
                                                <th className="py-2 px-4">Referrer</th>
                                                <th className="py-2 px-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rows.map(r => (
                                                <tr key={String(r._id)} className={`hover:bg-gray-50 ${selected.has(String(r._id)) ? 'bg-gold/5' : ''}`}>
                                                    <td className="py-2 px-3">
                                                        <input
                                                            type="checkbox"
                                                            className="accent-gold"
                                                            checked={selected.has(String(r._id))}
                                                            onChange={() => toggleRow(String(r._id))}
                                                            aria-label={`Select ${r.path}`}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 font-mono text-xs text-gray-800 break-all max-w-[420px]">{r.path}</td>
                                                    <td className="py-2 px-4 text-right font-semibold text-gray-800">{r.count || 0}</td>
                                                    <td className="py-2 px-4 text-xs text-gray-500 whitespace-nowrap">
                                                        {r.lastSeen ? new Date(r.lastSeen).toLocaleString() : '—'}
                                                    </td>
                                                    <td className="py-2 px-4 text-xs text-gray-500 truncate max-w-[200px]" title={r.lastReferrer || ''}>
                                                        {r.lastReferrer || '—'}
                                                    </td>
                                                    <td className="py-2 px-4">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <a href={r.path} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-gold hover:bg-cream rounded" title="Open the broken URL">
                                                                <MdOpenInNew size={16} />
                                                            </a>
                                                            <button type="button" onClick={() => setEditing(r)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded inline-flex items-center gap-1" title="Convert to redirect">
                                                                <MdSwapHoriz size={16} />
                                                            </button>
                                                            <button type="button" onClick={() => deleteRow(String(r._id))} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete row">
                                                                <MdDelete size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</span>
                                    <div className="flex gap-2">
                                        <button type="button" disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-40">Prev</button>
                                        <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-40">Next</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            {editing ? (
                <RedirectModal
                    row={editing}
                    onClose={() => setEditing(null)}
                    onSubmit={createRedirect}
                />
            ) : null}

            {bulkConverting ? (
                <BulkRedirectModal
                    count={selected.size}
                    onClose={() => setBulkConverting(false)}
                    onSubmit={bulkCreateRedirects}
                />
            ) : null}
        </div>
    );
}

function RedirectModal({ row, onClose, onSubmit }) {
    const [destination, setDestination] = useState('/');
    const [statusCode, setStatusCode] = useState(301);
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!destination.trim()) { Swal.fire('Error', 'Destination required', 'error'); return; }
        setSaving(true);
        try {
            await onSubmit(row, destination.trim(), statusCode);
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Create redirect</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Convert this 404 into a permanent redirect. The 404 log row will be removed.
                </p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">From</label>
                        <input value={row.path} disabled className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 font-mono" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">To</label>
                        <input value={destination} onChange={e => setDestination(e.target.value)} autoFocus
                            placeholder="/new-path or https://example.com/new"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold font-mono" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                        <select value={statusCode} onChange={e => setStatusCode(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold">
                            <option value={301}>301 — Moved Permanently</option>
                            <option value={302}>302 — Found (temporary)</option>
                            <option value={307}>307 — Temporary Redirect</option>
                            <option value={308}>308 — Permanent Redirect</option>
                            <option value={410}>410 — Gone</option>
                        </select>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={submit} disabled={saving}
                        className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
                        <MdRedo size={16} /> {saving ? 'Saving…' : 'Create redirect'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function BulkRedirectModal({ count, onClose, onSubmit }) {
    const [destination, setDestination] = useState('/');
    const [statusCode, setStatusCode] = useState(301);
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!destination.trim()) { Swal.fire('Error', 'Destination required', 'error'); return; }
        setSaving(true);
        try {
            await onSubmit(destination.trim(), statusCode);
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-1">Bulk create redirects</h3>
                <p className="text-xs text-gray-500 mb-4">
                    Each of the <strong>{count}</strong> selected URL(s) will be redirected to the destination below.
                    Their 404 log rows will be removed.
                </p>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">To (single destination for all)</label>
                        <input value={destination} onChange={e => setDestination(e.target.value)} autoFocus
                            placeholder="/ or /sitemap or https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold font-mono" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                        <select value={statusCode} onChange={e => setStatusCode(Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold">
                            <option value={301}>301 — Moved Permanently</option>
                            <option value={302}>302 — Found (temporary)</option>
                            <option value={307}>307 — Temporary Redirect</option>
                            <option value={308}>308 — Permanent Redirect</option>
                            <option value={410}>410 — Gone</option>
                        </select>
                    </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="button" onClick={submit} disabled={saving}
                        className="px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
                        <MdRedo size={16} /> {saving ? 'Saving…' : `Create ${count} redirect(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
}
