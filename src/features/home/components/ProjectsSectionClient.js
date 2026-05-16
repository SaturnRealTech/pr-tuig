'use client';

import { useState, useMemo } from 'react';
import ProjectCard from '@/components/ProjectCard';
import { MdClose, MdTune } from 'react-icons/md';

function sorted(arr) {
    return [...new Set((arr || []).map(v => (v || '').trim()).filter(Boolean))].sort();
}

const FILTER_GROUPS = ['Builder', 'Property Type', 'Property Status', 'Location'];

export default function ProjectsSectionClient({ projects = [], groupedCategories = {} }) {
    const [filters, setFilters] = useState({});
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [visibleCount, setVisibleCount] = useState(8);
    const PAGE_SIZE = 8;

    const activeGroups = FILTER_GROUPS.filter(g => (groupedCategories[g] || []).length > 0);

    const filtered = useMemo(() => {
        return projects.filter(p => {
            const cats = sorted(p.categories || []);
            return activeGroups.every(group => {
                const selected = filters[group];
                if (!selected) return true;
                return cats.includes(selected);
            });
        });
    }, [projects, filters, activeGroups]);

    const hasFilter = Object.values(filters).some(Boolean);
    const activeCount = Object.values(filters).filter(Boolean).length;
    const reset = () => { setFilters({}); setVisibleCount(PAGE_SIZE); };
    const setFilter = (group, val) => { setFilters(prev => ({ ...prev, [group]: val })); setVisibleCount(PAGE_SIZE); };

    const visibleProjects = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    if (!projects.length) return null;

    const selectClass =
        'px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white ' +
        'focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#b27e02]/20 min-w-[160px]';

    return (
        <section className="py-20 bg-gray-50">
            <div className="w-[90%] mx-auto">

                {/* Heading */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Our Projects</h2>
                    <div className="h-1 w-20 bg-[#b27e02] mx-auto rounded-full" />
                </div>

                {/* Desktop Filters */}
                {activeGroups.length > 0 && (
                    <div className="hidden md:flex flex-wrap items-center gap-3 mb-10">
                        {activeGroups.map(group => (
                            <select
                                key={group}
                                value={filters[group] || ''}
                                onChange={e => setFilter(group, e.target.value)}
                                className={selectClass}
                            >
                                <option value="">{group}</option>
                                {sorted(groupedCategories[group]).map(o => (
                                    <option key={o} value={o}>{o}</option>
                                ))}
                            </select>
                        ))}
                        {hasFilter && (
                            <button type="button" onClick={reset}
                                className="px-4 py-2.5 text-sm font-semibold text-[#b27e02] border border-[#b27e02] rounded-lg hover:bg-[#b27e02] hover:text-white transition">
                                Reset
                            </button>
                        )}
                        <p className="ml-auto text-sm text-gray-500">
                            {filtered.length} project{filtered.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                )}

                {/* Mobile Filter Button */}
                {activeGroups.length > 0 && (
                    <div className="flex md:hidden items-center justify-between mb-6">
                        <p className="text-sm text-gray-500">
                            {filtered.length} project{filtered.length !== 1 ? 's' : ''} found
                        </p>
                        <button
                            type="button"
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 shadow-sm relative"
                        >
                            <MdTune size={18} className="text-[#b27e02]" />
                            Filters
                            {activeCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#b27e02] text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">No projects match the selected filters.</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {visibleProjects.map(project => (
                                <ProjectCard key={project.id} project={project} />
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

            {/* Mobile Bottom Sheet */}
            {drawerOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setDrawerOpen(false)}
                    />

                    {/* Drawer */}
                    <div className="relative bg-white rounded-t-2xl shadow-2xl px-6 pt-5 pb-8 z-10">
                        {/* Handle bar */}
                        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Filter Projects</h3>
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                            >
                                <MdClose size={20} />
                            </button>
                        </div>

                        {/* Filter Selects */}
                        <div className="space-y-4">
                            {activeGroups.map(group => (
                                <div key={group}>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        {group}
                                    </label>
                                    <select
                                        value={filters[group] || ''}
                                        onChange={e => setFilter(group, e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:border-[#b27e02]"
                                    >
                                        <option value="">All {group}s</option>
                                        {sorted(groupedCategories[group]).map(o => (
                                            <option key={o} value={o}>{o}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-8">
                            {hasFilter && (
                                <button
                                    type="button"
                                    onClick={reset}
                                    className="flex-1 py-3 border border-[#b27e02] text-[#b27e02] font-semibold rounded-lg text-sm transition hover:bg-[#fef9e7]"
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setDrawerOpen(false)}
                                className="flex-1 py-3 bg-[#b27e02] text-white font-semibold rounded-lg text-sm transition hover:bg-[#8a6002]"
                            >
                                Show {filtered.length} Project{filtered.length !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
