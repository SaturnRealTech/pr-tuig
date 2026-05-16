'use client';

import Image from 'next/image';
import { useEnquireNow } from '@/lib/EnquireNowContext';

export default function ProjectCard({ project }) {
    const { openEnquire } = useEnquireNow();
    const imageSrc = project.desktopBanner || project.mobileBanner || project.image;

    return (
        <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-[#b27e02]/15 transition-all duration-400 border border-gray-100 flex flex-col">

            {/* Banner */}
            <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                {imageSrc ? (
                    <Image src={imageSrc} alt={project.title || ''} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                )}
                <div className="absolute top-3 left-3">
                    <span className="bg-[#b27e02] text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow">
                        New Launch
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col flex-1 p-6">
                <h3 className="text-base font-bold text-black leading-snug mb-2 group-hover:text-[#b27e02] transition-colors line-clamp-2">
                    {project.title}
                </h3>

                {project.projectAddress && (
                    <div className="flex items-start gap-1.5 text-gray-500 text-sm mb-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <span className="line-clamp-1">{project.projectAddress}</span>
                    </div>
                )}

                {project.company && (
                    <p className="text-xs text-gray-400 mb-4">
                        By <span className="font-semibold text-gray-600">{project.company}</span>
                    </p>
                )}

                <div className="mt-auto">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Price</p>
                            <p className="text-xl font-bold text-[#b27e02] leading-none">
                                {project.price ? `${project.price} Cr*` : 'On Request'}
                            </p>
                        </div>
                        {project.possession && (
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Possession</p>
                                <p className="text-xs font-semibold text-gray-700">{project.possession}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => openEnquire({
                                image: imageSrc,
                                projectTitle: project.title,
                                source: 'Project Card',
                            })}
                            className="flex-1 text-center py-2 bg-[#b27e02] text-white text-xs font-semibold rounded-lg hover:bg-[#8a6002] transition">
                            Enquire Now
                        </button>
                        <a href={project.slug ? `/${project.slug}` : '#'}
                            className="flex-1 text-center py-2 border border-[#b27e02] text-[#b27e02] text-xs font-semibold rounded-lg hover:bg-[#b27e02] hover:text-white transition">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
