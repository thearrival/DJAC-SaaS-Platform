import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  listRegulatoryChanges,
  getRegulatoryChangeById,
  getRegulatoryChangeStats,
  getRegulatoryChangeRegions,
  getRegulatoryChangeJurisdictions,
} from "./regulatory-change-store";

export const regulatoryChangeRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        region: z.string().optional(),
        jurisdiction: z.string().optional(),
        impact: z.enum(["critical", "high", "medium", "low"]).optional(),
        status: z
          .enum(["draft", "effective", "pending", "proposed"])
          .optional(),
        framework: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(({ input }) => {
      return listRegulatoryChanges(input);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => {
      return getRegulatoryChangeById(input.id);
    }),

  stats: protectedProcedure.query(() => {
    return getRegulatoryChangeStats();
  }),

  regions: protectedProcedure.query(() => {
    return getRegulatoryChangeRegions();
  }),

  jurisdictions: protectedProcedure.query(() => {
    return getRegulatoryChangeJurisdictions();
  }),
});
