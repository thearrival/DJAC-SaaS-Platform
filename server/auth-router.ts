import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { requireModulePermissionIfOrgContext } from "./_core/permission-guard";
import { saveUserProfile } from "./control-center-store";

export const authRouter = router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
        return { success: true } as const;
    }),

    updateProfile: protectedProcedure
        .input(
            z.object({
                name: z.string().trim().min(2, "Name must be at least 2 characters").max(255).optional(),
                email: z.string().trim().email().max(320).optional(),
                organizationName: z.string().trim().max(255).optional(),
                organizationType: z.string().trim().max(120).optional(),
                jobTitle: z.string().trim().max(120).optional(),
                preferredLocale: z.enum(["en", "ar", "zh"]).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const touchesOrgProfile = input.organizationName !== undefined || input.organizationType !== undefined;
            if (touchesOrgProfile) {
                await requireModulePermissionIfOrgContext(ctx, "org_settings", "canEdit");
            }
            return saveUserProfile(ctx.user.id, input);
        }),
});
