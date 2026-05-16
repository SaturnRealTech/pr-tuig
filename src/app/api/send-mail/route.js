import nodemailer from "nodemailer";
import { UAParser } from "ua-parser-js";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, message, mobileNumber } = body;

        // Get additional request metadata
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString([], {
            hour: "2-digit", minute: "2-digit", hour12: true,
        });

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

        // Store in MongoDB database
        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || "Saturnrealcon");

        const contactData = {
            name,
            email,
            mobileNumber,
            message,
            remoteIP,
            browser: browserDetails,
            os: osDetails,
            userAgent: userAgentString,
            submittedAt: new Date(),
            status: "new", // Can be: new, contacted, closed
        };

        const result = await db.collection("contacts").insertOne(contactData);

        // Send email notification (async - don't wait for it)
        (async () => {
            try {
                const transporter = nodemailer.createTransport({
                    host: "smtppro.zoho.in",
                    port: 465,
                    secure: true, // SSL
                    auth: {
                        user: "founder@dharmsy.com",
                        pass: "FX2KW9JA10te",
                    },
                });

                const textContent = `
        User Name: ${name}
        Email: ${email}
        Mobile Number: ${mobileNumber}
        Current Date: ${currentDate}
        Time: ${currentTime}
        Remote IP: ${remoteIP}
        Browser: ${browserDetails}
        OS: ${osDetails}
        MESSAGE: ${message}
      `;

                const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #c7232e;">Dharmsy Innovations</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mobile:</strong> ${mobileNumber}</p>
          <p><strong>Date:</strong> ${currentDate}</p>
          <p><strong>Time:</strong> ${currentTime}</p>
          <p><strong>IP:</strong> ${remoteIP}</p>
          <p><strong>Browser:</strong> ${browserDetails}</p>
          <p><strong>OS:</strong> ${osDetails}</p>
          <p><strong>Message:</strong> ${message}</p>
        </div>
      `;

                await transporter.sendMail({
                    from: `"Qwikly Launch" <founder@dharmsy.com>`,
                    to: "dharmsyinnovations@gmail.com",
                    subject: `Qwikly Launch: New Inquiry`,
                    text: textContent,
                    html: htmlContent,
                });
                console.log("Email sent successfully!");
            } catch (err) {
                console.error("Failed to send email:", err);
            }
        })();

        return new Response(
            JSON.stringify({
                success: true,
                message: "Contact form submitted successfully",
                data: { _id: result.insertedId },
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
