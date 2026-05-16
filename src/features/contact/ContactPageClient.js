'use client';

import { useState } from 'react';
import { MdEmail, MdPhone, MdLocationOn, MdSend, MdCheckCircle, MdMenu, MdClose } from 'react-icons/md';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import Swal from 'sweetalert2';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobileNumber: '',
        message: ''
    });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            const response = await fetch('/api/send-mail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.success) {
                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    mobileNumber: '',
                    message: ''
                });

                // Show success SweetAlert
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
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops!',
                    text: result.error || 'Something went wrong. Please try again.',
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#dc2626'
                });
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: 'Failed to submit form. Please check your internet connection and try again.',
                confirmButtonText: 'Try Again',
                confirmButtonColor: '#dc2626'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-white to-white">
            <WhatsAppIcon />
            {/* Navigation */}
            <nav className="fixed w-full top-0 z-50 border-b border-[#b27e02]/20 bg-white/95 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="text-2xl font-bold">
                            <a href="/">
                                <span className="text-[#b27e02]">Saturn</span>
                                <span className="text-black">Realcon</span>
                            </a>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex gap-8 items-center">
                            <a href="/contact" className="bg-[#b27e02] text-white px-6 py-2 rounded-lg hover:bg-[#8a6002] transition font-medium">Book Free Consultation</a>
                        </div>

                        {/* Hamburger Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden text-gray-700 hover:text-[#b27e02] transition p-2"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <MdClose size={28} /> : <MdMenu size={28} />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
                            <a
                                href="/contact"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block bg-[#b27e02] text-white px-6 py-3 rounded-lg hover:bg-[#8a6002] transition font-medium text-center"
                            >
                                Book Free Consultation
                            </a>
                        </div>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-white">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#b27e02]/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b27e02]/20 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-gray-300">
                        Have a project in mind? Let's talk about how we can help bring your ideas to life.
                    </p>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
                        {/* Contact Information */}
                        <div className="space-y-8">
                            {/* Email */}
                            <div className="bg-gradient-to-br from-[#fef9e7] to-white p-8 rounded-xl border border-[#f0d090]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-[#b27e02] rounded-lg flex items-center justify-center text-white text-2xl">
                                        <MdEmail />
                                    </div>
                                    <h3 className="text-xl font-bold text-black">Email</h3>
                                </div>
                                <p className="text-gray-600 mb-2">Send us an email and we'll respond as soon as possible.</p>
                                <a href="mailto:SaturnRealcon@gmail.com" className="text-[#b27e02] font-semibold hover:text-[#8a6002]">
                                    SaturnRealcon@gmail.com
                                </a>
                            </div>

                            {/* Phone */}
                            <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-xl border border-gray-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white text-2xl">
                                        <MdPhone />
                                    </div>
                                    <h3 className="text-xl font-bold text-black">Phone</h3>
                                </div>
                                <p className="text-gray-600 mb-2">Call us during business hours (Mon-Fri, 9AM-6PM IST/EST).</p>
                                <a href="tel:+919108292463" className="text-black font-semibold hover:text-[#b27e02] block mb-1">
                                    +91 910 8292 463
                                </a>
                                {/* US phone number removed */}
                            </div>

                            {/* Location */}
                            <div className="bg-gradient-to-br from-[#fef9e7] to-white p-8 rounded-xl border border-[#f0d090]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-[#b27e02] rounded-lg flex items-center justify-center text-white text-2xl">
                                        <MdLocationOn />
                                    </div>
                                    <h3 className="text-xl font-bold text-black">Location</h3>
                                </div>
                                {/* US address removed */}
                                <p className="text-gray-600">
                                    Bangalore, Karnataka, India
                                </p>
                            </div>

                            {/* Response Time */}
                            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    <strong>⏱️ Average Response Time:</strong> We typically respond to all inquiries within 24 hours.
                                </p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-10 shadow-lg">
                                <h3 className="text-3xl font-bold text-black mb-8">Send us a Message</h3>

                                {/* Name Field */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 placeholder-gray-500"
                                        placeholder="John Doe"
                                    />
                                </div>

                                {/* Email Field */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 placeholder-gray-500"
                                        placeholder="john@example.com"
                                    />
                                </div>

                                {/* Phone Field */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                    <input
                                        type="tel"
                                        name="mobileNumber"
                                        value={formData.mobileNumber}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 placeholder-gray-500"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                {/* Message Field */}
                                <div className="mb-8">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message *</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows="6"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#b27e02] focus:ring-2 focus:ring-[#faf0d0] text-gray-900 placeholder-gray-500 resize-none"
                                        placeholder="Tell us about your project..."
                                    ></textarea>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-[#b27e02] to-[#8a6002] text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <MdSend />
                                            Send Message
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-gray-600 mt-4 text-center">
                                    We respect your privacy. Your information is secure and will never be shared.
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-20">
                        <h3 className="text-4xl font-bold text-black mb-12 text-center">Frequently Asked Questions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* FAQ 1 */}
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                                <h4 className="text-xl font-bold text-black mb-3">How long does a typical project take?</h4>
                                <p className="text-gray-700">
                                    Most projects take 4-8 weeks from initial consultation to launch. However, timelines vary based on project complexity and your specific requirements.
                                </p>
                            </div>

                            {/* FAQ 2 */}
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                                <h4 className="text-xl font-bold text-black mb-3">What's the typical cost range?</h4>
                                <p className="text-gray-700">
                                    Pricing depends on project scope, features, and complexity. We offer flexible packages and financing options. Contact us for a custom quote.
                                </p>
                            </div>

                            {/* FAQ 3 */}
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                                <h4 className="text-xl font-bold text-black mb-3">Do you provide post-launch support?</h4>
                                <p className="text-gray-700">
                                    Yes! We provide comprehensive post-launch support including maintenance, updates, and optimization to ensure your app stays performant.
                                </p>
                            </div>

                            {/* FAQ 4 */}
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                                <h4 className="text-xl font-bold text-black mb-3">Can you work with our existing team?</h4>
                                <p className="text-gray-700">
                                    Absolutely! We can augment your existing team or work as a standalone development partner. We're flexible and collaborative.
                                </p>
                            </div>

                            {/* FAQ 5 */}
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                                <h4 className="text-xl font-bold text-black mb-3">What technologies do you use?</h4>
                                <p className="text-gray-700">
                                    We use modern tech stacks including React, Next.js, Node.js, PostgreSQL, and cloud platforms like AWS. We're tech-agnostic and adapt to your needs.
                                </p>
                            </div>

                            {/* FAQ 6 */}
                            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                                <h4 className="text-xl font-bold text-black mb-3">How do you ensure quality?</h4>
                                <p className="text-gray-700">
                                    We follow strict quality assurance processes including code reviews, automated testing, and comprehensive testing before launch.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-gradient-to-r from-[#b27e02] to-[#8a6002]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Ready to Start Your Project?
                    </h2>
                    <p className="text-xl text-[#faf0d0] mb-8">
                        Let's work together to bring your ideas to life. Fill out the form above or call us directly.
                    </p>
                    <a href="#" className="inline-block px-8 py-3 bg-white text-[#b27e02] rounded-lg font-bold hover:bg-[#fef9e7] transition-all">
                        Schedule a Free Consultation
                    </a>
                </div>
            </section>

            <Footer />
        </div>
    );
}
