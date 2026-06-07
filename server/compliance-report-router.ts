/**
 * Compliance Report Router � Phase 35
 *
 * Read-only aggregation across all compliance modules for the Compliance
 * Reports & Export page.
 *
 * Procedures:
 *   complianceReport.summary    � org-wide snapshot of all modules
 *   complianceReport.moduleData � raw rows for a given module (CSV-ready)
 */

import { z } from "zod";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { getComplianceSummary, getComplianceModuleData } from "./compliance-report-store";

const moduleEnum = z.enum(["gaps", "risks", "remediation", "policies", "incidents", "audit_schedule"]);

export const complianceReportRouter = router({
    summary: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "compliance_reports", "canView");
        return getComplianceSummary(ctx.organizationId as number);
    }),

    moduleData: activeOrgProcedure
        .input(z.object({ module: moduleEnum }))
        .query(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "compliance_reports", "canView");
            return getComplianceModuleData(ctx.organizationId as number, input.module);
        }),
});
