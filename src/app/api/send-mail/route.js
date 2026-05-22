import nodemailer from "nodemailer";
import { UAParser } from "ua-parser-js";
import { col, nowIso } from "@/lib/db";

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, message, mobileNumber } = body;

        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });

        const remoteIP =
            request.headers.get("x-real-ip") ||
            request.headers.get("x-forwarded-for") ||
            request.connection?.remoteAddress ||
            request.headers.get("x-vercel-forwarded-for") ||
            "Unknown IP";

        const userAgentString = request.headers.get("user-agent");
        const parser = new UAParser(userAgentString);
        const browser = parser.getBrowser();
        const os = parser.getOS();
        const browserDetails = `${browser.name} ${browser.version}`;
        const osDetails = `${os.name} ${os.version}`;

        const now = nowIso();
        const doc = {
            name, email, mobileNumber, message,
            status: 'new', submittedAt: now, createdAt: now,
            meta: { remoteIP, browser: browserDetails, os: osDetails, userAgent: userAgentString },
        };
        const contacts = await col('contacts');
        const result = await contacts.insertOne(doc);
        const insertedId = String(result.insertedId);

        // Send email notification (fire and forget)
        (async () => {
            try {
                const settingsCol = await col('settings');
                const row = await settingsCol.findOne({ type: 'brand' });
                const settings = row?.data || {};

                const smtpHost = settings.smtpHost;
                const smtpUser = settings.smtpUser;
                const smtpPass = settings.smtpPass;

                if (!smtpHost || !smtpUser || !smtpPass) {
                    console.warn('Mail settings not configured — skipping email notification');
                    return;
                }

                const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: parseInt(settings.smtpPort || '465', 10),
                    secure: settings.smtpSecure !== false,
                    auth: { user: smtpUser, pass: smtpPass },
                });

                const siteName = settings.siteName || 'Site';
                const fromName = settings.mailFromName || siteName;
                const fromEmail = settings.mailFrom || smtpUser;
                const toEmail = settings.mailTo || smtpUser;
                const subject = settings.mailSubject
                    ? `${settings.mailSubject}: New Inquiry from ${name}`
                    : `New Inquiry from ${name}`;

                const htmlContent = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                        <h2 style="color: #c8a96a; margin-bottom: 16px;">${siteName} — New Inquiry</h2>
                        <table style="width:100%; border-collapse:collapse; font-size:14px;">
                            <tr><td style="padding:8px; font-weight:bold; width:140px;">Name</td><td style="padding:8px;">${name}</td></tr>
                            <tr style="background:#f9f9f9;"><td style="padding:8px; font-weight:bold;">Email</td><td style="padding:8px;">${email}</td></tr>
                            <tr><td style="padding:8px; font-weight:bold;">Mobile</td><td style="padding:8px;">${mobileNumber}</td></tr>
                            <tr style="background:#f9f9f9;"><td style="padding:8px; font-weight:bold;">Date</td><td style="padding:8px;">${currentDate} ${currentTime}</td></tr>
                            <tr><td style="padding:8px; font-weight:bold;">IP</td><td style="padding:8px;">${remoteIP}</td></tr>
                            <tr style="background:#f9f9f9;"><td style="padding:8px; font-weight:bold;">Browser</td><td style="padding:8px;">${browserDetails}</td></tr>
                            <tr><td style="padding:8px; font-weight:bold;">OS</td><td style="padding:8px;">${osDetails}</td></tr>
                            <tr style="background:#f9f9f9;"><td style="padding:8px; font-weight:bold; vertical-align:top;">Message</td><td style="padding:8px;">${message || '—'}</td></tr>
                        </table>
                    </div>`;

                await transporter.sendMail({
                    from: `"${fromName}" <${fromEmail}>`,
                    to: toEmail,
                    subject,
                    html: htmlContent,
                });
                console.log('Email sent successfully!');
            } catch (err) {
                console.error('Failed to send email:', err);
            }
        })();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Contact form submitted successfully",
                data: { _id: insertedId },
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Error processing contact form:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
