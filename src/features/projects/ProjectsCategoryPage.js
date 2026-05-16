'use client';

import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import NavbarClient from '@/features/home/components/NavbarClient';
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

function Hero({ category, subtitle }) {
    const desktopBanner = category.heroImage;
    const mobileBanner = category.mobileBanner;
    const hasBanner = desktopBanner || mobileBanner;

    if (hasBanner) {
        return (
            <section className="relative w-full overflow-hidden bg-black">
                {/* Mobile banner */}
                <div className="block md:hidden w-full relative">
                    <Image src={mobileBanner || desktopBanner} alt={category.mobileBannerAlt || category.name} width={800} height={600} unoptimized className="w-full h-auto" />
                </div>
                {/* Desktop banner */}
                <div className="hidden md:block w-full relative">
                    <Image src={desktopBanner || mobileBanner} alt={category.heroImageAlt || category.name} width={1920} height={1080} unoptimized className="w-full h-auto" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute bottom-10 left-0 right-0 w-[90%] mx-auto">
                    <div className="text-white">
                        <nav className="text-sm mb-3 flex items-center gap-2 text-[#f0d090]">
                            <a href="/" className="hover:text-white transition">Home</a>
                            <span className="text-gray-400">/</span>
                            <span className="text-white">{category.name}</span>
                        </nav>
                        <h1 className="text-4xl md:text-5xl font-bold mb-2 [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">{category.title || category.name}</h1>
                        {subtitle && <p className="text-lg text-gray-200 mt-1 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">{subtitle}</p>}
                        {category.description && <p className="text-sm text-gray-300 mt-1 max-w-2xl line-clamp-2">{category.description}</p>}
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-gradient-to-r from-[#b27e02] to-[#6b4a01] text-white py-16">
            <div className="w-[90%] mx-auto">
                <nav className="text-sm mb-3 flex items-center gap-2 text-[#f0d090]">
                    <a href="/" className="hover:text-white transition">Home</a>
                    <span className="text-[#c49a20]">/</span>
                    <span className="text-white">{category.name}</span>
                </nav>
                <h1 className="text-4xl md:text-5xl font-bold mb-2">{category.title || category.name}</h1>
                {subtitle && <p className="text-lg text-[#faf0d0] mt-1">{subtitle}</p>}
                {category.description && <p className="text-base text-[#faf0d0] mt-1 max-w-2xl opacity-80">{category.description}</p>}
            </div>
        </section>
    );
}

// ── Parent: show child category tiles + projects ──────────────────────────────
function ParentCategoryView({ category, childCategories, projects = [], currentPage = 1, totalPages = 1, totalProjects = 0 }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarClient />
            <Hero
                category={category}
                subtitle={childCategories.length > 0 ? `${childCategories.length} sub-categor${childCategories.length === 1 ? 'y' : 'ies'}` : null}
            />

            {childCategories.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Browse by {category.name}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                        {childCategories.map((child) => (
                            <Link
                                key={child._id}
                                href={`/projects/category/${child.slug}`}
                                className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all bg-white border border-gray-100 hover:border-[#b27e02]"
                            >
                                {child.heroImage ? (
                                    <div className="relative h-36 overflow-hidden">
                                        <img
                                            src={child.heroImage}
                                            alt={child.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <span className="absolute bottom-3 left-3 text-white font-bold text-sm">{child.name}</span>
                                    </div>
                                ) : (
                                    <div className="h-36 bg-gradient-to-br from-[#fef9e7] to-[#fae8a0] flex items-center justify-center">
                                        <span className="text-[#b27e02] font-bold text-lg text-center px-3">{child.name}</span>
                                    </div>
                                )}
                                <div className="px-4 py-3 flex items-center justify-between">
                                    <div>
                                        {child.description && (
                                            <p className="text-xs text-gray-500 line-clamp-1">{child.description}</p>
                                        )}
                                    </div>
                                    <span className="text-[#b27e02] text-sm font-semibold group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {projects.length > 0 && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Projects in {category.name}
                            <span className="ml-3 text-base font-normal text-gray-500">({totalProjects} found)</span>
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {projects.map((project) => (
                            <ProjectCard key={project._id || project.slug} project={project} />
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12">
                            <Link
                                href={`/projects/category/${category.slug}?page=${Math.max(1, currentPage - 1)}`}
                                className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition ${currentPage === 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'}`}
                            >
                                ← Prev
                            </Link>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <Link
                                    key={p}
                                    href={`/projects/category/${category.slug}?page=${p}`}
                                    className={`w-10 h-10 rounded-lg font-medium inline-flex items-center justify-center transition ${p === currentPage ? 'bg-[#b27e02] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {p}
                                </Link>
                            ))}
                            <Link
                                href={`/projects/category/${category.slug}?page=${Math.min(totalPages, currentPage + 1)}`}
                                className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition ${currentPage === totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'}`}
                            >
                                Next →
                            </Link>
                        </div>
                    )}
                </section>
            )}

            {projects.length === 0 && childCategories.length === 0 && (
                <div className="text-center py-20">
                    <div className="text-5xl mb-4">📂</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Nothing here yet</h3>
                    <p className="text-gray-500">Projects and sub-categories under <strong>{category.name}</strong> will appear here.</p>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 pb-10">
                <Link href="/projects" className="inline-flex items-center gap-1 text-[#b27e02] hover:text-[#8a6002] font-medium transition">
                    ← Back to All Projects
                </Link>
            </div>

            {category.faqs && category.faqs.length > 0 && (
                <section className="py-12 bg-white">
                    <div className="w-[90%] mx-auto">
                        <h3 className="text-2xl md:text-3xl font-bold text-black mb-8">Frequently Asked Questions</h3>
                        <FaqAccordion faqs={category.faqs} />
                    </div>
                </section>
            )}

            <WhatsAppIcon />
            <Footer />
        </div>
    );
}

// ── Child: show projects in this category ─────────────────────────────────────
function ChildCategoryView({ category, projects, currentPage, totalPages, totalProjects }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <NavbarClient />
            <Hero
                category={category}
                subtitle={`${totalProjects} project${totalProjects === 1 ? '' : 's'} found`}
            />

            {category.content && (
                <div className="max-w-4xl mx-auto px-4 py-10">
                    <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: category.content }} />
                </div>
            )}

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {projects.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🏗️</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h3>
                        <p className="text-gray-500">Projects tagged <strong>{category.name}</strong> will appear here.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {projects.map((project) => (
                                <ProjectCard key={project._id || project.slug} project={project} />
                            ))}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-12">
                                <Link
                                    href={`/projects/category/${category.slug}?page=${Math.max(1, currentPage - 1)}`}
                                    className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition ${currentPage === 1 ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'}`}
                                >
                                    ← Prev
                                </Link>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <Link
                                        key={p}
                                        href={`/projects/category/${category.slug}?page=${p}`}
                                        className={`w-10 h-10 rounded-lg font-medium inline-flex items-center justify-center transition ${p === currentPage ? 'bg-[#b27e02] text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {p}
                                    </Link>
                                ))}
                                <Link
                                    href={`/projects/category/${category.slug}?page=${Math.min(totalPages, currentPage + 1)}`}
                                    className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition ${currentPage === totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-gray-50'}`}
                                >
                                    Next →
                                </Link>
                            </div>
                        )}
                    </>
                )}
            </section>

            <div className="max-w-7xl mx-auto px-4 pb-10">
                <Link href="/projects" className="inline-flex items-center gap-1 text-[#b27e02] hover:text-[#8a6002] font-medium transition">
                    ← Back to All Projects
                </Link>
            </div>

            {category.faqs && category.faqs.length > 0 && (
                <section className="py-12 bg-white">
                    <div className="w-[90%] mx-auto">
                        <h3 className="text-2xl md:text-3xl font-bold text-black mb-8">Frequently Asked Questions</h3>
                        <FaqAccordion faqs={category.faqs} />
                    </div>
                </section>
            )}

            <WhatsAppIcon />
            <Footer />
        </div>
    );
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function ProjectsCategoryPage({
    category,
    isParent,
    childCategories = [],
    projects = [],
    currentPage = 1,
    totalPages = 1,
    totalProjects = 0,
}) {
    if (!category) return null;

    if (isParent) {
        return (
            <ParentCategoryView
                category={category}
                childCategories={childCategories}
                projects={projects}
                currentPage={currentPage}
                totalPages={totalPages}
                totalProjects={totalProjects}
            />
        );
    }

    return (
        <ChildCategoryView
            category={category}
            projects={projects}
            currentPage={currentPage}
            totalPages={totalPages}
            totalProjects={totalProjects}
        />
    );
}
