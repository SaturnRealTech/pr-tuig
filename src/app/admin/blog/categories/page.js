'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MdAdd, MdEdit, MdDelete, MdImage, MdSave } from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { ssr: false });

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 placeholder-gray-400';

function ImagePicker({ label, hint, value, onChange, onAltChange, filterType = '' }) {
    const [showPicker, setShowPicker] = useState(false);
    const handleSelect = (meta) => {
        onChange(meta.url);
        if (onAltChange && meta.alt) onAltChange(meta.alt);
        setShowPicker(false);
    };
    return (
        <div>
            <p className="block text-sm font-semibold text-gray-700 mb-2">
                {label} <span className="text-xs text-gray-400 font-normal">({hint})</span>
            </p>
            {value ? (
                <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                    <img src={value} alt={label} className="w-full h-36 object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => setShowPicker(true)}
                            className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-cream transition">Change</button>
                        <button type="button" onClick={() => onChange('')}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">Remove</button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => setShowPicker(true)}
                    className="w-full flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-xl hover:border-gold hover:bg-cream transition">
                    <MdImage size={28} className="text-gray-300 mb-1.5" />
                    <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                </button>
            )}
            {showPicker && (
                <MediaPicker filterType={filterType} returnMeta={true} currentUrl={value} onSelect={handleSelect} onClose={() => setShowPicker(false)} />
            )}
        </div>
    );
}

export default function BlogCategoriesPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pageData, setPageData] = useState({
        desktopBanner: '', desktopBannerAlt: '',
        mobileBanner: '', mobileBannerAlt: '',
        bannerTitle: '', bannerDescription: '',
        metaTitle: '', metaDescription: '', keywords: '',
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchCategories();
        fetchPageData();
    }, [router]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/blog-categories');
            const data = await res.json();
            if (data.success) setCategories(data.data);
        } finally {
            setLoading(false);
        }
    };

    const fetchPageData = async () => {
        try {
            const res = await fetch('/api/blog-category-page');
            const result = await res.json();
            if (result.success && result.data) {
                const d = result.data;
                setPageData({
                    desktopBanner: d.desktopBanner || '',
                    desktopBannerAlt: d.desktopBannerAlt || '',
                    mobileBanner: d.mobileBanner || '',
                    mobileBannerAlt: d.mobileBannerAlt || '',
                    bannerTitle: d.bannerTitle || '',
                    bannerDescription: d.bannerDescription || '',
                    metaTitle: d.metaTitle || '',
                    metaDescription: d.metaDescription || '',
                    keywords: d.keywords || '',
                });
            }
        } catch { /* ignore */ }
    };

    const setPage = (field) => (e) => setPageData(prev => ({ ...prev, [field]: e.target.value }));

    const handleSavePage = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/blog-category-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pageData),
            });
            const result = await res.json();
            if (result.success) {
                Swal.fire({ icon: 'success', title: 'Page settings saved!', timer: 1400, showConfirmButton: false });
            } else {
                Swal.fire('Error', result.error || 'Failed to save', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (cat) => {
        const confirm = await Swal.fire({
            title: `Delete "${cat.name}"?`,
            text: 'This cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Delete',
        });
        if (!confirm.isConfirmed) return;
        const res = await fetch(`/api/blog-categories/${cat._id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1000, showConfirmButton: false });
            fetchCategories();
        } else {
            Swal.fire('Error', data.error, 'error');
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 space-y-8">

                    {/* ── Page Settings Card ── */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Blog Categories Page</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Settings for <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">/blog/category/</span></p>
                            </div>
                            <button
                                onClick={handleSavePage}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-lg hover:bg-gold transition font-semibold disabled:opacity-50"
                            >
                                <MdSave size={18} />
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>

                        {/* Banner Images */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Hero Banner Images</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <ImagePicker
                                        label="Desktop Banner"
                                        hint="1920×600 recommended"
                                        value={pageData.desktopBanner}
                                        onChange={(url) => setPageData(prev => ({ ...prev, desktopBanner: url }))}
                                        onAltChange={(alt) => setPageData(prev => ({ ...prev, desktopBannerAlt: alt }))}
                                        filterType="hero"
                                    />
                                    <input
                                        value={pageData.desktopBannerAlt}
                                        onChange={setPage('desktopBannerAlt')}
                                        placeholder="Desktop banner alt text"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <ImagePicker
                                        label="Mobile Banner"
                                        hint="600×900 recommended"
                                        value={pageData.mobileBanner}
                                        onChange={(url) => setPageData(prev => ({ ...prev, mobileBanner: url }))}
                                        onAltChange={(alt) => setPageData(prev => ({ ...prev, mobileBannerAlt: alt }))}
                                        filterType="hero-mobile"
                                    />
                                    <input
                                        value={pageData.mobileBannerAlt}
                                        onChange={setPage('mobileBannerAlt')}
                                        placeholder="Mobile banner alt text"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Banner Text */}
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Banner Text</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Title</label>
                                    <input
                                        value={pageData.bannerTitle}
                                        onChange={setPage('bannerTitle')}
                                        placeholder="e.g. Blog Categories"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Description</label>
                                    <input
                                        value={pageData.bannerDescription}
                                        onChange={setPage('bannerDescription')}
                                        placeholder="Short tagline shown under the title"
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SEO */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">SEO Settings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Title</label>
                                    <input
                                        value={pageData.metaTitle}
                                        onChange={setPage('metaTitle')}
                                        maxLength={60}
                                        placeholder="Leave empty to use default"
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{pageData.metaTitle.length}/60</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keywords <span className="font-normal text-gray-400">(comma separated)</span></label>
                                    <input
                                        value={pageData.keywords}
                                        onChange={setPage('keywords')}
                                        placeholder="real estate, blog, property news"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Description</label>
                                    <textarea
                                        value={pageData.metaDescription}
                                        onChange={setPage('metaDescription')}
                                        rows={2}
                                        maxLength={160}
                                        placeholder="Leave empty to use default"
                                        className={inputClass}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{pageData.metaDescription.length}/160</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Categories Table ── */}
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">All Blog Categories</h2>
                                <p className="text-gray-500 mt-0.5 text-sm">Add, edit or remove blog categories</p>
                            </div>
                            <a
                                href="/admin/blog/categories/create"
                                className="flex items-center gap-2 px-5 py-2.5 bg-gold text-white rounded-lg hover:bg-gold transition font-semibold"
                            >
                                <MdAdd size={18} /> Add Category
                            </a>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            {loading ? (
                                <div className="py-20 text-center text-gray-400">Loading...</div>
                            ) : categories.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="text-5xl mb-4">🗂️</div>
                                    <p className="text-gray-500 font-medium mb-1">No blog categories yet</p>
                                    <p className="text-gray-400 text-sm mb-4">Add categories like &quot;News&quot;, &quot;Article&quot;, &quot;Market Update&quot;</p>
                                    <a href="/admin/blog/categories/create" className="text-gold font-semibold hover:underline">
                                        + Add your first category
                                    </a>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Slug</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Banner</th>
                                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">SEO Title</th>
                                            <th className="px-6 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {categories.map(cat => (
                                            <tr key={cat._id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 font-semibold text-gray-800">{cat.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500 font-mono">{cat.slug}</td>
                                                <td className="px-6 py-4 hidden md:table-cell">
                                                    {cat.heroImage ? (
                                                        <img src={cat.heroImage} alt={cat.name} className="h-10 w-20 object-cover rounded" />
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-400 hidden lg:table-cell max-w-[200px] truncate">
                                                    {cat.metaTitle || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={`/admin/blog/categories/edit/${cat._id}`}
                                                            className="p-2 text-gray-500 hover:text-gold hover:bg-cream rounded-lg transition inline-flex"
                                                        >
                                                            <MdEdit size={18} />
                                                        </a>
                                                        {user?.role === 'admin' && (
                                                        <button
                                                            onClick={() => handleDelete(cat)}
                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        >
                                                            <MdDelete size={18} />
                                                        </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
