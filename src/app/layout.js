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
  display: "optional",
  weight: ["400", "500", "600", "700"],
  adjustFontFallback: "Times New Roman",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://tangledupingreen.in';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// Default metadata for any page that doesn't ship its own `generateMetadata`.
// The homepage, project pages, and blog pages all override this — this only
// fires as the fallback (admin sub-pages, legal pages, 404, etc.) so it
// should track the brand settings, not project-specific copy.
export async function generateMetadata() {
  let siteName = '';
  let siteLogo = '';
  let favicon = '';
  let tagline = '';
  let description = '';
  try {
    const settings = await col('settings');
    const row = await settings.findOne({ type: 'brand' });
    const data = row?.data || {};
    siteName = data.siteName || '';
    siteLogo = data.siteLogo || '';
    favicon = data.favicon || '';
    tagline = data.footerTagline || '';
    description = data.footerDescription || tagline || '';
  } catch (e) {
    console.error('[layout.generateMetadata]', e.message);
  }

  const title = siteName
    ? (tagline ? `${siteName} — ${tagline}` : siteName)
    : 'Site';
  const ogImage = siteLogo || undefined;

  return {
    metadataBase: new URL(SITE_URL),
    // Plain default title — no template. Child pages that set their own
    // title render it verbatim (no "| <siteName>" appended). Pages that
    // don't set a title fall back to this default.
    title,
    description: description || undefined,
    alternates: { canonical: `${SITE_URL}/` },
    openGraph: {
      title,
      description: description || undefined,
      url: `${SITE_URL}/`,
      siteName: siteName || undefined,
      type: 'website',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description || undefined,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    // Favicon is also injected via <link> tags inside RootLayout (below) so
    // admins can swap it without a redeploy. Mirror it here so Next.js's
    // metadata API stays in sync.
    ...(favicon ? { icons: { icon: [{ url: favicon }], apple: [{ url: favicon }] } } : {}),
  };
}


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
