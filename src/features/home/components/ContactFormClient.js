"use client";

import { useState } from 'react';
import Swal from 'sweetalert2';

export default function ContactFormClient() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobileNumber: '',
        message: '',
    });
    const [formStatus, setFormStatus] = useState({ loading: false, success: false, error: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormStatus({ loading: true, success: false, error: '' });

        try {
            const response = await fetch('/api/send-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                setFormStatus({ loading: false, success: true, error: '' });
                setFormData({ name: '', email: '', mobileNumber: '', message: '' });

                Swal.fire({
                    icon: 'success',
                    title: 'Thank You! 🎉',
                    html: `
              <div style="text-align: center;">
                <p style="font-size: 16px; color: #555; margin-bottom: 10px;">
                  Your message has been received successfully!
                </p>
                <p style="font-size: 14px; color: #777;">
                  We will reach out to you on the details you provided within <strong>24 hours</strong>.
                </p>
              </div>
            `,
                    confirmButtonText: 'Got it!',
                    confirmButtonColor: '#dc2626',
                    background: '#fff',
                });
            } else {
                setFormStatus({ loading: false, success: false, error: result.error || 'Something went wrong' });
                Swal.fire({
                    icon: 'error',
                    title: 'Oops!',
                    text: result.error || 'Something went wrong. Please try again.',
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#dc2626',
                });
            }
        } catch (error) {
            setFormStatus({ loading: false, success: false, error: 'Failed to submit form. Please try again.' });
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: 'Failed to submit form. Please check your internet connection and try again.',
                confirmButtonText: 'Try Again',
                confirmButtonColor: '#dc2626',
            });
        }
    };

    return (
        <section className="py-20 px-6 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#faf0d0]/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#fef9e7]/20 rounded-full blur-3xl"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="bg-white border-2 border-[#f0d090] rounded-2xl p-8 md:p-12 shadow-lg">
                    <form className="space-y-6" onSubmit={handleFormSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#b27e02] transition placeholder-gray-500 text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#b27e02] transition placeholder-gray-500 text-gray-900"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-black mb-2">Phone Number *</label>
                            <input
                                type="tel"
                                name="mobileNumber"
                                value={formData.mobileNumber}
                                onChange={handleInputChange}
                                placeholder="+1 (555) 123-4567"
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#b27e02] transition placeholder-gray-500 text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-black mb-2">Tell Us About Your Project *</label>
                            <textarea
                                rows="5"
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="Describe your project, goals, timeline, and budget..."
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#b27e02] transition resize-none placeholder-gray-500 text-gray-900"
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={formStatus.loading}
                            className="w-full bg-gradient-to-r from-[#b27e02] to-[#8a6002] text-white font-bold py-4 rounded-lg hover:shadow-lg hover:shadow-[#b27e02]/50 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {formStatus.loading ? 'Sending...' : 'Send Message'}
                        </button>

                        <p className="text-center text-sm text-gray-600">We typically respond within 24 hours</p>
                    </form>
                </div>
            </div>
        </section>
    );
}
