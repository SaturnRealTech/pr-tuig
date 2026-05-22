import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { requirePermission } from '@/lib/authHelper';
import { invalidateTokenCache } from '@/lib/google/auth';
import { redirectUri } from '@/lib/google/oauth';

const TYPE = 'brand';

const SECRET_MASK = '__keep__';

async function readBlob() {
    const settings = await col('settings');
    const row = await settings.findOne({ type: TYPE });
    return row?.data || {};
}

function redact(google) {
    if (!google) return {
        serviceAccount: null,
        searchConsole: { siteUrl: '' },
        analytics: { propertyId: '' },
        oauth: { clientId: '', hasClientSecret: false, connected: false, userEmail: '', connectedAt: '', scope: '' },
        redirectUri: redirectUri(),
    };
    const sa = google.serviceAccount || null;
    const o = google.oauth || {};
    return {
        serviceAccount: sa
            ? {
                client_email: sa.client_email || '',
                project_id: sa.project_id || '',
                private_key_id: sa.private_key_id || '',
                has_private_key: !!sa.private_key,
            }
            : null,
        searchConsole: { siteUrl: google.searchConsole?.siteUrl || '' },
        analytics: { propertyId: google.analytics?.propertyId || '' },
        oauth: {
            clientId: o.clientId || '',
            hasClientSecret: !!o.clientSecret,
            connected: !!o.refreshToken,
            userEmail: o.userEmail || '',
            connectedAt: o.connectedAt || '',
            scope: o.scope || '',
        },
        redirectUri: redirectUri(),
    };
}

export async function GET() {
    try {
        const blob = await readBlob();
        return NextResponse.json({ success: true, data: redact(blob.google) });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json();
        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        const prev = blob.google || {};

        // Service account: accept pasted JSON (string) OR an object. Validate
        // minimum fields. The client may send PRIVATE_KEY_MASK to indicate
        // "keep the stored key as-is" while editing other fields.
        let serviceAccount = prev.serviceAccount || null;
        const inSa = body.serviceAccount;
        if (inSa === null) {
            serviceAccount = null;
        } else if (typeof inSa === 'string' && inSa.trim()) {
            let parsed;
            try { parsed = JSON.parse(inSa); }
            catch { return NextResponse.json({ success: false, error: 'Service account JSON is not valid JSON.' }, { status: 400 }); }
            if (!parsed.client_email || !parsed.private_key) {
                return NextResponse.json({ success: false, error: 'Service account JSON must contain client_email and private_key.' }, { status: 400 });
            }
            serviceAccount = {
                client_email: String(parsed.client_email),
                private_key: String(parsed.private_key),
                project_id: String(parsed.project_id || ''),
                private_key_id: String(parsed.private_key_id || ''),
            };
        } else if (inSa && typeof inSa === 'object') {
            const next = { ...serviceAccount };
            if (typeof inSa.client_email === 'string') next.client_email = inSa.client_email;
            if (typeof inSa.project_id === 'string') next.project_id = inSa.project_id;
            if (typeof inSa.private_key_id === 'string') next.private_key_id = inSa.private_key_id;
            if (typeof inSa.private_key === 'string' && inSa.private_key !== SECRET_MASK) {
                next.private_key = inSa.private_key;
            }
            serviceAccount = next;
        }

        const searchConsole = {
            siteUrl: String(body.searchConsole?.siteUrl ?? prev.searchConsole?.siteUrl ?? '').trim(),
        };
        const analytics = {
            propertyId: String(body.analytics?.propertyId ?? prev.analytics?.propertyId ?? '').trim(),
        };

        // OAuth client id / secret. Pass SECRET_MASK as clientSecret to keep
        // the stored secret while editing the client id.
        const oauth = { ...(prev.oauth || {}) };
        if (body.oauth) {
            if (typeof body.oauth.clientId === 'string') oauth.clientId = body.oauth.clientId.trim();
            if (typeof body.oauth.clientSecret === 'string' && body.oauth.clientSecret !== SECRET_MASK) {
                oauth.clientSecret = body.oauth.clientSecret.trim();
            }
        }

        blob.google = { serviceAccount, searchConsole, analytics, oauth };

        const now = nowIso();
        const payload = { data: blob, updatedAt: now };
        if (!existing) payload.createdAt = now;
        await upsertByKey('settings', 'type', TYPE, payload);

        invalidateTokenCache();

        return NextResponse.json({ success: true, data: redact(blob.google) });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
