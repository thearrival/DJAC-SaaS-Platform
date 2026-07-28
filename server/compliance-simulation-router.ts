import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  listSimulationScenarios,
  getSimulationScenarioById,
  runSimulation,
  runCustomSimulation,
} from "./compliance-simulation-store";

export const complianceSimulationRouter = router({
  scenarios: protectedProcedure.query(() => {
    return listSimulationScenarios();
  }),

  getScenario: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => {
      return getSimulationScenarioById(input.id);
    }),

  run: protectedProcedure
    .input(z.object({ scenarioId: z.string().min(1) }))
    .mutation(({ input }) => {
      return runSimulation(input.scenarioId);
    }),

  runCustom: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        jurisdictions: z.array(z.string().min(1)).min(1).max(10),
        frameworks: z.array(z.string().min(1)).max(20),
      })
    )
    .mutation(({ input }) => {
      return runCustomSimulation(input);
    }),
});
