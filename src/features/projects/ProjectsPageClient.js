'use client';

import { useState } from 'react';
import { MdArrowRight } from 'react-icons/md';
import Image from 'next/image';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';

export default function ProjectsPageClient({ projects = [], categories = ['All'] }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProjects = projects.filter((project) => {
        const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
        const matchesSearch =
            searchQuery === '' ||
            project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            project.technologies?.some((tech) => tech.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-white to-white">
            <WhatsAppIcon />

            <nav className="fixed w-full top-0 z-50 border-b border-[#b27e02]/20 bg-white/95 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="text-2xl font-bold">
                        <a href="/">
                            <span className="text-[#b27e02]">Qwikly</span>
                            <span className="text-black">Launch</span>
                        </a>
                    </div>
                    <div className="hidden md:flex gap-8">
                        <a href="/#services" className="text-gray-700 hover:text-[#b27e02] transition-colors font-medium">Services</a>
                        <a href="/about" className="text-gray-700 hover:text-[#b27e02] transition-colors font-medium">About</a>
                        <a href="/careers" className="text-gray-700 hover:text-[#b27e02] transition-colors font-medium">Careers</a>
                        <a href="/#contact" className="text-gray-700 hover:text-[#b27e02] transition-colors font-medium">Contact</a>
                    </div>
                    <a
                        href="/contact"
                        className="md:hidden bg-[#b27e02] text-white px-4 py-2 rounded-lg hover:bg-[#8a6002] transition font-medium"
                    >
                        Contact
                    </a>
                </div>
            </nav>

            <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-white">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#b27e02]/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b27e02]/20 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                        Our Projects
                    </h1>
                    <p className="text-xl text-gray-300">
                        See how we've helped founders and companies launch their next big idea
                    </p>
                </div>
            </section>

            <section className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 max-w-2xl mx-auto">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search projects by name, company, or technology..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-6 py-4 pr-12 border-2 border-gray-200 rounded-full focus:outline-none focus:border-[#b27e02] text-gray-800 placeholder-gray-400 shadow-sm"
                            />
                            <div className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400">
                                🔍
                            </div>
                        </div>
                    </div>

                    <div className="mb-12 flex flex-wrap gap-3 justify-center">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-full font-medium transition-all ${selectedCategory === category
                                    ? 'bg-[#b27e02] text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProjects.map((project) => (
                            <a
                                key={project._id || project.id || project.slug}
                                href={`/projects/${project.slug || project.id || project._id}`}
                                className="group bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:border-[#b27e02]"
                            >
                                {project.image ? (
                                    <div className="relative h-48 overflow-hidden">
                                        <Image
                                            src={project.image}
                                            alt={project.title}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            unoptimized
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gradient-to-br from-[#fef9e7] to-gray-50 flex items-center justify-center">
                                        <span className="text-6xl">🚀</span>
                                    </div>
                                )}

                                <div className="p-6">
                                    <div className="mb-3">
                                        <span className="text-xs font-bold px-3 py-1 bg-[#faf0d0] text-[#b27e02] rounded-full">
                                            {project.category}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-black mb-2 group-hover:text-[#b27e02] transition-colors">
                                        {project.title}
                                    </h3>

                                    {(project.company || project.duration) && (
                                        <p className="text-sm text-gray-600 mb-3">
                                            {project.company && <span className="font-semibold">{project.company}</span>}
                                            {project.company && project.duration && ' • '}
                                            {project.duration && <span>{project.duration}</span>}
                                        </p>
                                    )}

                                    {project.status && (
                                        <div className="mb-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${project.status === 'Completed'
                                                ? 'bg-green-100 text-green-700'
                                                : project.status === 'In Progress'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {project.status}
                                            </span>
                                        </div>
                                    )}

                                    {project.technologies && project.technologies.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex flex-wrap gap-2">
                                                {project.technologies.slice(0, 4).map((tech, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                                {project.technologies.length > 4 && (
                                                    <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                                                        +{project.technologies.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full mt-4 py-2 px-4 bg-[#b27e02] text-white rounded-lg font-semibold hover:bg-[#8a6002] transition-all flex items-center justify-center gap-2 group-hover:gap-3">
                                        View Project
                                        <MdArrowRight />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>

                    {filteredProjects.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <p className="text-2xl font-bold text-gray-800 mb-2">
                                {searchQuery ? 'No projects found' : 'No projects in this category'}
                            </p>
                            {searchQuery && (
                                <p className="text-gray-600">
                                    Try searching with different keywords or browse all projects
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section className="py-20 px-6 bg-gradient-to-br from-[#b27e02] to-[#8a6002]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Launch Your Next Project?
                    </h2>
                    <p className="text-xl text-[#faf0d0] mb-8">
                        Let's work together to bring your ideas to life in weeks, not months.
                    </p>
                    <a href="/#contact" className="inline-block px-8 py-3 bg-white text-[#b27e02] rounded-lg font-bold hover:bg-[#fef9e7] transition-all">
                        Get Started Today
                    </a>
                </div>
            </section>

            <Footer />
        </div>
    );
}
