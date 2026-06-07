/**
 * Scorecard Router â€” org-level compliance health metrics.
 *
 * Procedures:
 *   scorecard.orgScorecard  â€” aggregated compliance data for the current org
 */

import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { getOrgScorecard } from "./scorecard-store";


// ─── Router ─────────────────────────────────────────────────────────────────
export const scorecardRouter = router({
    orgScorecard: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "compliance_tracker", "canView");
        return getOrgScorecard(ctx.organizationId ?? -1, ctx.user.id);
    }),
});
