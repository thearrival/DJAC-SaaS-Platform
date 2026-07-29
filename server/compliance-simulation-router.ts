import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { recordAuditEvent } from "./audit-logger";
import { requireModulePermission } from "./_core/permission-guard";
import {
  listSimulationScenarios,
  getSimulationScenarioById,
  runSimulation,
  runCustomSimulation,
  runSimulationEngine,
  getSimulationHistory,
  getSimulationById,
  archiveSimulation,
  compareSimulations,
} from "./compliance-simulation-store";

const simulationTypeEnum = z.enum([
  "readiness",
  "gap_analysis",
  "cost_estimate",
  "cross_border",
  "full",
]);

const runEngineSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  simulationType: simulationTypeEnum,
  jurisdiction: z.string().trim().min(1).max(200),
  frameworks: z.array(z.string().trim().min(1)).min(1).max(50),
  industry: z.string().trim().max(200).optional(),
  organizationSize: z.enum(["startup", "sme", "enterprise"]).optional(),
});

export const complianceSimulationRouter = router({
  scenarios: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "compliance_simulation", "canView");
    return listSimulationScenarios();
  }),

  getScenario: activeOrgProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "compliance_simulation", "canView");
      const scenario = getSimulationScenarioById(input.id);
      if (!scenario) throw new TRPCError({ code: "NOT_FOUND" });
      return scenario;
    }),

  run: activeOrgProcedure
    .input(z.object({ scenarioId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "compliance_simulation", "canCreate");
      const result = runSimulation(input.scenarioId);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      void recordAuditEvent(ctx, {
        category: "data_write",
        action: "simulation.run_preset",
        entityType: "complianceSimulation",
        targetEntity: input.scenarioId,
        outcome: "success",
      });
      return result;
    }),

  runCustom: activeOrgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        jurisdictions: z.array(z.string().min(1)).min(1).max(10),
        frameworks: z.array(z.string().min(1)).max(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "compliance_simulation", "canCreate");
      const result = runCustomSimulation(input);
      void recordAuditEvent(ctx, {
        category: "data_write",
        action: "simulation.run_custom",
        entityType: "complianceSimulation",
        targetEntity: input.name,
        outcome: "success",
      });
      return result;
    }),

  runEngine: activeOrgProcedure
    .input(runEngineSchema)
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "compliance_simulation", "canCreate");
      const orgId = ctx.organizationId as number;
      const localUserId =
        (ctx.user as { localUserId?: number })?.localUserId ?? null;
      const result = await runSimulationEngine(orgId, input, localUserId);
      void recordAuditEvent(ctx, {
        category: "data_write",
        action: "simulation.run_engine",
        entityType: "complianceSimulation",
        entityId: result.id,
        targetEntity: result.name,
        outcome: "success",
      });
      return result;
    }),

  history: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "compliance_simulation", "canView");
    const orgId = ctx.organizationId as number;
    return getSimulationHistory(orgId);
  }),

  getById: activeOrgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "compliance_simulation", "canView");
      const orgId = ctx.organizationId as number;
      const result = await getSimulationById(orgId, input.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),

  archive: activeOrgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "compliance_simulation", "canDelete");
      const orgId = ctx.organizationId as number;
      const success = await archiveSimulation(orgId, input.id);
      if (!success) throw new TRPCError({ code: "NOT_FOUND" });
      void recordAuditEvent(ctx, {
        category: "data_write",
        action: "simulation.archive",
        entityType: "complianceSimulation",
        entityId: input.id,
        outcome: "success",
      });
      return { success: true };
    }),

  compare: activeOrgProcedure
    .input(
      z.object({
        id1: z.number().int().positive(),
        id2: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "compliance_simulation", "canView");
      const orgId = ctx.organizationId as number;
      const result = await compareSimulations(orgId, input.id1, input.id2);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return result;
    }),
});
