'use client';

// Sticky right-side navigator for long admin forms (project edit/create,
// blog edit, etc.). On mount it auto-discovers every "section card" — a
// <div class="bg-white rounded-xl shadow-lg…"> with an <h3> heading — and
// renders a fixed jump-list of those section titles. Click a row to scroll
// smoothly to that section.
//
// Why DOM-discovery instead of a hardcoded list: the project edit page has
// 19+ sections (and the create page slightly fewer), so this stays in sync
// automatically when new sections are added/removed without touching the
// nav. Sections get a deterministic id derived from their h3 text so the
// active-section highlight survives navigation between similar pages.

import { useEffect, useState } from 'react';
import { MdList } from 'react-icons/md';

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

export default function FormSectionNav({ rootSelector = 'main', headingSelector = 'h3.text-lg.font-bold.text-gray-800' } = {}) {
    const [sections, setSections] = useState([]);
    const [activeId, setActiveId] = useState('');
    const [open, setOpen] = useState(false); // mobile collapsed by default

    // Discover sections + assign ids to their cards. Runs once after mount
    // and also when the DOM changes significantly (e.g. async-loaded data
    // expands the form).
    useEffect(() => {
        const findAndIndex = () => {
            const root = document.querySelector(rootSelector) || document.body;
            const headings = Array.from(root.querySelectorAll(headingSelector));
            const found = [];
            const seen = new Set();
            for (const h of headings) {
                const text = (h.textContent || '').replace(/\s+/g, ' ').trim();
                if (!text) continue;
                const card = h.closest('.bg-white.rounded-xl.shadow-lg, .bg-white.rounded-xl');
                if (!card) continue;
                let id = card.id;
                if (!id) {
                    const base = `form-section-${slugify(text)}`;
                    let n = 1;
                    id = base;
                    while (seen.has(id)) { id = `${base}-${++n}`; }
                    card.id = id;
                }
                if (seen.has(id)) continue;
                seen.add(id);
                found.push({ id, label: text });
            }
            setSections(found);
        };

        findAndIndex();
        // Re-run when the form likely re-renders (DOM mutations from data
        // load, expanding panels, etc.). Throttled by rAF.
        let scheduled = false;
        const obs = new MutationObserver(() => {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => {
                scheduled = false;
                findAndIndex();
            });
        });
        const root = document.querySelector(rootSelector);
        if (root) obs.observe(root, { childList: true, subtree: true });
        return () => obs.disconnect();
    }, [rootSelector, headingSelector]);

    // Active-section highlight via IntersectionObserver — whichever section
    // is closest to the viewport top wins.
    useEffect(() => {
        if (sections.length === 0) return;
        const els = sections.map(s => document.getElementById(s.id)).filter(Boolean);
        if (els.length === 0) return;
        const io = new IntersectionObserver((entries) => {
            const visible = entries.filter(e => e.isIntersecting);
            if (visible.length === 0) return;
            const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
            if (top?.target?.id) setActiveId(top.target.id);
        }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
        els.forEach(el => io.observe(el));
        return () => io.disconnect();
    }, [sections]);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        // Account for any fixed header height. The admin sidebar is to the
        // left so no top offset needed, but giving a small gap looks nicer.
        const top = el.getBoundingClientRect().top + window.scrollY - 16;
        window.scrollTo({ top, behavior: 'smooth' });
        setActiveId(id);
        setOpen(false); // close mobile drawer after picking
    };

    if (sections.length === 0) return null;

    return (
        <>
            {/* Mobile floating toggle — pops the nav as a drawer. Hidden on
                xl+ because the sticky desktop nav handles that case. */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-label="Form sections"
                className="xl:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gold text-white shadow-xl flex items-center justify-center hover:bg-amber-600 transition"
            >
                <MdList size={22} />
            </button>

            {/* Desktop sticky panel (xl: ≥1280px) — always visible at the
                top-right of the viewport so it never blocks the main form. */}
            <aside className="hidden xl:block fixed top-24 right-4 z-30 w-60">
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 max-h-[78vh] overflow-y-auto">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.18em] mb-2 px-2">Jump to section</p>
                    <ul className="space-y-0.5">
                        {sections.map(s => (
                            <li key={s.id}>
                                <button
                                    type="button"
                                    onClick={() => scrollTo(s.id)}
                                    className={`w-full text-left text-[13px] rounded px-2 py-1.5 transition truncate ${activeId === s.id
                                        ? 'bg-gold/10 text-gold font-semibold'
                                        : 'text-gray-700 hover:text-gold hover:bg-cream'}`}
                                    title={s.label}
                                >
                                    {s.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            {/* Mobile drawer (controlled by the floating button). Slides up
                from the bottom — easier to reach with a thumb. */}
            {open ? (
                <div className="xl:hidden fixed inset-0 z-40 bg-black/40 flex items-end" onClick={() => setOpen(false)}>
                    <div className="w-full bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-gray-800">Jump to section</p>
                            <button type="button" onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-800">Close</button>
                        </div>
                        <ul className="space-y-1">
                            {sections.map(s => (
                                <li key={s.id}>
                                    <button
                                        type="button"
                                        onClick={() => scrollTo(s.id)}
                                        className={`w-full text-left text-sm rounded-lg px-3 py-2.5 transition ${activeId === s.id
                                            ? 'bg-gold/10 text-gold font-semibold'
                                            : 'text-gray-700 hover:bg-cream'}`}
                                    >
                                        {s.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : null}
        </>
    );
}
