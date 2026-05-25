'use client';

// Analytics & Tracking — dynamic script manager. Admin adds rows of
// { label, code, position, enabled }. Quick-add presets prefill the row
// with stubs for the well-known services (GA4, GTM, Clarity, Ahrefs, GSC,
// Meta Pixel) but the admin can also paste anything they want.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AdminSidebar from '@/components/AdminSidebar';
import {
    MdSave, MdAdd, MdDelete, MdInfo, MdContentCopy, MdOpenInNew,
    MdToggleOn, MdToggleOff, MdArrowDropDown,
} from 'react-icons/md';

const POSITIONS = [
    { value: 'head', label: '<head>' },
    { value: 'body', label: '<body> (end)' },
];

// Mirror of SCRIPT_PRESETS in src/lib/analyticsScripts.js — duplicated here
// because the editor is a client component and shouldn't import the server
// lib (which imports col → mongo). Update both together if you add presets.
const PRESETS = [
    { key: 'gtm', label: 'Google Tag Manager (head)', position: 'head' },
    { key: 'gtmBody', label: 'Google Tag Manager (body)', position: 'body' },
    { key: 'ga4', label: 'Google Analytics 4', position: 'head' },
    { key: 'clarity', label: 'Microsoft Clarity', position: 'head' },
    { key: 'ahrefs', label: 'Ahrefs verification', position: 'head' },
    { key: 'gsc', label: 'Google Search Console', position: 'head' },
    { key: 'facebook', label: 'Meta (Facebook) Pixel', position: 'head' },
    { key: 'custom', label: 'Custom (blank row)', position: 'head' },
];

const PRESET_CODE = {
    gtm: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->`,
    gtmBody: `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`,
    ga4: `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`,
    clarity: `<!-- Microsoft Clarity -->
<script>
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
</script>`,
    ahrefs: `<meta name="ahrefs-site-verification" content="YOUR_AHREFS_TOKEN" />`,
    gsc: `<meta name="google-site-verification" content="YOUR_GSC_TOKEN" />`,
    facebook: `<!-- Meta Pixel -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>`,
    custom: '',
};

function randId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export default function AnalyticsScriptsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [scripts, setScripts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [presetOpen, setPresetOpen] = useState(false);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const j = await (await fetch('/api/analytics-scripts')).json();
                if (j.success && Array.isArray(j.data?.scripts)) setScripts(j.data.scripts);
            } finally { setLoading(false); }
        })();
    }, [user]);

    const addScript = (presetKey = 'custom') => {
        const preset = PRESETS.find(p => p.key === presetKey) || PRESETS[PRESETS.length - 1];
        setScripts(prev => [
            ...prev,
            {
                id: randId(),
                label: preset.label.replace(/\s*\(.*\)$/, ''),
                code: PRESET_CODE[presetKey] || '',
                position: preset.position,
                enabled: true,
            },
        ]);
        setPresetOpen(false);
    };

    const updateScript = (i, patch) => {
        setScripts(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s));
    };

    const removeScript = async (i) => {
        const s = scripts[i];
        const ok = await Swal.fire({
            title: 'Delete this script?',
            text: s?.label ? `"${s.label}" will stop loading on the site.` : 'It will stop loading on the site.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            confirmButtonColor: '#dc2626',
        });
        if (!ok.isConfirmed) return;
        setScripts(prev => prev.filter((_, idx) => idx !== i));
    };

    const save = async () => {
        setSaving(true);
        try {
            const { apiFetch } = await import('@/lib/apiClient');
            const { data: j } = await apiFetch('/api/analytics-scripts', { method: 'PUT', body: { scripts } });
            if (j.success) {
                if (Array.isArray(j.data?.scripts)) setScripts(j.data.scripts);
                Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire('Error', j.error || 'Save failed', 'error');
            }
        } catch (err) {
            Swal.fire('Error', err.message, 'error');
        } finally { setSaving(false); }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-4xl">
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Analytics &amp; Tracking</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Add any number of tracking scripts (GA4, GTM, Clarity, Meta Pixel, custom snippets…) and pick whether each one loads in <code className="px-1 rounded bg-gray-100">&lt;head&gt;</code> or at the end of <code className="px-1 rounded bg-gray-100">&lt;body&gt;</code>.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 relative">
                            <button type="button" onClick={() => setPresetOpen(o => !o)}
                                className="px-3 py-2 text-xs font-bold uppercase tracking-wide border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1">
                                <MdAdd size={14} /> Add script <MdArrowDropDown size={16} />
                            </button>
                            <button type="button" onClick={save} disabled={saving}
                                className="px-4 py-2 text-sm font-bold bg-gold text-white rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                                <MdSave size={16} /> {saving ? 'Saving…' : 'Save changes'}
                            </button>

                            {presetOpen ? (
                                <div className="absolute z-20 right-[120px] top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 w-64">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-3 py-2">Quick-add preset</p>
                                    {PRESETS.map(p => (
                                        <button key={p.key} type="button" onClick={() => addScript(p.key)}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-cream hover:text-gold flex items-center justify-between">
                                            <span>{p.label}</span>
                                            <span className="text-[10px] uppercase font-bold text-gray-400">{p.position}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : (
                        <div className="space-y-4">
                            {scripts.length === 0 ? (
                                <div className="bg-white rounded-xl shadow-md p-10 text-center">
                                    <MdInfo size={32} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No tracking scripts yet. Click <strong>Add script</strong> above to insert one.</p>
                                </div>
                            ) : null}

                            {scripts.map((s, i) => (
                                <div key={s.id} className={`bg-white rounded-xl shadow-md border-l-4 ${s.enabled ? (s.position === 'body' ? 'border-amber-500' : 'border-emerald-500') : 'border-gray-300'} p-5`}>
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={s.label}
                                                onChange={e => updateScript(i, { label: e.target.value })}
                                                placeholder="e.g. GA4, Meta Pixel, Hotjar"
                                                className="text-sm font-bold text-gray-800 border-b border-transparent hover:border-gray-200 focus:border-gold focus:outline-none px-1 py-1 flex-1 min-w-0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <select
                                                value={s.position}
                                                onChange={e => updateScript(i, { position: e.target.value })}
                                                className="px-2 py-1.5 border border-gray-300 rounded text-xs font-mono bg-white text-gray-700 focus:outline-none focus:border-gold"
                                            >
                                                {POSITIONS.map(p => (
                                                    <option key={p.value} value={p.value}>{p.label}</option>
                                                ))}
                                            </select>
                                            <button type="button"
                                                onClick={() => updateScript(i, { enabled: !s.enabled })}
                                                title={s.enabled ? 'Disable (keep saved but stop loading)' : 'Enable'}
                                                className={`px-2 py-1.5 rounded text-xs font-bold inline-flex items-center gap-1 ${s.enabled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                                {s.enabled ? <><MdToggleOn size={16} /> Enabled</> : <><MdToggleOff size={16} /> Disabled</>}
                                            </button>
                                            <button type="button"
                                                onClick={() => navigator.clipboard?.writeText(s.code || '')}
                                                title="Copy code to clipboard"
                                                className="p-1.5 rounded text-gray-400 hover:text-gold hover:bg-cream">
                                                <MdContentCopy size={14} />
                                            </button>
                                            <button type="button"
                                                onClick={() => removeScript(i)}
                                                title="Delete this script"
                                                className="p-1.5 rounded text-red-400 hover:text-white hover:bg-red-500">
                                                <MdDelete size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={s.code}
                                        onChange={e => updateScript(i, { code: e.target.value })}
                                        rows={Math.min(12, Math.max(4, (s.code || '').split('\n').length + 1))}
                                        spellCheck={false}
                                        placeholder='<!-- Paste your <script>, <meta>, or any HTML to inject --><script>...</script>'
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[12px] font-mono leading-[1.5] text-gray-800 bg-white focus:outline-none focus:border-gold resize-y"
                                    />
                                </div>
                            ))}

                            <p className="text-[11px] text-gray-500 inline-flex items-center gap-1">
                                <MdInfo size={12} /> Scripts run on every public page. Anything pasted here is visible to all visitors — don&apos;t paste secrets.
                                <a href="/" target="_blank" rel="noopener noreferrer" className="ml-2 text-gold inline-flex items-center gap-0.5">
                                    Preview live site <MdOpenInNew size={11} />
                                </a>
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
