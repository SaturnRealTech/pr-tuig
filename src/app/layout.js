import "./globals.css";
import clientPromise from '@/lib/mongodb';
import SettingsProvider from '@/components/SettingsProvider';
import EnquireNowProvider from '@/components/EnquireNowProvider';

export const dynamic = 'force-dynamic';

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
    title: "SaturnRealcon — Launch Your SaaS in 45 Days",
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


async function getSettings() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
    const doc = await db.collection('settings').findOne({ type: 'brand' });
    return {
      primary: doc?.primaryColor || '#b27e02',
      primaryDark: doc?.primaryDark || '#8a6002',
      primaryLight: doc?.primaryLight || '#d4a030',
      headerScrollBg: doc?.headerScrollBg || '#ffffff',
      siteName: doc?.siteName || '',
      siteLogo: doc?.siteLogo || '',
      contactPhone: doc?.contactPhone || '',
      whatsappNumber: doc?.whatsappNumber || '',
      cinNumber: doc?.cinNumber || '',
      copyrightText: doc?.copyrightText || '',
      footerTagline: doc?.footerTagline || '',
      footerDescription: doc?.footerDescription || '',
      footerTrustText: doc?.footerTrustText || '',
    };
  } catch {
    return { primary: '#b27e02', primaryDark: '#8a6002', primaryLight: '#d4a030', headerScrollBg: '#ffffff', siteName: '', siteLogo: '', contactPhone: '', whatsappNumber: '', cinNumber: '', copyrightText: '', footerTagline: '', footerDescription: '', footerTrustText: '' };
  }
}

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `:root{--primary:${settings.primary};--primary-dark:${settings.primaryDark};--primary-light:${settings.primaryLight};}` }} />

      </head>
      <body className="antialiased">
        <SettingsProvider settings={{ siteName: settings.siteName, siteLogo: settings.siteLogo, contactPhone: settings.contactPhone, whatsappNumber: settings.whatsappNumber, cinNumber: settings.cinNumber, copyrightText: settings.copyrightText, footerTagline: settings.footerTagline, footerDescription: settings.footerDescription, footerTrustText: settings.footerTrustText, headerScrollBg: settings.headerScrollBg }}>
          <EnquireNowProvider>
            {children}
          </EnquireNowProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
