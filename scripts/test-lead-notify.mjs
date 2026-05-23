#!/usr/bin/env node
// Smoke test for the lead fan-out — exercises the exact SMTP config + Apps
// Script URL the runtime uses so failures surface here instead of being
// swallowed by the fire-and-forget call site.

import 'dotenv/config';
import nodemailer from 'nodemailer';

const host = process.env.LEADS_SMTP_HOST;
const port = parseInt(process.env.LEADS_SMTP_PORT || '587', 10);
const secure = String(process.env.LEADS_SMTP_SECURE || 'false').toLowerCase() === 'true';
const user = process.env.LEADS_SMTP_USER;
const pass = process.env.LEADS_SMTP_PASS;
const fromName = process.env.LEADS_MAIL_FROM_NAME || 'Leads';
const fromEmail = process.env.LEADS_MAIL_FROM || user;
const toEmail = process.env.LEADS_RECIPIENT_EMAIL || 'saturnrealconleads@gmail.com';
const sheetUrl = process.env.LEADS_SHEET_URL;

if (!host || !user || !pass) {
    console.error('LEADS_SMTP_* env vars missing — abort.');
    process.exit(1);
}

console.log('1/2 verifying SMTP connection to', host, port, secure ? '(secure)' : '(STARTTLS)');
const transporter = nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 2, maxMessages: 100,
    rateDelta: 1000, rateLimit: 5,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    tls: { minVersion: 'TLSv1.2' },
});

try {
    await transporter.verify();
    console.log('    SMTP verify OK');
} catch (e) {
    console.error('    SMTP verify FAILED:', e.message);
    process.exit(2);
}

const body = `Name: Probe Lead
Email: probe@example.com
Mobile Number: 7777777777
Source: leadNotify probe script

---

Date: ${new Date().toISOString()}
Page URL: http://localhost:3000/probe
User Agent: probe-script/1.0
Remote IP: 127.0.0.1

Message: Direct invocation from scripts/test-lead-notify.mjs`;

try {
    const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: toEmail,
        subject: 'New Lead: Probe Lead',
        text: body,
    });
    console.log('    SMTP sendMail OK, messageId:', info.messageId);
} catch (e) {
    console.error('    SMTP sendMail FAILED:', e.message);
    process.exit(3);
}
transporter.close();

console.log('\n2/2 posting to Apps Script:', sheetUrl ? sheetUrl.slice(0, 60) + '...' : '(unset)');
if (!sheetUrl) {
    console.warn('    LEADS_SHEET_URL not set — skipping sheet leg');
    process.exit(0);
}
const form = new FormData();
form.append('Name', 'Probe Lead');
form.append('E-mail', 'probe@example.com');
form.append('Mobile Number', '7777777777');
form.append('Page URL', 'http://localhost:3000/probe');
form.append('Date', `'${new Date().toLocaleDateString('en-US')}`);
form.append('Time', `'${new Date().toLocaleTimeString('en-US')}`);
form.append('Remote IP', '127.0.0.1');
form.append('User Agent', 'probe-script/1.0');
form.append('form_id', 'nextjs_lead');
form.append('form_name', 'Probe Form');
form.append('e_gs_SheetName', 'New Form');

try {
    const res = await fetch(sheetUrl, { method: 'POST', body: form });
    console.log('    Apps Script HTTP', res.status, res.ok ? 'OK' : 'FAILED');
} catch (e) {
    console.error('    Apps Script POST FAILED:', e.message);
    process.exit(4);
}

console.log('\nAll legs OK.');
process.exit(0);
