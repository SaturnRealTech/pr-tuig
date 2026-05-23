/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  trailingSlash: false,
  // Explicit gzip/br on all server responses. Default is true, but spelling
  // it out keeps Lighthouse's "Enable text compression" audit happy and
  // documents the intent.
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
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
    // Trim the default device-size ladder. Each entry below 360px is wasted
    // (Galaxy S8+ logical width is 360px) and entries above 1920px mostly
    // serve desktop screenshots, not real users — fewer entries = smaller
    // srcset = faster client parse.
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    // Cache the /_next/image variants for ~30 days at the edge.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        // Next.js static build assets are content-hashed — safe to cache hard.
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Optimized images: long browser cache + edge revalidation.
        source: '/_next/image',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }],
      },
      {
        // Public site pages: short browser cache, longer edge cache, SWR.
        // Skips /api and /admin so the leads vault + form submissions stay
        // request-fresh.
        source: '/:path((?!api|admin).*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' }],
      },
    ];
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