import { z } from "zod";
import { generateRecommendations } from "./personalization";
import { protectedProcedure, router } from "./_core/trpc";

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
    .query(async ({ input }) => {
      return generateRecommendations(input);
    }),
});
