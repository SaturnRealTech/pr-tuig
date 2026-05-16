'use client';

import { useState, useEffect } from 'react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import NavbarClient from '@/features/home/components/NavbarClient';

export default function Privacy() {
    const [pageData, setPageData] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/privacy')
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data) setPageData(d.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const pageTitle = pageData.title || 'Privacy Policy';
    const hasContent = !loading && pageData.content;

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon />
            <NavbarClient />

            {/* Privacy Policy Content */}
            <section className="pt-32 pb-20 px-6 bg-white">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl font-bold text-black mb-8">{pageTitle}</h1>
                    <p className="text-gray-600 mb-12">Last updated: January 2026</p>

                    {loading ? (
                        <div className="text-gray-400 text-center py-12">Loading...</div>
                    ) : hasContent ? (
                        <div
                            className="rich-content text-gray-700"
                            dangerouslySetInnerHTML={{ __html: pageData.content }}
                        />
                    ) : (
                        <div className="space-y-8 text-gray-700">
                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">1. Introduction</h2>
                                <p className="leading-relaxed">
                                    Qwikly Launch ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">2. Information We Collect</h2>
                                <p className="mb-4">We may collect information about you in a variety of ways. The information we may collect on the Site includes:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li><strong>Personal Data:</strong> Name, email address, phone number, and other information you voluntarily provide.</li>
                                    <li><strong>Technical Data:</strong> IP address, browser type, operating system, and pages visited.</li>
                                    <li><strong>Usage Data:</strong> Information about how you interact with our website and services.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">3. Use of Your Information</h2>
                                <p className="mb-4">Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Email you regarding your inquiry or project</li>
                                    <li>Fulfill and manage your requests for our services</li>
                                    <li>Generate analytics data for site improvement</li>
                                    <li>Deliver targeted marketing communications</li>
                                    <li>Respond to your comments, questions, and requests</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">4. Disclosure of Your Information</h2>
                                <p className="leading-relaxed">
                                    We may share information we have collected about you in certain situations:
                                </p>
                                <ul className="list-disc list-inside space-y-2 mt-4">
                                    <li><strong>Service Providers:</strong> We may share your data with third parties who perform services on our behalf.</li>
                                    <li><strong>Legal Requirements:</strong> When required by law or to protect our legal rights.</li>
                                    <li><strong>Business Transfer:</strong> If we are involved in a merger, acquisition, or sale of assets.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">5. Security of Your Information</h2>
                                <p className="leading-relaxed">
                                    We use administrative, technical, and physical security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">6. Contact Us</h2>
                                <p className="leading-relaxed">
                                    If you have questions or comments about this Privacy Policy, please contact us at:
                                </p>
                                <p className="mt-4">
                                    <strong>Qwikly Launch</strong><br />
                                    We will respond to your inquiry within 30 days.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">7. Changes to This Privacy Policy</h2>
                                <p className="leading-relaxed">
                                    We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, and other factors. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                                </p>
                            </section>
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
