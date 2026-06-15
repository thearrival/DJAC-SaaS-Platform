/**
 * Email helper for DJAC.
 * Uses nodemailer when SMTP credentials are configured.
 * Falls back to console logging in development.
 */
import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, isDevelopment } = ENV;
    const from = smtpFrom || "DJAC Platform <noreply@yalla-hack.net>";

    if (!smtpHost || !smtpUser || !smtpPass) {
        if (isDevelopment) {
            console.info(`\n[EMAIL] No SMTP configured.\nTo: ${payload.to}\nSubject: ${payload.subject}\n${payload.text ?? payload.html}\n`);
        }
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: ENV.smtpSecure,
            auth: { user: smtpUser, pass: smtpPass },
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
        });

        await transporter.sendMail({ from, to: payload.to, subject: payload.subject, html: payload.html, text: payload.text });
        transporter.close();
        console.info(`[EMAIL] Sent to ${payload.to}: "${payload.subject}"`);
        return true;
    } catch (err) {
        console.error(`[EMAIL] Failed to send to ${payload.to}:`, (err as Error).message);
        // Log the content so it can be retrieved from logs if needed
        console.info(`[EMAIL] Content (not delivered): ${payload.subject} — ${payload.text ?? ""}`.slice(0, 300));
        return false;
    }
}
