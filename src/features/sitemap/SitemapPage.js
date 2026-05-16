import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';

export default function Sitemap() {
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
            <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-b from-gray-950 via-gray-900 to-white">
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#b27e02]/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#b27e02]/20 rounded-full blur-3xl"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                        Sitemap
                    </h1>
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Quick navigation to all pages and sections of our website
                    </p>
                </div>
            </section>

            {/* Sitemap Content: Only main pages */}
            <section className="py-20 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <h2 className="text-4xl font-bold text-black mb-8 flex items-center gap-3">
                            <span className="text-[#b27e02]">🏠</span>
                            Main Pages
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <a href="/" target="_blank" rel="noopener noreferrer" className="group p-8 bg-gradient-to-br from-[#b27e02] to-[#8a6002] text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                                <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">Home</h3>
                                <p className="text-[#faf0d0] text-sm">Return to homepage</p>
                            </a>
                            <a href="/about/" target="_blank" rel="noopener noreferrer" className="group p-8 bg-gradient-to-br from-black to-gray-900 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                                <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">About Us</h3>
                                <p className="text-gray-300 text-sm">Learn about Qwikly Launch</p>
                            </a>
                            <a href="/careers/" target="_blank" rel="noopener noreferrer" className="group p-8 bg-gradient-to-br from-[#b27e02] to-[#8a6002] text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                                <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">Careers</h3>
                                <p className="text-[#faf0d0] text-sm">Join our team</p>
                            </a>
                            <a href="/contact/" target="_blank" rel="noopener noreferrer" className="group p-8 bg-gradient-to-br from-[#b27e02] to-[#8a6002] text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105">
                                <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">Contact</h3>
                                <p className="text-[#faf0d0] text-sm">Get in touch</p>
                            </a>
                            <a href="/privacy/" target="_blank" rel="noopener noreferrer" className="group p-8 bg-gradient-to-br from-[#fef9e7] to-white border-l-4 border-[#b27e02] rounded-lg hover:shadow-lg transition-all duration-300">
                                <h3 className="text-lg font-bold text-black mb-2">Privacy Policy</h3>
                                <p className="text-gray-600 text-sm">How we protect your data</p>
                            </a>
                            <a href="/terms/" target="_blank" rel="noopener noreferrer" className="group p-8 bg-gradient-to-br from-gray-50 to-white border-l-4 border-black rounded-lg hover:shadow-lg transition-all duration-300">
                                <h3 className="text-lg font-bold text-black mb-2">Terms & Conditions</h3>
                                <p className="text-gray-600 text-sm">Our terms of service</p>
                            </a>
                            <a href="/cookies/" target="_blank" rel="noopener noreferrer" className="group p-8 bg-gradient-to-br from-[#fef9e7] to-white border-l-4 border-[#b27e02] rounded-lg hover:shadow-lg transition-all duration-300">
                                <h3 className="text-lg font-bold text-black mb-2">Cookie Policy</h3>
                                <p className="text-gray-600 text-sm">How we use cookies</p>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
