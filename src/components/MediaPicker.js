'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    MdClose, MdSearch, MdCloudUpload, MdCheck, MdDelete,
    MdImage, MdGridView, MdViewList, MdRefresh, MdEdit, MdSave,
    MdPhoneAndroid, MdDesktopWindows,
} from 'react-icons/md';

const IMAGE_TYPES = [
    { value: 'hero', label: 'Hero (Desktop)', hint: '16:9', icon: <MdDesktopWindows size={14} /> },
    { value: 'hero-mobile', label: 'Hero (Mobile)', hint: '9:16', icon: <MdPhoneAndroid size={14} /> },
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
    const b = TYPE_BADGES[type] || { label: type, color: 'bg-gray-100 text-gray-600' };
    return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${b.color}`}>{b.label}</span>;
}

function formatBytes(b) {
    if (!b) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
}

const LIMIT = 60;

export default function MediaPicker({ onSelect, onClose, multiple = false, filterType = '', returnMeta = false }) {
    const [tab, setTab] = useState('library');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState(filterType);
    const [selected, setSelected] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState('grid');

    // Staging: files chosen but not yet uploaded
    const [staged, setStaged] = useState([]); // [{file, previewUrl, customName, alt, imageType}]
    const [uploading, setUploading] = useState(false);

    // Inline edit
    const [editingId, setEditingId] = useState(null);
    const [editFields, setEditFields] = useState({});

    const fetchMedia = useCallback(async (p = 1, q = search, t = typeFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: LIMIT });
            if (q) params.set('search', q);
            if (t) params.set('folder', ''); // type filter handled client-side for now
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
        if (tab === 'library') fetchMedia(1, search, typeFilter);
    }, [tab]);

    useEffect(() => {
        const t = setTimeout(() => fetchMedia(1, search, typeFilter), 300);
        return () => clearTimeout(t);
    }, [search, typeFilter]);

    // Filter by type client-side
    const visibleImages = typeFilter
        ? images.filter(img => img.imageType === typeFilter)
        : images;

    // Stage files for upload
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const newStaged = files.map(file => {
            const baseName = file.name.replace(/\.[^.]+$/, '');
            const autoAlt = baseName.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
                .replace(/\b\w/g, c => c.toUpperCase());
            return {
                file,
                previewUrl: URL.createObjectURL(file),
                customName: baseName,
                alt: autoAlt,
                imageType: filterType || 'gallery',
            };
        });
        setStaged(newStaged);
        e.target.value = '';
    };

    const updateStaged = (index, field, value) => {
        setStaged(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
    };

    const removeStaged = (index) => {
        setStaged(prev => prev.filter((_, i) => i !== index));
    };

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
                setStaged([]);
                // For single-select: auto-insert the first uploaded image immediately
                if (!multiple && result.urls?.length > 0) {
                    onSelect(result.urls[0]);
                    onClose();
                    return;
                }
                // For multi-select: go to library so user can pick
                setTab('library');
                setTimeout(() => fetchMedia(1, '', typeFilter), 300);
            } else {
                alert('Upload failed: ' + result.error);
            }
        } catch (err) { alert('Upload failed: ' + err.message); }
        finally { setUploading(false); }
    };

    // Inline metadata edit
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
        } catch { alert('Save failed'); }
    };

    const handleDelete = async (img, e) => {
        e.stopPropagation();
        if (!confirm(`Delete "${img.customName || img.fileName}"?`)) return;
        try {
            await fetch(`/api/media?id=${img._id}`, { method: 'DELETE' });
            setImages(prev => prev.filter(i => i._id !== img._id));
            setSelected(prev => prev.filter(s => s._id !== img._id));
            setTotal(t => t - 1);
        } catch { alert('Delete failed'); }
    };

    const toggleSelect = (img) => {
        if (multiple) {
            setSelected(prev =>
                prev.find(s => s._id === img._id) ? prev.filter(s => s._id !== img._id) : [...prev, img]
            );
        } else {
            // Single-select: clicking an image immediately inserts it — no extra confirm step
            onSelect(returnMeta ? { url: img.url, alt: img.alt || '' } : img.url);
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!selected.length) return;
        if (returnMeta) {
            onSelect(multiple ? selected.map(s => ({ url: s.url, alt: s.alt || '' })) : { url: selected[0].url, alt: selected[0].alt || '' });
        } else {
            onSelect(multiple ? selected.map(s => s.url) : selected[0].url);
        }
        onClose();
    };

    const isSelected = (img) => selected.some(s => s._id === img._id);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <MdImage className="text-[#b27e02]" /> Media Library
                        </h2>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {[
                                { id: 'library', label: `Library (${total})` },
                                { id: 'upload', label: staged.length ? `Upload (${staged.length} staged)` : 'Upload New' },
                            ].map(t => (
                                <button type="button" key={t.id} onClick={() => setTab(t.id)}
                                    className={`px-4 py-1.5 rounded-md text-sm font-semibold transition ${tab === t.id ? 'bg-[#b27e02] text-white' : 'text-gray-600 hover:text-gray-800'}`}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><MdClose size={22} /></button>
                </div>

                {/* Library Toolbar */}
                {tab === 'library' && (
                    <div className="flex items-center gap-3 px-6 py-3 border-b flex-shrink-0 flex-wrap">
                        <div className="flex-1 min-w-[180px] relative">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search filename…"
                                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#b27e02]" />
                        </div>
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#b27e02] text-gray-700 bg-white">
                            <option value="">All types</option>
                            {IMAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <button type="button" onClick={() => fetchMedia(page, search, typeFilter)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                            <MdRefresh size={18} />
                        </button>
                        <div className="flex gap-1 border border-gray-200 rounded-lg p-0.5">
                            {[['grid', <MdGridView key="g" size={18} />], ['list', <MdViewList key="l" size={18} />]].map(([m, icon]) => (
                                <button type="button" key={m} onClick={() => setViewMode(m)} className={`p-1.5 rounded ${viewMode === m ? 'bg-[#b27e02] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{icon}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* ── Library Tab ── */}
                    {tab === 'library' && (
                        <>
                            {loading ? (
                                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#b27e02]" /></div>
                            ) : visibleImages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-52 text-gray-400">
                                    <MdImage size={56} className="mb-3 opacity-20" />
                                    <p className="font-medium">No images found</p>
                                    <p className="text-sm">Try "Upload New" or clear the filter</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {visibleImages.map(img => (
                                        <div key={img._id}
                                            onClick={() => editingId !== img._id && toggleSelect(img)}
                                            className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition ${isSelected(img) ? 'border-[#b27e02] shadow-md' : 'border-transparent hover:border-gray-300'}`}>
                                            <img src={img.url} alt={img.alt || img.fileName}
                                                className="w-full aspect-square object-cover bg-gray-100" />

                                            {/* Type badge */}
                                            <div className="absolute top-1.5 left-1.5">
                                                <TypeBadge type={img.imageType} />
                                            </div>

                                            {/* Selected check */}
                                            {isSelected(img) && (
                                                <div className="absolute top-1.5 right-1.5 bg-[#b27e02] text-white rounded-full p-0.5">
                                                    <MdCheck size={13} />
                                                </div>
                                            )}

                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition flex flex-col justify-end opacity-0 group-hover:opacity-100">
                                                <div className="p-2">
                                                    <p className="text-white text-xs font-medium truncate">{img.customName || img.fileName}</p>
                                                    {img.width && <p className="text-white text-[10px] opacity-80">{img.width}×{img.height} · {formatBytes(img.size)}</p>}
                                                </div>
                                                <div className="flex justify-end gap-1 p-1.5">
                                                    <button type="button" onClick={e => { e.stopPropagation(); startEdit(img); }}
                                                        className="p-1 bg-white bg-opacity-20 text-white rounded hover:bg-[#b27e02] transition">
                                                        <MdEdit size={13} />
                                                    </button>
                                                    <button type="button" onClick={e => handleDelete(img, e)}
                                                        className="p-1 bg-white bg-opacity-20 text-white rounded hover:bg-red-500 transition">
                                                        <MdDelete size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* List view */
                                <div className="space-y-1">
                                    {visibleImages.map(img => (
                                        <div key={img._id}>
                                            <div onClick={() => editingId !== img._id && toggleSelect(img)}
                                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition ${isSelected(img) ? 'border-[#b27e02] bg-[#fef9e7]' : 'border-transparent hover:bg-gray-50'}`}>
                                                <img src={img.url} alt={img.alt || img.fileName} className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{img.customName || img.fileName}</p>
                                                        <TypeBadge type={img.imageType} />
                                                    </div>
                                                    <p className="text-xs text-gray-400 truncate">{img.alt || <span className="italic">No alt text</span>}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {img.width ? `${img.width}×${img.height}px · ` : ''}{formatBytes(img.size)} · {new Date(img.uploadedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {isSelected(img) && <MdCheck className="text-[#b27e02] flex-shrink-0" size={20} />}
                                                <div className="flex gap-1">
                                                    <button type="button" onClick={e => { e.stopPropagation(); startEdit(img); }}
                                                        className="p-1.5 text-gray-400 hover:text-[#b27e02] hover:bg-[#fef9e7] rounded-lg transition">
                                                        <MdEdit size={16} />
                                                    </button>
                                                    <button type="button" onClick={e => handleDelete(img, e)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                        <MdDelete size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Inline edit panel */}
                                            {editingId === img._id && (
                                                <div className="mx-2 mb-2 p-4 bg-[#fef9e7] border border-[#b27e02] border-opacity-30 rounded-xl">
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Display Name</label>
                                                            <input value={editFields.customName} onChange={e => setEditFields(p => ({ ...p, customName: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02]" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Alt Text</label>
                                                            <input value={editFields.alt} onChange={e => setEditFields(p => ({ ...p, alt: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02]"
                                                                placeholder="Describe the image" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-600 mb-1 block">Image Type</label>
                                                            <select value={editFields.imageType} onChange={e => setEditFields(p => ({ ...p, imageType: e.target.value }))}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02] bg-white">
                                                                {IMAGE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} ({t.hint})</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 mt-3">
                                                        <button type="button" onClick={() => saveEdit(img._id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition">
                                                            <MdSave size={15} /> Save
                                                        </button>
                                                        <button type="button" onClick={() => setEditingId(null)}
                                                            className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {total > LIMIT && (
                                <div className="flex justify-center gap-2 mt-6">
                                    <button type="button" onClick={() => fetchMedia(page - 1)} disabled={page === 1}
                                        className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
                                    <span className="self-center text-sm text-gray-500">Page {page} of {Math.ceil(total / LIMIT)}</span>
                                    <button type="button" onClick={() => fetchMedia(page + 1)} disabled={page >= Math.ceil(total / LIMIT)}
                                        className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Upload Tab ── */}
                    {tab === 'upload' && (
                        <div className="space-y-6">
                            {/* Drop zone */}
                            {staged.length === 0 && (
                                <label className="flex flex-col items-center justify-center w-full h-52 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#b27e02] hover:bg-[#fef9e7] transition">
                                    <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                                    <MdCloudUpload size={52} className="text-gray-300 mb-3" />
                                    <p className="text-lg font-semibold text-gray-700">Click to select images</p>
                                    <p className="text-sm text-gray-400 mt-1">JPG, PNG, GIF, WebP — multiple allowed</p>
                                </label>
                            )}

                            {/* Staged files with metadata fields */}
                            {staged.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-gray-800">{staged.length} image{staged.length > 1 ? 's' : ''} ready to upload</h3>
                                        <label className="text-sm text-[#b27e02] hover:underline cursor-pointer font-medium">
                                            <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
                                            + Add more
                                        </label>
                                    </div>

                                    {staged.map((s, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <img src={s.previewUrl} alt="preview" className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-gray-200" />
                                            <div className="flex-1 space-y-3">
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Image Name</label>
                                                        <input value={s.customName} onChange={e => updateStaged(i, 'customName', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02]"
                                                            placeholder="Descriptive name" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Alt Text <span className="font-normal text-gray-400">(SEO)</span></label>
                                                        <input value={s.alt} onChange={e => updateStaged(i, 'alt', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02]"
                                                            placeholder="Describe the image" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-semibold text-gray-600 mb-1 block">Image Type</label>
                                                        <select value={s.imageType} onChange={e => updateStaged(i, 'imageType', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02] bg-white">
                                                            {IMAGE_TYPES.map(t => (
                                                                <option key={t.value} value={t.value}>{t.label} ({t.hint})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400">{s.file.name} · {formatBytes(s.file.size)}</p>
                                            </div>
                                            <button type="button" onClick={() => removeStaged(i)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition self-start flex-shrink-0">
                                                <MdClose size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setStaged([])} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition font-medium">
                                            Clear all
                                        </button>
                                        <button type="button" onClick={handleUpload} disabled={uploading}
                                            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition disabled:opacity-50">
                                            {uploading ? (
                                                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Uploading…</>
                                            ) : (
                                                <><MdCloudUpload size={18} /> Upload {staged.length} image{staged.length > 1 ? 's' : ''}</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {tab === 'library' && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 flex-shrink-0">
                        <p className="text-sm text-gray-500">
                            {selected.length > 0
                                ? `${selected.length} image${selected.length > 1 ? 's' : ''} selected`
                                : 'Click an image to select it'}
                        </p>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition">
                                Cancel
                            </button>
                            <button type="button" onClick={handleConfirm} disabled={!selected.length}
                                className="px-5 py-2.5 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition disabled:opacity-40">
                                {multiple ? `Insert ${selected.length || ''} Image${selected.length !== 1 ? 's' : ''}` : 'Insert Image'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
