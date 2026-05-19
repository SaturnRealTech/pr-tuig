'use client';

import Image from 'next/image';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import NavbarClient from '@/features/home/components/NavbarClient';
import { useState, useRef, useEffect } from 'react';
import { useEnquireNow } from '@/lib/EnquireNowContext';

function LeafletMap({ lat, lng, title }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        import('leaflet').then(({ default: L }) => {
            import('leaflet/dist/leaflet.css');

            const map = L.map(containerRef.current, {
                center: [lat, lng],
                zoom: 15,
                scrollWheelZoom: false,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);

            const icon = L.divIcon({
                className: '',
                html: `<div style="position:relative;width:36px;height:48px;">
                    <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 0C8.059 0 0 8.059 0 18c0 12.75 18 30 18 30S36 30.75 36 18C36 8.059 27.941 0 18 0z" fill="#b27e02"/>
                        <circle cx="18" cy="18" r="8" fill="white"/>
                        <circle cx="18" cy="18" r="4" fill="#b27e02"/>
                    </svg>
                </div>`,
                iconSize: [36, 48],
                iconAnchor: [18, 48],
                tooltipAnchor: [0, -50],
            });

            const marker = L.marker([lat, lng], { icon }).addTo(map);
            marker.bindTooltip(title, {
                permanent: false,
                direction: 'top',
                className: 'leaflet-project-tooltip',
                offset: [0, -4],
            });

            mapRef.current = map;
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [lat, lng, title]);

    return <div ref={containerRef} style={{ height: '420px', width: '100%', zIndex: 0 }} />;
}

function hasContent(html) {
    if (!html) return false;
    return html.replace(/<[^>]*>/g, '').trim().length > 0;
}

function processContent(html) {
    if (!html) return html;
    return html
        .replace(
            /(<table[\s\S]*?<\/table>)/gi,
            '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;margin:0.5rem 0;">$1</div>'
        )
        .replace(/<img(?![^>]*\bloading\b)/gi, '<img loading="lazy"');
}

function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) return url;
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return null;
}

export default function ProjectDetailPage({ project, isHome = false }) {
    const { openEnquire } = useEnquireNow();
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedFAQs, setExpandedFAQs] = useState({});
    const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
    const [blogs, setBlogs] = useState([]);
    const [visibleBlogs, setVisibleBlogs] = useState(30);
    const [activeSection, setActiveSection] = useState('');


    const toBlockId = (title) =>
        (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const detailedBlocks = (!project?.hideDetailedOverview && project?.detailedOverview?.length > 0)
        ? project.detailedOverview
            .filter(b => b.title || b.content || b.image)
            .map((b, i) => ({ id: b.title ? toBlockId(b.title) : `block-${i}`, label: b.title || 'Section' }))
        : [];

    const sectionNav = [
        ...detailedBlocks.map(b => ({ ...b, show: true })),
        { id: 'faqs', label: 'FAQs', show: !project?.hideFAQs && project?.faqs?.length > 0 },
        { id: 'blogs', label: 'Blogs', show: isHome && !project?.hideBlogs },
    ].filter(item => item.show);

    const scrollToSection = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const mainNav = document.querySelector('nav');
        const navBar = document.getElementById('section-sticky-nav');
        const offset = (mainNav ? mainNav.offsetHeight : 64) + (navBar ? navBar.offsetHeight : 49) + 16;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        window.history.pushState(null, '', `#${id}`);
        setActiveSection(id);
    };

    useEffect(() => {
        const ids = [
            'overview',
            ...(project?.detailedOverview?.filter(b => b.title || b.content || b.image)
                .map((b, i) => b.title ? toBlockId(b.title) : `block-${i}`) || []),
            'faqs',
            'blogs',
        ];
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                        window.history.replaceState(null, '', `#${entry.target.id}`);
                    }
                });
            },
            { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
        );
        ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetch('/api/blog')
            .then(r => r.json())
            .then(d => { if (d.success) setBlogs(d.data); })
            .catch(() => { });
    }, []);
    const [lightboxIndex, setLightboxIndex] = useState(null);
    const [copied, setCopied] = useState(false);
    const [galleryIdx, setGalleryIdx] = useState(0);
    const galleryTrackRef = useRef(null);

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Project Not Found</h1>
                    {/* <a href="/projects" className="text-[#b27e02] hover:underline">← Back to Projects</a> */}
                </div>
            </div>
        );
    }

    const desktopBanner = project.desktopBanner || project.image;
    const mobileBanner = project.mobileBanner || project.image;
    const hasBanner = desktopBanner || mobileBanner;

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon projectName={project.title} />
            <NavbarClient />

            {/* Hero Banner */}
            {hasBanner ? (
                <div className="relative w-full h-[85vh] overflow-hidden bg-black">
                    {/* Mobile: LCP image — priority + high quality */}
                    {mobileBanner ? (
                        <Image
                            src={mobileBanner}
                            alt={project.title}
                            fill
                            priority
                            fetchpriority="high"
                            quality={65}
                            sizes="100vw"
                            className="block md:hidden object-cover"
                        />
                    ) : desktopBanner && (
                        <Image
                            src={desktopBanner}
                            alt={project.title}
                            fill
                            priority
                            fetchpriority="high"
                            quality={65}
                            sizes="100vw"
                            className="block md:hidden object-cover"
                        />
                    )}
                    {/* Desktop: lazy — not visible on mobile, no need to block LCP */}
                    {desktopBanner ? (
                        <Image
                            src={desktopBanner}
                            alt={project.title}
                            fill
                            loading="lazy"
                            quality={75}
                            sizes="(min-width: 768px) 100vw, 0vw"
                            className="hidden md:block object-cover"
                        />
                    ) : mobileBanner && (
                        <Image
                            src={mobileBanner}
                            alt={project.title}
                            fill
                            loading="lazy"
                            quality={75}
                            sizes="(min-width: 768px) 100vw, 0vw"
                            className="hidden md:block object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 w-full px-4 md:px-0 md:w-[77%] mx-auto pb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">{project.title}</h1>
                            <div className="flex items-center gap-3 flex-wrap mt-2">
                                {project.projectAddress && (
                                    <span className="text-gray-300 text-sm flex items-center gap-1">
                                        <span>📍</span> {project.projectAddress}
                                    </span>
                                )}
                                {project.price && (
                                    <span className="bg-[#b27e02] text-white text-sm font-bold px-3 py-1 rounded-full">
                                        {project.price} Cr*
                                    </span>
                                )}
                            </div>
                            {project.reraNo && (
                                <p className="text-gray-400 text-xs font-mono mt-2">RERA: {project.reraNo}</p>
                            )}
                            <button
                                onClick={() => openEnquire({ title: project.title, source: 'Get Details', image: desktopBanner || mobileBanner })}
                                className="mt-3 flex md:hidden items-center gap-2 px-5 py-3 bg-[#b27e02] hover:bg-[#8a6002] text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-300"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                                Get Details
                            </button>
                        </div>
                        <button
                            onClick={() => openEnquire({ title: project.title, source: 'Get Details', image: desktopBanner || mobileBanner })}
                            className="hidden md:flex flex-shrink-0 items-center gap-2 px-5 py-3 bg-[#b27e02] hover:bg-[#8a6002] text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-300"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            Get Details
                        </button>
                    </div>
                </div>
            ) : (
                <section className="bg-gradient-to-r from-[#b27e02] to-[#6b4a01] text-white pt-28 pb-14">
                    <div className="w-full px-4 md:px-0 md:w-[77%] mx-auto">
                        <h1 className="text-4xl md:text-5xl font-bold mb-2">{project.title}</h1>
                        {project.projectAddress && (
                            <p className="text-[#faf0d0] mt-1 flex items-center gap-1">
                                <span>📍</span> {project.projectAddress}
                            </p>
                        )}
                    </div>
                </section>
            )}

            <section className="py-20 bg-white">
                <div className="w-full px-4 md:px-0 md:w-[77%] mx-auto">
                    {!project.hideContent && (project.contentTitle || project.contentImage || project.content) && (
                        <div id="overview">
                            {project.contentTitle && (
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{project.contentTitle}</h2>
                                    <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                                </div>
                            )}

                            {project.contentImage && (
                                <div className="mb-8 rounded-xl overflow-hidden shadow-md">
                                    <img
                                        src={project.contentImage}
                                        alt={project.contentTitle || project.title}
                                        loading="lazy"
                                        className="w-full max-h-[480px] object-cover"
                                    />
                                </div>
                            )}

                            {project.content && (
                                <>
                                    <div
                                        className={`rich-content text-black text-lg md:text-xl overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[9999px]' : 'max-h-[800px]'}`}
                                        dangerouslySetInnerHTML={{ __html: processContent(project.content) }}
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
                                </>
                            )}
                        </div>
                    )}

                    {/* Key Highlights */}
                    {!project.hideKeyHighlights && hasContent(project.keyHighlights) && (
                        <div id="key-highlights" className="mt-16 mb-16">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    {project.keyHighlightsTitle || 'Key Highlights'}
                                </h2>
                                <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                            </div>
                            <div
                                className="rich-content text-gray-800 text-base md:text-lg"
                                dangerouslySetInnerHTML={{ __html: processContent(project.keyHighlights) }}
                            />
                        </div>
                    )}

                    {/* CTA Button */}
                    {project.ctaButtonText && (
                        <div className="mb-16 flex justify-center">
                            <button
                                type="button"
                                onClick={() => openEnquire({ title: project.title, source: project.ctaButtonText, image: desktopBanner || mobileBanner })}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] text-white text-sm font-semibold rounded-lg hover:bg-[#8a6002] transition-all duration-300"
                            >
                                {project.ctaButtonText}
                            </button>
                        </div>
                    )}

                    {/* Walkthrough Video */}
                    {!project.hideWalkthrough && project.walkthroughUrl && getYouTubeEmbedUrl(project.walkthroughUrl) && (
                        <div id="walkthrough" className="mb-16">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    {project.walkthroughTitle || 'Walkthrough Video'}
                                </h2>
                                <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                            </div>
                            {project.walkthroughDuration && (
                                <p className="text-sm text-gray-500 text-center mb-6">Duration: {project.walkthroughDuration}</p>
                            )}
                            <div className="relative w-full rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    src={getYouTubeEmbedUrl(project.walkthroughUrl)}
                                    title="Walkthrough Video"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="absolute inset-0 w-full h-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* Configurations */}
                    {!project.hideConfigurations && hasContent(project.configurations) && (
                        <div id="configurations" className="mb-16">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    {project.configurationsTitle || 'Configurations'}
                                </h2>
                                <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                            </div>
                            <div
                                className="rich-content text-gray-800 text-base md:text-lg"
                                dangerouslySetInnerHTML={{ __html: processContent(project.configurations) }}
                            />
                            {project.configurationsCtaLabel && (
                                <div className="flex justify-center mt-8">
                                    <button
                                        type="button"
                                        onClick={() => openEnquire({ title: project.title, source: project.configurationsCtaLabel, image: desktopBanner || mobileBanner })}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] text-white text-sm font-semibold rounded-lg hover:bg-[#8a6002] transition-all duration-300"
                                    >
                                        {project.configurationsCtaLabel}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Amenities */}
                    {!project.hideAmenities && (project.amenities?.length > 0 || hasContent(project.amenitiesContent)) && (
                        <div id="amenities" className="mb-16">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                    {project.amenitiesTitle || 'Amenities'}
                                </h2>
                                <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                            </div>
                            {project.amenities?.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 mb-10">
                                    {project.amenities.filter(a => a.icon || a.label).map((amenity, i) => (
                                        <div key={i} className="group flex flex-col items-center gap-3 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-[#b27e02] transition-all duration-300 cursor-default">
                                            {amenity.icon && (
                                                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#fef9e7] group-hover:bg-[#b27e02] transition-colors duration-300 p-2">
                                                    <img
                                                        src={amenity.icon}
                                                        alt={amenity.alt || amenity.label || 'amenity'}
                                                        loading="lazy"
                                                        className="w-full h-full object-contain group-hover:brightness-0 group-hover:invert transition-all duration-300"
                                                    />
                                                </div>
                                            )}
                                            {amenity.label && (
                                                <span className="text-xs font-semibold text-center leading-snug text-gray-600 group-hover:text-[#b27e02] transition-colors duration-300">{amenity.label}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {hasContent(project.amenitiesContent) && (
                                <div className="bg-[#fef9e7] rounded-2xl p-6 md:p-8 border border-[#b27e02]/20">
                                    <div
                                        className="rich-content text-gray-800 text-base md:text-lg"
                                        dangerouslySetInnerHTML={{ __html: processContent(project.amenitiesContent) }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Master Plan & Floor Plan */}
                    {!project.hideMasterFloorPlan && (() => {
                        const mfp = project.masterFloorPlan;
                        if (!mfp) return null;
                        const masterList = mfp.masterPlans?.filter(p => p.image) || [];
                        const floorList = mfp.floorPlans?.filter(p => p.image) || [];
                        if (!masterList.length && !floorList.length && !hasContent(mfp.content)) return null;

                        const PlanCard = ({ plan, fallbackAlt }) => {
                            return (
                                <div className="relative overflow-hidden rounded-xl group">
                                    <img
                                        src={plan.image}
                                        alt={plan.alt || fallbackAlt}
                                        className="w-full h-full object-cover blur-sm scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/40" />
                                    {plan.ctaText && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <button
                                                type="button"
                                                onClick={() => openEnquire({ title: project.title, source: plan.ctaText, image: desktopBanner || mobileBanner })}
                                                className="px-5 py-2.5 bg-[#b27e02] hover:bg-[#8a6002] text-white font-semibold text-sm rounded-lg transition-colors duration-300 shadow-lg"
                                            >
                                                {plan.ctaText}
                                            </button>
                                        </div>
                                    )}
                                    {plan.label && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-[#b27e02] text-white text-center py-2.5 text-sm font-semibold tracking-wide">
                                            {plan.label}
                                        </div>
                                    )}
                                </div>
                            );
                        };

                        return (
                            <div id="master-floor-plan" className="mb-16">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                        {mfp.title || 'Master Plan & Floor Plan'}
                                    </h2>
                                    <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                                </div>

                                {hasContent(mfp.content) && (
                                    <div className="mb-10">
                                        <div className="rich-content text-gray-800 text-base md:text-lg"
                                            dangerouslySetInnerHTML={{ __html: processContent(mfp.content) }} />
                                    </div>
                                )}

                                {masterList.length > 0 && (
                                    <div className={floorList.length > 0 ? 'mb-12' : ''}>
                                        <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                            <span className="w-1 h-6 rounded-full bg-[#b27e02] inline-block" />
                                            Master Plan
                                        </h3>
                                        {masterList.length === 1 ? (
                                            <div className="relative overflow-hidden rounded-xl h-[420px] md:h-[540px]">
                                                <Image src={masterList[0].image} alt={masterList[0].alt || 'Master Plan'} fill sizes="100vw" className="object-cover blur-sm scale-105" />
                                                <div className="absolute inset-0 bg-black/50" />
                                                {masterList[0].ctaText && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <button type="button"
                                                            onClick={() => openEnquire({ title: project.title, source: masterList[0].ctaText, image: desktopBanner || mobileBanner })}
                                                            className="px-6 py-3 bg-[#b27e02] hover:bg-[#8a6002] text-white font-semibold text-base rounded-lg transition-colors duration-300 shadow-lg">
                                                            {masterList[0].ctaText}
                                                        </button>
                                                    </div>
                                                )}
                                                {masterList[0].label && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-[#b27e02] text-white text-center py-3 text-base font-semibold tracking-wide">
                                                        {masterList[0].label}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {masterList.map((plan, i) => (
                                                    <div key={i} className="h-52 md:h-64">
                                                        <PlanCard plan={plan} fallbackAlt={`Master Plan ${i + 1}`} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {floorList.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                                            <span className="w-1 h-6 rounded-full bg-[#b27e02] inline-block" />
                                            Floor Plan
                                        </h3>
                                        {floorList.length === 1 ? (
                                            <div className="relative overflow-hidden rounded-xl h-[420px] md:h-[540px]">
                                                <Image src={floorList[0].image} alt={floorList[0].alt || 'Floor Plan'} fill sizes="100vw" className="object-cover blur-sm scale-105" />
                                                <div className="absolute inset-0 bg-black/50" />
                                                {floorList[0].ctaText && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <button type="button"
                                                            onClick={() => openEnquire({ title: project.title, source: floorList[0].ctaText, image: desktopBanner || mobileBanner })}
                                                            className="px-6 py-3 bg-[#b27e02] hover:bg-[#8a6002] text-white font-semibold text-base rounded-lg transition-colors duration-300 shadow-lg">
                                                            {floorList[0].ctaText}
                                                        </button>
                                                    </div>
                                                )}
                                                {floorList[0].label && (
                                                    <div className="absolute bottom-0 left-0 right-0 bg-[#b27e02] text-white text-center py-3 text-base font-semibold tracking-wide">
                                                        {floorList[0].label}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {floorList.map((plan, i) => (
                                                    <div key={i} className="h-52 md:h-64">
                                                        <PlanCard plan={plan} fallbackAlt={`Floor Plan ${i + 1}`} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Gallery */}
                    {!project.hideGallery && (() => {
                        const gallery = project.gallery;
                        if (!gallery) return null;
                        const imgs = gallery.images?.filter(i => i.image) || [];
                        if (!imgs.length && !hasContent(gallery.content)) return null;
                        const perPage = 4;
                        const maxIdx = Math.max(0, imgs.length - perPage);
                        const canPrev = galleryIdx > 0;
                        const canNext = galleryIdx < maxIdx;
                        const scrollTo = (idx) => {
                            setGalleryIdx(idx);
                            if (galleryTrackRef.current) {
                                const itemW = galleryTrackRef.current.offsetWidth / perPage;
                                galleryTrackRef.current.scrollTo({ left: idx * itemW, behavior: 'smooth' });
                            }
                        };
                        return (
                            <div id="gallery" className="mb-16">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                        {gallery.title || 'Gallery'}
                                    </h2>
                                    <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                                </div>

                                {hasContent(gallery.content) && (
                                    <div className="mb-8">
                                        <div
                                            className={`rich-content text-gray-800 text-base md:text-lg overflow-hidden transition-all duration-500 ${isGalleryExpanded ? 'max-h-[9999px]' : 'max-h-[4.5rem]'}`}
                                            dangerouslySetInnerHTML={{ __html: processContent(gallery.content) }}
                                        />
                                        {!isGalleryExpanded && (
                                            <div className="relative -mt-6 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                        )}
                                        <div className="flex justify-center mt-3">
                                            <button
                                                onClick={() => setIsGalleryExpanded(v => !v)}
                                                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300 text-sm"
                                            >
                                                {isGalleryExpanded ? 'Read Less' : 'Read More'}
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                                                    className={`transition-transform duration-300 ${isGalleryExpanded ? 'rotate-180' : ''}`}>
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {imgs.length > 0 && (
                                    <div className="relative overflow-hidden">
                                        {/* Left arrow */}
                                        <button
                                            onClick={() => scrollTo(Math.max(0, galleryIdx - 1))}
                                            disabled={!canPrev}
                                            className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full border shadow-md transition-all duration-200 ${canPrev ? 'bg-white border-gray-200 hover:bg-[#b27e02] hover:border-[#b27e02] hover:text-white text-gray-700' : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'}`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                                        </button>

                                        {/* Track */}
                                        <div
                                            ref={galleryTrackRef}
                                            className="flex overflow-x-hidden gap-3"
                                        >
                                            {imgs.map((img, i) => (
                                                <div key={i} className="flex-shrink-0 w-[calc(25%-9px)] md:w-[calc(25%-9px)] sm:w-[calc(50%-6px)]">
                                                    <div className="overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxIndex(i)}>
                                                        <img
                                                            src={img.image}
                                                            alt={img.alt || `Gallery ${i + 1}`}
                                                            loading="lazy"
                                                            className="w-full h-56 md:h-64 object-cover hover:scale-105 transition-transform duration-500"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Right arrow */}
                                        <button
                                            onClick={() => scrollTo(Math.min(maxIdx, galleryIdx + 1))}
                                            disabled={!canNext}
                                            className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full border shadow-md transition-all duration-200 ${canNext ? 'bg-white border-gray-200 hover:bg-[#b27e02] hover:border-[#b27e02] hover:text-white text-gray-700' : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'}`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Project Specifications */}
                    {!project.hideProjectSpecifications && (() => {
                        const ps = project.projectSpecifications;
                        if (!ps) return null;
                        const validSpecs = ps.specs?.filter(s => s.title || hasContent(s.content)) || [];
                        if (!validSpecs.length && !ps.ctaLabel && !hasContent(ps.content)) return null;
                        return (
                            <div id="specifications" className="mb-16">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                        {ps.title || 'Project Specifications'}
                                    </h2>
                                    <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                                </div>
                                {hasContent(ps.content) && (
                                    <div className="rich-content text-gray-700 text-base md:text-lg mb-8"
                                        dangerouslySetInnerHTML={{ __html: processContent(ps.content) }} />
                                )}
                                {validSpecs.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        {validSpecs.map((spec, i) => (
                                            <div key={i} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
                                                {spec.title && (
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-8 h-8 rounded-lg bg-[#b27e02] flex items-center justify-center flex-shrink-0">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-gray-900">{spec.title}</h3>
                                                    </div>
                                                )}
                                                {hasContent(spec.content) && (
                                                    <div className="rich-content text-gray-700 text-sm leading-relaxed"
                                                        dangerouslySetInnerHTML={{ __html: processContent(spec.content) }} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {ps.ctaLabel && (
                                    <div className="flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => openEnquire({ title: project.title, source: ps.ctaLabel, image: desktopBanner || mobileBanner })}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] hover:bg-[#8a6002] text-white text-sm font-semibold rounded-lg transition-colors duration-300"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                                <polyline points="10 9 9 9 8 9" />
                                            </svg>
                                            {ps.ctaLabel}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {/* Location */}
                    {!project.hideLocation && ((project.lat && project.lng) || hasContent(project.location?.content)) ? (() => {
                        const loc = project.location || {};
                        const hasMap = project.lat && project.lng;
                        return (
                            <div id="location" className="mb-16">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                                        {loc.title || 'Location and Connectivity'}
                                    </h2>
                                    <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                                </div>

                                {hasMap && (
                                    <div className="overflow-hidden rounded-xl mb-8">
                                        <LeafletMap
                                            lat={parseFloat(project.lat)}
                                            lng={parseFloat(project.lng)}
                                            title={project.title}
                                        />
                                    </div>
                                )}

                                {hasContent(loc.content) && (
                                    <div>
                                        <div
                                            className="rich-content text-gray-800 text-base md:text-lg"
                                            dangerouslySetInnerHTML={{ __html: processContent(loc.content) }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })() : null}

                    {project.technologies && project.technologies.length > 0 && (
                        <div className="mb-16">
                            <h3 className="text-2xl md:text-3xl font-bold text-black mb-6">Technologies Used</h3>
                            <div className="flex flex-wrap gap-3">
                                {project.technologies.map((tech, idx) => (
                                    <div key={idx} className="px-5 py-2 bg-[#faf0d0] text-[#8a6002] rounded-lg font-semibold">
                                        {tech}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(project.liveUrl || project.githubUrl) && (
                        <div className="mb-16">
                            <h3 className="text-2xl md:text-3xl font-bold text-black mb-6">Project Links</h3>
                            <div className="flex flex-wrap gap-4">
                                {project.liveUrl && (
                                    <a
                                        href={project.liveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-[#b27e02] text-white rounded-lg font-semibold hover:bg-[#8a6002] transition flex items-center gap-2"
                                    >
                                        Visit Live Site
                                    </a>
                                )}
                                {project.githubUrl && (
                                    <a
                                        href={project.githubUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2"
                                    >
                                        View on GitHub
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                    {/* Project Detailed Overview — section nav + blocks */}
                    {isHome && !project.hideDetailedOverview && sectionNav.length > 0 && (
                        <div
                            id="section-sticky-nav"
                            className="border-t border-b border-gray-200 mb-12"
                        >
                            <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {sectionNav.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => scrollToSection(item.id)}
                                        className={`flex-shrink-0 px-5 py-4 text-sm font-semibold border-b-2 transition-colors duration-200 whitespace-nowrap ${activeSection === item.id ? 'border-[#b27e02] text-[#b27e02]' : 'border-transparent text-gray-600 hover:text-[#b27e02] hover:border-[#b27e02]/40'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {!project.hideDetailedOverview && project.detailedOverview?.map((block, i) => {
                        if (!block.title && !hasContent(block.content) && !block.image) return null;
                        const blockId = block.title ? toBlockId(block.title) : `block-${i}`;
                        return (
                            <div key={i} id={blockId} className="mb-16">
                                {block.title && (
                                    <div className="text-center mb-6">
                                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{block.title}</h2>
                                        <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                                    </div>
                                )}
                                {block.image && (
                                    <div className="mb-8 flex items-center justify-center h-72 md:h-[480px]">
                                        <img
                                            src={block.image}
                                            alt={block.imageAlt || block.title || ''}
                                            loading="lazy"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                )}
                                {hasContent(block.content) && (
                                    <div
                                        className="rich-content text-gray-800 text-base md:text-lg leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: processContent(block.content) }}
                                    />
                                )}
                            </div>
                        );
                    })}

                    {!project.hideFAQs && project.faqs && project.faqs.length > 0 && (
                        <div id="faqs" className="mb-16">
                            <h3 className="text-2xl md:text-3xl font-bold text-black mb-8">Frequently Asked Questions</h3>
                            <div className="space-y-4">
                                {project.faqs.map((faq, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
                                        <button
                                            onClick={() => setExpandedFAQs(prev => ({
                                                ...prev,
                                                [index]: !prev[index]
                                            }))}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
                                        >
                                            <div
                                                className="font-semibold text-gray-800 pr-4 flex-1 rich-content [&_a]:text-[#b27e02] [&_a]:underline [&_strong]:font-bold [&_em]:italic"
                                                dangerouslySetInnerHTML={{ __html: processContent(faq.question) }}
                                            />
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                className={`text-[#b27e02] flex-shrink-0 transition-transform duration-300 ${expandedFAQs[index] ? 'rotate-180' : ''}`}>
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                        {expandedFAQs[index] && (
                                            <div className="p-4 bg-white border-t border-gray-200">
                                                <div
                                                    className="rich-content text-gray-700 text-base leading-relaxed [&_a]:text-[#b27e02] [&_a]:underline [&_strong]:font-bold [&_em]:italic"
                                                    dangerouslySetInnerHTML={{ __html: processContent(faq.answer) }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Latest Blogs — home page only */}
                    {isHome && !project.hideBlogs && blogs.length > 0 && (
                        <div id="blogs" className="mb-16">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Latest Blog</h2>
                                <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {blogs.slice(0, visibleBlogs).map((blog, i) => {
                                    const blogSlug = blog.slug || blog._id?.toString();
                                    return (
                                        <a key={i} href={`/blog/${blogSlug}`}
                                            className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                                            <div className="relative overflow-hidden h-48 bg-gray-100 flex-shrink-0">
                                                {(() => {
                                                    const isImgSrc = (v) => v && typeof v === 'string' && (v.startsWith('http') || v.startsWith('/'));
                                                    const imgUrl = isImgSrc(blog.heroImage) ? blog.heroImage : isImgSrc(blog.image) ? blog.image : null;
                                                    return imgUrl ? (
                                                        <Image src={imgUrl} alt={blog.title} fill
                                                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                                            className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-5xl bg-[#fef9e7]">📝</div>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex flex-col flex-1 p-5">
                                                {blog.category && (
                                                    <span className="inline-block self-start px-3 py-1 rounded-full text-xs font-semibold bg-[#b27e02]/10 text-[#b27e02] mb-3">
                                                        {blog.category}
                                                    </span>
                                                )}
                                                <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-[#b27e02] transition-colors duration-200 line-clamp-2">
                                                    {blog.title}
                                                </h3>
                                                {blog.excerpt && (
                                                    <p className="text-sm text-gray-500 line-clamp-2 flex-1">{blog.excerpt}</p>
                                                )}
                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                                    <span className="text-xs text-gray-400">{blog.date || ''}</span>
                                                    <span className="text-xs font-semibold text-[#b27e02] group-hover:underline">Read More →</span>
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                            {blogs.length > visibleBlogs && (
                                <div className="flex justify-center mt-10">
                                    <button
                                        onClick={() => setVisibleBlogs(v => v + blogs.length)}
                                        className="inline-flex items-center gap-2 px-8 py-3 border-2 border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300 text-sm"
                                    >
                                        Load More
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {!project.hideEnquireCTA && <div className="bg-gradient-to-r from-[#b27e02] to-[#8a6002] text-white p-8 md:p-12 rounded-xl text-center">
                        <h3 className="text-2xl md:text-3xl font-bold mb-4">Interested in This Project?</h3>
                        <p className="text-[#faf0d0] mb-8 text-lg">Get in touch with us to know more about pricing, availability, and site visits.</p>
                        <button
                            onClick={() => openEnquire({
                                image: desktopBanner || mobileBanner,
                                projectTitle: project.title,
                                source: 'Project Detail',
                            })}
                            className="inline-block px-8 py-3 bg-white text-[#b27e02] rounded-lg font-bold border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300"
                        >
                            Enquire Now
                        </button>
                    </div>}
                </div>
            </section>

            <Footer />

            {/* Gallery Lightbox Modal */}
            {lightboxIndex !== null && (() => {
                const galleryImgs = project.gallery?.images?.filter(img => img.image) || [];
                const current = galleryImgs[lightboxIndex];
                if (!current) return null;
                const hasPrev = lightboxIndex > 0;
                const hasNext = lightboxIndex < galleryImgs.length - 1;
                const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
                const handleCopy = () => {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                    });
                };
                return (
                    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={() => setLightboxIndex(null)}>
                        {/* Top bar */}
                        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
                            <span className="text-white/70 text-sm font-medium">{lightboxIndex + 1} / {galleryImgs.length}</span>
                            <button onClick={() => setLightboxIndex(null)}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-bold transition">✕</button>
                        </div>

                        {/* Image + side arrows */}
                        <div className="flex-1 flex items-center justify-center relative px-16 min-h-0" onClick={e => e.stopPropagation()}>
                            {hasPrev && (
                                <button onClick={() => setLightboxIndex(i => i - 1)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#b27e02] text-white transition-all duration-200 border border-white/10">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
                                </button>
                            )}

                            <img
                                src={current.image}
                                alt={current.alt || `Gallery image ${lightboxIndex + 1}`}
                                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                style={{ maxHeight: 'calc(100vh - 200px)' }}
                            />

                            {hasNext && (
                                <button onClick={() => setLightboxIndex(i => i + 1)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#b27e02] text-white transition-all duration-200 border border-white/10">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
                                </button>
                            )}
                        </div>

                        {/* Alt text */}
                        {current.alt && (
                            <p className="text-center text-white/50 text-sm px-4 pt-3 flex-shrink-0" onClick={e => e.stopPropagation()}>{current.alt}</p>
                        )}

                        {/* Share bar */}
                        <div className="flex-shrink-0 px-5 py-4" onClick={e => e.stopPropagation()}>
                            <p className="text-white/50 text-xs text-center mb-3 uppercase tracking-widest">Share</p>
                            <div className="flex items-center justify-center gap-3 flex-wrap">
                                {/* Copy Link */}
                                <button onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition">
                                    {copied ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                    )}
                                    {copied ? 'Copied!' : 'Copy Link'}
                                </button>

                                {/* WhatsApp */}
                                <a href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/40 text-[#25D366] text-sm font-medium transition">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.535 5.862L0 24l6.272-1.519A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.359-.213-3.724.901.939-3.617-.234-.372A9.818 9.818 0 0 1 2.182 12c0-5.42 4.398-9.818 9.818-9.818 5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z" /></svg>
                                    WhatsApp
                                </a>

                                {/* Facebook */}
                                <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/40 text-[#1877F2] text-sm font-medium transition">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                    Facebook
                                </a>

                                {/* X / Twitter */}
                                <a href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                    X
                                </a>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
