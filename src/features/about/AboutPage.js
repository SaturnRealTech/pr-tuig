import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';

export default function AboutUs() {
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

                        <a
                            href="/contact"
                            className="md:hidden bg-[#b27e02] text-white px-4 py-2 rounded-lg hover:bg-[#8a6002] transition font-medium"
                        >
                            Contact
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-black via-black to-[#4a3800] relative overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#c99010]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b27e02]/10 rounded-full blur-3xl"></div>
                <div className="max-w-6xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                        About
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4a030] to-[#c99010]">
                            Qwikly Launch
                        </span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                        We're on a mission to accelerate the world of SaaS development by combining cutting-edge AI with proven development practices.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <div className="text-4xl font-bold text-white mb-2">Focused</div>
                            <p className="text-gray-300">On Founders</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <div className="text-4xl font-bold text-white mb-2">Built for Scale</div>
                            <p className="text-gray-300">Production-Ready Architecture</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
                            <div className="text-4xl font-bold text-white mb-2">100%</div>
                            <p className="text-gray-300">Client Satisfaction</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Story */}
            <section className="py-20 px-6 bg-gradient-to-b from-white via-gray-50 to-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Our Story</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">From frustration to innovation</p>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#b27e02] via-[#c99010] to-[#b27e02]"></div>

                        {/* Story Cards */}
                        <div className="space-y-12">
                            {/* Card 1 - Problem */}
                            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="md:text-right">
                                    <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                                        <div className="inline-block bg-[#b27e02] text-white px-4 py-2 rounded-full text-sm font-bold mb-4">2024</div>
                                        <h3 className="text-2xl font-bold text-black mb-4">The Problem</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            Traditional SaaS development was broken. Founders spent months and millions on development, only to launch with mediocre results. The bottleneck wasn't creativity—it was inefficiency.
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden md:block"></div>
                                {/* Center dot */}
                                <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#b27e02] rounded-full border-4 border-white shadow-lg"></div>
                            </div>

                            {/* Card 2 - Discovery */}
                            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="hidden md:block"></div>
                                <div>
                                    <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                                        <div className="inline-block bg-black text-white px-4 py-2 rounded-full text-sm font-bold mb-4">The Insight</div>
                                        <h3 className="text-2xl font-bold text-black mb-4">What We Discovered</h3>
                                        <p className="text-gray-700 leading-relaxed">
                                            Most teams used outdated methodologies, lacked AI integration, and weren't leveraging modern tools to their full potential. We knew there was a better way.
                                        </p>
                                    </div>
                                </div>
                                {/* Center dot */}
                                <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-black rounded-full border-4 border-white shadow-lg"></div>
                            </div>

                            {/* Card 3 - Solution */}
                            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                <div className="md:text-right">
                                    <div className="bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl p-8 shadow-xl text-white">
                                        <div className="inline-block bg-white text-[#b27e02] px-4 py-2 rounded-full text-sm font-bold mb-4">Today</div>
                                        <h3 className="text-3xl font-bold mb-4">Qwikly Launch</h3>
                                        <p className="text-[#fef9e7] leading-relaxed mb-6">
                                            We built a different kind of development partner—one that delivers production-ready SaaS products in weeks, not months. AI-native, modern, and lightning-fast.
                                        </p>
                                        <div className="flex flex-wrap gap-2 justify-end md:justify-start">
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">AI-Powered</span>
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Modern Stack</span>
                                            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">Fast Delivery</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden md:block"></div>
                                {/* Center dot */}
                                <div className="hidden md:block absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#b27e02] rounded-full border-4 border-white shadow-lg animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission & Values */}
            <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">What Drives Us</h2>
                        <p className="text-xl text-gray-600">Our purpose, vision, and principles</p>
                    </div>

                    {/* Mission & Vision - Flat Layout */}
                    <div className="relative mb-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                            {/* Mission Side */}
                            <div className="relative p-12 bg-gradient-to-br from-[#fef9e7] to-white">
                                <div className="absolute top-6 right-6 text-6xl opacity-10">🎯</div>
                                <div className="relative z-10">
                                    <span className="inline-block px-4 py-1.5 bg-[#b27e02] text-white text-sm font-bold rounded-full mb-6">MISSION</span>
                                    <h3 className="text-3xl font-bold text-black mb-6">Empowering Innovation</h3>
                                    <p className="text-gray-700 text-lg leading-relaxed">
                                        To empower founders and innovation teams by delivering AI-powered SaaS products with speed, quality, and precision. We believe every great idea deserves to reach the market quickly.
                                    </p>
                                </div>
                            </div>

                            {/* Vision Side */}
                            <div className="relative p-12 bg-gradient-to-br from-gray-50 to-white">
                                <div className="absolute top-6 right-6 text-6xl opacity-10">🚀</div>
                                <div className="relative z-10">
                                    <span className="inline-block px-4 py-1.5 bg-black text-white text-sm font-bold rounded-full mb-6">VISION</span>
                                    <h3 className="text-3xl font-bold text-black mb-6">Building The Future</h3>
                                    <p className="text-gray-700 text-lg leading-relaxed">
                                        To become the go-to partner for rapid SaaS development by making AI-native development the standard, not the exception. We're building the future of product development.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Core Values */}
                    <div>
                        <h3 className="text-3xl font-bold text-black mb-12 text-center">Our Core Values</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Value 1 */}
                            <div className="relative p-10 bg-gradient-to-br from-[#fef9e7] to-white">
                                <div className="absolute top-6 right-6 text-6xl opacity-10">⚡</div>
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-[#b27e02] text-white text-xs font-bold rounded-full mb-4">SPEED</span>
                                    <h4 className="text-xl font-bold text-black mb-3">Speed Without Compromise</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        We move fast, but never at the expense of quality. Every line of code is production-ready from day one.
                                    </p>
                                </div>
                            </div>

                            {/* Value 2 */}
                            <div className="relative p-10 bg-gradient-to-br from-gray-50 to-white">
                                <div className="absolute top-6 right-6 text-6xl opacity-10">🤖</div>
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full mb-4">AI-FIRST</span>
                                    <h4 className="text-xl font-bold text-black mb-3">AI-First Mindset</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        We don't just add AI—we build it into the foundation of every project. It's not an afterthought; it's core to our DNA.
                                    </p>
                                </div>
                            </div>

                            {/* Value 3 */}
                            <div className="relative p-10 bg-gradient-to-br from-[#fef9e7] to-white">
                                <div className="absolute top-6 right-6 text-6xl opacity-10">🎯</div>
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-[#b27e02] text-white text-xs font-bold rounded-full mb-4">SUCCESS</span>
                                    <h4 className="text-xl font-bold text-black mb-3">Client Success First</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        Your success is our success. We're invested in your long-term growth, not just short-term transactions.
                                    </p>
                                </div>
                            </div>

                            {/* Value 4 */}
                            <div className="relative p-10 bg-gradient-to-br from-gray-50 to-white">
                                <div className="absolute top-6 right-6 text-6xl opacity-10">💡</div>
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full mb-4">INNOVATION</span>
                                    <h4 className="text-xl font-bold text-black mb-3">Innovation Obsession</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        We stay ahead of the curve by constantly learning, experimenting, and adopting the latest technologies.
                                    </p>
                                </div>
                            </div>

                            {/* Value 5 */}
                            <div className="relative p-10 bg-gradient-to-br from-[#fef9e7] to-white">
                                <div className="absolute top-6 right-6 text-6xl opacity-10">🤝</div>
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-[#b27e02] text-white text-xs font-bold rounded-full mb-4">TRUST</span>
                                    <h4 className="text-xl font-bold text-black mb-3">Transparency & Trust</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        Clear communication, honest timelines, and realistic expectations. We build trust through consistency.
                                    </p>
                                </div>
                            </div>

                            {/* Value 6 */}
                            <div className="relative p-10 bg-gradient-to-br from-gray-50 to-white">
                                <div className="absolute top-6 right-6 text-6xl opacity-10">📈</div>
                                <div className="relative z-10">
                                    <span className="inline-block px-3 py-1 bg-black text-white text-xs font-bold rounded-full mb-4">GROWTH</span>
                                    <h4 className="text-xl font-bold text-black mb-3">Continuous Improvement</h4>
                                    <p className="text-gray-700 leading-relaxed">
                                        We never settle. Every project teaches us something new, and we apply those lessons to every future engagement.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-20 px-6 bg-gradient-to-b from-white via-gray-50 to-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Why Work With Us</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">We combine speed, quality, and innovation to help you succeed.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="flex gap-6 items-start">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 group-hover:scale-110 transition-transform">✓</div>
                                <div>
                                    <h3 className="text-xl font-bold text-black mb-2">Proven Track Record</h3>
                                    <p className="text-gray-600 leading-relaxed">Consistent delivery on time and on budget, with a clear fixed-scope and fixed-timeline process.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="flex gap-6 items-start">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 group-hover:scale-110 transition-transform">✓</div>
                                <div>
                                    <h3 className="text-xl font-bold text-black mb-2">AI-Native Development</h3>
                                    <p className="text-gray-600 leading-relaxed">We don't just build software—we build intelligent systems. AI is embedded in our development process.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="flex gap-6 items-start">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 group-hover:scale-110 transition-transform">✓</div>
                                <div>
                                    <h3 className="text-xl font-bold text-black mb-2">Dedicated Partnership</h3>
                                    <p className="text-gray-600 leading-relaxed">You're not just another client. We assign a dedicated team that stays with you through launch and beyond.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group">
                            <div className="flex gap-6 items-start">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 group-hover:scale-110 transition-transform">✓</div>
                                <div>
                                    <h3 className="text-xl font-bold text-black mb-2">Scalable Architecture</h3>
                                    <p className="text-gray-600 leading-relaxed">Every product is built to scale from day one. No technical debt. No shortcuts. Production-ready from launch.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-[#b27e02] hover:shadow-xl transition-all group md:col-span-2">
                            <div className="flex gap-6 items-start">
                                <div className="w-14 h-14 bg-gradient-to-br from-[#b27e02] to-[#8a6002] rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 group-hover:scale-110 transition-transform">✓</div>
                                <div>
                                    <h3 className="text-xl font-bold text-black mb-2">Transparent Pricing</h3>
                                    <p className="text-gray-600 leading-relaxed">No hidden fees. No surprise costs. We're upfront about pricing and deliver exceptional value for every dollar.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6 bg-gradient-to-r from-[#b27e02] to-[#8a6002]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Launch Your Next Big Idea?</h2>
                    <p className="text-xl text-[#faf0d0] mb-8">Let's talk about your vision and how we can help you get to market faster.</p>
                    <a href="/#contact" className="inline-block bg-black text-white px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-900 transition transform hover:scale-105">
                        Schedule a Consultation
                    </a>
                </div>
            </section>

            <Footer />
        </div>
    );
}
