/**
 * Vendor Compliance Router � refactored to use vendor-compliance-store.ts
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { getVendorComplianceList, getVendorComplianceProfile } from "./vendor-compliance-store";

export const vendorComplianceRouter = router({
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "vendor_compliance_profiles", "canView");
        return getVendorComplianceList(ctx.organizationId as number);
    }),

    profile: activeOrgProcedure
        .input(z.object({ vendorId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "vendor_compliance_profiles", "canView");
            const profile = await getVendorComplianceProfile(ctx.organizationId as number, input.vendorId);
            if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Vendor not found" });
            return profile;
        }),
});
