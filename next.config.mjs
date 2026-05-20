/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  trailingSlash: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    const remote = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    if (!remote) return [];
    return {
      beforeFiles: [
        { source: '/api/files/:path*', destination: `${remote}/api/files/:path*` },
        { source: '/images/:path*', destination: `${remote}/images/:path*` },
      ],
    };
  },
};

export default nextConfig;


// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactCompiler: true,
//   trailingSlash: false,
//   images: {
//     remotePatterns: [
//       { protocol: 'https', hostname: '**' },
//       { protocol: 'http', hostname: '**' },
//     ],
//     formats: ['image/avif', 'image/webp'],
//   },
// };

// export default nextConfig;
