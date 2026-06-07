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
import { hasMinRole } from "@shared/const";
import {
    LOCAL_AUTH_COOKIE,
    cookieOptions,
    signJwt,
    verifyJwt,
    parseJwtUserId,
    getSessionTokenFromRequest,
    isLocalMemoryFallbackEnabled,
    localMemoryUsers,
    createLocalMemoryUser,
    resolveLocalSession,
} from "./services/local-jwt";
import {
    findLocalUserByEmail,
    findLocalUserById,
    checkEmailExists,
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
    type LocalUser,
} from "./local-auth-store";

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
        name: z.string().trim().min(2, "Full name must be at least 2 characters").max(255),
        email: emailSchema,
        password: passwordSchema,
        preferredLocale: z.enum(["en", "ar", "zh"]).default("en"),
    }),
    z.object({
        userType: z.literal("professional"),
        name: z.string().trim().min(2, "Full name must be at least 2 characters").max(255),
        email: emailSchema,
        password: passwordSchema,
        companyName: z.string().trim().min(2, "Company name must be at least 2 characters").max(255),
        jobTitle: z.string().trim().min(2, "Job title must be at least 2 characters").max(120),
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

            if (!db) {
                if (await checkEmailExists(input.email)) {
                    throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
                }
                const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
                const newUser = createLocalMemoryUser({
                    name: input.name,
                    email: input.email,
                    passwordHash,
                    userType: input.userType,
                    preferredLocale: input.preferredLocale,
                    ...(input.userType === "professional"
                        ? {
                            companyName: input.companyName,
                            jobTitle: input.jobTitle,
                            industry: input.industry ?? null,
                            complianceResponsibility: input.complianceResponsibility ?? null,
                        }
                        : {}),
                });
                const token = await signJwt({ sub: newUser.id, type: "local", userType: newUser.userType });
                ctx.res.cookie(LOCAL_AUTH_COOKIE, token, cookieOptions());
                void recordAuditEvent(ctx, { category: "auth", action: "user.register", entityType: "localUsers", entityId: newUser.id, localUserId: newUser.id, payload: { userType: newUser.userType, email: newUser.email } });
                return { user: safeUser(newUser) };
            }

            if (await checkEmailExists(input.email)) {
                throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
            }

            const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
            const newUser = await insertLocalUser({
                name: input.name,
                email: input.email,
                passwordHash,
                userType: input.userType,
                preferredLocale: input.preferredLocale,
                status: "active",
                ...(input.userType === "professional"
                    ? {
                        companyName: input.companyName,
                        jobTitle: input.jobTitle,
                        industry: input.industry ?? null,
                        complianceResponsibility: input.complianceResponsibility ?? null,
                    }
                    : {}),
            });

            const token = await signJwt({ sub: newUser.id, type: "local", userType: newUser.userType });
            ctx.res.cookie(LOCAL_AUTH_COOKIE, token, cookieOptions());
            void recordAuditEvent(ctx, { category: "auth", action: "user.register", entityType: "localUsers", entityId: newUser.id, localUserId: newUser.id, payload: { userType: newUser.userType, email: newUser.email } });
            broadcastSSE("user_registered", { userId: newUser.id, email: newUser.email, userType: newUser.userType, ts: new Date().toISOString() });
            return { user: safeUser(newUser) };
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
     * Request a password reset email.
     * Always returns success to prevent user enumeration.
     * Sends a 1-hour JWT reset link; the link is invalidated once the password changes.
     */
    requestPasswordReset: publicProcedure
        .input(z.object({ email: emailSchema }))
        .mutation(async ({ input, ctx }) => {
            const user = await findLocalUserByEmail(input.email);
            const activeUser = user?.status === "active" ? user : null;

            if (activeUser) {
                const resetToken = await signJwt(
                    {
                        sub: String(activeUser.id),
                        purpose: "password-reset",
                        pwHint: activeUser.passwordHash.slice(0, 8),
                    },
                    "1h",
                );
                const resetUrl = `${ENV.appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
                await sendEmail({
                    to: input.email,
                    subject: "DJAC: Reset your password",
                    html: `<p>Hello ${activeUser.name},</p><p>Click the link below to reset your DJAC password. This link expires in 1 hour.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you did not request a password reset, you can safely ignore this email.</p><p>â€” Yalla Hack DJAC Team</p>`,
                    text: `Hello ${activeUser.name},\n\nReset your DJAC password:\n${resetUrl}\n\nExpires in 1 hour.\n\nIf you did not request this, ignore this email.`,
                });
                void recordAuditEvent(ctx, { category: "auth", action: "password.reset.request", entityType: "localUsers", entityId: activeUser.id, localUserId: activeUser.id, payload: {} });
            }

            return { success: true as const };
        }),

    /** Complete a password reset using the one-time JWT from the reset email. */
    resetPassword: publicProcedure
        .input(z.object({
            token: z.string().min(1),
            newPassword: passwordSchema,
        }))
        .mutation(async ({ input, ctx }) => {
            let payload: Record<string, unknown>;
            try {
                payload = (await verifyJwt(input.token)) ?? (() => { throw new Error(); })();
            } catch {
                throw new TRPCError({ code: "BAD_REQUEST", message: "The reset link is invalid or has expired." });
            }

            if (payload["purpose"] !== "password-reset" || typeof payload["sub"] !== "string") {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid reset token." });
            }

            const userId = parseInt(payload["sub"] as string, 10);
            if (!Number.isFinite(userId)) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid reset token." });
            }

            const user = await findLocalUserById(userId);
            if (!user || user.status !== "active") {
                throw new TRPCError({ code: "NOT_FOUND", message: "Account not found." });
            }
            if (user.passwordHash.slice(0, 8) !== payload["pwHint"]) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has already been used." });
            }

            const newHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
            await updateLocalUserPassword(userId, newHash);
            void recordAuditEvent(ctx, { category: "auth", action: "password.reset.complete", entityType: "localUsers", entityId: userId, localUserId: userId, payload: {} });
            return { success: true as const };
        }),

    // â”€â”€â”€ Profile & password management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
});

export { resolveLocalSession } from "./services/local-jwt";
