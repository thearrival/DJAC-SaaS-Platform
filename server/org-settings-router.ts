/**
 * Org Settings Router — organization profile management.
 *
 * Procedures:
 *   orgSettings.get       – fetch current org profile (any org member)
 *   orgSettings.update    – update editable fields (owner/admin only)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { orgAdminProcedure, orgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { getOrgSettings, updateOrgSettings } from "./org-settings-store";

const JURISDICTION_VALUES = ["China", "Saudi Arabia", "Both", "Other"] as const;

// ─── Schemas ─────────────────────────────────────────────────────────────────

const updateOrgSchema = z.object({
    name: z.string().trim().min(2, "Organization name must be at least 2 characters").max(255).optional(),
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
        const org = await getOrgSettings(ctx.organizationId as number, ctx.organizationRole ?? "analyst");
        if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
        return org;
    }),

    /**
     * Update editable fields.  Owner and admin only.
     * Slug and plan are intentionally excluded — those are system-managed.
     */
    update: orgAdminProcedure
        .input(updateOrgSchema)
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "org_settings", "canEdit");
            if (Object.keys(input).length === 0) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
            }
            if (ctx.organizationId < 0) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Cannot update dev virtual organization" });
            }
            await updateOrgSettings(ctx.organizationId as number, input);
            return { success: true as const };
        }),
});
