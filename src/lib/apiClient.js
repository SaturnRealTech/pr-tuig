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

// Core fetcher. Returns parsed JSON or throws an Error with a useful message.
export async function apiFetch(url, { method = 'GET', body, headers = {}, fallbackPost = true } = {}) {
    const isWrite = method !== 'GET' && method !== 'HEAD';
    const init = {
        method,
        headers: { ...(isWrite ? { 'Content-Type': 'application/json' } : {}), ...headers },
        ...(body !== undefined ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
    };

    let res = await fetch(url, init);
    let parsed = await readBody(res);

    // If the body wasn't JSON and the method is PUT/PATCH/DELETE, transparently
    // retry as POST with X-HTTP-Method-Override. Many WAFs only deep-inspect
    // mutating verbs other than POST.
    if (!parsed.json && fallbackPost && ['PUT', 'PATCH', 'DELETE'].includes(method)) {
        const retry = await fetch(url, {
            ...init,
            method: 'POST',
            headers: { ...init.headers, 'X-HTTP-Method-Override': method },
        });
        const retryParsed = await readBody(retry);
        if (retryParsed.json) return { ok: retry.ok, status: retry.status, data: retryParsed.json };
        res = retry; parsed = retryParsed;
    }

    if (!parsed.json) {
        throw new Error(describeNonJson(res, parsed.text));
    }

    return { ok: res.ok, status: res.status, data: parsed.json };
}
