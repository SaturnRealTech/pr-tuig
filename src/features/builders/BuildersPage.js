'use client';

import { useState } from 'react';
import Image from 'next/image';
import NavbarClient from '@/features/home/components/NavbarClient';
import Footer from '@/components/Footer';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function BuildersPage({ builders = [], pageData = {} }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const desktopSrc = pageData.desktopBanner;
    const mobileSrc = pageData.mobileBanner;
    const hasBanner = desktopSrc || mobileSrc;
    const bannerTitle = pageData.bannerTitle;
    const bannerDescription = pageData.bannerDescription;
    const desktopBannerAlt = pageData.desktopBannerAlt || bannerTitle || 'Builders';
    const mobileBannerAlt = pageData.mobileBannerAlt || bannerTitle || 'Builders';
    const sectionTitle = pageData.sectionTitle;
    const sectionContent = pageData.sectionContent;

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon />
            <NavbarClient />

            {/* Hero */}
            {hasBanner ? (
                <section className="relative w-full overflow-hidden bg-black">
                    {/* Mobile banner */}
                    <div className="block md:hidden w-full relative">
                        <Image src={mobileSrc || desktopSrc} alt={mobileBannerAlt} width={800} height={600} unoptimized className="w-full h-auto" />
                    </div>
                    {/* Desktop banner */}
                    <div className="hidden md:block w-full relative">
                        <Image src={desktopSrc || mobileSrc} alt={desktopBannerAlt} width={1920} height={1080} unoptimized className="w-full h-auto" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                    {(bannerTitle || bannerDescription) && (
                        <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center text-center px-4 z-10">
                            {bannerTitle && (
                                <h1 className="text-4xl md:text-6xl font-bold text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.8)] mb-3">
                                    {bannerTitle}
                                </h1>
                            )}
                            {bannerDescription && (
                                <p className="text-base md:text-lg text-white/85 max-w-2xl mx-auto [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
                                    {bannerDescription}
                                </p>
                            )}
                        </div>
                    )}
                </section>
            ) : (
                <section className="pt-32 pb-16 bg-black relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#b27e02]/10 via-transparent to-[#b27e02]/5" />
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#b27e02]/40 to-transparent" />
                    <div className="w-[90%] mx-auto relative z-10 text-center">
                        <p className="text-[#b27e02] text-sm font-semibold uppercase tracking-widest mb-3">Trusted Partners</p>
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">{bannerTitle || 'Our Builders'}</h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">
                            {bannerDescription || 'Discover top real estate developers we work with. Click a builder to explore their projects.'}
                        </p>
                        <div className="h-1 w-20 bg-[#b27e02] mx-auto mt-8 rounded-full" />
                    </div>
                </section>
            )}

            {/* Below Hero Content Section */}
            {sectionContent && (
                <section className="py-12 bg-white border-b border-gray-100">
                    <div className="w-[90%] mx-auto">
                        {sectionTitle && (
                            <div className="text-center mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{sectionTitle}</h2>
                                <div className="h-1 w-16 bg-[#b27e02] mx-auto rounded-full" />
                            </div>
                        )}
                        <div
                            className={`rich-content text-gray-700 text-base md:text-lg overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[9999px]' : 'max-h-40'}`}
                            dangerouslySetInnerHTML={{ __html: sectionContent }}
                        />
                        {!isExpanded && (
                            <div className="relative -mt-10 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}
                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => setIsExpanded(v => !v)}
                                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300 text-sm"
                            >
                                {isExpanded ? 'Read Less' : 'Read More'}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                    className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Builders Grid */}
            <section className="py-20 bg-gray-50">
                <div className="w-[90%] mx-auto">
                    {builders.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 text-lg">No builders found.</div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {builders.map((builder) => (
                                <BuilderCard key={builder.id} builder={builder} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}

function BuilderCard({ builder }) {
    const banner = builder.heroImage || builder.mobileBanner;
    const bannerAlt = builder.heroImageAlt || builder.mobileBannerAlt || builder.name;

    return (
        <a
            href={`/builders/${builder.slug}`}
            className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-[#b27e02]/15 transition-all duration-300 border border-gray-100 flex flex-col"
        >
            {/* Banner */}
            <div className="relative w-full h-44 bg-gray-100 overflow-hidden">
                {banner ? (
                    <Image
                        src={banner}
                        alt={bannerAlt}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                        <span className="text-6xl font-bold text-[#b27e02]/40">{builder.name.charAt(0)}</span>
                    </div>
                )}
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Logo on banner */}
                {builder.logo && (
                    <div className="absolute bottom-3 left-3 w-14 h-14 bg-white rounded-xl shadow-lg flex items-center justify-center p-1.5 border border-white">
                        <Image src={builder.logo} alt={builder.logoAlt || builder.name} width={56} height={56} unoptimized className="w-full h-full object-contain" />
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-5">
                <h3 className="text-base font-bold text-black group-hover:text-[#b27e02] transition-colors mb-1">
                    {builder.name}
                </h3>
                {builder.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{builder.description}</p>
                )}
                <div className="mt-auto">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b27e02] border border-[#b27e02] px-3 py-1.5 rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300">
                        View Projects
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </span>
                </div>
            </div>
        </a>
    );
}
