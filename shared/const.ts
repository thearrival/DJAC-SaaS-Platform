export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Authentication required (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have the required permission (10002)';
export const NOT_PLATFORM_ADMIN_ERR_MSG = 'Platform administrator access required (10003)';
export const NOT_SUPER_ADMIN_ERR_MSG = 'Super administrator access required (10004)';
export const NOT_COMPANY_ADMIN_ERR_MSG = 'Company administrator access required (10005)';

/** All supported platform roles in least-to-most-privileged order */
export const PLATFORM_ROLES = [
  "basic_user",
  "professional_user",
  "company_admin",
  "platform_admin",
  "yalla_hack_employee",
  "super_admin",
  // Legacy aliases kept for backward compat
  "user",
  "admin",
] as const;

export type PlatformRole = typeof PLATFORM_ROLES[number];

/** Numeric privilege level per role — higher = more access */
export const ROLE_LEVEL: Record<PlatformRole, number> = {
  basic_user: 10,
  user: 10,
  professional_user: 20,
  company_admin: 30,
  platform_admin: 40,
  yalla_hack_employee: 45,
  admin: 40,
  super_admin: 100,
};

/** Returns true when the actor role has at least the required privilege level */
export function hasMinRole(actorRole: string | undefined | null, required: PlatformRole): boolean {
  const actorLevel = ROLE_LEVEL[actorRole as PlatformRole] ?? 0;
  return actorLevel >= ROLE_LEVEL[required];
}

// ─── Organisation Roles ───────────────────────────────────────────────────────

/** All supported organisation-scoped roles in least-to-most-privileged order */
export const ORG_ROLES = [
  "analyst",
  "compliance_officer",
  "admin",
  "owner",
] as const;

export type OrgRole = typeof ORG_ROLES[number];

/** Numeric privilege level per org role — higher = more access */
export const ORG_ROLE_LEVEL: Record<OrgRole, number> = {
  analyst: 10,
  compliance_officer: 20,
  admin: 30,
  owner: 40,
};

/** Returns true when the actor's org role meets the minimum required level */
export function hasMinOrgRole(actorRole: string | undefined | null, required: OrgRole): boolean {
  const actorLevel = ORG_ROLE_LEVEL[actorRole as OrgRole] ?? 0;
  return actorLevel >= ORG_ROLE_LEVEL[required];
}

// ─── Account Intents & Onboarding ────────────────────────────────────────────

/** All supported account intent types */
export const ACCOUNT_INTENTS = [
  "compliance_professional",
  "legal_advisor",
  "enterprise_admin",
  "consultant",
  "vendor",
  "government",
  "researcher",
] as const;

export type AccountIntent = typeof ACCOUNT_INTENTS[number];

/** All supported onboarding wizard stages */
export const ONBOARDING_STAGES = [
  "not_started",
  "account_type_selected",
  "org_created",
  "org_joined",
  "jurisdiction_set",
  "completed",
] as const;

export type OnboardingStage = typeof ONBOARDING_STAGES[number];

// ─── Module Slugs ─────────────────────────────────────────────────────────────

/** Canonical slugs for every permission-gated module in the platform */
export const MODULE_SLUGS = [
  "asset_inventory",
  "vendor_assessment",
  "gap_tracker",
  "remediation_planner",
  "risk_register",
  "policy_manager",
  "incident_register",
  "audit_schedule",
  "dsr_management",
  "evidence_repository",
  "security_maturity",
  "compliance_tracker",
  "compliance_reports",
  "report_center",
  "compliance_heatmap",
  "compliance_calendar",
  "vendor_compliance_profiles",
  "assessment_history",
  "service_requests",
  "api_keys",
  "team_members",
  "org_settings",
  "audit_log",
  "pro_intelligence",
  "transfer_checker",
  "law_library",
  "framework_analysis",
  "billing",
  "admin_control_center",
  "saas_metrics",
] as const;

export type ModuleSlug = typeof MODULE_SLUGS[number];

// ─── RBAC Permission Flags ────────────────────────────────────────────────────

export interface PermissionFlags {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canInvite: boolean;
}

const DENY: PermissionFlags = { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false };
const VIEW_ONLY: PermissionFlags = { canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, canInvite: false };
const STANDARD: PermissionFlags = { canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, canInvite: false };
const FULL: PermissionFlags = { canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, canInvite: true };

/** Default per-module permissions for each org role.
 *  These serve as the fallback when no `rolePermissions` row exists for the user. */
export const DEFAULT_ORG_ROLE_PERMISSIONS: Record<OrgRole, Partial<Record<ModuleSlug, PermissionFlags>>> = {
  analyst: {
    asset_inventory: VIEW_ONLY,
    vendor_assessment: VIEW_ONLY,
    gap_tracker: VIEW_ONLY,
    remediation_planner: VIEW_ONLY,
    risk_register: VIEW_ONLY,
    policy_manager: VIEW_ONLY,
    incident_register: VIEW_ONLY,
    audit_schedule: VIEW_ONLY,
    dsr_management: VIEW_ONLY,
    evidence_repository: VIEW_ONLY,
    security_maturity: VIEW_ONLY,
    compliance_tracker: VIEW_ONLY,
    compliance_reports: VIEW_ONLY,
    report_center: VIEW_ONLY,
    compliance_heatmap: VIEW_ONLY,
    compliance_calendar: VIEW_ONLY,
    vendor_compliance_profiles: VIEW_ONLY,
    assessment_history: VIEW_ONLY,
    service_requests: STANDARD,
    pro_intelligence: VIEW_ONLY,
    transfer_checker: VIEW_ONLY,
    law_library: VIEW_ONLY,
    framework_analysis: VIEW_ONLY,
  },
  compliance_officer: {
    asset_inventory: STANDARD,
    vendor_assessment: STANDARD,
    gap_tracker: STANDARD,
    remediation_planner: STANDARD,
    risk_register: STANDARD,
    policy_manager: STANDARD,
    incident_register: STANDARD,
    audit_schedule: STANDARD,
    dsr_management: STANDARD,
    evidence_repository: STANDARD,
    security_maturity: STANDARD,
    compliance_tracker: STANDARD,
    compliance_reports: STANDARD,
    report_center: STANDARD,
    compliance_heatmap: STANDARD,
    compliance_calendar: STANDARD,
    vendor_compliance_profiles: STANDARD,
    assessment_history: STANDARD,
    service_requests: STANDARD,
    pro_intelligence: STANDARD,
    transfer_checker: STANDARD,
    law_library: VIEW_ONLY,
    framework_analysis: VIEW_ONLY,
  },
  admin: {
    asset_inventory: FULL,
    vendor_assessment: FULL,
    gap_tracker: FULL,
    remediation_planner: FULL,
    risk_register: FULL,
    policy_manager: FULL,
    incident_register: FULL,
    audit_schedule: FULL,
    dsr_management: FULL,
    evidence_repository: FULL,
    security_maturity: FULL,
    compliance_tracker: FULL,
    compliance_reports: FULL,
    report_center: FULL,
    compliance_heatmap: FULL,
    compliance_calendar: FULL,
    vendor_compliance_profiles: FULL,
    assessment_history: FULL,
    service_requests: FULL,
    api_keys: STANDARD,
    team_members: STANDARD,
    org_settings: STANDARD,
    audit_log: VIEW_ONLY,
    pro_intelligence: FULL,
    transfer_checker: FULL,
    law_library: VIEW_ONLY,
    framework_analysis: VIEW_ONLY,
    billing: VIEW_ONLY,
  },
  owner: {
    asset_inventory: FULL,
    vendor_assessment: FULL,
    gap_tracker: FULL,
    remediation_planner: FULL,
    risk_register: FULL,
    policy_manager: FULL,
    incident_register: FULL,
    audit_schedule: FULL,
    dsr_management: FULL,
    evidence_repository: FULL,
    security_maturity: FULL,
    compliance_tracker: FULL,
    compliance_reports: FULL,
    report_center: FULL,
    compliance_heatmap: FULL,
    compliance_calendar: FULL,
    vendor_compliance_profiles: FULL,
    assessment_history: FULL,
    service_requests: FULL,
    api_keys: FULL,
    team_members: FULL,
    org_settings: FULL,
    audit_log: FULL,
    pro_intelligence: FULL,
    transfer_checker: FULL,
    law_library: FULL,
    framework_analysis: FULL,
    billing: FULL,
  },
};

// ─── Onboarding Gate Rules ────────────────────────────────────────────────────

/** Maps each onboarding stage to the routes that are accessible without completing it.
 *  An empty array means the stage must be completed before any gated route is accessible. */
export const ONBOARDING_GATE_RULES: Record<OnboardingStage, string[]> = {
  not_started: [],
  account_type_selected: [],
  org_created: [],
  org_joined: [],
  jurisdiction_set: [],
  completed: ["*"], // wildcard — all routes accessible
};

