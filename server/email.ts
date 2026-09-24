/**
 * Email helper for DJAC.
 * Uses nodemailer when SMTP credentials are configured.
 * Falls back to console logging in development.
 */
import nodemailer from "nodemailer";
import { sql } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Fire-and-forget delivery log for the founders Platform Monitor. */
export async function logDelivery(
  payload: EmailPayload,
  status: "sent" | "failed",
  errorMessage?: string
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.execute(sql`
            INSERT INTO "email_log" ("template", "recipient", "subject", "status", "sent_at", "error_message")
            VALUES ('transactional', ${payload.to}, ${payload.subject}, ${status},
                    ${status === "sent" ? sql`NOW()` : sql`NULL`},
                    ${errorMessage ?? null})
        `);
  } catch {
    // never break sending
  }
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const { smtpHost, smtpPort, smtpUser, smtpPass, smtpFrom, isDevelopment } =
    ENV;
  const from = smtpFrom || "DJAC by Yalla Hack <hello@yalla-hack.com>";

  if (!smtpHost || !smtpUser || !smtpPass) {
    if (isDevelopment) {
      console.info(
        `\n[EMAIL] No SMTP configured.\nTo: ${payload.to}\nSubject: ${payload.subject}\n${payload.text ?? payload.html}\n`
      );
    }
    await logDelivery(payload, "failed", "SMTP not configured");
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

    await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    transporter.close();
    console.info(`[EMAIL] Sent to ${payload.to}: "${payload.subject}"`);
    await logDelivery(payload, "sent");
    return true;
  } catch (err) {
    console.error(
      `[EMAIL] Failed to send to ${payload.to}:`,
      (err as Error).message
    );
    // Log the content so it can be retrieved from logs if needed
    console.info(
      `[EMAIL] Content (not delivered): ${payload.subject} — ${payload.text ?? ""}`.slice(
        0,
        300
      )
    );
    await logDelivery(payload, "failed", (err as Error).message.slice(0, 500));
    return false;
  }
}
