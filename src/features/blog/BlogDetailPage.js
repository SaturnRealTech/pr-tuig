import { MdArrowBack, MdPerson, MdAccessTime, MdCalendarToday } from 'react-icons/md';
import ShareButtons from '@/components/ShareButtons';
import ProjectContent from '@/components/ProjectContent';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import NavbarClient from '@/features/home/components/NavbarClient';

export default function BlogDetailPage({ post }) {
    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Post Not Found</h1>
                    <a href="/blog" className="text-[#b27e02] hover:underline">← Back to Blog</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <WhatsAppIcon />
            <NavbarClient />

            {/* Article Header */}
            <section className="pt-24 pb-8 px-6 bg-gradient-to-b from-gray-100 to-white">
                <div className="max-w-6xl mx-auto">
                    {/* Back Link - Improved UI */}
                    <a href="/blog" className="flex items-center gap-2 text-gray-500 hover:text-[#b27e02] mb-8 font-medium text-base transition-colors">
                        <MdArrowBack className="w-5 h-5" />
                        <span>Back to Blog</span>
                    </a>

                    {/* Category & Title */}
                    <div className="mb-8">
                        <span className="text-xs font-bold px-3 py-1 bg-[#faf0d0] text-[#b27e02] rounded-full inline-block mb-4">
                            {post.category}
                        </span>
                        <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
                            {post.title}
                        </h1>
                    </div>

                    {/* Meta Information - Clean Row, Centered, React Icons */}
                    <div className="flex flex-wrap items-center gap-4 text-gray-500 text-base mb-8 justify-center">
                        <div className="flex items-center gap-2">
                            <MdPerson className="w-7 h-7 text-blue-400" />
                            <span className="font-semibold text-gray-700 text-lg">Content Team</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdCalendarToday className="w-5 h-5 text-gray-400" />
                            <span>{post.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MdAccessTime className="w-5 h-5 text-gray-400" />
                            <span>{post.readTime}</span>
                        </div>
                    </div>

                    {/* Share Buttons removed from before author bio */}
                </div>
            </section>

            {/* Featured Image */}
            <section className="px-6 pb-8">
                <div className="max-w-6xl mx-auto">
                    {post.heroImage ? (
                        <div className="w-full rounded-xl overflow-hidden">
                            <img
                                src={post.heroImage}
                                alt={post.heroImageAlt || post.title}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    ) : (
                        <div className="h-[400px] bg-gradient-to-br from-[#c99010] to-[#8a6002] rounded-xl flex items-center justify-center">
                            <span className="text-9xl opacity-50 text-white">{post.image || '📝'}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Article Content */}
            <section className="py-12 px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Article Text - Render admin HTML with full HTML support */}
                    {post.excerpt && (
                        <p className="text-xl text-gray-700 mb-8 italic">{post.excerpt}</p>
                    )}
                    {post.content && <ProjectContent html={post.content} />}
                    {/* Share Buttons - Horizontal Social Icons (before author bio) */}
                    <div className="flex flex-row gap-4 py-8 justify-center">
                        <ShareButtons url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://tangledupingreen.in'}/blog/${post.slug || post._id}`} title={post.title} />
                    </div>
                    {/* Related Posts */}
                    <div className="mb-16">
                        <h3 className="text-3xl font-bold text-black mb-8">Related Articles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Related posts would be fetched dynamically */}
                            <p className="text-gray-600 col-span-2">More articles coming soon...</p>
                        </div>
                    </div>

                    {/* Share Buttons removed from bottom */}
                </div>
            </section>
            <Footer />
        </div>
    );
}
