import { NextResponse } from 'next/server';
import { col, upsertByKey, nowIso } from '@/lib/db';

const TYPE = 'brand';

async function readBrand() {
    const settings = await col('settings');
    const row = await settings.findOne({ type: TYPE });
    return row?.data || {};
}

export async function GET() {
    try {
        const doc = await readBrand();
        return NextResponse.json({
            success: true,
            data: {
                primaryColor: doc.primaryColor || '#b27e02',
                primaryDark: doc.primaryDark || '#8a6002',
                primaryLight: doc.primaryLight || '#d4a030',
                headerScrollBg: doc.headerScrollBg || '#ffffff',
                themeBackground: doc.themeBackground || '#f7f5ef',
                themeForeground: doc.themeForeground || '#14241b',
                themeLeaf: doc.themeLeaf || '#1f5d3a',
                themeMoss: doc.themeMoss || '#244a36',
                themeForest: doc.themeForest || '#0f2a1e',
                themeBark: doc.themeBark || '#3a2a1c',
                themeGold: doc.themeGold || '#c8a96a',
                themeCream: doc.themeCream || '#f1ead7',
                indexNowKey: doc.indexNowKey || '',
                siteName: doc.siteName || '',
                siteLogo: doc.siteLogo || '',
                favicon: doc.favicon || '',
                contactPhone: doc.contactPhone || '',
                whatsappNumber: doc.whatsappNumber || '',
                cinNumber: doc.cinNumber || '',
                copyrightText: doc.copyrightText || '',
                footerTagline: doc.footerTagline || '',
                footerDescription: doc.footerDescription || '',
                footerTrustText: doc.footerTrustText || '',
                smtpHost: doc.smtpHost || '',
                smtpPort: doc.smtpPort || '465',
                smtpSecure: doc.smtpSecure !== false,
                smtpUser: doc.smtpUser || '',
                smtpPass: doc.smtpPass || '',
                mailFromName: doc.mailFromName || '',
                mailFrom: doc.mailFrom || '',
                mailTo: doc.mailTo || '',
                mailSubject: doc.mailSubject || '',
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const blob = {
            primaryColor: body.primaryColor,
            primaryDark: body.primaryDark,
            primaryLight: body.primaryLight,
            headerScrollBg: body.headerScrollBg || '#ffffff',
            themeBackground: body.themeBackground || '#f7f5ef',
            themeForeground: body.themeForeground || '#14241b',
            themeLeaf: body.themeLeaf || '#1f5d3a',
            themeMoss: body.themeMoss || '#244a36',
            themeForest: body.themeForest || '#0f2a1e',
            themeBark: body.themeBark || '#3a2a1c',
            themeGold: body.themeGold || '#c8a96a',
            themeCream: body.themeCream || '#f1ead7',
            indexNowKey: body.indexNowKey || '',
            siteName: body.siteName || '',
            siteLogo: body.siteLogo || '',
            favicon: body.favicon || '',
            contactPhone: body.contactPhone || '',
            whatsappNumber: body.whatsappNumber || '',
            cinNumber: body.cinNumber || '',
            copyrightText: body.copyrightText || '',
            footerTagline: body.footerTagline || '',
            footerDescription: body.footerDescription || '',
            footerTrustText: body.footerTrustText || '',
            smtpHost: body.smtpHost || '',
            smtpPort: body.smtpPort || '465',
            smtpSecure: body.smtpSecure !== false,
            smtpUser: body.smtpUser || '',
            smtpPass: body.smtpPass || '',
            mailFromName: body.mailFromName || '',
            mailFrom: body.mailFrom || '',
            mailTo: body.mailTo || '',
            mailSubject: body.mailSubject || '',
        };

        // Merge into the existing blob so sub-features (imageSeo, localSeo,
        // videoSitemap, sitemap, google, permissions, ...) survive a brand save.
        const existingBlob = await readBrand();
        const merged = { ...existingBlob, ...blob };
        const settings = await col('settings');
        const existing = await settings.findOne({ type: TYPE }, { projection: { _id: 1 } });
        const payload = { data: merged, updatedAt: nowIso() };
        if (!existing) payload.createdAt = nowIso();
        await upsertByKey('settings', 'type', TYPE, payload);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
