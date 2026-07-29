import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { recordAuditEvent } from "./audit-logger";
import {
  listRegulatoryChanges,
  getRegulatoryChangeById,
  getRegulatoryChangeStats,
  getDistinctJurisdictions,
  createRegulatoryChange,
  markRegulatoryChangeEffective,
  removeRegulatoryChange,
} from "./regulatory-change-store";

const changeTypeEnum = z.enum([
  "amendment",
  "new_regulation",
  "repeal",
  "guidance",
  "enforcement",
]);

const changeStatusEnum = z.enum(["pending", "in_effect", "superseded"]);

const listInputSchema = z.object({
  jurisdiction: z.string().optional(),
  status: changeStatusEnum.optional(),
  changeType: changeTypeEnum.optional(),
  frameworkCode: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

const createSchema = z.object({
  frameworkCode: z.string().min(1).max(50),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  changeType: changeTypeEnum,
  jurisdiction: z.string().min(1).max(200),
  source: z.string().min(1).max(300),
  effectiveDate: z.string(),
  publicationDate: z.string(),
  impact: z.string().min(1).max(3000),
  url: z.string().url().max(1024).optional().nullable(),
  status: changeStatusEnum.optional(),
});

export const regulatoryChangeRouter = router({
  list: activeOrgProcedure
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "regulatory_changes", "canView");
      const orgId = ctx.organizationId as number;
      return listRegulatoryChanges(orgId, input);
    }),

  getById: activeOrgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "regulatory_changes", "canView");
      const change = await getRegulatoryChangeById(input.id);
      if (!change) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return change;
    }),

  stats: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "regulatory_changes", "canView");
    return getRegulatoryChangeStats();
  }),

  jurisdictions: activeOrgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "regulatory_changes", "canView");
    return getDistinctJurisdictions();
  }),

  create: activeOrgProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "regulatory_changes", "canCreate");
      const result = await createRegulatoryChange({
        frameworkCode: input.frameworkCode,
        title: input.title,
        description: input.description,
        changeType: input.changeType,
        jurisdiction: input.jurisdiction,
        source: input.source,
        effectiveDate: new Date(input.effectiveDate),
        publicationDate: new Date(input.publicationDate),
        impact: input.impact,
        url: input.url ?? null,
        status: input.status ?? "pending",
      });
      void recordAuditEvent(ctx, {
        category: "data_write",
        action: "regulatory_change.create",
        entityType: "regulatoryChanges",
        entityId: result.id,
        targetEntity: input.title,
        outcome: "success",
        payload: {
          frameworkCode: input.frameworkCode,
          changeType: input.changeType,
          jurisdiction: input.jurisdiction,
        },
      });
      return result;
    }),

  markEffective: activeOrgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "regulatory_changes", "canEdit");
      const result = await markRegulatoryChangeEffective(input.id);
      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      void recordAuditEvent(ctx, {
        category: "data_write",
        action: "regulatory_change.mark_effective",
        entityType: "regulatoryChanges",
        entityId: input.id,
        outcome: "success",
      });
      return result;
    }),

  remove: activeOrgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "regulatory_changes", "canDelete");
      const success = await removeRegulatoryChange(input.id);
      if (!success) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      void recordAuditEvent(ctx, {
        category: "data_write",
        action: "regulatory_change.remove",
        entityType: "regulatoryChanges",
        entityId: input.id,
        outcome: "success",
      });
      return { success: true };
    }),
});
