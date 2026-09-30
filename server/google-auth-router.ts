/**
 * Google SSO router.
 *
 * Runs Google OAuth directly on our own domain — see `_core/google-oauth.ts`.
 * The user never sees a third-party auth host: the button sends them to Google
 * and Google returns them to `app.yalla-hack.ae`.
 */
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import {
  buildGoogleAuthUrl,
  googleOAuthConfigured,
} from "./_core/google-oauth";

export const googleAuthRouter = router({
  /** Public config for the client-side Google Identity Services button. */
  config: publicProcedure.query(() => ({
    enabled: googleOAuthConfigured(),
    clientId: googleOAuthConfigured() ? ENV.googleClientId : "",
  })),

  /** Get the Google OAuth URL for sign-in (built on our own domain). */
  getAuthUrl: publicProcedure
    .input(z.object({ redirectTo: z.string().optional() }))
    .query(async ({ input }) => {
      if (!googleOAuthConfigured()) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Google sign-in is not configured.",
        });
      }
      return { url: buildGoogleAuthUrl(input.redirectTo ?? "/dashboard") };
    }),
});
