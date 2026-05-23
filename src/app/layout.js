import "./globals.css";
import { Suspense } from 'react';
import { col } from '@/lib/db';
import SettingsProvider from '@/components/SettingsProvider';
import EnquireNowProvider from '@/components/EnquireNowProvider';
import AnalyticsTracker from '@/components/AnalyticsTracker';
import { buildLocalBusinessSchema } from '@/lib/localSeo';
import { readWebmasterTools, buildVerificationMetas } from '@/lib/webmasterTools';
import { Inter, Playfair_Display } from "next/font/google";
export const dynamic = 'force-dynamic';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tangledupingreen.in';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: "SaturnRealcon — Launch Your SaaS in 45 Days | Fixed Scope, Fixed Timeline",

  description:
    "SaturnRealcon is a 45-day SaaS launch system for serious founders. We design, build, and deploy production-ready SaaS products with a fixed scope and fixed timeline — no delays, no chaos.",

  keywords: [
    "SaturnRealcon",
    "Launch Your SaaS in 45 Days",
    "45 Day SaaS Launch",
    "SaaS MVP Development",
    "B2B SaaS Development",
    "AI SaaS Development",
    "Startup MVP Launch",
    "Productized SaaS Development",
    "Fast SaaS Launch",
    "Fixed Scope Development",
    "Startup Product Development",
    "SaaS Builders",
    "SaaS for Founders",
  ],

  alternates: {
    canonical: `${SITE_URL}/`,
  },

  openGraph: {
    title: "SaturnRealcon — Launch Your SaaS in 45 Days",
    description:
      "A fixed-scope, fixed-timeline SaaS launch system for founders who want speed without chaos. Launch Your SaaS in 45 Days.",
    url: `${SITE_URL}/`,
    siteName: "SaturnRealcon",
    type: "website",
    images: [
      {
        url: `${SITE_URL}/logos/SaturnRealcon.png`,
        width: 1200,
        height: 630,
        alt: "SaturnRealcon — 45-Day SaaS Launch System",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "SaturnRealcon",
    description:
      "A 45-day SaaS launch system built for founders who value speed, clarity, and execution.",
    images: [`${SITE_URL}/logos/SaturnRealcon.png`],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/qwikly.png", sizes: "32x32", type: "image/png" },
      { url: "/qwikly.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/qwikly.png", sizes: "180x180" }],
  },

  manifest: "/site.webmanifest",
};


const THEME_DEFAULTS = {
  themeBackground: '#f7f5ef',
  themeForeground: '#14241b',
  themeLeaf: '#1f5d3a',
  themeMoss: '#244a36',
  themeForest: '#0f2a1e',
  themeBark: '#3a2a1c',
  themeGold: '#c8a96a',
  themeCream: '#f1ead7',
};

async function getSettings() {
  try {
    const settings = await col('settings');
    const row = await settings.findOne({ type: 'brand' });
    const doc = row?.data || {};
    return {
      primary: doc.primaryColor || '#b27e02',
      primaryDark: doc.primaryDark || '#8a6002',
      primaryLight: doc.primaryLight || '#d4a030',
      headerScrollBg: doc.headerScrollBg || '#ffffff',
      themeBackground: doc.themeBackground || THEME_DEFAULTS.themeBackground,
      themeForeground: doc.themeForeground || THEME_DEFAULTS.themeForeground,
      themeLeaf: doc.themeLeaf || THEME_DEFAULTS.themeLeaf,
      themeMoss: doc.themeMoss || THEME_DEFAULTS.themeMoss,
      themeForest: doc.themeForest || THEME_DEFAULTS.themeForest,
      themeBark: doc.themeBark || THEME_DEFAULTS.themeBark,
      themeGold: doc.themeGold || THEME_DEFAULTS.themeGold,
      themeCream: doc.themeCream || THEME_DEFAULTS.themeCream,
      siteName: doc.siteName || '',
      siteLogo: doc.siteLogo || '',
      favicon: doc.favicon || '',
      contactPhone: doc.contactPhone || '',
      whatsappNumber: doc.whatsappNumber || '',
      cinNumber: doc.cinNumber || '',
      copyrightText: doc.copyrightText || '',
      footerTagline: doc.footerTagline || '',
      footerDescription: doc.footerDescription || '',
      footerTrustText: doc.footerTrustText || '',
    };
  } catch {
    return { primary: '#b27e02', primaryDark: '#8a6002', primaryLight: '#d4a030', headerScrollBg: '#ffffff', ...THEME_DEFAULTS, siteName: '', siteLogo: '', favicon: '', contactPhone: '', whatsappNumber: '', cinNumber: '', copyrightText: '', footerTagline: '', footerDescription: '', footerTrustText: '' };
  }
}

function faviconMime(url) {
  const ext = String(url || '').split('?')[0].split('.').pop().toLowerCase();
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'ico') return 'image/x-icon';
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return undefined;
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  const localBusinessSchema = await buildLocalBusinessSchema(SITE_URL);
  const webmasterTools = await readWebmasterTools();
  const verificationMetas = buildVerificationMetas(webmasterTools);
  return (
    <html lang="en"

      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{--primary:${settings.primary};--primary-dark:${settings.primaryDark};--primary-light:${settings.primaryLight};--background:${settings.themeBackground};--foreground:${settings.themeForeground};--leaf:${settings.themeLeaf};--moss:${settings.themeMoss};--forest:${settings.themeForest};--bark:${settings.themeBark};--gold:${settings.themeGold};--cream:${settings.themeCream};}` }} />
        {verificationMetas.map((attrs, i) => <meta key={`wt-${i}`} {...attrs} />)}
        {settings.favicon && (
          <>
            <link rel="icon" href={settings.favicon} type={faviconMime(settings.favicon)} />
            <link rel="shortcut icon" href={settings.favicon} type={faviconMime(settings.favicon)} />
            <link rel="apple-touch-icon" href={settings.favicon} />
          </>
        )}
        {localBusinessSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          />
        )}
      </head>
      <body className="antialiased">
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <SettingsProvider settings={{ siteName: settings.siteName, siteLogo: settings.siteLogo, contactPhone: settings.contactPhone, whatsappNumber: settings.whatsappNumber, cinNumber: settings.cinNumber, copyrightText: settings.copyrightText, footerTagline: settings.footerTagline, footerDescription: settings.footerDescription, footerTrustText: settings.footerTrustText, headerScrollBg: settings.headerScrollBg }}>
          <EnquireNowProvider>
            {children}
          </EnquireNowProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
