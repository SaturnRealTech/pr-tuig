'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSettings } from '@/lib/SettingsContext';
import {
    MdDashboard, MdArticle, MdWork, MdPeople, MdLogout,
    MdMenu, MdClose, MdCategory, MdFormatQuote, MdImage, MdHome, MdPrivacyTip, MdGavel, MdCookie, MdBusiness, MdContactMail, MdInbox,
    MdSwapHoriz, MdShowChart, MdAdminPanelSettings, MdImageAspectRatio, MdSearch, MdHistory,
} from 'react-icons/md';

const NAV_ITEMS = [
    { href: '/admin/dashboard', icon: MdDashboard, label: 'Dashboard' },
    // { href: '/admin/homepage', icon: MdHome, label: 'Homepage' },
    { href: '/admin/blog/list', icon: MdArticle, label: 'All Blogs' },
    { href: '/admin/blog/categories', icon: MdCategory, label: 'Blog Categories' },
    // { href: '/admin/categories', icon: MdCategory, label: 'Categories' },
    { href: '/admin/projects/list', icon: MdWork, label: 'Pages' },
    // { href: '/admin/builders', icon: MdBusiness, label: 'Builders' },
    // { href: '/admin/testimonials', icon: MdFormatQuote, label: 'Testimonials' },
    { href: '/admin/media', icon: MdImage, label: 'Media' },
    { href: '/admin/leads', icon: MdInbox, label: 'Leads' },
    { href: '/admin/seo', icon: MdSearch, label: 'SEO' },
    // { href: '/admin/careers', icon: MdWork, label: 'Careers' },
    // { href: '/admin/applications', icon: MdPeople, label: 'Applications' },
    // { href: '/admin/contacts', icon: MdContactMail, label: 'Contacts' },
    // { href: '/admin/privacy', icon: MdPrivacyTip, label: 'Privacy Policy' },
    // { href: '/admin/terms', icon: MdGavel, label: 'Terms & Conditions' },
    // { href: '/admin/cookies', icon: MdCookie, label: 'Cookie Policy' },
];

export default function AdminSidebar({ user, sidebarOpen, setSidebarOpen }) {
    const { siteName } = useSettings();
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { }
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/admin/login');
    };

    const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

    return (
        <aside data-admin-shell className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-gold to-gold text-white transition-all duration-300 fixed h-full z-20 overflow-y-auto`}>
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    {sidebarOpen && (
                        <div className="text-2xl font-bold truncate">
                            <span className="text-white">{siteName || 'Admin'}</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(v => !v)}
                        className="text-white hover:bg-gold p-2 rounded-lg flex-shrink-0"
                    >
                        {sidebarOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
                    </button>
                </div>

                <nav className="space-y-2">
                    {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
                        <a
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 p-3 rounded-lg transition ${isActive(href) ? 'bg-gold' : 'hover:bg-gold'
                                }`}
                        >
                            <Icon size={24} />
                            {sidebarOpen && <span>{label}</span>}
                        </a>
                    ))}

                    {user?.role === 'admin' && (
                        <a
                            href="/admin/users"
                            className={`flex items-center gap-3 p-3 rounded-lg transition ${isActive('/admin/users') ? 'bg-gold' : 'hover:bg-gold'
                                }`}
                        >
                            <MdPeople size={24} />
                            {sidebarOpen && <span>Users</span>}
                        </a>
                    )}

                    {user?.role === 'admin' && (
                        <a
                            href="/admin/activity"
                            className={`flex items-center gap-3 p-3 rounded-lg transition ${isActive('/admin/activity') ? 'bg-gold' : 'hover:bg-gold'
                                }`}
                        >
                            <MdHistory size={24} />
                            {sidebarOpen && <span>Activity Log</span>}
                        </a>
                    )}
                </nav>

                <div className="mt-8 pb-2">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gold transition w-full"
                    >
                        <MdLogout size={24} />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
