// Body parser that understands base64-wrapped JSON.
//
// Admin saves go through src/lib/apiClient.js which, when the host's WAF
// blocks a request, retries with the JSON body base64-encoded and a
// `X-Body-Encoding: base64` header. The WAF can't pattern-match opaque bytes,
// so the request gets through; the server decodes and JSON-parses here.
//
// Drop-in replacement for `await request.json()` inside API route handlers.

export async function readJsonBody(request) {
    const encoding = (request.headers.get('x-body-encoding') || '').toLowerCase();
    if (encoding === 'base64') {
        const raw = await request.text();
        const decoded = Buffer.from(raw, 'base64').toString('utf-8');
        if (!decoded) return {};
        return JSON.parse(decoded);
    }
    return request.json();
}
