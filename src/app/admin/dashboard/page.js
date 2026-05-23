'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    MdArticle, MdWork, MdPeople,
    MdImage, MdAdd, MdPalette, MdSave, MdCheck,
    MdLock, MdVisibility, MdVisibilityOff,
} from 'react-icons/md';
import Swal from 'sweetalert2';
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
        headerScrollBg: '#ffffff',
        // Site-wide theme palette (mirrors globals.css :root). Changing any of
        // these here re-themes the whole site at request time via layout.js.
        themeBackground: '#f7f5ef',
        themeForeground: '#14241b',
        themeLeaf: '#1f5d3a',
        themeMoss: '#244a36',
        themeForest: '#0f2a1e',
        themeBark: '#3a2a1c',
        themeGold: '#c8a96a',
        themeCream: '#f1ead7',
    });
    const [colorSaving, setColorSaving] = useState(false);
    const [colorSaved, setColorSaved] = useState(false);

    const [siteSettings, setSiteSettings] = useState({
        siteName: '', siteLogo: '', favicon: '', contactPhone: '', whatsappNumber: '',
        cinNumber: '', copyrightText: '', footerTagline: '', footerDescription: '', footerTrustText: '',
        indexNowKey: '',
    });

    const [mailSettings, setMailSettings] = useState({
        smtpHost: '', smtpPort: '465', smtpSecure: true,
        smtpUser: '', smtpPass: '',
        mailFromName: '', mailFrom: '', mailTo: '', mailSubject: '',
    });
    const [mailSaving, setMailSaving] = useState(false);
    const [mailSaved, setMailSaved] = useState(false);
    const [showSmtpPass, setShowSmtpPass] = useState(false);
    const [leadsPasswordConfigured, setLeadsPasswordConfigured] = useState(false);
    const [leadsPassword, setLeadsPassword] = useState('');
    const [leadsPasswordConfirm, setLeadsPasswordConfirm] = useState('');
    const [showLeadsPassword, setShowLeadsPassword] = useState(false);
    const [leadsSaving, setLeadsSaving] = useState(false);
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [showLogoPicker, setShowLogoPicker] = useState(false);
    const [showFaviconPicker, setShowFaviconPicker] = useState(false);

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
                    headerScrollBg: result.data.headerScrollBg || '#ffffff',
                    themeBackground: result.data.themeBackground || '#f7f5ef',
                    themeForeground: result.data.themeForeground || '#14241b',
                    themeLeaf: result.data.themeLeaf || '#1f5d3a',
                    themeMoss: result.data.themeMoss || '#244a36',
                    themeForest: result.data.themeForest || '#0f2a1e',
                    themeBark: result.data.themeBark || '#3a2a1c',
                    themeGold: result.data.themeGold || '#c8a96a',
                    themeCream: result.data.themeCream || '#f1ead7',
                });
                setSiteSettings({
                    siteName: result.data.siteName || '',
                    siteLogo: result.data.siteLogo || '',
                    favicon: result.data.favicon || '',
                    contactPhone: result.data.contactPhone || '',
                    whatsappNumber: result.data.whatsappNumber || '',
                    cinNumber: result.data.cinNumber || '',
                    copyrightText: result.data.copyrightText || '',
                    footerTagline: result.data.footerTagline || '',
                    footerDescription: result.data.footerDescription || '',
                    footerTrustText: result.data.footerTrustText || '',
                    indexNowKey: result.data.indexNowKey || '',
                });
                setLeadsPasswordConfigured(!!result.data.leadsPasswordConfigured);
                setMailSettings({
                    smtpHost: result.data.smtpHost || '',
                    smtpPort: result.data.smtpPort || '465',
                    smtpSecure: result.data.smtpSecure !== false,
                    smtpUser: result.data.smtpUser || '',
                    smtpPass: result.data.smtpPass || '',
                    mailFromName: result.data.mailFromName || '',
                    mailFrom: result.data.mailFrom || '',
                    mailTo: result.data.mailTo || '',
                    mailSubject: result.data.mailSubject || '',
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

    const saveLeadsPassword = async (clear = false) => {
        if (!clear) {
            if (!leadsPassword || leadsPassword.length < 6) {
                Swal.fire({ icon: 'warning', title: 'Password too short', text: 'Use at least 6 characters.' });
                return;
            }
            if (leadsPassword !== leadsPasswordConfirm) {
                Swal.fire({ icon: 'warning', title: 'Passwords don’t match', text: 'Re-enter the same password in both fields.' });
                return;
            }
        }
        setLeadsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadsPassword: clear ? null : leadsPassword }),
            });
            const result = await res.json();
            if (result.success) {
                setLeadsPassword('');
                setLeadsPasswordConfirm('');
                setLeadsPasswordConfigured(!clear);
                Swal.fire({
                    icon: 'success',
                    title: clear ? 'Leads password removed' : 'Leads password saved',
                    timer: 1500, showConfirmButton: false,
                });
            } else {
                Swal.fire('Error', result.error || 'Failed to save', 'error');
            }
        } catch (e) { Swal.fire('Error', e.message, 'error'); }
        finally { setLeadsSaving(false); }
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

    const saveMailSettings = async () => {
        setMailSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...colors, ...siteSettings, ...mailSettings }),
            });
            const result = await res.json();
            if (result.success) {
                setMailSaved(true);
                setTimeout(() => setMailSaved(false), 2500);
            }
        } catch (e) { console.error(e); }
        finally { setMailSaving(false); }
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
                                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-gold hover:bg-cream transition group"
                            >
                                <div className="bg-cream p-3 rounded-lg group-hover:bg-gold transition">
                                    <MdAdd className="text-gold group-hover:text-white text-2xl" />
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { key: 'primaryColor', label: 'Primary', hint: 'Main brand color — buttons, links, accents' },
                                { key: 'primaryDark', label: 'Primary Dark', hint: 'Hover states and gradients' },
                                { key: 'primaryLight', label: 'Primary Light', hint: 'Backgrounds and highlights' },
                                { key: 'headerScrollBg', label: 'Header Scroll BG', hint: 'Navbar background color when page is scrolled' },
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

                        {/* Theme Palette — drives the whole site (homepage, footer, admin) */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <div className="flex items-baseline justify-between mb-1">
                                <h4 className="text-base font-bold text-gray-800">Theme Palette</h4>
                                <span className="text-[11px] text-gray-400 uppercase tracking-wider">Site-wide</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-5">Changes here re-theme the homepage, the project pages, the footer and the admin chrome. They override the defaults in <code className="bg-gray-100 px-1 py-0.5 rounded">globals.css</code>.</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                {[
                                    { key: 'themeBackground', label: 'Background', hint: 'Page background (--background)' },
                                    { key: 'themeForeground', label: 'Foreground', hint: 'Body text colour (--foreground)' },
                                    { key: 'themeLeaf', label: 'Leaf', hint: 'Secondary green (--leaf)' },
                                    { key: 'themeMoss', label: 'Moss', hint: 'Primary dark green (--moss)' },
                                    { key: 'themeForest', label: 'Forest', hint: 'Deepest green (--forest)' },
                                    { key: 'themeBark', label: 'Bark', hint: 'Brown accent (--bark)' },
                                    { key: 'themeGold', label: 'Gold', hint: 'Gold accent (--gold)' },
                                    { key: 'themeCream', label: 'Cream', hint: 'Soft tint (--cream)' },
                                ].map(({ key, label, hint }) => (
                                    <div key={key} className="space-y-1.5">
                                        <label className="block text-xs font-semibold text-gray-700">{label}</label>
                                        <div className="flex items-center gap-2 p-2 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition">
                                            <input
                                                type="color"
                                                value={colors[key]}
                                                onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent flex-shrink-0"
                                            />
                                            <input
                                                type="text"
                                                value={colors[key]}
                                                onChange={e => {
                                                    const v = e.target.value;
                                                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColors(prev => ({ ...prev, [key]: v }));
                                                }}
                                                className="flex-1 min-w-0 text-xs font-mono text-gray-800 bg-transparent focus:outline-none uppercase"
                                                maxLength={7}
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 leading-snug">{hint}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Live preview */}
                            <div className="mt-5 rounded-xl overflow-hidden border" style={{ borderColor: colors.themeMoss + '33' }}>
                                <div style={{ backgroundColor: colors.themeBackground, color: colors.themeForeground }} className="p-5">
                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: colors.themeGold }}>OVERVIEW</span>
                                    </div>
                                    <h3 className="font-display text-2xl" style={{ color: colors.themeMoss }}>About the Project</h3>
                                    <p className="mt-2 text-sm" style={{ color: colors.themeForeground }}>Sample body text rendered with the theme palette to preview the changes.</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: colors.themeGold, color: colors.themeMoss }}>Gold pill</span>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ backgroundColor: colors.themeCream, color: colors.themeMoss, borderColor: colors.themeMoss + '22' }}>Cream pill</span>
                                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: colors.themeForest, color: colors.themeCream }}>Forest pill</span>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: colors.themeMoss, color: colors.themeCream }} className="px-5 py-3 text-xs">
                                    Footer surface — uses --moss / --cream
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm"
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
                                            <button type="button" onClick={() => setShowLogoPicker(true)} className="text-xs text-gold underline">Change</button>
                                            <button type="button" onClick={() => setSiteSettings(p => ({ ...p, siteLogo: '' }))} className="text-xs text-red-500 underline">Remove</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowLogoPicker(true)}
                                        className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gold hover:text-gold transition w-full"
                                    >
                                        <MdImage size={18} /> Upload Logo from Media Library
                                    </button>
                                )}
                                <p className="text-xs text-gray-400 mt-1">If set, shown in header instead of text name</p>
                            </div>
                            {/* Favicon */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Favicon</label>
                                {siteSettings.favicon ? (
                                    <div className="flex items-center gap-3">
                                        <img src={siteSettings.favicon} alt="Favicon" className="h-10 w-10 object-contain rounded border border-gray-200 bg-gray-50 p-1" />
                                        <div className="flex flex-col gap-1">
                                            <button type="button" onClick={() => setShowFaviconPicker(true)} className="text-xs text-gold underline">Change</button>
                                            <button type="button" onClick={() => setSiteSettings(p => ({ ...p, favicon: '' }))} className="text-xs text-red-500 underline">Remove</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setShowFaviconPicker(true)}
                                        className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gold hover:text-gold transition w-full"
                                    >
                                        <MdImage size={18} /> Upload Favicon from Media Library
                                    </button>
                                )}
                                <p className="text-xs text-gray-400 mt-1">Square 32×32 or 64×64 (.ico, .png, .svg). Used as the browser-tab icon.</p>
                            </div>
                        </div>
                        {showLogoPicker && (
                            <MediaPicker
                                onSelect={url => { setSiteSettings(p => ({ ...p, siteLogo: url })); setShowLogoPicker(false); }}
                                onClose={() => setShowLogoPicker(false)}
                            />
                        )}
                        {showFaviconPicker && (
                            <MediaPicker
                                onSelect={url => { setSiteSettings(p => ({ ...p, favicon: url })); setShowFaviconPicker(false); }}
                                onClose={() => setShowFaviconPicker(false)}
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Description</label>
                                <textarea
                                    rows={2}
                                    value={siteSettings.footerDescription}
                                    onChange={e => setSiteSettings(p => ({ ...p, footerDescription: e.target.value }))}
                                    placeholder="Buy, sell, and rent verified properties across India. Expert agents. Zero hassle."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Trust Text</label>
                                <input
                                    type="text"
                                    value={siteSettings.footerTrustText}
                                    onChange={e => setSiteSettings(p => ({ ...p, footerTrustText: e.target.value }))}
                                    placeholder="Trusted by 1000+ families across India"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm"
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Leave blank to hide the CIN line</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">IndexNow Key</label>
                                    <input
                                        type="text"
                                        value={siteSettings.indexNowKey}
                                        onChange={e => setSiteSettings(p => ({ ...p, indexNowKey: e.target.value.trim() }))}
                                        placeholder="32-character key (generate at https://www.bing.com/indexnow)"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm font-mono"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        Used to instantly notify Bing, Yandex (and Google via shared infra) when you publish. Verification file is auto-served at <code className="bg-gray-100 px-1 py-0.5 rounded">{`/indexnow/<key>.txt`}</code>.
                                    </p>
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm"
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
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm"
                                />
                                <p className="text-xs text-gray-400 mt-1">Used for the floating WhatsApp button — include country code, no spaces or +</p>
                            </div>
                        </div>
                    </div>
                    {/* Leads Vault Password */}
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
                        <div className="flex items-start justify-between mb-4 gap-4">
                            <div className="flex items-start gap-3">
                                <MdLock size={22} className="text-amber-600 mt-0.5" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Leads Vault Password</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Extra password gate on <code className="px-1 py-0.5 rounded bg-gray-100 text-[11px]">/admin/leads</code>.
                                        The leads list stays sealed until this password is typed.
                                        Once unlocked, responses are AES-256-GCM encrypted end-to-end so the Network tab only ever shows ciphertext.
                                    </p>
                                    {leadsPasswordConfigured ? (
                                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                                            <MdCheck size={12} /> Password configured
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-bold">
                                            Not configured — leads are unprotected
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    {leadsPasswordConfigured ? 'New password' : 'Password'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showLeadsPassword ? 'text' : 'password'}
                                        value={leadsPassword}
                                        onChange={e => setLeadsPassword(e.target.value)}
                                        placeholder="At least 6 characters"
                                        autoComplete="new-password"
                                        className="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500"
                                    />
                                    <button type="button" onClick={() => setShowLeadsPassword(s => !s)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                                        aria-label="Toggle password visibility">
                                        {showLeadsPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm</label>
                                <input
                                    type={showLeadsPassword ? 'text' : 'password'}
                                    value={leadsPasswordConfirm}
                                    onChange={e => setLeadsPasswordConfirm(e.target.value)}
                                    placeholder="Re-type the same password"
                                    autoComplete="new-password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                            <p className="text-[11px] text-gray-500">
                                Store this somewhere safe — there&apos;s no recovery path; resetting requires editing the database.
                            </p>
                            <div className="flex items-center gap-2">
                                {leadsPasswordConfigured ? (
                                    <button type="button" onClick={() => saveLeadsPassword(true)} disabled={leadsSaving}
                                        className="px-3 py-2 border border-red-300 text-red-700 rounded-lg text-xs font-bold hover:bg-red-50 disabled:opacity-50">
                                        Remove password
                                    </button>
                                ) : null}
                                <button type="button" onClick={() => saveLeadsPassword(false)} disabled={leadsSaving}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50">
                                    <MdSave size={16} /> {leadsSaving ? 'Saving…' : (leadsPasswordConfigured ? 'Update password' : 'Set password')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mail Settings */}
                    {/* <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Mail Settings</h2>
                                <p className="text-xs text-gray-400 mt-0.5">SMTP config used to send contact form email notifications</p>
                            </div>
                            <button
                                onClick={saveMailSettings}
                                disabled={mailSaving}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50"
                                style={{ backgroundColor: mailSaved ? '#16a34a' : colors.primaryColor }}
                            >
                                {mailSaved ? <><MdCheck size={16} /> Saved!</> : mailSaving ? 'Saving…' : <><MdSave size={16} /> Save</>}
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">SMTP Server</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Host</label>
                                        <input type="text" value={mailSettings.smtpHost}
                                            onChange={e => setMailSettings(p => ({ ...p, smtpHost: e.target.value }))}
                                            placeholder="smtppro.zoho.in"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Port</label>
                                        <input type="text" value={mailSettings.smtpPort}
                                            onChange={e => setMailSettings(p => ({ ...p, smtpPort: e.target.value }))}
                                            placeholder="465"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm" />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 mt-3 cursor-pointer select-none w-fit">
                                    <input type="checkbox" checked={mailSettings.smtpSecure}
                                        onChange={e => setMailSettings(p => ({ ...p, smtpSecure: e.target.checked }))}
                                        className="w-4 h-4 accent-gold" />
                                    <span className="text-sm text-gray-700 font-medium">Use SSL / Secure connection</span>
                                </label>
                            </div>


                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Authentication</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Username / Email</label>
                                        <input type="email" value={mailSettings.smtpUser}
                                            onChange={e => setMailSettings(p => ({ ...p, smtpUser: e.target.value }))}
                                            placeholder="you@yourdomain.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">SMTP Password</label>
                                        <div className="relative">
                                            <input
                                                type={showSmtpPass ? 'text' : 'password'}
                                                value={mailSettings.smtpPass}
                                                onChange={e => setMailSettings(p => ({ ...p, smtpPass: e.target.value }))}
                                                placeholder="••••••••••"
                                                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm"
                                            />
                                            <button type="button" onClick={() => setShowSmtpPass(v => !v)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-semibold">
                                                {showSmtpPass ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Email Addresses</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">From Name</label>
                                        <input type="text" value={mailSettings.mailFromName}
                                            onChange={e => setMailSettings(p => ({ ...p, mailFromName: e.target.value }))}
                                            placeholder="e.g. Saturn RealCon"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">From Email</label>
                                        <input type="email" value={mailSettings.mailFrom}
                                            onChange={e => setMailSettings(p => ({ ...p, mailFrom: e.target.value }))}
                                            placeholder="noreply@yourdomain.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm" />
                                        <p className="text-xs text-gray-400 mt-1">Leave blank to use SMTP username</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">To Email (Recipient)</label>
                                        <input type="email" value={mailSettings.mailTo}
                                            onChange={e => setMailSettings(p => ({ ...p, mailTo: e.target.value }))}
                                            placeholder="your@email.com"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm" />
                                        <p className="text-xs text-gray-400 mt-1">Where contact form submissions are sent</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Subject Prefix</label>
                                        <input type="text" value={mailSettings.mailSubject}
                                            onChange={e => setMailSettings(p => ({ ...p, mailSubject: e.target.value }))}
                                            placeholder="e.g. Saturn RealCon"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm" />
                                        <p className="text-xs text-gray-400 mt-1">Subject will be: &ldquo;[Prefix]: New Inquiry from Name&rdquo;</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div> */}

                </div>
            </main >
        </div >
    );
}
