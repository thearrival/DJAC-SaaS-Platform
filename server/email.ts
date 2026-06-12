/**
 * Thin email helper for DJAC.
 * Uses nodemailer when SMTP credentials are configured (SMTP_HOST + SMTP_USER + SMTP_PASS).
 * Falls back to console logging in development when SMTP is not configured.
 */
import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, isDevelopment } = ENV;
    const from = smtpFrom || "DJAC Platform <noreply@yalla-hack.net>";

    if (!smtpHost || !smtpUser || !smtpPass) {
        // No SMTP configured — log to console in dev, silently no-op in prod
        if (isDevelopment) {
            console.info(
                `\n[EMAIL — no SMTP configured]\nTo: ${payload.to}\nSubject: ${payload.subject}\n\n${payload.text ?? payload.html}\n`
            );
        }
        return;
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: ENV.smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
    });
}
