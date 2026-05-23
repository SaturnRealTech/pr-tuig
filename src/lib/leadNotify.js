// Lead-submission fan-out: plain-text email alert to the sales inbox + a
// POST to a Google Apps Script webhook that appends a row to a Google Sheet.
//
// Both legs are fire-and-forget — the caller should NOT await these. Anything
// they throw is swallowed and logged so a flaky SMTP host / Apps Script
// outage can never break the lead-insert path.
//
// Config sources, in priority order:
//   1. Brand settings  (settings.brand.data — set via /admin/dashboard)
//   2. .env            (LEADS_SHEET_URL, LEADS_RECIPIENT_EMAIL)

import nodemailer from 'nodemailer';
import { col } from '@/lib/db';

const FALLBACK_RECIPIENT = 'saturnrealconleads@gmail.com';

async function readBrand() {
    try {
        const settings = await col('settings');
        const row = await settings.findOne({ type: 'brand' });
        return row?.data || {};
    } catch { return {}; }
}

function indianDateTime() {
    const now = new Date();
    const fmt = (opts) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', ...opts }).format(now);
    return {
        date: fmt({ year: 'numeric', month: 'long', day: 'numeric' }),
        time: fmt({ hour: 'numeric', minute: '2-digit', hour12: true }),
    };
}

// Pooled lead transporter — built once per server process. Env vars win; if
// they're missing we fall back to brand settings so the admin UI still works.
let cachedTransporter = null;
let cachedFromAddr = null;
async function getLeadTransporter() {
    if (cachedTransporter) return { transporter: cachedTransporter, fromAddr: cachedFromAddr };
    const host = process.env.LEADS_SMTP_HOST;
    const user = process.env.LEADS_SMTP_USER;
    const pass = process.env.LEADS_SMTP_PASS;
    if (host && user && pass) {
        cachedTransporter = nodemailer.createTransport({
            host,
            port: parseInt(process.env.LEADS_SMTP_PORT || '587', 10),
            secure: String(process.env.LEADS_SMTP_SECURE || 'false').toLowerCase() === 'true',
            auth: { user, pass },
            pool: true,
            maxConnections: 2,
            maxMessages: 100,
            rateDelta: 1000,
            rateLimit: 5,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 20000,
            tls: { minVersion: 'TLSv1.2' },
        });
        const fromName = process.env.LEADS_MAIL_FROM_NAME || 'Leads';
        const fromEmail = process.env.LEADS_MAIL_FROM || user;
        cachedFromAddr = `"${fromName}" <${fromEmail}>`;
        return { transporter: cachedTransporter, fromAddr: cachedFromAddr };
    }
    // Fallback: build from brand settings (legacy path, no pooling).
    const brand = await readBrand();
    if (!brand.smtpHost || !brand.smtpUser || !brand.smtpPass) return { transporter: null, fromAddr: null };
    const t = nodemailer.createTransport({
        host: brand.smtpHost,
        port: parseInt(brand.smtpPort || '465', 10),
        secure: brand.smtpSecure !== false,
        auth: { user: brand.smtpUser, pass: brand.smtpPass },
    });
    const fromName = brand.mailFromName || brand.siteName || 'Leads';
    const fromEmail = brand.mailFrom || brand.smtpUser;
    return { transporter: t, fromAddr: `"${fromName}" <${fromEmail}>` };
}

// Send the plain-text lead alert. Lead shape mirrors the leads collection doc.
export async function sendLeadEmail(lead = {}, meta = {}) {
    try {
        const { transporter, fromAddr } = await getLeadTransporter();
        if (!transporter) {
            console.warn('[leadNotify] SMTP not configured — skipping email');
            return;
        }

        const brand = await readBrand();
        const { date, time } = indianDateTime();
        const toEmail = process.env.LEADS_RECIPIENT_EMAIL || brand.mailTo || FALLBACK_RECIPIENT;

        const subjectName = lead.name || lead.email || lead.mobileNumber || 'Unknown';
        const subjectPrefix = brand.mailSubject ? `${brand.mailSubject}: ` : '';
        const subject = `${subjectPrefix}New Lead: ${subjectName}`;

        const body = [
            `Name: ${lead.name || ''}`,
            `Email: ${lead.email || ''}`,
            `Mobile Number: ${lead.mobileNumber || ''}`,
            lead.project ? `Project: ${lead.project}` : null,
            lead.source ? `Source: ${lead.source}` : null,
            '',
            '---',
            '',
            `Date: ${date}`,
            `Time: ${time}`,
            `Page URL: ${meta.pageUrl || ''}`,
            `User Agent: ${meta.userAgent || ''}`,
            `Remote IP: ${meta.remoteIP || ''}`,
            lead.message ? `\nMessage: ${lead.message}` : null,
        ].filter(Boolean).join('\n');

        await transporter.sendMail({
            from: fromAddr,
            replyTo: lead.email || undefined,
            to: toEmail,
            subject,
            text: body,
        });
    } catch (err) {
        console.error('[leadNotify] Email send failed:', err.message);
    }
}

// POST the lead to the Google Apps Script webhook (which appends a row to a
// Google Sheet). The webhook expects multipart form-data with an
// `e_gs_SheetName` field identifying the destination tab.
export async function pushLeadToSheet(lead = {}, meta = {}) {
    try {
        const brand = await readBrand();
        const url = brand.leadsSheetUrl || process.env.LEADS_SHEET_URL;
        if (!url) {
            console.warn('[leadNotify] LEADS_SHEET_URL not configured — skipping sheet push');
            return;
        }

        const { date, time } = indianDateTime();
        const form = new FormData();
        // The values pushed here mirror the Express integration the user
        // confirmed works in production — column headers in the sheet must
        // match these keys.
        form.append('Name', lead.name || '');
        form.append('E-mail', lead.email || '');
        form.append('Mobile Number', lead.mobileNumber || '');
        if (lead.project) form.append('Project', lead.project);
        if (lead.source) form.append('Source', lead.source);
        if (lead.message) form.append('Message', lead.message);
        form.append('Page URL', meta.pageUrl || '');
        form.append('Date', `'${date}`);
        form.append('Time', `'${time}`);
        form.append('Remote IP', meta.remoteIP || '');
        form.append('User Agent', meta.userAgent || '');
        form.append('form_id', lead.form_id || 'nextjs_lead');
        form.append('form_name', lead.form_name || lead.source || 'Lead Form');
        form.append('e_gs_SheetName', brand.leadsSheetTab || 'New Form');

        const res = await fetch(url, { method: 'POST', body: form });
        if (!res.ok) {
            console.warn('[leadNotify] Sheet webhook returned', res.status);
        }
    } catch (err) {
        console.error('[leadNotify] Sheet push failed:', err.message);
    }
}

// Convenience: fire both side-effects without awaiting. Caller responds to the
// browser immediately while these run in the background.
export function notifyLead(lead, meta) {
    // Intentionally not awaited.
    sendLeadEmail(lead, meta);
    pushLeadToSheet(lead, meta);
}
