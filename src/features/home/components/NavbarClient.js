'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/lib/SettingsContext';

export default function NavbarClient() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [projects, setProjects] = useState([]);
    const { siteName, siteLogo, contactPhone, headerScrollBg } = useSettings();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        fetch('/api/projects?status=published')
            .then(r => r.json())
            .then(d => {
                if (d.success && Array.isArray(d.data)) {
                    const nonHome = d.data.filter(p => !p.isHomePage);
                    setProjects(nonHome.map(p => ({ label: p.title, href: `/${p.slug}` })));
                }
            })
            .catch(() => {});
    }, []);

    const linkClass = `relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 group ${
        scrolled
            ? 'text-gray-700 hover:text-[#b27e02] hover:bg-[#b27e02]/8'
            : 'text-white/90 hover:text-white hover:bg-white/10'
    }`;

    const underlineClass = `absolute bottom-1 left-3 right-3 h-0.5 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${
        scrolled ? 'bg-[#b27e02]' : 'bg-white'
    }`;

    const allLinks = [{ href: '/', label: 'Home' }, ...projects];

    return (
        <>
            <nav
                className={`fixed w-full top-0 left-0 z-50 transition-all duration-500 ${
                    scrolled
                        ? 'backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.12)] border-b border-gray-100'
                        : 'bg-gradient-to-b from-black/50 to-transparent'
                }`}
                style={scrolled ? { backgroundColor: headerScrollBg || '#ffffff' } : undefined}
            >
                <div className="w-[90%] mx-auto py-3">
                    <div className="flex items-center gap-6">

                        {/* Logo */}
                        <a href="/" className="flex items-center gap-2 group flex-shrink-0">
                            {siteLogo ? (
                                <img
                                    src={siteLogo}
                                    alt={siteName || 'Logo'}
                                    className="h-8 md:h-10 w-auto max-w-[140px] md:max-w-[200px] object-contain"
                                />
                            ) : (
                                <>
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-lg transition-all duration-300 ${
                                        scrolled ? 'bg-[#b27e02]' : 'bg-[#b27e02]/90'
                                    }`}>
                                        {siteName ? siteName.charAt(0).toUpperCase() : 'S'}
                                    </div>
                                    <div className="text-xl font-bold leading-none">
                                        <span className={`transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                                            {siteName || 'Saturn'}
                                        </span>
                                        {!siteName && <span className="text-[#b27e02]">RealCon</span>}
                                    </div>
                                </>
                            )}
                        </a>

                        {/* Desktop links — right aligned */}
                        <div className="hidden md:flex items-center gap-1 ml-auto">
                            {allLinks.map(({ href, label }) => (
                                <a key={href} href={href} className={linkClass}>
                                    {label}
                                    <span className={underlineClass} />
                                </a>
                            ))}

                            {contactPhone && (
                                <a
                                    href={`tel:${contactPhone}`}
                                    className={`ml-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                                        scrolled
                                            ? 'bg-[#b27e02] text-white hover:bg-[#8a6002] shadow-md shadow-[#b27e02]/30'
                                            : 'bg-[#b27e02] text-white hover:bg-[#8a6002] shadow-lg shadow-black/30'
                                    }`}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.4 2 2 0 0 1 3.62 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.01z"/>
                                    </svg>
                                    {contactPhone}
                                </a>
                            )}
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className={`md:hidden ml-auto p-2 rounded-lg transition-colors ${
                                scrolled ? 'text-gray-800 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                            }`}
                            aria-label="Menu"
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                {menuOpen
                                    ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                                    : <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
                                }
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile menu drawer */}
            <div className={`fixed inset-x-0 top-0 z-40 bg-white shadow-2xl transition-all duration-400 ease-in-out md:hidden ${
                menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
            }`}>
                <div className="pt-20 pb-6 px-6 space-y-1">
                    {allLinks.map(({ href, label }) => (
                        <a
                            key={href}
                            href={href}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-[#fef9e7] hover:text-[#b27e02] transition-colors"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#b27e02]" />
                            {label}
                        </a>
                    ))}
                    {contactPhone && (
                        <div className="pt-3 border-t border-gray-100 mt-3">
                            <a
                                href={`tel:${contactPhone}`}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#b27e02] text-white rounded-xl font-semibold hover:bg-[#8a6002] transition"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.4 2 2 0 0 1 3.62 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.01z"/>
                                </svg>
                                {contactPhone}
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile overlay */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 md:hidden"
                    onClick={() => setMenuOpen(false)}
                />
            )}
        </>
    );
}
