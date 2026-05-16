'use client';

import { useState, useEffect } from 'react';
import { MdDelete, MdSearch, MdChevronLeft, MdChevronRight, MdOpenInNew, MdFilterList } from 'react-icons/md';
import Link from 'next/link';
import Swal from 'sweetalert2';

export default function AdminApplications() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });

    useEffect(() => {
        fetchApplications();
    }, [pagination.page, search, statusFilter]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            let url = `/api/applications?page=${pagination.page}&limit=${pagination.limit}&search=${search}`;
            if (statusFilter) url += `&status=${statusFilter}`;

            const response = await fetch(url);
            const result = await response.json();
            if (result.success) {
                setApplications(result.data);
                setPagination(prev => ({
                    ...prev,
                    ...result.pagination
                }));
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        fetchApplications();
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(applications.map(a => a._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This will permanently delete this application.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
                const data = await response.json();

                if (data.success) {
                    Swal.fire('Deleted!', 'Application has been deleted.', 'success');
                    fetchApplications();
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                Swal.fire('Error!', error.message, 'error');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            Swal.fire('Warning', 'Please select applications to delete', 'warning');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `This will permanently delete ${selectedIds.length} application(s).`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete them!'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch('/api/applications', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedIds })
                });
                const data = await response.json();

                if (data.success) {
                    Swal.fire('Deleted!', `${data.deletedCount} application(s) have been deleted.`, 'success');
                    setSelectedIds([]);
                    fetchApplications();
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                Swal.fire('Error!', error.message, 'error');
            }
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const response = await fetch(`/api/applications/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();

            if (data.success) {
                fetchApplications();
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'new': 'bg-blue-100 text-blue-800',
            'reviewed': 'bg-yellow-100 text-yellow-800',
            'shortlisted': 'bg-green-100 text-green-800',
            'rejected': 'bg-[#faf0d0] text-[#6b4a01]',
            'hired': 'bg-purple-100 text-purple-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const viewApplicationDetails = (app) => {
        Swal.fire({
            title: `Application from ${app.name}`,
            html: `
                <div class="text-left space-y-3">
                    <p><strong>Position:</strong> ${app.jobTitle}</p>
                    <p><strong>Email:</strong> <a href="mailto:${app.email}" class="text-blue-600">${app.email}</a></p>
                    <p><strong>Phone:</strong> <a href="tel:${app.phone}" class="text-blue-600">${app.phone}</a></p>
                    ${app.linkedIn ? `<p><strong>LinkedIn:</strong> <a href="${app.linkedIn}" target="_blank" class="text-blue-600">${app.linkedIn}</a></p>` : ''}
                    ${app.currentPosition ? `<p><strong>Current Position:</strong> ${app.currentPosition}</p>` : ''}
                    <p><strong>Experience:</strong> ${app.experience}</p>
                    ${app.portfolio ? `<p><strong>Portfolio:</strong> <a href="${app.portfolio}" target="_blank" class="text-blue-600">${app.portfolio}</a></p>` : ''}
                    <p><strong>Resume:</strong> <a href="${app.resumeUrl}" target="_blank" class="text-[#b27e02] font-medium">Download Resume</a></p>
                    <hr class="my-4">
                    <p><strong>Cover Letter:</strong></p>
                    <p class="text-gray-600 text-sm whitespace-pre-wrap">${app.coverLetter}</p>
                </div>
            `,
            width: 600,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Close'
        });
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
                        <Link href="/admin/careers" className="bg-[#b27e02] text-white px-4 py-2 rounded-lg hover:bg-[#8a6002] transition">
                            Manage Positions
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search & Filter Bar */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative">
                                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                                    <input
                                        type="text"
                                        placeholder="Search applicants..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b27e02]/20 focus:border-[#b27e02] outline-none text-gray-900 bg-white placeholder-gray-500"
                                    />
                                </div>
                                <button type="submit" className="bg-[#b27e02] text-white px-4 py-2 rounded-lg hover:bg-[#8a6002] transition">
                                    Search
                                </button>
                            </form>

                            <div className="flex items-center gap-2">
                                <MdFilterList className="text-gray-400 text-xl" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setPagination(prev => ({ ...prev, page: 1 }));
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#b27e02]/20 focus:border-[#b27e02] outline-none text-gray-900 bg-white"
                                >
                                    <option value="">All Status</option>
                                    <option value="new">New</option>
                                    <option value="reviewed">Reviewed</option>
                                    <option value="shortlisted">Shortlisted</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="hired">Hired</option>
                                </select>
                            </div>
                        </div>

                        {selectedIds.length > 0 && user?.role === 'admin' && (
                            <button
                                onClick={handleBulkDelete}
                                className="bg-[#b27e02] text-white px-4 py-2 rounded-lg hover:bg-[#8a6002] transition flex items-center gap-2"
                            >
                                <MdDelete className="text-xl" />
                                Delete Selected ({selectedIds.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            checked={selectedIds.length === applications.length && applications.length > 0}
                                            className="rounded border-gray-300 text-[#b27e02] focus:ring-[#c99010]"
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#b27e02] mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : applications.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            No applications found
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(app._id)}
                                                    onChange={() => handleSelectOne(app._id)}
                                                    className="rounded border-gray-300 text-[#b27e02] focus:ring-[#c99010]"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{app.name}</div>
                                                <div className="text-sm text-gray-500">{app.email}</div>
                                                <div className="text-sm text-gray-500">{app.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{app.jobTitle}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {app.experience || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => updateStatus(app._id, e.target.value)}
                                                    className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(app.status)}`}
                                                >
                                                    <option value="new">New</option>
                                                    <option value="reviewed">Reviewed</option>
                                                    <option value="shortlisted">Shortlisted</option>
                                                    <option value="rejected">Rejected</option>
                                                    <option value="hired">Hired</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(app.appliedAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button
                                                    onClick={() => viewApplicationDetails(app)}
                                                    className="text-blue-600 hover:text-blue-900 p-1"
                                                    title="View Details"
                                                >
                                                    <MdOpenInNew className="text-xl" />
                                                </button>
                                                <a
                                                    href={app.resumeUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-900 p-1 inline-block"
                                                    title="Download Resume"
                                                >
                                                    📄
                                                </a>
                                                {user?.role === 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(app._id)}
                                                    className="text-[#b27e02] hover:text-[#4a3800] p-1"
                                                    title="Delete"
                                                >
                                                    <MdDelete className="text-xl" />
                                                </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
                                    >
                                        <MdChevronLeft className="text-xl" />
                                    </button>
                                    <span className="px-3 py-1 text-gray-700">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-1 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700"
                                    >
                                        <MdChevronRight className="text-xl" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back Link */}
                <div className="mt-6">
                    <Link href="/admin/dashboard" className="text-[#b27e02] hover:text-[#8a6002] font-medium">
                        ← Back to Dashboard
                    </Link>
                </div>
            </main>
        </div>
    );
}
