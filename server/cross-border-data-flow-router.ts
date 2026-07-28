import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getDataFlowRoutes,
  getAllJurisdictions,
  getJurisdictionRequirements,
  getCrossBorderMatrix,
} from "./cross-border-data-flow-store";

export const crossBorderDataFlowRouter = router({
  jurisdictions: protectedProcedure.query(() => {
    return getAllJurisdictions();
  }),

  jurisdictionRequirements: protectedProcedure
    .input(z.object({ jurisdiction: z.string().min(1) }))
    .query(({ input }) => {
      return getJurisdictionRequirements(input.jurisdiction);
    }),

  analyzeRoute: protectedProcedure
    .input(
      z.object({
        source: z.string().min(1),
        target: z.string().min(1),
        dataCategories: z.array(z.string()).default(["personal_data"]),
      })
    )
    .query(({ input }) => {
      return getDataFlowRoutes(
        input.source,
        input.target,
        input.dataCategories
      );
    }),

  matrix: protectedProcedure.query(() => {
    return getCrossBorderMatrix();
  }),
});
