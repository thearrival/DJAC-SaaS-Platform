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
import { googleAuthRouter } from "./google-auth-router";
import { knowledgeGraphRouter } from "./knowledge-graph-router";
import { regulatoryChangeRouter } from "./regulatory-change-router";
import { complianceSimulationRouter } from "./compliance-simulation-router";
import { crossBorderDataFlowRouter } from "./cross-border-data-flow-router";
import { onboardingRouter } from "./onboarding-router";
import { analyticsRouter } from "./analytics-router";
import { notificationsRouter } from "./notification-router";
import { personalizationRouter } from "./personalization-router";
import { customer360Router } from "./customer-360-router";

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
  googleAuth: googleAuthRouter,
  knowledgeGraph: knowledgeGraphRouter,
  regulatoryChanges: regulatoryChangeRouter,
  complianceSimulation: complianceSimulationRouter,
  crossBorderFlow: crossBorderDataFlowRouter,
  deadlines: deadlineRouter,
  auth: authRouter,
  compliance: complianceFrameworkRouter,
  vendor: vendorRouter,
  onboarding: onboardingRouter,
  analytics: analyticsRouter,
  notifications: notificationsRouter,
  personalization: personalizationRouter,
  customer360: customer360Router,
});

export type AppRouter = typeof appRouter;
