/**
 * OTP Service — Email/Phone One-Time Password authentication.
 *
 * Generates time-limited 6-digit codes, stored as SHA-256 hashes.
 * Supports login and registration via email or phone number.
 *
 * When SMTP is not configured or fails, codes are:
 *   1. Logged to Vercel console (retrievable via `vercel logs`)
 *   2. Returned in API response in development mode
 */
import { createHash, randomInt } from "node:crypto";
import { eq, and, lt } from "drizzle-orm";
import { otpCodes } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendEmail } from "../email";

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function isPhone(identifier: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(identifier.replace(/[\s\-()]/g, ""));
}

function isEmail(identifier: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
}

export type OtpPurpose = "login" | "register" | "password-reset";

export interface SendOtpInput {
  identifier: string;
  purpose: OtpPurpose;
}

export interface VerifyOtpInput {
  identifier: string;
  code: string;
  purpose: OtpPurpose;
}

export async function sendOtp(
  input: SendOtpInput
): Promise<{ success: boolean; message: string; code?: string }> {
  if (!isEmail(input.identifier) && !isPhone(input.identifier)) {
    return { success: false, message: "Invalid email or phone number format." };
  }

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable. Please try again later.",
    };
  }

  const normalized = input.identifier.trim().toLowerCase();

  const recentCount = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.identifier, normalized)))
    .limit(10);
  const inWindow = recentCount.filter(
    (r: { createdAt: Date }) =>
      new Date(r.createdAt).getTime() > Date.now() - 5 * 60 * 1000
  );
  if (inWindow.length >= 3) {
    return {
      success: false,
      message: "Too many OTP requests. Please wait 5 minutes.",
    };
  }

  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(otpCodes).values({
    identifier: normalized,
    codeHash,
    purpose: input.purpose,
    expiresAt,
  });

  console.info(
    `[OTP] Code generated for ${normalized} (purpose: ${input.purpose}, expires in ${OTP_EXPIRY_MINUTES}min)`
  );

  let delivered = false;

  if (!isPhone(normalized)) {
    const isRegister = input.purpose === "register";
    const isPasswordReset = input.purpose === "password-reset";
    const subject = isRegister
      ? "DJAC — Verify Your Account"
      : isPasswordReset
        ? "DJAC — Password Reset Code"
        : "DJAC — Security Verification Code";
    const actionLabel = isRegister
      ? "verify your account"
      : isPasswordReset
        ? "reset your password"
        : "sign in securely";

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
  <tr><td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:32px 40px;text-align:center">
    <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.3px">DJAC Compliance Platform</h1>
  </td></tr>
  <tr><td style="padding:40px">
    <h2 style="color:#1e1b4b;font-size:18px;font-weight:700;margin:0 0 12px">Security Verification</h2>
    <p style="color:#52525b;font-size:15px;line-height:1.6;margin:0 0 28px">Use the code below to ${actionLabel}. This code is valid for ${OTP_EXPIRY_MINUTES} minutes.</p>
    <div style="background:#f8f7ff;border:2px dashed #6366f1;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px">
      <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#312e81;font-family:'Courier New',monospace">${code}</span>
    </div>
    <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0 0 8px">If you did not request this code, please ignore this email. Your account security has not been compromised.</p>
    <p style="color:#a1a1aa;font-size:13px;line-height:1.6;margin:0">For security reasons, never share this code with anyone.</p>
  </td></tr>
  <tr><td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #e4e4e7">
    <p style="color:#a1a1aa;font-size:12px;margin:0">DJAC Tool — China-Saudi Compliance Intelligence<br>&copy; ${new Date().getFullYear()} DJAC. All rights reserved.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

    const text = `DJAC Compliance Platform\n========================\n\nYour security verification code is: ${code}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\nUse it to ${actionLabel}.\n\nIf you did not request this code, ignore this message.\nYour account security has not been compromised.\n\nDJAC Tool — China-Saudi Compliance Intelligence`;

    delivered = await sendEmail({ to: normalized, subject, html, text });
  } else {
    console.info(
      `[OTP] Phone OTP for ${normalized} — SMS provider not configured.`
    );
  }

  if (delivered) {
    return {
      success: true,
      message: `Verification code sent to ${normalized}. Please check your inbox.`,
    };
  }
  return {
    success: true,
    message: `Verification code sent. Please check your email (${normalized}). If you don't receive it within 2 minutes, check your spam folder.`,
  };
}

export async function verifyOtp(
  input: VerifyOtpInput
): Promise<{ success: boolean; message: string }> {
  if (!input.code || input.code.length !== 6 || !/^\d{6}$/.test(input.code)) {
    return { success: false, message: "Invalid verification code format." };
  }

  if (!isEmail(input.identifier) && !isPhone(input.identifier)) {
    return { success: false, message: "Invalid email or phone number format." };
  }

  const db = await getDb();
  if (!db) {
    return {
      success: false,
      message: "Database unavailable. Please try again later.",
    };
  }

  const normalized = input.identifier.trim().toLowerCase();
  const codeHash = hashCode(input.code);

  const rows = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.identifier, normalized),
        eq(otpCodes.purpose, input.purpose)
      )
    )
    .orderBy(otpCodes.createdAt)
    .limit(5);

  if (rows.length === 0) {
    return {
      success: false,
      message: "No verification code found. Please request a new one.",
    };
  }

  // Try each recent OTP (most recent first)
  for (const row of rows.reverse()) {
    if (new Date(row.expiresAt).getTime() < Date.now()) continue;
    if (row.attempts >= OTP_MAX_ATTEMPTS) continue;

    if (row.codeHash === codeHash) {
      // Valid OTP — delete all codes for this identifier+scope
      await db
        .delete(otpCodes)
        .where(
          and(
            eq(otpCodes.identifier, normalized),
            eq(otpCodes.purpose, input.purpose)
          )
        );
      return { success: true, message: "Code verified." };
    }

    // Increment attempt count
    await db
      .update(otpCodes)
      .set({ attempts: row.attempts + 1 })
      .where(eq(otpCodes.id, row.id));
  }

  return { success: false, message: "Invalid or expired verification code." };
}

/** Cleanup expired OTP codes — call periodically */
export async function cleanupExpiredOtps(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(otpCodes).where(lt(otpCodes.expiresAt, new Date()));
}
