import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');
        const doc = await db.collection('pages').findOne({ type: 'blog' });
        return NextResponse.json({ success: true, data: doc || {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const {
            desktopBanner, desktopBannerAlt,
            mobileBanner, mobileBannerAlt,
            bannerTitle, bannerDescription,
            metaTitle, metaDescription, keywords,
        } = body;

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'Saturnrealcon');

        await db.collection('pages').updateOne(
            { type: 'blog' },
            {
                $set: {
                    type: 'blog',
                    desktopBanner: desktopBanner || '',
                    desktopBannerAlt: desktopBannerAlt || '',
                    mobileBanner: mobileBanner || '',
                    mobileBannerAlt: mobileBannerAlt || '',
                    bannerTitle: bannerTitle || '',
                    bannerDescription: bannerDescription || '',
                    metaTitle: metaTitle || '',
                    metaDescription: metaDescription || '',
                    keywords: keywords || '',
                    updatedAt: new Date(),
                },
            },
            { upsert: true }
        );

        return NextResponse.json({ success: true, message: 'Blog page settings saved' });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
