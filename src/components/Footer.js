'use client';

import { useEffect, useState } from 'react';
import { MdEmail, MdPhone } from 'react-icons/md';
import { useSettings } from '@/lib/SettingsContext';

function twoWords(title) {
    if (!title) return '';
    const words = title.trim().split(/\s+/);
    if (words.length <= 2) return title;
    return words.slice(0, 2).join(' ') + '…';
}

export default function Footer() {
    const {
        siteName, cinNumber, copyrightText, footerTagline, footerDescription,
        siteLogo, footerLogo, footerLogoMode,
    } = useSettings();
    // 'header' → reuse the navbar's siteLogo. 'custom' → use the uploaded
    // footerLogo. 'none' (or any other) → hide the logo entirely. Default
    // to 'header' for backwards compatibility with existing data.
    const mode = footerLogoMode || 'header';
    const resolvedFooterLogo = mode === 'header' ? siteLogo : mode === 'custom' ? footerLogo : '';
    const [blogs, setBlogs] = useState([]);
    const [blogCategories, setBlogCategories] = useState([]);

    useEffect(() => {
        fetch('/api/blog')
            .then(r => r.json())
            .then(d => {
                if (!d.success) return;
                const posts = d.data || [];
                setBlogs(posts.slice(0, 5));
                const cats = [...new Set(posts.map(b => b.category).filter(Boolean))];
                setBlogCategories(cats);
            })
            .catch(() => { });
    }, []);

    return (
        <footer className="bg-moss text-background py-16 px-6 ">
            <div className="max-w-7xl mx-auto">
                {/* Top Section — Brand + one col per group + Get In Touch */}
                {/* <div className="flex flex-wrap gap-10 mb-12"> */}

                {/* Brand */}
                {/* <div className="w-full md:w-52 flex-shrink-0">
                        <div className="mb-4">
                            <span className="text-2xl font-bold text-white">
                                {siteName || 'Saturn RealCon'}
                            </span>
                        </div>
                        {(footerTagline || 'Your Trusted Real Estate Partner') && (
                            <h4 className="text-white text-sm font-bold mb-2">
                                {footerTagline || 'Your Trusted Real Estate Partner'}
                            </h4>
                        )}
                        {(footerDescription || 'Buy, sell, and rent verified properties across India. Expert agents. Zero hassle.') && (
                            <p className="text-gray-300 text-xs leading-relaxed">
                                {footerDescription || 'Buy, sell, and rent verified properties across India. Expert agents. Zero hassle.'}
                            </p>
                        )}
                        {(footerTrustText || 'Trusted by 1000+ families across India') && (
                            <p className="text-gray-400 text-xs mt-3">
                                {footerTrustText || 'Trusted by 1000+ families across India'}
                            </p>
                        )}
                    </div> */}

                {/* Latest Blogs */}
                {/* {blogs.length > 0 && (
                        <div className="w-full md:w-auto md:min-w-[180px]">
                            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Latest Blogs</h4>
                            <ul className="space-y-2">
                                {blogs.map(blog => (
                                    <li key={blog._id}>
                                        <a
                                            href={`/blog/${blog.slug || blog._id}`}
                                            className="text-gray-400 hover:text-gold transition text-sm"
                                        >
                                            {twoWords(blog.title)}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )} */}

                {/* Blog Categories */}
                {/* {blogCategories.length > 0 && (
                        <div className="w-full md:w-auto md:min-w-[130px]">
                            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Blog Categories</h4>
                            <ul className="space-y-2">
                                {blogCategories.map(cat => (
                                    <li key={cat}>
                                        <a
                                            href={`/blog?category=${encodeURIComponent(cat)}`}
                                            className="text-gray-400 hover:text-gold transition text-sm"
                                        >
                                            {cat}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )} */}

                {/* Get In Touch */}
                {/* <div className="min-w-[180px] md:ml-auto">
                        <h4 className="text-white font-bold mb-4">Get In Touch</h4>
                        <div className="space-y-3">
                            <a
                                href="mailto:info@example.com"
                                className="flex items-center gap-3 text-gray-300 hover:text-gold transition text-sm group"
                            >
                                <MdEmail className="text-xl text-gold group-hover:text-gold flex-shrink-0" />
                                <span>info@example.com</span>
                            </a>
                            {contactPhone && (
                                <a
                                    href={`tel:${contactPhone}`}
                                    className="flex items-center gap-3 text-gray-300 hover:text-gold transition text-sm group"
                                >
                                    <MdPhone className="text-xl text-gold group-hover:text-gold flex-shrink-0" />
                                    <span>{contactPhone}</span>
                                </a>
                            )}
                        </div>
                    </div> */}

                {/* Quick Links */}

                {/* Legal */}
                {/* </div> */}

                {/* Divider */}
                <div className="w-full h-px bg-gold/30 mb-8" />

                {/* Bottom Section — Logo (top) → Footer Tagline → Footer
                    Description → CIN Number → Copyright Text. */}
                <div className="text-center space-y-2">
                    {resolvedFooterLogo ? (
                        <div className="flex justify-center mb-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={resolvedFooterLogo}
                                alt={siteName ? `${siteName} logo` : 'Logo'}
                                loading="lazy"
                                className="h-7 md:h-9 w-auto max-w-[120px] md:max-w-[160px] object-contain"
                            />
                        </div>
                    ) : null}
                    {footerTagline ? (
                        <p className="text-white text-sm md:text-base font-semibold">{footerTagline}</p>
                    ) : null}
                    {footerDescription ? (
                        <div
                            className="rich-content text-gray-300 text-xs md:text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: footerDescription }}
                        />
                    ) : null}
                    {cinNumber ? (
                        <p className="text-gray-400 text-xs leading-relaxed">{cinNumber}</p>
                    ) : null}
                    <p className="text-gray-400 text-xs">
                        {copyrightText || `© ${new Date().getFullYear()} ${siteName || 'Saturn RealCon'}`}
                    </p>
                </div>
            </div>
        </footer>
    );
}
