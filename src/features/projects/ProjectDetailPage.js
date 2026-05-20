"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";
// import VersionSwitcher from "../VersionSwitcher";
import { useEnquireNow } from "@/lib/EnquireNowContext";

function LeafletMap({ lat, lng, title }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        if (lat == null || lng == null || isNaN(Number(lat)) || isNaN(Number(lng))) return;

        let cancelled = false;
        (async () => {
            const [{ default: L }] = await Promise.all([
                import("leaflet"),
                import("leaflet/dist/leaflet.css"),
            ]);
            if (cancelled || !containerRef.current) return;

            const map = L.map(containerRef.current, {
                center: [Number(lat), Number(lng)],
                zoom: 15,
                scrollWheelZoom: false,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map);

            const icon = L.divIcon({
                className: "",
                html: `<svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 0C8.059 0 0 8.059 0 18c0 12.75 18 30 18 30S36 30.75 36 18C36 8.059 27.941 0 18 0z" fill="#c89d3c"/>
                    <circle cx="18" cy="18" r="8" fill="#f5efe2"/>
                    <circle cx="18" cy="18" r="4" fill="#1e3a2c"/>
                </svg>`,
                iconSize: [36, 48],
                iconAnchor: [18, 48],
            });

            const marker = L.marker([Number(lat), Number(lng)], { icon }).addTo(map);
            if (title) {
                marker.bindTooltip(title, { permanent: false, direction: "top", offset: [0, -4] });
            }

            mapRef.current = map;
        })();

        return () => {
            cancelled = true;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [lat, lng, title]);

    return <div ref={containerRef} className="w-full h-[420px] rounded-2xl overflow-hidden border border-[#1e3a2c]/10" />;
}

// Convert a section title into a URL-safe id (matches the commented legacy logic).
function toBlockId(title) {
    return (title || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// Format an ISO/parseable date as "DD MMM YYYY" (e.g. "20 Oct 2026"). Falls back to raw string.
function formatDate(raw) {
    if (!raw) return "";
    const s = String(raw).trim();
    if (!s) return "";
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// Append " Cr*" to a raw price value unless it already specifies a unit (Cr / Lakh).
function formatPrice(raw) {
    if (raw == null) return "";
    const s = String(raw).trim();
    if (!s) return "";
    return /\b(cr|crore|lakh|lac)\b/i.test(s) ? s : `${s} Cr*`;
}

// Split the title so the last word can be italicised in gold (e.g. "Tangled Up [in Green]").
function splitTitle(title) {
    if (!title) return { lead: "", tail: "" };
    const parts = title.trim().split(/\s+/);
    if (parts.length === 1) return { lead: "", tail: parts[0] };
    if (parts.length <= 3) return { lead: parts.slice(0, -1).join(" "), tail: parts.slice(-1).join(" ") };
    // For longer titles, italicise the last two words.
    return { lead: parts.slice(0, -2).join(" "), tail: parts.slice(-2).join(" ") };
}


export default function V7({ project, isHome, version, setVersion }) {
    return (
        <div className="flex flex-col w-full bg-[#f5efe2] text-[#1a2a1f] selection:bg-[#1e3a2c] selection:text-[#f5efe2]">
            <Nav version={version} setVersion={setVersion} />
            <Hero project={project} />
            <About project={project} />
            <ProjectDescription project={project} />
            <Highlights project={project} />
            <Pricing project={project} />
            <Amenities project={project} />
            <FloorPlans project={project} />
            <Gallery project={project} />
            <Location project={project} />
            <Specifications project={project} />
            <DetailedOverview project={project} />
            <FAQ project={project} />
            <LatestBlog project={project} />
            <Enquiry />
            <Footer />
        </div>
    );
}

function Nav({ version, setVersion }) {
    return (
        <header className="sticky top-0 z-50 bg-[#f5efe2]/95 backdrop-blur-md border-b border-[#1e3a2c]/10">
            <div className="max-w-[1300px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
                <a href="#top" className="flex flex-col leading-tight">
                    <span className="font-display font-bold text-[#1e3a2c] text-xl tracking-tight">TANGLED UP</span>
                    <span className="font-display italic text-[#c89d3c] text-sm -mt-1">in Green</span>
                </a>
                <nav className="hidden lg:flex items-center gap-6 text-[13px] text-[#1a2a1f]/85">
                    <a href="#overview" className="hover:text-[#c89d3c] transition">Overview</a>
                    <a href="#highlights" className="hover:text-[#c89d3c] transition">Highlights</a>
                    <a href="#pricing" className="hover:text-[#c89d3c] transition">Pricing</a>
                    <a href="#amenities" className="hover:text-[#c89d3c] transition">Amenities</a>
                    <a href="#floor-plans" className="hover:text-[#c89d3c] transition">Floor Plans</a>
                    <a href="#specifications" className="hover:text-[#c89d3c] transition">Specifications</a>
                    <a href="#gallery" className="hover:text-[#c89d3c] transition">Gallery</a>
                    <a href="#location" className="hover:text-[#c89d3c] transition">Location</a>
                    <a href="#faqs" className="hover:text-[#c89d3c] transition">FAQs</a>
                    <a href="#enquiry" className="hover:text-[#c89d3c] transition">Contact</a>
                </nav>
                <div className="flex items-center gap-3">
                    {/* <VersionSwitcher version={version} setVersion={setVersion} theme="v7" /> */}
                    <a href="tel:+918012345678" className="hidden md:inline-flex items-center gap-2 text-[13px] font-semibold text-[#1e3a2c] hover:text-[#c89d3c] transition">
                        <span className="w-7 h-7 rounded-full bg-[#1e3a2c] text-[#f5efe2] flex items-center justify-center text-xs">📞</span>
                        +91 80 1234 5678
                    </a>
                </div>
            </div>
        </header>
    );
}

function Hero({ project }) {
    const enquire = useEnquireNow();
    const openEnquire = enquire?.openEnquire;

    const bannerImage =
        project?.desktopBanner ||
        project?.mobileBanner ||
        project?.image ||
        "https://tangledupingreen.org/wp-content/uploads/2026/04/Tangled-up-in-Green.jpg";

    const titleParts = splitTitle(project?.title || "Tangled Up in Green");
    const tagline = project?.contentTitle || project?.metaDescription;
    const subhead = project?.projectAddress
        ? `${project.projectAddress}`
        : "";
    const launchYear = project?.createdDate ? new Date(project.createdDate).getFullYear() : null;

    const handleEnquire = (source) => {
        if (typeof openEnquire === "function") {
            openEnquire({
                title: project?.title || "Tangled Up in Green",
                source,
                image: bannerImage,
            });
        }
    };

    const stats = [
        project?.price && { l: "Starting Price", v: formatPrice(project.price) },
        project?.bhkConfig && { l: "Configurations", v: project.bhkConfig },
        project?.carpetArea && { l: "Plot Size", v: project.carpetArea },
        project?.landParcel && { l: "Land Parcel", v: project.landParcel },
        project?.totalUnits && { l: "Total Units", v: String(project.totalUnits) },
        project?.possession && { l: "Possession", v: formatDate(project.possession) },
        project?.reraNo && { l: "RERA No.", v: project.reraNo },
    ].filter(Boolean);

    const statsToShow = stats.length
        ? stats
        : [
            { l: "Starting Price", v: "₹ 4.95 Cr*" },
            { l: "Configurations", v: "3 & 4 BHK" },
            { l: "Carpet Area", v: "2,850 – 5,600 sq.ft" },
            { l: "Density", v: "Only 1 Tower on 7.5 Acres" },
            { l: "Launch Date", v: "01 Sep 2026" },
        ];

    return (
        <section id="top" className="relative">
            <div className="relative h-[680px] md:h-[760px] overflow-hidden">
                <Image
                    src={bannerImage}
                    alt={project?.title ? `Aerial view of ${project.title}` : "Hero banner"}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d1f15]/55 via-transparent to-[#0d1f15]/80" />
                <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(900px,90%)] h-[420px] bg-[radial-gradient(ellipse_at_center,rgba(13,31,21,0.6)_0%,rgba(13,31,21,0.3)_45%,transparent_70%)] pointer-events-none" />

                <div className="relative h-full max-w-[1300px] mx-auto px-6 flex flex-col justify-center items-center text-center [text-shadow:0_2px_18px_rgba(0,0,0,0.55)]">
                    <div className="flex flex-wrap items-center justify-center gap-2.5 mb-7">
                        <Badge variant="gold">★ New Launch{launchYear ? ` ${launchYear}` : ""}</Badge>
                        {project?.company && <Badge variant="cream">{project.company}</Badge>}
                        <Badge variant="gold">Pre-Launch Pricing Live</Badge>
                    </div>

                    <div className="flex items-center gap-4 text-[#c89d3c]">
                        <span className="block w-10 h-px bg-[#c89d3c]/70" />
                        <span className="text-xl">✦</span>
                        <span className="block w-10 h-px bg-[#c89d3c]/70" />
                    </div>
                    <h1 className="mt-4 font-display font-medium text-[#f5efe2] text-5xl md:text-7xl lg:text-[88px] leading-[1] tracking-tight">
                        {titleParts.lead && <>{titleParts.lead} </>}
                        <em className="text-[#c89d3c]">{titleParts.tail}</em>
                    </h1>
                    <div className="flex items-center gap-4 text-[#c89d3c] mt-4">
                        <span className="block w-10 h-px bg-[#c89d3c]/70" />
                        <span className="text-xl">✦</span>
                        <span className="block w-10 h-px bg-[#c89d3c]/70" />
                    </div>

                    <p className="mt-6 text-[#f5efe2] text-lg md:text-xl font-medium">{subhead}</p>
                    {tagline && (
                        <div className="mt-5 inline-flex items-center gap-3 max-w-3xl">
                            <span aria-hidden className="block w-8 h-px bg-[#c89d3c]" />
                            <p className="italic font-display text-[#f9f3df] text-lg md:text-xl lg:text-2xl leading-snug [text-shadow:0_2px_14px_rgba(0,0,0,0.85),0_0_2px_rgba(0,0,0,0.6)]">
                                &ldquo;{tagline}&rdquo;
                            </p>
                            <span aria-hidden className="block w-8 h-px bg-[#c89d3c]" />
                        </div>
                    )}

                    <div className="mt-9 flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleEnquire("Hero Enquire")}
                            className="inline-flex items-center gap-2 rounded-full bg-[#1e3a2c] text-[#f5efe2] px-7 py-3.5 text-sm font-semibold hover:bg-[#2a4a35] transition shadow-lg shadow-[#1e3a2c]/40"
                        >
                            Enquire Now <span aria-hidden>→</span>
                        </button>
                        {project?.brochureUrl ? (
                            <a
                                href={project.brochureUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-[#f5efe2] text-[#1e3a2c] px-7 py-3.5 text-sm font-semibold hover:bg-white transition shadow-lg"
                            >
                                Download Brochure
                            </a>
                        ) : (
                            <button
                                type="button"
                                onClick={() => handleEnquire("Download Brochure")}
                                className="inline-flex items-center gap-2 rounded-full bg-[#f5efe2] text-[#1e3a2c] px-7 py-3.5 text-sm font-semibold hover:bg-white transition shadow-lg"
                            >
                                Download Brochure
                            </button>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#f5efe2]/60 text-xs flex flex-col items-center gap-1">
                    <span>scroll</span>
                    <span className="block w-px h-6 bg-[#f5efe2]/40" />
                </div>
            </div>

            <div className="bg-[#1e3a2c] text-[#f5efe2]">
                <div className="max-w-[1300px] mx-auto px-6 grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#f5efe2]/15">
                    {statsToShow.map((s) => {
                        const isRera = /rera/i.test(s.l);
                        return (
                            <div key={s.l} className="px-5 py-5 text-center min-w-0">
                                <div className="text-[10px] uppercase tracking-[0.25em] text-[#c89d3c]">{s.l}</div>
                                <div
                                    className={
                                        isRera
                                            ? "mt-1.5 font-mono font-medium text-xs md:text-sm whitespace-nowrap"
                                            : "mt-1.5 font-display font-medium text-lg md:text-xl whitespace-nowrap"
                                    }
                                >
                                    {s.v}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function Badge({ children, variant = "gold" }) {
    const styles = {
        gold: "bg-[#c89d3c] text-[#1e3a2c] border-[#c89d3c]",
        cream: "bg-[#f5efe2]/95 text-[#1e3a2c] border-[#f5efe2]/95",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold tracking-wide border ${styles[variant]}`}>
            {children}
        </span>
    );
}

function SectionLabel({ children }) {
    return (
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6b8a72]">{children}</div>
    );
}

function SectionTitle({ children }) {
    return (
        <h2 className="mt-2 font-display font-medium text-[#1e3a2c] text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">{children}</h2>
    );
}

function About({ project }) {
    const enquire = useEnquireNow();
    const openEnquire = enquire?.openEnquire;
    const bannerImage = project?.desktopBanner || project?.mobileBanner || project?.image;

    const projectName = project?.title || "Tangled Up in Green";

    const handleEnquire = (source) => {
        if (typeof openEnquire === "function") {
            openEnquire({ title: projectName, source, image: bannerImage });
        }
    };

    const snapshotRows = [
        project?.projectAddress && ["Location", project.projectAddress],
        project?.bhkConfig && ["Configurations", project.bhkConfig],
        project?.landParcel && ["Land Parcel", project.landParcel],
        project?.totalUnits && ["Total Units", String(project.totalUnits)],
        project?.possession && ["Possession", formatDate(project.possession)],
        project?.reraNo && ["RERA No.", project.reraNo],
    ].filter(Boolean);

    const rowsToShow = snapshotRows.length
        ? snapshotRows
        : [
            ["Location", "Whitefield, Bangalore"],
            ["Configurations", "3 BHK & 4 BHK"],
            ["Land Parcel", "7.5 Acres"],
            ["Towers", "Only 1"],
            ["Possession", "Dec 2028 (est.)"],
            ["RERA No.", "20 Of 2026"],
        ];

    return (
        <section id="overview" className="bg-[#f5efe2] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6 grid md:grid-cols-12 gap-10 md:gap-16 items-start">
                <div className="md:col-span-7">
                    <SectionLabel>OVERVIEW</SectionLabel>
                    <SectionTitle>About {projectName}</SectionTitle>
                    {project?.shortOverview ? (
                        <div className="mt-7 space-y-5 text-[15px] text-[#1a2a1f]/80 leading-[1.85] whitespace-pre-line">
                            {project.shortOverview}
                        </div>
                    ) : (
                        <div className="mt-7 space-y-5 text-[15px] text-[#1a2a1f]/80 leading-[1.85]">
                            <p>
                                {projectName} is a boutique, hand-crafted residential landmark by Total Environment Building Systems, set on 7.5 acres in Whitefield, Bangalore. With only one G+18 tower and 240 residences, every home is a triple-aspect garden residence, sweeping panoramic skylines, and a vertical forest at every floor.
                            </p>
                            <p>
                                Crafted around the idea of a living architecture, the project pairs 23 ft. floor-to-ceiling heights, wrap-around balconies, and a grand clubhouse on elevated podiums to deliver palatial, future-proof living.
                            </p>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => handleEnquire("Personal Walkthrough")}
                        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1e3a2c] border-b border-[#c89d3c] pb-0.5 hover:gap-3 transition-all"
                    >
                        Request a personal walkthrough <span aria-hidden>→</span>
                    </button>
                </div>

                <aside className="md:col-span-5">
                    <div className="bg-white rounded-2xl shadow-lg shadow-[#1e3a2c]/8 border border-[#1e3a2c]/8 p-7">
                        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#6b8a72] mb-5">PROJECT SNAPSHOT</div>
                        <dl className="space-y-3.5 text-[14px]">
                            {rowsToShow.map(([k, v]) => (
                                <div key={k} className="flex items-baseline justify-between gap-3 border-b border-[#1e3a2c]/10 pb-3 last:border-0 last:pb-0">
                                    <dt className="text-[#1a2a1f]/60 shrink-0">{k}</dt>
                                    <dd className="font-semibold text-[#1e3a2c] text-right">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <button
                            type="button"
                            onClick={() => handleEnquire("Get Cost Sheet")}
                            className="mt-6 inline-flex items-center justify-center gap-2 w-full rounded-full bg-[#1e3a2c] text-[#f5efe2] px-6 py-3.5 text-sm font-semibold hover:bg-[#2a4a35] transition"
                        >
                            Get Cost Sheet
                        </button>
                    </div>
                </aside>
            </div>
        </section>
    );
}

function ProjectDescription({ project }) {
    const [expanded, setExpanded] = useState(false);
    if (!project?.content || !String(project.content).replace(/<[^>]*>/g, "").trim()) return null;

    return (
        <section id="description" className="bg-[#f5efe2] pb-16 md:pb-24 -mt-10 md:-mt-16">
            <div className="max-w-[1300px] mx-auto px-6">
                {project.contentTitle && (
                    <>
                        <SectionTitle>{project.contentTitle}</SectionTitle>
                        <div className="mt-3 mb-8 w-16 h-1 rounded-full bg-[#c89d3c]" />
                    </>
                )}
                <div className="relative">
                    <div
                        className={`rich-content text-[15px] md:text-base text-[#1a2a1f]/85 leading-[1.85] overflow-hidden transition-[max-height] duration-500 ${expanded ? "max-h-[9999px]" : "max-h-[420px]"}`}
                        dangerouslySetInnerHTML={{ __html: project.content }}
                    />
                    {!expanded && (
                        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f5efe2] to-transparent" />
                    )}
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setExpanded(v => !v)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#1e3a2c] text-[#1e3a2c] font-semibold rounded-full hover:bg-[#1e3a2c] hover:text-[#f5efe2] transition text-sm"
                    >
                        {expanded ? "Read Less" : "Read More"}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                </div>
            </div>
        </section>
    );
}

function DetailedOverview({ project }) {
    const [activeId, setActiveId] = useState("");
    const blocks = Array.isArray(project?.detailedOverview)
        ? project.detailedOverview
            .filter(b => (b?.title || b?.content || b?.image))
            .map((b, i) => ({ ...b, _id: b.title ? `do-${toBlockId(b.title)}` : `do-block-${i}` }))
        : [];

    useEffect(() => {
        if (!blocks.length) return;
        const ids = blocks.map(b => b._id);
        if (!activeId) setActiveId(ids[0]);

        const els = ids.map(id => document.getElementById(id)).filter(Boolean);
        if (!els.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter(e => e.isIntersecting);
                if (visible.length > 0) {
                    const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                    setActiveId(top.target.id);
                }
            },
            { rootMargin: "-30% 0px -55% 0px", threshold: 0 }
        );
        els.forEach(el => observer.observe(el));
        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blocks.length]);

    if (project?.hideDetailedOverview || blocks.length === 0) return null;

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const mainNav = document.querySelector("header");
        const subNav = document.getElementById("detailed-overview-nav");
        const offset = (mainNav ? mainNav.offsetHeight : 64) + (subNav ? subNav.offsetHeight : 49) + 12;
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
        setActiveId(id);
    };

    return (
        <section id="detailed-overview" className="bg-[#f5efe2]">
            <div id="detailed-overview-nav" className="sticky top-[64px] z-30">
                <div className="max-w-[1300px] mx-auto px-6">
                    <div className="flex items-center gap-7 overflow-x-auto py-4 text-[13px] no-scrollbar bg-[#f5efe2]/95 backdrop-blur-md border-y border-[#1e3a2c]/10">
                        {blocks.map((b) => {
                            const isActive = activeId === b._id;
                            return (
                                <button
                                    key={b._id}
                                    type="button"
                                    onClick={() => scrollTo(b._id)}
                                    className={`relative whitespace-nowrap pb-1.5 transition ${isActive ? "text-[#1e3a2c] font-semibold" : "text-[#1a2a1f]/65 hover:text-[#1e3a2c]"}`}
                                >
                                    {b.title || "Section"}
                                    {isActive && (
                                        <span aria-hidden className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-[#1e3a2c]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="max-w-[1300px] mx-auto px-6 pt-8 md:pt-10 pb-16 md:pb-24 space-y-12 md:space-y-16">
                {blocks.map((block, i) => {
                    const hasContent = block.content && String(block.content).replace(/<[^>]*>/g, "").trim().length > 0;
                    return (
                        <div key={block._id} id={block._id} className="scroll-mt-28">
                            {block.title && (
                                <div className="text-center mb-6">
                                    <h2 className="font-display font-medium text-[#1e3a2c] text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
                                        {block.title}
                                    </h2>
                                    <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#c89d3c]" />
                                </div>
                            )}
                            {block.image && (
                                <div className="mb-8 flex items-center justify-center h-72 md:h-[480px] rounded-2xl overflow-hidden bg-[#ebe3cf]/40">
                                    <img
                                        src={block.image}
                                        alt={block.imageAlt || block.title || "Overview image"}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            {hasContent && (
                                <div
                                    className="rich-content text-[15px] md:text-base text-[#1a2a1f]/85 leading-[1.85]"
                                    dangerouslySetInnerHTML={{ __html: block.content }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function Highlights({ project }) {
    const items = Array.isArray(project?.highlightItems)
        ? project.highlightItems
            .filter(h => (h?.title || h?.description))
            .map(h => ({ title: h.title || "", desc: h.description || h.desc || "" }))
        : [];

    if (items.length === 0) return null;

    const projectName = project?.title || "Project";
    const title = project?.keyHighlightsTitle || `Why ${projectName} Stands Apart`;

    return (
        <section id="highlights" className="bg-[#ebe3cf] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>HIGHLIGHTS</SectionLabel>
                <SectionTitle>{title}</SectionTitle>

                <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {items.map((h, i) => (
                        <article key={`${h.title}-${i}`} className="rounded-2xl bg-[#f5efe2] border border-[#1e3a2c]/10 p-6 hover:shadow-lg hover:shadow-[#1e3a2c]/10 hover:border-[#c89d3c]/40 transition">
                            <h3 className="font-display font-semibold text-[#1e3a2c] text-lg">{h.title}</h3>
                            <p className="mt-3 text-sm text-[#1a2a1f]/70 leading-[1.7]">{h.desc}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Pricing({ project }) {
    const enquire = useEnquireNow();
    const openEnquire = enquire?.openEnquire;
    const bannerImage = project?.desktopBanner || project?.mobileBanner || project?.image;
    const projectName = project?.title || "Project";

    const rows = Array.isArray(project?.configurationRows)
        ? project.configurationRows.filter(r => (r?.configuration || r?.size || r?.price))
        : [];
    const html = project?.configurations;
    const htmlHasContent = html && String(html).replace(/<[^>]*>/g, "").trim().length > 0;

    if (rows.length === 0 && !htmlHasContent) return null;

    const title = project?.configurationsTitle || `${projectName} Configurations & Price`;
    const ctaLabel = project?.configurationsCtaLabel;

    const triggerEnquire = (source) => {
        if (typeof openEnquire === "function") {
            openEnquire({ title: projectName, source: source || "Pricing", image: bannerImage });
        }
    };

    return (
        <section id="pricing" className="bg-[#f5efe2] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>PRICING</SectionLabel>
                <SectionTitle>{title}</SectionTitle>

                {rows.length > 0 && (
                    <div className="mt-10 rounded-2xl overflow-hidden border border-[#1e3a2c]/12 bg-white">
                        <div className="grid grid-cols-12 bg-[#1e3a2c] text-[#f5efe2] text-[11px] uppercase tracking-[0.25em] font-semibold">
                            <div className="col-span-5 md:col-span-5 px-6 py-4">Configuration</div>
                            <div className="col-span-3 md:col-span-3 px-6 py-4">Size</div>
                            <div className="col-span-4 md:col-span-2 px-6 py-4">Price</div>
                            <div className="hidden md:block col-span-2 px-6 py-4 text-right" />
                        </div>
                        {rows.map((row, i) => (
                            <div key={`${row.configuration || "row"}-${i}`}
                                className={`grid grid-cols-12 items-center text-[14px] ${i % 2 === 0 ? "bg-white" : "bg-[#f5efe2]/40"} hover:bg-[#ebe3cf]/50 transition`}>
                                <div className="col-span-5 md:col-span-5 px-6 py-5 font-semibold text-[#1e3a2c]">{row.configuration}</div>
                                <div className="col-span-3 md:col-span-3 px-6 py-5 text-[#1a2a1f]/80">{row.size}</div>
                                <div className="col-span-4 md:col-span-2 px-6 py-5 font-display text-lg font-medium text-[#c89d3c]">{row.price}</div>
                                <div className="hidden md:flex col-span-2 px-6 py-5 justify-end">
                                    {(row.buttonLabel || "").trim() && (
                                        <button
                                            type="button"
                                            onClick={() => triggerEnquire(`${row.configuration || projectName} — ${row.buttonLabel}`)}
                                            className="inline-flex items-center rounded-full bg-[#1e3a2c] text-[#f5efe2] px-5 py-2 text-xs font-semibold hover:bg-[#c89d3c] hover:text-[#1e3a2c] transition"
                                        >
                                            {row.buttonLabel}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {htmlHasContent && (
                    <div
                        className={`${rows.length > 0 ? "mt-8" : "mt-10"} rich-content pricing-table-wrap text-[#1a2a1f]/85`}
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                )}

                {ctaLabel && (
                    <div className="mt-8 flex justify-center">
                        <button
                            type="button"
                            onClick={() => triggerEnquire(ctaLabel)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#1e3a2c] text-[#f5efe2] px-7 py-3.5 text-sm font-semibold hover:bg-[#2a4a35] transition shadow-lg shadow-[#1e3a2c]/40"
                        >
                            {ctaLabel}
                            <span aria-hidden>→</span>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}


function Amenities({ project }) {
    const enquire = useEnquireNow();
    const openEnquire = enquire?.openEnquire;
    const bannerImage = project?.desktopBanner || project?.mobileBanner || project?.image;
    const projectName = project?.title || "Project";

    const items = Array.isArray(project?.amenities)
        ? project.amenities.filter(a => (a?.label || a?.icon))
        : [];

    if (items.length === 0) return null;

    const title = project?.amenitiesTitle || `${projectName} Amenities`;
    const description = project?.amenitiesContent;
    const hasDescription = description && String(description).replace(/<[^>]*>/g, "").trim().length > 0;

    return (
        <section id="amenities" className="bg-[#ebe3cf] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>AMENITIES</SectionLabel>
                <SectionTitle>{title}</SectionTitle>
                {hasDescription && (
                    <div
                        className="mt-4 rich-content text-[15px] text-[#1a2a1f]/70 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                )}

                <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {items.map((a, i) => (
                        <article
                            key={`${a.label || "amenity"}-${i}`}
                            className="group rounded-2xl bg-[#f5efe2] border border-[#1e3a2c]/10 p-6 text-center hover:shadow-lg hover:shadow-[#1e3a2c]/10 hover:border-[#c89d3c]/40 transition"
                        >
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-[#1e3a2c]/8 border border-[#1e3a2c]/15 flex items-center justify-center overflow-hidden group-hover:bg-[#1e3a2c] group-hover:border-[#1e3a2c] transition">
                                    {a.icon ? (
                                        <img
                                            src={a.icon}
                                            alt={a.alt || a.label || "amenity"}
                                            loading="lazy"
                                            className="w-9 h-9 object-contain"
                                        />
                                    ) : (
                                        <span className="text-[#1e3a2c] text-lg font-bold group-hover:text-[#f5efe2]">★</span>
                                    )}
                                </div>
                            </div>
                            <h3 className="mt-5 font-display text-base md:text-lg text-[#1e3a2c] leading-tight">{a.label}</h3>
                            <span aria-hidden className="block mx-auto mt-3 w-8 h-px bg-[#c89d3c]/60 group-hover:w-14 transition-[width] duration-500" />
                        </article>
                    ))}
                </div>

                <div className="mt-12 flex justify-center">
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof openEnquire === "function") {
                                openEnquire({ title: projectName, source: "Amenities Walkthrough", image: bannerImage });
                            }
                        }}
                        className="inline-flex items-center gap-3 rounded-full border border-[#1e3a2c]/30 text-[#1e3a2c] px-7 py-3.5 text-sm font-semibold hover:bg-[#1e3a2c] hover:text-[#f5efe2] hover:border-[#1e3a2c] transition"
                    >
                        Walk the property with us <span aria-hidden>→</span>
                    </button>
                </div>
            </div>
        </section>
    );
}

function FloorPlans({ project }) {
    const enquire = useEnquireNow();
    const openEnquire = enquire?.openEnquire;
    const bannerImage = project?.desktopBanner || project?.mobileBanner || project?.image;
    const projectName = project?.title || "Project";

    const padTo = (arr, n) => {
        const list = Array.isArray(arr) ? [...arr] : [];
        while (list.length < n) list.push({});
        return list.slice(0, Math.max(n, list.length));
    };

    const masterPlans = padTo(project?.masterFloorPlan?.masterPlans, 2);
    const floorPlans = padTo(project?.masterFloorPlan?.floorPlans, 2);

    const title = project?.masterFloorPlan?.title || `${projectName} Floor Plans`;

    const handleCardClick = (plan, kind) => {
        if (typeof openEnquire === "function") {
            openEnquire({
                title: projectName,
                source: `${kind}${plan?.label ? ` — ${plan.label}` : ""}`,
                image: bannerImage,
            });
        }
    };

    const renderCard = (fp, i, kind) => (
        <article
            key={`${kind}-${fp.label || "plan"}-${i}`}
            onClick={() => handleCardClick(fp, kind)}
            className="rounded-2xl bg-[#1e3a2c] text-[#f5efe2] overflow-hidden border border-[#1e3a2c]/10 cursor-pointer hover:shadow-xl hover:shadow-[#1e3a2c]/20 transition"
        >
            <div className="relative h-72 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(245,239,226,0.08)_0%,transparent_70%)] overflow-hidden">
                {fp.image ? (
                    <img
                        src={fp.image}
                        alt={fp.alt || fp.label || `${kind} image`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-40"
                    />
                ) : (
                    <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><g stroke='%23f5efe2' stroke-width='1' fill='none'><rect x='20' y='30' width='80' height='100'/><rect x='100' y='30' width='80' height='60'/><rect x='100' y='90' width='80' height='80'/><rect x='20' y='130' width='80' height='40'/><line x1='60' y1='30' x2='60' y2='130'/><line x1='140' y1='90' x2='140' y2='170'/></g></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "260px 260px" }} />
                )}
                <span className="absolute top-3 left-3 z-10 inline-flex items-center rounded-full bg-[#c89d3c] text-[#1e3a2c] px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold">
                    {kind}
                </span>
                <div className="relative flex flex-col items-center gap-3 z-10">
                    <div className="w-14 h-14 rounded-full bg-[#c89d3c] flex items-center justify-center text-2xl">🔒</div>
                    <div className="text-center">
                        <div className="font-display font-medium text-2xl">Click to Unlock</div>
                        <div className="text-sm text-[#f5efe2]/70 mt-1">Fill the form to view</div>
                    </div>
                </div>
            </div>
            <div className="bg-[#f5efe2] text-[#1e3a2c] px-6 py-4 flex items-center justify-between border-t border-[#1e3a2c]/10">
                <div>
                    <div className="font-semibold">{fp.label || `${kind} ${i + 1}`}</div>
                    {fp.alt && fp.alt !== fp.label && (
                        <div className="text-sm text-[#1a2a1f]/65">{fp.alt}</div>
                    )}
                </div>
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#1e3a2c] hover:text-[#c89d3c] transition">
                    {fp.ctaText || "View →"}
                </span>
            </div>
        </article>
    );

    return (
        <section id="floor-plans" className="bg-[#f5efe2] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>FLOOR PLANS</SectionLabel>
                <SectionTitle>{title}</SectionTitle>

                <div className="mt-12">
                    <h3 className="font-display text-xl md:text-2xl text-[#1e3a2c] mb-5">Master Plan</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {masterPlans.map((fp, i) => renderCard(fp, i, "Master Plan"))}
                    </div>
                </div>

                <div className="mt-10">
                    <h3 className="font-display text-xl md:text-2xl text-[#1e3a2c] mb-5">Floor Plans</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        {floorPlans.map((fp, i) => renderCard(fp, i, "Floor Plan"))}
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <button
                        type="button"
                        onClick={() => {
                            if (typeof openEnquire === "function") {
                                openEnquire({ title: projectName, source: "Request Detailed Floor Plan", image: bannerImage });
                            }
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-[#1e3a2c] text-[#f5efe2] px-7 py-3.5 text-sm font-semibold hover:bg-[#2a4a35] transition shadow-lg shadow-[#1e3a2c]/30"
                    >
                        Request Detailed Floor Plan
                    </button>
                </div>
            </div>
        </section>
    );
}

function Gallery({ project }) {
    const projectName = project?.title || "Project";
    const adminImages = Array.isArray(project?.gallery?.images)
        ? project.gallery.images.filter(g => g?.image)
        : [];

    const [lightboxIndex, setLightboxIndex] = useState(null);
    const isOpen = lightboxIndex !== null;

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => {
            if (e.key === "Escape") setLightboxIndex(null);
            if (e.key === "ArrowRight") setLightboxIndex(i => (i + 1) % adminImages.length);
            if (e.key === "ArrowLeft") setLightboxIndex(i => (i - 1 + adminImages.length) % adminImages.length);
        };
        window.addEventListener("keydown", onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [isOpen, adminImages.length]);

    if (adminImages.length === 0) return null;

    const title = project?.gallery?.title || `${projectName} Gallery`;
    const description = project?.gallery?.content;
    const hasDescription = description && String(description).replace(/<[^>]*>/g, "").trim().length > 0;

    const current = isOpen ? adminImages[lightboxIndex] : null;
    const goPrev = (e) => { e?.stopPropagation?.(); setLightboxIndex(i => (i - 1 + adminImages.length) % adminImages.length); };
    const goNext = (e) => { e?.stopPropagation?.(); setLightboxIndex(i => (i + 1) % adminImages.length); };

    return (
        <section id="gallery" className="bg-[#ebe3cf] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>GALLERY</SectionLabel>
                <SectionTitle>{title}</SectionTitle>
                {hasDescription && (
                    <div
                        className="mt-4 rich-content text-[15px] text-[#1a2a1f]/70 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: description }}
                    />
                )}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {adminImages.map((g, i) => (
                        <button
                            type="button"
                            key={`${g.image}-${i}`}
                            onClick={() => setLightboxIndex(i)}
                            className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-zoom-in group focus:outline-none focus:ring-2 focus:ring-[#c89d3c] focus:ring-offset-2 focus:ring-offset-[#ebe3cf]"
                        >
                            <img
                                src={g.image}
                                alt={g.alt || `${projectName} gallery image ${i + 1}`}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
                            />
                            <span className="absolute inset-0 bg-[#1e3a2c]/0 group-hover:bg-[#1e3a2c]/15 transition" />
                        </button>
                    ))}
                </div>
            </div>

            {isOpen && current && (
                <div
                    className="fixed inset-0 z-[100] flex flex-col bg-black/95"
                    onClick={() => setLightboxIndex(null)}
                >
                    <div className="flex items-center justify-between px-5 py-4 flex-shrink-0 text-[#f5efe2]" onClick={e => e.stopPropagation()}>
                        <div className="text-sm md:text-base font-display">
                            {lightboxIndex + 1} / {adminImages.length}
                            {current.alt && <span className="ml-3 text-[#f5efe2]/70 hidden md:inline">— {current.alt}</span>}
                        </div>
                        <button
                            type="button"
                            onClick={() => setLightboxIndex(null)}
                            className="w-10 h-10 rounded-full border border-[#f5efe2]/30 hover:bg-[#f5efe2]/10 flex items-center justify-center transition"
                            aria-label="Close gallery"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 flex items-center justify-center relative px-4 md:px-16 min-h-0" onClick={e => e.stopPropagation()}>
                        {adminImages.length > 1 && (
                            <button
                                type="button"
                                onClick={goPrev}
                                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#f5efe2]/10 hover:bg-[#f5efe2]/20 text-[#f5efe2] flex items-center justify-center transition backdrop-blur-sm"
                                aria-label="Previous image"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                        )}

                        <img
                            src={current.image}
                            alt={current.alt || `${projectName} gallery image ${lightboxIndex + 1}`}
                            className="max-w-full max-h-full object-contain select-none"
                        />

                        {adminImages.length > 1 && (
                            <button
                                type="button"
                                onClick={goNext}
                                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-[#f5efe2]/10 hover:bg-[#f5efe2]/20 text-[#f5efe2] flex items-center justify-center transition backdrop-blur-sm"
                                aria-label="Next image"
                            >
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {adminImages.length > 1 && (
                        <div className="flex-shrink-0 px-3 md:px-5 py-3 md:py-4" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar max-w-[1300px] mx-auto">
                                {adminImages.map((g, i) => (
                                    <button
                                        key={`thumb-${g.image}-${i}`}
                                        type="button"
                                        onClick={() => setLightboxIndex(i)}
                                        className={`relative h-14 md:h-16 aspect-[4/3] rounded-md overflow-hidden flex-shrink-0 ring-2 transition ${i === lightboxIndex ? "ring-[#c89d3c]" : "ring-transparent opacity-60 hover:opacity-100"}`}
                                    >
                                        <img src={g.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function StyledMap() {
    return (
        <div className="relative aspect-[4/3] rounded-2xl bg-[#ebe3cf] border border-[#1e3a2c]/10 overflow-hidden">
            <svg viewBox="0 0 400 300" className="w-full h-full">
                <rect width="400" height="300" fill="#f5efe2" />
                <path d="M0 220 Q 80 200 160 215 T 320 200 T 400 210" stroke="#c5b88f" strokeWidth="22" fill="none" opacity="0.6" />
                <path d="M0 100 L 400 130" stroke="#c5b88f" strokeWidth="14" fill="none" opacity="0.55" />
                <path d="M120 0 L 140 300" stroke="#c5b88f" strokeWidth="14" fill="none" opacity="0.55" />
                <path d="M260 0 L 280 300" stroke="#c5b88f" strokeWidth="10" fill="none" opacity="0.5" />
                <path d="M0 60 Q 120 50 200 70 T 400 80" stroke="#c5b88f" strokeWidth="6" fill="none" opacity="0.45" />
                <rect x="30" y="30" width="60" height="40" rx="6" fill="#cfdcc4" opacity="0.85" />
                <rect x="160" y="30" width="60" height="50" rx="6" fill="#cfdcc4" opacity="0.85" />
                <rect x="300" y="20" width="70" height="40" rx="6" fill="#cfdcc4" opacity="0.85" />
                <rect x="40" y="150" width="60" height="40" rx="6" fill="#cfdcc4" opacity="0.85" />
                <rect x="180" y="160" width="50" height="35" rx="6" fill="#cfdcc4" opacity="0.85" />
                <rect x="300" y="170" width="60" height="40" rx="6" fill="#cfdcc4" opacity="0.85" />
                <rect x="30" y="240" width="60" height="40" rx="6" fill="#cfdcc4" opacity="0.85" />
                <rect x="300" y="240" width="70" height="40" rx="6" fill="#cfdcc4" opacity="0.85" />
                <circle cx="220" cy="150" r="22" fill="#c89d3c" />
                <circle cx="220" cy="150" r="8" fill="#1e3a2c" />
                <g fontFamily="ui-serif, Georgia, serif" fontSize="9" fill="#6b8a72">
                    <text x="32" y="22">ITPL Tech Park</text>
                    <text x="162" y="22">Phoenix MarketCity</text>
                    <text x="302" y="12">Manipal Hospital</text>
                    <text x="42" y="142">Inorbit Mall</text>
                    <text x="306" y="162">KR Puram Metro</text>
                </g>
                <text x="220" y="180" fontFamily="ui-serif, Georgia, serif" fontSize="11" fontWeight="700" fill="#1e3a2c" textAnchor="middle">SITE</text>
            </svg>
        </div>
    );
}

function Location({ project }) {
    const projectName = project?.title || "Project";
    const content = project?.location?.content;
    const hasContent = content && String(content).replace(/<[^>]*>/g, "").trim().length > 0;
    const hasCoords = project?.lat && project?.lng;

    if (!hasContent && !hasCoords) return null;

    const title = project?.location?.title || `${projectName} Location & Connectivity`;

    return (
        <section id="location" className="bg-[#f5efe2] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>LOCATION</SectionLabel>
                <SectionTitle>{title}</SectionTitle>

                <div className="mt-8">
                    {project?.lat && project?.lng ? (
                        <LeafletMap lat={project.lat} lng={project.lng} title={projectName} />
                    ) : (
                        <StyledMap />
                    )}
                </div>

                {hasContent && (
                    <div
                        className="mt-6 rich-content text-[#1a2a1f]/85 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                )}
            </div>
        </section>
    );
}

function Specifications({ project }) {
    const enquire = useEnquireNow();
    const openEnquire = enquire?.openEnquire;
    const bannerImage = project?.desktopBanner || project?.mobileBanner || project?.image;
    const projectName = project?.title || "Project";

    const ps = project?.projectSpecifications;
    const specs = Array.isArray(ps?.specs)
        ? ps.specs.filter(s => (s?.title || s?.content))
        : [];
    const content = ps?.content;
    const hasContent = content && String(content).replace(/<[^>]*>/g, "").trim().length > 0;

    if (project?.hideProjectSpecifications) return null;
    if (specs.length === 0 && !hasContent) return null;

    const title = ps?.title || "Project Specifications";
    const ctaLabel = ps?.ctaLabel;

    return (
        <section id="specifications" className="bg-[#ebe3cf] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>SPECIFICATIONS</SectionLabel>
                <SectionTitle>{title}</SectionTitle>

                {hasContent && (
                    <div
                        className="mt-4 rich-content text-[15px] text-[#1a2a1f]/70 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                )}

                {specs.length > 0 && (
                    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {specs.map((s, i) => (
                            <article
                                key={`${s.title || "spec"}-${i}`}
                                className="rounded-2xl bg-[#f5efe2] border border-[#1e3a2c]/10 p-6 hover:shadow-lg hover:shadow-[#1e3a2c]/10 hover:border-[#c89d3c]/40 transition"
                            >
                                {s.title && (
                                    <h3 className="font-display font-semibold text-[#1e3a2c] text-lg">{s.title}</h3>
                                )}
                                {s.content && (
                                    <div
                                        className="mt-3 rich-content text-sm text-[#1a2a1f]/75 leading-[1.7]"
                                        dangerouslySetInnerHTML={{ __html: s.content }}
                                    />
                                )}
                            </article>
                        ))}
                    </div>
                )}

                {ctaLabel && (
                    <div className="mt-10 flex justify-center">
                        <button
                            type="button"
                            onClick={() => {
                                if (typeof openEnquire === "function") {
                                    openEnquire({ title: projectName, source: ctaLabel, image: bannerImage });
                                }
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-[#1e3a2c] text-[#f5efe2] px-7 py-3.5 text-sm font-semibold hover:bg-[#2a4a35] transition shadow-lg shadow-[#1e3a2c]/30"
                        >
                            {ctaLabel}
                            <span aria-hidden>→</span>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

function FAQ({ project }) {
    const [openIndex, setOpenIndex] = useState(null);

    const faqs = Array.isArray(project?.faqs)
        ? project.faqs.filter(f => (f?.question || f?.answer))
        : [];

    if (project?.hideFAQs || faqs.length === 0) return null;

    return (
        <section id="faqs" className="bg-[#f5efe2] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>FAQ</SectionLabel>
                <SectionTitle>Frequently Asked Questions</SectionTitle>

                <div className="mt-10 space-y-3">
                    {faqs.map((faq, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div key={i} className="rounded-2xl border border-[#1e3a2c]/12 bg-white overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(isOpen ? null : i)}
                                    className="w-full flex items-center justify-between gap-4 px-5 md:px-6 py-4 md:py-5 text-left hover:bg-[#ebe3cf]/40 transition"
                                >
                                    <div
                                        className="rich-content font-display text-base md:text-lg text-[#1e3a2c] [&_p]:m-0 [&_*]:m-0"
                                        dangerouslySetInnerHTML={{ __html: faq.question || "" }}
                                    />
                                    <svg
                                        width="20" height="20" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        className={`text-[#c89d3c] shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {isOpen && (
                                    <div className="px-5 md:px-6 pb-5 pt-1 border-t border-[#1e3a2c]/8">
                                        <div
                                            className="rich-content text-[15px] text-[#1a2a1f]/80 leading-[1.85]"
                                            dangerouslySetInnerHTML={{ __html: faq.answer || "" }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function Enquiry() {
    return (
        <section id="enquiry" className="bg-[#1e3a2c] text-[#f5efe2] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6 grid md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#c89d3c]">ENQUIRE</div>
                    <h2 className="mt-3 font-display font-medium text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-tight">
                        Book a Site Visit —<br />Tangled Up <em className="text-[#c89d3c]">in Green</em>
                    </h2>
                    <p className="mt-5 text-[#f5efe2]/75 leading-relaxed">
                        Share your details and our sales team will reach out within 30 minutes (10 AM – 8 PM IST) to arrange a private walkthrough of the experience centre.
                    </p>
                    <div className="mt-8 space-y-4 text-sm">
                        <a href="tel:+918012345678" className="flex items-center gap-3 group">
                            <span className="w-9 h-9 rounded-full border border-[#c89d3c]/40 flex items-center justify-center text-[#c89d3c]">📞</span>
                            <span>
                                <span className="block text-[10px] uppercase tracking-[0.25em] text-[#f5efe2]/55">Call / WhatsApp</span>
                                <span className="font-display font-medium text-lg group-hover:text-[#c89d3c] transition">+91 80 1234 5678</span>
                            </span>
                        </a>
                        <div className="text-xs text-[#f5efe2]/55 tracking-wide">RERA Reg. No. <span className="text-[#f5efe2]/85">PRM/KA/RERA/1251/446/PR/240315/006724</span></div>
                    </div>
                </div>

                <form className="md:col-span-7 bg-[#f5efe2] text-[#1e3a2c] rounded-2xl p-7 grid sm:grid-cols-2 gap-4">
                    <Field label="Name *" name="name" placeholder="Full name" />
                    <Field label="Phone *" name="phone" type="tel" placeholder="+91" />
                    <Field label="Email" name="email" type="email" placeholder="you@email.com" />
                    <Select label="Configuration" name="config" options={["Select", "3 BHK Garden Residence", "4 BHK Signature Home", "4 BHK Penthouse", "Just exploring"]} />
                    <Textarea label="Message" name="message" placeholder="Preferred site visit time, queries, etc." className="sm:col-span-2" />
                    <label className="sm:col-span-2 flex items-start gap-3 text-xs text-[#1a2a1f]/75 cursor-pointer">
                        <input type="checkbox" defaultChecked className="mt-0.5 accent-[#1e3a2c]" />
                        <span>I can be contacted via call, SMS, email and WhatsApp regarding Tangled Up in Green.</span>
                    </label>
                    <button type="submit" className="sm:col-span-2 mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#1e3a2c] text-[#f5efe2] px-7 py-4 text-sm font-semibold hover:bg-[#2a4a35] transition">
                        Send via WhatsApp →
                    </button>
                </form>
            </div>
        </section>
    );
}

function Field({ label, name, type = "text", placeholder, className = "" }) {
    return (
        <div className={className}>
            <label htmlFor={name} className="block text-[10px] uppercase tracking-[0.25em] font-bold text-[#6b8a72] mb-2">{label}</label>
            <input id={name} name={name} type={type} placeholder={placeholder} className="w-full bg-white border border-[#1e3a2c]/15 rounded-lg px-4 py-3 text-[#1a2a1f] placeholder-[#1a2a1f]/35 focus:border-[#1e3a2c] focus:outline-none transition" />
        </div>
    );
}

function Select({ label, name, options, className = "" }) {
    return (
        <div className={className}>
            <label htmlFor={name} className="block text-[10px] uppercase tracking-[0.25em] font-bold text-[#6b8a72] mb-2">{label}</label>
            <select id={name} name={name} defaultValue={options[0]} className="w-full bg-white border border-[#1e3a2c]/15 rounded-lg px-4 py-3 text-[#1a2a1f] focus:border-[#1e3a2c] focus:outline-none transition appearance-none">
                {options.map((o) => <option key={o}>{o}</option>)}
            </select>
        </div>
    );
}

function Textarea({ label, name, placeholder, className = "" }) {
    return (
        <div className={className}>
            <label htmlFor={name} className="block text-[10px] uppercase tracking-[0.25em] font-bold text-[#6b8a72] mb-2">{label}</label>
            <textarea id={name} name={name} placeholder={placeholder} rows={3} className="w-full bg-white border border-[#1e3a2c]/15 rounded-lg px-4 py-3 text-[#1a2a1f] placeholder-[#1a2a1f]/35 focus:border-[#1e3a2c] focus:outline-none transition resize-none" />
        </div>
    );
}

function LatestBlog({ project }) {
    const [blogs, setBlogs] = useState([]);
    const [visible, setVisible] = useState(6);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/blog");
                const json = await res.json();
                if (cancelled) return;
                if (json?.success && Array.isArray(json.data)) {
                    setBlogs(json.data);
                }
            } catch { /* ignore */ }
        })();
        return () => { cancelled = true; };
    }, []);

    if (project?.hideBlogs || blogs.length === 0) return null;

    return (
        <section id="blogs" className="bg-[#f5efe2] py-16 md:py-24">
            <div className="max-w-[1300px] mx-auto px-6">
                <SectionLabel>JOURNAL</SectionLabel>
                <SectionTitle>Latest Blog</SectionTitle>
                <div className="mt-3 w-16 h-1 rounded-full bg-[#c89d3c]" />

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blogs.slice(0, visible).map((blog, i) => {
                        const slug = blog.slug || blog._id?.toString();
                        const isImgSrc = (v) => v && typeof v === "string" && (v.startsWith("http") || v.startsWith("/"));
                        const imgUrl = isImgSrc(blog.heroImage) ? blog.heroImage : isImgSrc(blog.image) ? blog.image : null;
                        return (
                            <a
                                key={blog._id || i}
                                href={`/blog/${slug}`}
                                className="group flex flex-col bg-white border border-[#1e3a2c]/10 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-[#1e3a2c]/10 hover:border-[#c89d3c]/40 transition"
                            >
                                <div className="relative h-48 bg-[#ebe3cf] flex-shrink-0 overflow-hidden">
                                    {imgUrl ? (
                                        <img
                                            src={imgUrl}
                                            alt={blog.heroImageAlt || blog.title || "Blog image"}
                                            loading="lazy"
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-5xl">📝</div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 p-5">
                                    {blog.category && (
                                        <span className="inline-block self-start px-3 py-1 rounded-full text-[11px] font-semibold bg-[#c89d3c]/15 text-[#1e3a2c] mb-3 uppercase tracking-wider">
                                            {blog.category}
                                        </span>
                                    )}
                                    <h3 className="font-display text-lg text-[#1e3a2c] mb-2 leading-snug group-hover:text-[#c89d3c] transition-colors line-clamp-2">
                                        {blog.title}
                                    </h3>
                                    {blog.excerpt && (
                                        <p className="text-sm text-[#1a2a1f]/65 line-clamp-2 flex-1">{blog.excerpt}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#1e3a2c]/10">
                                        <span className="text-xs text-[#1a2a1f]/45">{blog.date || ""}</span>
                                        <span className="text-xs font-semibold text-[#c89d3c] group-hover:underline">Read More →</span>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>

                {blogs.length > visible && (
                    <div className="mt-10 flex justify-center">
                        <button
                            type="button"
                            onClick={() => setVisible(v => v + 6)}
                            className="inline-flex items-center gap-2 px-7 py-3 border-2 border-[#1e3a2c] text-[#1e3a2c] font-semibold rounded-full hover:bg-[#1e3a2c] hover:text-[#f5efe2] transition text-sm"
                        >
                            Load More
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="bg-[#162a1f] text-[#f5efe2]/70 py-14 border-t border-[#c89d3c]/15">
            <div className="max-w-[1300px] mx-auto px-6 grid md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                    <div className="flex flex-col leading-tight">
                        <span className="font-display font-bold text-[#f5efe2] text-2xl tracking-tight">TANGLED UP</span>
                        <span className="font-display italic text-[#c89d3c] text-lg -mt-1">in Green</span>
                    </div>
                    <p className="mt-5 max-w-sm text-sm leading-relaxed">A Total Environment Building Systems estate · Luxury 3 &amp; 4 BHK residences in Whitefield, Bangalore.</p>
                    <div className="mt-4 text-xs text-[#f5efe2]/55">Project RERA: <span className="text-[#f5efe2]/85">20 of 2026</span></div>
                </div>
                <div className="md:col-span-3">
                    <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#c89d3c] mb-4">Quick Links</div>
                    <ul className="space-y-2.5 text-sm">
                        <li><a href="#amenities" className="hover:text-[#c89d3c] transition">Amenities</a></li>
                        <li><a href="#highlights" className="hover:text-[#c89d3c] transition">Highlights</a></li>
                        <li><a href="#floor-plans" className="hover:text-[#c89d3c] transition">Floor Plans</a></li>
                        <li><a href="#location" className="hover:text-[#c89d3c] transition">Location</a></li>
                    </ul>
                </div>
                <div className="md:col-span-4">
                    <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#c89d3c] mb-4">Contact</div>
                    <ul className="space-y-2.5 text-sm">
                        <li><a href="tel:+918012345678" className="hover:text-[#c89d3c] transition">+91 80 1234 5678</a></li>
                        <li><a href="mailto:sales@total-environment.com" className="hover:text-[#c89d3c] transition">sales@total-environment.com</a></li>
                        <li>Hagadur Main Road, Whitefield,<br />Bangalore 560066, Karnataka</li>
                    </ul>
                </div>
            </div>
            <div className="max-w-[1300px] mx-auto px-6 mt-10 pt-6 border-t border-[#f5efe2]/10 text-[11px] text-[#f5efe2]/45 leading-relaxed">
                <strong className="text-[#f5efe2]/75">Disclaimer:</strong> This website is intended for informational purposes only. The content presented here is not an offer or contract. Images are artistic impressions and may vary from the final product. © {new Date().getFullYear()} Total Environment Building Systems. All rights reserved.
            </div>
        </footer>
    );
}















// 'use client';

// import Image from 'next/image';
// import WhatsAppIcon from '@/components/WhatsAppIcon';
// import Footer from '@/components/Footer';
// import NavbarClient from '@/features/home/components/NavbarClient';
// import { useState, useRef, useEffect } from 'react';
// import { useEnquireNow } from '@/lib/EnquireNowContext';

// function LeafletMap({ lat, lng, title }) {
//     const containerRef = useRef(null);
//     const mapRef = useRef(null);

//     useEffect(() => {
//         if (!containerRef.current || mapRef.current) return;

//         import('leaflet').then(({ default: L }) => {
//             import('leaflet/dist/leaflet.css');

//             const map = L.map(containerRef.current, {
//                 center: [lat, lng],
//                 zoom: 15,
//                 scrollWheelZoom: false,
//             });

//             L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//                 attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//             }).addTo(map);

//             const icon = L.divIcon({
//                 className: '',
//                 html: `<div style="position:relative;width:36px;height:48px;">
//                     <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
//                         <path d="M18 0C8.059 0 0 8.059 0 18c0 12.75 18 30 18 30S36 30.75 36 18C36 8.059 27.941 0 18 0z" fill="#b27e02"/>
//                         <circle cx="18" cy="18" r="8" fill="white"/>
//                         <circle cx="18" cy="18" r="4" fill="#b27e02"/>
//                     </svg>
//                 </div>`,
//                 iconSize: [36, 48],
//                 iconAnchor: [18, 48],
//                 tooltipAnchor: [0, -50],
//             });

//             const marker = L.marker([lat, lng], { icon }).addTo(map);
//             marker.bindTooltip(title, {
//                 permanent: false,
//                 direction: 'top',
//                 className: 'leaflet-project-tooltip',
//                 offset: [0, -4],
//             });

//             mapRef.current = map;
//         });

//         return () => {
//             if (mapRef.current) {
//                 mapRef.current.remove();
//                 mapRef.current = null;
//             }
//         };
//     }, [lat, lng, title]);

//     return <div ref={containerRef} style={{ height: '420px', width: '100%', zIndex: 0 }} />;
// }

// function hasContent(html) {
//     if (!html) return false;
//     return html.replace(/<[^>]*>/g, '').trim().length > 0;
// }

// function processContent(html) {
//     if (!html) return html;
//     return html
//         .replace(
//             /(<table[\s\S]*?<\/table>)/gi,
//             '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;margin:0.5rem 0;">$1</div>'
//         )
//         .replace(/<img(?![^>]*\bloading\b)/gi, '<img loading="lazy"');
// }

// function getYouTubeEmbedUrl(url) {
//     if (!url) return null;
//     if (url.includes('youtube.com/embed/')) return url;
//     const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
//     if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
//     const watchMatch = url.match(/[?&]v=([^&]+)/);
//     if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
//     return null;
// }

// export default function ProjectDetailPage({ project, isHome = false }) {
//     const { openEnquire } = useEnquireNow();
//     const [isExpanded, setIsExpanded] = useState(false);
//     const [expandedFAQs, setExpandedFAQs] = useState({});
//     const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
//     const [blogs, setBlogs] = useState([]);
//     const [visibleBlogs, setVisibleBlogs] = useState(30);
//     const [activeSection, setActiveSection] = useState('');


//     const toBlockId = (title) =>
//         (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

//     const detailedBlocks = (!project?.hideDetailedOverview && project?.detailedOverview?.length > 0)
//         ? project.detailedOverview
//             .filter(b => b.title || b.content || b.image)
//             .map((b, i) => ({ id: b.title ? toBlockId(b.title) : `block-${i}`, label: b.title || 'Section' }))
//         : [];

//     const sectionNav = [
//         ...detailedBlocks.map(b => ({ ...b, show: true })),
//         { id: 'faqs', label: 'FAQs', show: !project?.hideFAQs && project?.faqs?.length > 0 },
//         { id: 'blogs', label: 'Blogs', show: isHome && !project?.hideBlogs },
//     ].filter(item => item.show);

//     const scrollToSection = (id) => {
//         const el = document.getElementById(id);
//         if (!el) return;
//         const mainNav = document.querySelector('nav');
//         const navBar = document.getElementById('section-sticky-nav');
//         const offset = (mainNav ? mainNav.offsetHeight : 64) + (navBar ? navBar.offsetHeight : 49) + 16;
//         const top = el.getBoundingClientRect().top + window.scrollY - offset;
//         window.scrollTo({ top, behavior: 'smooth' });
//         window.history.pushState(null, '', `#${id}`);
//         setActiveSection(id);
//     };

//     useEffect(() => {
//         const ids = [
//             'overview',
//             ...(project?.detailedOverview?.filter(b => b.title || b.content || b.image)
//                 .map((b, i) => b.title ? toBlockId(b.title) : `block-${i}`) || []),
//             'faqs',
//             'blogs',
//         ];
//         const observer = new IntersectionObserver(
//             (entries) => {
//                 entries.forEach(entry => {
//                     if (entry.isIntersecting) {
//                         setActiveSection(entry.target.id);
//                         window.history.replaceState(null, '', `#${entry.target.id}`);
//                     }
//                 });
//             },
//             { rootMargin: '-15% 0px -75% 0px', threshold: 0 }
//         );
//         ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
//         return () => observer.disconnect();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     useEffect(() => {
//         fetch('/api/blog')
//             .then(r => r.json())
//             .then(d => { if (d.success) setBlogs(d.data); })
//             .catch(() => { });
//     }, []);
//     const [lightboxIndex, setLightboxIndex] = useState(null);
//     const [copied, setCopied] = useState(false);
//     const [galleryIdx, setGalleryIdx] = useState(0);
//     const galleryTrackRef = useRef(null);

//     if (!project) {
//         return (
//             <div className="min-h-screen flex items-center justify-center">
//                 <div className="text-center">
//                     <h1 className="text-4xl font-bold text-gray-800 mb-4">Project Not Found</h1>
//                     {/* <a href="/projects" className="text-[#b27e02] hover:underline">← Back to Projects</a> */}
//                 </div>
//             </div>
//         );
//     }

//     const desktopBanner = project.desktopBanner || project.image;
//     const mobileBanner = project.mobileBanner || project.image;
//     const hasBanner = desktopBanner || mobileBanner;

//     return (
//         <div className="min-h-screen bg-white">
//             <WhatsAppIcon projectName={project.title} />
//             <NavbarClient />

//             {/* Hero Banner */}
//             {hasBanner ? (
//                 <div className="relative w-full overflow-hidden bg-black">
//                     <div className="relative w-full h-[92vh] md:h-[88vh] min-h-[640px]">
//                         {/* Mobile: LCP image — priority + high quality */}
//                         {mobileBanner ? (
//                             <Image
//                                 src={mobileBanner}
//                                 alt={project.title}
//                                 fill
//                                 priority
//                                 fetchpriority="high"
//                                 quality={65}
//                                 sizes="100vw"
//                                 className="block md:hidden object-cover"
//                             />
//                         ) : desktopBanner && (
//                             <Image
//                                 src={desktopBanner}
//                                 alt={project.title}
//                                 fill
//                                 priority
//                                 fetchpriority="high"
//                                 quality={65}
//                                 sizes="100vw"
//                                 className="block md:hidden object-cover"
//                             />
//                         )}
//                         {/* Desktop: lazy — not visible on mobile, no need to block LCP */}
//                         {desktopBanner ? (
//                             <Image
//                                 src={desktopBanner}
//                                 alt={project.title}
//                                 fill
//                                 loading="lazy"
//                                 quality={75}
//                                 sizes="(min-width: 768px) 100vw, 0vw"
//                                 className="hidden md:block object-cover"
//                             />
//                         ) : mobileBanner && (
//                             <Image
//                                 src={mobileBanner}
//                                 alt={project.title}
//                                 fill
//                                 loading="lazy"
//                                 quality={75}
//                                 sizes="(min-width: 768px) 100vw, 0vw"
//                                 className="hidden md:block object-cover"
//                             />
//                         )}

//                         {/* Gradients for legibility */}
//                         <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
//                         <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

//                         {/* Top chips */}
//                         <div className="absolute top-24 md:top-28 left-0 right-0 px-4 md:px-0 md:w-[77%] mx-auto flex flex-wrap items-center gap-2">
//                             <span className="px-3 py-1 rounded-full bg-[#b27e02]/95 text-white text-[11px] md:text-xs font-semibold tracking-wide shadow-md">
//                                 ★ New Launch
//                             </span>
//                             {project.company && (
//                                 <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[11px] md:text-xs font-semibold border border-white/25">
//                                     {project.company}
//                                 </span>
//                             )}
//                             <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[11px] md:text-xs font-semibold border border-white/25">
//                                 ▼ Pre-Launch Pricing Live
//                             </span>
//                         </div>

//                         {/* Center content */}
//                         <div className="absolute inset-x-0 bottom-28 md:bottom-40 px-4 md:px-0 md:w-[77%] mx-auto">
//                             <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight drop-shadow-2xl">
//                                 {project.title}
//                             </h1>
//                             {(project.contentTitle || project.metaDescription) && (
//                                 <p className="text-white/90 text-base md:text-xl mt-3 italic max-w-2xl drop-shadow-md">
//                                     {project.contentTitle || project.metaDescription}
//                                 </p>
//                             )}
//                             {project.projectAddress && (
//                                 <p className="mt-3 text-white/80 text-sm flex items-center gap-1.5 drop-shadow">
//                                     <span>📍</span> {project.projectAddress}
//                                 </p>
//                             )}

//                             <div className="flex flex-wrap gap-3 mt-6">
//                                 <button
//                                     type="button"
//                                     onClick={() => openEnquire({ title: project.title, source: 'Hero Enquire', image: desktopBanner || mobileBanner })}
//                                     className="inline-flex items-center gap-2 px-6 py-3 bg-[#b27e02] hover:bg-[#8a6002] text-white text-sm font-semibold rounded-full shadow-lg transition-all"
//                                 >
//                                     Enquire Now
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                                         <line x1="5" y1="12" x2="19" y2="12" />
//                                         <polyline points="12 5 19 12 12 19" />
//                                     </svg>
//                                 </button>
//                                 {project.brochureUrl && (
//                                     <a
//                                         href={project.brochureUrl}
//                                         target="_blank"
//                                         rel="noopener noreferrer"
//                                         className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/85 text-white text-sm font-semibold rounded-full hover:bg-white/10 backdrop-blur-sm transition-all"
//                                     >
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
//                                             <polyline points="7 10 12 15 17 10" />
//                                             <line x1="12" y1="15" x2="12" y2="3" />
//                                         </svg>
//                                         Download Brochure
//                                     </a>
//                                 )}
//                             </div>
//                         </div>

//                         {/* Stats strip */}
//                         {(project.price || project.totalUnits || project.possession || project.createdDate || project.reraNo) && (
//                             <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm border-t border-white/10">
//                                 <div className="px-4 md:px-0 md:w-[77%] mx-auto py-4 md:py-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-3 md:divide-x md:divide-white/15">
//                                     {project.price && (
//                                         <div className="md:px-5 first:md:pl-0">
//                                             <p className="text-[10px] md:text-xs uppercase tracking-wider text-white/55">Starting Price</p>
//                                             <p className="text-white font-semibold text-sm md:text-base mt-0.5">{project.price}</p>
//                                         </div>
//                                     )}
//                                     {project.totalUnits && (
//                                         <div className="md:px-5">
//                                             <p className="text-[10px] md:text-xs uppercase tracking-wider text-white/55">Total Units</p>
//                                             <p className="text-white font-semibold text-sm md:text-base mt-0.5">{project.totalUnits}</p>
//                                         </div>
//                                     )}
//                                     {project.possession && (
//                                         <div className="md:px-5">
//                                             <p className="text-[10px] md:text-xs uppercase tracking-wider text-white/55">Possession</p>
//                                             <p className="text-white font-semibold text-sm md:text-base mt-0.5">{project.possession}</p>
//                                         </div>
//                                     )}
//                                     {project.createdDate && (
//                                         <div className="md:px-5">
//                                             <p className="text-[10px] md:text-xs uppercase tracking-wider text-white/55">Launch</p>
//                                             <p className="text-white font-semibold text-sm md:text-base mt-0.5">{project.createdDate}</p>
//                                         </div>
//                                     )}
//                                     {project.reraNo && (
//                                         <div className="md:px-5 last:md:pr-0">
//                                             <p className="text-[10px] md:text-xs uppercase tracking-wider text-white/55">RERA No.</p>
//                                             <p className="text-white font-semibold text-xs md:text-sm mt-0.5 font-mono break-all">{project.reraNo}</p>
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             ) : (
//                 <section className="bg-gradient-to-r from-[#b27e02] to-[#6b4a01] text-white pt-28 pb-14">
//                     <div className="w-full px-4 md:px-0 md:w-[77%] mx-auto">
//                         <h1 className="text-4xl md:text-5xl font-bold mb-2">{project.title}</h1>
//                         {project.projectAddress && (
//                             <p className="text-[#faf0d0] mt-1 flex items-center gap-1">
//                                 <span>📍</span> {project.projectAddress}
//                             </p>
//                         )}
//                     </div>
//                 </section>
//             )}

//             <section className="py-20 bg-white">
//                 <div className="w-full px-4 md:px-0 md:w-[77%] mx-auto">
//                     {!project.hideContent && (project.contentTitle || project.contentImage || project.content) && (
//                         <div id="overview">
//                             {project.contentTitle && (
//                                 <div className="text-center mb-8">
//                                     <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{project.contentTitle}</h2>
//                                     <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                                 </div>
//                             )}

//                             {project.contentImage && (
//                                 <div className="mb-8 rounded-xl overflow-hidden shadow-md">
//                                     <img
//                                         src={project.contentImage}
//                                         alt={project.contentTitle || project.title}
//                                         loading="lazy"
//                                         className="w-full max-h-[480px] object-cover"
//                                     />
//                                 </div>
//                             )}

//                             {project.content && (
//                                 <>
//                                     <div
//                                         className={`rich-content text-black text-lg md:text-xl overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-[9999px]' : 'max-h-[800px]'}`}
//                                         dangerouslySetInnerHTML={{ __html: processContent(project.content) }}
//                                     />
//                                     {!isExpanded && (
//                                         <div className="relative -mt-10 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
//                                     )}
//                                     <div className="flex justify-center mt-4">
//                                         <button
//                                             onClick={() => setIsExpanded(v => !v)}
//                                             className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300 text-sm"
//                                         >
//                                             {isExpanded ? 'Read Less' : 'Read More'}
//                                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
//                                                 stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
//                                                 className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
//                                                 <polyline points="6 9 12 15 18 9" />
//                                             </svg>
//                                         </button>
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     )}

//                     {/* Key Highlights */}
//                     {!project.hideKeyHighlights && hasContent(project.keyHighlights) && (
//                         <div id="key-highlights" className="mt-16 mb-16">
//                             <div className="text-center mb-8">
//                                 <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
//                                     {project.keyHighlightsTitle || 'Key Highlights'}
//                                 </h2>
//                                 <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                             </div>
//                             <div
//                                 className="rich-content text-gray-800 text-base md:text-lg"
//                                 dangerouslySetInnerHTML={{ __html: processContent(project.keyHighlights) }}
//                             />
//                         </div>
//                     )}

//                     {/* CTA Button */}
//                     {project.ctaButtonText && (
//                         <div className="mb-16 flex justify-center">
//                             <button
//                                 type="button"
//                                 onClick={() => openEnquire({ title: project.title, source: project.ctaButtonText, image: desktopBanner || mobileBanner })}
//                                 className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] text-white text-sm font-semibold rounded-lg hover:bg-[#8a6002] transition-all duration-300"
//                             >
//                                 {project.ctaButtonText}
//                             </button>
//                         </div>
//                     )}

//                     {/* Walkthrough Video */}
//                     {!project.hideWalkthrough && project.walkthroughUrl && getYouTubeEmbedUrl(project.walkthroughUrl) && (
//                         <div id="walkthrough" className="mb-16">
//                             <div className="text-center mb-8">
//                                 <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
//                                     {project.walkthroughTitle || 'Walkthrough Video'}
//                                 </h2>
//                                 <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                             </div>
//                             {project.walkthroughDuration && (
//                                 <p className="text-sm text-gray-500 text-center mb-6">Duration: {project.walkthroughDuration}</p>
//                             )}
//                             <div className="relative w-full rounded-xl overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
//                                 <iframe
//                                     src={getYouTubeEmbedUrl(project.walkthroughUrl)}
//                                     title="Walkthrough Video"
//                                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                                     allowFullScreen
//                                     className="absolute inset-0 w-full h-full"
//                                 />
//                             </div>
//                         </div>
//                     )}

//                     {/* Configurations */}
//                     {!project.hideConfigurations && hasContent(project.configurations) && (
//                         <div id="configurations" className="mb-16">
//                             <div className="text-center mb-8">
//                                 <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
//                                     {project.configurationsTitle || 'Configurations'}
//                                 </h2>
//                                 <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                             </div>
//                             <div
//                                 className="rich-content text-gray-800 text-base md:text-lg"
//                                 dangerouslySetInnerHTML={{ __html: processContent(project.configurations) }}
//                             />
//                             {project.configurationsCtaLabel && (
//                                 <div className="flex justify-center mt-8">
//                                     <button
//                                         type="button"
//                                         onClick={() => openEnquire({ title: project.title, source: project.configurationsCtaLabel, image: desktopBanner || mobileBanner })}
//                                         className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] text-white text-sm font-semibold rounded-lg hover:bg-[#8a6002] transition-all duration-300"
//                                     >
//                                         {project.configurationsCtaLabel}
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                     {/* Amenities */}
//                     {!project.hideAmenities && (project.amenities?.length > 0 || hasContent(project.amenitiesContent)) && (
//                         <div id="amenities" className="mb-16">
//                             <div className="text-center mb-10">
//                                 <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
//                                     {project.amenitiesTitle || 'Amenities'}
//                                 </h2>
//                                 <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                             </div>
//                             {project.amenities?.length > 0 && (
//                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 mb-10">
//                                     {project.amenities.filter(a => a.icon || a.label).map((amenity, i) => (
//                                         <div key={i} className="group flex flex-col items-center gap-3 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-[#b27e02] transition-all duration-300 cursor-default">
//                                             {amenity.icon && (
//                                                 <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#fef9e7] group-hover:bg-[#b27e02] transition-colors duration-300 p-2">
//                                                     <img
//                                                         src={amenity.icon}
//                                                         alt={amenity.alt || amenity.label || 'amenity'}
//                                                         loading="lazy"
//                                                         className="w-full h-full object-contain group-hover:brightness-0 group-hover:invert transition-all duration-300"
//                                                     />
//                                                 </div>
//                                             )}
//                                             {amenity.label && (
//                                                 <span className="text-xs font-semibold text-center leading-snug text-gray-600 group-hover:text-[#b27e02] transition-colors duration-300">{amenity.label}</span>
//                                             )}
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                             {hasContent(project.amenitiesContent) && (
//                                 <div className="bg-[#fef9e7] rounded-2xl p-6 md:p-8 border border-[#b27e02]/20">
//                                     <div
//                                         className="rich-content text-gray-800 text-base md:text-lg"
//                                         dangerouslySetInnerHTML={{ __html: processContent(project.amenitiesContent) }}
//                                     />
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                     {/* Master Plan & Floor Plan */}
//                     {!project.hideMasterFloorPlan && (() => {
//                         const mfp = project.masterFloorPlan;
//                         if (!mfp) return null;
//                         const masterList = mfp.masterPlans?.filter(p => p.image) || [];
//                         const floorList = mfp.floorPlans?.filter(p => p.image) || [];
//                         if (!masterList.length && !floorList.length && !hasContent(mfp.content)) return null;

//                         const PlanCard = ({ plan, fallbackAlt }) => {
//                             return (
//                                 <div className="relative overflow-hidden rounded-xl group">
//                                     <img
//                                         src={plan.image}
//                                         alt={plan.alt || fallbackAlt}
//                                         className="w-full h-full object-cover blur-sm scale-105"
//                                     />
//                                     <div className="absolute inset-0 bg-black/40" />
//                                     {plan.ctaText && (
//                                         <div className="absolute inset-0 flex items-center justify-center">
//                                             <button
//                                                 type="button"
//                                                 onClick={() => openEnquire({ title: project.title, source: plan.ctaText, image: desktopBanner || mobileBanner })}
//                                                 className="px-5 py-2.5 bg-[#b27e02] hover:bg-[#8a6002] text-white font-semibold text-sm rounded-lg transition-colors duration-300 shadow-lg"
//                                             >
//                                                 {plan.ctaText}
//                                             </button>
//                                         </div>
//                                     )}
//                                     {plan.label && (
//                                         <div className="absolute bottom-0 left-0 right-0 bg-[#b27e02] text-white text-center py-2.5 text-sm font-semibold tracking-wide">
//                                             {plan.label}
//                                         </div>
//                                     )}
//                                 </div>
//                             );
//                         };

//                         return (
//                             <div id="master-floor-plan" className="mb-16">
//                                 <div className="text-center mb-10">
//                                     <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
//                                         {mfp.title || 'Master Plan & Floor Plan'}
//                                     </h2>
//                                     <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                                 </div>

//                                 {hasContent(mfp.content) && (
//                                     <div className="mb-10">
//                                         <div className="rich-content text-gray-800 text-base md:text-lg"
//                                             dangerouslySetInnerHTML={{ __html: processContent(mfp.content) }} />
//                                     </div>
//                                 )}

//                                 {masterList.length > 0 && (
//                                     <div className={floorList.length > 0 ? 'mb-12' : ''}>
//                                         <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
//                                             <span className="w-1 h-6 rounded-full bg-[#b27e02] inline-block" />
//                                             Master Plan
//                                         </h3>
//                                         {masterList.length === 1 ? (
//                                             <div className="relative overflow-hidden rounded-xl h-[420px] md:h-[540px]">
//                                                 <Image src={masterList[0].image} alt={masterList[0].alt || 'Master Plan'} fill sizes="100vw" className="object-cover blur-sm scale-105" />
//                                                 <div className="absolute inset-0 bg-black/50" />
//                                                 {masterList[0].ctaText && (
//                                                     <div className="absolute inset-0 flex items-center justify-center">
//                                                         <button type="button"
//                                                             onClick={() => openEnquire({ title: project.title, source: masterList[0].ctaText, image: desktopBanner || mobileBanner })}
//                                                             className="px-6 py-3 bg-[#b27e02] hover:bg-[#8a6002] text-white font-semibold text-base rounded-lg transition-colors duration-300 shadow-lg">
//                                                             {masterList[0].ctaText}
//                                                         </button>
//                                                     </div>
//                                                 )}
//                                                 {masterList[0].label && (
//                                                     <div className="absolute bottom-0 left-0 right-0 bg-[#b27e02] text-white text-center py-3 text-base font-semibold tracking-wide">
//                                                         {masterList[0].label}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         ) : (
//                                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                                                 {masterList.map((plan, i) => (
//                                                     <div key={i} className="h-52 md:h-64">
//                                                         <PlanCard plan={plan} fallbackAlt={`Master Plan ${i + 1}`} />
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         )}
//                                     </div>
//                                 )}

//                                 {floorList.length > 0 && (
//                                     <div>
//                                         <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center gap-2">
//                                             <span className="w-1 h-6 rounded-full bg-[#b27e02] inline-block" />
//                                             Floor Plan
//                                         </h3>
//                                         {floorList.length === 1 ? (
//                                             <div className="relative overflow-hidden rounded-xl h-[420px] md:h-[540px]">
//                                                 <Image src={floorList[0].image} alt={floorList[0].alt || 'Floor Plan'} fill sizes="100vw" className="object-cover blur-sm scale-105" />
//                                                 <div className="absolute inset-0 bg-black/50" />
//                                                 {floorList[0].ctaText && (
//                                                     <div className="absolute inset-0 flex items-center justify-center">
//                                                         <button type="button"
//                                                             onClick={() => openEnquire({ title: project.title, source: floorList[0].ctaText, image: desktopBanner || mobileBanner })}
//                                                             className="px-6 py-3 bg-[#b27e02] hover:bg-[#8a6002] text-white font-semibold text-base rounded-lg transition-colors duration-300 shadow-lg">
//                                                             {floorList[0].ctaText}
//                                                         </button>
//                                                     </div>
//                                                 )}
//                                                 {floorList[0].label && (
//                                                     <div className="absolute bottom-0 left-0 right-0 bg-[#b27e02] text-white text-center py-3 text-base font-semibold tracking-wide">
//                                                         {floorList[0].label}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         ) : (
//                                             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                                                 {floorList.map((plan, i) => (
//                                                     <div key={i} className="h-52 md:h-64">
//                                                         <PlanCard plan={plan} fallbackAlt={`Floor Plan ${i + 1}`} />
//                                                     </div>
//                                                 ))}
//                                             </div>
//                                         )}
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })()}

//                     {/* Gallery */}
//                     {!project.hideGallery && (() => {
//                         const gallery = project.gallery;
//                         if (!gallery) return null;
//                         const imgs = gallery.images?.filter(i => i.image) || [];
//                         if (!imgs.length && !hasContent(gallery.content)) return null;
//                         const perPage = 4;
//                         const maxIdx = Math.max(0, imgs.length - perPage);
//                         const canPrev = galleryIdx > 0;
//                         const canNext = galleryIdx < maxIdx;
//                         const scrollTo = (idx) => {
//                             setGalleryIdx(idx);
//                             if (galleryTrackRef.current) {
//                                 const itemW = galleryTrackRef.current.offsetWidth / perPage;
//                                 galleryTrackRef.current.scrollTo({ left: idx * itemW, behavior: 'smooth' });
//                             }
//                         };
//                         return (
//                             <div id="gallery" className="mb-16">
//                                 <div className="text-center mb-8">
//                                     <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
//                                         {gallery.title || 'Gallery'}
//                                     </h2>
//                                     <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                                 </div>

//                                 {hasContent(gallery.content) && (
//                                     <div className="mb-8">
//                                         <div
//                                             className={`rich-content text-gray-800 text-base md:text-lg overflow-hidden transition-all duration-500 ${isGalleryExpanded ? 'max-h-[9999px]' : 'max-h-[4.5rem]'}`}
//                                             dangerouslySetInnerHTML={{ __html: processContent(gallery.content) }}
//                                         />
//                                         {!isGalleryExpanded && (
//                                             <div className="relative -mt-6 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
//                                         )}
//                                         <div className="flex justify-center mt-3">
//                                             <button
//                                                 onClick={() => setIsGalleryExpanded(v => !v)}
//                                                 className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300 text-sm"
//                                             >
//                                                 {isGalleryExpanded ? 'Read Less' : 'Read More'}
//                                                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
//                                                     className={`transition-transform duration-300 ${isGalleryExpanded ? 'rotate-180' : ''}`}>
//                                                     <polyline points="6 9 12 15 18 9" />
//                                                 </svg>
//                                             </button>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {imgs.length > 0 && (
//                                     <div className="relative overflow-hidden">
//                                         {/* Left arrow */}
//                                         <button
//                                             onClick={() => scrollTo(Math.max(0, galleryIdx - 1))}
//                                             disabled={!canPrev}
//                                             className={`absolute left-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full border shadow-md transition-all duration-200 ${canPrev ? 'bg-white border-gray-200 hover:bg-[#b27e02] hover:border-[#b27e02] hover:text-white text-gray-700' : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'}`}
//                                         >
//                                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
//                                         </button>

//                                         {/* Track */}
//                                         <div
//                                             ref={galleryTrackRef}
//                                             className="flex overflow-x-hidden gap-3"
//                                         >
//                                             {imgs.map((img, i) => (
//                                                 <div key={i} className="flex-shrink-0 w-[calc(25%-9px)] md:w-[calc(25%-9px)] sm:w-[calc(50%-6px)]">
//                                                     <div className="overflow-hidden rounded-xl cursor-pointer" onClick={() => setLightboxIndex(i)}>
//                                                         <img
//                                                             src={img.image}
//                                                             alt={img.alt || `Gallery ${i + 1}`}
//                                                             loading="lazy"
//                                                             className="w-full h-56 md:h-64 object-cover hover:scale-105 transition-transform duration-500"
//                                                         />
//                                                     </div>
//                                                 </div>
//                                             ))}
//                                         </div>

//                                         {/* Right arrow */}
//                                         <button
//                                             onClick={() => scrollTo(Math.min(maxIdx, galleryIdx + 1))}
//                                             disabled={!canNext}
//                                             className={`absolute right-1 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full border shadow-md transition-all duration-200 ${canNext ? 'bg-white border-gray-200 hover:bg-[#b27e02] hover:border-[#b27e02] hover:text-white text-gray-700' : 'bg-gray-100 border-gray-100 text-gray-300 cursor-not-allowed'}`}
//                                         >
//                                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })()}

//                     {/* Project Specifications */}
//                     {!project.hideProjectSpecifications && (() => {
//                         const ps = project.projectSpecifications;
//                         if (!ps) return null;
//                         const validSpecs = ps.specs?.filter(s => s.title || hasContent(s.content)) || [];
//                         if (!validSpecs.length && !ps.ctaLabel && !hasContent(ps.content)) return null;
//                         return (
//                             <div id="specifications" className="mb-16">
//                                 <div className="text-center mb-8">
//                                     <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
//                                         {ps.title || 'Project Specifications'}
//                                     </h2>
//                                     <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                                 </div>
//                                 {hasContent(ps.content) && (
//                                     <div className="rich-content text-gray-700 text-base md:text-lg mb-8"
//                                         dangerouslySetInnerHTML={{ __html: processContent(ps.content) }} />
//                                 )}
//                                 {validSpecs.length > 0 && (
//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//                                         {validSpecs.map((spec, i) => (
//                                             <div key={i} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
//                                                 {spec.title && (
//                                                     <div className="flex items-center gap-3 mb-4">
//                                                         <div className="w-8 h-8 rounded-lg bg-[#b27e02] flex items-center justify-center flex-shrink-0">
//                                                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
//                                                         </div>
//                                                         <h3 className="text-lg font-bold text-gray-900">{spec.title}</h3>
//                                                     </div>
//                                                 )}
//                                                 {hasContent(spec.content) && (
//                                                     <div className="rich-content text-gray-700 text-sm leading-relaxed"
//                                                         dangerouslySetInnerHTML={{ __html: processContent(spec.content) }} />
//                                                 )}
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                                 {ps.ctaLabel && (
//                                     <div className="flex justify-center">
//                                         <button
//                                             type="button"
//                                             onClick={() => openEnquire({ title: project.title, source: ps.ctaLabel, image: desktopBanner || mobileBanner })}
//                                             className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#b27e02] hover:bg-[#8a6002] text-white text-sm font-semibold rounded-lg transition-colors duration-300"
//                                         >
//                                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                                                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//                                                 <polyline points="14 2 14 8 20 8" />
//                                                 <line x1="16" y1="13" x2="8" y2="13" />
//                                                 <line x1="16" y1="17" x2="8" y2="17" />
//                                                 <polyline points="10 9 9 9 8 9" />
//                                             </svg>
//                                             {ps.ctaLabel}
//                                         </button>
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })()}

//                     {/* Location */}
//                     {!project.hideLocation && ((project.lat && project.lng) || hasContent(project.location?.content)) ? (() => {
//                         const loc = project.location || {};
//                         const hasMap = project.lat && project.lng;
//                         return (
//                             <div id="location" className="mb-16">
//                                 <div className="text-center mb-8">
//                                     <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
//                                         {loc.title || 'Location and Connectivity'}
//                                     </h2>
//                                     <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                                 </div>

//                                 {hasMap && (
//                                     <div className="overflow-hidden rounded-xl mb-8">
//                                         <LeafletMap
//                                             lat={parseFloat(project.lat)}
//                                             lng={parseFloat(project.lng)}
//                                             title={project.title}
//                                         />
//                                     </div>
//                                 )}

//                                 {hasContent(loc.content) && (
//                                     <div>
//                                         <div
//                                             className="rich-content text-gray-800 text-base md:text-lg"
//                                             dangerouslySetInnerHTML={{ __html: processContent(loc.content) }}
//                                         />
//                                     </div>
//                                 )}
//                             </div>
//                         );
//                     })() : null}

//                     {project.technologies && project.technologies.length > 0 && (
//                         <div className="mb-16">
//                             <h3 className="text-2xl md:text-3xl font-bold text-black mb-6">Technologies Used</h3>
//                             <div className="flex flex-wrap gap-3">
//                                 {project.technologies.map((tech, idx) => (
//                                     <div key={idx} className="px-5 py-2 bg-[#faf0d0] text-[#8a6002] rounded-lg font-semibold">
//                                         {tech}
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}

//                     {(project.liveUrl || project.githubUrl) && (
//                         <div className="mb-16">
//                             <h3 className="text-2xl md:text-3xl font-bold text-black mb-6">Project Links</h3>
//                             <div className="flex flex-wrap gap-4">
//                                 {project.liveUrl && (
//                                     <a
//                                         href={project.liveUrl}
//                                         target="_blank"
//                                         rel="noopener noreferrer"
//                                         className="px-6 py-3 bg-[#b27e02] text-white rounded-lg font-semibold hover:bg-[#8a6002] transition flex items-center gap-2"
//                                     >
//                                         Visit Live Site
//                                     </a>
//                                 )}
//                                 {project.githubUrl && (
//                                     <a
//                                         href={project.githubUrl}
//                                         target="_blank"
//                                         rel="noopener noreferrer"
//                                         className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition flex items-center gap-2"
//                                     >
//                                         View on GitHub
//                                     </a>
//                                 )}
//                             </div>
//                         </div>
//                     )}
//                     {/* Project Detailed Overview — section nav + blocks */}
//                     {isHome && !project.hideDetailedOverview && sectionNav.length > 0 && (
//                         <div
//                             id="section-sticky-nav"
//                             className="border-t border-b border-gray-200 mb-12"
//                         >
//                             <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
//                                 {sectionNav.map(item => (
//                                     <button
//                                         key={item.id}
//                                         onClick={() => scrollToSection(item.id)}
//                                         className={`flex-shrink-0 px-5 py-4 text-sm font-semibold border-b-2 transition-colors duration-200 whitespace-nowrap ${activeSection === item.id ? 'border-[#b27e02] text-[#b27e02]' : 'border-transparent text-gray-600 hover:text-[#b27e02] hover:border-[#b27e02]/40'}`}
//                                     >
//                                         {item.label}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     )}
//                     {!project.hideDetailedOverview && project.detailedOverview?.map((block, i) => {
//                         if (!block.title && !hasContent(block.content) && !block.image) return null;
//                         const blockId = block.title ? toBlockId(block.title) : `block-${i}`;
//                         return (
//                             <div key={i} id={blockId} className="mb-16">
//                                 {block.title && (
//                                     <div className="text-center mb-6">
//                                         <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{block.title}</h2>
//                                         <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                                     </div>
//                                 )}
//                                 {block.image && (
//                                     <div className="mb-8 flex items-center justify-center h-72 md:h-[480px]">
//                                         <img
//                                             src={block.image}
//                                             alt={block.imageAlt || block.title || ''}
//                                             loading="lazy"
//                                             className="w-full h-full object-contain"
//                                         />
//                                     </div>
//                                 )}
//                                 {hasContent(block.content) && (
//                                     <div
//                                         className="rich-content text-gray-800 text-base md:text-lg leading-relaxed"
//                                         dangerouslySetInnerHTML={{ __html: processContent(block.content) }}
//                                     />
//                                 )}
//                             </div>
//                         );
//                     })}

//                     {!project.hideFAQs && project.faqs && project.faqs.length > 0 && (
//                         <div id="faqs" className="mb-16">
//                             <h3 className="text-2xl md:text-3xl font-bold text-black mb-8">Frequently Asked Questions</h3>
//                             <div className="space-y-4">
//                                 {project.faqs.map((faq, index) => (
//                                     <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition">
//                                         <button
//                                             onClick={() => setExpandedFAQs(prev => ({
//                                                 ...prev,
//                                                 [index]: !prev[index]
//                                             }))}
//                                             className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition text-left"
//                                         >
//                                             <div
//                                                 className="font-semibold text-gray-800 pr-4 flex-1 rich-content [&_a]:text-[#b27e02] [&_a]:underline [&_strong]:font-bold [&_em]:italic"
//                                                 dangerouslySetInnerHTML={{ __html: processContent(faq.question) }}
//                                             />
//                                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
//                                                 className={`text-[#b27e02] flex-shrink-0 transition-transform duration-300 ${expandedFAQs[index] ? 'rotate-180' : ''}`}>
//                                                 <polyline points="6 9 12 15 18 9" />
//                                             </svg>
//                                         </button>
//                                         {expandedFAQs[index] && (
//                                             <div className="p-4 bg-white border-t border-gray-200">
//                                                 <div
//                                                     className="rich-content text-gray-700 text-base leading-relaxed [&_a]:text-[#b27e02] [&_a]:underline [&_strong]:font-bold [&_em]:italic"
//                                                     dangerouslySetInnerHTML={{ __html: processContent(faq.answer) }}
//                                                 />
//                                             </div>
//                                         )}
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     )}
//                     {/* Latest Blogs — home page only */}
//                     {isHome && !project.hideBlogs && blogs.length > 0 && (
//                         <div id="blogs" className="mb-16">
//                             <div className="text-center mb-8">
//                                 <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Latest Blog</h2>
//                                 <div className="mt-3 mx-auto w-16 h-1 rounded-full bg-[#b27e02]" />
//                             </div>
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                                 {blogs.slice(0, visibleBlogs).map((blog, i) => {
//                                     const blogSlug = blog.slug || blog._id?.toString();
//                                     return (
//                                         <a key={i} href={`/blog/${blogSlug}`}
//                                             className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
//                                             <div className="relative overflow-hidden h-48 bg-gray-100 flex-shrink-0">
//                                                 {(() => {
//                                                     const isImgSrc = (v) => v && typeof v === 'string' && (v.startsWith('http') || v.startsWith('/'));
//                                                     const imgUrl = isImgSrc(blog.heroImage) ? blog.heroImage : isImgSrc(blog.image) ? blog.image : null;
//                                                     return imgUrl ? (
//                                                         <Image src={imgUrl} alt={blog.title} fill
//                                                             sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
//                                                             className="object-cover group-hover:scale-105 transition-transform duration-500" />
//                                                     ) : (
//                                                         <div className="w-full h-full flex items-center justify-center text-5xl bg-[#fef9e7]">📝</div>
//                                                     );
//                                                 })()}
//                                             </div>
//                                             <div className="flex flex-col flex-1 p-5">
//                                                 {blog.category && (
//                                                     <span className="inline-block self-start px-3 py-1 rounded-full text-xs font-semibold bg-[#b27e02]/10 text-[#b27e02] mb-3">
//                                                         {blog.category}
//                                                     </span>
//                                                 )}
//                                                 <h3 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-[#b27e02] transition-colors duration-200 line-clamp-2">
//                                                     {blog.title}
//                                                 </h3>
//                                                 {blog.excerpt && (
//                                                     <p className="text-sm text-gray-500 line-clamp-2 flex-1">{blog.excerpt}</p>
//                                                 )}
//                                                 <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
//                                                     <span className="text-xs text-gray-400">{blog.date || ''}</span>
//                                                     <span className="text-xs font-semibold text-[#b27e02] group-hover:underline">Read More →</span>
//                                                 </div>
//                                             </div>
//                                         </a>
//                                     );
//                                 })}
//                             </div>
//                             {blogs.length > visibleBlogs && (
//                                 <div className="flex justify-center mt-10">
//                                     <button
//                                         onClick={() => setVisibleBlogs(v => v + blogs.length)}
//                                         className="inline-flex items-center gap-2 px-8 py-3 border-2 border-[#b27e02] text-[#b27e02] font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300 text-sm"
//                                     >
//                                         Load More
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//                                             <polyline points="6 9 12 15 18 9" />
//                                         </svg>
//                                     </button>
//                                 </div>
//                             )}
//                         </div>
//                     )}

//                     {!project.hideEnquireCTA && <div className="bg-gradient-to-r from-[#b27e02] to-[#8a6002] text-white p-8 md:p-12 rounded-xl text-center">
//                         <h3 className="text-2xl md:text-3xl font-bold mb-4">Interested in This Project?</h3>
//                         <p className="text-[#faf0d0] mb-8 text-lg">Get in touch with us to know more about pricing, availability, and site visits.</p>
//                         <button
//                             onClick={() => openEnquire({
//                                 image: desktopBanner || mobileBanner,
//                                 projectTitle: project.title,
//                                 source: 'Project Detail',
//                             })}
//                             className="inline-block px-8 py-3 bg-white text-[#b27e02] rounded-lg font-bold border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300"
//                         >
//                             Enquire Now
//                         </button>
//                     </div>}
//                 </div>
//             </section>

//             <Footer />

//             {/* Gallery Lightbox Modal */}
//             {lightboxIndex !== null && (() => {
//                 const galleryImgs = project.gallery?.images?.filter(img => img.image) || [];
//                 const current = galleryImgs[lightboxIndex];
//                 if (!current) return null;
//                 const hasPrev = lightboxIndex > 0;
//                 const hasNext = lightboxIndex < galleryImgs.length - 1;
//                 const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
//                 const handleCopy = () => {
//                     navigator.clipboard.writeText(shareUrl).then(() => {
//                         setCopied(true);
//                         setTimeout(() => setCopied(false), 2000);
//                     });
//                 };
//                 return (
//                     <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={() => setLightboxIndex(null)}>
//                         {/* Top bar */}
//                         <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
//                             <span className="text-white/70 text-sm font-medium">{lightboxIndex + 1} / {galleryImgs.length}</span>
//                             <button onClick={() => setLightboxIndex(null)}
//                                 className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg font-bold transition">✕</button>
//                         </div>

//                         {/* Image + side arrows */}
//                         <div className="flex-1 flex items-center justify-center relative px-16 min-h-0" onClick={e => e.stopPropagation()}>
//                             {hasPrev && (
//                                 <button onClick={() => setLightboxIndex(i => i - 1)}
//                                     className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#b27e02] text-white transition-all duration-200 border border-white/10">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
//                                 </button>
//                             )}

//                             <img
//                                 src={current.image}
//                                 alt={current.alt || `Gallery image ${lightboxIndex + 1}`}
//                                 className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
//                                 style={{ maxHeight: 'calc(100vh - 200px)' }}
//                             />

//                             {hasNext && (
//                                 <button onClick={() => setLightboxIndex(i => i + 1)}
//                                     className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#b27e02] text-white transition-all duration-200 border border-white/10">
//                                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
//                                 </button>
//                             )}
//                         </div>

//                         {/* Alt text */}
//                         {current.alt && (
//                             <p className="text-center text-white/50 text-sm px-4 pt-3 flex-shrink-0" onClick={e => e.stopPropagation()}>{current.alt}</p>
//                         )}

//                         {/* Share bar */}
//                         <div className="flex-shrink-0 px-5 py-4" onClick={e => e.stopPropagation()}>
//                             <p className="text-white/50 text-xs text-center mb-3 uppercase tracking-widest">Share</p>
//                             <div className="flex items-center justify-center gap-3 flex-wrap">
//                                 {/* Copy Link */}
//                                 <button onClick={handleCopy}
//                                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition">
//                                     {copied ? (
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
//                                     ) : (
//                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
//                                     )}
//                                     {copied ? 'Copied!' : 'Copy Link'}
//                                 </button>

//                                 {/* WhatsApp */}
//                                 <a href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
//                                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/40 text-[#25D366] text-sm font-medium transition">
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.126 1.535 5.862L0 24l6.272-1.519A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.374l-.359-.213-3.724.901.939-3.617-.234-.372A9.818 9.818 0 0 1 2.182 12c0-5.42 4.398-9.818 9.818-9.818 5.42 0 9.818 4.398 9.818 9.818 0 5.42-4.398 9.818-9.818 9.818z" /></svg>
//                                     WhatsApp
//                                 </a>

//                                 {/* Facebook */}
//                                 <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
//                                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1877F2]/20 hover:bg-[#1877F2]/40 text-[#1877F2] text-sm font-medium transition">
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
//                                     Facebook
//                                 </a>

//                                 {/* X / Twitter */}
//                                 <a href={`https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
//                                     className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition">
//                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
//                                     X
//                                 </a>
//                             </div>
//                         </div>
//                     </div>
//                 );
//             })()}
//         </div>
//     );
// }
