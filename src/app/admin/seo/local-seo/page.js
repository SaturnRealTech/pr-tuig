'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const SCHEMA_TYPES = [
    'Organization',
    'LocalBusiness',
    'RealEstateAgent',
    'Corporation',
    'NewsMediaOrganization',
];

const DAYS = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
];

const EMPTY = {
    schemaType: 'RealEstateAgent',
    name: '', alternateName: '', legalName: '', description: '',
    url: '', email: '', telephone: '', priceRange: '', foundingDate: '',
    logo: '', image: '',
    address: { streetAddress: '', addressLocality: '', addressRegion: '', postalCode: '', addressCountry: 'IN' },
    geo: { latitude: '', longitude: '' },
    sameAs: '',
    openingHours: [],
};

export default function LocalSeoPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState(EMPTY);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        fetch('/api/local-seo')
            .then(r => r.json())
            .then(j => { if (!cancelled && j.success) setData({ ...EMPTY, ...j.data, address: { ...EMPTY.address, ...(j.data.address || {}) }, geo: { ...EMPTY.geo, ...(j.data.geo || {}) } }); })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    const setField = (k) => (e) => setData(d => ({ ...d, [k]: e.target.value }));
    const setAddr = (k) => (e) => setData(d => ({ ...d, address: { ...d.address, [k]: e.target.value } }));
    const setGeo = (k) => (e) => setData(d => ({ ...d, geo: { ...d.geo, [k]: e.target.value } }));

    const dayRow = (dayId) => data.openingHours.find(h => h.day === dayId) || { day: dayId, closed: true, open: '', close: '' };
    const updateDay = (dayId, patch) => setData(d => {
        const others = (d.openingHours || []).filter(h => h.day !== dayId);
        const row = dayRow(dayId);
        return { ...d, openingHours: [...others, { ...row, ...patch }] };
    });

    const save = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/local-seo', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const j = await res.json();
            if (j.success) Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
            else Swal.fire('Error', j.error || 'Save failed', 'error');
        } catch (e) {
            Swal.fire('Error', e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-5xl">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Local SEO</h1>
                            <p className="text-sm text-gray-500 mt-1">Tell Google who you are and where to find you. Emitted as schema.org JSON-LD on every page.</p>
                        </div>
                        <button type="button" onClick={save} disabled={saving}
                            className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition">
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>

                    {loading ? (
                        <p className="text-gray-500 text-sm">Loading…</p>
                    ) : (
                        <div className="space-y-6">
                            <Card title="Business identity" subtitle="Core information about your organisation.">
                                <Row>
                                    <Field label="Schema type" hint="The schema.org type that best describes you.">
                                        <select value={data.schemaType} onChange={setField('schemaType')} className={selectCls}>
                                            {SCHEMA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Business name *" hint="Required. Without this no schema is emitted.">
                                        <input type="text" value={data.name} onChange={setField('name')} className={inputCls} placeholder="Saturn Real Con" />
                                    </Field>
                                </Row>
                                <Row>
                                    <Field label="Alternate name" hint="Common nickname / abbreviation.">
                                        <input type="text" value={data.alternateName} onChange={setField('alternateName')} className={inputCls} />
                                    </Field>
                                    <Field label="Legal name" hint="Registered legal entity name.">
                                        <input type="text" value={data.legalName} onChange={setField('legalName')} className={inputCls} />
                                    </Field>
                                </Row>
                                <Field label="Description" hint="Short tagline about the business.">
                                    <textarea value={data.description} onChange={setField('description')} rows={2} className={inputCls} />
                                </Field>
                            </Card>

                            <Card title="Contact" subtitle="Used for the schema and visible on rich results.">
                                <Row>
                                    <Field label="Website URL"><input type="text" value={data.url} onChange={setField('url')} className={inputCls} placeholder="https://example.com" /></Field>
                                    <Field label="Email"><input type="text" value={data.email} onChange={setField('email')} className={inputCls} placeholder="hello@example.com" /></Field>
                                </Row>
                                <Row>
                                    <Field label="Phone"><input type="text" value={data.telephone} onChange={setField('telephone')} className={inputCls} placeholder="+91 12345 67890" /></Field>
                                    <Field label="Price range" hint="$ to $$$$ or any short hint."><input type="text" value={data.priceRange} onChange={setField('priceRange')} className={inputCls} placeholder="₹₹₹" /></Field>
                                </Row>
                                <Row>
                                    <Field label="Founded (YYYY-MM-DD)"><input type="text" value={data.foundingDate} onChange={setField('foundingDate')} className={inputCls} placeholder="2014-04-01" /></Field>
                                    <Field label="Logo URL"><input type="text" value={data.logo} onChange={setField('logo')} className={inputCls} /></Field>
                                </Row>
                                <Field label="Default social image URL"><input type="text" value={data.image} onChange={setField('image')} className={inputCls} /></Field>
                            </Card>

                            <Card title="Address" subtitle="Postal address shown in the knowledge panel.">
                                <Field label="Street address"><input type="text" value={data.address.streetAddress} onChange={setAddr('streetAddress')} className={inputCls} /></Field>
                                <Row>
                                    <Field label="City"><input type="text" value={data.address.addressLocality} onChange={setAddr('addressLocality')} className={inputCls} /></Field>
                                    <Field label="State / Region"><input type="text" value={data.address.addressRegion} onChange={setAddr('addressRegion')} className={inputCls} /></Field>
                                </Row>
                                <Row>
                                    <Field label="Postal code"><input type="text" value={data.address.postalCode} onChange={setAddr('postalCode')} className={inputCls} /></Field>
                                    <Field label="Country (ISO-2)"><input type="text" value={data.address.addressCountry} onChange={setAddr('addressCountry')} className={inputCls} placeholder="IN" /></Field>
                                </Row>
                            </Card>

                            <Card title="Geo coordinates" subtitle="Optional. Sharpens the map result.">
                                <Row>
                                    <Field label="Latitude"><input type="text" value={data.geo.latitude} onChange={setGeo('latitude')} className={inputCls} placeholder="28.6139" /></Field>
                                    <Field label="Longitude"><input type="text" value={data.geo.longitude} onChange={setGeo('longitude')} className={inputCls} placeholder="77.2090" /></Field>
                                </Row>
                            </Card>

                            <Card title="Social profiles" subtitle="One URL per line. Emitted as sameAs in the schema.">
                                <textarea value={data.sameAs} onChange={setField('sameAs')} rows={5} className={inputCls + ' font-mono text-xs'}
                                    placeholder="https://facebook.com/yourpage&#10;https://instagram.com/yourpage&#10;https://linkedin.com/company/yourpage" />
                            </Card>

                            <Card title="Opening hours" subtitle="Toggle days closed or enter open / close times in 24h.">
                                <div className="divide-y divide-gray-100">
                                    {DAYS.map(d => {
                                        const row = dayRow(d.id);
                                        return (
                                            <div key={d.id} className="py-3 grid grid-cols-12 items-center gap-3">
                                                <div className="col-span-3 text-sm font-medium text-gray-700">{d.label}</div>
                                                <label className="col-span-2 flex items-center gap-2 text-xs text-gray-600">
                                                    <input type="checkbox" checked={!!row.closed} onChange={e => updateDay(d.id, { closed: e.target.checked })} className="accent-gold" />
                                                    Closed
                                                </label>
                                                <input type="time" disabled={!!row.closed} value={row.open || ''} onChange={e => updateDay(d.id, { open: e.target.value })}
                                                    className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 disabled:bg-gray-100 focus:outline-none focus:border-gold" />
                                                <input type="time" disabled={!!row.closed} value={row.close || ''} onChange={e => updateDay(d.id, { close: e.target.value })}
                                                    className="col-span-4 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 disabled:bg-gray-100 focus:outline-none focus:border-gold" />
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-gold';
const selectCls = inputCls;

function Card({ title, subtitle, children }) {
    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <div className="mb-4">
                <h3 className="text-base font-bold text-gray-800">{title}</h3>
                {subtitle ? <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p> : null}
            </div>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function Row({ children }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, hint, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
            {children}
            {hint ? <p className="text-[11px] text-gray-400 mt-1">{hint}</p> : null}
        </div>
    );
}
