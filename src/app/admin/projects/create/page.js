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
                            className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-cream transition">
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
                    className="w-full flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl hover:border-gold hover:bg-cream transition">
                    <MdImage size={32} className="text-gray-300 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">Choose from Media Library</span>
                </button>
            )}
            {showPicker && (
                <MediaPicker
                    filterType={filterType}
                    currentUrl={value}
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
                className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-gold flex items-center justify-center overflow-hidden bg-white transition">
                {amenity.icon
                    ? <img src={amenity.icon} alt={amenity.alt || 'icon'} className="w-full h-full object-contain p-1" />
                    : <MdImage size={28} className="text-gray-300" />}
            </button>

            <input type="text" value={amenity.alt || ''} onChange={e => onUpdate('alt', e.target.value)}
                placeholder="Alt text *" required
                className="w-full text-xs text-center border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold text-gray-800 bg-white" />

            <input type="text" value={amenity.label} onChange={e => onUpdate('label', e.target.value)}
                placeholder="Label"
                className="w-full text-xs text-center border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gold text-gray-800 bg-white" />

            {showPicker && (
                <MediaPicker
                    returnMeta
                    currentUrl={amenity.icon}
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
                className="w-full h-40 flex flex-col items-center justify-center bg-white hover:bg-cream border-b border-gray-200 transition overflow-hidden">
                {plan.image
                    ? <img src={plan.image} alt={plan.alt || label} className="w-full h-full object-cover" />
                    : <><MdImage size={36} className="text-gray-300 mb-1" /><span className="text-xs text-gray-400 font-medium">Choose Image</span></>}
            </button>
            <div className="p-3 space-y-2">
                <input type="text" value={plan.alt || ''} onChange={e => onUpdate('alt', e.target.value)}
                    placeholder="Alt text *" required
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-gold text-gray-800 bg-white" />
                <input type="text" value={plan.label || ''} onChange={e => onUpdate('label', e.target.value)}
                    placeholder="Caption / Details (e.g. 1,375 sq. ft.)"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-gold text-gray-800 bg-white" />
                <input type="text" value={plan.ctaText || ''} onChange={e => onUpdate('ctaText', e.target.value)}
                    placeholder="CTA Button Text (e.g. Enquire Now)"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-gold text-gray-800 bg-white" />
            </div>
            {showPicker && (
                <MediaPicker
                    returnMeta
                    currentUrl={plan.image}
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
                className="w-full h-36 flex flex-col items-center justify-center bg-white hover:bg-cream border-b border-gray-200 transition overflow-hidden">
                {item.image
                    ? <img src={item.image} alt={item.alt || 'gallery'} className="w-full h-full object-cover" />
                    : <><MdImage size={32} className="text-gray-300 mb-1" /><span className="text-xs text-gray-400 font-medium">Choose Image</span></>}
            </button>
            <div className="p-2.5">
                <input type="text" value={item.alt || ''} onChange={e => onUpdate('alt', e.target.value)}
                    placeholder="Alt text *" required
                    className="w-full text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-gold text-gray-800 bg-white" />
            </div>
            {showPicker && (
                <MediaPicker
                    returnMeta
                    currentUrl={item.image}
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
            <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-gold' : 'bg-gray-300'}`}>
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
    const [jsonText, setJsonText] = useState('');

    const applyJson = (raw) => {
        try {
            const json = JSON.parse(raw);
            const p = (...keys) => { for (const k of keys) { if (json[k] !== undefined && json[k] !== null) return json[k]; } return undefined; };
            const str = (...keys) => { const v = p(...keys); return v !== undefined ? (String(v) || '') : undefined; };
            const kw = p('keywords', 'tags');
            const sameAs = p('orgSchemaSameAs', 'sameAs');
            setFormData(prev => ({
                ...prev,
                ...(p('title') !== undefined && { title: str('title') }),
                ...(p('slug') !== undefined && { slug: str('slug') }),
                ...(p('projectAddress', 'address') !== undefined && { projectAddress: str('projectAddress', 'address') }),
                ...(p('price') !== undefined && { price: str('price') }),
                ...(p('totalUnits') !== undefined && { totalUnits: str('totalUnits') }),
                ...(p('reraNo', 'rera') !== undefined && { reraNo: str('reraNo', 'rera') }),
                ...(p('possession') !== undefined && { possession: str('possession') }),
                ...(p('createdDate') !== undefined && { createdDate: str('createdDate') }),
                ...(p('company', 'builder', 'brand') !== undefined && { company: str('company', 'builder', 'brand') }),
                ...(p('lat', 'latitude') !== undefined && { lat: str('lat', 'latitude') }),
                ...(p('lng', 'longitude') !== undefined && { lng: str('lng', 'longitude') }),
                ...(p('contentTitle') !== undefined && { contentTitle: str('contentTitle') }),
                ...(p('contentImage') !== undefined && { contentImage: str('contentImage') }),
                ...(p('content', 'body', 'html', 'description') !== undefined && { content: str('content', 'body', 'html', 'description') }),
                ...(p('metaTitle', 'seoTitle') !== undefined && { metaTitle: str('metaTitle', 'seoTitle') }),
                ...(p('metaDescription', 'seoDescription') !== undefined && { metaDescription: str('metaDescription', 'seoDescription') }),
                ...(kw !== undefined && { keywords: Array.isArray(kw) ? kw.join(', ') : (kw || '') }),
                ...(p('desktopBanner', 'desktopImage') !== undefined && { desktopBanner: str('desktopBanner', 'desktopImage') }),
                ...(p('mobileBanner', 'mobileImage') !== undefined && { mobileBanner: str('mobileBanner', 'mobileImage') }),
                ...(p('publishStatus') !== undefined && { publishStatus: str('publishStatus') }),
                ...(p('shortOverview', 'overviewShort', 'briefOverview', 'summary') !== undefined && { shortOverview: str('shortOverview', 'overviewShort', 'briefOverview', 'summary') }),
                ...(p('bhkConfig', 'configurationLabel', 'bhk', 'configurationsShort') !== undefined && { bhkConfig: str('bhkConfig', 'configurationLabel', 'bhk', 'configurationsShort') }),
                ...(p('heroBadge1') !== undefined && { heroBadge1: str('heroBadge1') }),
                ...(p('heroBadge2') !== undefined && { heroBadge2: str('heroBadge2') }),
                ...(p('heroBadge3') !== undefined && { heroBadge3: str('heroBadge3') }),
                ...(p('carpetArea', 'carpet', 'carpetRange', 'plotSize') !== undefined && { carpetArea: str('carpetArea', 'carpet', 'carpetRange', 'plotSize') }),
                ...(p('landParcel', 'density', 'landSize') !== undefined && { landParcel: str('landParcel', 'density', 'landSize') }),
                ...(p('keyHighlightsTitle') !== undefined && { keyHighlightsTitle: str('keyHighlightsTitle') }),
                ...(p('keyHighlights') !== undefined && { keyHighlights: str('keyHighlights') }),
                ...(Array.isArray(p('highlightItems', 'highlightCards', 'highlights')) && { highlightItems: p('highlightItems', 'highlightCards', 'highlights') }),
                ...(p('ctaButtonText') !== undefined && { ctaButtonText: str('ctaButtonText') }),
                ...(p('amenitiesTitle') !== undefined && { amenitiesTitle: str('amenitiesTitle') }),
                ...(p('amenitiesContent') !== undefined && { amenitiesContent: str('amenitiesContent') }),
                ...(p('configurations') !== undefined && { configurations: str('configurations') }),
                ...(p('configurationsTitle') !== undefined && { configurationsTitle: str('configurationsTitle') }),
                ...(p('configurationsCtaLabel') !== undefined && { configurationsCtaLabel: str('configurationsCtaLabel') }),
                ...(Array.isArray(p('configurationRows', 'pricingRows', 'pricingItems')) && { configurationRows: p('configurationRows', 'pricingRows', 'pricingItems') }),
                ...(p('walkthroughTitle') !== undefined && { walkthroughTitle: str('walkthroughTitle') }),
                ...(p('walkthroughUrl') !== undefined && { walkthroughUrl: str('walkthroughUrl') }),
                ...(p('walkthroughDuration') !== undefined && { walkthroughDuration: str('walkthroughDuration') }),
                ...(Array.isArray(p('amenities')) && { amenities: json.amenities }),
                ...(Array.isArray(p('faqs')) && { faqs: json.faqs }),
                ...(Array.isArray(p('detailedOverview')) && { detailedOverview: json.detailedOverview }),
                ...(p('gallery') && typeof json.gallery === 'object' && { gallery: { ...prev.gallery, ...json.gallery } }),
                ...(p('masterFloorPlan') && typeof json.masterFloorPlan === 'object' && { masterFloorPlan: { ...prev.masterFloorPlan, ...json.masterFloorPlan } }),
                ...(p('projectSpecifications') && typeof json.projectSpecifications === 'object' && { projectSpecifications: { ...prev.projectSpecifications, ...json.projectSpecifications } }),
                ...(p('location') && typeof json.location === 'object' && { location: { ...prev.location, ...json.location } }),
                ...(p('schemaName') !== undefined && { schemaName: str('schemaName') }),
                ...(p('schemaDescription') !== undefined && { schemaDescription: str('schemaDescription') }),
                ...(p('schemaBrand') !== undefined && { schemaBrand: str('schemaBrand') }),
                ...(p('schemaPrice') !== undefined && { schemaPrice: str('schemaPrice') }),
                ...(p('schemaPriceCurrency') !== undefined && { schemaPriceCurrency: str('schemaPriceCurrency') }),
                ...(p('schemaAvailability') !== undefined && { schemaAvailability: str('schemaAvailability') }),
                ...(p('schemaLocation') !== undefined && { schemaLocation: str('schemaLocation') }),
                ...(p('schemaPossession') !== undefined && { schemaPossession: str('schemaPossession') }),
                ...(p('schemaRatingValue') !== undefined && { schemaRatingValue: str('schemaRatingValue') }),
                ...(p('schemaRatingCount') !== undefined && { schemaRatingCount: str('schemaRatingCount') }),
                ...(p('orgSchemaName') !== undefined && { orgSchemaName: str('orgSchemaName') }),
                ...(p('orgSchemaDescription') !== undefined && { orgSchemaDescription: str('orgSchemaDescription') }),
                ...(p('orgSchemaEmail') !== undefined && { orgSchemaEmail: str('orgSchemaEmail') }),
                ...(p('orgSchemaStreetAddress') !== undefined && { orgSchemaStreetAddress: str('orgSchemaStreetAddress') }),
                ...(p('orgSchemaAddressLocality') !== undefined && { orgSchemaAddressLocality: str('orgSchemaAddressLocality') }),
                ...(p('orgSchemaAddressRegion') !== undefined && { orgSchemaAddressRegion: str('orgSchemaAddressRegion') }),
                ...(p('orgSchemaPostalCode') !== undefined && { orgSchemaPostalCode: str('orgSchemaPostalCode') }),
                ...(p('orgSchemaAddressCountry') !== undefined && { orgSchemaAddressCountry: str('orgSchemaAddressCountry') }),
                ...(sameAs !== undefined && { orgSchemaSameAs: Array.isArray(sameAs) ? sameAs.join('\n') : (sameAs || '') }),
                ...(p('isHomePage') !== undefined && { isHomePage: !!json.isHomePage }),
                ...(p('hideContent') !== undefined && { hideContent: !!json.hideContent }),
                ...(p('hideEnquireCTA') !== undefined && { hideEnquireCTA: !!json.hideEnquireCTA }),
                ...(p('hideKeyHighlights') !== undefined && { hideKeyHighlights: !!json.hideKeyHighlights }),
                ...(p('hideWalkthrough') !== undefined && { hideWalkthrough: !!json.hideWalkthrough }),
                ...(p('hideAmenities') !== undefined && { hideAmenities: !!json.hideAmenities }),
                ...(p('hideConfigurations') !== undefined && { hideConfigurations: !!json.hideConfigurations }),
                ...(p('hideMasterFloorPlan') !== undefined && { hideMasterFloorPlan: !!json.hideMasterFloorPlan }),
                ...(p('hideGallery') !== undefined && { hideGallery: !!json.hideGallery }),
                ...(p('hideProjectSpecifications') !== undefined && { hideProjectSpecifications: !!json.hideProjectSpecifications }),
                ...(p('hideLocation') !== undefined && { hideLocation: !!json.hideLocation }),
                ...(p('hideFAQs') !== undefined && { hideFAQs: !!json.hideFAQs }),
                ...(p('hideBlogs') !== undefined && { hideBlogs: !!json.hideBlogs }),
                ...(p('hideDetailedOverview') !== undefined && { hideDetailedOverview: !!json.hideDetailedOverview }),
            }));
            setJsonText('');
            Swal.fire({ icon: 'success', title: 'JSON Imported', text: 'Matching fields have been filled.', timer: 1500, showConfirmButton: false });
        } catch {
            Swal.fire('Parse Error', 'Invalid JSON. Please check the format.', 'error');
        }
    };

    const handleJsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.json')) { Swal.fire('Invalid File', 'Please upload a .json file.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => applyJson(ev.target.result);
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleJsonPaste = () => {
        if (!jsonText.trim()) { Swal.fire('Empty', 'Please paste JSON content first.', 'warning'); return; }
        applyJson(jsonText);
    };

    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        projectAddress: '',
        price: '',
        totalUnits: '',
        reraNo: '',
        possession: '',
        createdDate: new Date().toISOString().split('T')[0],
        bhkConfig: '',
        carpetArea: '',
        landParcel: '',
        heroBadge1: '',
        heroBadge2: '',
        heroBadge3: '',
        lat: '',
        lng: '',
        company: '',
        shortOverview: '',
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
        orgSchemaName: '',
        orgSchemaDescription: '',
        orgSchemaEmail: '',
        orgSchemaSameAs: '',
        orgSchemaStreetAddress: '',
        orgSchemaAddressLocality: '',
        orgSchemaAddressRegion: '',
        orgSchemaPostalCode: '',
        orgSchemaAddressCountry: 'IN',
        desktopBanner: '',
        mobileBanner: '',
        publishStatus: 'draft',
        amenities: [],
        amenitiesTitle: '',
        amenitiesContent: '',
        keyHighlightsTitle: '',
        keyHighlights: '',
        highlightItems: [],
        ctaButtonText: '',
        configurations: '',
        configurationsTitle: '',
        configurationsCtaLabel: '',
        configurationRows: [],
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
        detailedOverview: [],
        hideDetailedOverview: false,
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

    const [faqJsonText, setFaqJsonText] = useState('');
    const [showFaqJsonImport, setShowFaqJsonImport] = useState(false);

    const applyFaqJson = (raw) => {
        try {
            const parsed = JSON.parse(raw);
            const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.faqs) ? parsed.faqs : null);
            if (!arr) { Swal.fire('Format Error', 'Expected a JSON array or object with a "faqs" key.', 'error'); return; }
            const normalized = arr.map(item => ({
                question: item.question || item.q || '',
                answer: item.answer || item.a || '',
            }));
            setFormData(prev => ({ ...prev, faqs: normalized }));
            setFaqJsonText('');
            setShowFaqJsonImport(false);
            Swal.fire({ icon: 'success', title: `${normalized.length} FAQ(s) Imported`, timer: 1500, showConfirmButton: false });
        } catch {
            Swal.fire('Parse Error', 'Invalid JSON. Please check the format.', 'error');
        }
    };

    const handleFaqJsonUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.json')) { Swal.fire('Invalid File', 'Please upload a .json file.', 'error'); return; }
        const reader = new FileReader();
        reader.onload = (ev) => applyFaqJson(ev.target.result);
        reader.readAsText(file);
        e.target.value = '';
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

    const addHighlightItem = () => setFormData(prev => ({ ...prev, highlightItems: [...(prev.highlightItems || []), { title: '', description: '' }] }));
    const removeHighlightItem = (i) => setFormData(prev => ({ ...prev, highlightItems: prev.highlightItems.filter((_, idx) => idx !== i) }));
    const updateHighlightItem = (i, field, val) => setFormData(prev => ({ ...prev, highlightItems: prev.highlightItems.map((h, idx) => idx === i ? { ...h, [field]: val } : h) }));

    const addConfigRow = () => setFormData(prev => ({ ...prev, configurationRows: [...(prev.configurationRows || []), { configuration: '', size: '', price: '', buttonLabel: '' }] }));
    const removeConfigRow = (i) => setFormData(prev => ({ ...prev, configurationRows: prev.configurationRows.filter((_, idx) => idx !== i) }));
    const updateConfigRow = (i, field, val) => setFormData(prev => ({ ...prev, configurationRows: prev.configurationRows.map((r, idx) => idx === i ? { ...r, [field]: val } : r) }));

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
                        <button onClick={() => router.push('/admin/projects/list')} className="flex items-center gap-2 text-gray-600 hover:text-gold mb-3 transition">
                            <MdArrowBack size={20} /> Back to Projects
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">Add New Project</h1>
                        <p className="text-gray-500 text-sm mt-1">Fill in details, then Save as Draft or Publish.</p>
                    </div>

                    <form onSubmit={e => e.preventDefault()}>
                        {/* Import from JSON */}
                        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-dashed border-gold mb-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">Import from JSON</h2>
                            <p className="text-sm text-gray-500 mb-4">Upload a JSON file — matching fields will be auto-filled automatically.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Accepted Key Names</p>
                                    <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1.5 max-h-72 overflow-y-auto">
                                        {[
                                            ['title', 'Project title'],
                                            ['slug', 'URL slug'],
                                            ['projectAddress / address', 'Project location'],
                                            ['price', 'Starting price'],
                                            ['totalUnits', 'Total units'],
                                            ['reraNo / rera', 'RERA number'],
                                            ['possession', 'Possession date'],
                                            ['createdDate', 'Launch date'],
                                            ['company / builder / brand', 'Builder name'],
                                            ['lat / latitude', 'Map latitude'],
                                            ['lng / longitude', 'Map longitude'],
                                            ['contentTitle', 'Overview section title'],
                                            ['contentImage', 'Overview section image URL'],
                                            ['content / body / description', 'Main content HTML'],
                                            ['metaTitle / seoTitle', 'SEO title'],
                                            ['metaDescription', 'SEO description'],
                                            ['keywords / tags', 'String or array'],
                                            ['desktopBanner', 'Desktop banner URL'],
                                            ['mobileBanner', 'Mobile banner URL'],
                                            ['publishStatus', 'draft or published'],
                                            ['keyHighlightsTitle', 'Key highlights title'],
                                            ['keyHighlights', 'Key highlights HTML'],
                                            ['ctaButtonText', 'CTA button label'],
                                            ['amenitiesTitle', 'Amenities section title'],
                                            ['amenitiesContent', 'Amenities HTML'],
                                            ['amenities', 'Array of amenity objects'],
                                            ['configurations', 'Configurations HTML'],
                                            ['configurationsTitle', 'Configurations title'],
                                            ['configurationsCtaLabel', 'Configurations CTA label'],
                                            ['walkthroughTitle', 'Walkthrough section title'],
                                            ['walkthroughUrl', 'YouTube video URL'],
                                            ['walkthroughDuration', 'Video duration'],
                                            ['faqs', 'Array of {question, answer}'],
                                            ['gallery', '{title, content, images[]}'],
                                            ['masterFloorPlan', '{title, masterPlans[], floorPlans[]}'],
                                            ['projectSpecifications', '{title, specs[], ctaLabel}'],
                                            ['location', '{title, content}'],
                                            ['detailedOverview', 'Array of {title, content, image}'],
                                            ['schemaName', 'Product schema name'],
                                            ['schemaDescription', 'Product schema description'],
                                            ['schemaBrand', 'Brand / builder name'],
                                            ['schemaPrice', 'Schema price'],
                                            ['schemaRatingValue', 'Rating value (1–5)'],
                                            ['schemaRatingCount', 'Number of reviews'],
                                            ['orgSchemaName', 'Org name'],
                                            ['orgSchemaEmail', 'Org email'],
                                            ['orgSchemaStreetAddress', 'Street address'],
                                            ['orgSchemaAddressLocality', 'City'],
                                            ['orgSchemaAddressRegion', 'State'],
                                            ['orgSchemaPostalCode', 'Postal code'],
                                            ['orgSchemaAddressCountry', 'Country code (IN)'],
                                            ['orgSchemaSameAs / sameAs', 'Array of social URLs'],
                                            ['isHomePage', 'true/false'],
                                            ['hideContent', 'true to hide section'],
                                            ['hideKeyHighlights', 'true to hide section'],
                                            ['hideAmenities', 'true to hide section'],
                                            ['hideGallery', 'true to hide section'],
                                            ['hideFAQs', 'true to hide section'],
                                        ].map(([key, desc]) => (
                                            <div key={key} className="flex gap-2">
                                                <span className="font-semibold text-gray-700 w-56 shrink-0">{key}:</span>
                                                <span className="text-gray-500">{desc}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Example JSON Format</p>
                                    <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-auto max-h-72">{`{
  "title": "Skyline Residences",
  "slug": "skyline-residences",
  "projectAddress": "Baner, Pune, Maharashtra",
  "price": "₹85 Lakhs onwards",
  "totalUnits": "240",
  "reraNo": "P52100XXXXX",
  "possession": "Dec 2026",
  "createdDate": "2024-01-15",
  "company": "Skyline Builders",
  "lat": "18.5204",
  "lng": "73.8567",
  "contentTitle": "About Skyline Residences",
  "contentImage": "https://cdn.example.com/overview.jpg",
  "content": "<p>Premium 2 & 3 BHK apartments...</p>",
  "metaTitle": "Skyline Residences - Flats in Pune",
  "metaDescription": "Luxury 2 & 3 BHK in Baner Pune.",
  "keywords": ["flats in pune", "baner apartments"],
  "desktopBanner": "https://cdn.example.com/banner.jpg",
  "mobileBanner": "https://cdn.example.com/mobile.jpg",
  "publishStatus": "draft",
  "keyHighlightsTitle": "Key Highlights",
  "keyHighlights": "<ul><li>2 & 3 BHK</li></ul>",
  "ctaButtonText": "Download Brochure",
  "amenitiesTitle": "Amenities",
  "amenitiesContent": "<p>World-class amenities</p>",
  "amenities": [
    { "title": "Swimming Pool", "image": "" },
    { "title": "Gymnasium", "image": "" }
  ],
  "configurationsTitle": "Configurations",
  "configurations": "<p>2BHK: 950 sqft</p>",
  "configurationsCtaLabel": "Book a Visit",
  "walkthroughTitle": "Project Walkthrough",
  "walkthroughUrl": "https://youtube.com/watch?v=XXXXX",
  "walkthroughDuration": "3:45",
  "faqs": [
    { "question": "What is the price?", "answer": "Starting ₹85L" },
    { "question": "What is RERA no?", "answer": "P52100XXXXX" }
  ],
  "gallery": {
    "title": "Gallery",
    "content": "",
    "images": [
      { "url": "https://cdn.example.com/g1.jpg", "alt": "Exterior view" }
    ]
  },
  "masterFloorPlan": {
    "title": "Master & Floor Plans",
    "masterPlans": [
      { "image": "https://cdn.example.com/master.jpg", "label": "Master Plan" }
    ],
    "floorPlans": [
      { "image": "https://cdn.example.com/floor.jpg", "label": "2BHK Floor Plan" }
    ]
  },
  "projectSpecifications": {
    "title": "Specifications",
    "ctaLabel": "Download Brochure",
    "specs": [
      { "title": "Flooring", "content": "Vitrified tiles" }
    ]
  },
  "location": {
    "title": "Location Advantages",
    "content": "<p>Near highway...</p>"
  },
  "detailedOverview": [
    {
      "title": "Why Invest?",
      "content": "<p>High ROI location</p>",
      "image": "https://cdn.example.com/invest.jpg"
    }
  ],
  "schemaName": "Skyline Residences",
  "schemaDescription": "Premium 2 & 3 BHK in Pune",
  "schemaBrand": "Skyline Builders",
  "schemaPrice": "8500000",
  "schemaPriceCurrency": "INR",
  "schemaAvailability": "InStock",
  "schemaLocation": "Baner, Pune",
  "schemaPossession": "Dec 2026",
  "schemaRatingValue": "4.5",
  "schemaRatingCount": "128",
  "orgSchemaName": "Saturn RealCon",
  "orgSchemaEmail": "info@saturnrealcon.com",
  "orgSchemaStreetAddress": "12 MG Road",
  "orgSchemaAddressLocality": "Pune",
  "orgSchemaAddressRegion": "Maharashtra",
  "orgSchemaPostalCode": "411001",
  "orgSchemaAddressCountry": "IN",
  "sameAs": [
    "https://facebook.com/yourpage",
    "https://instagram.com/yourpage"
  ],
  "isHomePage": false,
  "hideContent": false,
  "hideKeyHighlights": false,
  "hideAmenities": false,
  "hideGallery": false,
  "hideFAQs": false
}`}</pre>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <label className="inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 bg-gold text-white font-semibold rounded-lg hover:bg-gold transition-all text-sm">
                                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                    Choose JSON File
                                    <input type="file" accept=".json" onChange={handleJsonUpload} className="hidden" />
                                </label>
                                <span className="text-sm text-gray-400">or paste JSON below</span>
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Paste JSON</p>
                                <textarea
                                    value={jsonText}
                                    onChange={e => setJsonText(e.target.value)}
                                    rows={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream font-mono text-xs text-gray-800 placeholder-gray-400 resize-y"
                                    placeholder={'{\n  "title": "My Project",\n  "metaTitle": "SEO Title",\n  "price": "₹50L onwards"\n}'}
                                />
                                <div className="flex items-center gap-3 mt-2">
                                    <button type="button" onClick={handleJsonPaste}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold text-white font-semibold rounded-lg hover:bg-gold transition-all text-sm">
                                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                        Apply JSON
                                    </button>
                                    {jsonText && (
                                        <button type="button" onClick={() => setJsonText('')} className="text-sm text-gray-400 hover:text-gray-600 transition">Clear</button>
                                    )}
                                    <span className="text-xs text-gray-400 ml-auto">or fill the form manually below</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-6 items-start">

                            {/* ── Left Column ── */}
                            <div className="flex-1 space-y-6 min-w-0">

                                {/* Basic Info */}
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Project Details</h3>
                                    <div className="space-y-4">

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Project Title <span className="text-gold">*</span></label>
                                            <input type="text" name="title" value={formData.title} onChange={handleTitleChange} required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="e.g., Skyline Residences" />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Slug <span className="text-gold">*</span></label>
                                            <input type="text" name="slug" value={formData.slug} onChange={handleChange} required
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 font-mono"
                                                placeholder="skyline-residences" />
                                            <p className="text-xs text-gray-400 mt-1">URL: /projects/<strong>{formData.slug || 'your-slug'}</strong></p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Project Address</label>
                                            <input type="text" name="projectAddress" value={formData.projectAddress} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="123 Main Street, City, State" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                                                <input type="text" name="price" value={formData.price} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="₹ 50 Lakhs onwards" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Total Units</label>
                                                <input type="text" name="totalUnits" value={formData.totalUnits} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="240" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">RERA No.</label>
                                                <input type="text" name="reraNo" value={formData.reraNo} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="RERA123456" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Developer / Company</label>
                                                <input type="text" name="company" value={formData.company} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="Saturn Realty Pvt. Ltd." />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Possession Date</label>
                                                <input type="date" name="possession" value={formData.possession} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Launch / Created Date</label>
                                                <input type="date" name="createdDate" value={formData.createdDate} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
                                            </div>
                                        </div>

                                        {/* Hero Stat fields — shown in the banner stats strip on the public page */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Configurations</label>
                                                <input type="text" name="bhkConfig" value={formData.bhkConfig} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="3 & 4 BHK" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Plot Size</label>
                                                <input type="text" name="carpetArea" value={formData.carpetArea} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="2,850 – 5,600 sq.ft" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Land Parcel / Density</label>
                                                <input type="text" name="landParcel" value={formData.landParcel} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="Only 1 Tower on 7.5 Acres" />
                                            </div>
                                        </div>

                                        {/* Hero badges — three small chips overlaid on the hero image */}
                                        <div>
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Hero Badges</p>
                                            <p className="text-xs text-gray-400 mb-3">Three small chips shown above the project title on the hero banner. Leave any field empty to hide that chip.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <input type="text" name="heroBadge1" value={formData.heroBadge1} onChange={handleChange}
                                                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="★ New Launch 2026" />
                                                <input type="text" name="heroBadge2" value={formData.heroBadge2} onChange={handleChange}
                                                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="Total Environment" />
                                                <input type="text" name="heroBadge3" value={formData.heroBadge3} onChange={handleChange}
                                                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="▼ Pre-Launch Pricing Live" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Latitude</label>
                                                <input type="text" name="lat" value={formData.lat} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="28.6139" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Longitude</label>
                                                <input type="text" name="lng" value={formData.lng} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="77.2090" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Short Overview</label>
                                            <textarea name="shortOverview" value={formData.shortOverview} onChange={handleChange} rows={4}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 resize-y"
                                                placeholder="2–4 sentence summary shown on the homepage About section." />
                                            <p className="text-xs text-gray-400 mt-1">Shown under the “About {'{Project Name}'}” heading. For the long rich-text body use the Overview Content section below.</p>
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
                                            icon={<MdDesktopWindows className="text-gold" size={18} />}
                                            filterType="hero"
                                            value={formData.desktopBanner}
                                            onChange={(url) => setFormData(prev => ({ ...prev, desktopBanner: url }))}
                                        />
                                        <BannerPicker
                                            label="Mobile Banner"
                                            hint="9:16 portrait"
                                            icon={<MdPhoneAndroid className="text-gold" size={18} />}
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="e.g. About This Project" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Featured Image</label>
                                            <BannerPicker
                                                label="Featured Image"
                                                hint="landscape recommended"
                                                icon={<MdImage className="text-gold" size={18} />}
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="SEO title (55–60 characters)" />
                                            <p className="text-xs text-gray-400 mt-1">{formData.metaTitle.length}/60</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
                                            <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={3} maxLength="160"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="SEO description (150–160 characters)" />
                                            <p className="text-xs text-gray-400 mt-1">{formData.metaDescription.length}/160</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
                                            <input type="text" name="keywords" value={formData.keywords} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="Auto from project title" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                                            <textarea name="schemaDescription" value={formData.schemaDescription} onChange={handleChange} rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="Auto from meta description" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Brand / Builder Name</label>
                                            <input type="text" name="schemaBrand" value={formData.schemaBrand} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="Auto from company / builder" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Price</label>
                                                <input type="text" name="schemaPrice" value={formData.schemaPrice} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="Auto from price" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Currency</label>
                                                <select name="schemaPriceCurrency" value={formData.schemaPriceCurrency} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 bg-white">
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="e.g. InStock, PreOrder, SoldOut" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Location / Address</label>
                                            <input type="text" name="schemaLocation" value={formData.schemaLocation} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="Auto from project address" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Possession</label>
                                            <input type="text" name="schemaPossession" value={formData.schemaPossession} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="Auto from possession (e.g. Dec 2026)" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Aggregate Rating Value</label>
                                                <input type="number" step="0.1" min="1" max="5" name="schemaRatingValue" value={formData.schemaRatingValue} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                    placeholder="e.g. 4.5" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Review Count</label>
                                                <input type="number" min="1" name="schemaRatingCount" value={formData.schemaRatingCount} onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
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
                                            placeholder="Why Tangled Up in Green Stands Apart"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>

                                    {/* Highlight Cards (structured items) */}
                                    <div className="mb-5 pt-5 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Highlight Cards</p>
                                                <p className="text-xs text-gray-400">Each card shows a title and short description.</p>
                                            </div>
                                            <button type="button" onClick={addHighlightItem}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold transition">
                                                + Add More
                                            </button>
                                        </div>
                                        {formData.highlightItems && formData.highlightItems.length > 0 ? (
                                            <div className="space-y-3">
                                                {formData.highlightItems.map((h, i) => (
                                                    <div key={i} className="relative border border-gray-200 rounded-xl p-4 bg-gray-50">
                                                        <button type="button" onClick={() => removeHighlightItem(i)}
                                                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition">✕</button>
                                                        <div className="space-y-2 pr-8">
                                                            <input type="text" value={h.title || ''} onChange={e => updateHighlightItem(i, 'title', e.target.value)}
                                                                placeholder="Card title (e.g. Hand-Crafted Architecture)"
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm text-gray-800 bg-white" />
                                                            <textarea value={h.description || ''} onChange={e => updateHighlightItem(i, 'description', e.target.value)} rows={2}
                                                                placeholder="Short description for this card."
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm text-gray-800 bg-white resize-y" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">No cards yet. Click “+ Add More” to start.</p>
                                        )}
                                    </div>

                                    <div className="pt-5 border-t border-gray-200">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Rich Text (optional, legacy)</p>
                                        <p className="text-xs text-gray-400 mb-2">Used as a fallback when no Highlight Cards are set.</p>
                                        <TipTapEditor
                                            content={formData.keyHighlights}
                                            onChange={(html) => setFormData(prev => ({ ...prev, keyHighlights: html }))}
                                        />
                                    </div>
                                    <div className="mt-5 pt-5 border-t border-gray-200">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">CTA Button Text</label>
                                        <input type="text" name="ctaButtonText" value={formData.ctaButtonText} onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
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
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="Walkthrough Video" />
                                            <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube Video URL</label>
                                            <input type="text" name="walkthroughUrl" value={formData.walkthroughUrl} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                                placeholder="https://www.youtube.com/watch?v=..." />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Video Duration</label>
                                            <input type="text" name="walkthroughDuration" value={formData.walkthroughDuration} onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
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
                                                className="px-3 py-1.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold transition">
                                                + Add Amenity
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Title</label>
                                        <input type="text" name="amenitiesTitle" value={formData.amenitiesTitle} onChange={handleChange}
                                            placeholder="Amenities"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to use default title</p>
                                    </div>

                                    {/* Configuration Rows (structured table) */}
                                    <div className="mb-5 pt-5 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Configuration Rows</p>
                                                <p className="text-xs text-gray-400">Each row is one line in the pricing table (Configuration · Size · Price · Button).</p>
                                            </div>
                                            <button type="button" onClick={addConfigRow}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold transition">
                                                + Add More
                                            </button>
                                        </div>
                                        {formData.configurationRows && formData.configurationRows.length > 0 ? (
                                            <div className="space-y-3">
                                                {formData.configurationRows.map((row, i) => (
                                                    <div key={i} className="relative border border-gray-200 rounded-xl p-4 bg-gray-50">
                                                        <button type="button" onClick={() => removeConfigRow(i)}
                                                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 transition">✕</button>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-8">
                                                            <input type="text" value={row.configuration || ''} onChange={e => updateConfigRow(i, 'configuration', e.target.value)}
                                                                placeholder="Configuration (e.g. 3 BHK Garden Residence)"
                                                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm text-gray-800 bg-white" />
                                                            <input type="text" value={row.size || ''} onChange={e => updateConfigRow(i, 'size', e.target.value)}
                                                                placeholder="Size (e.g. 2,850 sq.ft)"
                                                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm text-gray-800 bg-white" />
                                                            <input type="text" value={row.price || ''} onChange={e => updateConfigRow(i, 'price', e.target.value)}
                                                                placeholder="Price (e.g. ₹ 4.95 Cr* onwards)"
                                                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm text-gray-800 bg-white" />
                                                            <input type="text" value={row.buttonLabel || ''} onChange={e => updateConfigRow(i, 'buttonLabel', e.target.value)}
                                                                placeholder="Button Name (e.g. Enquire)"
                                                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold text-sm text-gray-800 bg-white" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">No rows yet. Click “+ Add More” to start.</p>
                                        )}
                                    </div>

                                    <div className="pt-5 border-t border-gray-200">
                                        <p className="text-sm font-semibold text-gray-700 mb-1">Rich Text (optional, legacy)</p>
                                        <p className="text-xs text-gray-400 mb-2">Used as a fallback when no Configuration Rows are set.</p>
                                        <TipTapEditor
                                            content={formData.configurations}
                                            onChange={(html) => setFormData(prev => ({ ...prev, configurations: html }))}
                                        />
                                    </div>
                                    <div className="mt-5 pt-5 border-t border-gray-200">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Section Button Label (below the table)</label>
                                        <input type="text" name="configurationsCtaLabel" value={formData.configurationsCtaLabel} onChange={handleChange}
                                            placeholder="e.g. View Floor Plans, Book a Visit"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
                                        <p className="text-xs text-gray-400 mt-1">Leave empty to hide the section-level button.</p>
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
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
                                                className="px-3 py-1.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold transition">
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
                                                className="px-3 py-1.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold transition">
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
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
                                            className="px-3 py-1.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold transition">
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
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
                                                className="px-3 py-1.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold transition">
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
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm mb-3" />
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gold text-gray-900 text-sm" />
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
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900" />
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
                                            <button type="button" onClick={() => setShowFaqJsonImport(v => !v)}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition border border-gray-300">
                                                {showFaqJsonImport ? 'Hide JSON' : 'Import JSON'}
                                            </button>
                                            <button type="button" onClick={addFAQ}
                                                className="px-3 py-1.5 bg-gold text-white rounded-lg text-sm font-semibold hover:bg-gold transition">
                                                + Add FAQ
                                            </button>
                                        </div>
                                    </div>

                                    {showFaqJsonImport && (
                                        <div className="mb-5 p-4 bg-gray-50 border border-dashed border-gold rounded-lg">
                                            <p className="text-sm font-semibold text-gray-700 mb-1">Import FAQs from JSON</p>
                                            <p className="text-xs text-gray-400 mb-3">Paste a JSON array or an object with a <code className="bg-white px-1 rounded border">faqs</code> key. Accepts <code className="bg-white px-1 rounded border">question/q</code> and <code className="bg-white px-1 rounded border">answer/a</code> keys. This will <strong>replace</strong> existing FAQs.</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-600 mb-1">Paste JSON</p>
                                                    <textarea
                                                        value={faqJsonText}
                                                        onChange={e => setFaqJsonText(e.target.value)}
                                                        rows={5}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs text-gray-800 focus:outline-none focus:border-gold resize-y"
                                                        placeholder={'[\n  { "question": "What is the price?", "answer": "₹85L onwards" }\n]'}
                                                    />
                                                    <div className="flex gap-2 mt-2">
                                                        <label className="inline-flex items-center gap-1.5 cursor-pointer px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold transition">
                                                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                            Upload .json
                                                            <input type="file" accept=".json" onChange={handleFaqJsonUpload} className="hidden" />
                                                        </label>
                                                        <button type="button" onClick={() => applyFaqJson(faqJsonText)}
                                                            className="px-3 py-1.5 bg-gold text-white text-xs font-semibold rounded-lg hover:bg-gold transition">
                                                            Apply
                                                        </button>
                                                        {faqJsonText && <button type="button" onClick={() => setFaqJsonText('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-600 mb-1">Example Format</p>
                                                    <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-auto max-h-40">{`[
  {
    "question": "What is the price?",
    "answer": "Starting ₹85 Lakhs"
  },
  {
    "question": "What is the RERA number?",
    "answer": "P52100XXXXX"
  },
  {
    "question": "When is possession?",
    "answer": "December 2026"
  }
]`}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.faqs.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic py-4">No FAQs added yet. Click "Add FAQ" or use "Import JSON" above.</p>
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
                                <div className={`rounded-xl shadow-lg p-6 flex items-center justify-between border-2 ${formData.isHomePage ? 'bg-cream border-gold' : 'bg-white border-transparent'}`}>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">Set as Home Page</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">This project will appear on the home page URL (/). Only one project should be set as home.</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                                        <span className="text-xs text-gray-500">{formData.isHomePage ? 'Home Page' : 'Not Home'}</span>
                                        <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${formData.isHomePage ? 'bg-gold' : 'bg-gray-300'}`}>
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
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gold text-gold rounded-lg hover:bg-cream transition font-semibold disabled:opacity-50">
                                        <MdSave size={18} />
                                        {loading ? 'Saving…' : 'Save as Draft'}
                                    </button>
                                    <button type="button" onClick={(e) => handleSubmit(e, 'published')} disabled={loading}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gold text-white rounded-lg hover:bg-gold transition font-semibold disabled:opacity-50">
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
