'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';
import { MdAdd, MdDelete, MdEdit, MdCheck, MdClose } from 'react-icons/md';

const SCHEMA_TYPES = [
    { value: 'FAQPage', label: 'FAQ', hint: 'Question + answer accordion' },
    { value: 'HowTo', label: 'How-To', hint: 'Step-by-step guide' },
    { value: 'Recipe', label: 'Recipe', hint: 'Ingredients + instructions' },
    { value: 'Event', label: 'Event', hint: 'Event with date + location' },
    { value: 'Article', label: 'Article', hint: 'Generic article schema' },
    { value: 'LocalBusiness', label: 'Local Business', hint: 'Business profile' },
    { value: 'Product', label: 'Product', hint: 'Price + rating' },
    { value: 'Review', label: 'Review', hint: 'Standalone review' },
];

const EMPTY_BY_TYPE = {
    FAQPage: { questions: [{ question: '', answer: '' }] },
    HowTo: { name: '', description: '', totalTime: '', steps: [{ name: '', text: '', image: '' }] },
    Recipe: { name: '', description: '', recipeYield: '', totalTime: '', recipeIngredient: [''], recipeInstructions: [{ name: '', text: '' }], nutrition: { calories: '' } },
    Event: {
        name: '', description: '', startDate: '', endDate: '',
        eventStatus: 'EventScheduled', eventAttendanceMode: 'OfflineEventAttendanceMode',
        location: { name: '', streetAddress: '', addressLocality: '', addressRegion: '', postalCode: '', addressCountry: 'IN' },
        organizer: { name: '', url: '' },
        offers: { price: '', priceCurrency: 'INR', url: '', availability: 'InStock' },
    },
    Article: { headline: '', description: '', author: '', datePublished: '', image: '' },
    LocalBusiness: { name: '', description: '', telephone: '', priceRange: '', address: { streetAddress: '', addressLocality: '', addressRegion: '', postalCode: '', addressCountry: 'IN' }, geo: { latitude: '', longitude: '' } },
    Product: { name: '', description: '', sku: '', brand: '', offers: { price: '', priceCurrency: 'INR', availability: 'InStock' }, aggregateRating: { ratingValue: '', reviewCount: '' } },
    Review: { itemReviewed: { name: '', type: 'Thing' }, author: '', reviewBody: '', reviewRating: { ratingValue: '', bestRating: '5', worstRating: '1' } },
};

const EMPTY_ATTACH = { posts: [], projects: [], allBlogPosts: false, allProjects: false };
const NEW_TEMPLATE = { _id: null, name: '', schemaType: 'FAQPage', fields: EMPTY_BY_TYPE.FAQPage, attachTo: EMPTY_ATTACH };

export default function SchemaTemplatesPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);
    const [editing, setEditing] = useState(null); // template object or null for list view
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        reload();
    }, [user]);

    async function reload() {
        setLoading(true);
        try {
            const j = await (await fetch('/api/schema-templates')).json();
            if (j.success) setTemplates(j.data);
        } finally { setLoading(false); }
    }

    async function saveTemplate() {
        if (!editing.name?.trim()) { Swal.fire('Error', 'Name is required', 'error'); return; }
        setSaving(true);
        try {
            const { apiFetch } = await import('@/lib/apiClient');
            const isUpdate = !!editing._id;
            const url = isUpdate ? `/api/schema-templates/${editing._id}` : '/api/schema-templates';
            const { data: j } = await apiFetch(url, {
                method: isUpdate ? 'PUT' : 'POST',
                body: { name: editing.name, schemaType: editing.schemaType, fields: editing.fields, attachTo: editing.attachTo },
            });
            if (j.success) {
                await Swal.fire({ icon: 'success', title: 'Saved', timer: 1200, showConfirmButton: false });
                setEditing(null);
                reload();
            } else {
                Swal.fire('Error', j.error || 'Save failed', 'error');
            }
        } catch (e) { Swal.fire('Error', e.message, 'error'); }
        finally { setSaving(false); }
    }

    async function deleteOne(id) {
        const c = await Swal.fire({ title: 'Delete this template?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete' });
        if (!c.isConfirmed) return;
        const { apiFetch } = await import('@/lib/apiClient');
        await apiFetch(`/api/schema-templates/${id}`, { method: 'DELETE' });
        reload();
    }

    function startNew() {
        setEditing(JSON.parse(JSON.stringify(NEW_TEMPLATE)));
    }
    function openEdit(t) {
        setEditing(JSON.parse(JSON.stringify({
            ...t,
            fields: { ...EMPTY_BY_TYPE[t.schemaType], ...(t.fields || {}) },
            attachTo: { ...EMPTY_ATTACH, ...(t.attachTo || {}) },
        })));
    }

    function changeType(t) {
        setEditing(e => ({ ...e, schemaType: t, fields: JSON.parse(JSON.stringify(EMPTY_BY_TYPE[t])) }));
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-5xl">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Schema Templates</h1>
                            <p className="text-sm text-gray-500 mt-1">Reusable structured data — FAQ, How-To, Recipe, Event and more — attached to posts or projects.</p>
                        </div>
                        {!editing ? (
                            <button type="button" onClick={startNew} className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 inline-flex items-center gap-2">
                                <MdAdd size={18} /> New Template
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
                                    <MdClose size={16} /> Cancel
                                </button>
                                <button type="button" onClick={saveTemplate} disabled={saving} className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
                                    <MdCheck size={16} /> {saving ? 'Saving…' : 'Save Template'}
                                </button>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : editing ? (
                        <Editor t={editing} setT={setEditing} onChangeType={changeType} />
                    ) : (
                        <ListView templates={templates} onEdit={openEdit} onDelete={deleteOne} />
                    )}
                </div>
            </main>
        </div>
    );
}

// ============================================================================
// LIST VIEW
// ============================================================================

function ListView({ templates, onEdit, onDelete }) {
    if (templates.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
                <p className="text-sm">No templates yet. Click <strong>New Template</strong> to create one.</p>
            </div>
        );
    }
    return (
        <div className="bg-white rounded-xl shadow-md divide-y divide-gray-100">
            {templates.map(t => {
                const counts = attachmentSummary(t.attachTo);
                return (
                    <div key={t._id} className="p-5 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-gray-800 truncate">{t.name}</p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gold/10 text-gold">{t.schemaType}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{counts}</p>
                        </div>
                        <button type="button" onClick={() => onEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                            <MdEdit size={18} />
                        </button>
                        <button type="button" onClick={() => onDelete(String(t._id))} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                            <MdDelete size={18} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function attachmentSummary(a) {
    if (!a) return 'Not attached to anything';
    const parts = [];
    if (a.allBlogPosts) parts.push('all blog posts');
    if (a.allProjects) parts.push('all projects');
    if (a.posts?.length) parts.push(`${a.posts.length} post${a.posts.length === 1 ? '' : 's'}`);
    if (a.projects?.length) parts.push(`${a.projects.length} project${a.projects.length === 1 ? '' : 's'}`);
    return parts.length ? `Attached to ${parts.join(', ')}` : 'Not attached';
}

// ============================================================================
// EDITOR
// ============================================================================

function Editor({ t, setT, onChangeType }) {
    const update = (patch) => setT(e => ({ ...e, ...patch }));
    const updateField = (k, v) => setT(e => ({ ...e, fields: { ...e.fields, [k]: v } }));
    const updateNested = (k, sub, v) => setT(e => ({
        ...e, fields: { ...e.fields, [k]: { ...(e.fields[k] || {}), [sub]: v } },
    }));
    const updateAttach = (k, v) => setT(e => ({ ...e, attachTo: { ...e.attachTo, [k]: v } }));

    return (
        <div className="space-y-6">
            <Card>
                <Row label="Template name">
                    <input type="text" value={t.name} onChange={e => update({ name: e.target.value })} className={inputCls} placeholder="e.g. Default FAQ for blog posts" />
                </Row>
                <Row label="Schema type" hint="schema.org type emitted for every attached record.">
                    <select value={t.schemaType} onChange={e => onChangeType(e.target.value)} className={inputCls}>
                        {SCHEMA_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                    <p className="text-[11px] text-gray-400 mt-1">{SCHEMA_TYPES.find(s => s.value === t.schemaType)?.hint}</p>
                </Row>
            </Card>

            <Card title="Fields" subtitle={`schema.org ${t.schemaType} body`}>
                {t.schemaType === 'FAQPage' ? <FAQFields t={t} setT={setT} /> :
                    t.schemaType === 'HowTo' ? <HowToFields t={t} setT={setT} updateField={updateField} /> :
                    t.schemaType === 'Recipe' ? <RecipeFields t={t} setT={setT} updateField={updateField} updateNested={updateNested} /> :
                    t.schemaType === 'Event' ? <EventFields t={t} setT={setT} updateField={updateField} updateNested={updateNested} /> :
                    t.schemaType === 'Article' ? <ArticleFields t={t} updateField={updateField} /> :
                    t.schemaType === 'LocalBusiness' ? <LocalBusinessFields t={t} updateField={updateField} updateNested={updateNested} /> :
                    t.schemaType === 'Product' ? <ProductFields t={t} updateField={updateField} updateNested={updateNested} /> :
                    t.schemaType === 'Review' ? <ReviewFields t={t} updateField={updateField} updateNested={updateNested} /> :
                    null}
            </Card>

            <Card title="Attach to" subtitle="Which records should emit this schema?">
                <RowToggle label="All blog posts" hint="Emit on every published blog post." checked={t.attachTo.allBlogPosts} onChange={v => updateAttach('allBlogPosts', v)} />
                <RowToggle label="All projects" hint="Emit on every published project / page." checked={t.attachTo.allProjects} onChange={v => updateAttach('allProjects', v)} />
                <Row label="Specific blog posts" hint="Comma- or newline-separated slugs / IDs.">
                    <textarea rows={2} value={(t.attachTo.posts || []).join('\n')} onChange={e => updateAttach('posts', splitList(e.target.value))} className={inputCls + ' font-mono text-xs'} />
                </Row>
                <Row label="Specific projects" hint="Comma- or newline-separated slugs / IDs.">
                    <textarea rows={2} value={(t.attachTo.projects || []).join('\n')} onChange={e => updateAttach('projects', splitList(e.target.value))} className={inputCls + ' font-mono text-xs'} />
                </Row>
            </Card>
        </div>
    );
}

function splitList(s) {
    return String(s || '').split(/[\n,]+/).map(x => x.trim()).filter(Boolean);
}

// ----- per-type field editors -----

function FAQFields({ t, setT }) {
    const items = t.fields.questions || [];
    const update = (i, k, v) => setT(e => ({ ...e, fields: { ...e.fields, questions: e.fields.questions.map((q, idx) => idx === i ? { ...q, [k]: v } : q) } }));
    const add = () => setT(e => ({ ...e, fields: { ...e.fields, questions: [...(e.fields.questions || []), { question: '', answer: '' }] } }));
    const remove = (i) => setT(e => ({ ...e, fields: { ...e.fields, questions: e.fields.questions.filter((_, idx) => idx !== i) } }));
    return (
        <div className="space-y-3">
            {items.map((q, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <input type="text" placeholder="Question" value={q.question} onChange={e => update(i, 'question', e.target.value)} className={inputCls + ' col-span-5'} />
                    <textarea placeholder="Answer" value={q.answer} onChange={e => update(i, 'answer', e.target.value)} rows={2} className={inputCls + ' col-span-6'} />
                    <button type="button" onClick={() => remove(i)} className="col-span-1 text-red-500 hover:text-red-700"><MdDelete size={18} /></button>
                </div>
            ))}
            <button type="button" onClick={add} className="text-xs font-semibold text-gold hover:underline">+ Add Q&amp;A</button>
        </div>
    );
}

function HowToFields({ t, setT, updateField }) {
    const steps = t.fields.steps || [];
    const update = (i, k, v) => setT(e => ({ ...e, fields: { ...e.fields, steps: e.fields.steps.map((s, idx) => idx === i ? { ...s, [k]: v } : s) } }));
    const add = () => setT(e => ({ ...e, fields: { ...e.fields, steps: [...(e.fields.steps || []), { name: '', text: '', image: '' }] } }));
    const remove = (i) => setT(e => ({ ...e, fields: { ...e.fields, steps: e.fields.steps.filter((_, idx) => idx !== i) } }));
    return (
        <div className="space-y-3">
            <Row label="Name"><input type="text" value={t.fields.name || ''} onChange={e => updateField('name', e.target.value)} className={inputCls} /></Row>
            <Row label="Description"><textarea rows={2} value={t.fields.description || ''} onChange={e => updateField('description', e.target.value)} className={inputCls} /></Row>
            <Row label="Total time" hint="ISO-8601 duration, e.g. PT30M for 30 minutes."><input type="text" value={t.fields.totalTime || ''} onChange={e => updateField('totalTime', e.target.value)} className={inputCls + ' font-mono'} placeholder="PT30M" /></Row>
            <p className="text-xs font-semibold text-gray-700 mt-2">Steps</p>
            {steps.map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <input type="text" placeholder={`Step ${i + 1} name`} value={s.name} onChange={e => update(i, 'name', e.target.value)} className={inputCls + ' col-span-3'} />
                    <textarea placeholder="Step text" value={s.text} onChange={e => update(i, 'text', e.target.value)} rows={2} className={inputCls + ' col-span-5'} />
                    <input type="text" placeholder="Image URL" value={s.image} onChange={e => update(i, 'image', e.target.value)} className={inputCls + ' col-span-3 font-mono text-xs'} />
                    <button type="button" onClick={() => remove(i)} className="col-span-1 text-red-500 hover:text-red-700"><MdDelete size={18} /></button>
                </div>
            ))}
            <button type="button" onClick={add} className="text-xs font-semibold text-gold hover:underline">+ Add step</button>
        </div>
    );
}

function RecipeFields({ t, setT, updateField, updateNested }) {
    const ingredients = t.fields.recipeIngredient || [];
    const instructions = t.fields.recipeInstructions || [];
    const updateIng = (i, v) => setT(e => ({ ...e, fields: { ...e.fields, recipeIngredient: e.fields.recipeIngredient.map((x, idx) => idx === i ? v : x) } }));
    const addIng = () => setT(e => ({ ...e, fields: { ...e.fields, recipeIngredient: [...(e.fields.recipeIngredient || []), ''] } }));
    const removeIng = (i) => setT(e => ({ ...e, fields: { ...e.fields, recipeIngredient: e.fields.recipeIngredient.filter((_, idx) => idx !== i) } }));
    const updateInst = (i, k, v) => setT(e => ({ ...e, fields: { ...e.fields, recipeInstructions: e.fields.recipeInstructions.map((s, idx) => idx === i ? { ...s, [k]: v } : s) } }));
    const addInst = () => setT(e => ({ ...e, fields: { ...e.fields, recipeInstructions: [...(e.fields.recipeInstructions || []), { name: '', text: '' }] } }));
    const removeInst = (i) => setT(e => ({ ...e, fields: { ...e.fields, recipeInstructions: e.fields.recipeInstructions.filter((_, idx) => idx !== i) } }));
    return (
        <div className="space-y-3">
            <Row label="Recipe name"><input type="text" value={t.fields.name || ''} onChange={e => updateField('name', e.target.value)} className={inputCls} /></Row>
            <Row label="Description"><textarea rows={2} value={t.fields.description || ''} onChange={e => updateField('description', e.target.value)} className={inputCls} /></Row>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Yield"><input type="text" value={t.fields.recipeYield || ''} onChange={e => updateField('recipeYield', e.target.value)} className={inputCls} placeholder="4 servings" /></Row>
                <Row label="Total time" hint="ISO-8601 duration."><input type="text" value={t.fields.totalTime || ''} onChange={e => updateField('totalTime', e.target.value)} className={inputCls + ' font-mono'} placeholder="PT45M" /></Row>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-2">Ingredients</p>
            {ingredients.map((ing, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                    <input type="text" value={ing} onChange={e => updateIng(i, e.target.value)} className={inputCls + ' col-span-11'} placeholder={`Ingredient ${i + 1}`} />
                    <button type="button" onClick={() => removeIng(i)} className="col-span-1 text-red-500 hover:text-red-700"><MdDelete size={18} /></button>
                </div>
            ))}
            <button type="button" onClick={addIng} className="text-xs font-semibold text-gold hover:underline">+ Add ingredient</button>
            <p className="text-xs font-semibold text-gray-700 mt-2">Instructions</p>
            {instructions.map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start">
                    <input type="text" placeholder={`Step ${i + 1} name`} value={s.name} onChange={e => updateInst(i, 'name', e.target.value)} className={inputCls + ' col-span-3'} />
                    <textarea placeholder="Step text" value={s.text} onChange={e => updateInst(i, 'text', e.target.value)} rows={2} className={inputCls + ' col-span-8'} />
                    <button type="button" onClick={() => removeInst(i)} className="col-span-1 text-red-500 hover:text-red-700"><MdDelete size={18} /></button>
                </div>
            ))}
            <button type="button" onClick={addInst} className="text-xs font-semibold text-gold hover:underline">+ Add instruction</button>
            <Row label="Calories"><input type="text" value={t.fields.nutrition?.calories || ''} onChange={e => updateNested('nutrition', 'calories', e.target.value)} className={inputCls} placeholder="280 calories" /></Row>
        </div>
    );
}

function EventFields({ t, updateField, updateNested }) {
    return (
        <div className="space-y-3">
            <Row label="Event name"><input type="text" value={t.fields.name || ''} onChange={e => updateField('name', e.target.value)} className={inputCls} /></Row>
            <Row label="Description"><textarea rows={2} value={t.fields.description || ''} onChange={e => updateField('description', e.target.value)} className={inputCls} /></Row>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Start date"><input type="datetime-local" value={t.fields.startDate || ''} onChange={e => updateField('startDate', e.target.value)} className={inputCls} /></Row>
                <Row label="End date"><input type="datetime-local" value={t.fields.endDate || ''} onChange={e => updateField('endDate', e.target.value)} className={inputCls} /></Row>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Status">
                    <select value={t.fields.eventStatus} onChange={e => updateField('eventStatus', e.target.value)} className={inputCls}>
                        {['EventScheduled', 'EventCancelled', 'EventPostponed', 'EventRescheduled', 'EventMovedOnline'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </Row>
                <Row label="Attendance mode">
                    <select value={t.fields.eventAttendanceMode} onChange={e => updateField('eventAttendanceMode', e.target.value)} className={inputCls}>
                        {['OfflineEventAttendanceMode', 'OnlineEventAttendanceMode', 'MixedEventAttendanceMode'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </Row>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-2">Location</p>
            <Row label="Venue name"><input type="text" value={t.fields.location?.name || ''} onChange={e => updateNested('location', 'name', e.target.value)} className={inputCls} /></Row>
            <Row label="Street"><input type="text" value={t.fields.location?.streetAddress || ''} onChange={e => updateNested('location', 'streetAddress', e.target.value)} className={inputCls} /></Row>
            <div className="grid grid-cols-2 gap-3">
                <Row label="City"><input type="text" value={t.fields.location?.addressLocality || ''} onChange={e => updateNested('location', 'addressLocality', e.target.value)} className={inputCls} /></Row>
                <Row label="Region"><input type="text" value={t.fields.location?.addressRegion || ''} onChange={e => updateNested('location', 'addressRegion', e.target.value)} className={inputCls} /></Row>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Postal code"><input type="text" value={t.fields.location?.postalCode || ''} onChange={e => updateNested('location', 'postalCode', e.target.value)} className={inputCls} /></Row>
                <Row label="Country"><input type="text" value={t.fields.location?.addressCountry || ''} onChange={e => updateNested('location', 'addressCountry', e.target.value)} className={inputCls} placeholder="IN" /></Row>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-2">Organizer</p>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Name"><input type="text" value={t.fields.organizer?.name || ''} onChange={e => updateNested('organizer', 'name', e.target.value)} className={inputCls} /></Row>
                <Row label="URL"><input type="text" value={t.fields.organizer?.url || ''} onChange={e => updateNested('organizer', 'url', e.target.value)} className={inputCls} /></Row>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-2">Offer (optional)</p>
            <div className="grid grid-cols-3 gap-3">
                <Row label="Price"><input type="text" value={t.fields.offers?.price || ''} onChange={e => updateNested('offers', 'price', e.target.value)} className={inputCls} /></Row>
                <Row label="Currency"><input type="text" value={t.fields.offers?.priceCurrency || ''} onChange={e => updateNested('offers', 'priceCurrency', e.target.value)} className={inputCls} placeholder="INR" /></Row>
                <Row label="URL"><input type="text" value={t.fields.offers?.url || ''} onChange={e => updateNested('offers', 'url', e.target.value)} className={inputCls} /></Row>
            </div>
        </div>
    );
}

function ArticleFields({ t, updateField }) {
    return (
        <div className="space-y-3">
            <Row label="Headline"><input type="text" value={t.fields.headline || ''} onChange={e => updateField('headline', e.target.value)} className={inputCls} /></Row>
            <Row label="Description"><textarea rows={2} value={t.fields.description || ''} onChange={e => updateField('description', e.target.value)} className={inputCls} /></Row>
            <Row label="Author"><input type="text" value={t.fields.author || ''} onChange={e => updateField('author', e.target.value)} className={inputCls} /></Row>
            <Row label="Date published"><input type="date" value={t.fields.datePublished || ''} onChange={e => updateField('datePublished', e.target.value)} className={inputCls} /></Row>
            <Row label="Image URL"><input type="text" value={t.fields.image || ''} onChange={e => updateField('image', e.target.value)} className={inputCls} /></Row>
        </div>
    );
}

function LocalBusinessFields({ t, updateField, updateNested }) {
    return (
        <div className="space-y-3">
            <Row label="Name"><input type="text" value={t.fields.name || ''} onChange={e => updateField('name', e.target.value)} className={inputCls} /></Row>
            <Row label="Description"><textarea rows={2} value={t.fields.description || ''} onChange={e => updateField('description', e.target.value)} className={inputCls} /></Row>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Telephone"><input type="text" value={t.fields.telephone || ''} onChange={e => updateField('telephone', e.target.value)} className={inputCls} /></Row>
                <Row label="Price range"><input type="text" value={t.fields.priceRange || ''} onChange={e => updateField('priceRange', e.target.value)} className={inputCls} placeholder="₹₹₹" /></Row>
            </div>
            <Row label="Street"><input type="text" value={t.fields.address?.streetAddress || ''} onChange={e => updateNested('address', 'streetAddress', e.target.value)} className={inputCls} /></Row>
            <div className="grid grid-cols-2 gap-3">
                <Row label="City"><input type="text" value={t.fields.address?.addressLocality || ''} onChange={e => updateNested('address', 'addressLocality', e.target.value)} className={inputCls} /></Row>
                <Row label="Region"><input type="text" value={t.fields.address?.addressRegion || ''} onChange={e => updateNested('address', 'addressRegion', e.target.value)} className={inputCls} /></Row>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Postal code"><input type="text" value={t.fields.address?.postalCode || ''} onChange={e => updateNested('address', 'postalCode', e.target.value)} className={inputCls} /></Row>
                <Row label="Country"><input type="text" value={t.fields.address?.addressCountry || ''} onChange={e => updateNested('address', 'addressCountry', e.target.value)} className={inputCls} /></Row>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Latitude"><input type="text" value={t.fields.geo?.latitude || ''} onChange={e => updateNested('geo', 'latitude', e.target.value)} className={inputCls} /></Row>
                <Row label="Longitude"><input type="text" value={t.fields.geo?.longitude || ''} onChange={e => updateNested('geo', 'longitude', e.target.value)} className={inputCls} /></Row>
            </div>
        </div>
    );
}

function ProductFields({ t, updateField, updateNested }) {
    return (
        <div className="space-y-3">
            <Row label="Name"><input type="text" value={t.fields.name || ''} onChange={e => updateField('name', e.target.value)} className={inputCls} /></Row>
            <Row label="Description"><textarea rows={2} value={t.fields.description || ''} onChange={e => updateField('description', e.target.value)} className={inputCls} /></Row>
            <div className="grid grid-cols-2 gap-3">
                <Row label="SKU"><input type="text" value={t.fields.sku || ''} onChange={e => updateField('sku', e.target.value)} className={inputCls} /></Row>
                <Row label="Brand"><input type="text" value={t.fields.brand || ''} onChange={e => updateField('brand', e.target.value)} className={inputCls} /></Row>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-2">Offer</p>
            <div className="grid grid-cols-3 gap-3">
                <Row label="Price"><input type="text" value={t.fields.offers?.price || ''} onChange={e => updateNested('offers', 'price', e.target.value)} className={inputCls} /></Row>
                <Row label="Currency"><input type="text" value={t.fields.offers?.priceCurrency || ''} onChange={e => updateNested('offers', 'priceCurrency', e.target.value)} className={inputCls} placeholder="INR" /></Row>
                <Row label="Availability">
                    <select value={t.fields.offers?.availability || 'InStock'} onChange={e => updateNested('offers', 'availability', e.target.value)} className={inputCls}>
                        {['InStock', 'OutOfStock', 'PreOrder', 'BackOrder'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                </Row>
            </div>
            <p className="text-xs font-semibold text-gray-700 mt-2">Aggregate rating</p>
            <div className="grid grid-cols-2 gap-3">
                <Row label="Rating value"><input type="text" value={t.fields.aggregateRating?.ratingValue || ''} onChange={e => updateNested('aggregateRating', 'ratingValue', e.target.value)} className={inputCls} /></Row>
                <Row label="Review count"><input type="text" value={t.fields.aggregateRating?.reviewCount || ''} onChange={e => updateNested('aggregateRating', 'reviewCount', e.target.value)} className={inputCls} /></Row>
            </div>
        </div>
    );
}

function ReviewFields({ t, updateField, updateNested }) {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <Row label="Item reviewed (name)"><input type="text" value={t.fields.itemReviewed?.name || ''} onChange={e => updateNested('itemReviewed', 'name', e.target.value)} className={inputCls} /></Row>
                <Row label="Item reviewed (type)"><input type="text" value={t.fields.itemReviewed?.type || ''} onChange={e => updateNested('itemReviewed', 'type', e.target.value)} className={inputCls} placeholder="Product / Movie / Book / Thing" /></Row>
            </div>
            <Row label="Author"><input type="text" value={t.fields.author || ''} onChange={e => updateField('author', e.target.value)} className={inputCls} /></Row>
            <Row label="Review body"><textarea rows={3} value={t.fields.reviewBody || ''} onChange={e => updateField('reviewBody', e.target.value)} className={inputCls} /></Row>
            <div className="grid grid-cols-3 gap-3">
                <Row label="Rating"><input type="text" value={t.fields.reviewRating?.ratingValue || ''} onChange={e => updateNested('reviewRating', 'ratingValue', e.target.value)} className={inputCls} placeholder="4.5" /></Row>
                <Row label="Best"><input type="text" value={t.fields.reviewRating?.bestRating || ''} onChange={e => updateNested('reviewRating', 'bestRating', e.target.value)} className={inputCls} placeholder="5" /></Row>
                <Row label="Worst"><input type="text" value={t.fields.reviewRating?.worstRating || ''} onChange={e => updateNested('reviewRating', 'worstRating', e.target.value)} className={inputCls} placeholder="1" /></Row>
            </div>
        </div>
    );
}

// ============================================================================
// Shared bits
// ============================================================================

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-gold';

function Card({ title, subtitle, children }) {
    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            {title ? <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3> : null}
            {subtitle ? <p className="text-xs text-gray-500 mb-4">{subtitle}</p> : <div className="mb-2" />}
            <div className="space-y-3">{children}</div>
        </div>
    );
}
function Row({ label, hint, children }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
            {children}
            {hint ? <p className="text-[11px] text-gray-400 mt-1">{hint}</p> : null}
        </div>
    );
}
function RowToggle({ label, hint, checked, onChange }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-xs font-semibold text-gray-700">{label}</p>
                {hint ? <p className="text-[11px] text-gray-400 mt-1">{hint}</p> : null}
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <span className={`text-[11px] font-bold uppercase tracking-wider w-7 text-right ${checked ? 'text-gold' : 'text-gray-400'}`}>
                    {checked ? 'On' : 'Off'}
                </span>
                <span role="switch" aria-checked={!!checked} tabIndex={0}
                    onClick={() => onChange(!checked)}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onChange(!checked); } }}
                    className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors ${checked ? 'bg-gold' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
            </label>
        </div>
    );
}
