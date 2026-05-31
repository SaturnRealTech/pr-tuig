'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdDelete,
    MdPerson,
    MdEmail,
    MdAdminPanelSettings,
    MdClose,
    MdBlock,
    MdCheckCircle,
} from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

export default function UsersManagement() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [newUserData, setNewUserData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'admin'
    });
    const [creatingUser, setCreatingUser] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/admin/login');
            return;
        }
        const parsedUser = JSON.parse(userData);

        // Only admin can access users management
        if (parsedUser.role !== 'admin') {
            router.push('/admin/dashboard');
            return;
        }

        setUser(parsedUser);
        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/users');
            const result = await response.json();
            if (result.success) {
                setUsers(result.data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId, userName) => {
        const result = await Swal.fire({
            title: 'Delete User?',
            text: `Are you sure you want to delete ${userName}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/api/users?id=${userId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'User has been deleted successfully',
                    timer: 2000,
                    showConfirmButton: false,
                });
                fetchUsers();
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error || 'Failed to delete user',
                    confirmButtonColor: '#dc2626',
                });
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while deleting the user',
                confirmButtonColor: '#dc2626',
            });
        }
    };


    const handleToggleDisabled = async (userId, userName, makeDisabled) => {
        const result = await Swal.fire({
            title: makeDisabled ? `Disable ${userName}?` : `Enable ${userName}?`,
            text: makeDisabled
                ? 'This user will no longer be able to log in until re-enabled.'
                : 'This user will be able to log in again.',
            icon: makeDisabled ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: makeDisabled ? '#dc2626' : '#16a34a',
            cancelButtonColor: '#6b7280',
            confirmButtonText: makeDisabled ? 'Yes, disable' : 'Yes, enable',
        });
        if (!result.isConfirmed) return;

        try {
            const response = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, disabled: makeDisabled }),
            });
            const data = await response.json();
            if (data.success) {
                await Swal.fire({
                    icon: 'success',
                    title: makeDisabled ? 'Disabled' : 'Enabled',
                    text: data.message,
                    timer: 1800,
                    showConfirmButton: false,
                });
                fetchUsers();
            } else {
                await Swal.fire({ icon: 'error', title: 'Error', text: data.error || 'Failed to update user', confirmButtonColor: '#dc2626' });
            }
        } catch (error) {
            console.error('Error toggling disabled:', error);
            await Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred while updating the user', confirmButtonColor: '#dc2626' });
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreatingUser(true);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserData),
            });

            const result = await response.json();

            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'User Created!',
                    text: `${newUserData.name} has been added successfully`,
                    timer: 2000,
                    showConfirmButton: false,
                });
                setShowAddUserModal(false);
                setNewUserData({ name: '', email: '', password: '', role: 'admin' });
                fetchUsers();
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.error || 'Failed to create user',
                    confirmButtonColor: '#dc2626',
                });
            }
        } catch (error) {
            console.error('Error creating user:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred while creating the user',
                confirmButtonColor: '#dc2626',
            });
        } finally {
            setCreatingUser(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main Content */}
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Users Management</h1>
                            <p className="text-gray-600">View and manage all registered users</p>
                        </div>
                        <button
                            onClick={() => setShowAddUserModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold transition"
                        >
                            <MdPerson size={20} />
                            Add New User
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">⏳</div>
                            <p className="text-xl text-gray-600">Loading users...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                            <MdAdminPanelSettings className="text-6xl text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No users found</h3>
                            <p className="text-gray-600">Registered users will appear here</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Role</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joined</th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Last Login</th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {users.map((userData) => (
                                            <tr key={userData._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white font-bold">
                                                            {userData.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="font-semibold text-gray-800">{userData.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a
                                                        href={`mailto:${userData.email}`}
                                                        className="text-blue-600 hover:underline flex items-center gap-2"
                                                    >
                                                        <MdEmail /> {userData.email}
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${userData.role === 'editor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                        {userData.role || 'admin'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {userData.disabled ? (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                                            <MdBlock size={14} /> Disabled
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                                            <MdCheckCircle size={14} /> Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {userData.createdAt
                                                        ? new Date(userData.createdAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })
                                                        : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 text-sm">
                                                    {userData.lastLoginAt ? (
                                                        <div>
                                                            <div className="font-medium">
                                                                {new Date(userData.lastLoginAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(userData.lastLoginAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                                {userData.lastLoginIp ? ` · ${userData.lastLoginIp}` : ''}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic">Never</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {user?.role === 'admin' && String(userData._id) !== String(user.id) && (
                                                            <button
                                                                onClick={() => handleToggleDisabled(userData._id, userData.name, !userData.disabled)}
                                                                className={`p-2 rounded-lg transition ${userData.disabled ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                                                                title={userData.disabled ? 'Enable User' : 'Disable User'}
                                                            >
                                                                {userData.disabled ? <MdCheckCircle size={20} /> : <MdBlock size={20} />}
                                                            </button>
                                                        )}
                                                        {user?.role === 'admin' && (
                                                        <button
                                                            onClick={() => handleDelete(userData._id, userData.name)}
                                                            className="p-2 text-gold hover:bg-cream rounded-lg transition"
                                                            title="Delete User"
                                                        >
                                                            <MdDelete size={20} />
                                                        </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Add User Modal */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
                            <button
                                onClick={() => setShowAddUserModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <MdClose size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={newUserData.name}
                                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    value={newUserData.email}
                                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="john@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    value={newUserData.password}
                                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="Minimum 6 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Role
                                </label>
                                <select
                                    value={newUserData.role}
                                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddUserModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingUser}
                                    className="flex-1 px-4 py-3 bg-gold text-white rounded-lg hover:bg-gold transition font-semibold disabled:opacity-50"
                                >
                                    {creatingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
