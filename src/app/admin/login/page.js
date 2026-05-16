'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MdEmail, MdLock, MdLogin, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import Swal from 'sweetalert2';

export default function AdminLogin() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [siteName, setSiteName] = useState('QwiklyLaunch');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                const result = await response.json();
                if (result.success && result.data.siteName) {
                    setSiteName(result.data.siteName);
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('token', result.token);

                // Show success message
                await Swal.fire({
                    icon: 'success',
                    title: 'Login Successful!',
                    text: 'Welcome back!',
                    timer: 1500,
                    showConfirmButton: false,
                });

                // Redirect to dashboard
                router.push('/admin/dashboard');
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    text: result.error || 'Invalid email or password',
                    confirmButtonColor: '#dc2626',
                });
            }
        } catch (error) {
            console.error('Login error:', error);
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'An error occurred. Please try again.',
                confirmButtonColor: '#dc2626',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#b27e02] to-[#6b4a01] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <div className="text-4xl font-bold mb-2 text-black">
                        {siteName}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
                    <p className="text-gray-600 mt-2">Sign in to manage your content</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-[#fef9e7] border border-[#f0d090] rounded-lg text-[#8a6002] text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} method="POST" action="#" className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <MdEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 placeholder:text-gray-400"
                                placeholder="admin@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <MdLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 placeholder:text-gray-400"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <MdVisibilityOff className="text-xl" /> : <MdVisibility className="text-xl" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-[#b27e02] to-[#8a6002] text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <MdLogin />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
                        ← Back to Website
                    </a>
                </div>
            </div>
        </div>
    );
}
