import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';

const TYPE = 'privacy';

export async function GET() {
    try {
        const pages = await col('pages');
        const row = await pages.findOne({ type: TYPE });
        return NextResponse.json({ success: true, data: row || { title: '', content: '' } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { title, content } = await request.json();
        const pages = await col('pages');
        const existing = await pages.findOne({ type: TYPE }, { projection: { _id: 1 } });
        const payload = { title: title || '', content: content || '', updatedAt: nowIso() };
        if (!existing) payload.createdAt = nowIso();
        await upsertByKey('pages', 'type', TYPE, payload);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
