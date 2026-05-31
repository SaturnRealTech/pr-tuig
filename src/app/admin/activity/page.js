'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MdHistory, MdRefresh, MdFilterAlt, MdClose, MdLogin, MdAdd, MdEdit, MdDelete, MdAdminPanelSettings, MdDeleteSweep } from 'react-icons/md';
import Swal from 'sweetalert2';
import AdminSidebar from '@/components/AdminSidebar';

const TYPE_OPTIONS = [
    { value: '', label: 'All types' },
    { value: 'project', label: 'Projects' },
    { value: 'blog', label: 'Blogs' },
    { value: 'settings', label: 'Settings' },
    { value: 'user', label: 'Users' },
    { value: 'auth', label: 'Auth (logins)' },
];

const ACTION_OPTIONS = [
    { value: '', label: 'All actions' },
    { value: 'create', label: 'Create' },
    { value: 'edit', label: 'Edit' },
    { value: 'delete', label: 'Delete' },
    { value: 'login', label: 'Login' },
    { value: 'permissions', label: 'Permissions' },
];

function actionIcon(action) {
    if (action === 'create') return <MdAdd className="text-green-600" />;
    if (action === 'delete') return <MdDelete className="text-red-600" />;
    if (action === 'login') return <MdLogin className="text-blue-600" />;
    if (action === 'permissions') return <MdAdminPanelSettings className="text-purple-600" />;
    return <MdEdit className="text-gold" />;
}

function actionPill(action) {
    const map = {
        create: 'bg-green-100 text-green-800',
        edit: 'bg-amber-100 text-amber-800',
        delete: 'bg-red-100 text-red-800',
        login: 'bg-blue-100 text-blue-800',
        permissions: 'bg-purple-100 text-purple-800',
    };
    return map[action] || 'bg-gray-100 text-gray-800';
}

function typePill(type) {
    const map = {
        project: 'bg-purple-50 text-purple-700 border-purple-200',
        blog: 'bg-blue-50 text-blue-700 border-blue-200',
        settings: 'bg-amber-50 text-amber-700 border-amber-200',
        user: 'bg-pink-50 text-pink-700 border-pink-200',
        auth: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return map[type] || 'bg-gray-50 text-gray-700 border-gray-200';
}

function fmtWhen(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return {
        date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
}

export default function ActivityLogPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({ type: '', action: '', userEmail: '', q: '', from: '', to: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [page, setPage] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);
    const limit = 100;

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        const parsed = JSON.parse(userData);
        if (parsed.role !== 'admin') { router.push('/admin/dashboard'); return; }
        setUser(parsed);
    }, [router]);

    const queryString = useMemo(() => {
        const p = new URLSearchParams();
        if (filters.type) p.set('type', filters.type);
        if (filters.action) p.set('action', filters.action);
        if (filters.userEmail) p.set('userEmail', filters.userEmail);
        if (filters.q) p.set('q', filters.q);
        if (filters.from) p.set('from', new Date(filters.from).toISOString());
        if (filters.to) p.set('to', new Date(filters.to).toISOString());
        p.set('limit', String(limit));
        p.set('skip', String(page * limit));
        return p.toString();
    }, [filters, page]);

    const fetchRows = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/activity?${queryString}`);
            const json = await res.json();
            if (json.success) {
                setRows(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [queryString]);

    useEffect(() => {
        if (user) fetchRows();
    }, [user, fetchRows]);

    // Drop selections when the visible page changes — a checked id that's no
    // longer in `rows` would otherwise stay armed and silently delete on the
    // next bulk action.
    useEffect(() => {
        setSelectedIds([]);
    }, [page, filters]);

    const clearFilters = () => {
        setFilters({ type: '', action: '', userEmail: '', q: '', from: '', to: '' });
        setPage(0);
    };

    const toggleSelect = (id) =>
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleAll = () => {
        const visibleIds = rows.map(r => r._id).filter(Boolean);
        setSelectedIds(prev => prev.length === visibleIds.length ? [] : visibleIds);
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        const confirm = await Swal.fire({
            title: `Delete ${selectedIds.length} ${selectedIds.length === 1 ? 'entry' : 'entries'}?`,
            text: 'This permanently removes the selected activity log entries. This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete',
        });
        if (!confirm.isConfirmed) return;
        try {
            setDeleting(true);
            const res = await fetch('/api/activity', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds }),
            });
            const json = await res.json();
            if (!json.success) {
                Swal.fire('Could not delete', json.error || 'Unknown error', 'error');
                return;
            }
            setSelectedIds([]);
            await fetchRows();
            await Swal.fire({
                title: 'Deleted',
                text: `${json.deletedCount || 0} ${json.deletedCount === 1 ? 'entry' : 'entries'} removed.`,
                icon: 'success',
                confirmButtonColor: '#b27e02',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (e) {
            Swal.fire('Network error', e.message, 'error');
        } finally {
            setDeleting(false);
        }
    };

    const activeFilterCount =
        (filters.type ? 1 : 0) + (filters.action ? 1 : 0) + (filters.userEmail ? 1 : 0) +
        (filters.q ? 1 : 0) + (filters.from ? 1 : 0) + (filters.to ? 1 : 0);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-8 flex flex-wrap gap-4 justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <MdHistory className="text-gold" /> Activity Log
                            </h1>
                            <p className="text-gray-600">Who did what — every create, edit, delete, and login.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <button onClick={handleBulkDelete} disabled={deleting}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                                    <MdDeleteSweep size={20} />
                                    {deleting ? 'Deleting…' : `Delete ${selectedIds.length} selected`}
                                </button>
                            )}
                            <button onClick={() => setShowFilters(v => !v)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${showFilters || activeFilterCount > 0 ? 'bg-gold text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                                <MdFilterAlt size={20} /> Filters
                                {activeFilterCount > 0 && (
                                    <span className="ml-1 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-white text-gold text-xs font-bold px-1.5">{activeFilterCount}</span>
                                )}
                            </button>
                            <button onClick={fetchRows}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                                <MdRefresh size={20} /> Refresh
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="bg-white rounded-xl shadow border border-gray-100 p-5 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                                    <select value={filters.type}
                                        onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(0); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-gray-800 text-sm">
                                        {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Action</label>
                                    <select value={filters.action}
                                        onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(0); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-gray-800 text-sm">
                                        {ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">User email</label>
                                    <input type="text" value={filters.userEmail}
                                        onChange={e => { setFilters(f => ({ ...f, userEmail: e.target.value })); setPage(0); }}
                                        placeholder="exact match"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-gray-800 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Search</label>
                                    <input type="text" value={filters.q}
                                        onChange={e => { setFilters(f => ({ ...f, q: e.target.value })); setPage(0); }}
                                        placeholder="title, section, email"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-gray-800 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">From</label>
                                    <input type="datetime-local" value={filters.from}
                                        onChange={e => { setFilters(f => ({ ...f, from: e.target.value })); setPage(0); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-gray-800 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">To</label>
                                    <input type="datetime-local" value={filters.to}
                                        onChange={e => { setFilters(f => ({ ...f, to: e.target.value })); setPage(0); }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-gray-800 text-sm" />
                                </div>
                            </div>
                            {activeFilterCount > 0 && (
                                <div className="mt-4">
                                    <button onClick={clearFilters}
                                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 font-semibold">
                                        <MdClose size={16} /> Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                            <p className="text-sm text-gray-600">
                                {loading ? 'Loading…' : `${total.toLocaleString()} entries${activeFilterCount > 0 ? ' (filtered)' : ''}`}
                            </p>
                            <div className="text-xs text-gray-500">
                                Showing {rows.length === 0 ? 0 : page * limit + 1}–{page * limit + rows.length}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                aria-label="Select all rows on this page"
                                                checked={rows.length > 0 && selectedIds.length === rows.length}
                                                onChange={toggleAll}
                                                className="w-4 h-4 accent-gold cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">When</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">User</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Type</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Action</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Item / Section</th>
                                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading && (
                                        <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading…</td></tr>
                                    )}
                                    {!loading && rows.length === 0 && (
                                        <tr><td colSpan={7} className="text-center py-12 text-gray-500">
                                            <MdHistory className="text-5xl text-gray-300 mx-auto mb-2" />
                                            No activity matches these filters.
                                        </td></tr>
                                    )}
                                    {!loading && rows.map((r, i) => {
                                        const when = fmtWhen(r.at);
                                        const checked = selectedIds.includes(r._id);
                                        return (
                                            <tr key={r._id || i} className={`hover:bg-gray-50 ${checked ? 'bg-amber-50/40' : ''}`}>
                                                <td className="px-4 py-3 align-top">
                                                    <input
                                                        type="checkbox"
                                                        aria-label="Select this row"
                                                        checked={checked}
                                                        onChange={() => toggleSelect(r._id)}
                                                        className="w-4 h-4 accent-gold cursor-pointer mt-1"
                                                    />
                                                </td>
                                                <td className="px-5 py-3 align-top">
                                                    <div className="text-sm text-gray-800 font-medium">{when.date}</div>
                                                    <div className="text-xs text-gray-500">{when.time}</div>
                                                </td>
                                                <td className="px-5 py-3 align-top">
                                                    <div className="text-sm text-gray-800 font-medium truncate max-w-[220px]" title={r.userEmail}>{r.userEmail || '—'}</div>
                                                    {r.userRole && <div className="text-xs text-gray-500">{r.userRole}</div>}
                                                </td>
                                                <td className="px-5 py-3 align-top">
                                                    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full border ${typePill(r.type)}`}>{r.type}</span>
                                                </td>
                                                <td className="px-5 py-3 align-top">
                                                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${actionPill(r.action)}`}>
                                                        {actionIcon(r.action)} {r.action}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 align-top">
                                                    {r.refTitle && <div className="text-sm text-gray-800 font-medium truncate max-w-[360px]" title={r.refTitle}>{r.refTitle}</div>}
                                                    {r.section && <div className="text-xs text-gray-500 truncate max-w-[360px]" title={r.section}>{r.section}</div>}
                                                    {!r.refTitle && !r.section && <span className="text-xs text-gray-400">—</span>}
                                                </td>
                                                <td className="px-5 py-3 align-top text-xs text-gray-500">{r.ip || '—'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {total > limit && (
                            <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                                    className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                                    ← Previous
                                </button>
                                <span className="text-xs text-gray-500">Page {page + 1} of {Math.ceil(total / limit)}</span>
                                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * limit >= total}
                                    className="px-3 py-1.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                                    Next →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
