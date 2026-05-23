import { NextResponse } from 'next/server';
import { col, nowIso } from '@/lib/db';
import { notifyLead } from '@/lib/leadNotify';
import { requireAdminOnly } from '@/lib/authHelper';
import {
    readLeadsCrypto,
    lookupUnlockSession,
    readUnlockTokenFromRequest,
    encryptPayload,
} from '@/lib/leadsLock';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export async function GET(request) {
    const guard = requireAdminOnly(request);
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

    try {
        const { configured } = await readLeadsCrypto();
        let sessionKey = null;
        if (configured) {
            const token = readUnlockTokenFromRequest(request);
            const session = token ? await lookupUnlockSession(token) : null;
            if (!session) {
                return NextResponse.json(
                    { success: false, locked: true, configured: true, error: 'Leads vault is locked' },
                    { status: 401 },
                );
            }
            sessionKey = session.key;
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';
        const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10) || 100, 1), 1000);

        const filter = { $or: [{ type: null }, { type: 'lead' }, { type: { $exists: false } }] };
        if (status) filter.status = status;
        if (search) {
            const re = new RegExp(reEscape(search), 'i');
            filter.$and = [{ $or: [{ name: re }, { email: re }, { mobileNumber: re }, { project: re }] }];
        }

        const leads = await col('leads');
        const [total, data] = await Promise.all([
            leads.countDocuments(filter),
            leads.find(filter).sort({ submittedAt: -1, createdAt: -1 }).limit(limit).toArray(),
        ]);

        if (sessionKey) {
            // E2E: only ciphertext crosses the wire. The browser decrypts with
            // a key it derived from the password it already holds in memory.
            const { iv, ct } = encryptPayload(JSON.stringify({ data, total }), sessionKey);
            return NextResponse.json({ success: true, encrypted: true, iv, ct });
        }
        return NextResponse.json({ success: true, data, total });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const now = nowIso();
        const doc = { ...body, type: 'lead', status: 'new', submittedAt: now, createdAt: now };
        Object.keys(doc).forEach(k => { if (doc[k] === undefined) delete doc[k]; });
        const leads = await col('leads');
        const result = await leads.insertOne(doc);

        // Fan out to email + Google Sheet — fire-and-forget so a flaky SMTP
        // host or Apps Script outage can't break the lead capture.
        const meta = {
            pageUrl: body.pageUrl || request.headers.get('referer') || '',
            userAgent: request.headers.get('user-agent') || '',
            remoteIP: (request.headers.get('x-real-ip')
                || request.headers.get('x-forwarded-for')
                || '').toString().split(',')[0].trim(),
        };
        notifyLead(doc, meta);

        return NextResponse.json({ success: true, data: { _id: String(result.insertedId) } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
