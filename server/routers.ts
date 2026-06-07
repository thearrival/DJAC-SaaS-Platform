import { adminRouter } from "./admin-router";
import { aiRouter } from "./ai/router";
import { billingRouter } from "./billing";
import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { portalRouter } from "./portal-router";
import { localAuthRouter } from "./local-auth-router";
import { complianceFrameworkRouter } from "./compliance-framework-router";
import { vendorRouter } from "./vendor-router";
import { deadlineRouter } from "./deadline-router";
import { authRouter } from "./auth-router";
import { roleRouter } from "./role-router";
import { rbacRouter } from "./rbac-router";
import { orgMembersRouter } from "./org-members-router";
import { orgSettingsRouter } from "./org-settings-router";
import { scorecardRouter } from "./scorecard-router";
import { apiKeysRouter } from "./api-keys-router";
import { remediationRouter } from "./remediation-router";
import { riskRegisterRouter } from "./risk-register-router";
import { policyRouter } from "./policy-router";
import { incidentRouter } from "./incident-router";
import { auditScheduleRouter } from "./audit-schedule-router";
import { vendorComplianceRouter } from "./vendor-compliance-router";
import { complianceReportRouter } from "./compliance-report-router";
import { ctemRouter } from "./ctem-router";
import { evidenceRouter } from "./evidence-router";
import { dsrRouter } from "./dsr-router";
import { complianceChatRouter } from "./compliance-chat-router";
import { serviceRequestRouter } from "./service-request-router";
import { assetInventoryRouter } from "./asset-inventory-router";
import { threatIntelRouter } from "./threat-intel-router";
import { securityMaturityRouter } from "./security-maturity-router";

export const appRouter = router({
    system: systemRouter,
    ai: aiRouter,
    portal: portalRouter,
    localAuth: localAuthRouter,
    admin: adminRouter,
    billing: billingRouter,
    role: roleRouter,
    rbac: rbacRouter,
    orgMembers: orgMembersRouter,
    orgSettings: orgSettingsRouter,
    scorecard: scorecardRouter,
    apiKeys: apiKeysRouter,
    remediation: remediationRouter,
    riskRegister: riskRegisterRouter,
    policyManager: policyRouter,
    incidentRegister: incidentRouter,
    auditSchedule: auditScheduleRouter,
    vendorCompliance: vendorComplianceRouter,
    complianceReport: complianceReportRouter,
    ctem: ctemRouter,
    evidence: evidenceRouter,
    dsr: dsrRouter,
    complianceChat: complianceChatRouter,
    serviceRequests: serviceRequestRouter,
    assetInventory: assetInventoryRouter,
    threatIntel: threatIntelRouter,
    securityMaturity: securityMaturityRouter,
    deadlines: deadlineRouter,
    auth: authRouter,
    compliance: complianceFrameworkRouter,
    vendor: vendorRouter,
});

export type AppRouter = typeof appRouter;
