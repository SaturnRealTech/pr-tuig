'use client';

// Rank Math-style "Webmaster Tools" settings — verification IDs for the major
// search engines plus a free-form <meta> tags textarea.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AdminSidebar from '@/components/AdminSidebar';
import { MdSave, MdInfo, MdOpenInNew } from 'react-icons/md';

const FIELDS = [
    { key: 'googleSiteVerification', label: 'Google Search Console', metaName: 'google-site-verification', help: 'Get it from Search Console verification screen.', learnUrl: 'https://search.google.com/search-console' },
    { key: 'bingSiteVerification', label: 'Bing Webmaster Tools', metaName: 'msvalidate.01', help: 'Get it from Bing Webmaster Tools.', learnUrl: 'https://www.bing.com/webmasters' },
    { key: 'baiduSiteVerification', label: 'Baidu Webmaster Tools', metaName: 'baidu-site-verification', help: 'Get it from Baidu Ziyuan.', learnUrl: 'https://ziyuan.baidu.com/' },
    { key: 'yandexVerification', label: 'Yandex Verification ID', metaName: 'yandex-verification', help: 'Get it from Yandex Webmaster.', learnUrl: 'https://webmaster.yandex.com/' },
    { key: 'pinterestVerification', label: 'Pinterest Verification ID', metaName: 'p:domain_verify', help: 'Get it from your Pinterest business account.', learnUrl: 'https://www.pinterest.com/business/' },
    { key: 'nortonSafeWebVerification', label: 'Norton Safe Web Verification ID', metaName: 'norton-safeweb-site-verification', help: 'Get it from Norton Safe Web.', learnUrl: 'https://safeweb.norton.com/' },
];

const DEFAULT = {
    googleSiteVerification: '',
    bingSiteVerification: '',
    baiduSiteVerification: '',
    yandexVerification: '',
    pinterestVerification: '',
    nortonSafeWebVerification: '',
    customTags: '',
};

export default function WebmasterToolsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [form, setForm] = useState(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const j = await (await fetch('/api/webmaster-tools')).json();
                if (j.success) setForm({ ...DEFAULT, ...j.data });
            } finally { setLoading(false); }
        })();
    }, [user]);

    const handleChange = (k, v) => setForm(d => ({ ...d, [k]: v }));

    const save = async () => {
        setSaving(true);
        try {
            const { apiFetch } = await import('@/lib/apiClient');
            const { data: j } = await apiFetch('/api/webmaster-tools', { method: 'PUT', body: form });
            if (j.success) {
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
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Webmaster Tools</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Verification codes for third-party webmaster tools. They&apos;re emitted as
                            <code className="mx-1 px-1.5 py-0.5 rounded bg-gray-100 text-xs">&lt;meta&gt;</code>
                            tags in every page&apos;s <code className="px-1.5 py-0.5 rounded bg-gray-100 text-xs">&lt;head&gt;</code>.
                        </p>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : (
                        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
                            {FIELDS.map(f => (
                                <div key={f.key} className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-800">{f.label}</label>
                                        <p className="text-xs text-gray-500 mt-1">{f.help}</p>
                                        {f.learnUrl ? (
                                            <a href={f.learnUrl} target="_blank" rel="noopener noreferrer"
                                                className="text-[11px] text-gold inline-flex items-center gap-1 mt-1">
                                                Open <MdOpenInNew size={11} />
                                            </a>
                                        ) : null}
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            value={form[f.key] || ''}
                                            onChange={e => handleChange(f.key, e.target.value)}
                                            placeholder={`Verification ID for ${f.metaName}`}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-gold font-mono"
                                        />
                                        <code className="block mt-2 text-[11px] text-gray-500 break-all">
                                            &lt;meta name=&quot;{f.metaName}&quot; content=&quot;{form[f.key] || 'your-id'}&quot; /&gt;
                                        </code>
                                    </div>
                                </div>
                            ))}

                            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start pt-2 border-t border-gray-100">
                                <div>
                                    <label className="text-sm font-semibold text-gray-800">Custom Webmaster Tags</label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Paste raw <code className="px-1 rounded bg-gray-100">&lt;meta&gt;</code> tags here — one per line. Anything that isn&apos;t a
                                        <code className="mx-1 px-1 rounded bg-gray-100">&lt;meta&gt;</code> tag is dropped at render time.
                                    </p>
                                </div>
                                <div>
                                    <textarea
                                        rows={6}
                                        value={form.customTags || ''}
                                        onChange={e => handleChange('customTags', e.target.value)}
                                        placeholder='<meta name="example" content="value" />'
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono bg-white text-gray-800 focus:outline-none focus:border-gold"
                                    />
                                    <p className="text-[11px] text-gray-500 mt-2 inline-flex items-center gap-1">
                                        <MdInfo size={12} /> Only <code className="px-1 rounded bg-gray-100">&lt;meta&gt;</code> tags are emitted. Scripts and other HTML are stripped for safety.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
                                <button type="button" onClick={save} disabled={saving}
                                    className="inline-flex items-center gap-2 bg-gold text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50">
                                    <MdSave size={16} /> {saving ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
