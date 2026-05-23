'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MdArrowBack, MdImage, MdAdd, MdDelete } from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), {
    ssr: false,
    loading: () => <p className="text-gray-500 text-sm">Loading editor...</p>,
});
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
                    <img src={value} alt={label} className="w-full h-40 object-cover" />
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
                    className="w-full flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl hover:border-gold hover:bg-cream transition">
                    <MdImage size={32} className="text-gray-300 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                </button>
            )}
            {showPicker && (
                <MediaPicker
                    filterType={filterType}
                    returnMeta={true}
                    currentUrl={value}
                    onSelect={handleSelect}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

export default function EditBuilderPage() {
    const router = useRouter();
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        title: '',
        content: '',
        heroImage: '',
        heroImageAlt: '',
        mobileBanner: '',
        mobileBannerAlt: '',
        logo: '',
        logoAlt: '',
        faqs: [],
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchBuilder();
    }, [router, id]);

    const fetchBuilder = async () => {
        try {
            const res = await fetch(`/api/builders/${id}`);
            const result = await res.json();
            if (result.success) {
                const b = result.data;
                setFormData({
                    name: b.name || '',
                    slug: b.slug || '',
                    description: b.description || '',
                    title: b.title || '',
                    content: b.content || '',
                    heroImage: b.heroImage || '',
                    heroImageAlt: b.heroImageAlt || '',
                    mobileBanner: b.mobileBanner || '',
                    mobileBannerAlt: b.mobileBannerAlt || '',
                    logo: b.logo || '',
                    logoAlt: b.logoAlt || '',
                    faqs: b.faqs || [],
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Not found', text: result.error });
                router.push('/admin/builders');
            }
        } catch {
            router.push('/admin/builders');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (text) =>
        text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();

    const handleNameChange = (e) => {
        const val = e.target.value;
        setFormData(prev => ({ ...prev, name: val }));
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/api/builders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const result = await res.json();
            if (result.success) {
                await Swal.fire({ icon: 'success', title: 'Builder Updated!', timer: 2000, showConfirmButton: false });
                router.push('/admin/builders');
            } else {
                await Swal.fire({ icon: 'error', title: 'Error', text: result.error });
            }
        } catch {
            await Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update builder' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!user || loading) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-8">
                        <button onClick={() => router.push('/admin/builders')} className="flex items-center gap-2 text-gray-600 hover:text-gold mb-4 transition">
                            <MdArrowBack size={20} /> Back to Builders
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">Edit Builder</h1>
                        <p className="text-gray-500 text-sm mt-1">{formData.name}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Builder Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Builder Name <span className="text-gold">*</span></label>
                                    <input type="text" value={formData.name} onChange={handleNameChange} required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="e.g. DLF, Godrej, Sobha" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Slug <span className="text-gold">*</span></label>
                                    <input type="text" name="slug" value={formData.slug} onChange={handleChange} required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="dlf, godrej, sobha" />
                                    <p className="text-xs text-gray-400 mt-1">URL: /builders/{formData.slug || 'slug'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
                                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                        placeholder="Brief description of the builder" />
                                </div>
                            </div>
                        </div>

                        {/* Banners */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Banners &amp; Logo</h3>
                            <div className="space-y-5">
                                <ImagePicker
                                    label="Desktop Banner"
                                    hint="1920×600 recommended"
                                    value={formData.heroImage}
                                    onChange={(url) => setFormData(prev => ({ ...prev, heroImage: url }))}
                                    onAltChange={(alt) => setFormData(prev => ({ ...prev, heroImageAlt: alt }))}
                                    filterType="hero"
                                />
                                <ImagePicker
                                    label="Mobile Banner"
                                    hint="800×600 recommended"
                                    value={formData.mobileBanner}
                                    onChange={(url) => setFormData(prev => ({ ...prev, mobileBanner: url }))}
                                    onAltChange={(alt) => setFormData(prev => ({ ...prev, mobileBannerAlt: alt }))}
                                    filterType="hero-mobile"
                                />
                                <ImagePicker
                                    label="Builder Logo"
                                    hint="Square PNG recommended"
                                    value={formData.logo}
                                    onChange={(url) => setFormData(prev => ({ ...prev, logo: url }))}
                                    onAltChange={(alt) => setFormData(prev => ({ ...prev, logoAlt: alt }))}
                                    filterType="logo"
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Content</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="e.g. About DLF, Our Legacy" />
                            </div>
                            <TipTapEditor
                                content={formData.content}
                                onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                            />
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
                        <div className="flex gap-4 pb-10">
                            <button type="submit" disabled={submitting}
                                className="px-8 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold disabled:opacity-60 transition shadow">
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" onClick={() => router.push('/admin/builders')}
                                className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
