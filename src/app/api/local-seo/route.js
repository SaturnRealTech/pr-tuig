import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { DEFAULT_LOCAL_SEO, SCHEMA_TYPES, DAYS } from '@/lib/localSeo';
import { requirePermission } from '@/lib/authHelper';

const TYPE = 'brand';
const SCHEMA_SET = new Set(SCHEMA_TYPES);
const DAY_SET = new Set(DAYS.map(d => d.id));

async function readBlob() {
    const settings = await col('settings');
    const row = await settings.findOne({ type: TYPE });
    return row?.data || {};
}

function str(v) { return v == null ? '' : String(v).trim(); }

export async function GET() {
    try {
        const blob = await readBlob();
        const data = { ...DEFAULT_LOCAL_SEO, ...(blob.localSeo || {}) };
        data.address = { ...DEFAULT_LOCAL_SEO.address, ...(blob.localSeo?.address || {}) };
        data.geo = { ...DEFAULT_LOCAL_SEO.geo, ...(blob.localSeo?.geo || {}) };
        if (!Array.isArray(data.openingHours)) data.openingHours = [];
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json();
        const clean = { ...DEFAULT_LOCAL_SEO };

        clean.schemaType = SCHEMA_SET.has(body.schemaType) ? body.schemaType : DEFAULT_LOCAL_SEO.schemaType;
        for (const k of ['name', 'alternateName', 'legalName', 'description', 'url', 'email',
            'telephone', 'priceRange', 'foundingDate', 'logo', 'image', 'sameAs']) {
            clean[k] = str(body[k]);
        }

        clean.address = { ...DEFAULT_LOCAL_SEO.address };
        const addr = body.address || {};
        for (const k of Object.keys(DEFAULT_LOCAL_SEO.address)) clean.address[k] = str(addr[k]);

        clean.geo = { latitude: str(body.geo?.latitude), longitude: str(body.geo?.longitude) };

        clean.openingHours = Array.isArray(body.openingHours)
            ? body.openingHours
                .filter(h => h && typeof h === 'object' && DAY_SET.has(h.day))
                .map(h => ({
                    day: h.day,
                    closed: !!h.closed,
                    open: str(h.open),
                    close: str(h.close),
                }))
            : [];

        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE });
        const blob = existing?.data || {};
        blob.localSeo = clean;

        const now = nowIso();
        const payload = { data: blob, updatedAt: now };
        if (!existing) payload.createdAt = now;
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true, data: clean });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
