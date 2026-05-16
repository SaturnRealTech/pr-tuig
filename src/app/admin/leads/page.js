'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MdInbox, MdPhone, MdEmail, MdDelete, MdSearch, MdRefresh } from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    closed: 'bg-green-100 text-green-700',
};

export default function LeadsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchLeads();
    }, [router]);

    const fetchLeads = async (q = '', status = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: '100' });
            if (q) params.set('search', q);
            if (status) params.set('status', status);
            const res = await fetch(`/api/leads?${params}`);
            const data = await res.json();
            if (data.success) {
                setLeads(data.data);
                setTotal(data.total || data.data.length);
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

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                                <MdInbox className="text-[#b27e02]" /> Leads
                            </h1>
                            <p className="text-gray-500 mt-1">{total} total enquiries received</p>
                        </div>
                        <button onClick={() => fetchLeads(search, statusFilter)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition text-sm font-semibold">
                            <MdRefresh size={18} /> Refresh
                        </button>
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
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#b27e02]"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={handleStatusFilter}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#b27e02] text-gray-700"
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
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#b27e02] mx-auto" />
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
                                                    className="flex items-center gap-1.5 text-[#b27e02] hover:underline font-medium">
                                                    <MdPhone size={14} /> {lead.mobileNumber}
                                                </a>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 hidden md:table-cell">
                                                {lead.email ? (
                                                    <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-[#b27e02]">
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
