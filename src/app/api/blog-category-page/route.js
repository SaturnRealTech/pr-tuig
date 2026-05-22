import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';

const TYPE = 'blog-category-list';

export async function GET() {
    try {
        const pages = await col('pages');
        const row = await pages.findOne({ type: TYPE });
        const doc = row ? { ...row, ...(row.data || {}) } : {};
        return NextResponse.json({ success: true, data: doc });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const blob = {
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
        const existing = await pages.findOne({ type: TYPE }, { projection: { _id: 1 } });
        const payload = {
            data: blob,
            metaTitle: blob.metaTitle,
            metaDescription: blob.metaDescription,
            updatedAt: nowIso(),
        };
        if (!existing) payload.createdAt = nowIso();
        await upsertByKey('pages', 'type', TYPE, payload);
        return NextResponse.json({ success: true, message: 'Blog category page settings saved' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
