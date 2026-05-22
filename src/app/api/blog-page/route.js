import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { col, upsertByKey, nowIso } from '@/lib/db';

export async function GET() {
    try {
        const pages = await col('pages');
        const row = await pages.findOne({ type: 'blog' });
        const doc = row ? { ...row, ...(row.data || {}) } : {};
        return NextResponse.json({ success: true, data: doc });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    const guard = await requirePermission(request, 'pages', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json();
        const dataBlob = {
            desktopBanner: body.desktopBanner || '',
            desktopBannerAlt: body.desktopBannerAlt || '',
            mobileBanner: body.mobileBanner || '',
            mobileBannerAlt: body.mobileBannerAlt || '',
            bannerTitle: body.bannerTitle || '',
            bannerDescription: body.bannerDescription || '',
            metaTitle: body.metaTitle || '',
            metaDescription: body.metaDescription || '',
            keywords: body.keywords || '',
        };

        const pages = await col('pages');
        const existing = await pages.findOne({ type: 'blog' }, { projection: { _id: 1 } });
        const payload = {
            data: dataBlob,
            metaTitle: body.metaTitle || '',
            metaDescription: body.metaDescription || '',
            updatedAt: nowIso(),
        };
        if (!existing) payload.createdAt = nowIso();
        await upsertByKey('pages', 'type', 'blog', payload);
        return NextResponse.json({ success: true, message: 'Blog page settings saved' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
