'use client';

import { useState, useCallback } from 'react';
import { EnquireNowContext } from '@/lib/EnquireNowContext';

export default function EnquireNowProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [opts, setOpts] = useState({});

    const openEnquire = useCallback((options = {}) => {
        setOpts(options);
        setIsOpen(true);
        document.body.style.overflow = 'hidden';
    }, []);

    const closeEnquire = useCallback(() => {
        setIsOpen(false);
        document.body.style.overflow = '';
    }, []);

    return (
        <EnquireNowContext.Provider value={{ openEnquire, closeEnquire }}>
            {children}
            {isOpen && <EnquireNowModal onClose={closeEnquire} opts={opts} />}
        </EnquireNowContext.Provider>
    );
}

function EnquireNowModal({ onClose, opts }) {
    const [form, setForm] = useState({ name: '', email: '', mobile: '' });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.mobile) { setError('Name and mobile number are required.'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    mobileNumber: form.mobile,
                    source: opts.source || 'Enquire Now',
                    project: opts.title || opts.projectTitle || '',
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
            } else {
                setError('Something went wrong. Please try again.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
                style={{ maxHeight: '90vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close button — dark, top-right of the white form panel */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
                    aria-label="Close"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Left — image only, no text overlay */}
                <div className="hidden md:block md:w-2/5 flex-shrink-0 relative">
                    {opts.image ? (
                        <img
                            src={opts.image}
                            alt="Enquire"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#b27e02] via-[#8a6002] to-[#4a3200]" />
                    )}
                </div>

                {/* Right — Form */}
                <div className="flex-1 flex flex-col justify-center p-7 md:p-10 overflow-y-auto">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                            <p className="text-gray-500 text-sm mb-6">We've received your enquiry and will get back to you shortly.</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-[#b27e02] text-white text-sm font-semibold rounded-lg hover:bg-[#8a6002] transition"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 pr-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">Enquire Now</h2>
                                <p className="text-sm text-gray-500">
                                    {(opts.title || opts.projectTitle)
                                        ? `Enquiring about: ${opts.title || opts.projectTitle}`
                                        : "Fill in your details and we'll be in touch."}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Full Name <span className="text-[#b27e02]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your full name"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Mobile Number <span className="text-[#b27e02]">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        name="mobile"
                                        value={form.mobile}
                                        onChange={handleChange}
                                        required
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 text-sm"
                                    />
                                </div>

                                {error && <p className="text-sm text-red-500">{error}</p>}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-[#b27e02] text-white font-semibold rounded-lg hover:bg-[#8a6002] transition-all duration-300 disabled:opacity-60 text-sm"
                                >
                                    {loading ? 'Submitting…' : 'Submit Enquiry'}
                                </button>

                                <p className="text-xs text-gray-400 text-center">
                                    By submitting, you agree to be contacted by our team.
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
