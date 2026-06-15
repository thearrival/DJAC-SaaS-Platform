/**
 * Local (username + password) authentication router.
 *
 * Provides:
 *   localAuth.register  â€” create a new visitor or professional account
 *   localAuth.login     â€” verify credentials â†’ set JWT session cookie
 *   localAuth.me        â€” return current local-auth user from session cookie
 *   localAuth.logout    â€” clear session cookie
 *   localAuth.adminList â€” (admin only) list all local registrations
 *
 * Security practices applied:
 *   - Passwords hashed with bcryptjs (cost factor 12)
 *   - JWT signed with ENV.cookieSecret (HS256), expiry 7 days
 *   - HttpOnly + SameSite=Strict cookie; Secure in production
 *   - No plaintext passwords stored or logged anywhere
 *   - Email normalised to lowercase before storage/lookup
 *   - Zod input validation on every field
 */

import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateSecret as otpGenerateSecret, generateURI, verifySync as otpVerifySync } from "otplib";
import qrcode from "qrcode";
import { getDatabaseUnavailableMessage, getDb } from "./db";
import { ENV } from "./_core/env";
import { publicProcedure, router } from "./_core/trpc";
import { sendEmail } from "./email";
import { recordAuditEvent } from "./audit-logger";
import { broadcastSSE } from "./services/sse-bus";
import { hasMinRole } from "../shared/const";
import {
    LOCAL_AUTH_COOKIE,
    cookieOptions,
    signJwt,
    verifyJwt,
    parseJwtUserId,
    getSessionTokenFromRequest,
    isLocalMemoryFallbackEnabled,
    createLocalMemoryUser,
} from "./services/local-jwt";
import {
    findLocalUserByEmail,
    findLocalUserById,
    findLocalUserByPhone,
    checkEmailExists,
    checkPhoneExists,
    listLocalUsersForAdmin,
    insertLocalUser,
    updateLocalUserLastSignedIn,
    updateLocalUserStatus,
    updateLocalUserPassword,
    updateLocalUserProfile,
    updateLocalUserTotpSecret,
    enableLocalUserMfa,
    disableLocalUserMfa,
    consumeLocalUserBackupCode,
    verifyLocalUserEmail,
    type LocalUser,
} from "./local-auth-store";
import { sendOtp, verifyOtp } from "./services/otp";

// â”€â”€â”€ TOTP helper (otplib v13 functional API shim matching authenticator API) â”€â”€
const authenticator = {
    generateSecret: () => otpGenerateSecret(),
    keyuri: (account: string, service: string, secret: string) =>
        generateURI({ issuer: service, label: account, secret }),
    verify: (opts: { token: string; secret: string }): boolean => {
        try {
            const result = otpVerifySync({ token: opts.token, secret: opts.secret });
            return result.valid;
        } catch {
            return false;
        }
    },
};

// â”€â”€â”€ Cookie / token settings are imported from services/local-jwt.ts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BCRYPT_ROUNDS = 12;

// Strip passwordHash before returning user data to client
function safeUser(u: LocalUser) {
    const { passwordHash: _omit, ...safe } = u;
    return safe;
}

function isElevatedLocalUserType(userType: unknown): boolean {
    if (typeof userType !== "string") return false;
    return ["admin", "platform_admin", "yalla_hack_employee", "super_admin"].includes(userType);
}

// â”€â”€â”€ Input schemas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const emailSchema = z.string().trim().email().max(320).transform(s => s.toLowerCase());
const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number");

const registerSchema = z.discriminatedUnion("userType", [
    z.object({
        userType: z.literal("visitor"),
        name: z.string().trim().min(2).max(255),
        email: emailSchema,
        password: passwordSchema,
        phoneNumber: z.string().trim().max(20).optional(),
        preferredLocale: z.enum(["en", "ar", "zh"]).default("en"),
    }),
    z.object({
        userType: z.literal("professional"),
        name: z.string().trim().min(2).max(255),
        email: emailSchema,
        password: passwordSchema,
        phoneNumber: z.string().trim().max(20).optional(),
        companyName: z.string().trim().min(2).max(255),
        jobTitle: z.string().trim().min(2).max(120),
        industry: z.string().trim().max(120).optional(),
        complianceResponsibility: z.string().trim().max(1000).optional(),
        preferredLocale: z.enum(["en", "ar", "zh"]).default("en"),
    }),
]);

// â”€â”€â”€ Router â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const localAuthRouter = router({

    /** Register a new local user account */
    register: publicProcedure
        .input(registerSchema)
        .mutation(async ({ input, ctx }) => {
            const db = await getDb();
            if (!db && !isLocalMemoryFallbackEnabled()) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: getDatabaseUnavailableMessage(),
                });
            }

                const normalizedEmail = input.email.toLowerCase();
                if (await checkEmailExists(normalizedEmail)) {
                    throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
                }
                if (input.phoneNumber && await checkPhoneExists(input.phoneNumber)) {
                    throw new TRPCError({ code: "CONFLICT", message: "An account with this phone number already exists." });
                }

                const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

                if (!db) {
                    createLocalMemoryUser({
                        name: input.name,
                        email: normalizedEmail,
                        phoneNumber: input.phoneNumber ?? null,
                        passwordHash,
                        userType: input.userType,
                        preferredLocale: input.preferredLocale ?? "en",
                        status: "pending",
                    ...(input.userType === "professional"
                        ? {
                            companyName: input.companyName,
                            jobTitle: input.jobTitle,
                            industry: input.industry ?? null,
                            complianceResponsibility: input.complianceResponsibility ?? null,
                        }
                        : {}),
                });
            } else {
                await insertLocalUser({
                    name: input.name,
                    email: normalizedEmail,
                    phoneNumber: input.phoneNumber ?? null,
                    passwordHash,
                    userType: input.userType,
                    preferredLocale: input.preferredLocale ?? "en",
                    status: "pending",
                    ...(input.userType === "professional"
                        ? {
                            companyName: input.companyName,
                            jobTitle: input.jobTitle,
                            industry: input.industry ?? null,
                            complianceResponsibility: input.complianceResponsibility ?? null,
                        }
                        : {}),
                });
            }

            void recordAuditEvent(ctx, { category: "auth", action: "user.register", entityType: "localUsers", payload: { userType: input.userType, email: normalizedEmail } });
            broadcastSSE("user_registered", { email: normalizedEmail, userType: input.userType, ts: new Date().toISOString() });

            // Send OTP for verification — user must verify before logging in
            const otpResult = await sendOtp({ identifier: normalizedEmail, purpose: "register" }).catch((e) => {
                console.warn("[localAuth] Failed to send registration OTP:", e);
                return { success: false, message: "OTP delivery failed", code: undefined as string | undefined };
            });

            return { pendingVerification: true as const, identifier: normalizedEmail, otpMessage: otpResult.message, ...(otpResult.code ? { otpCode: otpResult.code } : {}) };
        }),

    /** Login with email + password */
    login: publicProcedure
        .input(
            z.object({
                email: emailSchema,
                password: z.string().min(1).max(128),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const db = await getDb();
            if (!db && !isLocalMemoryFallbackEnabled()) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: getDatabaseUnavailableMessage(),
                });
            }

            const user = await findLocalUserByEmail(input.email);

            // Constant-time comparison even on missing user (prevent email enumeration)
            const dummyHash = "$2a$12$notarealhashjustpadding000000000000000000000000000000000";
            const hashToCheck = user?.passwordHash ?? dummyHash;
            const valid = await bcrypt.compare(input.password, hashToCheck);

            if (!user || !valid) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
            }

            if (user.status === "suspended") {
                throw new TRPCError({ code: "FORBIDDEN", message: "This account has been suspended. Contact support." });
            }

            await updateLocalUserLastSignedIn(user.id);

            // 2FA gate â€” issue short-lived pending token instead of session
            if (user.mfaEnabled) {
                const pendingToken = await signJwt(
                    { sub: user.id, purpose: "totp-challenge", type: "local", userType: user.userType },
                    "5m",
                );
                return { requireTotp: true as const, pendingToken };
            }

            const token = await signJwt({ sub: user.id, type: "local", userType: user.userType });
            ctx.res.cookie(LOCAL_AUTH_COOKIE, token, cookieOptions());
            void recordAuditEvent(ctx, { category: "auth", action: "user.login", entityType: "localUsers", entityId: user.id, localUserId: user.id, payload: { method: "local", userType: user.userType } });
            broadcastSSE("user_login", { userId: user.id, email: user.email, userType: user.userType, ts: new Date().toISOString() });
            return { user: safeUser(user) };
        }),

    /** Return current local-auth session user (null if not logged in) */
    me: publicProcedure.query(async ({ ctx }) => {
        const token = getSessionTokenFromRequest(ctx.req);
        if (!token) return null;
        const payload = await verifyJwt(token);
        const localUserId = parseJwtUserId(payload?.sub);
        if (!payload || localUserId == null) return null;
        const user = await findLocalUserById(localUserId);
        if (!user || user.status === "suspended") return null;
        return safeUser(user);
    }),

    /** Logout â€” clear session cookie */
    logout: publicProcedure.mutation(({ ctx }) => {
        // Best-effort audit â€” extract userId from JWT if present
        const token = getSessionTokenFromRequest(ctx.req);
        if (token) {
            void verifyJwt(token).then(payload => {
                const uid = parseJwtUserId(payload?.sub);
                if (uid != null) {
                    void recordAuditEvent(ctx, { category: "auth", action: "user.logout", entityType: "localUsers", entityId: uid, localUserId: uid, payload: { method: "local" } });
                }
            });
        }
        ctx.res.clearCookie(LOCAL_AUTH_COOKIE, { path: "/" });
        return { success: true } as const;
    }),

    /** Admin: list all local registrations */
    adminList: publicProcedure.query(async ({ ctx }) => {
        const token = getSessionTokenFromRequest(ctx.req);
        let isAdmin = !!ctx.user?.role && hasMinRole(ctx.user.role, "admin");
        if (!isAdmin && token) {
            const payload = await verifyJwt(token);
            if (isElevatedLocalUserType(payload?.userType)) isAdmin = true;
        }
        if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });

        const db = await getDb();
        if (!db && !isLocalMemoryFallbackEnabled()) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
        }
        return listLocalUsersForAdmin();
    }),

    /** Admin: update user status (activate / suspend) */
    adminSetStatus: publicProcedure
        .input(
            z.object({
                userId: z.number().int().positive(),
                status: z.enum(["active", "pending", "suspended"]),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const token = getSessionTokenFromRequest(ctx.req);
            let isAdmin = !!ctx.user?.role && hasMinRole(ctx.user.role, "admin");
            if (!isAdmin && token) {
                const payload = await verifyJwt(token);
                if (isElevatedLocalUserType(payload?.userType)) isAdmin = true;
            }
            if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });

            const db = await getDb();
            if (!db && !isLocalMemoryFallbackEnabled()) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
            }
            const user = await findLocalUserById(input.userId);
            if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
            await updateLocalUserStatus(input.userId, input.status);
            return { success: true } as const;
        }),

    /**
     * Request a password reset OTP.
     * Always returns success to prevent user enumeration.
     * Sends a 6-digit OTP via email (or phone console log in dev).
     */
    requestPasswordReset: publicProcedure
        .input(z.object({ email: emailSchema }))
        .mutation(async ({ input, ctx }) => {
            const user = await findLocalUserByEmail(input.email);
            const activeUser = user?.status === "active" ? user : null;

            if (activeUser) {
                const otpResult = await sendOtp({ identifier: input.email, purpose: "login" }).catch((e) => {
                    console.warn("[localAuth] Failed to send reset OTP:", e);
                    return { success: false, message: "OTP delivery failed", code: undefined as string | undefined };
                });
                void recordAuditEvent(ctx, { category: "auth", action: "password.reset.request", entityType: "localUsers", entityId: activeUser.id, localUserId: activeUser.id, payload: { method: "otp" } });
                return { success: true as const, ...(otpResult.code ? { otpCode: otpResult.code, otpMessage: otpResult.message } : {}) };
            }

            return { success: true as const };
        }),

    /** Complete a password reset using OTP code + new password. */
    resetPassword: publicProcedure
        .input(z.object({
            email: emailSchema,
            code: z.string().length(6).regex(/^\d{6}$/),
            newPassword: passwordSchema,
        }))
        .mutation(async ({ input, ctx }) => {
            const verifyResult = await verifyOtp({ identifier: input.email, code: input.code, purpose: "login" });
            if (!verifyResult.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: verifyResult.message });
            }

            const user = await findLocalUserByEmail(input.email);
            if (!user || user.status !== "active") {
                throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
            }

            const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
            await updateLocalUserPassword(user.id, newHash);
            void recordAuditEvent(ctx, { category: "auth", action: "password.reset.complete", entityType: "localUsers", entityId: user.id, localUserId: user.id, payload: { method: "otp" } });
            return { success: true as const };
        }),

    /** Update the logged-in user's profile fields */
    updateProfile: publicProcedure
        .input(
            z.object({
                name: z.string().trim().min(2, "Name must be at least 2 characters").max(255).optional(),
                jobTitle: z.string().trim().max(120).optional(),
                companyName: z.string().trim().max(255).optional(),
                industry: z.string().trim().max(120).optional(),
                complianceResponsibility: z.string().trim().max(1000).optional(),
                preferredLocale: z.enum(["en", "ar", "zh"]).optional(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const token = getSessionTokenFromRequest(ctx.req);
            if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in." });
            const payload = await verifyJwt(token);
            const userId = parseJwtUserId(payload?.sub);
            if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid session." });

            const db = await getDb();
            if (!db && !isLocalMemoryFallbackEnabled()) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
            }
            await updateLocalUserProfile(userId, input);
            broadcastSSE("user_profile_updated", { userId, fields: Object.keys(input).filter(k => input[k as keyof typeof input] !== undefined), ts: new Date().toISOString() });
            return { success: true as const };
        }),

    /** Change password â€” requires current password for verification */
    changePassword: publicProcedure
        .input(
            z.object({
                currentPassword: z.string().min(1).max(128),
                newPassword: passwordSchema,
            })
        )
        .mutation(async ({ input, ctx }) => {
            const token = getSessionTokenFromRequest(ctx.req);
            if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in." });
            const payload = await verifyJwt(token);
            const userId = parseJwtUserId(payload?.sub);
            if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid session." });

            const db = await getDb();
            if (!db && !isLocalMemoryFallbackEnabled()) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
            }
            const user = await findLocalUserById(userId);
            if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
            if (!user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Account uses OTP login. Set a password first." });
            const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
            if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });

            const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
            await updateLocalUserPassword(userId, newHash);
            void recordAuditEvent(ctx, { category: "auth", action: "password.change", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
            broadcastSSE("user_password_changed", { userId, ts: new Date().toISOString() });
            return { success: true as const };
        }),

    // â”€â”€â”€ Two-Factor Authentication (TOTP) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /** Step 1: Generate TOTP secret + QR code URI â€” does NOT yet enable 2FA */
    setup2fa: publicProcedure.mutation(async ({ ctx }) => {
        const token = getSessionTokenFromRequest(ctx.req);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in." });
        const payload = await verifyJwt(token);
        const userId = parseJwtUserId(payload?.sub);
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid session." });

        const secret = authenticator.generateSecret();
        const user = await findLocalUserById(userId);
        const userEmail = user?.email ?? `user-${userId}`;

        const otpauthUri = authenticator.keyuri(userEmail, "DJAC", secret);
        const qrDataUrl = await qrcode.toDataURL(otpauthUri);

        await updateLocalUserTotpSecret(userId, secret);
        return { secret, qrDataUrl } as const;
    }),

    /** Step 2: Verify 6-digit code from authenticator app â€” enables 2FA + returns one-time backup codes */
    confirm2fa: publicProcedure
        .input(z.object({ code: z.string().length(6).regex(/^\d{6}$/) }))
        .mutation(async ({ input, ctx }) => {
            const token = getSessionTokenFromRequest(ctx.req);
            if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in." });
            const payload = await verifyJwt(token);
            const userId = parseJwtUserId(payload?.sub);
            if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid session." });

            const user = await findLocalUserById(userId);
            const storedSecret = user?.totpSecret ?? null;
            if (!storedSecret) throw new TRPCError({ code: "BAD_REQUEST", message: "No pending 2FA setup. Call setup2fa first." });

            const isValid = authenticator.verify({ token: input.code, secret: storedSecret });
            if (!isValid) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid authenticator code." });

            const plainCodes = Array.from({ length: 8 }, () =>
                createHash("sha256").update(`${userId}-${Date.now()}-${Math.random()}`).digest("hex").slice(0, 10).toUpperCase()
            );
            const hashedCodes = plainCodes.map(c => createHash("sha256").update(c).digest("hex"));

            await enableLocalUserMfa(userId, hashedCodes);
            void recordAuditEvent(ctx, { category: "auth", action: "2fa.enable", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
            return { backupCodes: plainCodes } as const;
        }),

    /** Disable 2FA â€” requires current password */
    disable2fa: publicProcedure
        .input(z.object({ password: z.string().min(1).max(128) }))
        .mutation(async ({ input, ctx }) => {
            const token = getSessionTokenFromRequest(ctx.req);
            if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in." });
            const payload = await verifyJwt(token);
            const userId = parseJwtUserId(payload?.sub);
            if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid session." });

            const db = await getDb();
            if (!db && !isLocalMemoryFallbackEnabled()) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
            }
            const user = await findLocalUserById(userId);
            if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
            if (!user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "Account uses OTP login. Set a password first." });
            const valid = await bcrypt.compare(input.password, user.passwordHash);
            if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect password." });
            await disableLocalUserMfa(userId);
            void recordAuditEvent(ctx, { category: "auth", action: "2fa.disable", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
            return { success: true as const };
        }),

    verifyTotp: publicProcedure
        .input(
            z.object({
                pendingToken: z.string().min(1),
                code: z.string().min(6).max(10).regex(/^[0-9A-Z]+$/i),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const payload = await verifyJwt(input.pendingToken);
            if (!payload || payload["purpose"] !== "totp-challenge") {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or expired challenge token." });
            }
            const userId = parseJwtUserId(payload?.sub);
            if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid challenge token." });

            const db = await getDb();
            if (!db && !isLocalMemoryFallbackEnabled()) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
            }

            const user = await findLocalUserById(userId);
            if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });

            const code = input.code.toUpperCase();

            if (!user.mfaEnabled) throw new TRPCError({ code: "BAD_REQUEST", message: "2FA is not enabled for this account." });
            if (!user.totpSecret) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "2FA misconfigured." });

            const isTotpValid = code.length === 6 && /^\d{6}$/.test(code)
                ? authenticator.verify({ token: code, secret: user.totpSecret })
                : false;

            if (!isTotpValid) {
                const hashed = createHash("sha256").update(code).digest("hex");
                const backupCodes: string[] = user.mfaBackupCodes ? JSON.parse(user.mfaBackupCodes) as string[] : [];
                const backupIdx = backupCodes.indexOf(hashed);
                if (backupIdx === -1) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid authentication code." });
                backupCodes.splice(backupIdx, 1);
                await consumeLocalUserBackupCode(userId, backupCodes);
            } else {
                await updateLocalUserLastSignedIn(userId);
            }

            const sessionToken = await signJwt({ sub: user.id, type: "local", userType: user.userType });
            ctx.res.cookie(LOCAL_AUTH_COOKIE, sessionToken, cookieOptions());
            void recordAuditEvent(ctx, { category: "auth", action: "user.login", entityType: "localUsers", entityId: userId, localUserId: userId, payload: { method: "local_2fa" } });
            return { user: safeUser(user) };
        }),

    // ─── Email verification ─────────────────────────────────────────────────

    /** Send a verification email to the currently logged-in user. */
    sendVerificationEmail: publicProcedure.mutation(async ({ ctx }) => {
        const token = getSessionTokenFromRequest(ctx.req);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Not logged in." });
        const payload = await verifyJwt(token);
        const userId = parseJwtUserId(payload?.sub);
        if (!userId) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid session." });

        const user = await findLocalUserById(userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
        if (!user.email) throw new TRPCError({ code: "BAD_REQUEST", message: "No email address on file. Add an email in Account Settings." });

        const verifyToken = await signJwt(
            { sub: String(user.id), purpose: "email-verify" },
            "24h",
        );
        const verifyUrl = `${ENV.appUrl}/verify-email?token=${encodeURIComponent(verifyToken)}`;

        await sendEmail({
            to: user.email,
            subject: "DJAC: Verify your email address",
            html: `<p>Hello ${user.name},</p><p>Please verify your DJAC account email by clicking the link below. This link expires in 24 hours.</p><p><a href="${verifyUrl}">Verify Email Address</a></p><p>If you did not create a DJAC account, you can safely ignore this email.</p><p>— Yalla Hack DJAC Team</p>`,
            text: `Hello ${user.name},\n\nVerify your DJAC account:\n${verifyUrl}\n\nExpires in 24 hours.\n\nIf you did not create this account, ignore this email.`,
        });

        void recordAuditEvent(ctx, { category: "auth", action: "email.verify.request", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
        return { success: true as const };
    }),

    /** Complete email verification using the one-time JWT from the verification email. */
    verifyEmail: publicProcedure
        .input(z.object({ token: z.string().min(1) }))
        .mutation(async ({ input, ctx }) => {
            let payload: Record<string, unknown>;
            try {
                payload = (await verifyJwt(input.token)) ?? (() => { throw new Error(); })();
            } catch {
                throw new TRPCError({ code: "BAD_REQUEST", message: "The verification link is invalid or has expired." });
            }

            if (payload["purpose"] !== "email-verify" || typeof payload["sub"] !== "string") {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification token." });
            }

            const userId = parseInt(payload["sub"] as string, 10);
            if (!Number.isFinite(userId)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid verification token." });
            }

            const user = await findLocalUserById(userId);
            if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
            if (user.verifiedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Email is already verified." });

            await verifyLocalUserEmail(userId);
            void recordAuditEvent(ctx, { category: "auth", action: "email.verify.complete", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
            return { success: true as const };
        }),

    // ─── OTP-based authentication ─────────────────────────────────────

    /** Send OTP for login or registration via email or phone */
    sendOtp: publicProcedure
        .input(z.object({
            identifier: z.string().trim().min(3).max(320),
            purpose: z.enum(["login", "register"]),
        }))
        .mutation(async ({ input, ctx }) => {
            const result = await sendOtp({ identifier: input.identifier, purpose: input.purpose });
            if (!result.success) {
                throw new TRPCError({ code: "BAD_REQUEST", message: result.message });
            }
            void recordAuditEvent(ctx, { category: "auth", action: "otp.sent", entityType: "otpCodes", payload: { identifier: input.identifier.replace(/(.{3}).*(@.*)/, "$1***$2"), purpose: input.purpose } });
            return { success: true as const };
        }),

    /** Verify OTP — logs in existing user or creates a new account if registering */
    verifyOtp: publicProcedure
        .input(z.object({
            identifier: z.string().trim().min(3).max(320),
            code: z.string().length(6).regex(/^\d{6}$/),
            purpose: z.enum(["login", "register"]),
            name: z.string().trim().min(2).max(255).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
            const db = await getDb();
            if (!db && !isLocalMemoryFallbackEnabled()) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: getDatabaseUnavailableMessage() });
            }

            const result = await verifyOtp({ identifier: input.identifier, code: input.code, purpose: input.purpose });
            if (!result.success) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: result.message });
            }

            const isPhone = /^\+?[1-9]/.test(input.identifier);
            const existing = isPhone
                ? await findLocalUserByPhone(input.identifier)
                : await findLocalUserByEmail(input.identifier.toLowerCase());

            // Login: must have existing user
            if (input.purpose === "login") {
                if (!existing) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "No account found with this identifier. Please register first." });
                }
                if (existing.status === "suspended") {
                    throw new TRPCError({ code: "FORBIDDEN", message: "Account suspended." });
                }
                await updateLocalUserLastSignedIn(existing.id);
                const token = await signJwt({ sub: existing.id, type: "local", userType: existing.userType });
                ctx.res.cookie(LOCAL_AUTH_COOKIE, token, cookieOptions());
                void recordAuditEvent(ctx, { category: "auth", action: "user.login", entityType: "localUsers", entityId: existing.id, localUserId: existing.id, payload: { method: "otp", userType: existing.userType } });
                broadcastSSE("user_login", { userId: existing.id, email: existing.email, userType: existing.userType, ts: new Date().toISOString() });
                return { user: safeUser(existing) };
            }

            // Register: create if not exists, or activate existing
            if (existing) {
                // Activate account if it was pending
                if (existing.status === "pending") {
                    await updateLocalUserStatus(existing.id, "active");
                }
                await updateLocalUserLastSignedIn(existing.id);
                const token = await signJwt({ sub: existing.id, type: "local", userType: existing.userType });
                ctx.res.cookie(LOCAL_AUTH_COOKIE, token, cookieOptions());
                void recordAuditEvent(ctx, { category: "auth", action: "user.login", entityType: "localUsers", entityId: existing.id, localUserId: existing.id, payload: { method: "otp_register", userType: existing.userType } });
                broadcastSSE("user_login", { userId: existing.id, email: existing.email, userType: existing.userType, ts: new Date().toISOString() });
                return { user: safeUser(existing) };
            }

            // Create new account (phone-only users use email field until phoneNumber migration)
            const normalizedEmail = isPhone ? input.identifier : input.identifier.toLowerCase();
            const newUser = await insertLocalUser({
                name: input.name ?? "User",
                email: normalizedEmail,
                phoneNumber: isPhone ? input.identifier : null,
                passwordHash: "",
                userType: "visitor",
                preferredLocale: "en",
                status: "active",
                verifiedAt: new Date(),
            });

            const token = await signJwt({ sub: newUser.id, type: "local", userType: newUser.userType });
            ctx.res.cookie(LOCAL_AUTH_COOKIE, token, cookieOptions());
            void recordAuditEvent(ctx, { category: "auth", action: "user.register", entityType: "localUsers", entityId: newUser.id, localUserId: newUser.id, payload: { method: "otp", userType: newUser.userType } });
            broadcastSSE("user_registered", { userId: newUser.id, email: newUser.email, userType: newUser.userType, ts: new Date().toISOString() });
            return { user: safeUser(newUser) };
        }),
});

export { resolveLocalSession } from "./services/local-jwt";
