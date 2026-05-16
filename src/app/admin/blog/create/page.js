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
import Swal from 'sweetalert2';
import { calculateReadTime } from '@/utils/readTime';

export default function CreateBlog() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get next blog ID
            const blogsRes = await fetch('/api/blog');
            const blogsData = await blogsRes.json();
            const nextId = blogsData.data.length > 0
                ? Math.max(...blogsData.data.map(b => b.id || 0)) + 1
                : 1;

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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] bg-gray-50"
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Hero Image */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Hero Image</h2>

                            <div className="space-y-4">
                                {formData.heroImage ? (
                                    <div className="relative">
                                        <img
                                            src={formData.heroImage}
                                            alt="Hero"
                                            className="w-full h-64 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleDeleteImage}
                                            className="absolute top-2 right-2 bg-[#b27e02] text-white px-4 py-2 rounded-lg hover:bg-[#8a6002] flex items-center gap-2 shadow-lg"
                                        >
                                            <MdDelete size={20} />
                                            Delete Image
                                        </button>
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
