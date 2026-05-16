import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

async function getDb() {
    const client = await clientPromise;
    return client.db(process.env.DB_NAME || 'Saturnrealcon');
}

export async function GET() {
    try {
        const db = await getDb();
        const doc = await db.collection('settings').findOne({ type: 'brand' });
        return NextResponse.json({
            success: true,
            data: {
                primaryColor: doc?.primaryColor || '#b27e02',
                primaryDark: doc?.primaryDark || '#8a6002',
                primaryLight: doc?.primaryLight || '#d4a030',
                headerScrollBg: doc?.headerScrollBg || '#ffffff',
                siteName: doc?.siteName || '',
                siteLogo: doc?.siteLogo || '',
                contactPhone: doc?.contactPhone || '',
                whatsappNumber: doc?.whatsappNumber || '',
                cinNumber: doc?.cinNumber || '',
                copyrightText: doc?.copyrightText || '',
                footerTagline: doc?.footerTagline || '',
                footerDescription: doc?.footerDescription || '',
                footerTrustText: doc?.footerTrustText || '',
                smtpHost: doc?.smtpHost || '',
                smtpPort: doc?.smtpPort || '465',
                smtpSecure: doc?.smtpSecure !== false,
                smtpUser: doc?.smtpUser || '',
                smtpPass: doc?.smtpPass || '',
                mailFromName: doc?.mailFromName || '',
                mailFrom: doc?.mailFrom || '',
                mailTo: doc?.mailTo || '',
                mailSubject: doc?.mailSubject || '',
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const {
            primaryColor, primaryDark, primaryLight, headerScrollBg,
            siteName, siteLogo, contactPhone, whatsappNumber,
            cinNumber, copyrightText, footerTagline, footerDescription, footerTrustText,
            smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass,
            mailFromName, mailFrom, mailTo, mailSubject,
        } = body;
        const db = await getDb();
        await db.collection('settings').updateOne(
            { type: 'brand' },
            {
                $set: {
                    type: 'brand',
                    primaryColor, primaryDark, primaryLight,
                    headerScrollBg: headerScrollBg || '#ffffff',
                    siteName: siteName || '',
                    siteLogo: siteLogo || '',
                    contactPhone: contactPhone || '',
                    whatsappNumber: whatsappNumber || '',
                    cinNumber: cinNumber || '',
                    copyrightText: copyrightText || '',
                    footerTagline: footerTagline || '',
                    footerDescription: footerDescription || '',
                    footerTrustText: footerTrustText || '',
                    smtpHost: smtpHost || '',
                    smtpPort: smtpPort || '465',
                    smtpSecure: smtpSecure !== false,
                    smtpUser: smtpUser || '',
                    smtpPass: smtpPass || '',
                    mailFromName: mailFromName || '',
                    mailFrom: mailFrom || '',
                    mailTo: mailTo || '',
                    mailSubject: mailSubject || '',
                    updatedAt: new Date(),
                }
            },
            { upsert: true }
        );
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
