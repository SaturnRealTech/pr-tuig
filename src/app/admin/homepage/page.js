'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MdSave } from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), {
    ssr: false,
    loading: () => <p className="text-gray-500">Loading editor...</p>,
});


export default function HomePageManagement() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [schemaError, setSchemaError] = useState('');

    const [formData, setFormData] = useState({
        heroTitle: '',
        heroSubtitle: '',
        heroDescription: '',
        heroCtaText: '',
        heroCtaLink: '',
        desktopHeroBanner: '',
        mobileHeroBanner: '',
        featuredProjectsTitle: '',
        featuredProjectsSubtitle: '',
        aboutSectionTitle: '',
        aboutSectionContent: '',
        whyChooseUsTitle: '',
        whyChooseUsContent: '',
        testimonialsTitle: '',
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        featuredProjects: [],
        localBusinessSchema: '',
    });

    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProjects, setSelectedProjects] = useState([]);
    const projectsPerPage = 10;

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { 
            router.push('/admin/login'); 
            return; 
        }
        setUser(JSON.parse(userData));
        fetchHomepageData();
        fetchProjects();
    }, [router]);

    const fetchHomepageData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/homepage');
            const result = await res.json();
            if (result.success && result.data) {
                setFormData(prev => ({ ...prev, ...result.data }));
                setSelectedProjects(result.data.featuredProjects || []);
            }
        } catch (error) {
            console.error('Error fetching homepage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            const res = await fetch(`/api/projects?page=${currentPage}&limit=${projectsPerPage}&search=${encodeURIComponent(searchTerm)}`);
            const result = await res.json();
            if (result.success) {
                setProjects(Array.isArray(result.data) ? result.data : (result.data.projects ?? []));
                setTotalPages(Math.ceil((Array.isArray(result.data) ? result.data.length : (result.data.total ?? result.data.projects?.length ?? 0)) / projectsPerPage));
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProjectToggle = (projectId) => {
        setSelectedProjects(prev => 
            prev.includes(projectId) 
                ? prev.filter(id => id !== projectId)
                : [...prev, projectId]
        );
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSchemaChange = (val) => {
        setFormData(prev => ({ ...prev, localBusinessSchema: val }));
        if (!val.trim()) { setSchemaError(''); return; }
        try { JSON.parse(val); setSchemaError(''); } catch { setSchemaError('Invalid JSON — please fix before saving.'); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                featuredProjects: selectedProjects,
            };
            const res = await fetch('/api/homepage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Saved!',
                    text: 'Homepage content has been updated successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.error || 'Failed to save homepage content',
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save homepage content',
            });
        } finally {
            setSaving(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-3">⏳</div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content */}
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Homepage Management</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage homepage content, banners, and sections</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center">
                                <div className="text-5xl mb-3">⏳</div>
                                <p className="text-gray-500">Loading homepage data...</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Featured Projects Selection */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Featured Projects Selection</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Search Projects</label>
                                        <input 
                                            type="text" 
                                            value={searchTerm} 
                                            onChange={handleSearch}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                            placeholder="Search projects by name, location, builder..." 
                                        />
                                    </div>
                                    
                                    {loadingProjects ? (
                                        <div className="text-center py-4">
                                            <div className="text-2xl mb-2">⏳</div>
                                            <p className="text-gray-500">Loading projects...</p>
                                        </div>
                                    ) : projects.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm text-gray-600">
                                                    Showing {((currentPage - 1) * projectsPerPage) + 1}-{Math.min(currentPage * projectsPerPage, projects.length)} of {projects.length} projects
                                                </p>
                                                <button 
                                                    type="button"
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className="px-3 py-1 bg-[#b27e02] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Previous
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className="px-3 py-1 bg-[#b27e02] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                            
                                            <div className="max-h-64 overflow-y-auto border border border-gray-200 rounded-lg">
                                                {projects.map(project => (
                                                    <label key={project._id} className="flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                                                        <input 
                                                            type="checkbox"
                                                            checked={selectedProjects.includes(project._id)}
                                                            onChange={() => handleProjectToggle(project._id)}
                                                            className="accent-[#b27e02] w-4 h-4 flex-shrink-0" 
                                                        />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{project.title}</p>
                                                            <p className="text-sm text-gray-500">{project.projectAddress}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                            
                                            {totalPages > 1 && (
                                                <div className="flex justify-center gap-2 mt-4">
                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                        <button
                                                            key={page}
                                                            type="button"
                                                            onClick={() => handlePageChange(page)}
                                                            className={`px-3 py-1 rounded-lg ${
                                                                currentPage === page 
                                                                    ? 'bg-[#b27e02] text-white' 
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-500 py-4">No projects found</p>
                                    )}
                                </div>
                            </div>

                            {/* About Section */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">About Section</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text" name="aboutSectionTitle" value={formData.aboutSectionTitle} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                            placeholder="About Saturn RealCon" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Content</label>
                                        <TipTapEditor
                                            content={formData.aboutSectionContent}
                                            onChange={(html) => setFormData(prev => ({ ...prev, aboutSectionContent: html }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Why Choose Us Section */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Why Choose Us Section</h3>
                                <p className="text-sm text-gray-400 mb-4">Displayed on the homepage after the Builders section</p>
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text" name="whyChooseUsTitle" value={formData.whyChooseUsTitle} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                            placeholder="Why Choose Saturn RealCon?" />
                                    </div>
                                    {/* Content */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                                        <TipTapEditor
                                            content={formData.whyChooseUsContent}
                                            onChange={(html) => setFormData(prev => ({ ...prev, whyChooseUsContent: html }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SEO Settings */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">SEO Settings</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
                                        <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} maxLength="60"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                            placeholder="Saturn RealCon - Premium Real Estate" />
                                        <p className="text-xs text-gray-400 mt-1">{(formData.metaTitle || '').length}/60</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                                        <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={3} maxLength="160"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                            placeholder="Discover premium residential and commercial properties with Saturn RealCon" />
                                        <p className="text-xs text-gray-400 mt-1">{(formData.metaDescription || '').length}/160</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                                        <input type="text" name="keywords" value={formData.keywords} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                            placeholder="real estate, property, luxury homes, commercial" />
                                    </div>
                                </div>
                            </div>

                            {/* Local Business / Product Schema */}
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-1">Local Business Schema (JSON-LD)</h3>
                                <p className="text-sm text-gray-400 mb-4">Paste your LocalBusiness / Restaurant / RealEstateAgent JSON-LD here. It will be injected as a <code>&lt;script type=&quot;application/ld+json&quot;&gt;</code> on the homepage.</p>
                                <textarea
                                    value={formData.localBusinessSchema}
                                    onChange={e => handleSchemaChange(e.target.value)}
                                    rows={12}
                                    spellCheck={false}
                                    className={`w-full px-4 py-3 border rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#faf0d0] text-gray-900 resize-y ${schemaError ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-[#b27e02]'}`}
                                    placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "RealEstateAgent",\n  "name": "Your Business Name",\n  "telephone": "+91-XXXXXXXXXX",\n  "address": {\n    "@type": "PostalAddress",\n    "streetAddress": "Street",\n    "addressLocality": "City",\n    "addressRegion": "State",\n    "postalCode": "000000",\n    "addressCountry": "IN"\n  }\n}`}
                                />
                                {schemaError && (
                                    <p className="mt-2 text-xs text-red-500 font-medium">{schemaError}</p>
                                )}
                                {formData.localBusinessSchema && !schemaError && (
                                    <p className="mt-2 text-xs text-green-600 font-medium">JSON is valid</p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button type="submit" disabled={saving || !!schemaError}
                                    className="flex-1 px-6 py-3 bg-[#b27e02] text-white rounded-lg hover:bg-[#8a6002] transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                                    <MdSave size={18} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
