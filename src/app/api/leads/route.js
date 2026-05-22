import { NextResponse } from 'next/server';
import { col, nowIso } from '@/lib/db';

function reEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export async function GET(request) {
    try {
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
        return NextResponse.json({ success: true, data: { _id: String(result.insertedId) } }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
