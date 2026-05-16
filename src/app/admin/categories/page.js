'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdAdd, MdDelete, MdEdit,
    MdFolder,
    MdCategory
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

export default function CategoriesManagement() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Group modal
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [savingGroup, setSavingGroup] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchCategories();
    }, [router]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/categories');
            const result = await res.json();
            if (result.success) setCategories(result.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Separate groups and categories, nest categories under their group, and build category trees
    const { groups, ungrouped, groupMap } = useMemo(() => {
        const groups = categories.filter(c => c.type === 'group');
        const cats = categories.filter(c => c.type !== 'group');
        const groupMap = {};
        groups.forEach(g => { groupMap[g._id.toString()] = []; });
        const ungrouped = [];
        cats.forEach(c => {
            const gid = c.groupId?.toString?.();
            if (gid && groupMap[gid]) groupMap[gid].push(c);
            else ungrouped.push(c);
        });
        // Helper to build a tree from a flat list
        function buildTree(list, parentId = '') {
            return list
                .filter(cat => (cat.parentId ? cat.parentId.toString() : '') === parentId)
                .map(cat => ({
                    ...cat,
                    children: buildTree(list, cat._id.toString()),
                }));
        }
        // Build trees for each group and for ungrouped
        Object.keys(groupMap).forEach(gid => {
            groupMap[gid] = buildTree(groupMap[gid]);
        });
        const ungroupedTree = buildTree(ungrouped);
        return { groups, ungrouped: ungroupedTree, groupMap };
    }, [categories]);

    const handleAddGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;
        setSavingGroup(true);
        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newGroupName.trim(), type: 'group' }),
            });
            const result = await res.json();
            if (result.success) {
                setShowGroupModal(false);
                setNewGroupName('');
                fetchCategories();
            } else {
                Swal.fire('Error', result.error, 'error');
            }
        } catch { Swal.fire('Error', 'Failed to create group', 'error'); }
        finally { setSavingGroup(false); }
    };

    const handleDelete = async (id, name, isGroup, childCount) => {
        const text = isGroup
            ? `Delete group "${name}"? Its ${childCount} categor${childCount === 1 ? 'y' : 'ies'} will become ungrouped.`
            : `Delete category "${name}"? This cannot be undone.`;

        const result = await Swal.fire({
            title: isGroup ? 'Delete Group?' : 'Delete Category?',
            text, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#b27e02',
            cancelButtonColor: '#6b7280', confirmButtonText: 'Yes, delete',
        });
        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                await Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
                fetchCategories();
            } else {
                Swal.fire('Error', data.error, 'error');
            }
        } catch { Swal.fire('Error', 'Failed to delete', 'error'); }
    };


    const totalGroups = groups.length;
    const totalCats = categories.filter(c => c.type !== 'group').length;

    const renderCategoryRows = (tree, level = 0) => {
        return tree.flatMap(cat => [
            <tr key={cat._id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 w-10">
                    {cat.logo ? (
                        <img src={cat.logo} alt={cat.name} className="w-9 h-9 object-contain rounded-lg border border-gray-200 bg-white p-0.5" />
                    ) : cat.heroImage ? (
                        <img src={cat.heroImage} alt={cat.name} className="w-9 h-9 object-cover rounded-lg border border-gray-200" />
                    ) : (
                        <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <MdLabel className="text-gray-400" size={16} />
                        </div>
                    )}
                </td>
                <td className="px-3 py-3">
                    <span style={{ paddingLeft: `${level * 20}px` }}>
                        <span className="font-semibold text-gray-800">{cat.name}</span>
                    </span>
                    {cat.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>}
                </td>
                <td className="px-3 py-3">
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">/{cat.slug}</span>
                </td>
                <td className="px-3 py-3 text-gray-500 text-xs">{cat.count || 0} posts</td>
                <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/admin/categories/edit/${cat._id}`)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                            <MdEdit size={16} />
                        </button>
                        {user?.role === 'admin' && (
                        <button onClick={() => handleDelete(cat._id, cat.name, false, 0)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <MdDelete size={16} />
                        </button>
                        )}
                    </div>
                </td>
            </tr>,
            ...renderCategoryRows(cat.children || [], level + 1),
        ]);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">

                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
                            <p className="text-sm text-gray-500 mt-0.5">{totalGroups} groups · {totalCats} categories</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowGroupModal(true)}
                                className="flex items-center gap-2 border-2 border-[#b27e02] text-[#b27e02] font-semibold py-2 px-5 rounded-lg hover:bg-[#fef9e7] transition text-sm"
                            >
                                <MdFolder size={18} /> Add Group
                            </button>
                            <button
                                onClick={() => router.push('/admin/categories/create')}
                                className="flex items-center gap-2 bg-[#b27e02] text-white font-semibold py-2 px-5 rounded-lg hover:bg-[#8a6002] transition shadow-sm text-sm"
                            >
                                <MdAdd size={18} /> Add Category
                            </button>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#b27e02]/20 inline-block border border-[#b27e02]/30"></span> Group (no public page)</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-white inline-block border border-gray-200"></span> Category (has public page)</span>
                    </div>

                    {loading ? (
                        <div className="bg-white rounded-xl shadow p-16 text-center">
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">

                            {/* Groups + their categories */}
                            {groups.map(group => {
                                const children = groupMap[group._id.toString()] || [];
                                return (
                                    <div key={group._id} className="bg-white rounded-xl shadow overflow-hidden">
                                        {/* Group header row */}
                                        <div className="flex items-center justify-between px-5 py-3 bg-[#fef9e7] border-b border-[#f0d090]">
                                            <div className="flex items-center gap-2">
                                                <MdFolder className="text-[#b27e02]" size={20} />
                                                <span className="font-bold text-gray-800">{group.name}</span>
                                                <span className="ml-2 text-xs bg-[#b27e02]/10 text-[#8a6002] px-2 py-0.5 rounded-full font-medium">
                                                    GROUP
                                                </span>
                                                <span className="text-xs text-gray-400">{children.length} categor{children.length === 1 ? 'y' : 'ies'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => router.push(`/admin/categories/create?groupId=${group._id}`)}
                                                    title="Add category in this group"
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[#b27e02] text-white rounded-lg hover:bg-[#8a6002] transition font-semibold"
                                                >
                                                    <MdAdd size={14} /> Add
                                                </button>
                                                {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(group._id, group.name, true, children.length)}
                                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                                                    title="Delete group"
                                                >
                                                    <MdDelete size={17} />
                                                </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Children */}
                                        {children.length === 0 ? (
                                            <div className="px-5 py-4 text-sm text-gray-400 italic">
                                                No categories yet.{' '}
                                                <button
                                                    onClick={() => router.push(`/admin/categories/create?groupId=${group._id}`)}
                                                    className="text-[#b27e02] font-semibold hover:underline"
                                                >
                                                    Add one →
                                                </button>
                                            </div>
                                        ) : (
                                            <table className="w-full text-sm">
                                                <tbody className="divide-y divide-gray-50">
                                                    {/* Recursive tree rendering for categories */}
                                                    {children.length === 0 ? null : renderCategoryRows(children)}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Ungrouped categories */}
                            {ungrouped.length > 0 && (
                                <div className="bg-white rounded-xl shadow overflow-hidden">
                                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                        <MdCategory className="text-gray-400" size={18} />
                                        <span className="font-semibold text-gray-600">Ungrouped</span>
                                        <span className="text-xs text-gray-400">{ungrouped.length} categor{ungrouped.length === 1 ? 'y' : 'ies'}</span>
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody className="divide-y divide-gray-50">
                                            {renderCategoryRows(ungrouped)}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {groups.length === 0 && ungrouped.length === 0 && (
                                <div className="bg-white rounded-xl shadow p-16 text-center">
                                    <MdCategory className="text-5xl text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-gray-700 mb-2">No groups or categories yet</h3>
                                    <p className="text-gray-500 mb-5 text-sm">Start by adding a group (e.g. Location, Builder), then add categories inside it.</p>
                                    <button onClick={() => setShowGroupModal(true)}
                                        className="bg-[#b27e02] text-white px-5 py-2 rounded-lg hover:bg-[#8a6002] transition font-semibold text-sm">
                                        Add First Group
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Add Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <MdFolder className="text-[#b27e02]" size={22} />
                                <h3 className="text-lg font-bold text-gray-800">Add Group</h3>
                            </div>
                            <button onClick={() => { setShowGroupModal(false); setNewGroupName(''); }}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                                <MdClose size={22} />
                            </button>
                        </div>
                        <form onSubmit={handleAddGroup} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Group Name <span className="text-[#b27e02]">*</span></label>
                                <input
                                    type="text"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    autoFocus
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="e.g. Location, Builder, Status, BHK Type"
                                />
                                <p className="text-xs text-gray-400 mt-1">Groups organise categories. They don't have a public page.</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setShowGroupModal(false); setNewGroupName(''); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold text-sm">
                                    Cancel
                                </button>
                                <button type="submit" disabled={savingGroup || !newGroupName.trim()}
                                    className="flex-1 px-4 py-2.5 bg-[#b27e02] text-white rounded-lg hover:bg-[#8a6002] transition font-semibold text-sm disabled:opacity-50">
                                    {savingGroup ? 'Adding...' : 'Add Group'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
