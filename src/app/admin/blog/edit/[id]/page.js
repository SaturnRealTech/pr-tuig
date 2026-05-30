'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    MdSave,
    MdDelete,
    MdImage,
} from 'react-icons/md';
import dynamic from 'next/dynamic';
const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { ssr: false });
import AdminSidebar from '@/components/AdminSidebar';
import RichTextEditor from '@/components/RichTextEditor';
import ApiCurlPanel from '@/components/ApiCurlPanel';
import SeoEditorPanel from '@/components/admin/SeoEditorPanel';
import SeoAnalyzer from '@/components/SeoAnalyzer';
import Swal from 'sweetalert2';
import { calculateReadTime } from '@/utils/readTime';

const SAMPLE_BLOG_PAYLOAD = {
    title: 'My First Blog Post',
    slug: 'my-first-blog-post',
    excerpt: 'A short summary of the post.',
    category: 'News',
    author: 'Admin',
    readTime: '4 min read',
    seoTitle: 'My First Blog Post — Saturn Realcon',
    seoDescription: 'Description for SEO.',
    keywords: 'real estate, news, pune',
    heroImage: 'https://cdn.example.com/hero.jpg',
    heroImageAlt: 'Hero image',
    content: '<p>Post content goes here...</p>',
};
const UPDATE_BLOG_PAYLOAD = { title: 'Updated Blog Title' };

function toLocalInputValue(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatHumanDate(d) {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function parseToInputValue(blog) {
    const raw = blog.publishedAt || blog.date || blog.createdAt;
    if (!raw) return toLocalInputValue(new Date());
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return toLocalInputValue(new Date());
    return toLocalInputValue(d);
}

export default function EditBlog() {
    const router = useRouter();
    const params = useParams();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [linkSuggestionsEnabled, setLinkSuggestionsEnabled] = useState(true);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        category: '',
        author: '',
        readTime: '',
        seoTitle: '',
        seoDescription: '',
        keywords: '',
        heroImage: '',
        heroImageAlt: '',
        content: '',
        robotsMeta: null,           // null = use Titles & Meta default
        schemaTemplates: [],        // array of template _id values
        autogenerateImageOverride: 'inherit', // 'inherit' | 'on' | 'off'
        publishedAt: toLocalInputValue(new Date()),
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/admin/login');
            return;
        }
        setUser(JSON.parse(userData));
        fetchBlog();
        fetchCategories();
        // Honor the Titles & Meta → Posts toggle. If linkSuggestions is off,
        // the editor's link button reverts to a plain URL prompt.
        fetch('/api/titles-meta')
            .then(r => r.json())
            .then(j => {
                if (j.success && j.data?.post?.linkSuggestions === false) setLinkSuggestionsEnabled(false);
            })
            .catch(() => { });
    }, [router, params.id]);

    const fetchBlog = async () => {
        try {
            const response = await fetch(`/api/blog/${params.id}`);
            const result = await response.json();

            if (result.success) {
                const blog = result.data;
                const calculatedReadTime = blog.readTime || calculateReadTime(blog.content || '');
                setFormData({
                    title: blog.title || '',
                    slug: blog.slug || '',
                    excerpt: blog.excerpt || '',
                    category: blog.category || '',
                    author: blog.author || '',
                    readTime: calculatedReadTime,
                    seoTitle: blog.seo?.title || '',
                    seoDescription: blog.seo?.description || '',
                    keywords: blog.seo?.keywords?.join(', ') || '',
                    heroImage: blog.heroImage || '',
                    heroImageAlt: blog.heroImageAlt || '',
                    content: blog.content || '',
                    robotsMeta: blog.robotsMeta || null,
                    schemaTemplates: Array.isArray(blog.schemaTemplates) ? blog.schemaTemplates.map(String) : [],
                    autogenerateImageOverride: blog.autogenerateImageOverride || 'inherit',
                    publishedAt: parseToInputValue(blog),
                });
            }
        } catch (error) {
            console.error('Error fetching blog:', error);
            Swal.fire('Error', 'Failed to load blog post', 'error');
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/blog-categories');
            const result = await response.json();
            if (result.success) setCategories(result.data);
        } catch (error) {
            console.error('Error fetching blog categories:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleContentChange = (html) => {
        const readTime = calculateReadTime(html);
        setFormData({
            ...formData,
            content: html,
            readTime: readTime,
        });
    };

    const handleImageUpload = (url) => {
        setFormData({
            ...formData,
            heroImage: url,
        });
    };

    const handleDeleteImage = async () => {
        if (!formData.heroImage) return;

        const result = await Swal.fire({
            title: 'Delete Image?',
            text: 'This will permanently delete the image from cloud storage.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch('/api/upload/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: formData.heroImage })
                });

                const data = await response.json();

                if (data.success) {
                    setFormData({ ...formData, heroImage: '', heroImageAlt: '' });
                    Swal.fire('Deleted!', 'Image has been removed.', 'success');
                } else {
                    Swal.fire('Error', 'Failed to delete image from storage.', 'error');
                }
            } catch (error) {
                console.error('Error deleting image:', error);
                Swal.fire('Error', 'Failed to delete image.', 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const publishedDate = formData.publishedAt ? new Date(formData.publishedAt) : new Date();
            const blogData = {
                slug: formData.slug,
                title: formData.title,
                excerpt: formData.excerpt,
                category: formData.category,
                author: formData.author,
                readTime: formData.readTime,
                publishedAt: publishedDate.toISOString(),
                date: formatHumanDate(publishedDate),
                heroImage: formData.heroImage,
                heroImageAlt: formData.heroImageAlt,
                content: formData.content,
                seo: {
                    title: formData.seoTitle || formData.title,
                    description: formData.seoDescription || formData.excerpt,
                    keywords: formData.keywords.split(',').map(k => k.trim()),
                },
                robotsMeta: formData.robotsMeta || null,
                schemaTemplates: Array.isArray(formData.schemaTemplates) ? formData.schemaTemplates : [],
                autogenerateImageOverride: formData.autogenerateImageOverride || 'inherit',
            };

            // apiFetch surfaces real errors when the WAF blocks the save and
            // retries via POST + method-override / base64 as needed.
            const { apiFetch } = await import('@/lib/apiClient');
            const { data: result } = await apiFetch(`/api/blog/${params.id}`, {
                method: 'PUT',
                body: blogData,
            });

            if (result.success) {
                await Swal.fire('Success!', 'Blog post updated successfully!', 'success');
                router.push('/admin/blog/list');
            } else {
                Swal.fire('Error', result.error || 'Failed to update blog post', 'error');
            }
        } catch (error) {
            console.error('Error updating blog:', error);
            Swal.fire('Error', 'Failed to update blog post', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content */}
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Edit Blog Post</h1>
                        <p className="text-gray-600">Update your blog post details</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* API & cURL panel — admin only */}
                        {user?.role === 'admin' && (
                            <ApiCurlPanel
                                resourceName="Blog Post"
                                endpoint="/api/blog"
                                itemId={params.id}
                                samplePayload={SAMPLE_BLOG_PAYLOAD}
                                updatePayload={UPDATE_BLOG_PAYLOAD}
                            />
                        )}

                        {/* Basic Information */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Blog Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream placeholder-gray-500 text-gray-900"
                                        placeholder="Enter blog title"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        URL Slug *
                                    </label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream placeholder-gray-500 text-gray-900"
                                        placeholder="blog-post-url-slug"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Excerpt *
                                    </label>
                                    <textarea
                                        name="excerpt"
                                        value={formData.excerpt}
                                        onChange={handleChange}
                                        required
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream placeholder-gray-500 text-gray-900"
                                        placeholder="Short description of the blog"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat.name}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-gray-500 mt-1">
                                        <a href="/admin/blog/categories" target="_blank" className="text-gold hover:underline">
                                            Manage Blog Categories →
                                        </a>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Read Time (Auto-calculated)
                                    </label>
                                    <input
                                        type="text"
                                        name="readTime"
                                        value={formData.readTime}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream placeholder-gray-500 text-gray-900 bg-gray-50"
                                        placeholder="Write content to calculate read time"
                                        readOnly
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Automatically calculated based on content (≈200 words/min)
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        name="author"
                                        value={formData.author}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Published Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="publishedAt"
                                        value={formData.publishedAt}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Controls homepage order — newest published date appears first.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Hero Image</h2>

                            <div className="space-y-4">
                                {formData.heroImage ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                                        <img
                                            src={formData.heroImage}
                                            alt="Hero"
                                            className="w-full h-64 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => setShowMediaPicker(true)}
                                                className="px-4 py-2 bg-white text-gray-800 rounded-lg text-sm font-semibold hover:bg-cream transition flex items-center gap-2"
                                            >
                                                <MdImage size={16} /> Change
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, heroImage: '', heroImageAlt: '' })}
                                                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition flex items-center gap-2"
                                            >
                                                <MdDelete size={16} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowMediaPicker(true)}
                                        className="w-full flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl hover:border-gold hover:bg-cream transition"
                                    >
                                        <MdImage size={32} className="text-gray-300 mb-2" />
                                        <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                                    </button>
                                )}

                                {showMediaPicker && (
                                    <MediaPicker
                                        returnMeta={true}
                                        currentUrl={formData.heroImage}
                                        onSelect={(meta) => {
                                            setFormData({ ...formData, heroImage: meta.url, heroImageAlt: meta.alt || formData.heroImageAlt });
                                            setShowMediaPicker(false);
                                        }}
                                        onClose={() => setShowMediaPicker(false)}
                                    />
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Image Alt Text
                                    </label>
                                    <input
                                        type="text"
                                        name="heroImageAlt"
                                        value={formData.heroImageAlt}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream placeholder-gray-500 text-gray-900"
                                        placeholder="Descriptive alt text for the image"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SEO Analyzer — live Rank Math-style score */}
                        <SeoAnalyzer
                            title={formData.title}
                            slug={formData.slug}
                            metaTitle={formData.seoTitle}
                            metaDescription={formData.seoDescription}
                            content={formData.content}
                            keywords={formData.keywords}
                            image={formData.heroImage}
                        />

                        {/* SEO Settings */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">SEO Settings</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        SEO Meta Title
                                    </label>
                                    <input
                                        type="text"
                                        name="seoTitle"
                                        value={formData.seoTitle}
                                        onChange={handleChange}
                                        maxLength={60}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream placeholder-gray-500 text-gray-900"
                                        placeholder="Leave empty to use blog title"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.seoTitle.length}/60 characters
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        SEO Meta Description
                                    </label>
                                    <textarea
                                        name="seoDescription"
                                        value={formData.seoDescription}
                                        onChange={handleChange}
                                        maxLength={160}
                                        rows="3"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream placeholder-gray-500 text-gray-900"
                                        placeholder="Leave empty to use excerpt"
                                    ></textarea>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formData.seoDescription.length}/160 characters
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Keywords (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        name="keywords"
                                        value={formData.keywords}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream placeholder-gray-500 text-gray-900"
                                        placeholder="SaaS, startup, AI, product development"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SEO Controls — robots meta override + schema templates */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">SEO Controls</h2>
                            <SeoEditorPanel
                                value={formData}
                                onChange={(next) => setFormData(d => ({ ...d, ...next }))}
                                kind="blog"
                            />
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Blog Content</h2>
                            <RichTextEditor
                                content={formData.content}
                                onChange={handleContentChange}
                                excludeId={params.id}
                                linkSuggestions={linkSuggestionsEnabled}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/admin/blog/list')}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 bg-gold text-white font-bold py-3 px-8 rounded-lg hover:bg-gold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <MdSave size={20} />
                                {loading ? 'Updating...' : 'Update Blog Post'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
