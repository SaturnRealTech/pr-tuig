import { NextResponse } from 'next/server';
import { scanAllRecords, scanOne } from '@/lib/linkCounter';
import { requireAdmin } from '@/lib/authHelper';

export async function GET(request) {
    const authError = requireAdmin(request);
    if (authError) return NextResponse.json({ success: false, error: authError.error }, { status: authError.status });
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const id = searchParams.get('id');

        if (type && id) {
            const data = await scanOne(type, id);
            if (!data) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
            return NextResponse.json({ success: true, data });
        }

        const records = await scanAllRecords();
        const totals = records.reduce((acc, r) => ({
            internal: acc.internal + r.internal,
            external: acc.external + r.external,
            anchor: acc.anchor + r.anchor,
            total: acc.total + r.total,
        }), { internal: 0, external: 0, anchor: 0, total: 0 });

        return NextResponse.json({ success: true, data: { records, totals } });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
