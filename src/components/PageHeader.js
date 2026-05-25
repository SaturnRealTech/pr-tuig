'use client';

// Fallback page header used when a section / page has no hero banner image.
// Renders a clean text-only block with the page title (and optional subtitle)
// plus a breadcrumb trail. Sized to occupy roughly the same vertical space
// as a short hero so the layout below doesn't jump.

import Link from 'next/link';
import { MdHome, MdChevronRight } from 'react-icons/md';

export default function PageHeader({ title, breadcrumbs = [] }) {
    return (
        <section
            className="relative bg-gradient-to-br from-moss via-leaf to-forest text-background overflow-hidden"
            aria-label="Page header"
        >
            <div className="relative max-w-[1300px] mx-auto px-6 pt-24 md:pt-28 pb-12 md:pb-16">
                {/* Breadcrumb */}
                {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 ? (
                    <nav aria-label="Breadcrumb" className="mb-4">
                        <ol className="flex flex-wrap items-center gap-1.5 text-[12px] md:text-[13px] text-background/75">
                            <li>
                                <Link href="/" className="inline-flex items-center gap-1 hover:text-gold transition">
                                    <MdHome size={14} /> Home
                                </Link>
                            </li>
                            {breadcrumbs.map((c, i) => {
                                const isLast = i === breadcrumbs.length - 1;
                                return (
                                    <li key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                                        <MdChevronRight size={14} className="text-background/40" />
                                        {c.href && !isLast ? (
                                            <Link href={c.href} className="hover:text-gold transition">
                                                {c.label}
                                            </Link>
                                        ) : (
                                            <span className={isLast ? 'text-gold font-medium' : ''}>{c.label}</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </nav>
                ) : null}

                {/* Title */}
                <h1 className="font-display font-medium text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-tight">
                    {title}
                </h1>
            </div>
        </section>
    );
}
