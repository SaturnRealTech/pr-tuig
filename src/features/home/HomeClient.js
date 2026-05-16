import { MdStar, MdStarBorder, MdArrowForward } from 'react-icons/md';
import Image from 'next/image';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import Footer from '@/components/Footer';
import HeroBannerSlider from '@/features/home/components/HeroBannerSlider';
import NavbarClient from '@/features/home/components/NavbarClient';
import AboutSectionClient from '@/features/home/components/AboutSectionClient';
import ProjectsSectionClient from '@/features/home/components/ProjectsSectionClient';
import WhyChooseUsClient from '@/features/home/components/WhyChooseUsClient';

export default function Home({ testimonials = [], bannerSlides = [], aboutSection = { title: '', content: '' }, homeWriteup = { title: '', content: '' }, whyChooseUs = { title: '', content: '' }, allProjects = [], groupedCategories = {}, locationCategories = [], builderCategories = [], blogPosts = [] }) {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className="text-[#b27e02]">
        {i < rating ? <MdStar size={18} /> : <MdStarBorder size={18} />}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-white">
      <WhatsAppIcon />

      <NavbarClient showReviews={testimonials.length > 0} />

      {/* Hero Banner */}
      <HeroBannerSlider slides={bannerSlides} />

      {/* About Section */}
      <AboutSectionClient title={aboutSection.title} content={aboutSection.content} locationCategories={locationCategories} />

      {/* Projects Section */}
      <ProjectsSectionClient projects={allProjects} groupedCategories={groupedCategories} />

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section id="testimonials" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">What Our Clients Say</h2>
              <p className="text-xl text-gray-600">Real stories from buyers, sellers and renters</p>
              <div className="h-1 w-20 bg-[#b27e02] mx-auto mt-6 rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.slice(0, 6).map((testimonial) => (
                <div key={testimonial._id} className="bg-white border-2 border-gray-200 rounded-xl p-8 hover:border-[#b27e02] hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center mb-4">
                    {testimonial.profileImage ? (
                      <Image src={testimonial.profileImage} alt={testimonial.name} width={48} height={48} unoptimized className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-[#b27e02] rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="ml-4">
                      <h4 className="font-bold text-black">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4">"{testimonial.content}"</p>
                  <div className="flex gap-1">{renderStars(testimonial.rating)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Builder logos */}
      {builderCategories.length > 0 && (
        <section className="py-16 bg-black">
          <div className="text-center mb-10">
            <p className="text-[#b27e02] text-sm font-semibold uppercase tracking-widest mb-2">Trusted Partners</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Our Builders</h2>
            <div className="h-1 w-16 bg-[#b27e02] mx-auto rounded-full mb-5" />
            <a href="/builders" className="inline-flex items-center gap-2 text-sm font-semibold text-[#b27e02] border border-[#b27e02]/50 px-5 py-2 rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300">
              View All Builders
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </a>
          </div>

          <div className="w-[95%] max-w-7xl mx-auto text-center">
            <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {builderCategories.map((b, i) => (
                <a
                  key={i}
                  href={`/builders/${b.slug}`}
                  className="flex flex-col items-center gap-4 group text-center"
                >
                  <div className="relative w-full h-28 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center group-hover:border-[#b27e02] group-hover:bg-white/10 transition-all duration-300 p-4 backdrop-blur-sm overflow-hidden">
                    {b.logo ? (
                      <Image src={b.logo} alt={b.name} fill unoptimized className="object-contain filter brightness-90 group-hover:brightness-110 transition-all duration-300" />
                    ) : (
                      <span className="text-5xl font-bold text-[#b27e02]">{b.name.charAt(0)}</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-400 group-hover:text-[#b27e02] transition-colors text-center leading-snug px-1">{b.name}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <WhyChooseUsClient title={whyChooseUs.title} content={whyChooseUs.content} />

      {/* Homepage Writeup */}
      {(homeWriteup.title || homeWriteup.content) && (
        <section className="py-16 bg-white">
          <div className="w-[90%] max-w-5xl mx-auto">
            {homeWriteup.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">{homeWriteup.title}</h2>
            )}
            {homeWriteup.content && (
              <div
                className="text-gray-700 leading-relaxed text-base md:text-lg [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_a]:text-[#b27e02] [&_a]:underline [&_strong]:font-semibold [&_blockquote]:border-l-4 [&_blockquote]:border-[#b27e02] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600"
                dangerouslySetInnerHTML={{ __html: homeWriteup.content }}
              />
            )}
          </div>
        </section>
      )}

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="w-[90%] mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">Latest from the Blog</h2>
              <p className="text-xl text-gray-600">Insights, tips and stories on real estate</p>
              <div className="h-1 w-20 bg-[#b27e02] mx-auto mt-6 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <a
                  key={post._id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 hover:border-[#b27e02]"
                >
                  {post.heroImage ? (
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={post.heroImage}
                        alt={post.heroImageAlt || post.title}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-[#fef9e7] to-[#fae8a0] flex items-center justify-center">
                      <span className="text-5xl opacity-40">📝</span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      {post.category && (
                        <span className="text-xs font-bold px-3 py-1 bg-[#faf0d0] text-[#b27e02] rounded-full">
                          {post.category}
                        </span>
                      )}
                      {post.readTime && <span className="text-xs text-gray-400">{post.readTime}</span>}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#b27e02] transition-colors">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-auto">
                      <span>{post.author}{post.date ? ` • ${post.date}` : ''}</span>
                      <MdArrowForward className="text-[#b27e02] group-hover:translate-x-1 transition-transform" size={18} />
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="text-center mt-12">
              <a
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#b27e02] border border-[#b27e02]/50 px-6 py-3 rounded-lg hover:bg-[#b27e02] hover:text-white transition-all duration-300"
              >
                Load More
                <MdArrowForward size={16} />
              </a>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
