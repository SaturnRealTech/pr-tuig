'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MdSave, MdCookie } from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import RichTextEditor from '@/components/RichTextEditor';
import Swal from 'sweetalert2';

export default function CookiePolicyAdmin() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/admin/login');
            return;
        }
        setUser(JSON.parse(userData));
        fetchCookies();
    }, [router]);

    const fetchCookies = async () => {
        try {
            const res = await fetch('/api/cookies');
            const result = await res.json();
            if (result.success && result.data) {
                setTitle(result.data.title || '');
                setContent(result.data.content || '');
            }
        } catch (error) {
            console.error('Error fetching cookie policy:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/cookies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content }),
            });
            const result = await res.json();
            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Saved!',
                    text: 'Cookie Policy has been updated successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                Swal.fire('Error', result.error || 'Failed to save', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to save cookie policy', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                <MdCookie className="text-gold" size={32} />
                                Cookie Policy
                            </h1>
                            <p className="text-gray-600 mt-1">Edit the cookie policy page title and content</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gold text-white rounded-lg hover:bg-gold transition font-semibold disabled:opacity-60"
                        >
                            <MdSave size={20} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-gray-400 text-center py-20">Loading...</div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Page Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Cookie Policy"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900 text-lg"
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave blank to use the default title "Cookie Policy"</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Page Content
                                </label>
                                <RichTextEditor
                                    value={content}
                                    onChange={setContent}
                                    placeholder="Write your cookie policy content here..."
                                />
                            </div>

                            <div className="flex justify-end pb-8">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gold text-white rounded-lg hover:bg-gold transition font-semibold disabled:opacity-60"
                                >
                                    <MdSave size={20} />
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
