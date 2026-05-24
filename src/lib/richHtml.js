// Helpers that pre-process admin-pasted rich-text HTML before we set it as
// `dangerouslySetInnerHTML`. Currently does one thing: wraps every <table>
// in a horizontal-scroll <div> so wide pasted tables don't push the page
// sideways on mobile.

const TABLE_OPEN_RE = /<table\b/gi;
const TABLE_CLOSE_RE = /<\/table\s*>/gi;

// React helper: <RichHtml html="…" className="…" as="div" /> renders the
// HTML through wrapTablesForScroll first so every <table> becomes a
// horizontal-scroll <div>. Drop-in replacement for
//   <div className="rich-content" dangerouslySetInnerHTML={{ __html: x }} />.
export function RichHtml({ html, className, as: Tag = 'div', ...rest }) {
    return (
        <Tag
            {...rest}
            className={className}
            dangerouslySetInnerHTML={{ __html: wrapTablesForScroll(html || '') }}
        />
    );
}

// Wrap every <table>…</table> in <div class="rich-table-wrap">…</div>.
// Idempotent: a table that's already wrapped (e.g. from a previous save
// that ran through this helper, or a future server-side run) is left alone.
//
// Why a regex and not a DOM parser: the input is server-rendered already
// (dangerouslySetInnerHTML) and we want this to be cheap + run in any
// environment. The trade-off is that nested <table>s inside cells would
// get double-wrapped, but TipTap doesn't produce those.
export function wrapTablesForScroll(html) {
    if (!html || typeof html !== 'string') return html || '';
    if (!TABLE_OPEN_RE.test(html)) return html;
    TABLE_OPEN_RE.lastIndex = 0;

    // Skip if author/admin already wrapped them (avoid double-wrapping).
    if (/<div\s+class="rich-table-wrap"/.test(html)) return html;

    let out = html
        .replace(TABLE_OPEN_RE, '<div class="rich-table-wrap"><table')
        .replace(TABLE_CLOSE_RE, '</table></div>');
    TABLE_OPEN_RE.lastIndex = 0;
    TABLE_CLOSE_RE.lastIndex = 0;
    return out;
}
