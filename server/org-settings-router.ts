/**
 * Org Settings Router — organization profile management.
 *
 * Procedures:
 *   orgSettings.get       – fetch current org profile (any org member)
 *   orgSettings.update    – update editable fields (owner/admin only)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  orgAdminProcedure,
  orgProcedure,
  requireMfa,
  router,
} from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { getOrgSettings, updateOrgSettings } from "./org-settings-store";
import { GLOBAL_JURISDICTIONS } from "./_core/jurisdictions";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { organizationMembers, organizations, vendors } from "../drizzle/schema";

const JURISDICTION_VALUES = GLOBAL_JURISDICTIONS;

// ─── Schemas ─────────────────────────────────────────────────────────────────

const updateOrgSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organization name must be at least 2 characters")
    .max(255)
    .optional(),
  billingEmail: z.string().trim().email().max(320).optional(),
  industry: z.string().trim().max(120).optional(),
  primaryJurisdiction: z.enum(JURISDICTION_VALUES).optional(),
});

// ─── Router ──────────────────────────────────────────────────────────────────

export const orgSettingsRouter = router({
  /**
   * Returns the current organization's full profile.
   * Available to all org members (read-only for analyst / compliance_officer).
   */
  get: orgProcedure.query(async ({ ctx }) => {
    await requireModulePermission(ctx, "org_settings", "canView");
    const org = await getOrgSettings(
      ctx.organizationId as number,
      ctx.organizationRole ?? "analyst"
    );
    if (!org)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    return org;
  }),

  /**
   * Export the organization's core data as JSON (owner/admin only). Read-only
   * and bounded to profile, vendors and members for portability/compliance.
   */
  exportData: orgAdminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database unavailable",
      });
    }
    const orgId = ctx.organizationId as number;

    const [org] = await db
      .select({
        name: organizations.name,
        industry: organizations.industry,
        primaryJurisdiction: organizations.primaryJurisdiction,
        plan: organizations.plan,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(eq(organizations.id, orgId))
      .limit(1);

    const vendorRows = await db
      .select({
        id: vendors.id,
        vendorName: vendors.vendorName,
        industry: vendors.industry,
        riskTier: vendors.riskTier,
        criticalityLevel: vendors.criticalityLevel,
        dataLocations: vendors.dataLocations,
        regulatoryJurisdictions: vendors.regulatoryJurisdictions,
        certifications: vendors.certifications,
        createdAt: vendors.createdAt,
      })
      .from(vendors)
      .where(eq(vendors.organizationId, orgId));

    const memberRows = await db
      .select({
        role: organizationMembers.role,
        status: organizationMembers.status,
        inviteEmail: organizationMembers.inviteEmail,
        createdAt: organizationMembers.createdAt,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId));

    return {
      exportedAt: new Date().toISOString(),
      organization: org ?? null,
      vendors: vendorRows,
      members: memberRows,
    };
  }),

  /**
   * First-run company-profile capture. Deliberately does NOT require MFA —
   * these are non-sensitive fields needed to personalise the workspace, and
   * gating them behind MFA would block brand-new accounts.
   */
  saveCompanyProfile: orgAdminProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(255),
        industry: z.string().trim().min(1).max(120),
        primaryJurisdiction: z.enum(JURISDICTION_VALUES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.organizationId < 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot update dev virtual organization",
        });
      }
      await requireModulePermission(ctx, "org_settings", "canEdit");
      await updateOrgSettings(ctx.organizationId as number, input);
      return { success: true as const };
    }),

  /**
   * Update editable fields.  Owner and admin only.
   * Slug and plan are intentionally excluded — those are system-managed.
   */
  update: orgAdminProcedure
    .use(requireMfa)
    .input(updateOrgSchema)
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "org_settings", "canEdit");
      if (Object.keys(input).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update",
        });
      }
      if (ctx.organizationId < 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot update dev virtual organization",
        });
      }
      await updateOrgSettings(ctx.organizationId as number, input);
      return { success: true as const };
    }),
});
