/**
 * Google SSO router — handles Google OAuth sign-in via Supabase.
 * Provides endpoints for initiating Google auth and handling the callback.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getSupabaseClient } from "./services/supabase";
import { upsertUser, getUserByOpenId } from "./db";
import { ENV } from "./_core/env";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { signJwt, cookieOptions } from "./services/local-jwt";
import { recordAuditEvent } from "./audit-logger";
import { broadcastSSE } from "./services/sse-bus";

export const googleAuthRouter = router({
    /** Get the Google OAuth URL for sign-in */
    getAuthUrl: publicProcedure
        .input(z.object({ redirectTo: z.string().optional() }))
        .query(async ({ input }) => {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase client not configured." });
            }
            const redirectUrl = `${ENV.appUrl}/api/trpc/googleAuth.callback?redirectTo=${encodeURIComponent(input.redirectTo ?? "/dashboard")}`;
            const { data } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: redirectUrl,
                    queryParams: {
                        access_type: "offline",
                        prompt: "consent",
                    },
                },
            });
            if (!data.url) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate Google auth URL." });
            }
            return { url: data.url };
        }),

    /** Callback handler — Supabase redirects here after Google auth */
    callback: publicProcedure
        .input(z.object({
            code: z.string().optional(),
            redirectTo: z.string().optional(),
        }))
        .query(async ({ input, ctx }) => {
            if (!input.code) {
                // This is the initial redirect from Supabase — the user needs to be redirected
                // to Supabase's callback URL which includes the code
                throw new TRPCError({ code: "BAD_REQUEST", message: "No authorization code provided." });
            }

            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Supabase client not configured." });
            }
            const { data, error } = await supabase.auth.exchangeCodeForSession(input.code);

            if (error || !data?.user) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: error?.message ?? "Google authentication failed.",
                });
            }

            const supabaseUser = data.user;
            const openId = `google:${supabaseUser.id}`;
            const email = supabaseUser.email ?? "";
            const name = supabaseUser.user_metadata?.full_name ?? supabaseUser.email ?? "User";

            // Upsert into our users table
            await upsertUser({
                openId,
                name,
                email,
                loginMethod: "google",
                role: "basic_user",
                status: "active",
                preferredLocale: "en",
            });

            const user = await getUserByOpenId(openId);
            if (!user) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user account." });
            }

            // Create session JWT and set cookie
            const token = await signJwt({
                sub: user.id,
                type: "oauth",
                userType: user.role ?? "basic_user",
                openId,
            });
            const sessionCookie = cookieOptions();
            ctx.res.cookie(COOKIE_NAME, token, { ...sessionCookie, maxAge: ONE_YEAR_MS });

            void recordAuditEvent(ctx, {
                category: "auth",
                action: "user.login",
                entityType: "users",
                entityId: user.id,
                payload: { method: "google", email },
            });
            broadcastSSE("user_login", { userId: user.id, email, method: "google", ts: new Date().toISOString() });

            return {
                success: true,
                redirectTo: input.redirectTo ?? "/dashboard",
                user: { id: user.id, name: user.name, email: user.email, role: user.role },
            };
        }),
});
