'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MdArrowRight, MdSearch } from 'react-icons/md';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import NavbarClient from '@/features/home/components/NavbarClient';

const POSTS_PER_PAGE = 9;

export default function BlogCategoryPageClient({ category, posts = [] }) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const filtered = posts.filter(
        (p) =>
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.excerpt?.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
    const displayed = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

    const desktopBanner = category.heroImage;
    const mobileBanner = category.mobileBanner;
    const hasBanner = desktopBanner || mobileBanner;

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon />
            <NavbarClient />

            {/* Hero */}
            {hasBanner ? (
                <section className="relative w-full overflow-hidden bg-black">
                    {/* Mobile banner */}
                    <div className="block md:hidden w-full">
                        <Image src={mobileBanner || desktopBanner} alt={category.name}
                            width={800} height={600} unoptimized className="w-full object-cover" />
                    </div>
                    {/* Desktop banner */}
                    <div className="hidden md:block w-full">
                        <Image src={desktopBanner || mobileBanner} alt={category.name}
                            width={1920} height={800} unoptimized className="w-full object-cover" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                    <div className="absolute bottom-10 left-0 right-0 w-[90%] mx-auto z-10">
                        <div className="text-white">
                            <nav className="text-sm mb-3 flex items-center gap-2 text-[#f0d090]">
                                <a href="/" className="hover:text-white transition">Home</a>
                                <span className="text-gray-400">/</span>
                                <a href="/blog" className="hover:text-white transition">Blog</a>
                                <span className="text-gray-400">/</span>
                                <span className="text-white">{category.name}</span>
                            </nav>
                            <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">{category.name}</h1>
                            {category.description && (
                                <p className="text-gray-200 text-lg mt-1 max-w-2xl [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">{category.description}</p>
                            )}
                            <p className="text-[#f0d090] text-sm mt-2">{posts.length} article{posts.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="bg-gradient-to-r from-[#b27e02] to-[#6b4a01] text-white pt-28 pb-16">
                    <div className="w-[90%] mx-auto">
                        <nav className="text-sm mb-3 flex items-center gap-2 text-[#f0d090]">
                            <a href="/" className="hover:text-white transition">Home</a>
                            <span className="text-[#c49a20]">/</span>
                            <a href="/blog" className="hover:text-white transition">Blog</a>
                            <span className="text-[#c49a20]">/</span>
                            <span className="text-white">{category.name}</span>
                        </nav>
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">{category.name}</h1>
                        {category.description && (
                            <p className="text-[#faf0d0] mt-1 max-w-2xl">{category.description}</p>
                        )}
                        <p className="text-[#f0d090] text-sm mt-3">{posts.length} article{posts.length !== 1 ? 's' : ''}</p>
                    </div>
                </section>
            )}

            {/* Category rich content */}
            {category.content && (
                <div className="w-[90%] mx-auto py-10">
                    <div className="rich-content text-gray-800 text-base md:text-lg" dangerouslySetInnerHTML={{ __html: category.content }} />
                </div>
            )}

            {/* Posts */}
            <section className="py-14 bg-gray-50">
                <div className="w-[90%] mx-auto">
                    {/* Search */}
                    <div className="mb-8 relative max-w-lg">
                        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm">
                            <MdSearch className="text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={`Search in ${category.name}...`}
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                className="flex-1 bg-transparent text-gray-800 placeholder-gray-400 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {displayed.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xl font-semibold text-gray-600 mb-2">No articles found</p>
                            <p className="text-gray-400 text-sm">Try a different search term</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {displayed.map((post) => (
                                    <BlogCard key={post._id || post.slug} post={post} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12">
                                    <button
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition"
                                    >
                                        ← Prev
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-10 h-10 rounded-lg font-medium transition ${p === page ? 'bg-[#b27e02] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <div className="w-[90%] mx-auto pb-8">
                <a href="/blog" className="inline-flex items-center gap-1 text-[#b27e02] hover:text-[#8a6002] font-medium transition">
                    ← Back to Blog
                </a>
            </div>

            <Footer />
        </div>
    );
}

function BlogCard({ post }) {
    return (
        <a
            href={`/blog/${post.slug || post._id}`}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-[#b27e02]"
        >
            {post.heroImage ? (
                <div className="relative h-48 overflow-hidden">
                    <Image src={post.heroImage} alt={post.heroImageAlt || post.title} fill unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
            ) : (
                <div className="h-48 bg-gradient-to-br from-[#fef9e7] to-[#fae8a0] flex items-center justify-center">
                    <span className="text-5xl opacity-40">📝</span>
                </div>
            )}
            <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                    {post.category && (
                        <span className="text-xs font-bold px-3 py-1 bg-[#faf0d0] text-[#b27e02] rounded-full">
                            {post.category}
                        </span>
                    )}
                    {post.readTime && <span className="text-xs text-gray-400">{post.readTime}</span>}
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#b27e02] transition-colors">
                    {post.title}
                </h3>
                {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{post.author}{post.date ? ` • ${post.date}` : ''}</span>
                    <MdArrowRight className="text-[#b27e02] group-hover:translate-x-1 transition-transform" size={18} />
                </div>
            </div>
        </a>
    );
}
