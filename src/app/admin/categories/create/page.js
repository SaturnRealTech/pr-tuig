'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    MdArrowBack, MdDesktopWindows, MdPhoneAndroid,
    MdImage, MdAdd, MdDelete
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
                            className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-cream transition">
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
                    className="w-full flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl hover:border-gold hover:bg-cream transition">
                    <MdImage size={32} className="text-gray-300 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                </button>
            )}
            {showPicker && (
                <MediaPicker
                    filterType={filterType}
                    currentUrl={value}
                    onSelect={(url) => { onChange(url); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

export default function CreateCategory() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedGroupId = searchParams.get('groupId') || '';

    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [groups, setGroups] = useState([]);
    const [categories, setCategories] = useState([]); // For parent category selection
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        slug: '',
        description: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        heroImage: '',
        heroImageAlt: '',
        mobileBanner: '',
        mobileBannerAlt: '',
        logo: '',
        groupId: preselectedGroupId,
        parentId: '',
        faqs: [],
    });


    // Fetch all categories (excluding groups) for parent selection
    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/categories');
            const result = await res.json();
            if (result.success) {
                setCategories(result.data.filter(c => c.type !== 'group'));
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchGroups();
        fetchCategories();
    }, [router]);

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

    const handleNameChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, name: val, slug: generateSlug(val) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = { ...formData, type: 'category' };
            // Remove parentId if not set
            if (!payload.parentId) delete payload.parentId;
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (result.success) {
                await Swal.fire({ icon: 'success', title: 'Created!', text: 'Category created successfully', timer: 2000, showConfirmButton: false });
                router.push('/admin/categories');
            } else {
                await Swal.fire({ icon: 'error', title: 'Error', text: result.error });
            }
        } catch {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create category' });
        } finally {
            setSubmitting(false);
        }
    };


    const filteredParentCategories = categories.filter(cat => {
        if (formData.groupId) {
            return cat.groupId?.toString() === formData.groupId;
        }
        return !cat.groupId;
    });

    const buildCategoryTree = (items, parentId = '') => {
        return items
            .filter(item => (item.parentId ? item.parentId.toString() : '') === parentId)
            .map(item => ({
                ...item,
                children: buildCategoryTree(items, item._id.toString()),
            }));
    };

    const renderCategoryOptions = (tree, level = 0) => {
        return tree.flatMap(item => [
            <option key={item._id} value={item._id}>
                {`${'— '.repeat(level)}${item.name}`}
            </option>,
            ...renderCategoryOptions(item.children, level + 1),
        ]);
    };

    const parentCategoryTree = buildCategoryTree(filteredParentCategories);

    if (!user) return null;

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-8">
                        <button onClick={() => router.push('/admin/categories')} className="flex items-center gap-2 text-gray-600 hover:text-gold mb-4 transition">
                            <MdArrowBack size={20} /> Back to Categories
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">Add New Category</h1>
                        <p className="text-gray-500 text-sm mt-1">Select a group to organise this category (e.g. Location → Bangalore).</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Category Details</h3>
                            <div className="space-y-4">

                                {/* Group */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Group</label>
                                    <select value={formData.groupId} onChange={set('groupId')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 bg-white">
                                        <option value="">— No group (ungrouped) —</option>
                                        {groups.map(g => (
                                            <option key={g._id} value={g._id}>{g.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Group this under Location, Builder, Status, etc.{' '}
                                        {groups.length === 0 && (
                                            <a href="/admin/categories" className="text-gold font-semibold hover:underline">
                                                Add a group first →
                                            </a>
                                        )}
                                    </p>
                                </div>

                                {/* Parent Category */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Category</label>
                                    <select value={formData.parentId} onChange={set('parentId')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 bg-white">
                                        <option value="">— No parent (top-level) —</option>
                                        {renderCategoryOptions(parentCategoryTree)}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Optionally nest this category under another category.
                                    </p>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name <span className="text-gold">*</span></label>
                                    <input type="text" value={formData.name} onChange={handleNameChange} required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="e.g., Bangalore, DLF, Ready to Move" />
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Slug <span className="text-gold">*</span></label>
                                    <input type="text" value={formData.slug} onChange={set('slug')} required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 font-mono"
                                        placeholder="bangalore" />
                                    <p className="text-xs text-gray-400 mt-1">URL: /projects/category/<strong>{formData.slug || 'your-slug'}</strong></p>
                                </div>

                                {/* Page Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Page Title</label>
                                    <input type="text" value={formData.title} onChange={set('title')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="Heading shown on the category page" />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                    <textarea value={formData.description} onChange={set('description')} rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="Short description shown on category pages" />
                                </div>
                            </div>
                        </div>

                        {/* Logo */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MdImage className="text-gold" /> Category Logo</h3>
                            <div className="max-w-xs">
                                <BannerPicker
                                    label="Logo"
                                    hint="square or transparent PNG"
                                    icon={<MdImage className="text-gold" size={18} />}
                                    filterType=""
                                    value={formData.logo}
                                    onChange={(url) => setFormData(prev => ({ ...prev, logo: url }))}
                                />
                            </div>
                        </div>

                        {/* Banner Images */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><MdImage className="text-gold" /> Banner Images</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <BannerPicker
                                        label="Desktop Banner"
                                        hint="16:9 landscape"
                                        icon={<MdDesktopWindows className="text-gold" size={18} />}
                                        filterType="hero"
                                        value={formData.heroImage}
                                        onChange={(url) => setFormData(prev => ({ ...prev, heroImage: url }))}
                                    />
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Desktop ALT Text</label>
                                        <input type="text" value={formData.heroImageAlt} onChange={set('heroImageAlt')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 text-sm"
                                            placeholder="Describe the desktop banner" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <BannerPicker
                                        label="Mobile Banner"
                                        hint="9:16 portrait"
                                        icon={<MdPhoneAndroid className="text-gold" size={18} />}
                                        filterType="hero-mobile"
                                        value={formData.mobileBanner}
                                        onChange={(url) => setFormData(prev => ({ ...prev, mobileBanner: url }))}
                                    />
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile ALT Text</label>
                                        <input type="text" value={formData.mobileBannerAlt} onChange={set('mobileBannerAlt')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 text-sm"
                                            placeholder="Describe the mobile banner" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Editor */}
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="SEO title (55–60 characters)" />
                                    <p className="text-xs text-gray-400 mt-1">{formData.metaTitle.length}/60</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                                    <textarea value={formData.metaDescription} onChange={set('metaDescription')} rows={3} maxLength="160"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="SEO description (150–160 characters)" />
                                    <p className="text-xs text-gray-400 mt-1">{formData.metaDescription.length}/160</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                                    <input type="text" value={formData.keywords} onChange={set('keywords')}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="real estate, property, bangalore" />
                                </div>
                            </div>
                        </div>

                        {/* FAQs */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">FAQs</h3>
                                <button type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { question: '', answer: '' }] }))}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:bg-gold transition">
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
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 text-sm"
                                                />
                                                <textarea
                                                    value={faq.answer}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, faqs: prev.faqs.map((f, i) => i === idx ? { ...f, answer: e.target.value } : f) }))}
                                                    placeholder="Answer"
                                                    rows={3}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button type="button" onClick={() => router.push('/admin/categories')}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="flex-1 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold transition font-semibold disabled:opacity-50">
                                {submitting ? 'Adding...' : 'Add Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
