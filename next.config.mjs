/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  trailingSlash: false,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    'localhost:3000',
    '127.0.0.1:3000',
  ],

  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    nodeMiddleware: true,
  },
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