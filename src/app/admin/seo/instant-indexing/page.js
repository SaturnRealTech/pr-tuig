'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';
import {
    MdSearch, MdCheckCircle, MdError, MdRemoveCircle, MdHelpOutline,
    MdLink, MdContentCopy, MdBolt, MdSettings, MdHistory, MdQueryStats,
    MdRefresh, MdDelete,
} from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';

const TABS = [
    { id: 'submit', label: 'Submit URLs', icon: MdBolt },
    { id: 'settings', label: 'Settings', icon: MdSettings },
    { id: 'history', label: 'History', icon: MdHistory },
    { id: 'stats', label: 'URL Stats', icon: MdQueryStats },
];

export default function InstantIndexingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [siteUrl, setSiteUrl] = useState('');
    const [tab, setTab] = useState('submit');

    // IndexNow
    const [savingKey, setSavingKey] = useState(false);
    const [pinging, setPinging] = useState(false);
    const [key, setKey] = useState('');
    const [savedKey, setSavedKey] = useState('');
    const [urls, setUrls] = useState('');
    const [lastResult, setLastResult] = useState(null);

    // Google integration
    const [google, setGoogle] = useState({
        serviceAccount: null,
        searchConsole: { siteUrl: '' },
        analytics: { propertyId: '' },
        oauth: { clientId: '', hasClientSecret: false, connected: false, userEmail: '', connectedAt: '', scope: '' },
        redirectUri: '',
    });
    const [oauthClientId, setOauthClientId] = useState('');
    const [oauthClientSecret, setOauthClientSecret] = useState('');
    const [serviceAccountJson, setServiceAccountJson] = useState('');
    const [savingGoogle, setSavingGoogle] = useState(false);
    const [savingOauthClient, setSavingOauthClient] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // Auto-listed properties
    const [propsLoading, setPropsLoading] = useState(false);
    const [gscSites, setGscSites] = useState([]);
    const [gaProperties, setGaProperties] = useState([]);
    const [propsError, setPropsError] = useState(null);

    // History
    const [history, setHistory] = useState({ rows: [], total: 0, page: 1, limit: 50 });
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyTarget, setHistoryTarget] = useState('all'); // all | indexnow | google
    const [historyPage, setHistoryPage] = useState(1);

    // URL stats lookup
    const [lookupUrl, setLookupUrl] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const u = localStorage.getItem('user');
        if (!u) { router.push('/admin/login'); return; }
        setUser(JSON.parse(u));
        if (typeof window !== 'undefined') setSiteUrl(window.location.origin);
    }, [router]);

    useEffect(() => {
        if (!user) return;
        const flag = searchParams.get('google');
        if (!flag) return;
        const errorMsg = searchParams.get('error');
        if (flag === 'connected') {
            Swal.fire({ icon: 'success', title: 'Connected to Google', timer: 1800, showConfirmButton: false });
            setTab('settings');
        } else if (flag !== 'unauthorized') {
            Swal.fire('Google connect failed', errorMsg || flag, 'error');
        }
        const url = new URL(window.location.href);
        url.searchParams.delete('google');
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());
    }, [user, searchParams]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        setLoading(true);
        Promise.all([
            fetch('/api/settings').then(r => r.json()).catch(() => ({})),
            fetch('/api/google-integration').then(r => r.json()).catch(() => ({})),
        ]).then(([sJ, gJ]) => {
            if (cancelled) return;
            const k = sJ?.data?.indexNowKey || '';
            setKey(k); setSavedKey(k);
            if (gJ?.success) {
                setGoogle(gJ.data);
                setOauthClientId(gJ.data?.oauth?.clientId || '');
            }
        }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [user]);

    useEffect(() => {
        if (!google.oauth?.connected) return;
        let cancelled = false;
        setPropsLoading(true); setPropsError(null);
        fetch('/api/google-oauth/properties')
            .then(r => r.json())
            .then(j => {
                if (cancelled || !j.success) {
                    if (!cancelled) setPropsError(j?.error || 'Failed to load properties');
                    return;
                }
                setGscSites(j.sites || []);
                setGaProperties(j.properties || []);
                if (j.searchConsoleError || j.analyticsError) {
                    setPropsError([j.searchConsoleError, j.analyticsError].filter(Boolean).join(' · '));
                }
            })
            .catch(e => { if (!cancelled) setPropsError(e.message); })
            .finally(() => { if (!cancelled) setPropsLoading(false); });
        return () => { cancelled = true; };
    }, [google.oauth?.connected]);

    // History fetch — runs whenever the History tab opens or filters change.
    useEffect(() => {
        if (tab !== 'history' || !user) return;
        loadHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, historyTarget, historyPage]);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const params = new URLSearchParams({ page: String(historyPage), limit: '50' });
            if (historyTarget !== 'all') params.set('target', historyTarget);
            const res = await fetch(`/api/indexnow/history?${params.toString()}`);
            const j = await res.json();
            if (j.success) setHistory({ rows: j.rows || [], total: j.total || 0, page: j.page, limit: j.limit });
        } finally { setHistoryLoading(false); }
    };

    const clearHistoryRows = async () => {
        const c = await Swal.fire({ title: 'Clear all history?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Clear' });
        if (!c.isConfirmed) return;
        await fetch('/api/indexnow/history', { method: 'DELETE' });
        setHistoryPage(1);
        loadHistory();
    };

    // ---------- IndexNow ----------
    const generateKey = () => {
        const buf = new Uint8Array(16);
        crypto.getRandomValues(buf);
        setKey([...buf].map(b => b.toString(16).padStart(2, '0')).join(''));
    };

    const saveKey = async () => {
        setSavingKey(true);
        try {
            const cur = (await (await fetch('/api/settings')).json())?.data || {};
            const put = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...cur, indexNowKey: key.trim() }),
            });
            const j = await put.json();
            if (j.success) { setSavedKey(key.trim()); Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false }); }
            else Swal.fire('Error', j.error || 'Save failed', 'error');
        } catch (e) { Swal.fire('Error', e.message, 'error'); }
        finally { setSavingKey(false); }
    };

    const ping = async () => {
        const list = urls.split(/\n+/).map(s => s.trim()).filter(Boolean);
        if (list.length === 0) { Swal.fire('Error', 'Provide at least one URL', 'error'); return; }
        setPinging(true); setLastResult(null);
        try {
            const res = await fetch('/api/indexnow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls: list }),
            });
            setLastResult(await res.json());
        } catch (e) { setLastResult({ success: false, error: e.message }); }
        finally { setPinging(false); }
    };

    // ---------- Google OAuth ----------
    const saveOauthClient = async () => {
        if (!oauthClientId.trim()) { Swal.fire('Error', 'Paste a Google OAuth Client ID first.', 'error'); return; }
        if (!google.oauth?.hasClientSecret && !oauthClientSecret.trim()) { Swal.fire('Error', 'Paste the Client Secret too.', 'error'); return; }
        setSavingOauthClient(true);
        try {
            const payload = {
                oauth: {
                    clientId: oauthClientId.trim(),
                    ...(oauthClientSecret.trim() ? { clientSecret: oauthClientSecret.trim() } : {}),
                },
            };
            const res = await fetch('/api/google-integration', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const j = await res.json();
            if (j.success) { setGoogle(j.data); setOauthClientSecret(''); Swal.fire({ icon: 'success', title: 'OAuth client saved', timer: 1500, showConfirmButton: false }); }
            else Swal.fire('Error', j.error || 'Save failed', 'error');
        } catch (e) { Swal.fire('Error', e.message, 'error'); }
        finally { setSavingOauthClient(false); }
    };

    const connectGoogle = () => {
        if (!google.oauth?.clientId || !google.oauth?.hasClientSecret) {
            Swal.fire('Save Client ID & Secret first', 'Paste both then click Save before connecting.', 'info');
            return;
        }
        window.location.href = '/api/google-oauth/start';
    };

    const disconnectGoogle = async () => {
        const c = await Swal.fire({ title: 'Disconnect Google?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Disconnect' });
        if (!c.isConfirmed) return;
        setDisconnecting(true);
        try {
            await fetch('/api/google-oauth/disconnect', { method: 'POST' });
            const j = await (await fetch('/api/google-integration')).json();
            if (j.success) setGoogle(j.data);
            setGscSites([]); setGaProperties([]);
        } finally { setDisconnecting(false); }
    };

    const copyRedirectUri = async () => {
        try {
            await navigator.clipboard.writeText(google.redirectUri || `${siteUrl}/api/google-oauth/callback`);
            Swal.fire({ icon: 'success', title: 'Copied', timer: 1000, showConfirmButton: false });
        } catch { }
    };

    const saveGoogle = async () => {
        setSavingGoogle(true);
        try {
            const payload = {
                searchConsole: { siteUrl: google.searchConsole?.siteUrl || '' },
                analytics: { propertyId: google.analytics?.propertyId || '' },
            };
            if (serviceAccountJson.trim()) payload.serviceAccount = serviceAccountJson;
            const res = await fetch('/api/google-integration', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const j = await res.json();
            if (j.success) { setGoogle(j.data); setServiceAccountJson(''); Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, showConfirmButton: false }); }
            else Swal.fire('Error', j.error || 'Save failed', 'error');
        } catch (e) { Swal.fire('Error', e.message, 'error'); }
        finally { setSavingGoogle(false); }
    };

    const removeServiceAccount = async () => {
        const c = await Swal.fire({ title: 'Remove Service Account?', icon: 'warning', showCancelButton: true });
        if (!c.isConfirmed) return;
        const res = await fetch('/api/google-integration', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceAccount: null }) });
        const j = await res.json();
        if (j.success) { setGoogle(j.data); setServiceAccountJson(''); }
    };

    const testConnection = async () => {
        setTesting(true); setTestResult(null);
        try {
            const res = await fetch('/api/google-integration/test', { method: 'POST' });
            setTestResult(await res.json());
        } catch (e) { setTestResult({ success: false, error: e.message }); }
        finally { setTesting(false); }
    };

    // ---------- URL stats ----------
    const lookupStats = async () => {
        if (!lookupUrl.trim()) return;
        setLookupLoading(true); setStats(null);
        try {
            const res = await fetch(`/api/google-integration/url-stats?url=${encodeURIComponent(lookupUrl.trim())}`);
            setStats(await res.json());
        } catch (e) { setStats({ success: false, error: e.message }); }
        finally { setLookupLoading(false); }
    };

    if (!user) return null;
    const keyFileUrl = savedKey ? `${siteUrl}/indexnow/${savedKey}.txt` : '';
    const saConfigured = !!google.serviceAccount?.has_private_key;
    const googleReady = saConfigured || !!google.oauth?.connected;
    const totalPages = Math.max(1, Math.ceil((history.total || 0) / (history.limit || 50)));

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8 max-w-5xl">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-800">Instant Indexing</h1>
                        <p className="text-sm text-gray-500 mt-1">Push every change to Google &amp; Bing the moment you save.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
                        {TABS.map(t => {
                            const Icon = t.icon;
                            const active = tab === t.id;
                            return (
                                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                                    className={`px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 border-b-2 -mb-px transition
                                        ${active ? 'text-gold border-gold' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
                                    <Icon size={16} /> {t.label}
                                </button>
                            );
                        })}
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500">Loading…</p>
                    ) : tab === 'submit' ? (
                        <SubmitTab
                            urls={urls} setUrls={setUrls}
                            ping={ping} pinging={pinging}
                            savedKey={savedKey} googleReady={googleReady}
                            lastResult={lastResult}
                            siteUrl={siteUrl}
                        />
                    ) : tab === 'settings' ? (
                        <SettingsTab
                            siteUrl={siteUrl}
                            // IndexNow
                            key_={key} setKey={setKey} savedKey={savedKey} keyFileUrl={keyFileUrl}
                            generateKey={generateKey} saveKey={saveKey} savingKey={savingKey}
                            // OAuth
                            google={google}
                            oauthClientId={oauthClientId} setOauthClientId={setOauthClientId}
                            oauthClientSecret={oauthClientSecret} setOauthClientSecret={setOauthClientSecret}
                            saveOauthClient={saveOauthClient} savingOauthClient={savingOauthClient}
                            connectGoogle={connectGoogle} disconnectGoogle={disconnectGoogle} disconnecting={disconnecting}
                            copyRedirectUri={copyRedirectUri}
                            // Properties + SA
                            setGoogle={setGoogle}
                            propsLoading={propsLoading} propsError={propsError}
                            gscSites={gscSites} gaProperties={gaProperties}
                            saConfigured={saConfigured}
                            serviceAccountJson={serviceAccountJson} setServiceAccountJson={setServiceAccountJson}
                            removeServiceAccount={removeServiceAccount}
                            saveGoogle={saveGoogle} savingGoogle={savingGoogle}
                            testConnection={testConnection} testing={testing} testResult={testResult}
                        />
                    ) : tab === 'history' ? (
                        <HistoryTab
                            history={history} loading={historyLoading}
                            target={historyTarget} setTarget={t => { setHistoryTarget(t); setHistoryPage(1); }}
                            page={historyPage} setPage={setHistoryPage} totalPages={totalPages}
                            reload={loadHistory}
                            clearAll={clearHistoryRows}
                        />
                    ) : (
                        <StatsTab
                            lookupUrl={lookupUrl} setLookupUrl={setLookupUrl}
                            lookupStats={lookupStats} lookupLoading={lookupLoading}
                            stats={stats} googleReady={googleReady}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

// ============================================================================
// Tabs
// ============================================================================

function SubmitTab({ urls, setUrls, ping, pinging, savedKey, googleReady, lastResult, siteUrl }) {
    return (
        <>
            <div className="bg-white rounded-t-xl shadow-md p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 text-center">Submit URLs</h2>
                <p className="text-sm text-gray-500 text-center mt-1">Send URLs to Google&apos;s Indexing API and IndexNow (Bing / Yandex). One URL per line, up to 10,000.</p>
            </div>
            <div className="bg-white shadow-md rounded-b-xl p-6 space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Insert URLs to index (one per line, up to 10,000):</label>
                    <textarea value={urls} onChange={e => setUrls(e.target.value)} rows={9}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono text-gray-800 focus:outline-none focus:border-gold"
                        placeholder={`${siteUrl}/blog/my-new-post\n${siteUrl}/some-page\n/relative/paths-work-too`} />
                </div>

                <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-gray-400">
                        {savedKey ? 'IndexNow ready.' : 'IndexNow key missing — only Google will submit.'}{' '}
                        {googleReady ? 'Google ready.' : 'Google not configured.'}
                    </span>
                    <button type="button" onClick={ping} disabled={pinging || (!savedKey && !googleReady)}
                        className="px-5 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
                        <MdBolt size={16} /> {pinging ? 'Indexing…' : 'Submit URLs'}
                    </button>
                </div>

                {lastResult ? (
                    <div className="space-y-2 text-xs pt-2">
                        {lastResult.indexNow && !lastResult.indexNow.skipped ? (
                            <SubmitRow label="IndexNow" ok={lastResult.indexNow.status >= 200 && lastResult.indexNow.status < 300}
                                detail={`HTTP ${lastResult.indexNow.status} · ${lastResult.indexNow.submitted} URL(s)${lastResult.indexNow.body ? ' · ' + lastResult.indexNow.body : ''}`} />
                        ) : null}
                        {lastResult.google && !lastResult.google.skipped ? (
                            <div>
                                <SubmitRow label="Google Indexing API" ok={lastResult.google.submitted === lastResult.google.total}
                                    detail={`${lastResult.google.submitted} / ${lastResult.google.total} accepted`} />
                                <div className="ml-6 mt-1 space-y-1">
                                    {(lastResult.google.results || []).map((r, i) => (
                                        <div key={i} className={`text-[11px] ${r.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                                            {r.ok ? '✓' : '✗'} <span className="font-mono break-all">{r.url}</span>{r.error ? <span> — {r.error}</span> : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : null}

                <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    Every publish, edit or delete of a blog post / page already fires both Google and IndexNow automatically — this form is for re-submitting older URLs or one-off pages.
                </p>
            </div>
        </>
    );
}

function SettingsTab({
    siteUrl,
    key_, setKey, savedKey, keyFileUrl, generateKey, saveKey, savingKey,
    google,
    oauthClientId, setOauthClientId, oauthClientSecret, setOauthClientSecret,
    saveOauthClient, savingOauthClient, connectGoogle, disconnectGoogle, disconnecting, copyRedirectUri,
    setGoogle, propsLoading, propsError, gscSites, gaProperties,
    saConfigured, serviceAccountJson, setServiceAccountJson, removeServiceAccount,
    saveGoogle, savingGoogle, testConnection, testing, testResult,
}) {
    return (
        <div className="space-y-6">
            <Card title="IndexNow key" subtitle="Bing, Yandex, Seznam and Naver. Auto-pings on publish.">
                <div className="flex items-start justify-between mb-3">
                    <p className="text-xs text-gray-500">Served at <code className="font-mono">/indexnow/&lt;key&gt;.txt</code>.</p>
                    <Badge ok={!!savedKey} okLabel="Configured" />
                </div>
                <div className="flex gap-2">
                    <input type="text" value={key_} onChange={e => setKey(e.target.value)} placeholder="32-character hex string" className={inputCls + ' font-mono'} />
                    <button type="button" onClick={generateKey} className={btnGhostCls}>Generate</button>
                    <button type="button" onClick={saveKey} disabled={savingKey || key_.trim() === savedKey} className={btnPrimaryCls}>
                        {savingKey ? 'Saving…' : 'Save'}
                    </button>
                </div>
                {keyFileUrl ? (
                    <p className="text-[11px] text-gray-500 mt-3">Verification file: <a target="_blank" rel="noopener noreferrer" href={keyFileUrl} className="text-gold hover:underline font-mono">{keyFileUrl}</a></p>
                ) : null}
            </Card>

            <Card title="Connect with Google" subtitle="OAuth sign-in. Auto-populates Search Console + GA4 dropdowns once connected.">
                <div className="flex items-start justify-between mb-3">
                    <p className="text-xs text-gray-500">
                        Setup once: at <a target="_blank" rel="noopener noreferrer" className="text-gold underline" href="https://console.cloud.google.com/apis/credentials">console.cloud.google.com → Credentials</a> create an <strong>OAuth 2.0 Client ID</strong> (type: Web application). Add the redirect URI below, then paste the Client ID + Secret here.
                    </p>
                    <Badge ok={!!google.oauth?.connected} okLabel="Connected" />
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2">
                    <MdLink className="text-blue-600 flex-shrink-0" size={18} />
                    <span className="text-xs text-blue-900 break-all">
                        <strong>Authorized redirect URI:</strong>{' '}
                        <span className="font-mono">{google.redirectUri || `${siteUrl}/api/google-oauth/callback`}</span>
                    </span>
                    <button type="button" onClick={copyRedirectUri} className="ml-auto p-1.5 text-blue-700 hover:bg-blue-100 rounded" title="Copy">
                        <MdContentCopy size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Field label="OAuth Client ID">
                        <input type="text" value={oauthClientId} onChange={e => setOauthClientId(e.target.value)}
                            placeholder="123…apps.googleusercontent.com" className={inputCls + ' font-mono'} />
                    </Field>
                    <Field label={google.oauth?.hasClientSecret ? 'Client Secret (leave blank to keep)' : 'Client Secret'}>
                        <input type="password" value={oauthClientSecret} onChange={e => setOauthClientSecret(e.target.value)}
                            placeholder={google.oauth?.hasClientSecret ? '••••••• (stored)' : 'GOCSPX-...'} className={inputCls + ' font-mono'} />
                    </Field>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button type="button" onClick={saveOauthClient} disabled={savingOauthClient} className={btnGhostCls}>
                        {savingOauthClient ? 'Saving…' : 'Save Client ID & Secret'}
                    </button>
                    {google.oauth?.connected ? (
                        <button type="button" onClick={disconnectGoogle} disabled={disconnecting}
                            className="px-4 py-2 border border-red-300 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 inline-flex items-center gap-2">
                            <MdRemoveCircle size={16} /> {disconnecting ? 'Disconnecting…' : 'Disconnect Google'}
                        </button>
                    ) : (
                        <button type="button" onClick={connectGoogle}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-800 text-sm font-semibold rounded-lg hover:shadow inline-flex items-center gap-2">
                            <FcGoogle size={18} /> Connect with Google
                        </button>
                    )}
                </div>

                {google.oauth?.connected ? (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900">
                        <div><strong>Signed in as:</strong> <span className="font-mono">{google.oauth.userEmail || '—'}</span></div>
                        <div><strong>Connected at:</strong> {google.oauth.connectedAt ? new Date(google.oauth.connectedAt).toLocaleString() : '—'}</div>
                    </div>
                ) : null}
            </Card>

            <Card title="Search Console + Analytics property" subtitle="Pick the property to pull data from. After connecting Google these come from your account automatically.">
                {google.oauth?.connected && propsLoading ? <p className="text-xs text-gray-500">Loading your Google properties…</p> : null}
                {propsError ? <p className="text-xs text-red-600">{propsError}</p> : null}

                <Field label="Search Console site" hint="URL-prefix or sc-domain entries.">
                    {google.oauth?.connected && gscSites.length > 0 ? (
                        <select value={google.searchConsole?.siteUrl || ''}
                            onChange={e => setGoogle(g => ({ ...g, searchConsole: { ...g.searchConsole, siteUrl: e.target.value } }))}
                            className={inputCls}>
                            <option value="">— Select a property —</option>
                            {gscSites.map(s => <option key={s.siteUrl} value={s.siteUrl}>{s.siteUrl}{s.permission ? ` (${s.permission})` : ''}</option>)}
                        </select>
                    ) : (
                        <input type="text" value={google.searchConsole?.siteUrl || ''}
                            onChange={e => setGoogle(g => ({ ...g, searchConsole: { ...g.searchConsole, siteUrl: e.target.value } }))}
                            className={inputCls} placeholder="https://example.com/" />
                    )}
                </Field>

                <Field label="GA4 Property" hint="Pick from your properties — we read the numeric ID for you.">
                    {google.oauth?.connected && gaProperties.length > 0 ? (
                        <select value={google.analytics?.propertyId || ''}
                            onChange={e => setGoogle(g => ({ ...g, analytics: { ...g.analytics, propertyId: e.target.value } }))}
                            className={inputCls}>
                            <option value="">— Select a property —</option>
                            {gaProperties.map(p => (
                                <option key={p.propertyId} value={p.propertyId}>
                                    {p.parent ? `${p.parent} · ` : ''}{p.displayName} ({p.propertyId})
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input type="text" value={google.analytics?.propertyId || ''}
                            onChange={e => setGoogle(g => ({ ...g, analytics: { ...g.analytics, propertyId: e.target.value } }))}
                            className={inputCls} placeholder="123456789" />
                    )}
                </Field>

                <div className="flex items-center gap-3 pt-2">
                    <button type="button" onClick={saveGoogle} disabled={savingGoogle} className={btnPrimaryCls}>
                        {savingGoogle ? 'Saving…' : 'Save Google Settings'}
                    </button>
                    <button type="button" onClick={testConnection} disabled={testing || (!saConfigured && !google.oauth?.connected)} className={btnGhostCls}>
                        {testing ? 'Testing…' : 'Test connection'}
                    </button>
                </div>

                {testResult ? (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <TestRow label="Credentials" r={testResult.data?.serviceAccount} />
                        <TestRow label="Indexing API" r={testResult.data?.indexing} />
                        <TestRow label="Search Console" r={testResult.data?.searchConsole} />
                        <TestRow label="Google Analytics 4" r={testResult.data?.analytics} />
                    </div>
                ) : null}
            </Card>

            <Card title="Service Account (alternative)" subtitle="Headless option — needs manual GSC/GA4 sharing with the SA email.">
                <div className="flex items-start justify-between mb-3">
                    <p className="text-xs text-gray-500">
                        Add <code className="font-mono break-all">{google.serviceAccount?.client_email || 'the-service-account-email'}</code> as <strong>Owner</strong> in Search Console and <strong>Viewer</strong> on GA4.
                    </p>
                    <Badge ok={saConfigured} okLabel="Configured" />
                </div>

                {saConfigured ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-900 mb-3">
                        <div><strong>Account:</strong> <span className="font-mono break-all">{google.serviceAccount?.client_email}</span></div>
                        <div><strong>Project:</strong> {google.serviceAccount?.project_id || '—'}</div>
                        <button type="button" onClick={removeServiceAccount} className="mt-2 text-red-700 hover:underline font-semibold inline-flex items-center gap-1">
                            <MdRemoveCircle size={14} /> Remove credentials
                        </button>
                    </div>
                ) : null}

                <label className="block text-xs font-semibold text-gray-700 mb-1">{saConfigured ? 'Replace Service Account JSON (optional)' : 'Paste Service Account JSON'}</label>
                <textarea rows={6} value={serviceAccountJson} onChange={e => setServiceAccountJson(e.target.value)}
                    placeholder={`{\n  "type": "service_account",\n  "client_email": "...@...iam.gserviceaccount.com",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",\n  ...\n}`}
                    className={inputCls + ' font-mono text-xs'} />
            </Card>
        </div>
    );
}

function HistoryTab({ history, loading, target, setTarget, page, setPage, totalPages, reload, clearAll }) {
    return (
        <div className="bg-white shadow-md rounded-xl">
            <div className="px-5 py-4 flex flex-wrap items-center gap-3 border-b border-gray-100">
                <div className="flex-1 min-w-[220px]">
                    <h2 className="text-base font-bold text-gray-800">Submission history</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Every auto-ping (on publish/edit) and manual submit is logged here.</p>
                </div>
                <select value={target} onChange={e => setTarget(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-800 focus:outline-none focus:border-gold">
                    <option value="all">All targets</option>
                    <option value="google">Google Indexing API</option>
                    <option value="indexnow">IndexNow (Bing/Yandex)</option>
                </select>
                <button type="button" onClick={reload} className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1">
                    <MdRefresh size={14} /> Refresh
                </button>
                <button type="button" onClick={clearAll} className="px-3 py-2 border border-red-300 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-50 inline-flex items-center gap-1">
                    <MdDelete size={14} /> Clear all
                </button>
            </div>

            {loading ? (
                <p className="p-6 text-sm text-gray-500">Loading…</p>
            ) : history.rows.length === 0 ? (
                <p className="p-6 text-sm text-gray-400 italic">No submissions yet. Publish a post or use the Submit URLs tab.</p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                                <tr>
                                    <th className="py-2 px-4">When</th>
                                    <th className="py-2 px-4">URL</th>
                                    <th className="py-2 px-4">Target</th>
                                    <th className="py-2 px-4">Source</th>
                                    <th className="py-2 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {history.rows.map(r => (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 text-xs text-gray-500 whitespace-nowrap">
                                            {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'}
                                        </td>
                                        <td className="py-2 px-4 text-xs text-gray-800 font-mono break-all max-w-[400px]">{r.url}</td>
                                        <td className="py-2 px-4 text-xs">
                                            <span className={`px-2 py-0.5 rounded font-semibold ${r.target === 'google' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {r.target}
                                            </span>
                                        </td>
                                        <td className="py-2 px-4 text-xs text-gray-500">{r.source || 'auto'}</td>
                                        <td className="py-2 px-4 text-xs">
                                            {r.status === 'ok' ? (
                                                <span className="inline-flex items-center gap-1 text-emerald-700">
                                                    <MdCheckCircle size={14} /> ok{r.statusCode ? ` (${r.statusCode})` : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-700" title={r.message || ''}>
                                                    <MdError size={14} /> {r.message ? r.message.slice(0, 80) : 'error'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Page {history.page} of {totalPages} · {history.total} total</span>
                        <div className="flex gap-2">
                            <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-40">Prev</button>
                            <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 disabled:opacity-40">Next</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatsTab({ lookupUrl, setLookupUrl, lookupStats, lookupLoading, stats, googleReady }) {
    return (
        <Card title="URL real-data lookup" subtitle="Combined Google Indexing metadata + Search Console (clicks/impressions) + GA4 (pageviews) — last 28 days.">
            <div className="flex gap-2">
                <input type="text" value={lookupUrl} onChange={e => setLookupUrl(e.target.value)}
                    placeholder="/blog/some-post or https://example.com/about"
                    className={inputCls + ' font-mono'} />
                <button type="button" onClick={lookupStats} disabled={lookupLoading || !googleReady} className={btnPrimaryCls + ' inline-flex items-center gap-1.5'}>
                    <MdSearch size={16} /> {lookupLoading ? 'Fetching…' : 'Fetch'}
                </button>
            </div>

            {!googleReady ? (
                <p className="text-[11px] text-gray-400 mt-3 inline-flex items-center gap-1">
                    <MdHelpOutline size={14} /> Connect with Google (Settings tab) to enable real-data lookups.
                </p>
            ) : null}

            {stats ? <StatsPanel stats={stats} /> : null}
        </Card>
    );
}

// ============================================================================
// Shared bits
// ============================================================================

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 bg-white focus:outline-none focus:border-gold';
const btnPrimaryCls = 'px-4 py-2 bg-gold text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition';
const btnGhostCls = 'px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50';

function Card({ title, subtitle, children }) {
    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-base font-bold text-gray-800">{title}</h3>
            {subtitle ? <p className="text-xs text-gray-500 mt-0.5 mb-4">{subtitle}</p> : <div className="mb-4" />}
            <div className="space-y-3">{children}</div>
        </div>
    );
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
function Badge({ ok, okLabel }) {
    return (
        <span className={`text-[11px] font-bold px-2 py-1 rounded ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
            {ok ? okLabel : 'Not set'}
        </span>
    );
}
function TestRow({ label, r }) {
    if (!r) return null;
    const tone = r.ok ? 'text-emerald-700 bg-emerald-50' : r.skipped ? 'text-gray-500 bg-gray-50' : 'text-red-700 bg-red-50';
    const icon = r.ok ? <MdCheckCircle size={16} /> : r.skipped ? <MdRemoveCircle size={16} /> : <MdError size={16} />;
    return (
        <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${tone}`}>
            {icon}
            <div className="flex-1">
                <div className="font-semibold">{label}</div>
                <div className="text-[11px] opacity-80">{r.skipped ? 'Skipped (not configured)' : r.ok ? 'OK' : r.error}</div>
            </div>
        </div>
    );
}
function SubmitRow({ label, ok, detail }) {
    return (
        <div className={`p-3 rounded-lg ${ok ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
            <div className="font-semibold inline-flex items-center gap-1">
                {ok ? <MdCheckCircle size={14} /> : <MdError size={14} />} {label}
            </div>
            <div className="text-[11px] opacity-80 mt-0.5">{detail}</div>
        </div>
    );
}
function fmt(n) {
    if (n == null) return '—';
    if (typeof n !== 'number') return String(n);
    return n >= 1000 ? n.toLocaleString() : String(n);
}
function StatsPanel({ stats }) {
    if (!stats?.success) return <p className="text-xs text-red-600 mt-3">{stats?.error || 'Lookup failed'}</p>;
    const idx = stats.indexing || {};
    const gsc = stats.searchConsole || {};
    const tq = stats.topQueries || {};
    const ga = stats.analytics || {};
    return (
        <div className="mt-4 space-y-3">
            <div className="text-[11px] text-gray-500 break-all">URL: <span className="font-mono">{stats.url}</span> · last {stats.days} days</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Mini label="Google Indexing">
                    {idx.error ? <Err msg={idx.error} /> : (
                        <>
                            <KV k="Last Update" v={idx.latestUpdate?.notifyTime ? new Date(idx.latestUpdate.notifyTime).toLocaleString() : '—'} />
                            <KV k="Notify Type" v={idx.latestUpdate?.type || '—'} />
                            <KV k="Last Removed" v={idx.latestRemove?.notifyTime ? new Date(idx.latestRemove.notifyTime).toLocaleString() : '—'} />
                        </>
                    )}
                </Mini>
                <Mini label="Search Console">
                    {!gsc.ok ? <Err msg={gsc.error} /> : (
                        <>
                            <KV k="Clicks" v={fmt(gsc.clicks)} />
                            <KV k="Impressions" v={fmt(gsc.impressions)} />
                            <KV k="CTR" v={gsc.ctr ? (gsc.ctr * 100).toFixed(2) + '%' : '—'} />
                            <KV k="Avg position" v={gsc.position ? gsc.position.toFixed(1) : '—'} />
                        </>
                    )}
                </Mini>
                <Mini label="Analytics 4">
                    {!ga.ok ? <Err msg={ga.error} /> : (
                        <>
                            <KV k="Pageviews" v={fmt(ga.pageviews)} />
                            <KV k="Users" v={fmt(ga.users)} />
                            <KV k="Sessions" v={fmt(ga.sessions)} />
                            <KV k="Avg session" v={ga.avgSessionDuration ? Math.round(ga.avgSessionDuration) + 's' : '—'} />
                        </>
                    )}
                </Mini>
            </div>
            {tq?.ok && tq.rows?.length ? (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Top queries (Search Console)</div>
                    <table className="w-full text-xs">
                        <thead className="text-gray-500">
                            <tr><th className="text-left">Query</th><th className="text-right">Clicks</th><th className="text-right">Impr.</th><th className="text-right">Pos.</th></tr>
                        </thead>
                        <tbody>
                            {tq.rows.map((r, i) => (
                                <tr key={i} className="border-t border-gray-100">
                                    <td className="py-1 pr-2 text-gray-800">{r.query}</td>
                                    <td className="py-1 pr-2 text-right text-emerald-700">{fmt(r.clicks)}</td>
                                    <td className="py-1 pr-2 text-right text-gray-700">{fmt(r.impressions)}</td>
                                    <td className="py-1 text-right text-gray-700">{r.position ? r.position.toFixed(1) : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    );
}
function Mini({ label, children }) {
    return (
        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">{label}</div>
            <div className="space-y-1">{children}</div>
        </div>
    );
}
function KV({ k, v }) {
    return (
        <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{k}</span>
            <span className="text-gray-800 font-semibold">{v}</span>
        </div>
    );
}
function Err({ msg }) {
    return <p className="text-[11px] text-red-600">{msg || 'Not available'}</p>;
}
