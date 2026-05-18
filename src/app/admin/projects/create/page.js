'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    MdSave, MdArrowBack,
    MdDesktopWindows, MdPhoneAndroid, MdVisibility,
    MdImage,
} from 'react-icons/md';
import Swal from 'sweetalert2';
import AdminSidebar from '@/components/AdminSidebar';

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), { ssr: false });
const MediaPicker = dynamic(() => import('@/components/MediaPicker'), { ssr: false });

// Banner picker — media library only (no direct upload)
function BannerPicker({ label, hint, icon, filterType, value, onChange }) {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <div>
            <p className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                {icon} {label} <span className="text-xs text-gray-400 font-normal">({hint})</span>
            </p>
            {value ? (
                <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                    <img src={value} alt={label} className="w-full h-40 object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => setShowPicker(true)}
                            className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-[#fef9e7] transition">
                            Change
                        </button>
                        <button type="button" onClick={() => onChange('')}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition">
                            Remove
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => setShowPicker(true)}
                    className="w-full flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#b27e02] hover:bg-[#fef9e7] transition">
                    <MdImage size={32} className="text-gray-300 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                </button>
            )}
            {showPicker && (
                <MediaPicker
                    filterType={filterType}
                    onSelect={(url) => { onChange(url); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

function AmenityItem({ amenity, onUpdate, onRemove }) {
    const [showPicker, setShowPicker] = useState(false);
    return (
        <div className="relative border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col items-center gap-2">
            <button type="button" onClick={onRemove}
                className="absolute top-1.5 right-1.5 text-red-400 hover:text-red-600 text-xs font-bold leading-none">✕</button>

            <button type="button" onClick={() => setShowPicker(true)}
                className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#b27e02] flex items-center justify-center overflow-hidden bg-white transition">
                {amenity.icon
                    ? <img src={amenity.icon} alt={amenity.alt || 'icon'} className="w-full h-full object-contain p-1" />
                    : <MdImage size={28} className="text-gray-300" />}
            </button>

            <input type="text" value={amenity.alt || ''} onChange={e => onUpdate('alt', e.target.value)}
                placeholder="Alt text *" required
                className="w-full text-xs text-center border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#b27e02] text-gray-800 bg-white" />

            <input type="text" value={amenity.label} onChange={e => onUpdate('label', e.target.value)}
                placeholder="Label"
                className="w-full text-xs text-center border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#b27e02] text-gray-800 bg-white" />

            {showPicker && (
                <MediaPicker
                    returnMeta
                    onSelect={({ url, alt }) => { onUpdate('icon', url); if (alt && !amenity.alt) onUpdate('alt', alt); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

function PlanItem({ plan, onUpdate, onRemove, label }) {
    const [showPicker, setShowPicker] = useState(false);
    return (
        <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col">
            <button type="button" onClick={onRemove}
                className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition">✕</button>
            <button type="button" onClick={() => setShowPicker(true)}
                className="w-full h-40 flex flex-col items-center justify-center bg-white hover:bg-[#fef9e7] border-b border-gray-200 transition overflow-hidden">
                {plan.image
                    ? <img src={plan.image} alt={plan.alt || label} className="w-full h-full object-cover" />
                    : <><MdImage size={36} className="text-gray-300 mb-1" /><span className="text-xs text-gray-400 font-medium">Choose Image</span></>}
            </button>
            <div className="p-3 space-y-2">
                <input type="text" value={plan.alt || ''} onChange={e => onUpdate('alt', e.target.value)}
                    placeholder="Alt text *" required
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-[#b27e02] text-gray-800 bg-white" />
                <input type="text" value={plan.label || ''} onChange={e => onUpdate('label', e.target.value)}
                    placeholder="Caption / Details (e.g. 1,375 sq. ft.)"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-[#b27e02] text-gray-800 bg-white" />
                <input type="text" value={plan.ctaText || ''} onChange={e => onUpdate('ctaText', e.target.value)}
                    placeholder="CTA Button Text (e.g. Enquire Now)"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-[#b27e02] text-gray-800 bg-white" />
            </div>
            {showPicker && (
                <MediaPicker
                    returnMeta
                    onSelect={({ url, alt }) => { onUpdate('image', url); if (alt && !plan.alt) onUpdate('alt', alt); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

function GalleryImageItem({ item, onUpdate, onRemove }) {
    const [showPicker, setShowPicker] = useState(false);
    return (
        <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col">
            <button type="button" onClick={onRemove}
                className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition">✕</button>
            <button type="button" onClick={() => setShowPicker(true)}
                className="w-full h-36 flex flex-col items-center justify-center bg-white hover:bg-[#fef9e7] border-b border-gray-200 transition overflow-hidden">
                {item.image
                    ? <img src={item.image} alt={item.alt || 'gallery'} className="w-full h-full object-cover" />
                    : <><MdImage size={32} className="text-gray-300 mb-1" /><span className="text-xs text-gray-400 font-medium">Choose Image</span></>}
            </button>
            <div className="p-2.5">
                <input type="text" value={item.alt || ''} onChange={e => onUpdate('alt', e.target.value)}
                    placeholder="Alt text *" required
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-[#b27e02] text-gray-800 bg-white" />
            </div>
            {showPicker && (
                <MediaPicker
                    returnMeta
                    onSelect={({ url, alt }) => { onUpdate('image', url); if (alt && !item.alt) onUpdate('alt', alt); setShowPicker(false); }}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}

function SectionToggle({ checked, onChange }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
            <span className="text-xs text-gray-500">{checked ? 'Visible' : 'Hidden'}</span>
            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-[#b27e02]' : 'bg-gray-300'}`}>
                <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
        </label>
    );
}

export default function CreateProject() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        projectAddress: '',
        price: '',
        totalUnits: '',
        reraNo: '',
        possession: '',
        createdDate: new Date().toISOString().split('T')[0],
        lat: '',
        lng: '',
        company: '',
        contentTitle: '',
        contentImage: '',
        content: '',
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        schemaName: '',
        schemaDescription: '',
        schemaBrand: '',
        schemaPrice: '',
        schemaPriceCurrency: 'INR',
        schemaAvailability: 'InStock',
        schemaLocation: '',
        schemaPossession: '',
        schemaRatingValue: '',
        schemaRatingCount: '',
        desktopBanner: '',
        mobileBanner: '',
        amenities: [],
        amenitiesTitle: '',
        amenitiesContent: '',
        keyHighlightsTitle: '',
        keyHighlights: '',
        ctaButtonText: '',
        configurations: '',
        configurationsTitle: '',
        configurationsCtaLabel: '',
        walkthroughTitle: '',
        walkthroughUrl: '',
        walkthroughDuration: '',
        masterFloorPlan: { title: '', content: '', masterPlans: [], floorPlans: [] },
        gallery: { title: '', content: '', images: [] },
        projectSpecifications: { title: '', content: '', specs: [], ctaLabel: '' },
        location: { title: '', content: '' },
        faqs: [],
        hideContent: false,
        hideEnquireCTA: false,
        hideKeyHighlights: false,
        hideWalkthrough: false,
        hideAmenities: false,
        hideConfigurations: false,
        hideMasterFloorPlan: false,
        hideGallery: false,
        hideProjectSpecifications: false,
        hideLocation: false,
        hideFAQs: false,
        hideBlogs: false,
        isHomePage: false,
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTitleChange = (e) => {
        const val = e.target.value;
        const slug = val.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/--+/g, '-').trim();
        setFormData(prev => ({ ...prev, title: val, slug }));
    };

    const addAmenity = () => {
        setFormData(prev => ({ ...prev, amenities: [...prev.amenities, { icon: '', alt: '', label: '' }] }));
    };
    const removeAmenity = (i) => {
        setFormData(prev => ({ ...prev, amenities: prev.amenities.filter((_, idx) => idx !== i) }));
    };
    const updateAmenity = (i, field, value) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.map((a, idx) => idx === i ? { ...a, [field]: value } : a),
        }));
    };

    const addFAQ = () => {
        setFormData(prev => ({
            ...prev,
            faqs: [...prev.faqs, { question: '', answer: '' }]
        }));
    };

    const removeFAQ = (index) => {
        setFormData(prev => ({
            ...prev,
            faqs: prev.faqs.filter((_, i) => i !== index)
        }));
    };

    const updateFAQ = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            faqs: prev.faqs.map((faq, i) =>
                i === index ? { ...faq, [field]: value } : faq
            )
        }));
    };

    const updateGallery = (field, val) => setFormData(prev => ({ ...prev, gallery: { ...prev.gallery, [field]: val } }));
    const addGalleryImage = () => setFormData(prev => ({ ...prev, gallery: { ...prev.gallery, images: [...prev.gallery.images, { image: '', alt: '' }] } }));
    const removeGalleryImage = (i) => setFormData(prev => ({ ...prev, gallery: { ...prev.gallery, images: prev.gallery.images.filter((_, idx) => idx !== i) } }));
    const updateGalleryImage = (i, field, val) => setFormData(prev => ({ ...prev, gallery: { ...prev.gallery, images: prev.gallery.images.map((img, idx) => idx === i ? { ...img, [field]: val } : img) } }));

    const updateMFP = (field, value) => {
        setFormData(prev => ({ ...prev, masterFloorPlan: { ...prev.masterFloorPlan, [field]: value } }));
    };

    const updateLocation = (field, val) => setFormData(prev => ({ ...prev, location: { ...prev.location, [field]: val } }));

    const updatePS = (field, val) => setFormData(prev => ({ ...prev, projectSpecifications: { ...prev.projectSpecifications, [field]: val } }));
    const addSpec = () => setFormData(prev => ({ ...prev, projectSpecifications: { ...prev.projectSpecifications, specs: [...prev.projectSpecifications.specs, { title: '', content: '' }] } }));
    const removeSpec = (i) => setFormData(prev => ({ ...prev, projectSpecifications: { ...prev.projectSpecifications, specs: prev.projectSpecifications.specs.filter((_, idx) => idx !== i) } }));
    const updateSpec = (i, field, val) => setFormData(prev => ({ ...prev, projectSpecifications: { ...prev.projectSpecifications, specs: prev.projectSpecifications.specs.map((s, idx) => idx === i ? { ...s, [field]: val } : s) } }));
    const addMasterPlan = () => updateMFP('masterPlans', [...(formData.masterFloorPlan.masterPlans), { image: '', alt: '', label: '', ctaText: '' }]);
    const removeMasterPlan = (i) => updateMFP('masterPlans', formData.masterFloorPlan.masterPlans.filter((_, idx) => idx !== i));
    const updateMasterPlan = (i, field, val) => updateMFP('masterPlans', formData.masterFloorPlan.masterPlans.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
    const addFloorPlan = () => updateMFP('floorPlans', [...(formData.masterFloorPlan.floorPlans), { image: '', alt: '', label: '', ctaText: '' }]);
    const removeFloorPlan = (i) => updateMFP('floorPlans', formData.masterFloorPlan.floorPlans.filter((_, idx) => idx !== i));
    const updateFloorPlan = (i, field, val) => updateMFP('floorPlans', formData.masterFloorPlan.floorPlans.map((p, idx) => idx === i ? { ...p, [field]: val } : p));

    const handleSubmit = async (e, publishStatus = 'draft') => {
        e.preventDefault();
        if (!formData.title) { Swal.fire('Error', 'Project title is required', 'error'); return; }
        setLoading(true);
        try {
            const payload = {
                ...formData,
                publishStatus,
            };
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: publishStatus === 'published' ? 'Published!' : 'Saved as Draft',
                    text: publishStatus === 'published' ? 'Project is now live.' : 'Project saved as draft.',
                    timer: 2000, showConfirmButton: false,
                });
                router.push('/admin/projects/list');
            } else {
                Swal.fire('Error', result.error || 'Failed to create project', 'error');
            }
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
        finally { setLoading(false); }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-6">
                        <button onClick={() => router.push('/admin/projects/list')} className="flex items-center gap-2 text-gray-600 hover:text-[#b27e02] mb-3 transition">
                            <MdArrowBack size={20} /> Back to Projects
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">Add New Project</h1>
                        <p className="text-gray-500 text-sm mt-1">Fill in details, then Save as Draft or Publish.</p>
                    </div>

                    <form onSubmit={e => e.preventDefault()}>
                        <div className="flex gap-6 items-start">

                            {/* ── Left Column ── */}
                            <div className="flex-1 space-y-6 min-w-0">

                                {/* Basic Info */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Project Details</h3>
                                    <div className="space-y-4">

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Project Title <span className="text-[#b27e02]">*</span></label>
                                            <input type="text" name="title" value={formData.title} onChange={handleTitleChange} required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="e.g., Skyline Residences" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Slug <span className="text-[#b27e02]">*</span></label>
                                            <input type="text" name="slug" value={formData.slug} onChange={handleChange} required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 font-mono"
                                                placeholder="skyline-residences" />
                                            <p className="text-xs text-gray-400 mt-1">URL: /projects/<strong>{formData.slug || 'your-slug'}</strong></p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Project Address</label>
                                            <input type="text" name="projectAddress" value={formData.projectAddress} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="123 Main Street, City, State" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                                                <input type="text" name="price" value={formData.price} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="₹ 50 Lakhs onwards" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Units</label>
                                                <input type="text" name="totalUnits" value={formData.totalUnits} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="240" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">RERA No.</label>
                                                <input type="text" name="reraNo" value={formData.reraNo} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="RERA123456" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Developer / Company</label>
                                                <input type="text" name="company" value={formData.company} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="Saturn Realty Pvt. Ltd." />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Possession Date</label>
                                                <input type="date" name="possession" value={formData.possession} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Launch / Created Date</label>
                                                <input type="date" name="createdDate" value={formData.createdDate} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
                                                <input type="text" name="lat" value={formData.lat} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="28.6139" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
                                                <input type="text" name="lng" value={formData.lng} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="77.2090" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Banner Images */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Banner Images</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <BannerPicker
                                            label="Desktop Banner"
                                            hint="16:9 landscape"
                                            icon={<MdDesktopWindows className="text-[#b27e02]" size={18} />}
                                            filterType="hero"
                                            value={formData.desktopBanner}
                                            onChange={(url) => setFormData(prev => ({ ...prev, desktopBanner: url }))}
                                        />
                                        <BannerPicker
                                            label="Mobile Banner"
                                            hint="9:16 portrait"
                                            icon={<MdPhoneAndroid className="text-[#b27e02]" size={18} />}
                                            filterType="hero-mobile"
                                            value={formData.mobileBanner}
                                            onChange={(url) => setFormData(prev => ({ ...prev, mobileBanner: url }))}
                                        />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">Project Description</h3>
                                        <SectionToggle checked={!formData.hideContent} onChange={e => setFormData(prev => ({ ...prev, hideContent: !e.target.checked }))} />
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                            <input type="text" name="contentTitle" value={formData.contentTitle} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="e.g. About This Project" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Featured Image</label>
                                            <BannerPicker
                                                label="Featured Image"
                                                hint="landscape recommended"
                                                icon={<MdImage className="text-[#b27e02]" size={18} />}
                                                filterType="hero"
                                                value={formData.contentImage}
                                                onChange={(url) => setFormData(prev => ({ ...prev, contentImage: url }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                            <TipTapEditor
                                                content={formData.content}
                                                onChange={(html) => setFormData(prev => ({ ...prev, content: html }))}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SEO */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">SEO Settings</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
                                            <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} maxLength="60"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="SEO title (55–60 characters)" />
                                            <p className="text-xs text-gray-400 mt-1">{formData.metaTitle.length}/60</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                                            <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={3} maxLength="160"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="SEO description (150–160 characters)" />
                                            <p className="text-xs text-gray-400 mt-1">{formData.metaDescription.length}/160</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                                            <input type="text" name="keywords" value={formData.keywords} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="real estate, luxury villa, 3BHK" />
                                        </div>
                                    </div>
                                </div>

                                {/* Product Schema */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-1">Product Schema</h3>
                                    <p className="text-xs text-gray-400 mb-4">Used by search engines for rich results. Leave blank to auto-fill from project fields.</p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                                            <input type="text" name="schemaName" value={formData.schemaName} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="Auto from project title" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                            <textarea name="schemaDescription" value={formData.schemaDescription} onChange={handleChange} rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="Auto from meta description" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Brand / Builder Name</label>
                                            <input type="text" name="schemaBrand" value={formData.schemaBrand} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="Auto from company / builder" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                                                <input type="text" name="schemaPrice" value={formData.schemaPrice} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="Auto from price" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Currency</label>
                                                <select name="schemaPriceCurrency" value={formData.schemaPriceCurrency} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 bg-white">
                                                    <option value="INR">INR</option>
                                                    <option value="USD">USD</option>
                                                    <option value="AED">AED</option>
                                                    <option value="GBP">GBP</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Availability</label>
                                            <input type="text" name="schemaAvailability" value={formData.schemaAvailability} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="e.g. InStock, PreOrder, SoldOut" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Location / Address</label>
                                            <input type="text" name="schemaLocation" value={formData.schemaLocation} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="Auto from project address" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Possession</label>
                                            <input type="text" name="schemaPossession" value={formData.schemaPossession} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="Auto from possession (e.g. Dec 2026)" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Aggregate Rating Value</label>
                                                <input type="number" step="0.1" min="1" max="5" name="schemaRatingValue" value={formData.schemaRatingValue} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="e.g. 4.5" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Review Count</label>
                                                <input type="number" min="1" name="schemaRatingCount" value={formData.schemaRatingCount} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                    placeholder="e.g. 128" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Highlights + CTA Button */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">Key Highlights</h3>
                                        <SectionToggle checked={!formData.hideKeyHighlights} onChange={e => setFormData(prev => ({ ...prev, hideKeyHighlights: !e.target.checked }))} />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text" name="keyHighlightsTitle" value={formData.keyHighlightsTitle} onChange={handleChange}
                                            placeholder="Key Highlights"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>
                                    <TipTapEditor
                                        content={formData.keyHighlights}
                                        onChange={(html) => setFormData(prev => ({ ...prev, keyHighlights: html }))}
                                    />
                                    <div className="mt-5 pt-5 border-t border-gray-200">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">CTA Button Text</label>
                                        <input type="text" name="ctaButtonText" value={formData.ctaButtonText} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                            placeholder="e.g. Download Brochure, Book a Visit" />
                                    </div>
                                </div>

                                {/* Walkthrough Video */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">Walkthrough Video</h3>
                                        <SectionToggle checked={!formData.hideWalkthrough} onChange={e => setFormData(prev => ({ ...prev, hideWalkthrough: !e.target.checked }))} />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                            <input type="text" name="walkthroughTitle" value={formData.walkthroughTitle} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="Walkthrough Video" />
                                            <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube Video URL</label>
                                            <input type="text" name="walkthroughUrl" value={formData.walkthroughUrl} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="https://www.youtube.com/watch?v=..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Video Duration</label>
                                            <input type="text" name="walkthroughDuration" value={formData.walkthroughDuration} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900"
                                                placeholder="e.g. 3:45 or 10 mins" />
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">Amenities</h3>
                                        <div className="flex items-center gap-3">
                                            <SectionToggle checked={!formData.hideAmenities} onChange={e => setFormData(prev => ({ ...prev, hideAmenities: !e.target.checked }))} />
                                            <button type="button" onClick={addAmenity}
                                                className="px-3 py-1.5 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition">
                                                + Add Amenity
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text" name="amenitiesTitle" value={formData.amenitiesTitle} onChange={handleChange}
                                            placeholder="Amenities"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>
                                    {formData.amenities.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic py-2">No amenities added yet. Click "+ Add Amenity" to get started.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                                            {formData.amenities.map((amenity, i) => (
                                                <AmenityItem
                                                    key={i}
                                                    amenity={amenity}
                                                    onUpdate={(field, val) => updateAmenity(i, field, val)}
                                                    onRemove={() => removeAmenity(i)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities Description</label>
                                        <TipTapEditor
                                            content={formData.amenitiesContent}
                                            onChange={(html) => setFormData(prev => ({ ...prev, amenitiesContent: html }))}
                                        />
                                    </div>
                                </div>

                                {/* Configurations */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">Configurations</h3>
                                        <SectionToggle checked={!formData.hideConfigurations} onChange={e => setFormData(prev => ({ ...prev, hideConfigurations: !e.target.checked }))} />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text" name="configurationsTitle" value={formData.configurationsTitle} onChange={handleChange}
                                            placeholder="Configurations"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>
                                    <TipTapEditor
                                        content={formData.configurations}
                                        onChange={(html) => setFormData(prev => ({ ...prev, configurations: html }))}
                                    />
                                    <div className="mt-5 pt-5 border-t border-gray-200">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Button Label</label>
                                        <input type="text" name="configurationsCtaLabel" value={formData.configurationsCtaLabel} onChange={handleChange}
                                            placeholder="e.g. View Floor Plans, Book a Visit"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to hide the button</p>
                                    </div>
                                </div>

                                {/* Master Plan & Floor Plan */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-lg font-bold text-gray-800">Master Plan &amp; Floor Plan</h3>
                                        <SectionToggle checked={!formData.hideMasterFloorPlan} onChange={e => setFormData(prev => ({ ...prev, hideMasterFloorPlan: !e.target.checked }))} />
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text"
                                            value={formData.masterFloorPlan.title}
                                            onChange={e => updateMFP('title', e.target.value)}
                                            placeholder="Master Plan & Floor Plan"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Section Description</label>
                                        <TipTapEditor
                                            content={formData.masterFloorPlan.content}
                                            onChange={(html) => updateMFP('content', html)}
                                        />
                                    </div>

                                    {/* Master Plans */}
                                    <div className="mb-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Master Plans</h4>
                                            <button type="button" onClick={addMasterPlan}
                                                className="px-3 py-1.5 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition">
                                                + Add Master Plan
                                            </button>
                                        </div>
                                        {formData.masterFloorPlan.masterPlans.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic py-2">No master plans added yet.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {formData.masterFloorPlan.masterPlans.map((plan, i) => (
                                                    <PlanItem key={i} plan={plan} label="Master Plan"
                                                        onUpdate={(field, val) => updateMasterPlan(i, field, val)}
                                                        onRemove={() => removeMasterPlan(i)} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Floor Plans */}
                                    <div className="border-t border-gray-200 pt-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Floor Plans</h4>
                                            <button type="button" onClick={addFloorPlan}
                                                className="px-3 py-1.5 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition">
                                                + Add Floor Plan
                                            </button>
                                        </div>
                                        {formData.masterFloorPlan.floorPlans.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic py-2">No floor plans added yet.</p>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {formData.masterFloorPlan.floorPlans.map((plan, i) => (
                                                    <PlanItem key={i} plan={plan} label="Floor Plan"
                                                        onUpdate={(field, val) => updateFloorPlan(i, field, val)}
                                                        onRemove={() => removeFloorPlan(i)} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Gallery */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-lg font-bold text-gray-800">Gallery</h3>
                                        <SectionToggle checked={!formData.hideGallery} onChange={e => setFormData(prev => ({ ...prev, hideGallery: !e.target.checked }))} />
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text"
                                            value={formData.gallery.title}
                                            onChange={e => updateGallery('title', e.target.value)}
                                            placeholder="Gallery"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Section Description</label>
                                        <TipTapEditor
                                            content={formData.gallery.content}
                                            onChange={(html) => updateGallery('content', html)}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Images</h4>
                                        <button type="button" onClick={addGalleryImage}
                                            className="px-3 py-1.5 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition">
                                            + Add Image
                                        </button>
                                    </div>
                                    {formData.gallery.images.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic py-2">No images added yet. Click "+ Add Image" to get started.</p>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {formData.gallery.images.map((item, i) => (
                                                <GalleryImageItem
                                                    key={i}
                                                    item={item}
                                                    onUpdate={(field, val) => updateGalleryImage(i, field, val)}
                                                    onRemove={() => removeGalleryImage(i)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Project Specifications */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-lg font-bold text-gray-800">Project Specifications</h3>
                                        <SectionToggle checked={!formData.hideProjectSpecifications} onChange={e => setFormData(prev => ({ ...prev, hideProjectSpecifications: !e.target.checked }))} />
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text"
                                            value={formData.projectSpecifications.title}
                                            onChange={e => updatePS('title', e.target.value)}
                                            placeholder="Project Specifications"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Section Description</label>
                                        <TipTapEditor
                                            content={formData.projectSpecifications.content}
                                            onChange={html => updatePS('content', html)}
                                        />
                                    </div>

                                    {/* Spec items */}
                                    <div className="mb-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Specifications</h4>
                                            <button type="button" onClick={addSpec}
                                                className="px-3 py-1.5 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition">
                                                + Add Specification
                                            </button>
                                        </div>
                                        {formData.projectSpecifications.specs.length === 0 ? (
                                            <p className="text-sm text-gray-400 italic py-2">No specifications added yet.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {formData.projectSpecifications.specs.map((spec, i) => (
                                                    <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
                                                        <button type="button" onClick={() => removeSpec(i)}
                                                            className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-xs font-bold leading-none">✕</button>
                                                        <input type="text"
                                                            value={spec.title}
                                                            onChange={e => updateSpec(i, 'title', e.target.value)}
                                                            placeholder="Specification title (e.g. Land Area)"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm mb-3" />
                                                        <TipTapEditor
                                                            content={spec.content}
                                                            onChange={html => updateSpec(i, 'content', html)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* PDF CTA */}
                                    <div className="border-t border-gray-200 pt-5">
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">PDF / Brochure Button</h4>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1">Button Label</label>
                                        <input type="text"
                                            value={formData.projectSpecifications.ctaLabel}
                                            onChange={e => updatePS('ctaLabel', e.target.value)}
                                            placeholder="e.g. Download Brochure"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] text-gray-900 text-sm" />
                                    </div>
                                </div>

                                {/* Location */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="text-lg font-bold text-gray-800">Location &amp; Connectivity</h3>
                                        <SectionToggle checked={!formData.hideLocation} onChange={e => setFormData(prev => ({ ...prev, hideLocation: !e.target.checked }))} />
                                    </div>

                                    <div className="mb-5">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text"
                                            value={formData.location.title}
                                            onChange={e => updateLocation('title', e.target.value)}
                                            placeholder="Location and Connectivity"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>

                                    <div className="mb-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Location Description</label>
                                        <TipTapEditor
                                            content={formData.location.content}
                                            onChange={html => updateLocation('content', html)}
                                        />
                                        <p className="text-xs text-gray-400 mt-2">Map is auto-generated from the Latitude &amp; Longitude fields above.</p>
                                    </div>
                                </div>

                                {/* FAQs */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-800">Frequently Asked Questions</h3>
                                        <div className="flex items-center gap-3">
                                            <SectionToggle checked={!formData.hideFAQs} onChange={e => setFormData(prev => ({ ...prev, hideFAQs: !e.target.checked }))} />
                                            <button type="button" onClick={addFAQ}
                                                className="px-3 py-1.5 bg-[#b27e02] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6002] transition">
                                                + Add FAQ
                                            </button>
                                        </div>
                                    </div>
                                    {formData.faqs.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic py-4">No FAQs added yet. Click "Add FAQ" to get started.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {formData.faqs.map((faq, index) => (
                                                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <span className="text-sm font-semibold text-gray-600">FAQ #{index + 1}</span>
                                                        <button type="button" onClick={() => removeFAQ(index)}
                                                            className="text-red-500 hover:text-red-700 text-sm font-semibold transition">
                                                            Remove
                                                        </button>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Question</label>
                                                            <TipTapEditor
                                                                content={faq.question}
                                                                onChange={(html) => updateFAQ(index, 'question', html)}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Answer</label>
                                                            <TipTapEditor
                                                                content={faq.answer}
                                                                onChange={(html) => updateFAQ(index, 'answer', html)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Enquire CTA visibility */}
                                <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Interested in This Project? (CTA)</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">The enquire CTA block at the bottom of the page</p>
                                    </div>
                                    <SectionToggle checked={!formData.hideEnquireCTA} onChange={e => setFormData(prev => ({ ...prev, hideEnquireCTA: !e.target.checked }))} />
                                </div>

                                {/* Home Page Assignment */}
                                <div className={`rounded-xl shadow-lg p-6 flex items-center justify-between border-2 ${formData.isHomePage ? 'bg-[#fef9e7] border-[#b27e02]' : 'bg-white border-transparent'}`}>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Set as Home Page</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">This project will appear on the home page URL (/). Only one project should be set as home.</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                                        <span className="text-xs text-gray-500">{formData.isHomePage ? 'Home Page' : 'Not Home'}</span>
                                        <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${formData.isHomePage ? 'bg-[#b27e02]' : 'bg-gray-300'}`}>
                                            <input type="checkbox" className="sr-only" checked={formData.isHomePage} onChange={e => setFormData(prev => ({ ...prev, isHomePage: e.target.checked }))} />
                                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${formData.isHomePage ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </div>
                                    </label>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => router.push('/admin/projects/list')}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={(e) => handleSubmit(e, 'draft')} disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#b27e02] text-[#b27e02] rounded-lg hover:bg-[#fef9e7] transition font-semibold disabled:opacity-50">
                                        <MdSave size={18} />
                                        {loading ? 'Saving…' : 'Save as Draft'}
                                    </button>
                                    <button type="button" onClick={(e) => handleSubmit(e, 'published')} disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#b27e02] text-white rounded-lg hover:bg-[#8a6002] transition font-semibold disabled:opacity-50">
                                        <MdVisibility size={18} />
                                        {loading ? 'Publishing…' : 'Publish'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
