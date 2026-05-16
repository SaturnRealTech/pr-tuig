'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    MdArrowBack, MdDesktopWindows, MdPhoneAndroid, MdImage, MdAdd, MdDelete
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), {
    ssr: false,
    loading: () => <p className="text-gray-500">Loading editor...</p>,
});
const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { ssr: false });

// Banner picker — media library only (no direct upload)
function BannerPicker({ label, hint, icon, filterType, value, onChange }) {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div>
            <p className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                {icon} {label} <span className="text-xs text-gray-400 font-normal">({hint})</span>
            </p>
            {value ? (
                <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                    <img src={value} alt={label} className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => setShowPicker(true)}
                            className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-[#fef9e7] transition">
                            Change
                        </button>
                        <button type="button" onClick={() => onChange('')}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => setShowPicker(true)}
                    className="w-full flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#b27e02] hover:bg-[#fef9e7] transition">
                    <MdImage size={32} className="text-gray-300 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                </button>
            )}
            {showPicker && (
                <MediaPicker
                    filterType={filterType}
                    onSelect={(url) => { onChange(url); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

export default function EditCategory() {
    const params = useParams();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allCategories, setAllCategories] = useState([]);
    const [groups, setGroups] = useState([]);
    const [formData, setFormData] = useState({
        name: '', title: '', slug: '', description: '', content: '',
        metaTitle: '', metaDescription: '', keywords: '',
        heroImage: '', heroImageAlt: '', mobileBanner: '', mobileBannerAlt: '', logo: '', parentId: '', groupId: '',
        faqs: [],
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        Promise.all([fetchCategory(), fetchAllCategories(), fetchGroups()]);
    }, [params.id]);

    const fetchCategory = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/categories/${params.id}`);
            const result = await res.json();
            if (result.success) {
                const cat = result.data;
                setFormData({
                    name: cat.name || '',
                    title: cat.title || '',
                    slug: cat.slug || '',
                    description: cat.description || '',
                    content: cat.content || '',
                    metaTitle: cat.metaTitle || '',
                    metaDescription: cat.metaDescription || '',
                    keywords: cat.keywords || '',
                    heroImage: cat.heroImage || '',
                    heroImageAlt: cat.heroImageAlt || '',
                    mobileBanner: cat.mobileBanner || '',
                    mobileBannerAlt: cat.mobileBannerAlt || '',
                    logo: cat.logo || '',
                    parentId: cat.parentId ? cat.parentId.toString() : '',
                    groupId: cat.groupId ? cat.groupId.toString() : '',
                    faqs: cat.faqs || [],
                });
            } else {
                await Swal.fire({ icon: 'error', title: 'Error', text: 'Category not found' });
                router.push('/admin/categories');
            }
        } catch {
            router.push('/admin/categories');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const result = await res.json();
            if (result.success) setAllCategories(result.data);
        } catch (e) { console.error(e); }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch('/api/categories');
            const result = await res.json();
            if (result.success) {
                setGroups(result.data.filter(c => c.type === 'group'));
            }
        } catch (e) { console.error(e); }
    };

    const generateSlug = (text) =>
        text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

    const handleTitleChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, title: val, slug: generateSlug(val) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/categories/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await res.json();
            if (result.success) {
                await Swal.fire({ icon: 'success', title: 'Updated!', timer: 2000, showConfirmButton: false });
                router.push('/admin/categories');
            } else {
                await Swal.fire({ icon: 'error', title: 'Error', text: result.error });
            }
        } catch {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update category' });
        } finally {
            setSubmitting(false);
        }
    };


    if (!user || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center"><div className="text-5xl mb-3">⏳</div><p className="text-gray-500">Loading...</p></div>
            </div>
        );
    }

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    // Exclude self and groups from parent options (can't be own parent or group)
    const availableParents = allCategories.filter(c => c._id.toString() !== params.id && c.type !== 'group');

    // Filter parent categories based on selected group (same logic as create page)
    const filteredParentCategories = availableParents.filter(cat => {
        if (formData.groupId) {
            return cat.groupId?.toString() === formData.groupId;
        }
        return !cat.groupId;
    });

    // Build a tree structure for categories
    function buildCategoryTree(categories, parentId = '') {
        return categories
            .filter(cat => (cat.parentId ? cat.parentId.toString() : '') === parentId)
            .map(cat => ({
                ...cat,
                children: buildCategoryTree(categories, cat._id.toString()),
            }));
    }

    // Render options with indentation
    function renderCategoryOptions(tree, level = 0) {
        return tree.flatMap(cat => [
            <option key={cat._id} value={cat._id}>
                {`${'— '.repeat(level)}${cat.name}`}
            </option>,
            ...renderCategoryOptions(cat.children, level + 1)
        ]);
    }

    const categoryTree = buildCategoryTree(filteredParentCategories);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main */}
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-8">
                        <button onClick={() => router.push('/admin/categories')} className="flex items-center gap-2 text-gray-600 hover:text-[#b27e02] mb-4 transition">
                            <MdArrowBack size={20} /> Back to Categories
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">Edit Category</h1>
                        <p className="text-gray-500 text-sm mt-1">Update category details. Change parent to move it in the hierarchy.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Category Details</h3>
                            <div className="space-y-4">

                                {/* Group */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Group</label>
                                    <select value={formData.groupId} onChange={set('groupId')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 bg-white">
                                        <option value="">— No group (ungrouped) —</option>
                                        {groups.map(g => (
                                            <option key={g._id} value={g._id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Group this under Location, Builder, Status, etc.{' '}
                                        {groups.length === 0 && (
                                            <a href="/admin/categories" className="text-[#b27e02] font-semibold hover:underline">
                                                Add a group first →
                                            </a>
                                        )}
                                    </p>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name <span className="text-[#b27e02]">*</span></label>
                                    <input type="text" value={formData.name} onChange={set('name')} required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                        placeholder="e.g., Residential, Buy, Luxury Villas" />
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Slug <span className="text-[#b27e02]">*</span></label>
                                    <input type="text" value={formData.slug} onChange={set('slug')} required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 font-mono" />
                                    <p className="text-xs text-gray-400 mt-1">URL: /category/<strong>{formData.slug || 'your-slug'}</strong></p>
                                </div>

                                {/* Parent Category — WordPress style */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Category</label>
                                    <select value={formData.parentId} onChange={set('parentId')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 bg-white">
                                        <option value="">None (Top-level category)</option>
                                        {renderCategoryOptions(categoryTree)}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Select a parent to make this a sub-category, or "None" for top-level.
                                    </p>
                                </div>

                                {/* Page Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Page Title</label>
                                    <input type="text" value={formData.title} onChange={handleTitleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                        placeholder="Main heading on the category page" />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea value={formData.description} onChange={set('description')} rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                        placeholder="Short description for category cards and pages" />
                                </div>
                            </div>
                        </div>

                        {/* Logo */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MdImage className="text-[#b27e02]" /> Category Logo</h3>
                            <div className="max-w-xs">
                                <BannerPicker
                                    label="Logo"
                                    hint="square or transparent PNG"
                                    icon={<MdImage className="text-[#b27e02]" size={18} />}
                                    filterType=""
                                    value={formData.logo}
                                    onChange={(url) => setFormData(prev => ({ ...prev, logo: url }))}
                                />
                            </div>
                        </div>

                        {/* Banner Images */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MdImage className="text-[#b27e02]" /> Banner Images</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <BannerPicker
                                        label="Desktop Banner"
                                        hint="16:9 landscape"
                                        icon={<MdDesktopWindows className="text-[#b27e02]" size={18} />}
                                        filterType="hero"
                                        value={formData.heroImage}
                                        onChange={(url) => setFormData(prev => ({ ...prev, heroImage: url }))}
                                    />
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Desktop ALT Text</label>
                                        <input type="text" value={formData.heroImageAlt} onChange={set('heroImageAlt')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 text-sm"
                                            placeholder="Describe the desktop banner" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <BannerPicker
                                        label="Mobile Banner"
                                        hint="9:16 portrait"
                                        icon={<MdPhoneAndroid className="text-[#b27e02]" size={18} />}
                                        filterType="hero-mobile"
                                        value={formData.mobileBanner}
                                        onChange={(url) => setFormData(prev => ({ ...prev, mobileBanner: url }))}
                                    />
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile ALT Text</label>
                                        <input type="text" value={formData.mobileBannerAlt} onChange={set('mobileBannerAlt')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 text-sm"
                                            placeholder="Describe the mobile banner" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Category Page Content</h3>
                            <TipTapEditor content={formData.content} onChange={(html) => setFormData(prev => ({ ...prev, content: html }))} />
                        </div>

                        {/* SEO */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">SEO Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
                                    <input type="text" value={formData.metaTitle} onChange={set('metaTitle')} maxLength="60"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                        placeholder="SEO title (55–60 characters)" />
                                    <p className="text-xs text-gray-400 mt-1">{formData.metaTitle.length}/60</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                                    <textarea value={formData.metaDescription} onChange={set('metaDescription')} rows={3} maxLength="160"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                        placeholder="SEO description (150–160 characters)" />
                                    <p className="text-xs text-gray-400 mt-1">{formData.metaDescription.length}/160</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                                    <input type="text" value={formData.keywords} onChange={set('keywords')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                        placeholder="real estate, property, buy, sell" />
                                </div>
                            </div>
                        </div>

                        {/* FAQs */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">FAQs</h3>
                                <button type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }))}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#b27e02] text-white text-sm font-semibold rounded-lg hover:bg-[#8a6002] transition">
                                    <MdAdd size={18} /> Add FAQ
                                </button>
                            </div>
                            {formData.faqs.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">No FAQs added yet. Click "Add FAQ" to get started.</p>
                            ) : (
                                <div className="space-y-4">
                                    {formData.faqs.map((faq, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-semibold text-gray-600">FAQ #{idx + 1}</span>
                                                <button type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== idx) }))}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                                    <MdDelete size={18} />
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    value={faq.question}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, faqs: prev.faqs.map((f, i) => i === idx ? { ...f, question: e.target.value } : f) }))}
                                                    placeholder="Question"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 text-sm"
                                                />
                                                <textarea
                                                    value={faq.answer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, faqs: prev.faqs.map((f, i) => i === idx ? { ...f, answer: e.target.value } : f) }))}
                                                    placeholder="Answer"
                                                    rows={3}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => router.push('/admin/categories')}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex-1 px-6 py-3 bg-[#b27e02] text-white rounded-lg hover:bg-[#8a6002] transition font-semibold disabled:opacity-50">
                                {submitting ? 'Updating...' : 'Update Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
