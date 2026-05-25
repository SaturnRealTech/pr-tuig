'use client';

// Rank Math-style "Edit robots.txt" — full content editor + a small tester
// that validates a URL against the current rules client-side. Saved content
// is served by /robots.txt (see src/app/robots.txt/route.js) on the public
// site. Storage: settings.brand.data.robotsTxt.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import AdminSidebar from '@/components/AdminSidebar';
import { MdSave, MdRefresh, MdCheckCircle, MdCancel, MdOpenInNew, MdInfo } from 'react-icons/md';

export default function EditRobotsTxtPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [content, setContent] = useState('');
    const [defaultContent, setDefaultContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    // Tester state
    const [testUrl, setTestUrl] = useState('');
    const [testUa, setTestUa] = useState('*');
    const [testResult, setTestResult] = useState(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
    }, [router]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const j = await (await fetch('/api/robots-txt')).json();
                if (j.success) {
                    setContent(j.data.content || '');
                    setDefaultContent(j.data.defaultContent || '');
                }
            } finally { setLoading(false); }
        })();
    }, [user]);

    const save = async () => {
        setSaving(true);
        try {
            const { apiFetch } = await import('@/lib/apiClient');
            const { data: j } = await apiFetch('/api/robots-txt', { method: 'PUT', body: { content } });
            if (j.success) {
                Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire('Error', j.error || 'Save failed', 'error');
            }
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
        finally { setSaving(false); }
    };

    const resetToDefault = async () => {
        const ok = await Swal.fire({
            title: 'Reset robots.txt?',
            text: 'This will delete your custom rules and revert to the default content.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Reset',
            confirmButtonColor: '#dc2626',
        });
        if (!ok.isConfirmed) return;
        setResetting(true);
        try {
            const { apiFetch } = await import('@/lib/apiClient');
            await apiFetch('/api/robots-txt', { method: 'DELETE' });
            setContent(defaultContent);
            Swal.fire({ icon: 'success', title: 'Reset to default', timer: 1500, showConfirmButton: false });
        } catch (err) { Swal.fire('Error', err.message, 'error'); }
        finally { setResetting(false); }
    };

    // Run the URL through the rules and report Allow / Disallow.
    const runTest = () => {
        if (!testUrl.trim()) { setTestResult(null); return; }
        let path = testUrl.trim();
        try {
            const u = new URL(path);
            path = u.pathname + (u.search || '');
        } catch {
            if (!path.startsWith('/')) path = '/' + path;
        }
        setTestResult(matchRobots(content, testUa.trim() || '*', path));
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-4xl">
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Edit robots.txt</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Control which paths search engines can crawl. Saved content is served at{' '}
                                <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="text-gold underline inline-flex items-center gap-0.5">
                                    /robots.txt <MdOpenInNew size={11} />
                                </a>.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={resetToDefault} disabled={resetting}
                                className="px-3 py-2 text-xs font-bold uppercase tracking-wide border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-1">
                                <MdRefresh size={14} /> {resetting ? 'Resetting…' : 'Reset to default'}
                            </button>
                            <button type="button" onClick={save} disabled={saving}
                                className="px-4 py-2 text-sm font-bold bg-gold text-white rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                                <MdSave size={16} /> {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : (
                        <>
                            {/* Editor */}
                            <div className="bg-white rounded-xl shadow-md p-5">
                                <label className="block text-xs font-bold uppercase tracking-wide text-gray-700 mb-2">robots.txt content</label>
                                <textarea
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    rows={18}
                                    spellCheck={false}
                                    placeholder={defaultContent}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] font-mono leading-[1.6] text-gray-900 bg-white focus:outline-none focus:border-gold resize-y"
                                />
                                <p className="text-[11px] text-gray-500 mt-2 inline-flex items-center gap-1">
                                    <MdInfo size={12} /> Empty content reverts to the built-in default automatically.
                                </p>
                            </div>

                            {/* Tester */}
                            <div className="bg-white rounded-xl shadow-md p-5 mt-6">
                                <h2 className="text-sm font-bold text-gray-800 mb-1">URL Tester</h2>
                                <p className="text-xs text-gray-500 mb-4">
                                    Paste any URL or path to see if your current rules would allow Googlebot (or another agent) to fetch it.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto] gap-2">
                                    <input
                                        type="text"
                                        value={testUrl}
                                        onChange={e => setTestUrl(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') runTest(); }}
                                        placeholder="/some-page or https://yoursite.com/some-page"
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold font-mono"
                                    />
                                    <select
                                        value={testUa}
                                        onChange={e => setTestUa(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gold"
                                    >
                                        <option value="*">Any (User-agent: *)</option>
                                        <option value="Googlebot">Googlebot</option>
                                        <option value="Bingbot">Bingbot</option>
                                        <option value="Yandex">Yandex</option>
                                        <option value="DuckDuckBot">DuckDuckBot</option>
                                        <option value="Twitterbot">Twitterbot</option>
                                        <option value="facebookexternalhit">facebookexternalhit</option>
                                    </select>
                                    <button type="button" onClick={runTest}
                                        className="px-4 py-2 bg-moss text-white text-sm font-bold rounded-lg hover:bg-leaf">
                                        Test
                                    </button>
                                </div>

                                {testResult ? (
                                    <div className={`mt-4 px-4 py-3 rounded-lg border ${testResult.allowed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                        <div className="flex items-center gap-2 font-bold text-sm">
                                            {testResult.allowed
                                                ? <MdCheckCircle className="text-emerald-600" size={18} />
                                                : <MdCancel className="text-red-600" size={18} />}
                                            <span className={testResult.allowed ? 'text-emerald-800' : 'text-red-800'}>
                                                {testResult.allowed ? 'Allowed' : 'Blocked'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Matched rule:{' '}
                                            <code className="px-1.5 py-0.5 rounded bg-white text-gray-800">{testResult.rule || '(no rule — default allow)'}</code>
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

// Tiny robots.txt matcher. Picks the user-agent block whose name matches
// (case-insensitive) and falls back to `*`. Within the chosen block, the
// longest matching Allow / Disallow rule wins (per Google's spec).
function matchRobots(text, ua, path) {
    const lines = String(text || '').split(/\r?\n/);
    const blocks = []; // [{ agents: [ua], rules: [{ kind, pattern }] }]
    let cur = null;
    for (const raw of lines) {
        const line = raw.replace(/#.*$/, '').trim();
        if (!line) continue;
        const [k, ...rest] = line.split(':');
        if (!k || rest.length === 0) continue;
        const key = k.trim().toLowerCase();
        const val = rest.join(':').trim();
        if (key === 'user-agent') {
            if (!cur || cur.rules.length > 0) {
                cur = { agents: [], rules: [] };
                blocks.push(cur);
            }
            cur.agents.push(val.toLowerCase());
        } else if (key === 'allow' || key === 'disallow') {
            if (!cur) { cur = { agents: ['*'], rules: [] }; blocks.push(cur); }
            cur.rules.push({ kind: key, pattern: val });
        }
    }

    const uaLower = String(ua || '*').toLowerCase();
    const specific = blocks.find(b => b.agents.some(a => a !== '*' && uaLower.includes(a)));
    const wildcard = blocks.find(b => b.agents.includes('*'));
    const chosen = specific || wildcard;
    if (!chosen) return { allowed: true, rule: '' };

    let best = null;
    for (const r of chosen.rules) {
        if (!matchPattern(r.pattern, path)) continue;
        if (!best || r.pattern.length > best.pattern.length) best = r;
    }
    if (!best) return { allowed: true, rule: '' };
    return { allowed: best.kind === 'allow', rule: `${best.kind === 'allow' ? 'Allow' : 'Disallow'}: ${best.pattern}` };
}

function matchPattern(pattern, path) {
    if (!pattern) return false;
    // Escape regex specials except * and $, then translate.
    const re = new RegExp('^' + pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\$$/, '$'));
    return re.test(path);
}
