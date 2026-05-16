'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    MdImage, MdArrowBack, MdDesktopWindows, MdPhoneAndroid,
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), {
    ssr: false,
    loading: () => <p className="text-gray-500 py-4">Loading editor...</p>,
});
const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { ssr: false });

function BannerPicker({ label, hint, icon, value, onChange, filterType = '' }) {
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
                            className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-[#fef9e7] transition">Change</button>
                        <button type="button" onClick={() => onChange('')}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">Remove</button>
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

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 placeholder-gray-400';

export default function EditBlogCategory() {
    const router = useRouter();
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '', slug: '', description: '', content: '',
        metaTitle: '', metaDescription: '', keywords: '',
        heroImage: '', heroImageAlt: '', mobileBanner: '', mobileBannerAlt: '',
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchCategory();
    }, [router, id]);

    const fetchCategory = async () => {
        try {
            const res = await fetch(`/api/blog-categories/${id}`);
            const data = await res.json();
            if (data.success) {
                const c = data.data;
                setFormData({
                    name: c.name || '',
                    slug: c.slug || '',
                    description: c.description || '',
                    content: c.content || '',
                    metaTitle: c.metaTitle || '',
                    metaDescription: c.metaDescription || '',
                    keywords: c.keywords || '',
                    heroImage: c.heroImage || '',
                    heroImageAlt: c.heroImageAlt || '',
                    mobileBanner: c.mobileBanner || '',
                    mobileBannerAlt: c.mobileBannerAlt || '',
                });
            } else {
                Swal.fire('Error', 'Category not found.', 'error');
                router.push('/admin/blog/categories');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.slug) {
            Swal.fire('Error', 'Name and slug are required.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch(`/api/blog-categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Updated!', timer: 1400, showConfirmButton: false });
                router.push('/admin/blog/categories');
            } else {
                Swal.fire('Error', data.error, 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!user || loading) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main */}
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <a href="/admin/blog/categories" className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-600">
                            <MdArrowBack size={22} />
                        </a>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Edit Blog Category</h1>
                            <p className="text-gray-500 mt-1">{formData.name}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-5">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
                                    <input name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug *</label>
                                    <input name="slug" value={formData.slug} onChange={handleChange} required className={inputClass} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Banner Images */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-5">Banner Images</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <BannerPicker
                                        label="Desktop Banner"
                                        hint="1920×600 recommended"
                                        icon={<MdDesktopWindows size={16} className="text-[#b27e02]" />}
                                        value={formData.heroImage}
                                        onChange={(url) => setFormData(prev => ({ ...prev, heroImage: url }))}
                                        filterType="hero"
                                    />
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Desktop Banner Alt Text</label>
                                        <input name="heroImageAlt" value={formData.heroImageAlt} onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#b27e02]" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <BannerPicker
                                        label="Mobile Banner"
                                        hint="600×900 recommended"
                                        icon={<MdPhoneAndroid size={16} className="text-[#b27e02]" />}
                                        value={formData.mobileBanner}
                                        onChange={(url) => setFormData(prev => ({ ...prev, mobileBanner: url }))}
                                        filterType="hero-mobile"
                                    />
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Banner Alt Text</label>
                                        <input name="mobileBannerAlt" value={formData.mobileBannerAlt} onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#b27e02]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SEO */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-5">SEO Settings</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Title</label>
                                    <input name="metaTitle" value={formData.metaTitle} onChange={handleChange} maxLength={60} className={inputClass} />
                                    <p className="text-xs text-gray-400 mt-1">{formData.metaTitle.length}/60 characters</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Description</label>
                                    <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={2} maxLength={160} className={inputClass} />
                                    <p className="text-xs text-gray-400 mt-1">{formData.metaDescription.length}/160 characters</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keywords <span className="text-gray-400 font-normal">(comma separated)</span></label>
                                    <input name="keywords" value={formData.keywords} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-5">Content <span className="text-sm text-gray-400 font-normal">(optional)</span></h2>
                            <TipTapEditor
                                content={formData.content}
                                onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4">
                            <button type="submit" disabled={submitting}
                                className="flex-1 bg-gradient-to-r from-[#b27e02] to-[#8a6002] text-white font-bold py-3.5 px-6 rounded-lg hover:shadow-lg transition disabled:opacity-50">
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                            <a href="/admin/blog/categories"
                                className="px-6 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition">
                                Cancel
                            </a>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
