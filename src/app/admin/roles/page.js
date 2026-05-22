'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const ACTION_LABEL = { view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete' };

export default function RolesPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [meta, setMeta] = useState({ roles: [], modules: [], actions: [], defaults: {} });
    const [permissions, setPermissions] = useState({});

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        fetch('/api/roles')
            .then(r => r.json())
            .then(j => {
                if (cancelled || !j.success) return;
                setMeta({
                    roles: j.data.roles || [],
                    modules: j.data.modules || [],
                    actions: j.data.actions || [],
                    defaults: j.data.defaults || {},
                });
                setPermissions(j.data.permissions || {});
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const hasAction = (role, mod, action) => {
        const arr = permissions?.[role]?.[mod];
        return Array.isArray(arr) && arr.includes(action);
    };

    const toggle = (role, mod, action) => {
        if (role === 'admin') return; // admin is locked to all
        setPermissions(prev => {
            const next = { ...prev };
            const roleMap = { ...(next[role] || {}) };
            const cur = Array.isArray(roleMap[mod]) ? new Set(roleMap[mod]) : new Set();
            if (cur.has(action)) cur.delete(action);
            else cur.add(action);
            roleMap[mod] = Array.from(cur);
            next[role] = roleMap;
            return next;
        });
    };

    const toggleAllRow = (role, mod, on) => {
        if (role === 'admin') return;
        setPermissions(prev => {
            const next = { ...prev };
            const roleMap = { ...(next[role] || {}) };
            roleMap[mod] = on ? [...meta.actions] : [];
            next[role] = roleMap;
            return next;
        });
    };

    const resetToDefaults = async () => {
        const res = await Swal.fire({
            title: 'Reset to defaults?',
            text: 'All custom permissions for editor/viewer will be replaced with the built-in defaults.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, reset',
            confirmButtonColor: '#dc2626',
        });
        if (!res.isConfirmed) return;
        setPermissions(JSON.parse(JSON.stringify(meta.defaults)));
    };

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/roles', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions }),
            });
            const j = await res.json();
            if (j.success) {
                Swal.fire({ icon: 'success', title: 'Saved', text: 'Role permissions updated.', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire('Error', j.error || 'Save failed', 'error');
            }
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
                <div className="p-8 max-w-6xl">
                    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Role Manager</h1>
                            <p className="text-sm text-gray-500 mt-1">Define what each role can view, create, edit and delete. Admins always have full access.</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={resetToDefaults}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition">
                                Reset to defaults
                            </button>
                            <button type="button" onClick={save} disabled={saving}
                                className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
                                {saving ? 'Saving…' : 'Save permissions'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-gray-500 text-sm">Loading…</p>
                    ) : (
                        <div className="space-y-8">
                            {meta.roles.map(role => (
                                <div key={role} className="bg-white rounded-xl shadow-lg overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-800 capitalize">{role}</h2>
                                            <p className="text-xs text-gray-500">{role === 'admin' ? 'Full access — locked.' : 'Tick the actions this role is allowed to perform.'}</p>
                                        </div>
                                        {role === 'admin' && (
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Locked</span>
                                        )}
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                                                <tr>
                                                    <th className="px-5 py-3 text-left">Module</th>
                                                    {meta.actions.map(a => (
                                                        <th key={a} className="px-3 py-3 text-center w-20">{ACTION_LABEL[a] || a}</th>
                                                    ))}
                                                    <th className="px-3 py-3 text-right w-24">Quick</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {meta.modules.map((mod, i) => {
                                                    const all = meta.actions.every(a => role === 'admin' || hasAction(role, mod, a));
                                                    return (
                                                        <tr key={mod} className={`border-t border-gray-100 ${i % 2 ? 'bg-gray-50/40' : ''}`}>
                                                            <td className="px-5 py-3 font-mono text-gray-700">{mod}</td>
                                                            {meta.actions.map(a => {
                                                                const checked = role === 'admin' ? true : hasAction(role, mod, a);
                                                                return (
                                                                    <td key={a} className="px-3 py-3 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={checked}
                                                                            disabled={role === 'admin'}
                                                                            onChange={() => toggle(role, mod, a)}
                                                                            className="w-4 h-4 accent-gold cursor-pointer disabled:cursor-not-allowed"
                                                                        />
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="px-3 py-3 text-right">
                                                                <button
                                                                    type="button"
                                                                    disabled={role === 'admin'}
                                                                    onClick={() => toggleAllRow(role, mod, !all)}
                                                                    className="text-[11px] font-semibold text-gray-600 hover:text-gold disabled:opacity-40 transition"
                                                                >
                                                                    {all ? 'Clear' : 'All'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
