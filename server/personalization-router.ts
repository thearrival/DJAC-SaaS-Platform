import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateRecommendations } from "./personalization";
import { protectedProcedure, router } from "./_core/trpc";
import { checkRateLimit } from "./_core/rateLimiter";

const RECO_LIMIT = 30;
const RECO_WINDOW_MS = 60_000;

export const personalizationRouter = router({
  getRecommendations: protectedProcedure
    .input(
      z.object({
        frameworks: z.array(z.string()).max(20).default([]),
        objectives: z.array(z.string()).max(12).default([]),
        industry: z.string().default(""),
        country: z.string().default(""),
        complianceMaturity: z
          .enum(["beginner", "intermediate", "advanced"])
          .default("beginner"),
      })
    )
    .query(async ({ ctx, input }) => {
      const rl = await checkRateLimit(
        `reco:${ctx.user.id}`,
        RECO_LIMIT,
        RECO_WINDOW_MS
      );
      if (!rl.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded.",
        });
      }
      return generateRecommendations(input);
    }),
});
