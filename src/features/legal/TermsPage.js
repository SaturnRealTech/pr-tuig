'use client';

import { useState, useEffect } from 'react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import NavbarClient from '@/features/home/components/NavbarClient';

export default function Terms() {
    const [pageData, setPageData] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/terms')
            .then(r => r.json())
            .then(d => {
                if (d.success && d.data) setPageData(d.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const pageTitle = pageData.title || 'Terms & Conditions';
    const hasContent = !loading && pageData.content;

    return (
        <div className="min-h-screen bg-white">
            <WhatsAppIcon />
            <NavbarClient />

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
                                <h2 className="text-2xl font-bold text-black mb-4">1. Agreement to Terms</h2>
                                <p className="leading-relaxed">
                                    By accessing and using the Qwikly Launch website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">2. Use License</h2>
                                <p className="mb-4">Permission is granted to temporarily download one copy of the materials (information or software) on Qwikly Launch's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Modify or copy the materials</li>
                                    <li>Use the materials for any commercial purpose or for any public display</li>
                                    <li>Attempt to decompile or reverse engineer any software contained on the website</li>
                                    <li>Remove any copyright or other proprietary notations from the materials</li>
                                    <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">3. Disclaimer</h2>
                                <p className="leading-relaxed">
                                    The materials on Qwikly Launch's website are provided on an 'as is' basis. Qwikly Launch makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">4. Limitations</h2>
                                <p className="leading-relaxed">
                                    In no event shall Qwikly Launch or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this website.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">5. Accuracy of Materials</h2>
                                <p className="leading-relaxed">
                                    The materials appearing on this website could include technical, typographical, or photographic errors. Qwikly Launch does not warrant that any of the materials on its website are accurate, complete, or current. Qwikly Launch may make changes to the materials contained on its website at any time without notice.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">6. Links</h2>
                                <p className="leading-relaxed">
                                    Qwikly Launch has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Qwikly Launch of the site. Use of any such linked website is at the user's own risk.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">7. Modifications</h2>
                                <p className="leading-relaxed">
                                    Qwikly Launch may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">8. Governing Law</h2>
                                <p className="leading-relaxed">
                                    These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction where Qwikly Launch operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">9. User Content</h2>
                                <p className="mb-4">You retain all rights to any content you submit, post, or display on or through our services. By submitting content, you grant Qwikly Launch a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute such content.</p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">10. Service Terms</h2>
                                <p className="mb-4">When engaging with Qwikly Launch for development services:</p>
                                <ul className="list-disc list-inside space-y-2">
                                    <li>Project scope must be clearly defined in writing</li>
                                    <li>Payment terms will be specified in individual project agreements</li>
                                    <li>Timeline estimates are subject to change based on requirements and unforeseen circumstances</li>
                                    <li>Client is responsible for providing necessary information and assets</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">11. Intellectual Property</h2>
                                <p className="leading-relaxed">
                                    Work product created by Qwikly Launch for clients becomes the property of the client upon full payment. Pre-existing tools, frameworks, and methodologies remain the property of Qwikly Launch.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-black mb-4">12. Contact Information</h2>
                                <p className="leading-relaxed">
                                    If you have any questions about these Terms &amp; Conditions, please contact us at:
                                </p>
                                <p className="mt-4">
                                    <strong>Qwikly Launch</strong><br />
                                    We will respond to your inquiry within 30 days.
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
