import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { col, nowIso } from '@/lib/db';

export async function GET() {
    try {
        const homepage = await col('homepage');
        const row = await homepage.findOne({});
        const doc = row?.data || {};
        return NextResponse.json({
            success: true,
            data: {
                homeWriteupTitle: doc.homeWriteupTitle || '',
                homeWriteup: doc.homeWriteup || '',
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const guard = await requirePermission(request, 'pages', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const { homeWriteupTitle, homeWriteup } = await request.json();
        const now = nowIso();

        const homepage = await col('homepage');
        const existing = await homepage.findOne({});
        const current = existing?.data || {};
        const merged = { ...current, homeWriteupTitle: homeWriteupTitle || '', homeWriteup: homeWriteup || '' };

        if (existing) {
            await homepage.updateOne({ _id: existing._id }, { $set: { data: merged, updatedAt: now } });
        } else {
            await homepage.insertOne({ data: merged, createdAt: now, updatedAt: now });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
