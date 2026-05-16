'use client';

import { useState, useEffect } from 'react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import NavbarClient from '@/features/home/components/NavbarClient';

export default function CookiePolicy() {
    const [pageData, setPageData] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/cookies')
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data) setPageData(d.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const pageTitle = pageData.title || 'Cookie Policy';
    const hasContent = !loading && pageData.content;

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon />
            <NavbarClient />

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-white">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#b27e02]/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b27e02]/20 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                        {pageTitle}
                    </h1>
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Understanding how we use cookies and similar technologies to improve your browsing experience
                    </p>
                    <div className="flex items-center justify-center gap-6 text-white text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <span className="text-[#c99010]">●</span>
                            <span>Transparent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#c99010]">●</span>
                            <span>Clear Controls</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[#c99010]">●</span>
                            <span>Your Choice</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-12 px-6 bg-white">
                <div className="max-w-4xl mx-auto">
                    {loading ? (
                        <div className="text-gray-400 text-center py-12">Loading...</div>
                    ) : hasContent ? (
                        <div
                            className="rich-content text-gray-700"
                            dangerouslySetInnerHTML={{ __html: pageData.content }}
                        />
                    ) : (
                        <div className="prose prose-lg max-w-none">

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-black mb-4">Introduction</h2>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    This Cookie Policy explains how Qwikly Launch ("we", "us", or "our") uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-black mb-4">What Are Cookies?</h2>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information.
                                </p>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    Cookies set by the website owner are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies."
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-black mb-4">Why We Use Cookies</h2>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to track and target the interests of our users to enhance the experience on our website.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-black mb-4">Types of Cookies We Use</h2>
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-[#fef9e7] to-white p-6 rounded-lg border-l-4 border-[#b27e02]">
                                        <h3 className="text-xl font-bold text-black mb-3">1. Essential Cookies</h3>
                                        <p className="text-gray-700 leading-relaxed mb-3">These cookies are strictly necessary to provide you with services available through our website.</p>
                                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                            <li>Session management and authentication</li>
                                            <li>Security and fraud prevention</li>
                                            <li>Load balancing</li>
                                        </ul>
                                    </div>
                                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border-l-4 border-black">
                                        <h3 className="text-xl font-bold text-black mb-3">2. Performance and Analytics Cookies</h3>
                                        <p className="text-gray-700 leading-relaxed mb-3">These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.</p>
                                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                            <li>Google Analytics</li>
                                            <li>Page view tracking</li>
                                            <li>User behavior analysis</li>
                                        </ul>
                                    </div>
                                    <div className="bg-gradient-to-br from-[#fef9e7] to-white p-6 rounded-lg border-l-4 border-[#b27e02]">
                                        <h3 className="text-xl font-bold text-black mb-3">3. Functionality Cookies</h3>
                                        <p className="text-gray-700 leading-relaxed mb-3">These cookies enable the website to provide enhanced functionality and personalization.</p>
                                        <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                                            <li>Remember your preferences and settings</li>
                                            <li>Language preferences</li>
                                            <li>User interface customization</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-black mb-4">How to Control Cookies</h2>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking on the appropriate opt-out links provided in the cookie banner when you first visit our website.
                                </p>
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                                    <p className="text-gray-700 text-sm">
                                        <strong>Note:</strong> If you choose to disable cookies, some features of our website may not function properly.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-black mb-4">Updates to This Cookie Policy</h2>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    We may update this Cookie Policy from time to time. Please revisit this Cookie Policy regularly to stay informed about our use of cookies.
                                </p>
                            </div>

                            <div className="mb-12">
                                <h2 className="text-3xl font-bold text-black mb-4">Contact Us</h2>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    If you have any questions about our use of cookies or this Cookie Policy, please contact us.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
