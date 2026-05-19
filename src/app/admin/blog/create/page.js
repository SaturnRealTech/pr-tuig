'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdSave,
    MdDelete,
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import RichTextEditor from '@/components/RichTextEditor';
import ImageUploader from '@/components/ImageUploader';
import ApiCurlPanel from '@/components/ApiCurlPanel';
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

export default function CreateBlog() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [jsonText, setJsonText] = useState('');

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
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/admin/login');
            return;
        }
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData(prev => ({ ...prev, author: parsedUser.name }));
        fetchCategories();
    }, [router]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/blog-categories');
            const result = await response.json();
            if (result.success && result.data.length > 0) {
                setCategories(result.data);
            }
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

    const generateSlug = (title) => {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setFormData({
            ...formData,
            title: title,
            slug: generateSlug(title)
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
        setFormData({ ...formData, heroImage: url });
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

    const applyJson = (raw) => {
        try {
            const json = JSON.parse(raw);
            const pick = (...keys) => { for (const k of keys) { if (json[k] !== undefined && json[k] !== null && json[k] !== '') return json[k]; } return undefined; };
            const title = pick('title') || '';
            const content = pick('content', 'body', 'html') || '';
            const keywords = pick('keywords', 'tags');
            setFormData(prev => ({
                ...prev,
                ...(title && { title }),
                slug: pick('slug') || (title ? generateSlug(title) : prev.slug),
                ...(pick('excerpt', 'description', 'summary') !== undefined && { excerpt: pick('excerpt', 'description', 'summary') }),
                ...(pick('category') !== undefined && { category: pick('category') }),
                ...(pick('author', 'authorName') !== undefined && { author: pick('author', 'authorName') }),
                ...(content && { content, readTime: pick('readTime') || calculateReadTime(content) }),
                ...(pick('seoTitle', 'metaTitle') !== undefined && { seoTitle: pick('seoTitle', 'metaTitle') || json.seo?.title || '' }),
                ...(pick('seoDescription', 'metaDescription') !== undefined && { seoDescription: pick('seoDescription', 'metaDescription') || json.seo?.description || '' }),
                ...(keywords !== undefined && { keywords: Array.isArray(keywords) ? keywords.join(', ') : keywords }),
                ...(pick('heroImage', 'image', 'thumbnail', 'featuredImage') !== undefined && { heroImage: pick('heroImage', 'image', 'thumbnail', 'featuredImage') }),
                ...(pick('heroImageAlt', 'imageAlt', 'alt') !== undefined && { heroImageAlt: pick('heroImageAlt', 'imageAlt', 'alt') }),
            }));
            setJsonText('');
            Swal.fire({ icon: 'success', title: 'JSON Imported', text: 'Matching fields have been filled.', timer: 1500, showConfirmButton: false });
        } catch {
            Swal.fire('Parse Error', 'Invalid JSON. Please check the format.', 'error');
        }
    };

    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.json')) {
            Swal.fire('Invalid File', 'Please upload a .json file.', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => applyJson(event.target.result);
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleJsonPaste = () => {
        if (!jsonText.trim()) {
            Swal.fire('Empty', 'Please paste JSON content first.', 'warning');
            return;
        }
        applyJson(jsonText);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get next blog ID
            let nextId = 1;
            try {
                const blogsRes = await fetch('/api/blog');
                const blogsData = await blogsRes.json();
                const ids = Array.isArray(blogsData.data) ? blogsData.data.map(b => b.id || 0) : [];
                nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
            } catch {
                nextId = Date.now();
            }

            const blogData = {
                id: nextId,
                slug: formData.slug,
                title: formData.title,
                excerpt: formData.excerpt,
                category: formData.category,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                }),
                author: formData.author,
                readTime: formData.readTime,
                image: formData.heroImage || '📝',
                heroImage: formData.heroImage,
                heroImageAlt: formData.heroImageAlt,
                content: formData.content,
                seo: {
                    title: formData.seoTitle || formData.title,
                    description: formData.seoDescription || formData.excerpt,
                    keywords: formData.keywords.split(',').map(k => k.trim()),
                },
            };

            const response = await fetch('/api/blog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(blogData),
            });

            const result = await response.json();

            if (result.success) {
                alert('✅ Blog post created successfully!');
                router.push('/admin/blog/list');
            } else {
                alert('❌ Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error creating blog:', error);
            alert('❌ Failed to create blog post');
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
                        <h1 className="text-3xl font-bold text-gray-800">Create New Blog Post</h1>
                        <p className="text-gray-600">Fill in the details to publish your blog</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* API & cURL panel — admin only */}
                        {user?.role === 'admin' && (
                            <ApiCurlPanel
                                resourceName="Blog Post"
                                endpoint="/api/blog"
                                itemId="<BLOG_ID>"
                                samplePayload={SAMPLE_BLOG_PAYLOAD}
                                updatePayload={UPDATE_BLOG_PAYLOAD}
                            />
                        )}

                        {/* JSON Import */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-[#b27e02]">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">Import from JSON</h2>
                            <p className="text-sm text-gray-500 mb-4">Upload any JSON file — matching fields will be auto-filled automatically.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                                {/* Key Hints */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Accepted Key Names</p>
                                    <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1.5">
                                        {[
                                            ['Title', 'title'],
                                            ['Slug', 'slug'],
                                            ['Excerpt', 'excerpt, description, summary'],
                                            ['Content', 'content, body, html'],
                                            ['Category', 'category'],
                                            ['Author', 'author, authorName'],
                                            ['Keywords', 'keywords, tags (string or array)'],
                                            ['Hero Image', 'heroImage, image, thumbnail, featuredImage'],
                                            ['Image Alt', 'heroImageAlt, imageAlt, alt'],
                                            ['SEO Title', 'seoTitle, metaTitle'],
                                            ['SEO Description', 'seoDescription, metaDescription'],
                                        ].map(([label, keys]) => (
                                            <div key={label} className="flex gap-2">
                                                <span className="font-semibold text-gray-700 w-28 shrink-0">{label}:</span>
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

                            {/* File upload row */}
                            <div className="flex items-center gap-4 mb-4">
                                <label className="inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 bg-[#b27e02] text-white font-semibold rounded-lg hover:bg-[#8a6002] transition-all text-sm">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Choose JSON File
                                    <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                                </label>
                                <span className="text-sm text-gray-400">or paste JSON below</span>
                            </div>

                            {/* Paste textarea */}
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Paste JSON</p>
                                <textarea
                                    value={jsonText}
                                    onChange={e => setJsonText(e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] font-mono text-xs text-gray-800 placeholder-gray-400 resize-y"
                                    placeholder={'{\n  "title": "My Blog Post",\n  "content": "<p>...</p>",\n  "excerpt": "Short description"\n}'}
                                />
                                <div className="flex items-center gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={handleJsonPaste}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#b27e02] text-white font-semibold rounded-lg hover:bg-[#8a6002] transition-all text-sm"
                                    >
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                        Apply JSON
                                    </button>
                                    {jsonText && (
                                        <button type="button" onClick={() => setJsonText('')} className="text-sm text-gray-400 hover:text-gray-600 transition">
                                            Clear
                                        </button>
                                    )}
                                    <span className="text-xs text-gray-400 ml-auto">or fill the form manually below</span>
                                </div>
                            </div>
                        </div>

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
                                        onChange={handleTitleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900"
                                        placeholder="blog-post-url-slug"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        Auto-generated from title, but you can edit it
                                    </p>
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0]"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat.name}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-sm text-gray-500 mt-1">
                                        <a href="/admin/blog/categories" target="_blank" className="text-[#b27e02] hover:underline">
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900 bg-gray-50"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900"
                                        placeholder="Author name"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Hero Image</h2>

                            <div className="space-y-4">
                                {formData.heroImage ? (
                                    <div>
                                        <div className="relative">
                                            <img
                                                src={formData.heroImage}
                                                alt="Hero"
                                                className="w-full h-64 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleDeleteImage}
                                                className="absolute top-2 right-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2 shadow-lg"
                                            >
                                                <MdDelete size={20} />
                                                Delete
                                            </button>
                                        </div>
                                        <div className="mt-3">
                                            <p className="text-sm font-semibold text-gray-600 mb-2">Replace Image</p>
                                            <ImageUploader
                                                folder="blog"
                                                multiple={false}
                                                onUploadSuccess={handleImageUpload}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <ImageUploader
                                        folder="blog"
                                        multiple={false}
                                        onUploadSuccess={handleImageUpload}
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900"
                                        placeholder="Descriptive alt text for the image"
                                    />
                                </div>
                            </div>
                        </div>

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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900"
                                        placeholder="Leave empty to use blog title"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900"
                                        placeholder="Leave empty to use excerpt"
                                    ></textarea>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {formData.seoDescription.length}/160 characters
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Keywords (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        name="keywords"
                                        value={formData.keywords}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] placeholder-gray-500 text-gray-900"
                                        placeholder="saas, development, ai, technology"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Content Editor */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Blog Content *</h2>
                            <RichTextEditor
                                content={formData.content}
                                onChange={handleContentChange}
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-[#b27e02] to-[#8a6002] text-white font-bold py-4 px-6 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Publishing...
                                    </>
                                ) : (
                                    <>
                                        <MdSave />
                                        Publish Blog Post
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => router.push('/admin/dashboard')}
                                className="bg-gray-200 text-gray-700 font-bold py-4 px-6 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main >
        </div >
    );
}
