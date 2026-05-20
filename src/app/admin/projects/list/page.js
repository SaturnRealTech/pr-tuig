'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdEdit, MdDelete, MdAdd,
    MdVisibility, MdVisibilityOff, MdSearch, MdWork
} from 'react-icons/md';
import Swal from 'sweetalert2';
import AdminSidebar from '@/components/AdminSidebar';

const TABS = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'draft', label: 'Drafts' },
];

export default function ProjectsList() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchProjects();
    }, [router]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/projects?admin=1');
            const result = await res.json();
            if (result.success) setProjects(result.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const visible = useMemo(() => {
        let list = projects;
        if (tab === 'published') list = list.filter(p => p.publishStatus === 'published');
        else if (tab === 'draft') list = list.filter(p => p.publishStatus !== 'published');
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.company?.toLowerCase().includes(q) ||
                p.projectAddress?.toLowerCase().includes(q) ||
                p.reraNo?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [projects, tab, search]);

    const counts = useMemo(() => ({
        all: projects.length,
        published: projects.filter(p => p.publishStatus === 'published').length,
        draft: projects.filter(p => p.publishStatus !== 'published').length,
    }), [projects]);

    const togglePublish = async (project) => {
        const next = project.publishStatus === 'published' ? 'draft' : 'published';
        try {
            await fetch(`/api/projects/${project._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publishStatus: next }),
            });
            setProjects(prev => prev.map(p => p._id === project._id ? { ...p, publishStatus: next } : p));
        } catch { Swal.fire('Error', 'Could not update status', 'error'); }
    };

    const handleDelete = async (id) => {
        const p = projects.find(p => p._id === id);
        const confirm = await Swal.fire({
            title: 'Delete Project?', text: `"${p?.title}"`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#b27e02', cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete',
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            setProjects(prev => prev.filter(p => p._id !== id));
            setSelectedIds(prev => prev.filter(x => x !== id));
        } catch { Swal.fire('Error', 'Failed to delete', 'error'); }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        const confirm = await Swal.fire({
            title: `Delete ${selectedIds.length} project${selectedIds.length > 1 ? 's' : ''}?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Delete all',
        });
        if (!confirm.isConfirmed) return;
        await Promise.all(selectedIds.map(id => fetch(`/api/projects/${id}`, { method: 'DELETE' })));
        setProjects(prev => prev.filter(p => !selectedIds.includes(p._id)));
        setSelectedIds([]);
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleAll = () => setSelectedIds(prev => prev.length === visible.length ? [] : visible.map(p => p._id));

    if (!user) return null;

    const coverImage = (p) => p.desktopBanner || p.heroImages?.[0] || p.image || null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
                            <p className="text-gray-500 text-sm mt-1">{counts.published} published · {counts.draft} draft</p>
                        </div>
                        <button onClick={() => router.push('/admin/projects/create')}
                            className="flex items-center gap-2 px-5 py-3 bg-gold text-white rounded-xl font-semibold hover:bg-gold transition">
                            <MdAdd size={20} /> Add New Project
                        </button>
                    </div>

                    {/* Filter tabs + search */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 mb-4 flex items-center gap-4 flex-wrap">
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {TABS.map(t => (
                                <button key={t.key} onClick={() => setTab(t.key)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${tab === t.key ? 'bg-gold text-white' : 'text-gray-600 hover:text-gray-800'}`}>
                                    {t.label} <span className="opacity-70">({counts[t.key]})</span>
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 min-w-[200px] relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search title, company, RERA…"
                                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold" />
                        </div>
                        {selectedIds.length > 0 && user?.role === 'admin' && (
                            <button onClick={handleBulkDelete}
                                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition">
                                <MdDelete size={16} /> Delete {selectedIds.length}
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" /></div>
                    ) : visible.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
                            <MdWork size={56} className="text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects found</h3>
                            <p className="text-gray-400 mb-6">Create your first project to get started.</p>
                            <button onClick={() => router.push('/admin/projects/create')}
                                className="px-6 py-3 bg-gold text-white rounded-xl font-semibold hover:bg-gold transition">
                                Add New Project
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="w-10 px-4 py-3">
                                            <input type="checkbox" checked={selectedIds.length === visible.length && visible.length > 0} onChange={toggleAll} className="accent-gold" />
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Project</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">RERA</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Views</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Launch / Created Date</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {visible.map(project => (
                                        <tr key={project._id} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3">
                                                <input type="checkbox" checked={selectedIds.includes(project._id)} onChange={() => toggleSelect(project._id)} className="accent-gold" />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {coverImage(project) ? (
                                                        <img src={coverImage(project)} alt={project.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-gray-100" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                            <MdWork size={24} className="text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-gray-800 truncate max-w-[200px]">{project.title}</p>
                                                            {project.isHomePage && (
                                                                <span className="flex-shrink-0 text-[10px] px-2 py-0.5 bg-gold text-white rounded-full font-bold">Home</span>
                                                            )}
                                                        </div>
                                                        {project.projectAddress && <p className="text-xs text-gray-400 truncate max-w-[200px]">{project.projectAddress}</p>}
                                                        <p className="text-xs text-gray-400 font-mono">/{project.slug}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{project.price || '—'}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{project.reraNo || '—'}</td>
                                            <td className="px-4 py-3 text-gray-600">{project.views || 0}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                {project.createdDate
                                                    ? new Date(project.createdDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : project.createdAt
                                                        ? new Date(project.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => togglePublish(project)}
                                                    title={project.publishStatus === 'published' ? 'Click to unpublish' : 'Click to publish'}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${project.publishStatus === 'published'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                        }`}>
                                                    {project.publishStatus === 'published'
                                                        ? <><MdVisibility size={13} /> Published</>
                                                        : <><MdVisibilityOff size={13} /> Draft</>
                                                    }
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => router.push(`/admin/projects/edit/${project._id}`)}
                                                        className="p-1.5 text-gray-400 hover:text-gold hover:bg-cream rounded-lg transition" title="Edit">
                                                        <MdEdit size={16} />
                                                    </button>
                                                    {user?.role === 'admin' && (
                                                    <button onClick={() => handleDelete(project._id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                                                        <MdDelete size={16} />
                                                    </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
