import Footer from '@/components/Footer';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function CategoriesPage({ categories = [] }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <a href="/" className="text-2xl font-bold">
                            <span className="text-[#b27e02]">Qwikly</span>
                            <span className="text-gray-800">Launch</span>
                        </a>
                        <nav className="hidden md:flex gap-6">
                            <a href="/" className="text-gray-600 hover:text-[#b27e02] transition">Home</a>
                            <a href="/blog" className="text-gray-600 hover:text-[#b27e02] transition">Blog</a>
                            <a href="/categories" className="text-[#b27e02] font-semibold">Categories</a>
                            <a href="/contact" className="text-gray-600 hover:text-[#b27e02] transition">Contact</a>
                        </nav>
                        <a
                            href="/contact"
                            className="md:hidden bg-[#b27e02] text-white px-4 py-2 rounded-lg hover:bg-[#8a6002] transition font-medium"
                        >
                            Contact
                        </a>
                    </div>
                </div>
            </header>

            <section className="bg-gradient-to-r from-[#b27e02] to-[#6b4a01] text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl font-bold mb-4">Browse Categories</h1>
                    <p className="text-xl text-[#faf0d0]">Explore our content organized by topics</p>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {categories.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-xl text-gray-600">No categories available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {categories.map((category) => (
                            <a
                                key={category._id || category.slug}
                                href={`/category/${category.slug}`}
                                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1"
                            >
                                {category.heroImage ? (
                                    <img
                                        src={category.heroImage}
                                        alt={category.heroImageAlt || category.name}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gradient-to-r from-[#c99010] to-[#8a6002] flex items-center justify-center">
                                        <span className="text-white text-4xl font-bold opacity-50">
                                            {category.name?.charAt(0)?.toUpperCase() || 'C'}
                                        </span>
                                    </div>
                                )}
                                <div className="p-6">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-3">
                                        {category.title || category.name}
                                    </h2>
                                    <p className="text-gray-600 mb-4 line-clamp-3">{category.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">{category.count || 0} articles</span>
                                        <span className="text-[#b27e02] font-semibold hover:text-[#8a6002]">Explore →</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </section>

            <WhatsAppIcon />
            <Footer />
        </div>
    );
}
