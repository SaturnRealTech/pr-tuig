'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdImage, MdSearch, MdDelete, MdCloudUpload,
    MdGridView, MdViewList, MdRefresh, MdContentCopy, MdCheck, MdEdit, MdSave, MdClose
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const LIMIT = 60;

const IMAGE_TYPES = [
    { value: 'hero', label: 'Hero (Desktop)', hint: '16:9' },
    { value: 'hero-mobile', label: 'Hero (Mobile)', hint: '9:16' },
    { value: 'thumbnail', label: 'Thumbnail', hint: '1:1' },
    { value: 'gallery', label: 'Gallery', hint: 'Any' },
    { value: 'logo', label: 'Logo', hint: 'Any' },
    { value: 'icon', label: 'Icon', hint: 'Small' },
    { value: 'master-plan', label: 'Master Plan', hint: 'Any' },
    { value: 'floor-plan', label: 'Floor Plan', hint: 'Any' },
    { value: 'amenity', label: 'Amenities', hint: 'Small' },
];

const TYPE_BADGES = {
    'hero': { label: 'Hero', color: 'bg-blue-100 text-blue-700' },
    'hero-mobile': { label: 'Mobile', color: 'bg-purple-100 text-purple-700' },
    'thumbnail': { label: 'Thumb', color: 'bg-green-100 text-green-700' },
    'gallery': { label: 'Gallery', color: 'bg-gray-100 text-gray-600' },
    'logo': { label: 'Logo', color: 'bg-yellow-100 text-yellow-700' },
    'icon': { label: 'Icon', color: 'bg-orange-100 text-orange-700' },
    'master-plan': { label: 'Master Plan', color: 'bg-indigo-100 text-indigo-700' },
    'floor-plan': { label: 'Floor Plan', color: 'bg-pink-100 text-pink-700' },
    'amenity': { label: 'Amenity', color: 'bg-teal-100 text-teal-700' },
};

function TypeBadge({ type }) {
    const b = TYPE_BADGES[type] || { label: type || '—', color: 'bg-gray-100 text-gray-600' };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.color}`}>{b.label}</span>;
}

function formatBytes(b) {
    if (!b) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
}

// Staging uploader component
function StagedUploader({ onUploaded }) {
    const [staged, setStaged] = useState([]);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        setStaged(prev => [...prev, ...files.map(file => {
            const baseName = file.name.replace(/\.[^.]+$/, '');
            const autoAlt = baseName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
                .replace(/\b\w/g, c => c.toUpperCase());
            return {
                file,
                previewUrl: URL.createObjectURL(file),
                customName: baseName,
                alt: autoAlt,
                imageType: 'gallery',
            };
        })]);
        e.target.value = '';
    };

    const update = (i, field, val) => setStaged(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
    const remove = (i) => setStaged(prev => prev.filter((_, idx) => idx !== i));

    const handleUpload = async () => {
        if (!staged.length) return;
        setUploading(true);
        try {
            const formData = new FormData();
            staged.forEach(s => formData.append('files', s.file));
            formData.append('folder', 'media');
            formData.append('names', JSON.stringify(staged.map(s => s.customName)));
            formData.append('alts', JSON.stringify(staged.map(s => s.alt)));
            formData.append('types', JSON.stringify(staged.map(s => s.imageType)));

            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                await Swal.fire({ icon: 'success', title: `${result.count} image${result.count > 1 ? 's' : ''} uploaded!`, timer: 1500, showConfirmButton: false });
                setStaged([]);
                onUploaded();
            } else {
                Swal.fire('Error', result.error, 'error');
            }
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
        finally { setUploading(false); }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <MdCloudUpload className="text-gold" /> Upload Images
                </h3>
                <label className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-gold transition">
                    <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                    + Select Files
                </label>
            </div>

            {staged.length === 0 ? (
                <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gold hover:bg-cream transition">
                    <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                    <MdCloudUpload size={36} className="text-gray-300 mb-2" />
                    <p className="text-sm font-medium text-gray-500">Drag & drop or click to select</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP</p>
                </label>
            ) : (
                <div className="space-y-3">
                    {staged.map((s, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <img src={s.previewUrl} alt="" className="w-20 h-20 object-cover rounded-lg flex-shrink-0 bg-gray-200" />
                            <div className="flex-1 grid grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Image Name</label>
                                    <input value={s.customName} onChange={e => update(i, 'customName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Alt Text <span className="font-normal text-gray-400">(SEO)</span></label>
                                    <input value={s.alt} onChange={e => update(i, 'alt', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold"
                                        placeholder="Describe the image" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Image Type</label>
                                    <select value={s.imageType} onChange={e => update(i, 'imageType', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold bg-white">
                                        {IMAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} ({t.hint})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col justify-between items-end flex-shrink-0">
                                <button onClick={() => remove(i)} className="p-1 text-gray-400 hover:text-red-500"><MdClose size={16} /></button>
                                <p className="text-xs text-gray-400">{formatBytes(s.file.size)}</p>
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-3 pt-1">
                        <button onClick={() => setStaged([])} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                            Clear
                        </button>
                        <button onClick={handleUpload} disabled={uploading}
                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold transition disabled:opacity-50">
                            {uploading
                                ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Uploading…</>
                                : <><MdCloudUpload size={18} /> Upload {staged.length} image{staged.length > 1 ? 's' : ''}</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MediaLibraryPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState('grid');
    const [selectedIds, setSelectedIds] = useState([]);
    const [copiedId, setCopiedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editFields, setEditFields] = useState({});
    const [replacingId, setReplacingId] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
    }, [router]);

    const fetchMedia = useCallback(async (p = 1, q = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: LIMIT });
            if (q) params.set('search', q);
            const res = await fetch(`/api/media?${params}`);
            const result = await res.json();
            if (result.success) {
                setImages(result.data);
                setTotal(result.total);
                setPage(p);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (user) fetchMedia(1, search);
    }, [user, fetchMedia]);

    useEffect(() => {
        const t = setTimeout(() => fetchMedia(1, search), 300);
        return () => clearTimeout(t);
    }, [search, typeFilter, fetchMedia]);

    const visibleImages = typeFilter ? images.filter(img => img.imageType === typeFilter) : images;

    const handleDelete = async (img) => {
        const confirm = await Swal.fire({
            title: 'Delete image?', text: img.customName || img.fileName, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Delete',
        });
        if (!confirm.isConfirmed) return;
        try {
            await fetch(`/api/media?id=${img._id}`, { method: 'DELETE' });
            setImages(prev => prev.filter(i => i._id !== img._id));
            setSelectedIds(prev => prev.filter(id => id !== img._id.toString()));
            setTotal(t => t - 1);
        } catch { Swal.fire('Error', 'Failed to delete', 'error'); }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.length) return;
        const confirm = await Swal.fire({
            title: `Delete ${selectedIds.length} image${selectedIds.length > 1 ? 's' : ''}?`,
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Delete all',
        });
        if (!confirm.isConfirmed) return;
        await Promise.all(selectedIds.map(id => fetch(`/api/media?id=${id}`, { method: 'DELETE' })));
        setImages(prev => prev.filter(i => !selectedIds.includes(i._id.toString())));
        setTotal(t => t - selectedIds.length);
        setSelectedIds([]);
    };

    const handleReplace = async (img, file) => {
        if (!file) return;
        setReplacingId(img._id);
        try {
            const formData = new FormData();
            formData.append('files', file);
            formData.append('folder', img.folder || 'media');
            formData.append('replaceId', img._id.toString());
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const result = await res.json();
            if (result.success) {
                // Refresh that single image from server
                const r = await fetch(`/api/media?page=1&limit=1000`);
                const data = await r.json();
                if (data.success) {
                    const updated = data.data.find(i => i._id === img._id);
                    if (updated) setImages(prev => prev.map(i => i._id === img._id ? updated : i));
                    else fetchMedia(page, search);
                }
            } else {
                Swal.fire('Error', result.error, 'error');
            }
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
        finally { setReplacingId(null); }
    };

    const copyUrl = (img) => {
        navigator.clipboard.writeText(img.url);
        setCopiedId(img._id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const startEdit = (img) => {
        setEditingId(img._id);
        setEditFields({ customName: img.customName || '', alt: img.alt || '', imageType: img.imageType || 'gallery' });
    };

    const saveEdit = async (id) => {
        try {
            await fetch(`/api/media?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFields),
            });
            setImages(prev => prev.map(img => img._id === id ? { ...img, ...editFields } : img));
            setEditingId(null);
        } catch { Swal.fire('Error', 'Save failed', 'error'); }
    };

    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleAll = () => setSelectedIds(prev => prev.length === visibleImages.length ? [] : visibleImages.map(i => i._id.toString()));


    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main */}
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                            <MdImage className="text-gold" /> Media Library
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">{total} image{total !== 1 ? 's' : ''} total</p>
                    </div>

                    {/* Upload panel */}
                    <StagedUploader onUploaded={() => fetchMedia(1, search)} />

                    {/* Toolbar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
                        <div className="flex-1 min-w-[160px] relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search filename…"
                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold" />
                        </div>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold bg-white text-gray-700">
                            <option value="">All types</option>
                            {IMAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <button onClick={() => fetchMedia(page, search)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                            <MdRefresh size={18} />
                        </button>
                        <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5">
                            {[['grid', <MdGridView key="g" size={18} />], ['list', <MdViewList key="l" size={18} />]].map(([m, icon]) => (
                                <button key={m} onClick={() => setViewMode(m)} className={`p-1.5 rounded ${viewMode === m ? 'bg-gold text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{icon}</button>
                            ))}
                        </div>
                        {selectedIds.length > 0 && user?.role === 'admin' && (
                            <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition">
                                <MdDelete size={16} /> Delete {selectedIds.length}
                            </button>
                        )}
                        {visibleImages.length > 0 && (
                            <button onClick={toggleAll} className="text-sm text-gray-500 hover:text-gold whitespace-nowrap">
                                {selectedIds.length === visibleImages.length ? 'Deselect all' : 'Select all'}
                            </button>
                        )}
                    </div>

                    {/* Loading */}
                    {loading && <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold" /></div>}

                    {/* Grid View */}
                    {!loading && visibleImages.length > 0 && viewMode === 'grid' && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {visibleImages.map(img => {
                                const sel = selectedIds.includes(img._id.toString());
                                return (
                                    <div key={img._id}
                                        className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition ${sel ? 'border-gold shadow-md' : 'border-transparent hover:border-gray-300'}`}
                                        onClick={() => toggleSelect(img._id.toString())}>
                                        <img src={img.url} alt={img.alt || img.fileName} className="w-full aspect-square object-cover bg-gray-100" />

                                        {/* Type badge */}
                                        <div className="absolute top-1 left-1">
                                            <TypeBadge type={img.imageType} />
                                        </div>

                                        {sel && (
                                            <div className="absolute top-1 right-1 bg-gold text-white rounded-full p-0.5">
                                                <MdCheck size={12} />
                                            </div>
                                        )}

                                        {/* Hover overlay — Change image only */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                            <label
                                                onClick={e => e.stopPropagation()}
                                                className={`flex items-center justify-center cursor-pointer ${replacingId === img._id ? 'pointer-events-none' : ''}`}
                                                title="Click to replace image"
                                            >
                                                <input
                                                    type="file" accept="image/*" className="hidden"
                                                    onChange={e => { e.stopPropagation(); handleReplace(img, e.target.files[0]); e.target.value = ''; }}
                                                />
                                                {replacingId === img._id ? (
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                                                ) : (
                                                    <span className="text-white text-xs font-bold tracking-widest uppercase bg-black bg-opacity-40 px-3 py-1.5 rounded-full border border-white border-opacity-40 hover:bg-gold hover:border-gold transition">
                                                        Change
                                                    </span>
                                                )}
                                            </label>
                                        </div>

                                        {/* Action buttons — always visible */}
                                        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-1 py-1 bg-white bg-opacity-95 z-10">
                                            <p className="text-gray-600 text-[9px] font-medium truncate flex-1 mr-1">{img.customName || img.fileName}</p>
                                            <div className="flex gap-0.5 flex-shrink-0">
                                                <button onClick={e => { e.stopPropagation(); startEdit(img); }}
                                                    className="p-1 text-gold rounded hover:bg-gold hover:text-white transition">
                                                    <MdEdit size={12} />
                                                </button>
                                                <button onClick={e => { e.stopPropagation(); copyUrl(img); }}
                                                    className={`p-1 rounded transition ${copiedId === img._id ? 'bg-green-500 text-white' : 'text-gold hover:bg-gold hover:text-white'}`}>
                                                    <MdContentCopy size={12} />
                                                </button>
                                                {user?.role === 'admin' && (
                                                <button onClick={e => { e.stopPropagation(); handleDelete(img); }}
                                                    className="p-1 text-gold rounded hover:bg-red-500 hover:text-white transition">
                                                    <MdDelete size={12} />
                                                </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* List View */}
                    {!loading && visibleImages.length > 0 && viewMode === 'list' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="w-10 px-4 py-3">
                                            <input type="checkbox" checked={selectedIds.length === visibleImages.length && visibleImages.length > 0} onChange={toggleAll} className="accent-gold" />
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600 w-20">Image</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Alt</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Dimensions</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Size</th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {visibleImages.map(img => (
                                        <>
                                            <tr key={img._id} className="hover:bg-gray-50 transition">
                                                <td className="px-4 py-3">
                                                    <input type="checkbox" checked={selectedIds.includes(img._id.toString())} onChange={() => toggleSelect(img._id.toString())} className="accent-gold" />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <label className="relative group/img block w-14 h-14 cursor-pointer rounded-lg overflow-hidden" title="Click to replace image">
                                                        <input type="file" accept="image/*" className="hidden"
                                                            onChange={e => { handleReplace(img, e.target.files[0]); e.target.value = ''; }} />
                                                        <img src={img.url} alt={img.alt || img.fileName} className="w-full h-full object-cover bg-gray-100" />
                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/img:bg-opacity-60 transition flex items-center justify-center">
                                                            {replacingId === img._id
                                                                ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                                : <span className="text-white text-[9px] font-bold tracking-wider uppercase opacity-0 group-hover/img:opacity-100 transition">Change</span>
                                                            }
                                                        </div>
                                                    </label>
                                                </td>
                                                <td className="px-4 py-3 max-w-[160px]">
                                                    <p className="font-medium text-gray-800 truncate">{img.customName || img.fileName}</p>
                                                    <p className="text-xs text-gray-400 truncate">{img.fileName}</p>
                                                </td>
                                                <td className="px-4 py-3 max-w-[160px]">
                                                    <p className="text-xs text-gray-500 truncate">{img.alt || <span className="italic text-gray-300">No alt</span>}</p>
                                                </td>
                                                <td className="px-4 py-3"><TypeBadge type={img.imageType} /></td>
                                                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                    {img.width ? `${img.width}×${img.height}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{formatBytes(img.size)}</td>
                                                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(img.uploadedAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => startEdit(img)} title="Edit"
                                                            className="p-1.5 text-gray-400 hover:text-gold hover:bg-cream rounded-lg transition">
                                                            <MdEdit size={16} />
                                                        </button>
                                                        <button onClick={() => copyUrl(img)} title="Copy URL"
                                                            className={`p-1.5 rounded-lg transition ${copiedId === img._id ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gold hover:bg-cream'}`}>
                                                            <MdContentCopy size={16} />
                                                        </button>
                                                        {user?.role === 'admin' && (
                                                        <button onClick={() => handleDelete(img)} title="Delete"
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                            <MdDelete size={16} />
                                                        </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                            {editingId === img._id && (
                                                <tr key={`edit-${img._id}`}>
                                                    <td colSpan={9} className="px-6 py-4 bg-cream border-b border-gold border-opacity-20">
                                                        <div className="grid grid-cols-3 gap-4 max-w-2xl">
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Display Name</label>
                                                                <input value={editFields.customName} onChange={e => setEditFields(p => ({ ...p, customName: e.target.value }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold" />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Alt Text</label>
                                                                <input value={editFields.alt} onChange={e => setEditFields(p => ({ ...p, alt: e.target.value }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold"
                                                                    placeholder="Describe the image" />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-gray-600 mb-1 block">Image Type</label>
                                                                <select value={editFields.imageType} onChange={e => setEditFields(p => ({ ...p, imageType: e.target.value }))}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold bg-white">
                                                                    {IMAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} ({t.hint})</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-3">
                                                            <button onClick={() => saveEdit(img._id)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold">
                                                                <MdSave size={15} /> Save
                                                            </button>
                                                            <button onClick={() => setEditingId(null)}
                                                                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && visibleImages.length === 0 && images.length > 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <MdImage size={56} className="mb-3 opacity-20" />
                            <p className="font-medium">No images match the filter</p>
                            <button onClick={() => setTypeFilter('')} className="mt-2 text-sm text-gold hover:underline">Clear filter</button>
                        </div>
                    )}

                    {/* Pagination */}
                    {total > LIMIT && (
                        <div className="flex justify-center gap-2 mt-6">
                            <button onClick={() => fetchMedia(page - 1, search)} disabled={page === 1}
                                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
                            <span className="self-center text-sm text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
                            <button onClick={() => fetchMedia(page + 1, search)} disabled={page >= Math.ceil(total / LIMIT)}
                                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
