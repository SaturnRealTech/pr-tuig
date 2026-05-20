'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MdSave } from 'react-icons/md';
import AdminSidebar from '@/components/AdminSidebar';
import Swal from 'sweetalert2';

const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), {
    ssr: false,
    loading: () => <p className="text-gray-400 py-6 text-center">Loading editor...</p>,
});

export default function HomeContentPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) { router.push('/admin/login'); return; }
        setUser(JSON.parse(userData));
        fetchContent();
    }, [router]);

    const fetchContent = async () => {
        try {
            const res = await fetch('/api/home-content');
            const data = await res.json();
            if (data.success) {
                setTitle(data.data.homeWriteupTitle || '');
                setContent(data.data.homeWriteup || '');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/home-content', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ homeWriteupTitle: title, homeWriteup: content }),
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ icon: 'success', title: 'Saved!', text: 'Homepage writeup updated.', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire('Error', data.error, 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <AdminSidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            {/* Main */}
            <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Homepage Writeup</h1>
                            <p className="text-gray-500 mt-1">This section appears on the homepage after the Builders section</p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            className="flex items-center gap-2 px-6 py-3 bg-gold text-white font-semibold rounded-lg hover:bg-gold transition disabled:opacity-50"
                        >
                            <MdSave size={18} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-400">Loading...</div>
                    ) : (
                        <div className="space-y-6 max-w-4xl">
                            {/* Section Title */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Section Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gold focus:ring-2 focus:ring-cream text-gray-900"
                                    placeholder="e.g. Why Choose Saturn RealCon?"
                                />
                                <p className="text-xs text-gray-400 mt-1">Leave empty to hide the title</p>
                            </div>

                            {/* Content Editor */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-4">Content</label>
                                <TipTapEditor
                                    content={content}
                                    onChange={setContent}
                                />
                            </div>

                            {/* Preview hint */}
                            {(title || content) && (
                                <div className="bg-cream border border-gold/30 rounded-xl p-4 text-sm text-gold">
                                    <strong>Preview:</strong> This content will appear on the homepage between the Builders section and the footer.
                                    Visit <a href="/" target="_blank" className="underline font-semibold">the homepage</a> after saving to see it live.
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-gold to-gold text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
                                >
                                    <MdSave size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
