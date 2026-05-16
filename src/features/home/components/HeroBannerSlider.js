'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useEnquireNow } from '@/lib/EnquireNowContext';

export default function HeroBannerSlider({ slides = [] }) {
    const { openEnquire } = useEnquireNow();
    const [current, setCurrent] = useState(0);

    const next = useCallback(() => {
        setCurrent((c) => (c + 1) % slides.length);
    }, [slides.length]);

    const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [slides.length, next]);

    if (!slides.length) return null;

    const slide = slides[current];
    const desktopSrc = slide.desktopBanner || slide.mobileBanner;
    const mobileSrc = slide.mobileBanner || slide.desktopBanner;

    return (
        <section className="relative w-full overflow-hidden bg-black">
            {/* Desktop image */}
            {desktopSrc && (
                <div className="hidden md:block w-full">
                    <Image
                        src={desktopSrc}
                        alt={slide.title}
                        width={1920}
                        height={800}
                        className="w-full object-cover"
                        priority
                        unoptimized
                    />
                </div>
            )}

            {/* Mobile image */}
            {mobileSrc && (
                <div className="block md:hidden w-full">
                    <Image
                        src={mobileSrc}
                        alt={slide.title}
                        width={800}
                        height={600}
                        className="w-full object-cover"
                        priority
                        unoptimized
                    />
                </div>
            )}

            {/* Bottom gradient for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-[5] pointer-events-none" />

            {/* Project info overlay — centered */}
            <div className="absolute bottom-12 left-0 right-0 z-10 flex flex-col items-center text-center px-4 gap-3">

                {/* New Launch badge */}
                <span className="inline-block bg-[#b27e02] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    New Launch
                </span>

                {/* Title */}
                <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight [text-shadow:0_2px_8px_rgba(0,0,0,0.8)]">
                    {slide.title}
                </h2>

                {/* Address */}
                {slide.projectAddress && (
                    <p className="text-sm md:text-base text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                        {slide.projectAddress}
                    </p>
                )}

                {/* Price */}
                <p className="text-lg md:text-2xl font-bold text-[#f0d090] [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
                    {slide.price ? `${slide.price} Cr*` : 'On Request'}
                </p>

                {/* Buttons */}
                <div className="flex gap-3 mt-1">
                    <button
                        onClick={() => openEnquire({
                            image: slide.desktopBanner || slide.mobileBanner || null,
                            projectTitle: slide.title,
                            source: 'Hero Banner',
                        })}
                        className="px-6 py-2.5 bg-[#b27e02] hover:bg-[#8a6002] text-white font-semibold rounded-lg transition text-sm md:text-base shadow-lg"
                    >
                        Enquire Now
                    </button>
                    <a
                        href={slide.slug ? `/${slide.slug}` : '#'}
                        className="px-6 py-2.5 border-2 border-white text-white hover:bg-white hover:text-black font-semibold rounded-lg transition text-sm md:text-base"
                    >
                        View Details
                    </a>
                </div>
            </div>

            {/* Prev / Next arrows */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition z-10"
                        aria-label="Previous"
                    >
                        &#8592;
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full w-10 h-10 flex items-center justify-center transition z-10"
                        aria-label="Next"
                    >
                        &#8594;
                    </button>

                    {/* Box indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-3 rounded-sm transition-all duration-300 ${i === current ? 'w-8 bg-[#b27e02]' : 'w-4 bg-white/50 hover:bg-white/80'}`}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
