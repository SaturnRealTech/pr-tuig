'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MdInbox, MdPhone, MdEmail, MdDelete, MdSearch, MdRefresh, MdLock, MdLockOpen, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-green-100 text-green-700',
};

// --- Browser-side crypto (mirrors src/lib/leadsLock.js) ----------------------
//
// PBKDF2-SHA256 (100k iters, 32-byte key) → AES-GCM decrypt. The password
// never touches sessionStorage / localStorage; it lives in a useRef so it
// stays in JS memory only and dies when the tab closes.
function b64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

async function deriveBrowserKey(password, saltB64) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: b64ToBytes(saltB64), iterations: 100_000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt'],
    );
}

async function decryptPayload(key, ivB64, ctB64) {
    const ctWithTag = b64ToBytes(ctB64);
    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64ToBytes(ivB64) },
        key,
        ctWithTag,
    );
    return new TextDecoder().decode(plaintext);
}

export default function LeadsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [total, setTotal] = useState(0);

    // Vault state: 'checking' → 'open' (no password configured) | 'locked' | 'unlocked'
    const [vaultState, setVaultState] = useState('checking');
    const [unlockPassword, setUnlockPassword] = useState('');
    const [showUnlockPassword, setShowUnlockPassword] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [unlockError, setUnlockError] = useState('');

    // Change-password panel on the lock screen.
    const [changeMode, setChangeMode] = useState(false);
    const [cpOld, setCpOld] = useState('');
    const [cpNew, setCpNew] = useState('');
    const [cpConfirm, setCpConfirm] = useState('');
    const [cpShow, setCpShow] = useState(false);
    const [cpSaving, setCpSaving] = useState(false);
    const [cpError, setCpError] = useState('');
    const [cpSuccess, setCpSuccess] = useState('');

    // Holds the derived AES key + raw password while the tab is open. Refs
    // are intentional — never write secrets to localStorage / sessionStorage.
    const keyRef = useRef(null);
    const passwordRef = useRef('');
    const saltRef = useRef('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        checkVaultStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // On mount: ask the server whether the vault is configured + whether the
    // browser already holds a valid unlock cookie.
    const checkVaultStatus = async () => {
        try {
            const res = await fetch('/api/leads/unlock');
            const j = await res.json();
            if (!j.configured) {
                // Legacy / not-yet-configured: behave like before.
                setVaultState('open');
                fetchLeads();
                return;
            }
            if (j.unlocked && j.salt) {
                // Cookie still valid server-side but the browser doesn't have
                // the key in memory (reload). We have to prompt for the
                // password again to derive it — only the server knows the
                // session, and only the password (kept in memory) can decrypt.
                saltRef.current = j.salt;
                setVaultState('locked');
                setUnlockError('Tab reloaded — re-enter password to decrypt leads.');
                return;
            }
            setVaultState('locked');
        } catch (e) {
            console.error('vault status check failed', e);
            setVaultState('locked');
        }
    };

    const handleUnlock = async (e) => {
        e?.preventDefault?.();
        setUnlockError('');
        if (!unlockPassword) return;
        setUnlocking(true);
        try {
            const res = await fetch('/api/leads/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: unlockPassword }),
            });
            const j = await res.json();
            if (!j.success) {
                setUnlockError(j.error || 'Unlock failed');
                return;
            }
            // Derive the AES key in the browser so we can decrypt the
            // upcoming encrypted /api/leads response.
            passwordRef.current = unlockPassword;
            saltRef.current = j.salt;
            keyRef.current = await deriveBrowserKey(unlockPassword, j.salt);
            setUnlockPassword('');
            setVaultState('unlocked');
            fetchLeads();
        } catch (err) {
            setUnlockError(err.message || 'Unlock failed');
        } finally { setUnlocking(false); }
    };

    const handleChangePassword = async (e) => {
        e?.preventDefault?.();
        setCpError(''); setCpSuccess('');
        if (!cpOld) { setCpError('Enter the current password.'); return; }
        if (!cpNew || cpNew.length < 6) { setCpError('New password must be at least 6 characters.'); return; }
        if (cpNew !== cpConfirm) { setCpError('New password and confirmation do not match.'); return; }
        if (cpOld === cpNew) { setCpError('New password must differ from the old one.'); return; }
        setCpSaving(true);
        try {
            const res = await fetch('/api/leads/unlock/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldPassword: cpOld, newPassword: cpNew }),
            });
            const j = await res.json();
            if (!j.success) { setCpError(j.error || 'Failed to change password'); return; }
            // Rotated. The new password is what unlocks from here on, so reset
            // local state and let the admin type it into the unlock form.
            setCpOld(''); setCpNew(''); setCpConfirm('');
            setCpSuccess('Password updated. Use the new password to unlock.');
            setChangeMode(false);
            setUnlockError('');
        } catch (err) {
            setCpError(err.message || 'Failed to change password');
        } finally { setCpSaving(false); }
    };

    const handleLock = async () => {
        try {
            await fetch('/api/leads/unlock', { method: 'DELETE' });
        } catch { /* ignore */ }
        keyRef.current = null;
        passwordRef.current = '';
        saltRef.current = '';
        setLeads([]);
        setTotal(0);
        setVaultState('locked');
        setUnlockError('');
    };

    const fetchLeads = async (q = '', status = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (q) params.set('search', q);
            if (status) params.set('status', status);
            const res = await fetch(`/api/leads?${params}`);
            // Locked or expired → fall back to unlock screen
            if (res.status === 401) {
                const j = await res.json().catch(() => ({}));
                if (j.locked) {
                    keyRef.current = null;
                    setVaultState('locked');
                    setUnlockError('Session expired — unlock again.');
                    return;
                }
            }
            const data = await res.json();
            if (data.success) {
                if (data.encrypted) {
                    // E2E: only ciphertext crossed the wire. Decrypt locally.
                    if (!keyRef.current) {
                        setUnlockError('Key unavailable — please unlock again.');
                        setVaultState('locked');
                        return;
                    }
                    const plain = await decryptPayload(keyRef.current, data.iv, data.ct);
                    const parsed = JSON.parse(plain);
                    setLeads(parsed.data || []);
                    setTotal(parsed.total ?? parsed.data?.length ?? 0);
                } else {
                    setLeads(data.data);
                    setTotal(data.total || data.data.length);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearch(val);
        fetchLeads(val, statusFilter);
    };

    const handleStatusFilter = (e) => {
        const val = e.target.value;
        setStatusFilter(val);
        fetchLeads(search, val);
    };

    const handleStatusChange = async (id, newStatus) => {
        await fetch(`/api/leads/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        fetchLeads(search, statusFilter);
    };

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: 'Delete Lead?',
            text: `Delete lead from ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete',
        });
        if (!result.isConfirmed) return;
        await fetch(`/api/leads/${id}`, { method: 'DELETE' });
        fetchLeads(search, statusFilter);
    };

    if (!user) return null;

    if (vaultState === 'checking') {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                    <div className="p-12 text-center text-gray-400 text-sm">Checking vault status…</div>
                </main>
            </div>
        );
    }

    if (vaultState === 'locked') {
        return (
            <div className="min-h-screen bg-gray-50 flex">
                <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                    <div className="max-w-md mx-auto mt-24 px-6">
                        <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                                    <MdLock size={26} className="text-amber-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-800">Leads Vault Locked</h1>
                                    <p className="text-xs text-gray-500">Enter the leads password to view enquiries.</p>
                                </div>
                            </div>

                            {!changeMode ? (
                                <>
                                    <form onSubmit={handleUnlock} className="mt-5 space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showUnlockPassword ? 'text' : 'password'}
                                                    value={unlockPassword}
                                                    onChange={e => setUnlockPassword(e.target.value)}
                                                    autoFocus
                                                    autoComplete="current-password"
                                                    className="w-full pr-10 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500"
                                                />
                                                <button type="button" onClick={() => setShowUnlockPassword(s => !s)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                                                    aria-label="Toggle visibility">
                                                    {showUnlockPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        {unlockError ? (
                                            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{unlockError}</p>
                                        ) : null}
                                        {cpSuccess ? (
                                            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">{cpSuccess}</p>
                                        ) : null}
                                        <button type="submit" disabled={unlocking || !unlockPassword}
                                            className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50">
                                            <MdLockOpen size={16} /> {unlocking ? 'Unlocking…' : 'Unlock vault'}
                                        </button>
                                    </form>

                                    <div className="mt-4 flex items-center justify-between text-xs">
                                        {user?.role === 'admin' ? (
                                            <button type="button"
                                                onClick={() => { setChangeMode(true); setCpError(''); setCpSuccess(''); }}
                                                className="text-amber-700 hover:underline font-semibold">
                                                Change password
                                            </button>
                                        ) : <span />}
                                        <span className="text-gray-400">Admin-only access</span>
                                    </div>

                                    <p className="mt-5 text-[11px] text-gray-400 leading-relaxed">
                                        After unlocking, lead data is AES-GCM encrypted end-to-end. The Network tab
                                        will only show ciphertext. The password is never written to disk — it lives in
                                        tab memory only and is cleared when the tab closes.
                                    </p>
                                </>
                            ) : (
                                <form onSubmit={handleChangePassword} className="mt-5 space-y-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Current password</label>
                                        <input
                                            type={cpShow ? 'text' : 'password'}
                                            value={cpOld}
                                            onChange={e => setCpOld(e.target.value)}
                                            autoFocus
                                            autoComplete="current-password"
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">New password</label>
                                        <div className="relative">
                                            <input
                                                type={cpShow ? 'text' : 'password'}
                                                value={cpNew}
                                                onChange={e => setCpNew(e.target.value)}
                                                placeholder="At least 6 characters"
                                                autoComplete="new-password"
                                                className="w-full pr-10 px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500"
                                            />
                                            <button type="button" onClick={() => setCpShow(s => !s)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                                                aria-label="Toggle visibility">
                                                {cpShow ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm new password</label>
                                        <input
                                            type={cpShow ? 'text' : 'password'}
                                            value={cpConfirm}
                                            onChange={e => setCpConfirm(e.target.value)}
                                            autoComplete="new-password"
                                            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                    {cpError ? (
                                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{cpError}</p>
                                    ) : null}
                                    <div className="flex items-center gap-2">
                                        <button type="button"
                                            onClick={() => { setChangeMode(false); setCpError(''); setCpOld(''); setCpNew(''); setCpConfirm(''); }}
                                            className="flex-1 px-3 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={cpSaving || !cpOld || !cpNew || !cpConfirm}
                                            className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-600 text-white px-3 py-2.5 rounded-lg text-sm font-bold hover:bg-amber-700 disabled:opacity-50">
                                            {cpSaving ? 'Saving…' : 'Update password'}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                        Rotating the password destroys every active unlock session — everyone is sent back to this screen and must enter the new password.
                                    </p>
                                </form>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <MdInbox className="text-gold" /> Leads
                                {vaultState === 'unlocked' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                        <MdLockOpen size={11} /> Unlocked · E2E
                                    </span>
                                ) : null}
                            </h1>
                            <p className="text-gray-500 mt-1">{total} total enquiries received</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {vaultState === 'unlocked' ? (
                                <button onClick={handleLock}
                                    className="flex items-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition text-sm font-semibold">
                                    <MdLock size={16} /> Lock
                                </button>
                            ) : null}
                            <button onClick={() => fetchLeads(search, statusFilter)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-semibold">
                                <MdRefresh size={18} /> Refresh
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <div className="relative flex-1 min-w-[200px]">
                            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={handleSearch}
                                placeholder="Search name, mobile, email..."
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={handleStatusFilter}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gold text-gray-700"
                        >
                            <option value="">All Status</option>
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold mx-auto" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
                            <MdInbox size={56} className="text-gray-200 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No leads yet</h3>
                            <p className="text-gray-400 text-sm">When users submit the enquiry form, leads will appear here.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Name</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Mobile</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Email</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Source</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Project</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Date</th>
                                        {user?.role === 'admin' && <th className="px-5 py-3" />}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {leads.map(lead => (
                                        <tr key={lead._id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3 font-semibold text-gray-800">{lead.name}</td>
                                            <td className="px-5 py-3">
                                                <a href={`tel:${lead.mobileNumber}`}
                                                    className="flex items-center gap-1.5 text-gold hover:underline font-medium">
                                                    <MdPhone size={14} /> {lead.mobileNumber}
                                                </a>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                                                {lead.email ? (
                                                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-gold">
                                                        <MdEmail size={14} /> {lead.email}
                                                    </a>
                                                ) : '—'}
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{lead.source || '—'}</td>
                                            <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{lead.project || '—'}</td>
                                            <td className="px-5 py-3">
                                                <select
                                                    value={lead.status || 'new'}
                                                    onChange={e => handleStatusChange(lead._id, e.target.value)}
                                                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${STATUS_COLORS[lead.status || 'new']}`}
                                                >
                                                    <option value="new">New</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="closed">Closed</option>
                                                </select>
                                            </td>
                                            <td className="px-5 py-3 text-gray-400 hidden md:table-cell whitespace-nowrap">
                                                {lead.submittedAt
                                                    ? new Date(lead.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : '—'}
                                            </td>
                                            {user?.role === 'admin' && (
                                                <td className="px-5 py-3">
                                                    <button onClick={() => handleDelete(lead._id, lead.name)}
                                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                        <MdDelete size={16} />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
