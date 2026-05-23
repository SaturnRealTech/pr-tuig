import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/authHelper';
import { col, upsertByKey, nowIso } from '@/lib/db';
import { setLeadsPassword } from '@/lib/leadsLock';

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
                // Leads vault status. The actual hash/salt are never sent
                // back — only whether a password is configured.
                leadsPasswordConfigured: !!(doc.leadsPasswordHash && doc.leadsSalt),
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const guard = await requirePermission(request, 'settings', 'edit');
    if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
    try {
        const body = await request.json();

        // Whitelist of brand fields the dashboard owns. Anything outside this
        // list (imageSeo, localSeo, permissions, etc.) is left alone.
        const KNOWN_FIELDS = [
            'primaryColor', 'primaryDark', 'primaryLight',
            'headerScrollBg',
            'themeBackground', 'themeForeground', 'themeLeaf', 'themeMoss',
            'themeForest', 'themeBark', 'themeGold', 'themeCream',
            'indexNowKey',
            'siteName', 'siteLogo', 'favicon',
            'contactPhone', 'whatsappNumber', 'cinNumber',
            'copyrightText', 'footerTagline', 'footerDescription', 'footerTrustText',
            'smtpHost', 'smtpPort', 'smtpSecure',
            'smtpUser', 'smtpPass',
            'mailFromName', 'mailFrom', 'mailTo', 'mailSubject',
        ];

        // PARTIAL merge: only fields the client actually sent get applied.
        // Previously, missing fields were defaulted to '' (e.g. siteLogo: body.siteLogo || ''),
        // which silently wiped logo/favicon/etc. when "Save Colors" only sent colors.
        const blob = {};
        for (const k of KNOWN_FIELDS) {
            if (Object.prototype.hasOwnProperty.call(body, k)) blob[k] = body[k];
        }

        // Merge into the existing blob so sub-features (imageSeo, localSeo,
        // videoSitemap, sitemap, google, permissions, ...) and any fields
        // not in this request's body survive the save.
        const existingBlob = await readBrand();
        const merged = { ...existingBlob, ...blob };

        // Leads vault password — only updated when the admin actually typed
        // something. Empty / undefined leaves the existing hash alone so a
        // routine brand save doesn't clobber it.
        if (typeof body.leadsPassword === 'string' && body.leadsPassword.length > 0) {
            const { leadsPasswordHash, leadsSalt } = await setLeadsPassword(body.leadsPassword);
            merged.leadsPasswordHash = leadsPasswordHash;
            merged.leadsSalt = leadsSalt;
        } else if (body.leadsPassword === null) {
            // Explicit null = remove the gate.
            delete merged.leadsPasswordHash;
            delete merged.leadsSalt;
        }
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
