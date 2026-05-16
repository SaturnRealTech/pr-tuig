'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    MdArticle, MdWork, MdPeople,
    MdImage, MdAdd, MdPalette, MdSave, MdCheck,
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';

const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { ssr: false });

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [stats, setStats] = useState({
        blogs: 0,
        projects: 0,
        contacts: 0,
    });

    const [colors, setColors] = useState({
        primaryColor: '#b27e02',
        primaryDark: '#8a6002',
        primaryLight: '#d4a030',
    });
    const [colorSaving, setColorSaving] = useState(false);
    const [colorSaved, setColorSaved] = useState(false);

    const [siteSettings, setSiteSettings] = useState({
        siteName: '', siteLogo: '', contactPhone: '', whatsappNumber: '',
        cinNumber: '', copyrightText: '', footerTagline: '', footerDescription: '', footerTrustText: '',
    });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [showLogoPicker, setShowLogoPicker] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchStats();
        fetchColors();
    }, [router]);

    const fetchColors = async () => {
        try {
            const res = await fetch('/api/settings');
            const result = await res.json();
            if (result.success) {
                setColors({
                    primaryColor: result.data.primaryColor,
                    primaryDark: result.data.primaryDark,
                    primaryLight: result.data.primaryLight,
                });
                setSiteSettings({
                    siteName: result.data.siteName || '',
                    siteLogo: result.data.siteLogo || '',
                    contactPhone: result.data.contactPhone || '',
                    whatsappNumber: result.data.whatsappNumber || '',
                    cinNumber: result.data.cinNumber || '',
                    copyrightText: result.data.copyrightText || '',
                    footerTagline: result.data.footerTagline || '',
                    footerDescription: result.data.footerDescription || '',
                    footerTrustText: result.data.footerTrustText || '',
                });
            }
        } catch (e) { console.error(e); }
    };

    const saveSettings = async () => {
        setSettingsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...colors, ...siteSettings }),
            });
            const result = await res.json();
            if (result.success) {
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2500);
            }
        } catch (e) { console.error(e); }
        finally { setSettingsSaving(false); }
    };

    const saveColors = async () => {
        setColorSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(colors),
            });
            const result = await res.json();
            if (result.success) {
                setColorSaved(true);
                setTimeout(() => setColorSaved(false), 2500);
            }
        } catch (e) { console.error(e); }
        finally { setColorSaving(false); }
    };

    const fetchStats = async () => {
        try {
            const [blogsRes, projectsRes, contactsRes] = await Promise.all([
                fetch('/api/blog'),
                fetch('/api/projects'),
                fetch('/api/contact'),
            ]);

            const blogs = await blogsRes.json();
            const projects = await projectsRes.json();
            const contacts = await contactsRes.json();

            setStats({
                blogs: blogs.data?.length || 0,
                projects: projects.data?.length || 0,
                contacts: contacts.data?.length || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
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
                        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {user.name}!</p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-600">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-semibold">Total Blogs</p>
                                    <p className="text-3xl font-bold text-gray-800">{stats.blogs}</p>
                                </div>
                                <MdArticle className="text-blue-600 text-5xl opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-600">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-semibold">Total Projects</p>
                                    <p className="text-3xl font-bold text-gray-800">{stats.projects}</p>
                                </div>
                                <MdWork className="text-green-600 text-5xl opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm font-semibold">Contact Forms</p>
                                    <p className="text-3xl font-bold text-gray-800">{stats.contacts}</p>
                                </div>
                                <MdPeople className="text-purple-600 text-5xl opacity-20" />
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <a
                                href="/admin/blog/create"
                                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-[#b27e02] hover:bg-[#fef9e7] transition group"
                            >
                                <div className="bg-[#faf0d0] p-3 rounded-lg group-hover:bg-[#b27e02] transition">
                                    <MdAdd className="text-[#b27e02] group-hover:text-white text-2xl" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Create New Blog</p>
                                    <p className="text-sm text-gray-600">Write and publish a new blog post</p>
                                </div>
                            </a>

                            <a
                                href="/admin/blog/categories"
                                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition group"
                            >
                                <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-600 transition">
                                    <MdArticle className="text-blue-600 group-hover:text-white text-2xl" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Blog Categories</p>
                                    <p className="text-sm text-gray-600">Manage blog categories</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Brand Colors */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: colors.primaryColor + '22' }}>
                                    <MdPalette size={22} style={{ color: colors.primaryColor }} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Brand Colors</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Changes apply site-wide on next page load</p>
                                </div>
                            </div>
                            <button
                                onClick={saveColors}
                                disabled={colorSaving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                                style={{ backgroundColor: colorSaved ? '#16a34a' : colors.primaryColor }}
                            >
                                {colorSaved ? <><MdCheck size={16} /> Saved!</> : colorSaving ? 'Saving…' : <><MdSave size={16} /> Save Colors</>}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {[
                                { key: 'primaryColor', label: 'Primary', hint: 'Main brand color — buttons, links, accents' },
                                { key: 'primaryDark', label: 'Primary Dark', hint: 'Hover states and gradients' },
                                { key: 'primaryLight', label: 'Primary Light', hint: 'Backgrounds and highlights' },
                            ].map(({ key, label, hint }) => (
                                <div key={key} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700">{label}</label>
                                    <div className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition">
                                        <div className="relative flex-shrink-0">
                                            <input
                                                type="color"
                                                value={colors[key]}
                                                onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={colors[key]}
                                            onChange={e => {
                                                const v = e.target.value;
                                                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColors(prev => ({ ...prev, [key]: v }));
                                            }}
                                            className="flex-1 text-sm font-mono text-gray-800 bg-transparent focus:outline-none uppercase"
                                            maxLength={7}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">{hint}</p>
                                </div>
                            ))}
                        </div>

                        {/* Live preview strip */}
                        <div className="mt-6 rounded-xl overflow-hidden border border-gray-100">
                            <div className="h-3" style={{ background: `linear-gradient(to right, ${colors.primaryColor}, ${colors.primaryDark})` }} />
                            <div className="p-4 flex flex-wrap items-center gap-3 bg-gray-50">
                                <button className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ backgroundColor: colors.primaryColor }}>Button</button>
                                <button className="px-4 py-2 text-sm font-semibold rounded-lg border-2" style={{ borderColor: colors.primaryColor, color: colors.primaryColor }}>Outline</button>
                                <span className="text-sm font-semibold underline" style={{ color: colors.primaryColor }}>Link text</span>
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: colors.primaryColor }}>Badge</span>
                                <div className="flex items-center gap-1 ml-auto">
                                    {[colors.primaryLight, colors.primaryColor, colors.primaryDark].map((c, i) => (
                                        <div key={i} className="w-6 h-6 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Site Identity */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Site Identity</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Logo takes priority — if set, name is hidden in the header</p>
                            </div>
                            <button
                                onClick={saveSettings}
                                disabled={settingsSaving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                                style={{ backgroundColor: settingsSaved ? '#16a34a' : colors.primaryColor }}
                            >
                                {settingsSaved ? <><MdCheck size={16} /> Saved!</> : settingsSaving ? 'Saving…' : <><MdSave size={16} /> Save</>}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Site Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Site / Project Name</label>
                                <input
                                    type="text"
                                    value={siteSettings.siteName}
                                    onChange={e => setSiteSettings(p => ({ ...p, siteName: e.target.value }))}
                                    placeholder="e.g. Saturn RealCon"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Shown in header and footer when no logo is set</p>
                            </div>
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Site Logo</label>
                                {siteSettings.siteLogo ? (
                                    <div className="flex items-center gap-3">
                                        <img src={siteSettings.siteLogo} alt="Logo" className="h-12 w-auto object-contain rounded border border-gray-200 bg-gray-50 p-1" />
                                        <div className="flex flex-col gap-1">
                                            <button type="button" onClick={() => setShowLogoPicker(true)} className="text-xs text-[#b27e02] underline">Change</button>
                                            <button type="button" onClick={() => setSiteSettings(p => ({ ...p, siteLogo: '' }))} className="text-xs text-red-500 underline">Remove</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowLogoPicker(true)}
                                        className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-[#b27e02] hover:text-[#b27e02] transition w-full"
                                    >
                                        <MdImage size={18} /> Upload Logo from Media Library
                                    </button>
                                )}
                                <p className="text-xs text-gray-400 mt-1">If set, shown in header instead of text name</p>
                            </div>
                        </div>
                        {showLogoPicker && (
                            <MediaPicker
                                onSelect={url => { setSiteSettings(p => ({ ...p, siteLogo: url })); setShowLogoPicker(false); }}
                                onClose={() => setShowLogoPicker(false)}
                            />
                        )}
                    </div>

                    {/* Footer Content */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Footer Content</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Tagline, description, copyright and CIN shown in the footer</p>
                            </div>
                            <button
                                onClick={saveSettings}
                                disabled={settingsSaving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                                style={{ backgroundColor: settingsSaved ? '#16a34a' : colors.primaryColor }}
                            >
                                {settingsSaved ? <><MdCheck size={16} /> Saved!</> : settingsSaving ? 'Saving…' : <><MdSave size={16} /> Save</>}
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Tagline</label>
                                <input
                                    type="text"
                                    value={siteSettings.footerTagline}
                                    onChange={e => setSiteSettings(p => ({ ...p, footerTagline: e.target.value }))}
                                    placeholder="Your Trusted Real Estate Partner"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Description</label>
                                <textarea
                                    rows={2}
                                    value={siteSettings.footerDescription}
                                    onChange={e => setSiteSettings(p => ({ ...p, footerDescription: e.target.value }))}
                                    placeholder="Buy, sell, and rent verified properties across India. Expert agents. Zero hassle."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Trust Text</label>
                                <input
                                    type="text"
                                    value={siteSettings.footerTrustText}
                                    onChange={e => setSiteSettings(p => ({ ...p, footerTrustText: e.target.value }))}
                                    placeholder="Trusted by 1000+ families across India"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Copyright Text</label>
                                    <input
                                        type="text"
                                        value={siteSettings.copyrightText}
                                        onChange={e => setSiteSettings(p => ({ ...p, copyrightText: e.target.value }))}
                                        placeholder={`© ${new Date().getFullYear()} Saturn RealCon — A product by.`}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate from site name</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">CIN Number</label>
                                    <input
                                        type="text"
                                        value={siteSettings.cinNumber}
                                        onChange={e => setSiteSettings(p => ({ ...p, cinNumber: e.target.value }))}
                                        placeholder="e.g. U74999DL2020PTC123456"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Leave blank to hide the CIN line</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Contact Info</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Phone used for calls in footer · WhatsApp used for the floating chat button</p>
                            </div>
                            <button
                                onClick={saveSettings}
                                disabled={settingsSaving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                                style={{ backgroundColor: settingsSaved ? '#16a34a' : colors.primaryColor }}
                            >
                                {settingsSaved ? <><MdCheck size={16} /> Saved!</> : settingsSaving ? 'Saving…' : <><MdSave size={16} /> Save</>}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">📞 Contact / Calling Number</label>
                                <input
                                    type="tel"
                                    value={siteSettings.contactPhone}
                                    onChange={e => setSiteSettings(p => ({ ...p, contactPhone: e.target.value }))}
                                    placeholder="+91 98765 43210"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Shown as a clickable call link in the footer</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">💬 WhatsApp Number</label>
                                <input
                                    type="tel"
                                    value={siteSettings.whatsappNumber}
                                    onChange={e => setSiteSettings(p => ({ ...p, whatsappNumber: e.target.value }))}
                                    placeholder="919876543210 (with country code, no +)"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Used for the floating WhatsApp button — include country code, no spaces or +</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
