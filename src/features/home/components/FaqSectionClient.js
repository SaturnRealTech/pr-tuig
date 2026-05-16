"use client";

import { useState } from 'react';

export default function FaqSectionClient({ faqs = [] }) {
    const [openFAQ, setOpenFAQ] = useState(0);

    return (
        <section id="faq" className="py-20 px-6 bg-gradient-to-b from-gray-50 via-white to-gray-50">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h3 className="text-4xl font-bold text-black mb-12 text-center">Frequently Asked Questions</h3>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-2 border-[#b27e02] rounded-xl overflow-hidden bg-gradient-to-r from-[#fef9e7] to-[#fef9e7]/50 shadow-lg shadow-[#faf0d0]/50">
                            <button
                                onClick={() => setOpenFAQ(openFAQ === index ? -1 : index)}
                                className="w-full px-8 py-6 text-left bg-gradient-to-r from-[#fef9e7] to-[#fef9e7]/50 hover:from-[#faf0d0] hover:to-[#faf0d0]/50 transition flex justify-between items-center"
                            >
                                <span className="text-xl font-bold text-black">{faq.question}</span>
                                <span className={`text-2xl text-[#b27e02] font-bold transition-transform ${openFAQ === index ? 'rotate-45' : ''}`}>
                                    +
                                </span>
                            </button>
                            {openFAQ === index && (
                                <div className="px-8 py-6 bg-gradient-to-r from-[#faf0d0]/50 to-[#faf0d0]/30 border-t-2 border-[#f0d090] text-gray-700 leading-relaxed">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
