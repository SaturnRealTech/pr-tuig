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
    const { siteName, contactPhone, cinNumber, copyrightText, footerTagline, footerDescription, footerTrustText } = useSettings();
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
        <footer className="bg-black text-white py-16 px-6 border-t-2 border-[#b27e02]">
            <div className="max-w-7xl mx-auto">
                {/* Top Section — Brand + one col per group + Get In Touch */}
                <div className="flex flex-wrap gap-10 mb-12">

                    {/* Brand */}
                    <div className="w-full md:w-52 flex-shrink-0">
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
                    </div>

                    {/* Latest Blogs */}
                    {blogs.length > 0 && (
                        <div className="w-full md:w-auto md:min-w-[180px]">
                            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Latest Blogs</h4>
                            <ul className="space-y-2">
                                {blogs.map(blog => (
                                    <li key={blog._id}>
                                        <a
                                            href={`/blog/${blog.slug || blog._id}`}
                                            className="text-gray-400 hover:text-[#b27e02] transition text-sm"
                                        >
                                            {twoWords(blog.title)}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Blog Categories */}
                    {blogCategories.length > 0 && (
                        <div className="w-full md:w-auto md:min-w-[130px]">
                            <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Blog Categories</h4>
                            <ul className="space-y-2">
                                {blogCategories.map(cat => (
                                    <li key={cat}>
                                        <a
                                            href={`/blog?category=${encodeURIComponent(cat)}`}
                                            className="text-gray-400 hover:text-[#b27e02] transition text-sm"
                                        >
                                            {cat}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Get In Touch */}
                    <div className="min-w-[180px] md:ml-auto">
                        <h4 className="text-white font-bold mb-4">Get In Touch</h4>
                        <div className="space-y-3">
                            <a
                                href="mailto:SaturnRealcon@gmail.com"
                                className="flex items-center gap-3 text-gray-300 hover:text-[#b27e02] transition text-sm group"
                            >
                                <MdEmail className="text-xl text-[#b27e02] group-hover:text-[#d4a030] flex-shrink-0" />
                                <span>SaturnRealcon@gmail.com</span>
                            </a>
                            {contactPhone && (
                                <a
                                    href={`tel:${contactPhone}`}
                                    className="flex items-center gap-3 text-gray-300 hover:text-[#b27e02] transition text-sm group"
                                >
                                    <MdPhone className="text-xl text-[#b27e02] group-hover:text-[#d4a030] flex-shrink-0" />
                                    <span>{contactPhone}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    {/* <div className="w-full md:w-auto md:min-w-[130px]">
                        <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><a href="/blog" className="text-gray-400 hover:text-[#b27e02] transition text-sm">Blog</a></li>
                            <li><a href="/careers" className="text-gray-400 hover:text-[#b27e02] transition text-sm">Careers</a></li>
                            <li><a href="/contact" className="text-gray-400 hover:text-[#b27e02] transition text-sm">Contact Us</a></li>
                        </ul>
                    </div> */}

                    {/* Legal */}
                    {/* <div className="w-full md:w-auto md:min-w-[150px]">
                        <h4 className="text-white font-bold mb-3 text-sm uppercase tracking-wide">Legal</h4>
                        <ul className="space-y-2">
                            <li><a href="/privacy" className="text-gray-400 hover:text-[#b27e02] transition text-sm">Privacy Policy</a></li>
                            <li><a href="/terms" className="text-gray-400 hover:text-[#b27e02] transition text-sm">Terms &amp; Conditions</a></li>
                            <li><a href="/cookies" className="text-gray-400 hover:text-[#b27e02] transition text-sm">Cookie Policy</a></li>
                        </ul>
                    </div> */}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-[#b27e02]/30 mb-8" />

                {/* Bottom Section */}
                <div className="text-center">
                    {/* <div className="flex flex-wrap justify-center gap-4 text-sm mb-3">
                        <a href="/about" className="text-gray-300 hover:text-[#b27e02] transition">About Us</a>
                        <span className="text-gray-600">•</span>
                        <a href="/blog" className="text-gray-300 hover:text-[#b27e02] transition">Blog</a>
                        <span className="text-gray-600">•</span>
                        <a href="/privacy" className="text-gray-300 hover:text-[#b27e02] transition">Privacy Policy</a>
                        <span className="text-gray-600">•</span>
                        <a href="/terms" className="text-gray-300 hover:text-[#b27e02] transition">Terms &amp; Conditions</a>
                        <span className="text-gray-600">•</span>
                        <a href="/cookies" className="text-gray-300 hover:text-[#b27e02] transition">Cookie Policy</a>
                        <span className="text-gray-600">•</span>
                        <a href="/contact" className="text-gray-300 hover:text-[#b27e02] transition">Contact</a>
                    </div> */}
                    <p className="text-gray-400 text-xs mt-4">
                        {copyrightText || `© ${new Date().getFullYear()} ${siteName || 'Saturn RealCon'}`}
                    </p>
                    {cinNumber && (
                        <p className="text-gray-500 text-xs mt-1">
                            CIN: {cinNumber}
                        </p>
                    )}
                </div>
            </div>
        </footer>
    );
}
