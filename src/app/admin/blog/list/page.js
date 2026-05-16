'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Swal from 'sweetalert2';
import {
    MdEdit, MdDelete, MdVisibility, MdArticle, MdImage,
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';

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
                    className="w-full flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#b27e02] hover:bg-[#fef9e7] transition">
                    <MdImage size={28} className="text-gray-300 mb-1.5" />
                    <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                </button>
            )}
            {showPicker && (
                <MediaPicker filterType={filterType} returnMeta={true} onSelect={handleSelect} onClose={() => setShowPicker(false)} />
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
            const res = await fetch('/api/blog');
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
        selectedBlogs.length === blogs.length ? [] : blogs.map(b => b.id)
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="Mobile banner ALT text" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Title</label>
                                <input type="text" value={pageData.bannerTitle} onChange={setPage('bannerTitle')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="e.g. Our Blog" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Description</label>
                                <input type="text" value={pageData.bannerDescription} onChange={setPage('bannerDescription')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="Short subtitle below the title" />
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-t border-gray-100 pt-5">SEO Settings</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
                                <input type="text" value={pageData.metaTitle} onChange={setPage('metaTitle')} maxLength="60"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="SEO title (55–60 chars)" />
                                <p className="text-xs text-gray-400 mt-1">{pageData.metaTitle.length}/60</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                                <input type="text" value={pageData.keywords} onChange={setPage('keywords')}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="real estate blog, property tips" />
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                            <textarea value={pageData.metaDescription} onChange={setPage('metaDescription')} rows={2} maxLength="160"
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                placeholder="SEO description (150–160 chars)" />
                            <p className="text-xs text-gray-400 mt-1">{pageData.metaDescription.length}/160</p>
                        </div>
                        <button onClick={handleSavePage} disabled={saving}
                            className="px-8 py-2.5 bg-[#b27e02] text-white font-semibold rounded-lg hover:bg-[#8a6002] disabled:opacity-60 transition shadow">
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
                                        className="bg-[#b27e02] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#8a6002] transition-all flex items-center gap-2">
                                        <MdDelete /> Delete Selected ({selectedBlogs.length})
                                    </button>
                                )}
                                <a href="/admin/blog/create"
                                    className="bg-gradient-to-r from-[#b27e02] to-[#8a6002] text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
                                    <MdArticle /> New Blog Post
                                </a>
                            </div>
                        </div>

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
                                    className="inline-block bg-[#b27e02] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#8a6002] transition">
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
                                                        className="w-4 h-4 text-[#b27e02] rounded focus:ring-[#c99010]" />
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Title</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Author</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Views</th>
                                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {blogs.map((blog) => (
                                                <tr key={blog._id || blog.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <input type="checkbox"
                                                            checked={selectedBlogs.includes(blog.id)}
                                                            onChange={() => toggleSelectBlog(blog.id)}
                                                            className="w-4 h-4 text-[#b27e02] rounded focus:ring-[#c99010]" />
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
                                                        <div className="flex items-center justify-end gap-2">
                                                            <a href={`/blog/${blog.id}`} target="_blank"
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View">
                                                                <MdVisibility size={20} />
                                                            </a>
                                                            <a href={`/admin/blog/edit/${blog.id}`}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="Edit">
                                                                <MdEdit size={20} />
                                                            </a>
                                                            {user?.role === 'admin' && (
                                                            <button onClick={() => handleDelete(blog.id)}
                                                                className="p-2 text-[#b27e02] hover:bg-[#fef9e7] rounded-lg transition" title="Delete">
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
