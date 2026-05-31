import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { col, findOneByAnyId } from '@/lib/db';
import { getUserFromRequest, requirePermission } from '@/lib/authHelper';
import { logActivity } from '@/lib/activityLog';

const DEFAULT_APPROVER = 'santosh.saturnrealcon@gmail.com';

// Each entity type knows its own collection, permission scope, and URL
// builder. Adding another type (testimonial, page, etc.) is just a new entry.
const ENTITY_MAP = {
    project: {
        collection: 'projects',
        permission: 'projects',
        labelSingular: 'Page',
        defaultMessage: 'I have completed this page. Please check it, and if anything is wrong or any issue is found let me know — I will fix it right away.',
        pathFor: (row) => {
            if (!row) return '';
            if (row.isHomePage) return '/';
            const slug = row.slug || (row._id ? String(row._id) : '');
            return slug ? `/${slug}` : '';
        },
    },
    blog: {
        collection: 'blog_posts',
        permission: 'blog',
        labelSingular: 'Blog post',
        defaultMessage: 'I have completed this blog post. Please review it, and if anything is wrong or any issue is found let me know — I will fix it right away.',
        pathFor: (row) => {
            const slug = row?.slug || (row?._id ? String(row._id) : '');
            return slug ? `/blog/${slug}` : '';
        },
    },
    'blog-category': {
        collection: 'blog_categories',
        permission: 'blog',
        labelSingular: 'Blog category',
        defaultMessage: 'I have completed this blog category. Please review it, and if anything is wrong or any issue is found let me know — I will fix it right away.',
        pathFor: (row) => {
            const slug = row?.slug || (row?._id ? String(row._id) : '');
            return slug ? `/blog/category/${slug}` : '';
        },
    },
    category: {
        collection: 'categories',
        permission: 'blog',
        labelSingular: 'Category',
        defaultMessage: 'I have completed this category. Please review it, and if anything is wrong or any issue is found let me know — I will fix it right away.',
        pathFor: (row) => {
            const slug = row?.slug || (row?._id ? String(row._id) : '');
            return slug ? `/category/${slug}` : '';
        },
    },
};

async function readBrand() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        return row?.data || {};
    } catch { return {}; }
}

function isEmail(s) {
    return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function siteUrlFor(request, brand) {
    const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
    if (fromEnv) return fromEnv.replace(/\/$/, '');
    if (brand?.siteUrl) return String(brand.siteUrl).replace(/\/$/, '');
    try {
        const u = new URL(request.url);
        return `${u.protocol}//${u.host}`;
    } catch { return ''; }
}

// Escape a value for CSV (RFC 4180): wrap in quotes and double any internal
// quotes. Nested objects/arrays get stringified so the cell stays one column.
function csvCell(v) {
    if (v === null || v === undefined) return '';
    let s;
    if (typeof v === 'object') {
        try { s = JSON.stringify(v); } catch { s = String(v); }
    } else {
        s = String(v);
    }
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

// Flatten an entity into a two-column CSV (Field, Value). We deliberately
// don't recurse into nested structures — the JSON-encoded cell is enough for
// reviewers to glance at, and keeping it flat means Excel handles it cleanly.
function entityToCsv(row) {
    const lines = ['Field,Value'];
    const keys = Object.keys(row || {}).sort();
    for (const k of keys) {
        if (k === 'password') continue;
        lines.push(`${csvCell(k)},${csvCell(row[k])}`);
    }
    return lines.join('\r\n');
}

function safeFileSlug(s) {
    return String(s || 'data').replace(/[^a-z0-9-_]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'data';
}

export async function POST(request) {
    try {
        const body = await request.json().catch(() => ({}));
        const type = String(body?.type || '').trim();
        const id = String(body?.id || '').trim();
        const additional = Array.isArray(body?.additionalEmails) ? body.additionalEmails : [];
        const customMessage = typeof body?.message === 'string' ? body.message.trim() : '';

        const entity = ENTITY_MAP[type];
        if (!entity) {
            return NextResponse.json({ success: false, error: `Unknown type: ${type}` }, { status: 400 });
        }
        if (!id) {
            return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
        }

        // Permission gate keyed off the entity (so projects perms guard
        // projects, blog perms guard blogs + categories, etc.).
        const guard = await requirePermission(request, entity.permission, 'edit');
        if (guard) return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });

        const row = await findOneByAnyId(entity.collection, id);
        if (!row) {
            return NextResponse.json({ success: false, error: `${entity.labelSingular} not found` }, { status: 404 });
        }

        const caller = getUserFromRequest(request);
        let callerName = caller?.email || '';
        try {
            if (caller?.userId) {
                const u = await findOneByAnyId('users', caller.userId);
                if (u?.name) callerName = u.name;
            }
        } catch { /* fall back to email */ }

        // Resolve SMTP creds. Brand settings (saved via /admin/dashboard) take
        // precedence; if those aren't set, fall back to the LEADS_SMTP_*
        // env vars that the lead-alert transporter already uses. That way an
        // admin only has to configure SMTP in one place.
        const brand = await readBrand();
        const cfg = brand.smtpHost && brand.smtpUser && brand.smtpPass
            ? {
                host: brand.smtpHost,
                port: parseInt(brand.smtpPort || '465', 10),
                secure: brand.smtpSecure !== false,
                user: brand.smtpUser,
                pass: brand.smtpPass,
                fromName: brand.mailFromName || brand.siteName || 'Admin',
                fromEmail: brand.mailFrom || brand.smtpUser,
            }
            : process.env.LEADS_SMTP_HOST && process.env.LEADS_SMTP_USER && process.env.LEADS_SMTP_PASS
                ? {
                    host: process.env.LEADS_SMTP_HOST,
                    port: parseInt(process.env.LEADS_SMTP_PORT || '587', 10),
                    secure: String(process.env.LEADS_SMTP_SECURE || 'false').toLowerCase() === 'true',
                    user: process.env.LEADS_SMTP_USER,
                    pass: process.env.LEADS_SMTP_PASS,
                    fromName: process.env.LEADS_MAIL_FROM_NAME || brand.siteName || 'Admin',
                    fromEmail: process.env.LEADS_MAIL_FROM || process.env.LEADS_SMTP_USER,
                }
                : null;

        if (!cfg) {
            return NextResponse.json(
                { success: false, error: 'SMTP not configured. Set LEADS_SMTP_* in .env, or open Dashboard → Mail / SMTP.' },
                { status: 400 },
            );
        }

        const transporter = nodemailer.createTransport({
            host: cfg.host,
            port: cfg.port,
            secure: cfg.secure,
            auth: { user: cfg.user, pass: cfg.pass },
            tls: { minVersion: 'TLSv1.2' },
        });
        const fromAddr = `"${cfg.fromName}" <${cfg.fromEmail}>`;

        const validExtras = additional.map(s => String(s).trim()).filter(isEmail);
        const toList = Array.from(new Set([DEFAULT_APPROVER, ...validExtras]));
        const ccList = caller?.email && !toList.includes(caller.email) ? [caller.email] : [];

        const siteUrl = siteUrlFor(request, brand);
        const path = entity.pathFor(row);
        const pageUrl = path ? `${siteUrl}${path}` : siteUrl;
        const title = row.title || row.name || '(untitled)';

        const subject = `Approval request: ${entity.labelSingular} — ${title}`;

        const greeting = 'Hi,';
        const body1 = entity.defaultMessage;
        const detailsLines = [
            `${entity.labelSingular} name : ${title}`,
            `Page name              : ${title}`,
            `Page URL               : ${pageUrl || '(not available)'}`,
            `Sent by                : ${callerName || caller?.email || ''}`,
        ];
        const closing = `Thanks,\n${callerName || caller?.email || ''}`;

        const textBody = [
            greeting,
            '',
            body1,
            customMessage ? '' : null,
            customMessage || null,
            '',
            detailsLines.join('\n'),
            '',
            closing,
        ].filter(v => v !== null).join('\n');

        const escapeHtml = (s) => String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const htmlBody = `
            <div style="font-family:Arial,sans-serif;font-size:14px;color:#1f2937;line-height:1.6;max-width:560px">
                <p>${escapeHtml(greeting)}</p>
                <p>${escapeHtml(body1)}</p>
                ${customMessage ? `<p>${escapeHtml(customMessage)}</p>` : ''}
                <table cellpadding="6" cellspacing="0" style="margin-top:8px;border-collapse:collapse;font-size:14px">
                    <tr><td style="color:#6b7280;padding-right:14px">${escapeHtml(entity.labelSingular)} name</td><td>${escapeHtml(title)}</td></tr>
                    <tr><td style="color:#6b7280;padding-right:14px">Page name</td><td>${escapeHtml(title)}</td></tr>
                    <tr><td style="color:#6b7280;padding-right:14px">Page URL</td><td><a href="${escapeHtml(pageUrl)}" style="color:#b27e02">${escapeHtml(pageUrl || '(not available)')}</a></td></tr>
                    <tr><td style="color:#6b7280;padding-right:14px">Sent by</td><td>${escapeHtml(callerName || caller?.email || '')}</td></tr>
                </table>
                <p style="margin-top:16px;white-space:pre-wrap">${escapeHtml(closing)}</p>
            </div>
        `;

        // Attach the entity as CSV so reviewers can open it in Excel and
        // see every field at a glance.
        const csvText = entityToCsv(row);
        const fileSlug = safeFileSlug(row.slug || title);

        await transporter.sendMail({
            from: fromAddr,
            to: toList,
            cc: ccList.length > 0 ? ccList : undefined,
            replyTo: caller?.email || undefined,
            subject,
            text: textBody,
            html: htmlBody,
            attachments: [
                {
                    filename: `${type}-${fileSlug}.csv`,
                    content: csvText,
                    contentType: 'text/csv; charset=utf-8',
                },
            ],
        });

        await logActivity(request, {
            type: type === 'blog-category' ? 'blog' : type,
            action: 'edit',
            section: `Sent for approval (${entity.labelSingular})`,
            refId: String(row._id || id),
            refTitle: title,
            note: [`to: ${toList.join(', ')}`, ccList.length ? `cc: ${ccList.join(', ')}` : ''].filter(Boolean).join(' · '),
        });

        return NextResponse.json({
            success: true,
            data: { to: toList, cc: ccList, pageUrl },
        });
    } catch (error) {
        console.error('[send-approval]', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
