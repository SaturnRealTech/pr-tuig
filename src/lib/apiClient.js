// Client-side fetch helper for admin save flows.
//
// Two problems it solves:
//   1. `await res.json()` on a non-JSON response (typically the host's WAF
//      returning a plain "Forbidden" string) throws an opaque parse error.
//      We catch that, read the body as text, and surface a useful message.
//   2. Some hosts (Hostinger LiteSpeed mod_security) deep-inspect PUT/PATCH
//      and let POST through. We can transparently retry as POST with
//      `X-HTTP-Method-Override` when the first attempt returns non-JSON.

async function readBody(res) {
    const text = await res.text().catch(() => '');
    try { return { json: text ? JSON.parse(text) : null, text }; }
    catch { return { json: null, text }; }
}

function describeNonJson(res, text) {
    const body = (text || '').trim().slice(0, 200);
    const status = res.status;
    if (status === 403 || /forbidden/i.test(body)) {
        return `Blocked by your host's web-application firewall (HTTP 403). Verify public/.htaccess is on the server and SecRuleEngine is Off for /api/*. Body: "${body}"`;
    }
    if (status === 413) return `Payload too large (HTTP 413). Bump LimitRequestBody in .htaccess or split the save.`;
    if (status === 502 || status === 503 || status === 504) return `Gateway error (HTTP ${status}). Server / MongoDB is slow or down. Body: "${body}"`;
    return `Server returned non-JSON (HTTP ${status}): "${body}"`;
}

// Base64-encode a UTF-8 string (browser-safe; no deprecated unescape).
function b64encodeUtf8(s) {
    if (typeof btoa === 'function' && typeof TextEncoder !== 'undefined') {
        const bytes = new TextEncoder().encode(s);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
    }
    return Buffer.from(s, 'utf-8').toString('base64');
}

// Core fetcher. Returns parsed JSON or throws an Error with a useful message.
//
// Retry ladder when the server returns non-JSON (typically WAF "Forbidden"):
//   1. Original method (PUT/PATCH/DELETE) with normal JSON body.
//   2. POST + X-HTTP-Method-Override header (bypasses verb-based WAF rules).
//   3. POST + X-HTTP-Method-Override + base64-wrapped body + X-Body-Encoding
//      header (bypasses content-based WAF rules — the body is opaque bytes).
export async function apiFetch(url, { method = 'GET', body, headers = {}, fallbackPost = true } = {}) {
    const isWrite = method !== 'GET' && method !== 'HEAD';
    const jsonBody = body !== undefined
        ? (typeof body === 'string' ? body : JSON.stringify(body))
        : undefined;

    const baseInit = {
        method,
        headers: { ...(isWrite ? { 'Content-Type': 'application/json' } : {}), ...headers },
        ...(jsonBody !== undefined ? { body: jsonBody } : {}),
    };

    let res = await fetch(url, baseInit);
    let parsed = await readBody(res);
    if (parsed.json) return { ok: res.ok, status: res.status, data: parsed.json };

    if (!fallbackPost || !['PUT', 'PATCH', 'DELETE'].includes(method)) {
        throw new Error(describeNonJson(res, parsed.text));
    }

    // Tier 2 — POST with method override, JSON body.
    res = await fetch(url, {
        method: 'POST',
        headers: { ...baseInit.headers, 'X-HTTP-Method-Override': method },
        ...(jsonBody !== undefined ? { body: jsonBody } : {}),
    });
    parsed = await readBody(res);
    if (parsed.json) return { ok: res.ok, status: res.status, data: parsed.json };

    // Tier 3 — POST with method override + base64-encoded body. The WAF can't
    // pattern-match the body content; the server reads X-Body-Encoding and
    // decodes before JSON-parsing.
    if (jsonBody !== undefined) {
        res = await fetch(url, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/octet-stream',
                'X-HTTP-Method-Override': method,
                'X-Body-Encoding': 'base64',
            },
            body: b64encodeUtf8(jsonBody),
        });
        parsed = await readBody(res);
        if (parsed.json) return { ok: res.ok, status: res.status, data: parsed.json };
    }

    throw new Error(describeNonJson(res, parsed.text));
}
