'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    MdSwapHoriz,
    MdImageAspectRatio,
    MdShowChart,
    MdAdminPanelSettings,
    MdArrowForward,
    MdPlace,
    MdLink,
    MdBolt,
    MdMap,
    MdVideoLibrary,
    MdTitle,
    MdSchema,
    MdReportProblem,
    MdVerifiedUser,
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';

const CARDS = [
    {
        href: '/admin/seo/titles-meta',
        title: 'Titles & Meta',
        description: 'Per-post-type title and description templates with variables (%title%, %excerpt%, %sitename%…), schema defaults and editor controls.',
        icon: MdTitle,
        tint: 'bg-slate-50 text-slate-700',
    },
    {
        href: '/admin/seo/schema-templates',
        title: 'Schema Templates',
        description: 'Reusable FAQ / How-To / Recipe / Event / Product / Review structured data, attached to specific posts or all of them.',
        icon: MdSchema,
        tint: 'bg-violet-50 text-violet-700',
    },
    {
        href: '/admin/seo/redirections',
        title: 'Redirections',
        description: 'Manage 301 / 302 redirects without redeploying. Hits are counted automatically.',
        icon: MdSwapHoriz,
        tint: 'bg-blue-50 text-blue-700',
    },
    {
        href: '/admin/seo/404-monitor',
        title: '404 Monitor',
        description: 'Every broken inbound URL is captured here. One click turns any 404 into a redirect.',
        icon: MdReportProblem,
        tint: 'bg-orange-50 text-orange-700',
    },
    {
        href: '/admin/seo/image-seo',
        title: 'Image SEO',
        description: 'Auto-fill ALT / TITLE / caption on rendered images, control casing, run find-and-replace.',
        icon: MdImageAspectRatio,
        tint: 'bg-amber-50 text-amber-700',
    },
    {
        href: '/admin/seo/local-seo',
        title: 'Local SEO',
        description: 'NAP details, business hours and geo coordinates — emitted as schema.org on every page.',
        icon: MdPlace,
        tint: 'bg-rose-50 text-rose-700',
    },
    {
        href: '/admin/seo/links',
        title: 'Link Counter',
        description: 'Count internal and external links across every post, find pages with no links.',
        icon: MdLink,
        tint: 'bg-cyan-50 text-cyan-700',
    },
    {
        href: '/admin/seo/instant-indexing',
        title: 'Instant Indexing',
        description: 'IndexNow key, manual URL submission and auto-ping on publish.',
        icon: MdBolt,
        tint: 'bg-indigo-50 text-indigo-700',
    },
    {
        href: '/admin/seo/webmaster-tools',
        title: 'Webmaster Tools',
        description: 'Verification IDs for Google, Bing, Yandex, Pinterest, Baidu, Norton — plus custom <meta> tags.',
        icon: MdVerifiedUser,
        tint: 'bg-lime-50 text-lime-700',
    },
    {
        href: '/admin/seo/sitemap',
        title: 'Sitemap',
        description: 'Toggle which pages, blog posts and categories appear in your XML sitemap.',
        icon: MdMap,
        tint: 'bg-teal-50 text-teal-700',
    },
    {
        href: '/admin/seo/video-sitemap',
        title: 'Video Sitemap',
        description: 'Auto-generated from YouTube / Vimeo embeds. Configure post types and YouTube API enrichment.',
        icon: MdVideoLibrary,
        tint: 'bg-pink-50 text-pink-700',
    },
    {
        href: '/admin/analytics',
        title: 'Analytics',
        description: 'Self-hosted page-view analytics: top pages, referrers, devices and daily traffic.',
        icon: MdShowChart,
        tint: 'bg-emerald-50 text-emerald-700',
    },
    {
        href: '/admin/roles',
        title: 'Role Manager',
        description: 'Configure what each role (admin / editor / viewer) can view, create, edit or delete.',
        icon: MdAdminPanelSettings,
        tint: 'bg-purple-50 text-purple-700',
    },
];

export default function SeoHubPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-6xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">SEO</h1>
                        <p className="text-sm text-gray-500 mt-1">Everything you need to make the site discoverable — Rank Math-style.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {CARDS.map(card => {
                            const Icon = card.icon;
                            const cls = "group bg-white rounded-2xl shadow-md hover:shadow-lg border border-gray-100 hover:border-gold/40 p-6 transition flex items-start gap-4";
                            const inner = (
                                <>
                                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${card.tint} flex items-center justify-center`}>
                                        <Icon size={26} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-lg font-bold text-gray-800 group-hover:text-gold transition-colors">{card.title}</h3>
                                            <MdArrowForward className="text-gray-300 group-hover:text-gold group-hover:translate-x-1 transition" size={20} />
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 leading-relaxed">{card.description}</p>
                                    </div>
                                </>
                            );
                            if (card.external) {
                                return (
                                    <a key={card.href} href={card.href} target="_blank" rel="noopener noreferrer" className={cls}>
                                        {inner}
                                    </a>
                                );
                            }
                            return (
                                <Link key={card.href} href={card.href} className={cls}>
                                    {inner}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
