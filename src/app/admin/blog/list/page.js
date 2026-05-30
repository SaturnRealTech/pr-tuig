'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import {
    MdEdit, MdDelete, MdVisibility, MdArticle, MdImage,
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import { calculateReadTime } from '@/utils/readTime';

const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { ssr: false });

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

export default function BlogList() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlogs, setSelectedBlogs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [importing, setImporting] = useState(false);
    const [bulkImporting, setBulkImporting] = useState(false);
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
        fetchBlogs();
        fetchPageData();
    }, [router]);

    const fetchBlogs = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/blog', { cache: 'no-store' });
            const result = await res.json();
            if (result.success) setBlogs(result.data);
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPageData = async () => {
        try {
            const res = await fetch('/api/blog-page');
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

    const generateSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const applyJsonAndSave = async (raw) => {
        let json;
        try {
            json = JSON.parse(raw);
        } catch {
            Swal.fire('Parse Error', 'Invalid JSON. Please check the format.', 'error');
            return;
        }

        const pick = (...keys) => { for (const k of keys) { if (json[k] !== undefined && json[k] !== null && json[k] !== '') return json[k]; } return undefined; };
        const title = pick('title') || '';
        if (!title) { Swal.fire('Missing Field', 'JSON must include a "title" field.', 'warning'); return; }

        const content = pick('content', 'body', 'html') || '';
        const keywords = pick('keywords', 'tags');

        setImporting(true);
        try {
            let nextId = Date.now();
            try {
                const r = await fetch('/api/blog');
                const d = await r.json();
                const ids = Array.isArray(d.data) ? d.data.map(b => b.id || 0) : [];
                nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
            } catch { /* fallback to timestamp */ }

            const blogData = {
                id: nextId,
                title,
                slug: pick('slug') || generateSlug(title),
                excerpt: pick('excerpt', 'description', 'summary') || '',
                category: pick('category') || '',
                author: pick('author', 'authorName') || user?.name || '',
                readTime: pick('readTime') || (content ? calculateReadTime(content) : ''),
                date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                heroImage: pick('heroImage', 'image', 'thumbnail', 'featuredImage') || '',
                heroImageAlt: pick('heroImageAlt', 'imageAlt', 'alt') || '',
                content,
                image: pick('heroImage', 'image', 'thumbnail', 'featuredImage') || '📝',
                seo: {
                    title: pick('seoTitle', 'metaTitle') || json.seo?.title || title,
                    description: pick('seoDescription', 'metaDescription') || json.seo?.description || pick('excerpt', 'description', 'summary') || '',
                    keywords: keywords ? (Array.isArray(keywords) ? keywords : String(keywords).split(',').map(k => k.trim())) : [],
                },
            };

            const res = await fetch('/api/blog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(blogData),
            });
            const result = await res.json();
            if (result.success) {
                setJsonText('');
                setShowImport(false);
                await Swal.fire({ icon: 'success', title: 'Blog Created!', text: `"${title}" has been published.`, timer: 2000, showConfirmButton: false });
                fetchBlogs();
            } else {
                Swal.fire('Error', result.error || 'Failed to save blog.', 'error');
            }
        } catch (err) {
            Swal.fire('Error', err.message || 'Something went wrong.', 'error');
        } finally {
            setImporting(false);
        }
    };

    const handleJsonFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.json')) { Swal.fire('Invalid File', 'Please upload a .json file.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => applyJsonAndSave(ev.target.result);
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleJsonPaste = () => {
        if (!jsonText.trim()) { Swal.fire('Empty', 'Please paste JSON content first.', 'warning'); return; }
        applyJsonAndSave(jsonText);
    };

    const readFileAsText = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });

    // Bulk-upload: user picks a folder (or multiple .json files). Each file is
    // parsed in the browser, then the whole batch is posted to
    // /api/blog/bulk-import which dedups by title and inserts the rest.
    const handleBulkUpload = async (e) => {
        const files = Array.from(e.target.files || []).filter(f => f.name.toLowerCase().endsWith('.json'));
        e.target.value = '';
        if (files.length === 0) {
            Swal.fire('No JSON files', 'The selection did not contain any .json files.', 'warning');
            return;
        }

        const confirm = await Swal.fire({
            title: `Import ${files.length} blog file(s)?`,
            text: 'Posts with a matching slug will be updated; the rest will be created.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, import',
            confirmButtonColor: '#b8860b',
            cancelButtonColor: '#6b7280',
        });
        if (!confirm.isConfirmed) return;

        setBulkImporting(true);
        Swal.fire({ title: 'Importing...', html: `Reading ${files.length} file(s)...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        const blogs = [];
        const parseErrors = [];
        for (const file of files) {
            try {
                const text = await readFileAsText(file);
                const parsed = JSON.parse(text);
                blogs.push({ ...parsed, __source: file.name });
            } catch (err) {
                parseErrors.push({ source: file.name, status: 'failed', error: `Parse error: ${err.message}` });
            }
        }

        try {
            const res = await fetch('/api/blog/bulk-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blogs }),
            });
            const result = await res.json();
            if (!result.success) {
                await Swal.fire('Error', result.error || 'Bulk import failed.', 'error');
                return;
            }

            const inserted = result.inserted || 0;
            const updated = result.updated || 0;
            const failed = (result.failed || 0) + parseErrors.length;
            const allDetails = [...parseErrors, ...(result.details || [])];
            const failedRows = allDetails.filter(d => d.status === 'failed');
            const updatedRows = allDetails.filter(d => d.status === 'updated');

            const failedHtml = failedRows.length
                ? `<details class="mt-3 text-left"><summary class="cursor-pointer font-semibold text-red-600">Failed (${failedRows.length})</summary><ul class="text-xs text-gray-600 mt-2 max-h-40 overflow-y-auto">${failedRows.map(d => `<li>• ${d.source}: ${d.error || ''}</li>`).join('')}</ul></details>`
                : '';
            const updatedHtml = updatedRows.length
                ? `<details class="mt-2 text-left"><summary class="cursor-pointer font-semibold text-gray-600">Updated (${updatedRows.length})</summary><ul class="text-xs text-gray-600 mt-2 max-h-40 overflow-y-auto">${updatedRows.map(d => `<li>• ${d.source} — slug matched existing post</li>`).join('')}</ul></details>`
                : '';

            await Swal.fire({
                icon: failed > 0 ? 'warning' : 'success',
                title: 'Bulk Import Complete',
                html: `<div class="text-left text-sm"><p><strong>Inserted:</strong> ${inserted}</p><p><strong>Updated:</strong> ${updated}</p><p><strong>Failed:</strong> ${failed}</p>${updatedHtml}${failedHtml}</div>`,
            });
            fetchBlogs();
        } catch (err) {
            await Swal.fire('Error', err.message || 'Bulk import failed.', 'error');
        } finally {
            setBulkImporting(false);
        }
    };

    const setPage = (field) => (e) => setPageData(prev => ({ ...prev, [field]: e.target.value }));

    const handleSavePage = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/blog-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pageData),
            });
            const result = await res.json();
            if (result.success) {
                await Swal.fire({ icon: 'success', title: 'Saved!', timer: 1800, showConfirmButton: false });
            } else {
                await Swal.fire({ icon: 'error', title: 'Error', text: result.error });
            }
        } catch {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! Images will be deleted from S3.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });
        if (!result.isConfirmed) return;
        try {
            const res = await fetch(`/api/blog/${id}`, { method: 'DELETE' });
            const apiResult = await res.json();
            if (apiResult.success) {
                await Swal.fire('Deleted!', 'Blog post has been deleted.', 'success');
                fetchBlogs();
            } else {
                await Swal.fire('Error!', apiResult.error, 'error');
            }
        } catch {
            await Swal.fire('Error!', 'Failed to delete blog', 'error');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedBlogs.length === 0) {
            await Swal.fire('Warning', 'Please select blogs to delete', 'warning');
            return;
        }
        const result = await Swal.fire({
            title: 'Delete Multiple Blogs?',
            text: `You are about to delete ${selectedBlogs.length} blog(s). This cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });
        if (!result.isConfirmed) return;
        try {
            await Promise.all(selectedBlogs.map(id => fetch(`/api/blog/${id}`, { method: 'DELETE' })));
            await Swal.fire('Deleted!', `${selectedBlogs.length} blog(s) have been deleted.`, 'success');
            setSelectedBlogs([]);
            fetchBlogs();
        } catch {
            await Swal.fire('Error!', 'Failed to delete some blogs', 'error');
        }
    };

    const toggleSelectBlog = (id) => setSelectedBlogs(prev =>
        prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
    const toggleSelectAll = () => setSelectedBlogs(
        selectedBlogs.length === blogs.length ? [] : blogs.map(b => b._id || b.id)
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 space-y-6">

                    {/* Blog Page Hero Banner */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-5">Blog Page Hero Banner</h3>
                        <div className="grid grid-cols-2 gap-6 mb-5">
                            <div className="space-y-2">
                                <ImagePicker
                                    label="Desktop Banner"
                                    hint="1920×600 recommended"
                                    value={pageData.desktopBanner}
                                    onChange={(url) => setPageData(prev => ({ ...prev, desktopBanner: url }))}
                                    onAltChange={(alt) => setPageData(prev => ({ ...prev, desktopBannerAlt: alt }))}
                                    filterType="hero"
                                />
                                <input type="text" value={pageData.desktopBannerAlt} onChange={setPage('desktopBannerAlt')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="Desktop banner ALT text" />
                            </div>
                            <div className="space-y-2">
                                <ImagePicker
                                    label="Mobile Banner"
                                    hint="800×1000 recommended"
                                    value={pageData.mobileBanner}
                                    onChange={(url) => setPageData(prev => ({ ...prev, mobileBanner: url }))}
                                    onAltChange={(alt) => setPageData(prev => ({ ...prev, mobileBannerAlt: alt }))}
                                    filterType="hero-mobile"
                                />
                                <input type="text" value={pageData.mobileBannerAlt} onChange={setPage('mobileBannerAlt')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="Mobile banner ALT text" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Title</label>
                                <input type="text" value={pageData.bannerTitle} onChange={setPage('bannerTitle')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="e.g. Our Blog" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Description</label>
                                <input type="text" value={pageData.bannerDescription} onChange={setPage('bannerDescription')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="Short subtitle below the title" />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-t border-gray-100 pt-5">SEO Settings</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
                                <input type="text" value={pageData.metaTitle} onChange={setPage('metaTitle')} maxLength="60"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="SEO title (55–60 chars)" />
                                <p className="text-xs text-gray-400 mt-1">{pageData.metaTitle.length}/60</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                                <input type="text" value={pageData.keywords} onChange={setPage('keywords')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="real estate blog, property tips" />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                            <textarea value={pageData.metaDescription} onChange={setPage('metaDescription')} rows={2} maxLength="160"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                placeholder="SEO description (150–160 chars)" />
                            <p className="text-xs text-gray-400 mt-1">{pageData.metaDescription.length}/160</p>
                        </div>
                        <button onClick={handleSavePage} disabled={saving}
                            className="px-8 py-2.5 bg-gold text-white font-semibold rounded-lg hover:bg-gold disabled:opacity-60 transition shadow">
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>

                    {/* Blog Posts Table */}
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">All Blog Posts</h1>
                                <p className="text-gray-600">Manage your blog content</p>
                            </div>
                            <div className="flex gap-3">
                                {selectedBlogs.length > 0 && user?.role === 'admin' && (
                                    <button onClick={handleBulkDelete}
                                        className="bg-gold text-white font-bold py-3 px-6 rounded-lg hover:bg-gold transition-all flex items-center gap-2">
                                        <MdDelete /> Delete Selected ({selectedBlogs.length})
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowImport(v => !v)}
                                    className={`font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 border-2 ${showImport ? 'bg-gold border-gold text-white' : 'border-gold text-gold hover:bg-gold hover:text-white'}`}>
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Import JSON
                                </button>
                                <label className={`font-bold py-3 px-6 rounded-lg transition-all flex items-center gap-2 border-2 cursor-pointer ${bulkImporting ? 'opacity-60 cursor-not-allowed' : ''} border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white`}>
                                    {bulkImporting ? (
                                        <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Importing...</>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                                            Bulk Upload Folder
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept=".json,application/json"
                                        multiple
                                        webkitdirectory=""
                                        directory=""
                                        onChange={handleBulkUpload}
                                        disabled={bulkImporting}
                                        className="hidden"
                                    />
                                </label>
                                <a href="/admin/blog/create"
                                    className="bg-gradient-to-r from-gold to-gold text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                                    <MdArticle /> New Blog Post
                                </a>
                            </div>
                        </div>

                        {/* JSON Import Panel */}
                        {showImport && (
                            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-gold mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">Import Blog from JSON</h2>
                                        <p className="text-sm text-gray-500">Upload a file or paste JSON — blog will be created directly.</p>
                                    </div>
                                    <button onClick={() => { setShowImport(false); setJsonText(''); }} className="text-gray-400 hover:text-gray-600 transition">
                                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                                    {/* Key hints */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Accepted Key Names</p>
                                        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1.5">
                                            {[
                                                ['Title *', 'title'],
                                                ['Slug', 'slug'],
                                                ['Excerpt', 'excerpt, description, summary'],
                                                ['Content', 'content, body, html'],
                                                ['Category', 'category'],
                                                ['Author', 'author, authorName'],
                                                ['Keywords', 'keywords, tags (string or array)'],
                                                ['Hero Image', 'heroImage, image, thumbnail, featuredImage'],
                                                ['Image Alt', 'heroImageAlt, imageAlt, alt'],
                                                ['SEO Title', 'seoTitle, metaTitle'],
                                                ['SEO Desc', 'seoDescription, metaDescription'],
                                            ].map(([label, keys]) => (
                                                <div key={label} className="flex gap-2">
                                                    <span className="font-semibold text-gray-700 w-24 shrink-0">{label}:</span>
                                                    <span className="text-gray-500">{keys}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Example JSON */}
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Example JSON Format</p>
                                        <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-auto max-h-64">{`{
  "title": "My Blog Post Title",
  "slug": "my-blog-post-title",
  "excerpt": "Short description of the blog.",
  "category": "Real Estate",
  "author": "John Doe",
  "content": "<p>Full blog content here...</p>",
  "keywords": ["real estate", "property"],
  "heroImage": "https://example.com/image.jpg",
  "heroImageAlt": "Blog hero image",
  "seoTitle": "SEO Optimized Title",
  "seoDescription": "Meta description for search engines."
}`}</pre>
                                    </div>
                                </div>

                                {/* File upload */}
                                <div className="flex items-center gap-4 mb-4">
                                    <label className="inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 bg-gold text-white font-semibold rounded-lg hover:bg-gold transition-all text-sm">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                        Choose JSON File
                                        <input type="file" accept=".json" onChange={handleJsonFileUpload} className="hidden" disabled={importing} />
                                    </label>
                                    <span className="text-sm text-gray-400">or paste below</span>
                                </div>

                                {/* Paste textarea */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Paste JSON</p>
                                    <textarea
                                        value={jsonText}
                                        onChange={e => setJsonText(e.target.value)}
                                        rows={6}
                                        disabled={importing}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream font-mono text-xs text-gray-800 placeholder-gray-400 resize-y disabled:opacity-50"
                                        placeholder={'{\n  "title": "My Blog Post",\n  "content": "<p>...</p>",\n  "excerpt": "Short description"\n}'}
                                    />
                                    <div className="flex items-center gap-3 mt-2">
                                        <button
                                            type="button"
                                            onClick={handleJsonPaste}
                                            disabled={importing}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white font-semibold rounded-lg hover:bg-gold disabled:opacity-50 transition-all text-sm"
                                        >
                                            {importing ? (
                                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                                            ) : (
                                                <><svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> Apply &amp; Create</>
                                            )}
                                        </button>
                                        {jsonText && !importing && (
                                            <button type="button" onClick={() => setJsonText('')} className="text-sm text-gray-400 hover:text-gray-600 transition">Clear</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">⏳</div>
                                <p className="text-xl text-gray-600">Loading blogs...</p>
                            </div>
                        ) : blogs.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                                <MdArticle className="text-6xl text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-800 mb-2">No blogs yet</h3>
                                <p className="text-gray-600 mb-6">Start creating your first blog post</p>
                                <a href="/admin/blog/create"
                                    className="inline-block bg-gold text-white font-bold py-3 px-6 rounded-lg hover:bg-gold transition">
                                    Create Blog Post
                                </a>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left">
                                                    <input type="checkbox"
                                                        checked={selectedBlogs.length === blogs.length && blogs.length > 0}
                                                        onChange={toggleSelectAll}
                                                        className="w-4 h-4 text-gold rounded focus:ring-gold" />
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Author</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Views</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">SEO</th>
                                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {blogs.map((blog) => (
                                                <tr key={blog._id || (blog._id || blog.id)} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <input type="checkbox"
                                                            checked={selectedBlogs.includes((blog._id || blog.id))}
                                                            onChange={() => toggleSelectBlog((blog._id || blog.id))}
                                                            className="w-4 h-4 text-gold rounded focus:ring-gold" />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-semibold text-gray-800">{blog.title}</div>
                                                        <div className="text-sm text-gray-600 line-clamp-1">{blog.excerpt}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{blog.category}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">{blog.author}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <MdVisibility className="text-gray-500" size={18} />
                                                            <span className="font-semibold text-gray-700">{blog.views || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-700">{blog.date}</td>
                                                    <td className="px-6 py-4">
                                                        <IndexableBadge
                                                            value={blog.robotsMeta}
                                                            onToggle={async () => {
                                                                const id = blog._id || blog.id;
                                                                const nextIndex = !isIndexable(blog.robotsMeta);
                                                                const robotsMeta = { ...(blog.robotsMeta || {}), index: nextIndex, follow: blog.robotsMeta?.follow ?? true };
                                                                setBlogs(prev => prev.map(b => (b._id || b.id) === id ? { ...b, robotsMeta } : b));
                                                                try {
                                                                    const { apiFetch } = await import('@/lib/apiClient');
                                                                    await apiFetch(`/api/blog/${id}`, { method: 'PUT', body: { robotsMeta } });
                                                                } catch (e) {
                                                                    setBlogs(prev => prev.map(b => (b._id || b.id) === id ? { ...b, robotsMeta: blog.robotsMeta } : b));
                                                                    Swal.fire('Error', e.message, 'error');
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a href={`/blog/${blog.slug || blog._id || blog.id}`} target="_blank"
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View">
                                                                <MdVisibility size={20} />
                                                            </a>
                                                            <a href={`/admin/blog/edit/${(blog._id || blog.id)}`}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Edit">
                                                                <MdEdit size={20} />
                                                            </a>
                                                            {user?.role === 'admin' && (
                                                            <button onClick={() => handleDelete((blog._id || blog.id))}
                                                                className="p-2 text-gold hover:bg-cream rounded-lg transition" title="Delete">
                                                                <MdDelete size={20} />
                                                            </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}

// Indexable-or-noindex pill with an inline toggle. Lives at the bottom of the
// file so the list table stays readable.
function isIndexable(robotsMeta) {
    if (!robotsMeta) return true;
    return robotsMeta.index !== false;
}

function IndexableBadge({ value, onToggle }) {
    const ok = isIndexable(value);
    return (
        <button type="button" onClick={onToggle}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${ok ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
            title={ok ? 'Indexable — click to set noindex' : 'noindex — click to make indexable'}>
            {ok ? 'Indexable' : 'noindex'}
        </button>
    );
}
