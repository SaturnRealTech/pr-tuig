'use client';

import Image from 'next/image';
import { MdArrowRight } from 'react-icons/md';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import NavbarClient from '@/features/home/components/NavbarClient';

export default function BlogPageClient({ posts = [], categories = [], recentPosts = [], pageData = {} }) {
    const desktopSrc = pageData.desktopBanner;
    const mobileSrc = pageData.mobileBanner;
    const hasBanner = desktopSrc || mobileSrc;
    const bannerTitle = pageData.bannerTitle || 'Blog';
    const bannerDescription = pageData.bannerDescription || 'Insights, tips, and stories on real estate, market trends, and property investment';

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon />
            <NavbarClient />

            {/* Hero */}
            {hasBanner ? (
                <section className="relative w-full overflow-hidden bg-black">
                    {/* Mobile banner */}
                    <div className="block md:hidden w-full">
                        <Image src={mobileSrc || desktopSrc} alt={pageData.mobileBannerAlt || bannerTitle}
                            width={800} height={600} unoptimized className="w-full object-cover" />
                    </div>
                    {/* Desktop banner */}
                    <div className="hidden md:block w-full">
                        <Image src={desktopSrc || mobileSrc} alt={pageData.desktopBannerAlt || bannerTitle}
                            width={1920} height={800} unoptimized className="w-full object-cover" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                    <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center text-center px-4 z-10">
                        <h1 className="text-4xl md:text-6xl font-bold text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.8)] mb-3">{bannerTitle}</h1>
                        <p className="text-base md:text-lg text-white/90 max-w-2xl [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">{bannerDescription}</p>
                    </div>
                </section>
            ) : (
                <section className="bg-gradient-to-r from-[#b27e02] to-[#6b4a01] text-white pt-28 pb-16">
                    <div className="w-[90%] mx-auto text-center">
                        <h1 className="text-4xl md:text-6xl font-bold mb-4">{bannerTitle}</h1>
                        <p className="text-[#faf0d0] text-lg max-w-2xl mx-auto">{bannerDescription}</p>
                    </div>
                </section>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <section className="py-14 bg-gray-50">
                    <div className="w-[90%] mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">Browse by Category</h2>
                            <div className="h-1 w-12 bg-[#b27e02] rounded-full mt-2" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {categories.map((cat) => (
                                <a
                                    key={cat._id}
                                    href={`/blog/category/${cat.slug}`}
                                    className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all bg-white border border-gray-100 hover:border-[#b27e02]"
                                >
                                    {cat.heroImage ? (
                                        <div className="relative h-32 overflow-hidden">
                                            <img
                                                src={cat.heroImage}
                                                alt={cat.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <span className="absolute bottom-2 left-3 text-white font-bold text-sm">{cat.name}</span>
                                        </div>
                                    ) : (
                                        <div className="h-32 bg-gradient-to-br from-[#fef9e7] to-[#fae8a0] flex items-center justify-center">
                                            <span className="text-[#b27e02] font-bold text-base text-center px-3">{cat.name}</span>
                                        </div>
                                    )}
                                    <div className="px-3 py-2 flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{cat.count} post{cat.count !== 1 ? 's' : ''}</span>
                                        <span className="text-[#b27e02] text-sm group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
                <section className="py-14 bg-white">
                    <div className="w-[90%] mx-auto">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800">Recent Posts</h2>
                            <div className="h-1 w-12 bg-[#b27e02] rounded-full mt-2" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {recentPosts.map((post) => (
                                <BlogCard key={post._id || post.slug} post={post} />
                            ))}
                        </div>
                        {posts.length > 6 && (
                            <div className="text-center mt-10">
                                <a
                                    href="/blog/all"
                                    className="inline-flex items-center gap-2 px-6 py-3 border border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition"
                                >
                                    View All Posts <MdArrowRight size={18} />
                                </a>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {posts.length === 0 && categories.length === 0 && (
                <div className="text-center py-24 text-gray-400">
                    <p className="text-xl font-semibold mb-2">No posts yet</p>
                    <p className="text-sm">Check back soon for new articles.</p>
                </div>
            )}

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
                    <Image
                        src={post.heroImage}
                        alt={post.heroImageAlt || post.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
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
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#b27e02] transition-colors">
                    {post.title}
                </h3>
                {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                    <span>{post.author}{post.date ? ` • ${post.date}` : ''}</span>
                    <MdArrowRight className="text-[#b27e02] group-hover:translate-x-1 transition-transform" size={18} />
                </div>
            </div>
        </a>
    );
}
