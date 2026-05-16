'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MdBusiness, MdImage, MdCheck } from 'react-icons/md';
import dynamic from 'next/dynamic';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { ssr: false });
const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), { ssr: false, loading: () => <p className="text-gray-400 text-sm">Loading editor...</p> });

function ImagePicker({ label, hint, value, onChange, onAltChange, filterType = '' }) {
    const [showPicker, setShowPicker] = useState(false);

    const handleSelect = (meta) => {
        onChange(meta.url);
        if (onAltChange && meta.alt) onAltChange(meta.alt);
        setShowPicker(false);
    };

    return (
        <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
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
                    <MdImage size={28} className="text-gray-300 mb-1" />
                    <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                </button>
            )}
            {showPicker && (
                <MediaPicker
                    filterType={filterType}
                    returnMeta={true}
                    onSelect={handleSelect}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

export default function BuildersListPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [builders, setBuilders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [desktopBanner, setDesktopBanner] = useState('');
    const [desktopBannerAlt, setDesktopBannerAlt] = useState('');
    const [mobileBanner, setMobileBanner] = useState('');
    const [mobileBannerAlt, setMobileBannerAlt] = useState('');
    const [bannerTitle, setBannerTitle] = useState('');
    const [bannerDescription, setBannerDescription] = useState('');
    const [sectionTitle, setSectionTitle] = useState('');
    const [sectionContent, setSectionContent] = useState('');
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [keywords, setKeywords] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchBuilders();
        fetchPageData();
    }, [router]);

    const fetchBuilders = async () => {
        try {
            const res = await fetch('/api/builders');
            const result = await res.json();
            if (result.success) setBuilders(result.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchPageData = async () => {
        try {
            const res = await fetch('/api/builders-page');
            const result = await res.json();
            if (result.success && result.data) {
                setDesktopBanner(result.data.desktopBanner || '');
                setDesktopBannerAlt(result.data.desktopBannerAlt || '');
                setMobileBanner(result.data.mobileBanner || '');
                setMobileBannerAlt(result.data.mobileBannerAlt || '');
                setBannerTitle(result.data.bannerTitle || '');
                setBannerDescription(result.data.bannerDescription || '');
                setSectionTitle(result.data.sectionTitle || '');
                setSectionContent(result.data.sectionContent || '');
                setMetaTitle(result.data.metaTitle || '');
                setMetaDescription(result.data.metaDescription || '');
                setKeywords(result.data.keywords || '');
            }
        } catch (e) { console.error(e); }
    };

    const handleSaveBanners = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/builders-page', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ desktopBanner, desktopBannerAlt, mobileBanner, mobileBannerAlt, bannerTitle, bannerDescription, sectionTitle, sectionContent, metaTitle, metaDescription, keywords }),
            });
            const result = await res.json();
            if (result.success) {
                Swal.fire({ icon: 'success', title: 'Banners saved!', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire({ icon: 'error', title: 'Error', text: result.error });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Builders</h1>
                    </div>

                    {/* Page Hero Banners */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-1">Builders Page Hero Banner</h2>
                        <p className="text-xs text-gray-400 mb-5">This banner shows at the top of <span className="font-mono">/builders</span> page.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <ImagePicker
                                    label="Desktop Banner"
                                    hint="1920×600 recommended"
                                    value={desktopBanner}
                                    onChange={setDesktopBanner}
                                    onAltChange={setDesktopBannerAlt}
                                    filterType="hero"
                                />
                                <input
                                    type="text"
                                    value={desktopBannerAlt}
                                    onChange={e => setDesktopBannerAlt(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="Alt text for desktop banner"
                                />
                            </div>
                            <div className="space-y-2">
                                <ImagePicker
                                    label="Mobile Banner"
                                    hint="800×600 recommended"
                                    value={mobileBanner}
                                    onChange={setMobileBanner}
                                    onAltChange={setMobileBannerAlt}
                                    filterType="hero-mobile"
                                />
                                <input
                                    type="text"
                                    value={mobileBannerAlt}
                                    onChange={e => setMobileBannerAlt(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="Alt text for mobile banner"
                                />
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Title</label>
                                <input
                                    type="text"
                                    value={bannerTitle}
                                    onChange={e => setBannerTitle(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="e.g. Our Builders"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Banner Description</label>
                                <textarea
                                    value={bannerDescription}
                                    onChange={e => setBannerDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="e.g. Discover top real estate developers we work with."
                                />
                            </div>
                        </div>
                        <div className="mt-5">
                            <button onClick={handleSaveBanners} disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] text-white font-semibold rounded-lg hover:bg-[#8a6002] disabled:opacity-60 transition shadow-sm">
                                <MdCheck size={18} />
                                {saving ? 'Saving...' : 'Save Banners'}
                            </button>
                        </div>
                    </div>

                    {/* Below Hero Section */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-1">Below Hero Section</h2>
                        <p className="text-xs text-gray-400 mb-5">This content appears just below the banner with a Read More button.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                <input
                                    type="text"
                                    value={sectionTitle}
                                    onChange={e => setSectionTitle(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="e.g. About Our Builders"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                                <TipTapEditor
                                    content={sectionContent}
                                    onChange={setSectionContent}
                                />
                            </div>
                        </div>
                        <div className="mt-5">
                            <button onClick={handleSaveBanners} disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] text-white font-semibold rounded-lg hover:bg-[#8a6002] disabled:opacity-60 transition shadow-sm">
                                <MdCheck size={18} />
                                {saving ? 'Saving...' : 'Save Section'}
                            </button>
                        </div>
                    </div>

                    {/* SEO Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-1">SEO Settings</h2>
                        <p className="text-xs text-gray-400 mb-5">Controls the meta tags for the <span className="font-mono">/builders</span> page.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
                                <input
                                    type="text"
                                    value={metaTitle}
                                    onChange={e => setMetaTitle(e.target.value)}
                                    maxLength={60}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="Our Builders — Saturn RealCon"
                                />
                                <p className="text-xs text-gray-400 mt-1">{metaTitle.length}/60 characters</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                                <textarea
                                    value={metaDescription}
                                    onChange={e => setMetaDescription(e.target.value)}
                                    rows={3}
                                    maxLength={160}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="Explore all trusted builders and developers associated with Saturn RealCon."
                                />
                                <p className="text-xs text-gray-400 mt-1">{metaDescription.length}/160 characters</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={e => setKeywords(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                    placeholder="builders, real estate developers, DLF, Godrej"
                                />
                                <p className="text-xs text-gray-400 mt-1">Comma separated</p>
                            </div>
                        </div>
                        <div className="mt-5">
                            <button onClick={handleSaveBanners} disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] text-white font-semibold rounded-lg hover:bg-[#8a6002] disabled:opacity-60 transition shadow-sm">
                                <MdCheck size={18} />
                                {saving ? 'Saving...' : 'Save SEO'}
                            </button>
                        </div>
                    </div>

                    {/* Builders Table */}
                    <div>
                        <p className="text-gray-500 text-sm mb-4">{builders.length} builder{builders.length !== 1 ? 's' : ''}</p>
                        {loading ? (
                            <div className="text-center py-20 text-gray-400">Loading...</div>
                        ) : builders.length === 0 ? (
                            <div className="text-center py-20">
                                <MdBusiness size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No builders found</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="text-left px-6 py-4 font-semibold text-gray-600">#</th>
                                            <th className="text-left px-6 py-4 font-semibold text-gray-600">Logo</th>
                                            <th className="text-left px-6 py-4 font-semibold text-gray-600">Builder Name</th>
                                            <th className="text-left px-6 py-4 font-semibold text-gray-600">Slug</th>
                                            <th className="text-left px-6 py-4 font-semibold text-gray-600">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {builders.map((builder, i) => (
                                            <tr key={builder._id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                                                <td className="px-6 py-4">
                                                    {builder.logo ? (
                                                        <img src={builder.logo} alt={builder.name} className="w-10 h-10 rounded-lg object-contain border border-gray-100 p-1" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                            <MdBusiness size={20} className="text-gray-300" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-800">{builder.name}</td>
                                                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{builder.slug}</td>
                                                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{builder.description || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
