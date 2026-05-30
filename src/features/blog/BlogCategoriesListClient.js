'use client';

import Image from 'next/image';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import NavbarClient from '@/features/home/components/NavbarClient';

export default function BlogCategoriesListClient({ categories = [], pageData = {} }) {
    const desktopSrc = pageData.desktopBanner;
    const mobileSrc = pageData.mobileBanner;
    const hasBanner = desktopSrc || mobileSrc;
    const bannerTitle = pageData.bannerTitle || 'Blog Categories';
    const bannerDescription = pageData.bannerDescription || '';

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon />
            <NavbarClient />

            {/* Hero */}
            {hasBanner ? (
                <section className="relative w-full overflow-hidden bg-black">
                    {/* Mobile banner */}
                    <div className="block md:hidden w-full">
                        <Image
                            src={mobileSrc || desktopSrc}
                            alt={pageData.mobileBannerAlt || bannerTitle}
                            width={800} height={600} unoptimized
                            className="w-full object-cover"
                        />
                    </div>
                    {/* Desktop banner */}
                    <div className="hidden md:block w-full">
                        <Image
                            src={desktopSrc || mobileSrc}
                            alt={pageData.desktopBannerAlt || bannerTitle}
                            width={1920} height={800} unoptimized
                            className="w-full object-cover"
                        />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                    <div className="absolute bottom-10 left-0 right-0 w-[90%] mx-auto z-10">
                        <nav className="text-sm mb-3 flex items-center gap-2 text-[#f0d090]">
                            <a href="/" className="hover:text-white transition">Home</a>
                            <span className="text-gray-400">/</span>
                            <a href="/blog" className="hover:text-white transition">Blog</a>
                            <span className="text-gray-400">/</span>
                            <span className="text-white">Categories</span>
                        </nav>
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">{bannerTitle}</h1>
                        {bannerDescription && (
                            <p className="text-gray-200 text-lg [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">{bannerDescription}</p>
                        )}
                        <p className="text-[#f0d090] text-sm mt-2">{categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
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
                            <span className="text-white">Categories</span>
                        </nav>
                        <h1 className="font-display text-4xl md:text-5xl font-bold mb-2">{bannerTitle}</h1>
                        {bannerDescription && <p className="text-[#faf0d0] mt-1">{bannerDescription}</p>}
                        <p className="text-[#faf0d0] mt-2 text-sm">
                            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
                        </p>
                    </div>
                </section>
            )}

            {/* Categories Grid */}
            <section className="py-14 bg-gray-50">
                <div className="w-[90%] mx-auto">
                    {categories.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="text-5xl mb-4">🗂️</div>
                            <p className="text-xl font-semibold text-gray-600 mb-2">No categories yet</p>
                            <p className="text-gray-400 text-sm">Categories will appear here once created.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                            {categories.map((cat) => (
                                <a
                                    key={cat._id}
                                    href={`/blog/category/${cat.slug}`}
                                    className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all bg-white border border-gray-100 hover:border-[#b27e02]"
                                >
                                    {cat.heroImage ? (
                                        <div className="relative h-36 overflow-hidden">
                                            <Image
                                                src={cat.heroImage}
                                                alt={cat.name}
                                                fill unoptimized
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            <span className="absolute bottom-3 left-3 text-white font-bold text-sm">{cat.name}</span>
                                        </div>
                                    ) : (
                                        <div className="h-36 bg-gradient-to-br from-[#fef9e7] to-[#fae8a0] flex items-center justify-center">
                                            <span className="text-[#b27e02] font-bold text-lg text-center px-3">{cat.name}</span>
                                        </div>
                                    )}
                                    <div className="px-4 py-3 flex items-center justify-between">
                                        <div>
                                            {cat.description && (
                                                <p className="text-xs text-gray-500 line-clamp-1">{cat.description}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {cat.count} post{cat.count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <span className="text-[#b27e02] text-sm font-semibold group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </a>
                            ))}
                        </div>
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
