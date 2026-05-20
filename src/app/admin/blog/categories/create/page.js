'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
                            className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-cream transition">Change</button>
                        <button type="button" onClick={() => onChange('')}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">Remove</button>
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
                    onSelect={(url) => { onChange(url); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 placeholder-gray-400';

export default function CreateBlogCategory() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '', slug: '', description: '', content: '',
        metaTitle: '', metaDescription: '', keywords: '',
        heroImage: '', heroImageAlt: '', mobileBanner: '', mobileBannerAlt: '',
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
    }, [router]);

    const generateSlug = (name) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }));
    };

    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.json')) {
            Swal.fire('Invalid File', 'Please upload a .json file.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const pick = (...keys) => { for (const k of keys) { if (json[k] !== undefined && json[k] !== null && json[k] !== '') return json[k]; } return undefined; };
                const name = pick('name', 'title') || '';
                const keywords = pick('keywords', 'tags');
                setFormData(prev => ({
                    ...prev,
                    ...(name && { name }),
                    slug: pick('slug') || (name ? generateSlug(name) : prev.slug),
                    ...(pick('description', 'excerpt', 'summary') !== undefined && { description: pick('description', 'excerpt', 'summary') }),
                    ...(pick('content', 'body', 'html') !== undefined && { content: pick('content', 'body', 'html') }),
                    ...(pick('metaTitle', 'seoTitle') !== undefined && { metaTitle: pick('metaTitle', 'seoTitle') }),
                    ...(pick('metaDescription', 'seoDescription') !== undefined && { metaDescription: pick('metaDescription', 'seoDescription') }),
                    ...(keywords !== undefined && { keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords }),
                    ...(pick('heroImage', 'image', 'desktopBanner', 'featuredImage') !== undefined && { heroImage: pick('heroImage', 'image', 'desktopBanner', 'featuredImage') }),
                    ...(pick('heroImageAlt', 'imageAlt', 'alt') !== undefined && { heroImageAlt: pick('heroImageAlt', 'imageAlt', 'alt') }),
                    ...(pick('mobileBanner', 'mobileImage') !== undefined && { mobileBanner: pick('mobileBanner', 'mobileImage') }),
                    ...(pick('mobileBannerAlt', 'mobileAlt') !== undefined && { mobileBannerAlt: pick('mobileBannerAlt', 'mobileAlt') }),
                }));
                Swal.fire({ icon: 'success', title: 'JSON Imported', text: 'Matching fields have been filled.', timer: 1500, showConfirmButton: false });
            } catch {
                Swal.fire('Parse Error', 'Invalid JSON file. Please check the format.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.slug) {
            Swal.fire('Error', 'Name and slug are required.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const res = await fetch('/api/blog-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Category Created!', timer: 1400, showConfirmButton: false });
                router.push('/admin/blog/categories');
            } else {
                Swal.fire('Error', data.error, 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;

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
                            <h1 className="text-3xl font-bold text-gray-800">Create Blog Category</h1>
                            <p className="text-gray-500 mt-1">Add a new category like News, Article, Market Update</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

                        {/* JSON Import */}
                        <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gold p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-1">Import from JSON</h2>
                            <p className="text-sm text-gray-500 mb-4">Upload any JSON file — matching fields will be auto-filled automatically.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Accepted Key Names</p>
                                    <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1.5">
                                        {[
                                            ['Name', 'name, title'],
                                            ['Slug', 'slug'],
                                            ['Description', 'description, excerpt, summary'],
                                            ['Content', 'content, body, html'],
                                            ['Meta Title', 'metaTitle, seoTitle'],
                                            ['Meta Description', 'metaDescription, seoDescription'],
                                            ['Keywords', 'keywords, tags (string or array)'],
                                            ['Desktop Banner', 'heroImage, image, desktopBanner, featuredImage'],
                                            ['Desktop Alt', 'heroImageAlt, imageAlt, alt'],
                                            ['Mobile Banner', 'mobileBanner, mobileImage'],
                                            ['Mobile Alt', 'mobileBannerAlt, mobileAlt'],
                                        ].map(([label, keys]) => (
                                            <div key={label} className="flex gap-2">
                                                <span className="font-semibold text-gray-700 w-32 shrink-0">{label}:</span>
                                                <span className="text-gray-500">{keys}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Example JSON Format</p>
                                    <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-auto max-h-64">{`{
  "name": "Market Updates",
  "slug": "market-updates",
  "description": "Latest real estate market news.",
  "content": "<p>Category page content...</p>",
  "metaTitle": "Market Updates | Blog",
  "metaDescription": "Stay updated with real estate trends.",
  "keywords": ["real estate", "market", "news"],
  "heroImage": "https://example.com/banner.jpg",
  "heroImageAlt": "Market updates banner",
  "mobileBanner": "https://example.com/mobile.jpg",
  "mobileBannerAlt": "Mobile banner"
}`}</pre>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 bg-gold text-white font-semibold rounded-lg hover:bg-gold transition-all text-sm">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Choose JSON File
                                    <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                                </label>
                                <span className="text-sm text-gray-400">or fill the form manually below</span>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-5">Basic Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name *</label>
                                    <input name="name" value={formData.name} onChange={handleNameChange} required
                                        className={inputClass} placeholder="e.g. News, Article, Market Update" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug *</label>
                                    <input name="slug" value={formData.slug} onChange={handleChange} required
                                        className={inputClass} placeholder="news, article, market-update" />
                                    <p className="text-xs text-gray-400 mt-1">Auto-generated from name</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Short Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2}
                                        className={inputClass} placeholder="Brief description of this category" />
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
                                        icon={<MdDesktopWindows size={16} className="text-gold" />}
                                        value={formData.heroImage}
                                        onChange={(url) => setFormData(prev => ({ ...prev, heroImage: url }))}
                                        filterType="hero"
                                    />
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Desktop Banner Alt Text</label>
                                        <input name="heroImageAlt" value={formData.heroImageAlt} onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold" placeholder="Describe the desktop banner" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <BannerPicker
                                        label="Mobile Banner"
                                        hint="600×900 recommended"
                                        icon={<MdPhoneAndroid size={16} className="text-gold" />}
                                        value={formData.mobileBanner}
                                        onChange={(url) => setFormData(prev => ({ ...prev, mobileBanner: url }))}
                                        filterType="hero-mobile"
                                    />
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Banner Alt Text</label>
                                        <input name="mobileBannerAlt" value={formData.mobileBannerAlt} onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold" placeholder="Describe the mobile banner" />
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
                                    <input name="metaTitle" value={formData.metaTitle} onChange={handleChange} maxLength={60}
                                        className={inputClass} placeholder="Leave empty to use category name" />
                                    <p className="text-xs text-gray-400 mt-1">{formData.metaTitle.length}/60 characters</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Meta Description</label>
                                    <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={2} maxLength={160}
                                        className={inputClass} placeholder="Leave empty to use short description" />
                                    <p className="text-xs text-gray-400 mt-1">{formData.metaDescription.length}/160 characters</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keywords <span className="text-gray-400 font-normal">(comma separated)</span></label>
                                    <input name="keywords" value={formData.keywords} onChange={handleChange}
                                        className={inputClass} placeholder="real estate, news, property market" />
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
                                className="flex-1 bg-gradient-to-r from-gold to-gold text-white font-bold py-3.5 px-6 rounded-lg hover:shadow-lg transition disabled:opacity-50">
                                {submitting ? 'Saving...' : 'Create Blog Category'}
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
