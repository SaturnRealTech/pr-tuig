// Dynamic per-site tracking-script manager.
//
// Storage: settings.brand.data.analyticsScripts.scripts = [{ id, label,
// code, position, enabled }]. The label is whatever the admin types
// ("GA4", "Meta Pixel", "Hotjar", "GTM"), the code is the raw HTML to
// inject (full <script>/<noscript>/<meta>), and `position` picks <head>
// or end-of-<body>.
//
// Quick-add presets are exposed so the admin can one-click prefill the
// label + code stub for GA4/GTM/Clarity/Ahrefs, then they paste the ID.

import { col } from '@/lib/db';

export const POSITIONS = ['head', 'body'];

// Quick-add stubs the admin can use to bootstrap a new row. The `code`
// includes `{{ID}}` placeholders that the admin replaces with their real ID
// after the row is inserted.
export const SCRIPT_PRESETS = [
    {
        key: 'gtm',
        label: 'Google Tag Manager (head)',
        position: 'head',
        code: `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->`,
    },
    {
        key: 'gtmBody',
        label: 'Google Tag Manager (body noscript)',
        position: 'body',
        code: `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`,
    },
    {
        key: 'ga4',
        label: 'Google Analytics 4',
        position: 'head',
        code: `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`,
    },
    {
        key: 'clarity',
        label: 'Microsoft Clarity',
        position: 'head',
        code: `<!-- Microsoft Clarity -->
<script>
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
</script>`,
    },
    {
        key: 'ahrefs',
        label: 'Ahrefs verification',
        position: 'head',
        code: `<meta name="ahrefs-site-verification" content="YOUR_AHREFS_TOKEN" />`,
    },
    {
        key: 'gsc',
        label: 'Google Search Console',
        position: 'head',
        code: `<meta name="google-site-verification" content="YOUR_GSC_TOKEN" />`,
    },
    {
        key: 'facebook',
        label: 'Meta (Facebook) Pixel',
        position: 'head',
        code: `<!-- Meta Pixel -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>`,
    },
    {
        key: 'custom',
        label: 'Custom (blank)',
        position: 'head',
        code: '',
    },
];

const DEFAULT_DATA = { scripts: [] };

export async function readAnalyticsScripts() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        const stored = row?.data?.analyticsScripts || {};
        return { scripts: Array.isArray(stored.scripts) ? stored.scripts : [] };
    } catch {
        return { ...DEFAULT_DATA };
    }
}

// Normalise the admin payload. Each script gets a stable id (assigned by
// the editor) so React can key + the layout can dedupe. Disabled rows are
// kept in storage but skipped by buildAnalyticsSnippets.
export function normaliseAnalytics(input = {}) {
    const arr = Array.isArray(input.scripts) ? input.scripts : [];
    const seen = new Set();
    const out = [];
    for (const item of arr.slice(0, 100)) { // hard cap so it can't be abused
        const id = String(item.id || '').trim().slice(0, 64) || randId();
        if (seen.has(id)) continue; // dedupe
        seen.add(id);
        out.push({
            id,
            label: String(item.label || '').trim().slice(0, 120),
            code: String(item.code || '').slice(0, 32768),
            position: POSITIONS.includes(item.position) ? item.position : 'head',
            enabled: item.enabled !== false,
        });
    }
    return { scripts: out };
}

function randId() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// Returns { head, body } — concatenated HTML ready for dangerouslySetInnerHTML.
// Disabled rows are filtered out; rows with empty code skipped.
export function buildAnalyticsSnippets(cfg) {
    const scripts = Array.isArray(cfg?.scripts) ? cfg.scripts : [];
    const head = [];
    const body = [];
    for (const s of scripts) {
        if (!s.enabled || !s.code || !s.code.trim()) continue;
        if (s.position === 'body') body.push(s.code);
        else head.push(s.code);
    }
    return { head: head.join('\n'), body: body.join('\n') };
}
