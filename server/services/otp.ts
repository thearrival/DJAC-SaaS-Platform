/**
 * OTP Service — SMS / Email One-Time Password authentication.
 *
 * Generates time-limited 6-digit codes, stored as SHA-256 hashes.
 * Supports login and registration via email or phone number.
 */
import { createHash } from "node:crypto";
import { eq, and, lt } from "drizzle-orm";
import { otpCodes } from "../../drizzle/schema";
import { getDb } from "../db";
import { sendEmail } from "../email";
import { ENV } from "../_core/env";

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

function generateCode(): string {
    const digits = "0123456789";
    let code = "";
    for (let i = 0; i < OTP_LENGTH; i++) {
        code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
}

function hashCode(code: string): string {
    return createHash("sha256").update(code).digest("hex");
}

function isPhone(identifier: string): boolean {
    return /^\+?[1-9]\d{6,14}$/.test(identifier.replace(/[\s\-()]/g, ""));
}

export interface SendOtpInput {
    identifier: string; // email or phone number
    purpose: "login" | "register";
}

export interface VerifyOtpInput {
    identifier: string;
    code: string;
    purpose: "login" | "register";
}

export async function sendOtp(input: SendOtpInput): Promise<{ success: boolean; message: string }> {
    const db = await getDb();
    if (!db) {
        return { success: false, message: "Database unavailable. Please try again later." };
    }

    const normalized = input.identifier.trim().toLowerCase();

    // Rate limit: max 3 OTPs per 5-minute window per identifier
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recent = await db
        .select({ id: otpCodes.id })
        .from(otpCodes)
        .where(and(eq(otpCodes.identifier, normalized), lt(otpCodes.createdAt, fiveMinAgo) ? undefined : undefined))
        .limit(1);
    // Re-check: count recent
    const recentCount = await db
        .select()
        .from(otpCodes)
        .where(and(eq(otpCodes.identifier, normalized)))
        .limit(10);
    const inWindow = recentCount.filter((r: { createdAt: Date }) => new Date(r.createdAt).getTime() > Date.now() - 5 * 60 * 1000);
    if (inWindow.length >= 3) {
        return { success: false, message: "Too many OTP requests. Please wait 5 minutes." };
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

    // Send via email (SMS would require a provider like Twilio in production)
    if (!isPhone(normalized)) {
        const subject = input.purpose === "register"
            ? "DJAC: Your email verification code"
            : "DJAC: Your sign-in code";
        await sendEmail({
            to: normalized,
            subject,
            html: `<p>Your DJAC verification code is:</p><h2 style="font-size:32px;letter-spacing:8px;font-family:monospace;">${code}</h2><p>This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this code, please ignore this email.</p>`,
            text: `Your DJAC verification code is: ${code}\n\nExpires in ${OTP_EXPIRY_MINUTES} minutes.\n\nIf you did not request this code, ignore this message.`,
        });
    } else {
        // Phone: log to console in dev, would use SMS provider in production
        console.log(`[OTP] Code for ${normalized}: ${code} (expires in ${OTP_EXPIRY_MINUTES}min)`);
    }

    return { success: true, message: "Verification code sent." };
}

export async function verifyOtp(input: VerifyOtpInput): Promise<{ success: boolean; message: string }> {
    const db = await getDb();
    if (!db) {
        return { success: false, message: "Database unavailable." };
    }

    const normalized = input.identifier.trim().toLowerCase();
    const codeHash = hashCode(input.code);

    const rows = await db
        .select()
        .from(otpCodes)
        .where(and(eq(otpCodes.identifier, normalized), eq(otpCodes.purpose, input.purpose)))
        .orderBy(otpCodes.createdAt)
        .limit(5);

    if (rows.length === 0) {
        return { success: false, message: "No verification code found. Please request a new one." };
    }

    // Try each recent OTP (most recent first)
    for (const row of rows.reverse()) {
        if (new Date(row.expiresAt).getTime() < Date.now()) continue;
        if (row.attempts >= OTP_MAX_ATTEMPTS) continue;

        if (row.codeHash === codeHash) {
            // Valid OTP — delete all codes for this identifier+scope
            await db
                .delete(otpCodes)
                .where(and(eq(otpCodes.identifier, normalized), eq(otpCodes.purpose, input.purpose)));
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
