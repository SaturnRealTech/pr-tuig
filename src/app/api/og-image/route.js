// On-demand OG image generator. Renders a branded 1200×630 PNG from a title,
// optional subtitle, and an optional watermark icon (play | gif).
//
// Used as the OG image fallback when a post / project has no hero image AND
// the type's `autogenerateImage` toggle is on in /admin/seo/titles-meta.
//
// URL: /api/og-image?title=Hello&subtitle=Saturn&watermark=play
//
// Cache-friendly: the URL fully determines the output, so a long
// public/immutable Cache-Control header is safe.

import { ImageResponse } from 'next/og';
import { col } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WIDTH = 1200;
const HEIGHT = 630;

async function loadBrand() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        return row?.data || {};
    } catch { return {}; }
}

// Inter font loaded once per process. Falls back to system fonts on fetch
// failure so the OG image still renders (just with less crisp typography).
let fontCachePromise = null;
function loadFonts() {
    if (fontCachePromise) return fontCachePromise;
    fontCachePromise = (async () => {
        try {
            const [regular, bold] = await Promise.all([
                fetch('https://github.com/rsms/inter/raw/v4.0/docs/font-files/Inter-Regular.ttf').then(r => {
                    if (!r.ok) throw new Error(`Inter Regular: HTTP ${r.status}`);
                    return r.arrayBuffer();
                }),
                fetch('https://github.com/rsms/inter/raw/v4.0/docs/font-files/Inter-Bold.ttf').then(r => {
                    if (!r.ok) throw new Error(`Inter Bold: HTTP ${r.status}`);
                    return r.arrayBuffer();
                }),
            ]);
            return [
                { name: 'Inter', data: regular, weight: 400, style: 'normal' },
                { name: 'Inter', data: bold, weight: 800, style: 'normal' },
            ];
        } catch (err) {
            console.warn('[og-image] Inter font load failed, falling back to system fonts:', err.message);
            return null;
        }
    })();
    return fontCachePromise;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const title = (searchParams.get('title') || 'Untitled').slice(0, 160);
    const subtitle = (searchParams.get('subtitle') || '').slice(0, 80);
    const watermark = searchParams.get('watermark') || 'off';

    const [brand, fonts] = await Promise.all([loadBrand(), loadFonts()]);
    const siteName = brand.siteName || 'Site';
    const themeGold = brand.themeGold || '#c8a96a';
    const themeForest = brand.themeForest || '#0f2a1e';
    const themeCream = brand.themeCream || '#f1ead7';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '80px',
                    background: `linear-gradient(135deg, ${themeForest} 0%, ${themeGold} 100%)`,
                    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
                    color: themeCream,
                    position: 'relative',
                }}
            >
                {/* Top row — site name + watermark overlay */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', opacity: 0.9 }}>
                        <div style={{
                            width: '44px', height: '44px', borderRadius: '12px',
                            background: themeGold, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '24px', fontWeight: 800, color: themeForest,
                        }}>
                            {(siteName[0] || 'S').toUpperCase()}
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.01em', display: 'flex' }}>
                            {siteName}
                        </div>
                    </div>
                    {watermark === 'play' ? <PlayBadge color={themeGold} bg={themeCream} /> : null}
                    {watermark === 'gif' ? <GifBadge color={themeGold} bg={themeCream} /> : null}
                </div>

                {/* Middle — big title block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1040px' }}>
                    <h1 style={{
                        fontSize: title.length > 60 ? '64px' : '78px',
                        lineHeight: 1.1,
                        margin: 0,
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        color: '#ffffff',
                        textShadow: '0 4px 30px rgba(0,0,0,0.35)',
                    }}>
                        {title}
                    </h1>
                    {subtitle ? (
                        <div style={{
                            fontSize: '30px',
                            opacity: 0.85,
                            fontWeight: 500,
                            color: themeCream,
                            display: 'flex',
                        }}>
                            {subtitle}
                        </div>
                    ) : null}
                </div>

                {/* Bottom accent */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.7 }}>
                    <div style={{ width: '64px', height: '4px', background: themeGold, borderRadius: '2px' }} />
                    <div style={{ fontSize: '20px', fontWeight: 600, color: themeCream, display: 'flex' }}>
                        {brand.footerTagline || 'Read more →'}
                    </div>
                </div>
            </div>
        ),
        {
            width: WIDTH,
            height: HEIGHT,
            // Pass Inter to satori; falls back to system fonts if the fetch
            // failed on this process's first call.
            ...(fonts ? { fonts } : {}),
            headers: {
                'Cache-Control': 'public, immutable, max-age=31536000, s-maxage=31536000',
            },
        }
    );
}

// Small, JSX-only badge components used as the optional watermark overlay.
function PlayBadge({ color, bg }) {
    return (
        <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
        }}>
            {/* Hand-built triangle so we don't depend on an external SVG. */}
            <div style={{
                width: 0, height: 0,
                borderTop: '18px solid transparent',
                borderBottom: '18px solid transparent',
                borderLeft: `28px solid ${color}`,
                marginLeft: '6px',
            }} />
        </div>
    );
}

function GifBadge({ color, bg }) {
    return (
        <div style={{
            padding: '10px 18px',
            borderRadius: '12px',
            background: bg,
            color,
            fontSize: '26px',
            fontWeight: 900,
            letterSpacing: '0.04em',
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
            display: 'flex',
        }}>
            GIF
        </div>
    );
}
