'use client';

import { useState } from 'react';

export default function AboutSectionClient({ title = '', content = '', locationCategories = [] }) {
    const [expanded, setExpanded] = useState(false);

    if (!title && !content && !locationCategories.length) return null;

    return (
        <section className="py-20 bg-white">
            <div className="w-[90%] mx-auto">

                {title && (
                    <div className="text-center mb-8">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">{title}</h2>
                        <div className="h-1 w-20 bg-[#b27e02] mx-auto rounded-full" />
                    </div>
                )}

                {/* Location category cards */}
                {locationCategories.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {locationCategories.map(loc => (
                            <a
                                key={loc.slug}
                                href={`/category/${loc.slug}`}
                                className="px-8 py-4 bg-white border-2 border-gray-200 text-base font-semibold text-gray-800 hover:border-[#b27e02] hover:text-[#b27e02] hover:bg-[#fef9e7] transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                                {loc.name}
                            </a>
                        ))}
                    </div>
                )}

                {content && (
                    <>
                        <div
                            className={`rich-content text-black text-lg md:text-xl overflow-hidden transition-all duration-500 ${
                                expanded ? 'max-h-[9999px]' : 'max-h-52'
                            }`}
                            dangerouslySetInnerHTML={{ __html: content }}
                        />

                        {!expanded && (
                            <div className="relative -mt-10 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                        )}

                        <div className="flex justify-center mt-4">
                            <button
                                onClick={() => setExpanded(v => !v)}
                                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300 text-sm"
                            >
                                {expanded ? 'Read Less' : 'Read More'}
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                    className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}
