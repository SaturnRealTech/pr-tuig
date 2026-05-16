'use client';

import Image from 'next/image';
import NavbarClient from '@/features/home/components/NavbarClient';
import Footer from '@/components/Footer';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import ProjectCard from '@/components/ProjectCard';
import { useState } from 'react';

function FaqAccordion({ faqs }) {
    const [expandedFAQs, setExpandedFAQs] = useState({});
    return (
        <div className="space-y-4">
            {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                    <button
                        onClick={() => setExpandedFAQs(prev => ({ ...prev, [index]: !prev[index] }))}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
                    >
                        <span className="font-semibold text-gray-800 pr-4 flex-1">{faq.question}</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            className={`text-[#b27e02] flex-shrink-0 transition-transform duration-300 ${expandedFAQs[index] ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    {expandedFAQs[index] && (
                        <div className="p-4 bg-white border-t border-gray-200">
                            <p className="text-gray-700 text-base leading-relaxed">{faq.answer}</p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function BuilderDetailPage({ builder, projects = [] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleCount, setVisibleCount] = useState(8);
    const PAGE_SIZE = 8;
    const visibleProjects = projects.slice(0, visibleCount);
    const hasMore = visibleCount < projects.length;

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon />
            <NavbarClient />

            {/* Hero Banner */}
            <section className="relative w-full overflow-hidden bg-black">
                {/* Mobile banner */}
                {(builder.mobileBanner || builder.heroImage) ? (
                    <div className="block md:hidden w-full relative">
                        <Image
                            src={builder.mobileBanner || builder.heroImage}
                            alt={builder.mobileBannerAlt || builder.heroImageAlt || builder.name}
                            width={800} height={600} unoptimized className="w-full h-auto"
                        />
                    </div>
                ) : (
                    <div className="block md:hidden w-full h-[60vh] bg-gradient-to-br from-gray-900 via-black to-gray-800" />
                )}
                {/* Desktop banner */}
                {(builder.heroImage || builder.mobileBanner) ? (
                    <div className="hidden md:block w-full relative">
                        <Image
                            src={builder.heroImage || builder.mobileBanner}
                            alt={builder.heroImageAlt || builder.mobileBannerAlt || builder.name}
                            width={1920} height={1080} unoptimized className="w-full h-auto"
                        />
                    </div>
                ) : (
                    <div className="hidden md:block w-full h-[60vh] bg-gradient-to-br from-gray-900 via-black to-gray-800" />
                )}

                {/* Gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                {/* Back button */}
                <div className="absolute top-24 left-0 right-0 w-[90%] mx-auto">
                    <a href="/builders" className="inline-flex items-center gap-2 text-white/70 hover:text-[#b27e02] text-sm font-medium transition-colors">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        All Builders
                    </a>
                </div>

                {/* Builder info on banner */}
                <div className="absolute bottom-0 left-0 right-0 w-[90%] mx-auto pb-10">
                    <div className="flex items-end gap-6">
                        {builder.logo && (
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center p-2 flex-shrink-0 border-2 border-white/20">
                                <Image src={builder.logo} alt={builder.logoAlt || builder.name} width={96} height={96} unoptimized className="w-full h-full object-contain" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">{builder.name}</h1>
                            {builder.description && (
                                <p className="text-gray-200 text-base max-w-2xl line-clamp-2 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">{builder.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats bar */}
            <div className="bg-[#b27e02] py-4">
                <div className="w-[90%] mx-auto flex items-center gap-8">
                    <div className="text-white">
                        <span className="text-2xl font-bold">{projects.length}</span>
                        <span className="text-yellow-100 text-sm ml-2">Project{projects.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-5 w-px bg-white/30" />
                    <p className="text-yellow-100 text-sm">All listings by {builder.name}</p>
                </div>
            </div>

            {/* Content */}
            {builder.content && (
                <section className="py-12 bg-white border-b border-gray-100">
                    <div className="w-[90%] mx-auto">
                        {builder.title && (
                            <div className="text-center mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{builder.title}</h2>
                                <div className="h-1 w-16 bg-[#b27e02] mx-auto rounded-full" />
                            </div>
                        )}
                        <div
                            className={`rich-content text-black text-lg md:text-xl overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[9999px]' : 'max-h-52'
                                }`}
                            dangerouslySetInnerHTML={{ __html: builder.content }}
                        />

                        {!isExpanded && (
                            <div className="relative -mt-10 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}

                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => setIsExpanded(v => !v)}
                                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300 text-sm"
                            >
                                {isExpanded ? 'Read Less' : 'Read More'}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                    className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </section>
            )}

            {/* Projects Grid */}
            <section className="py-16 bg-gray-50">
                <div className="w-[90%] mx-auto">
                    <div className="mb-10">
                        <h2 className="text-3xl font-bold text-black mb-2">Projects by {builder.name}</h2>
                        <div className="h-1 w-16 bg-[#b27e02] rounded-full" />
                    </div>

                    {projects.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">No projects found for this builder.</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {visibleProjects.map(project => (
                                    <ProjectCard key={project._id || project.slug} project={project} />
                                ))}
                            </div>
                            {hasMore && (
                                <div className="text-center mt-10">
                                    <button
                                        type="button"
                                        onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#b27e02] border border-[#b27e02]/50 px-6 py-3 rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300"
                                    >
                                        Load More
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* FAQs */}
            {builder.faqs && builder.faqs.length > 0 && (
                <section className="py-12 bg-white">
                    <div className="w-[90%] mx-auto">
                        <h3 className="text-2xl md:text-3xl font-bold text-black mb-8">Frequently Asked Questions</h3>
                        <FaqAccordion faqs={builder.faqs} />
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
}
