import Footer from '@/components/Footer';
import WhatsAppIcon from '@/components/WhatsAppIcon';

export default function CategoryDetailPage({
    category,
    posts = [],
    currentPage = 1,
    totalPages = 1,
}) {
    if (!category) {
        return null;
    }

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
                            <a href="/categories" className="text-gray-600 hover:text-[#b27e02] transition">Categories</a>
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

            {category.heroImage ? (
                <section
                    className="relative h-96 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('${category.heroImage}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-black bg-opacity-60"></div>
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                        <div className="text-white">
                            <nav className="text-sm mb-4">
                                <a href="/categories" className="text-[#e8b060] hover:text-white">Categories</a>
                                <span className="mx-2">/</span>
                                <span>{category.name}</span>
                            </nav>
                            <h1 className="text-5xl font-bold mb-4">{category.title || category.name}</h1>
                            {category.description && (
                                <p className="text-xl text-gray-200 max-w-2xl">{category.description}</p>
                            )}
                        </div>
                    </div>
                </section>
            ) : (
                <section className="bg-gradient-to-r from-[#b27e02] to-[#6b4a01] text-white py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="text-sm mb-4">
                            <a href="/categories" className="text-[#f0d090] hover:text-white">Categories</a>
                            <span className="mx-2">/</span>
                            <span>{category.name}</span>
                        </nav>
                        <h1 className="text-5xl font-bold mb-4">{category.title || category.name}</h1>
                        {category.description && (
                            <p className="text-xl text-[#faf0d0] max-w-2xl">{category.description}</p>
                        )}
                    </div>
                </section>
            )}

            {category.content && (
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: category.content }} />
                </section>
            )}

            <section className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8">
                        Articles in {category.name}
                    </h2>
                    {posts.length === 0 ? (
                        <p className="text-gray-600">No articles in this category yet.</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map((post) => (
                                    <a
                                        key={post._id || post.slug || post.id}
                                        href={`/blog/${post.slug || post.id || post._id}`}
                                        className="bg-gray-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1"
                                    >
                                        {post.heroImage && (
                                            <img
                                                src={post.heroImage}
                                                alt={post.heroImageAlt || post.title}
                                                className="w-full h-48 object-cover"
                                            />
                                        )}
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{post.title}</h3>
                                            <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">{post.date || post.publishDate || ''}</span>
                                                <span className="text-[#b27e02] font-semibold">Read more →</span>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-12">
                                    <a
                                        href={`/category/${category.slug}?page=${Math.max(1, currentPage - 1)}`}
                                        className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
                                    >
                                        ← Previous
                                    </a>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <a
                                            key={page}
                                            href={`/category/${category.slug}?page=${page}`}
                                            className={`w-10 h-10 rounded-lg font-medium transition-all inline-flex items-center justify-center ${currentPage === page
                                                ? 'bg-[#b27e02] text-white'
                                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </a>
                                    ))}

                                    <a
                                        href={`/category/${category.slug}?page=${Math.min(totalPages, currentPage + 1)}`}
                                        className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}
                                    >
                                        Next →
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {category.keywords && (
                <section className="bg-gray-50 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-wrap gap-2">
                            <span className="text-gray-600 font-semibold">Topics:</span>
                            {String(category.keywords)
                                .split(',')
                                .map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm shadow-sm"
                                    >
                                        {keyword.trim()}
                                    </span>
                                ))}
                        </div>
                    </div>
                </section>
            )}

            <WhatsAppIcon />
            <Footer />
        </div>
    );
}
