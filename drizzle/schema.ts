import { pgEnum, pgTable, serial, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export const userTypeEnum = pgEnum("userType", [
  "visitor", "professional", "admin", "basic_user", "professional_user",
  "company_admin", "platform_admin", "yalla_hack_employee", "super_admin",
]);

export const localeEnum = pgEnum("locale", ["en", "ar", "zh"]);

export const userStatusEnum = pgEnum("userStatus", ["active", "pending", "suspended"]);

export const roleEnum = pgEnum("role", [
  "user", "admin", "basic_user", "professional_user", "company_admin",
  "platform_admin", "yalla_hack_employee", "super_admin",
]);

export const userOAuthStatusEnum = pgEnum("userOAuthStatus", ["active", "invited", "suspended"]);

export const accessRequestStatusEnum = pgEnum("accessRequestStatus", ["new", "reviewing", "approved", "archived"]);

export const consultationStatusEnum = pgEnum("consultationStatus", ["new", "in_review", "responded", "closed"]);

export const priorityEnum = pgEnum("priority", ["low", "medium", "high"]);

export const severityEnum = pgEnum("severity", ["low", "medium", "high", "critical"]);

export const criticalityEnum = pgEnum("criticality", ["low", "medium", "high", "critical"]);

export const actorTypeEnum = pgEnum("actorType", ["visitor", "client", "admin", "system"]);

export const notificationCategoryEnum = pgEnum("notificationCategory", [
  "registration", "consultation", "assessment", "support", "system",
]);

export const relationshipTypeEnum = pgEnum("relationshipType", [
  "overlap", "conflict", "harmonization", "coordination", "gap", "dependency",
]);

export const mappingTypeEnum = pgEnum("mappingType", ["equivalent", "related", "conflicting", "complementary"]);

export const assessmentStatusEnum = pgEnum("assessmentStatus", ["compliant", "partial", "non_compliant", "unknown"]);

export const jurisdictionEnum = pgEnum("jurisdiction", ["China", "Saudi Arabia", "Both", "Other"]);

export const planEnum = pgEnum("plan", ["free_trial", "starter", "professional", "enterprise"]);

export const paidPlanEnum = pgEnum("paidPlan", ["starter", "professional", "enterprise"]);

export const orgMemberRoleEnum = pgEnum("orgMemberRole", ["owner", "admin", "compliance_officer", "analyst"]);

export const orgMemberStatusEnum = pgEnum("orgMemberStatus", ["active", "invited", "suspended"]);

export const billingIntervalEnum = pgEnum("billingInterval", ["monthly", "quarterly", "biannual", "annual"]);

export const subscriptionStatusEnum = pgEnum("subscriptionStatus", [
  "trialing", "active", "past_due", "canceled", "incomplete", "paused",
]);

export const billingEventStatusEnum = pgEnum("billingEventStatus", ["success", "failed", "pending", "refunded"]);

export const reportTypeEnum = pgEnum("reportType", [
  "full_compliance", "gap_analysis", "vendor_assessment",
  "risk_assessment", "executive_summary", "regulatory_deadline",
]);

export const reportStatusEnum = pgEnum("reportStatus", ["generating", "ready", "failed", "archived"]);

export const auditLogCategoryEnum = pgEnum("auditLogCategory", [
  "auth", "data_write", "data_read", "role_change", "system", "billing",
]);

export const auditLogOutcomeEnum = pgEnum("auditLogOutcome", ["success", "failure", "blocked"]);

export const taskSeverityEnum = pgEnum("taskSeverity", ["critical", "high", "medium", "low"]);

export const taskStatusEnum = pgEnum("taskStatus", ["open", "in_progress", "resolved", "accepted_risk"]);

export const riskCategoryEnum = pgEnum("riskCategory", ["operational", "legal", "technical", "financial", "reputational"]);

export const treatmentEnum = pgEnum("treatment", ["accept", "mitigate", "transfer", "avoid"]);

export const riskStatusEnum = pgEnum("riskStatus", ["open", "in_treatment", "closed", "accepted"]);

export const policyTypeEnum = pgEnum("policyType", ["policy", "standard", "procedure", "guideline"]);

export const policyStatusEnum = pgEnum("policyStatus", ["draft", "under_review", "approved", "active", "retired"]);

export const incidentTypeEnum = pgEnum("incidentType", [
  "data_breach", "unauthorized_access", "policy_violation",
  "system_outage", "third_party_breach", "other",
]);

export const incidentStatusEnum = pgEnum("incidentStatus", [
  "open", "under_investigation", "contained", "resolved", "closed",
]);

export const auditTypeEnum = pgEnum("auditType", ["internal", "external", "regulatory", "certification"]);

export const auditStatusEnum = pgEnum("auditStatus", ["planned", "in_progress", "completed", "cancelled"]);

export const recurrenceEnum = pgEnum("recurrence", ["none", "monthly", "quarterly", "biannual", "annual"]);

export const ctemAssetTypeEnum = pgEnum("ctemAssetType", [
  "web_application", "api_endpoint", "database", "cloud_service",
  "network_device", "iot_device", "data_pipeline", "identity_provider",
  "storage_bucket", "other",
]);

export const regionEnum = pgEnum("region", ["China", "Saudi Arabia", "Cross-border", "Other"]);

export const assetStatusEnum = pgEnum("assetStatus", ["active", "inactive", "decommissioned"]);

export const vulnSeverityEnum = pgEnum("vulnSeverity", ["critical", "high", "medium", "low", "informational"]);

export const simulationTypeEnum = pgEnum("simulationType", [
  "lateral_movement", "privilege_escalation", "data_exfiltration",
  "ransomware", "phishing", "api_abuse", "supply_chain",
  "ddos", "insider_threat", "other",
]);

export const priorityTierEnum = pgEnum("priorityTier", ["critical", "high", "medium", "low"]);

export const runStatusEnum = pgEnum("runStatus", ["queued", "running", "completed", "failed"]);

export const triggeredByEnum = pgEnum("triggeredBy", ["manual", "scheduled", "webhook"]);

export const severityImpactEnum = pgEnum("severityImpact", ["critical", "high", "medium", "low"]);

export const onboardingStageEnum = pgEnum("onboardingStage", [
  "not_started", "account_type_selected", "org_created",
  "org_joined", "jurisdiction_set", "completed",
]);

export const accountIntentEnum = pgEnum("accountIntent", [
  "compliance_professional", "legal_advisor", "enterprise_admin",
  "consultant", "vendor", "government", "researcher",
]);

export const evidenceSourceTypeEnum = pgEnum("evidenceSourceType", [
  "audit_schedule", "policy", "risk", "gap", "remediation",
  "ctem_asset", "incident", "general",
]);

export const dsrRequestTypeEnum = pgEnum("dsrRequestType", [
  "access", "rectification", "erasure", "portability",
  "restriction", "objection", "explanation",
]);

export const dsrJurisdictionEnum = pgEnum("dsrJurisdiction", ["China", "Saudi Arabia", "Other"]);

export const dsrStatusEnum = pgEnum("dsrStatus", [
  "received", "in_review", "pending_info", "completed", "rejected", "withdrawn",
]);

export const dsrPriorityEnum = pgEnum("dsrPriority", ["normal", "high", "urgent"]);

export const serviceTypeEnum = pgEnum("serviceType", [
  "penetration_test", "red_team", "security_audit", "soc_support",
  "incident_response", "consulting", "phishing_simulation",
  "cloud_security_review", "vulnerability_assessment", "compliance_gap_assessment",
]);

export const servicePriorityEnum = pgEnum("servicePriority", ["low", "medium", "high", "critical"]);

export const serviceStatusEnum = pgEnum("serviceStatus", [
  "draft", "submitted", "under_review", "scoping", "approved",
  "in_progress", "completed", "cancelled", "on_hold",
]);

export const inventoryAssetTypeEnum = pgEnum("inventoryAssetType", [
  "server", "workstation", "network_device", "cloud_service",
  "saas_application", "database", "api_endpoint", "iot_device",
  "mobile_device", "industrial_ot", "web_application",
  "source_code_repo", "third_party_service",
]);

export const exposureEnum = pgEnum("exposure", ["internal", "vpn_only", "partner_only", "internet_facing"]);

export const inventoryStatusEnum = pgEnum("inventoryStatus", ["active", "decommissioned", "under_review", "unknown"]);

export const maturityLevelEnum = pgEnum("maturityLevel", ["initial", "developing", "defined", "managed", "optimized"]);

export const threatCategoryEnum = pgEnum("threatCategory", [
  "malware", "ransomware", "phishing", "apt", "zero_day",
  "ddos", "supply_chain", "data_breach", "vulnerability",
  "social_engineering", "insider_threat", "other",
]);

export const threatSeverityEnum = pgEnum("threatSeverity", ["info", "low", "medium", "high", "critical"]);

export const tlpEnum = pgEnum("tlp", ["white", "green", "amber", "red"]);

export const deadlineJurisdictionEnum = pgEnum("deadlineJurisdiction", ["China", "Saudi Arabia", "Both"]);

export const deadlinePriorityEnum = pgEnum("deadlinePriority", ["low", "medium", "high", "critical"]);

export const deadlineStatusEnum = pgEnum("deadlineStatus", ["upcoming", "overdue", "completed", "waived"]);

// ═══════════════════════════════════════════════════════════════════════════════
// TABLES
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Local Auth Users ──────────────────────────────────────────────────────────
export const localUsers = pgTable("localUsers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).unique(),
  phoneNumber: varchar("phoneNumber", { length: 20 }).unique(),
  passwordHash: varchar("passwordHash", { length: 72 }),
  userType: userTypeEnum("userType").default("visitor").notNull(),
  companyName: varchar("companyName", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 120 }),
  industry: varchar("industry", { length: 120 }),
  complianceResponsibility: text("complianceResponsibility"),
  preferredLocale: localeEnum("preferredLocale").default("en").notNull(),
  status: userStatusEnum("status").default("pending").notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
  totpSecret: varchar("totpSecret", { length: 64 }),
  mfaEnabled: integer("mfaEnabled").default(0).notNull(),
  mfaBackupCodes: text("mfaBackupCodes"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  organizationName: varchar("organizationName", { length: 255 }),
  organizationType: varchar("organizationType", { length: 120 }),
  jobTitle: varchar("jobTitle", { length: 120 }),
  preferredLocale: localeEnum("preferredLocale").default("en").notNull(),
  role: roleEnum("role").default("user").notNull(),
  status: userOAuthStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type AllTables = {
  localUsers: typeof localUsers;
  users: typeof users;
  accessRequests: typeof accessRequests;
  consultationRequests: typeof consultationRequests;
  activityEvents: typeof activityEvents;
  adminNotifications: typeof adminNotifications;
  frameworks: typeof frameworks;
  complianceControls: typeof complianceControls;
  frameworkRelationships: typeof frameworkRelationships;
  controlMappings: typeof controlMappings;
  vendors: typeof vendors;
  techStackComponents: typeof techStackComponents;
  vendorAssessments: typeof vendorAssessments;
  assessmentGaps: typeof assessmentGaps;
  auditLogs: typeof auditLogs;
};

export const accessRequests = pgTable("accessRequests", {
  id: serial("id").primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  organizationType: varchar("organizationType", { length: 120 }),
  useCase: text("useCase"),
  preferredLocale: localeEnum("preferredLocale").default("en").notNull(),
  status: accessRequestStatusEnum("status").default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

export const consultationRequests = pgTable("consultationRequests", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  jurisdictions: text("jurisdictions"),
  summary: text("summary").notNull(),
  vendorName: varchar("vendorName", { length: 255 }),
  techStackSummary: text("techStackSummary"),
  status: consultationStatusEnum("status").default("new").notNull(),
  priority: priorityEnum("priority").default("medium").notNull(),
  assignedAdminUserId: integer("assignedAdminUserId").references(() => users.id),
  adminResponse: text("adminResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ConsultationRequest = typeof consultationRequests.$inferSelect;
export type InsertConsultationRequest = typeof consultationRequests.$inferInsert;

export const activityEvents = pgTable("activityEvents", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  localUserId: integer("localUserId").references(() => localUsers.id),
  actorType: actorTypeEnum("actorType").notNull(),
  actorRole: varchar("actorRole", { length: 64 }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 120 }).notNull(),
  entityId: integer("entityId"),
  targetEntity: varchar("targetEntity", { length: 255 }),
  payload: text("payload"),
  ipHash: varchar("ipHash", { length: 64 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityEvent = typeof activityEvents.$inferSelect;
export type InsertActivityEvent = typeof activityEvents.$inferInsert;

export const adminNotifications = pgTable("adminNotifications", {
  id: serial("id").primaryKey(),
  category: notificationCategoryEnum("category").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  entityType: varchar("entityType", { length: 120 }),
  entityId: integer("entityId"),
  isRead: integer("isRead").default(0).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

export const frameworks = pgTable("frameworks", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  country: varchar("country", { length: 50 }).notNull(),
  description: text("description"),
  scope: text("scope"),
  enforcementAuthority: varchar("enforcementAuthority", { length: 255 }),
  maxPenalty: varchar("maxPenalty", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Framework = typeof frameworks.$inferSelect;
export type InsertFramework = typeof frameworks.$inferInsert;

export const complianceControls = pgTable("complianceControls", {
  id: serial("id").primaryKey(),
  frameworkId: integer("frameworkId").notNull().references(() => frameworks.id),
  controlCode: varchar("controlCode", { length: 100 }).notNull(),
  controlName: text("controlName").notNull(),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  requirement: text("requirement"),
  applicability: varchar("applicability", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ComplianceControl = typeof complianceControls.$inferSelect;
export type InsertComplianceControl = typeof complianceControls.$inferInsert;

export const frameworkRelationships = pgTable("frameworkRelationships", {
  id: serial("id").primaryKey(),
  sourceFrameworkId: integer("sourceFrameworkId").notNull().references(() => frameworks.id),
  targetFrameworkId: integer("targetFrameworkId").notNull().references(() => frameworks.id),
  relationshipType: relationshipTypeEnum("relationshipType").notNull(),
  description: text("description"),
  severity: severityEnum("severity"),
  riskLevel: varchar("riskLevel", { length: 50 }),
  mitigation: text("mitigation"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FrameworkRelationship = typeof frameworkRelationships.$inferSelect;
export type InsertFrameworkRelationship = typeof frameworkRelationships.$inferInsert;

export const controlMappings = pgTable("controlMappings", {
  id: serial("id").primaryKey(),
  sourceControlId: integer("sourceControlId").notNull().references(() => complianceControls.id),
  targetControlId: integer("targetControlId").notNull().references(() => complianceControls.id),
  mappingType: mappingTypeEnum("mappingType").notNull(),
  alignmentScore: integer("alignmentScore"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ControlMapping = typeof controlMappings.$inferSelect;
export type InsertControlMapping = typeof controlMappings.$inferInsert;

export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  organizationId: integer("organizationId").references(() => organizations.id),
  vendorName: varchar("vendorName", { length: 255 }).notNull(),
  vendorDescription: text("vendorDescription"),
  industry: varchar("industry", { length: 100 }),
  businessRegistrationNumber: varchar("businessRegistrationNumber", { length: 120 }),
  headquartersLocation: varchar("headquartersLocation", { length: 120 }),
  primaryContactName: varchar("primaryContactName", { length: 255 }),
  primaryContactEmail: varchar("primaryContactEmail", { length: 320 }),
  primaryContactRole: varchar("primaryContactRole", { length: 120 }),
  primaryContactPhone: varchar("primaryContactPhone", { length: 64 }),
  serviceType: varchar("serviceType", { length: 120 }),
  serviceScope: text("serviceScope"),
  hostingEnvironment: varchar("hostingEnvironment", { length: 120 }),
  operatingCountries: text("operatingCountries"),
  cloudProvider: varchar("cloudProvider", { length: 255 }),
  dataLocations: text("dataLocations"),
  regulatoryJurisdictions: text("regulatoryJurisdictions"),
  certifications: text("certifications"),
  dataProcessingActivities: text("dataProcessingActivities"),
  criticalityLevel: varchar("criticalityLevel", { length: 64 }),
  riskTier: varchar("riskTier", { length: 64 }),
  thirdPartyDependencies: varchar("thirdPartyDependencies", { length: 64 }),
  fourthPartyDependencies: varchar("fourthPartyDependencies", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

export const techStackComponents = pgTable("techStackComponents", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendorId").notNull().references(() => vendors.id),
  componentName: varchar("componentName", { length: 255 }).notNull(),
  componentType: varchar("componentType", { length: 100 }),
  technology: varchar("technology", { length: 255 }),
  description: text("description"),
  dataHandling: text("dataHandling"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type TechStackComponent = typeof techStackComponents.$inferSelect;
export type InsertTechStackComponent = typeof techStackComponents.$inferInsert;

export const vendorAssessments = pgTable("vendorAssessments", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendorId").notNull().references(() => vendors.id),
  frameworkId: integer("frameworkId").notNull().references(() => frameworks.id),
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  complianceScore: integer("complianceScore"),
  riskLevel: severityEnum("riskLevel"),
  status: assessmentStatusEnum("status"),
  findings: text("findings"),
  recommendations: text("recommendations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type VendorAssessment = typeof vendorAssessments.$inferSelect;
export type InsertVendorAssessment = typeof vendorAssessments.$inferInsert;

export const assessmentGaps = pgTable("assessmentGaps", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessmentId").notNull().references(() => vendorAssessments.id),
  controlId: integer("controlId").notNull().references(() => complianceControls.id),
  gapDescription: text("gapDescription"),
  severity: severityEnum("severity"),
  remediation: text("remediation"),
  estimatedRemediationCost: varchar("estimatedRemediationCost", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AssessmentGap = typeof assessmentGaps.$inferSelect;
export type InsertAssessmentGap = typeof assessmentGaps.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ SAAS MULTI-TENANCY & BILLING
// ═══════════════════════════════════════════════════════════════════════════════

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  billingEmail: varchar("billingEmail", { length: 320 }).notNull(),
  industry: varchar("industry", { length: 120 }),
  primaryJurisdiction: jurisdictionEnum("primaryJurisdiction").default("Both"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  plan: planEnum("plan").default("free_trial").notNull(),
  trialStartedAt: timestamp("trialStartedAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  trialReminderDay3Sent: integer("trialReminderDay3Sent").default(0).notNull(),
  trialReminderDay6Sent: integer("trialReminderDay6Sent").default(0).notNull(),
  trialExpiredNoticeSent: integer("trialExpiredNoticeSent").default(0).notNull(),
  isActive: integer("isActive").default(1).notNull(),
  maxSeats: integer("maxSeats").default(5).notNull(),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

export const organizationMembers = pgTable("organizationMembers", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  userId: integer("userId").references(() => users.id),
  localUserId: integer("localUserId").references(() => localUsers.id),
  role: orgMemberRoleEnum("role").default("analyst").notNull(),
  invitedByUserId: integer("invitedByUserId"),
  inviteEmail: varchar("inviteEmail", { length: 320 }),
  inviteToken: varchar("inviteToken", { length: 64 }),
  inviteAcceptedAt: timestamp("inviteAcceptedAt"),
  status: orgMemberStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }).unique(),
  stripePriceId: varchar("stripePriceId", { length: 64 }),
  plan: paidPlanEnum("plan").notNull(),
  billingInterval: billingIntervalEnum("billingInterval").notNull(),
  amountCents: integer("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: subscriptionStatusEnum("status").default("trialing").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: integer("cancelAtPeriodEnd").default(0).notNull(),
  canceledAt: timestamp("canceledAt"),
  lastInvoiceId: varchar("lastInvoiceId", { length: 64 }),
  stripeMetadata: text("stripeMetadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const billingEvents = pgTable("billingEvents", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  subscriptionId: integer("subscriptionId").references(() => subscriptions.id),
  stripeEventId: varchar("stripeEventId", { length: 64 }).unique(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  status: billingEventStatusEnum("status").default("pending").notNull(),
  amountCents: integer("amountCents"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  description: text("description"),
  rawPayload: text("rawPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillingEvent = typeof billingEvents.$inferSelect;
export type InsertBillingEvent = typeof billingEvents.$inferInsert;

export const complianceReports = pgTable("complianceReports", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  generatedByUserId: integer("generatedByUserId").references(() => users.id),
  generatedByLocalUserId: integer("generatedByLocalUserId").references(() => localUsers.id),
  title: varchar("title", { length: 255 }).notNull(),
  reportType: reportTypeEnum("reportType").notNull(),
  frameworks: text("frameworks").notNull(),
  aiJobId: varchar("aiJobId", { length: 64 }),
  version: integer("version").default(1).notNull(),
  overallScore: integer("overallScore"),
  riskLevel: severityEnum("riskLevel"),
  reportBody: text("reportBody").notNull(),
  exportedAt: timestamp("exportedAt"),
  exportedPdfUrl: varchar("exportedPdfUrl", { length: 512 }),
  status: reportStatusEnum("status").default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = typeof complianceReports.$inferInsert;

export const apiKeys = pgTable("apiKeys", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdByUserId: integer("createdByUserId").references(() => users.id),
  name: varchar("name", { length: 120 }).notNull(),
  keyHash: varchar("keyHash", { length: 64 }).notNull().unique(),
  keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(),
  scopes: text("scopes"),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

export const userInteractionLogs = pgTable("userInteractionLogs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").references(() => organizations.id),
  userId: integer("userId").references(() => users.id),
  localUserId: integer("localUserId").references(() => localUsers.id),
  sessionId: varchar("sessionId", { length: 64 }),
  context: varchar("context", { length: 120 }).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 120 }),
  entityId: integer("entityId"),
  inputSnapshot: text("inputSnapshot"),
  outputRef: text("outputRef"),
  durationMs: integer("durationMs"),
  ipHash: varchar("ipHash", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserInteractionLog = typeof userInteractionLogs.$inferSelect;
export type InsertUserInteractionLog = typeof userInteractionLogs.$inferInsert;

export const yallaAdminAccessLinkNonces = pgTable("yallaAdminAccessLinkNonces", {
  id: serial("id").primaryKey(),
  nonceHash: varchar("nonceHash", { length: 64 }).notNull().unique(),
  redirectTarget: varchar("redirectTarget", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt").defaultNow().notNull(),
  consumedByIp: varchar("consumedByIp", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type YallaAdminAccessLinkNonce = typeof yallaAdminAccessLinkNonces.$inferSelect;
export type InsertYallaAdminAccessLinkNonce = typeof yallaAdminAccessLinkNonces.$inferInsert;

export const complianceDeadlines = pgTable("complianceDeadlines", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").references(() => organizations.id),
  frameworkCode: varchar("frameworkCode", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  deadlineDate: timestamp("deadlineDate").notNull(),
  jurisdiction: deadlineJurisdictionEnum("jurisdiction").notNull(),
  priority: deadlinePriorityEnum("priority").default("medium").notNull(),
  status: deadlineStatusEnum("status").default("upcoming").notNull(),
  notificationsSent: text("notificationsSent"),
  assignedToUserId: integer("assignedToUserId").references(() => users.id),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ComplianceDeadline = typeof complianceDeadlines.$inferSelect;
export type InsertComplianceDeadline = typeof complianceDeadlines.$inferInsert;

export const auditLogs = pgTable("auditLogs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id),
  localUserId: integer("localUserId").references(() => localUsers.id),
  organizationId: integer("organizationId").references(() => organizations.id),
  actorRole: varchar("actorRole", { length: 64 }),
  category: auditLogCategoryEnum("category").notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 120 }),
  entityId: integer("entityId"),
  targetEntity: varchar("targetEntity", { length: 255 }),
  outcome: auditLogOutcomeEnum("outcome").default("success").notNull(),
  payload: text("payload"),
  ipHash: varchar("ipHash", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Report Shares ────────────────────────────────────────────────────────────
export const reportShares = pgTable("reportShares", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  jurisdiction: varchar("jurisdiction", { length: 64 }).notNull(),
  locale: localeEnum("locale").default("en").notNull(),
  reportType: varchar("reportType", { length: 64 }).notNull(),
  createdByUserId: integer("createdByUserId").references(() => users.id),
  viewCount: integer("viewCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportShare = typeof reportShares.$inferSelect;
export type InsertReportShare = typeof reportShares.$inferInsert;

// ─── Remediation Tasks ────────────────────────────────────────────────────────
export const remediationTasks = pgTable("remediationTasks", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  vendorId: integer("vendorId"),
  gapCode: varchar("gapCode", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: taskSeverityEnum("severity").notNull().default("medium"),
  status: taskStatusEnum("status").notNull().default("open"),
  assignedToUserId: integer("assignedToUserId"),
  dueDate: timestamp("dueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RemediationTask = typeof remediationTasks.$inferSelect;
export type InsertRemediationTask = typeof remediationTasks.$inferInsert;

// ─── Risk Register ────────────────────────────────────────────────────────────
export const riskRegister = pgTable("riskRegister", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: riskCategoryEnum("category").notNull().default("operational"),
  likelihood: integer("likelihood").notNull().default(3),
  impact: integer("impact").notNull().default(3),
  treatment: treatmentEnum("treatment").notNull().default("mitigate"),
  status: riskStatusEnum("status").notNull().default("open"),
  ownerId: integer("ownerId"),
  vendorId: integer("vendorId"),
  gapCode: varchar("gapCode", { length: 64 }),
  controlReference: varchar("controlReference", { length: 128 }),
  reviewDate: timestamp("reviewDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RiskEntry = typeof riskRegister.$inferSelect;
export type InsertRiskEntry = typeof riskRegister.$inferInsert;

// ─── Compliance Policies ──────────────────────────────────────────────────────
export const compliancePolicies = pgTable("compliancePolicies", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  policyCode: varchar("policyCode", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  policyType: policyTypeEnum("policyType").notNull().default("policy"),
  frameworks: text("frameworks"),
  controlReferences: text("controlReferences"),
  status: policyStatusEnum("status").notNull().default("draft"),
  ownerId: integer("ownerId"),
  reviewCycleMonths: integer("reviewCycleMonths").default(12),
  lastApprovedAt: timestamp("lastApprovedAt"),
  nextReviewAt: timestamp("nextReviewAt"),
  version: varchar("version", { length: 20 }).default("1.0"),
  documentUrl: varchar("documentUrl", { length: 512 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CompliancePolicy = typeof compliancePolicies.$inferSelect;
export type InsertCompliancePolicy = typeof compliancePolicies.$inferInsert;

// ─── Compliance Incident Register ─────────────────────────────────────────────
export const complianceIncidents = pgTable("complianceIncidents", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  incidentCode: varchar("incidentCode", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  incidentType: incidentTypeEnum("incidentType").default("other").notNull(),
  severity: taskSeverityEnum("severity").default("medium").notNull(),
  status: incidentStatusEnum("status").default("open").notNull(),
  affectedFrameworks: text("affectedFrameworks"),
  affectedVendorId: integer("affectedVendorId"),
  affectedDataTypes: text("affectedDataTypes"),
  affectedDataSubjects: integer("affectedDataSubjects"),
  reportedById: integer("reportedById"),
  occurredAt: timestamp("occurredAt"),
  detectedAt: timestamp("detectedAt"),
  containedAt: timestamp("containedAt"),
  resolvedAt: timestamp("resolvedAt"),
  regulatoryNotificationRequired: integer("regulatoryNotificationRequired").default(0).notNull(),
  regulatoryNotificationSentAt: timestamp("regulatoryNotificationSentAt"),
  notificationDeadlineHours: integer("notificationDeadlineHours").default(72),
  rootCause: text("rootCause"),
  lessonsLearned: text("lessonsLearned"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ComplianceIncident = typeof complianceIncidents.$inferSelect;
export type InsertComplianceIncident = typeof complianceIncidents.$inferInsert;

// ─── Audit Schedules ──────────────────────────────────────────────────────────
export const auditSchedules = pgTable("auditSchedules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  auditType: auditTypeEnum("auditType").default("internal").notNull(),
  scope: text("scope"),
  status: auditStatusEnum("status").default("planned").notNull(),
  scheduledDate: timestamp("scheduledDate").notNull(),
  completedDate: timestamp("completedDate"),
  assignedToId: integer("assignedToId"),
  vendorId: integer("vendorId"),
  findings: text("findings"),
  recurrence: recurrenceEnum("recurrence").default("none").notNull(),
  nextOccurrence: timestamp("nextOccurrence"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AuditSchedule = typeof auditSchedules.$inferSelect;
export type InsertAuditSchedule = typeof auditSchedules.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ CTEM — Continuous Threat Exposure Management
// ═══════════════════════════════════════════════════════════════════════════════

export const ctemAssets = pgTable("ctemAssets", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  vendorId: integer("vendorId").references(() => vendors.id, { onDelete: "set null" }),
  assetName: varchar("assetName", { length: 255 }).notNull(),
  assetType: ctemAssetTypeEnum("assetType").notNull().default("other"),
  ipDomain: varchar("ipDomain", { length: 255 }),
  region: regionEnum("region").notNull().default("Other"),
  isInternetFacing: integer("isInternetFacing").default(0).notNull(),
  handlesPersonalData: integer("handlesPersonalData").default(0).notNull(),
  handlesCriticalData: integer("handlesCriticalData").default(0).notNull(),
  criticalityScore: integer("criticalityScore").default(5).notNull(),
  status: assetStatusEnum("status").default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CtemAsset = typeof ctemAssets.$inferSelect;
export type InsertCtemAsset = typeof ctemAssets.$inferInsert;

export const ctemVulnerabilities = pgTable("ctemVulnerabilities", {
  id: serial("id").primaryKey(),
  assetId: integer("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
  cveId: varchar("cveId", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: vulnSeverityEnum("severity").notNull().default("medium"),
  cvssScore: integer("cvssScore").default(0).notNull(),
  exploitAvailable: integer("exploitAvailable").default(0).notNull(),
  isConfirmed: integer("isConfirmed").default(0).notNull(),
  isPatched: integer("isPatched").default(0).notNull(),
  discoveredAt: timestamp("discoveredAt").defaultNow().notNull(),
  patchedAt: timestamp("patchedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CtemVulnerability = typeof ctemVulnerabilities.$inferSelect;
export type InsertCtemVulnerability = typeof ctemVulnerabilities.$inferInsert;

export const ctemAttackSimulations = pgTable("ctemAttackSimulations", {
  id: serial("id").primaryKey(),
  assetId: integer("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
  simulationType: simulationTypeEnum("simulationType").notNull().default("other"),
  successProbability: integer("successProbability").default(0).notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  outputSummary: text("outputSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CtemAttackSimulation = typeof ctemAttackSimulations.$inferSelect;
export type InsertCtemAttackSimulation = typeof ctemAttackSimulations.$inferInsert;

export const ctemRiskScores = pgTable("ctemRiskScores", {
  id: serial("id").primaryKey(),
  assetId: integer("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
  exposureScore: integer("exposureScore").default(0).notNull(),
  exploitabilityScore: integer("exploitabilityScore").default(0).notNull(),
  businessImpactScore: integer("businessImpactScore").default(0).notNull(),
  finalPriorityScore: integer("finalPriorityScore").default(0).notNull(),
  priorityTier: priorityTierEnum("priorityTier").notNull().default("low"),
  previousFinalScore: integer("previousFinalScore"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CtemRiskScore = typeof ctemRiskScores.$inferSelect;
export type InsertCtemRiskScore = typeof ctemRiskScores.$inferInsert;

export const continuousComplianceRuns = pgTable("continuousComplianceRuns", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  vendorId: integer("vendorId").references(() => vendors.id, { onDelete: "set null" }),
  runStatus: runStatusEnum("runStatus").notNull().default("queued"),
  triggeredBy: triggeredByEnum("triggeredBy").notNull().default("manual"),
  aiJobId: varchar("aiJobId", { length: 64 }),
  assetsScanned: integer("assetsScanned").default(0).notNull(),
  vulnsFound: integer("vulnsFound").default(0).notNull(),
  exploitableVulns: integer("exploitableVulns").default(0).notNull(),
  avgPriorityScore: integer("avgPriorityScore").default(0).notNull(),
  scoreDelta: integer("scoreDelta"),
  alertRaised: integer("alertRaised").default(0).notNull(),
  summary: text("summary"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContinuousComplianceRun = typeof continuousComplianceRuns.$inferSelect;
export type InsertContinuousComplianceRun = typeof continuousComplianceRuns.$inferInsert;

export const complianceExposureMappings = pgTable("complianceExposureMappings", {
  id: serial("id").primaryKey(),
  vulnerabilityId: integer("vulnerabilityId").notNull().references(() => ctemVulnerabilities.id, { onDelete: "cascade" }),
  frameworkId: integer("frameworkId").references(() => frameworks.id, { onDelete: "set null" }),
  frameworkCode: varchar("frameworkCode", { length: 50 }),
  controlId: integer("controlId").references(() => complianceControls.id, { onDelete: "set null" }),
  controlCode: varchar("controlCode", { length: 100 }),
  mappingReason: text("mappingReason").notNull(),
  severityImpact: severityImpactEnum("severityImpact").notNull().default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ComplianceExposureMapping = typeof complianceExposureMappings.$inferSelect;
export type InsertComplianceExposureMapping = typeof complianceExposureMappings.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ RBAC — Role-Based Access Control & Onboarding
// ═══════════════════════════════════════════════════════════════════════════════

export const userOnboarding = pgTable("userOnboarding", {
  id: serial("id").primaryKey(),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }),
  localUserId: integer("localUserId").references(() => localUsers.id, { onDelete: "cascade" }),
  stage: onboardingStageEnum("stage").default("not_started").notNull(),
  accountIntent: accountIntentEnum("accountIntent"),
  selectedLocale: localeEnum("selectedLocale").default("en").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type InsertUserOnboarding = typeof userOnboarding.$inferInsert;

export const rolePermissions = pgTable("rolePermissions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: integer("userId").references(() => users.id, { onDelete: "cascade" }),
  localUserId: integer("localUserId").references(() => localUsers.id, { onDelete: "cascade" }),
  module: varchar("module", { length: 120 }).notNull(),
  canView: integer("canView").default(0).notNull(),
  canCreate: integer("canCreate").default(0).notNull(),
  canEdit: integer("canEdit").default(0).notNull(),
  canDelete: integer("canDelete").default(0).notNull(),
  canExport: integer("canExport").default(0).notNull(),
  canInvite: integer("canInvite").default(0).notNull(),
  grantedByUserId: integer("grantedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

export const vendorShares = pgTable("vendorShares", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendorId").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  allowedOrgId: integer("allowedOrgId").references(() => organizations.id, { onDelete: "set null" }),
  expiresAt: timestamp("expiresAt"),
  viewCount: integer("viewCount").default(0).notNull(),
  createdByUserId: integer("createdByUserId").references(() => users.id),
  isRevoked: integer("isRevoked").default(0).notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VendorShare = typeof vendorShares.$inferSelect;
export type InsertVendorShare = typeof vendorShares.$inferInsert;

export const regulatorOversightTargets = pgTable("regulatorOversightTargets", {
  id: serial("id").primaryKey(),
  regulatorOrgId: integer("regulatorOrgId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  targetOrgId: integer("targetOrgId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  grantedByAdminId: integer("grantedByAdminId").references(() => users.id),
  expiresAt: timestamp("expiresAt"),
  isActive: integer("isActive").default(1).notNull(),
  justification: text("justification"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type RegulatorOversightTarget = typeof regulatorOversightTargets.$inferSelect;
export type InsertRegulatorOversightTarget = typeof regulatorOversightTargets.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// ▌ COMPLIANCE EVIDENCE LOCKER
// ═══════════════════════════════════════════════════════════════════════

export const complianceEvidence = pgTable("complianceEvidence", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  sourceType: evidenceSourceTypeEnum("sourceType").notNull().default("general"),
  sourceId: integer("sourceId"),
  title: varchar("title", { length: 255 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  description: text("description"),
  addedByUserId: integer("addedByUserId").references(() => localUsers.id, { onDelete: "set null" }),
  tags: varchar("tags", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ComplianceEvidence = typeof complianceEvidence.$inferSelect;
export type InsertComplianceEvidence = typeof complianceEvidence.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// ▌ DATA SUBJECT REQUEST TRACKER
// ═══════════════════════════════════════════════════════════════════════

export const dsrRequests = pgTable("dsrRequests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  requestType: dsrRequestTypeEnum("requestType").notNull(),
  jurisdiction: dsrJurisdictionEnum("jurisdiction").notNull().default("Other"),
  requesterName: varchar("requesterName", { length: 255 }).notNull(),
  requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
  description: text("description"),
  status: dsrStatusEnum("status").notNull().default("received"),
  priority: dsrPriorityEnum("priority").notNull().default("normal"),
  dueDate: timestamp("dueDate").notNull(),
  completedAt: timestamp("completedAt"),
  assignedToUserId: integer("assignedToUserId").references(() => localUsers.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type DsrRequest = typeof dsrRequests.$inferSelect;
export type InsertDsrRequest = typeof dsrRequests.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ SERVICE REQUESTS — Pentest / Audit / SOC / Consulting
// ═══════════════════════════════════════════════════════════════════════════════

export const serviceRequests = pgTable("serviceRequests", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  requestedByUserId: integer("requestedByUserId").references(() => localUsers.id, { onDelete: "set null" }),
  serviceType: serviceTypeEnum("serviceType").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  scopeDetails: text("scopeDetails"),
  preferredStartDate: timestamp("preferredStartDate"),
  budgetRange: varchar("budgetRange", { length: 120 }),
  priority: servicePriorityEnum("priority").default("medium").notNull(),
  status: serviceStatusEnum("status").default("submitted").notNull(),
  assignedToUserId: integer("assignedToUserId").references(() => localUsers.id, { onDelete: "set null" }),
  internalNotes: text("internalNotes"),
  clientResponse: text("clientResponse"),
  respondedAt: timestamp("respondedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = typeof serviceRequests.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ ASSET INVENTORY
// ═══════════════════════════════════════════════════════════════════════════════

export const assetInventory = pgTable("assetInventory", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  assetType: inventoryAssetTypeEnum("assetType").notNull(),
  identifier: varchar("identifier", { length: 512 }),
  owner: varchar("owner", { length: 255 }),
  location: varchar("location", { length: 255 }),
  criticality: criticalityEnum("criticality").default("medium").notNull(),
  exposure: exposureEnum("exposure").default("internal").notNull(),
  status: inventoryStatusEnum("status").default("active").notNull(),
  riskScore: integer("riskScore").default(0).notNull(),
  platform: varchar("platform", { length: 120 }),
  version: varchar("version", { length: 120 }),
  lastScannedAt: timestamp("lastScannedAt"),
  openVulnCount: integer("openVulnCount").default(0).notNull(),
  tags: varchar("tags", { length: 512 }),
  notes: text("notes"),
  addedByUserId: integer("addedByUserId").references(() => localUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AssetInventoryItem = typeof assetInventory.$inferSelect;
export type InsertAssetInventoryItem = typeof assetInventory.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ SECURITY MATURITY
// ═══════════════════════════════════════════════════════════════════════════════

export const securityMaturityAssessments = pgTable("securityMaturityAssessments", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  frameworkRef: varchar("frameworkRef", { length: 64 }),
  scoreGovernance: integer("scoreGovernance").default(1).notNull(),
  scoreAssetManagement: integer("scoreAssetManagement").default(1).notNull(),
  scoreAccessControl: integer("scoreAccessControl").default(1).notNull(),
  scoreDataProtection: integer("scoreDataProtection").default(1).notNull(),
  scoreNetworkSecurity: integer("scoreNetworkSecurity").default(1).notNull(),
  scoreVulnerabilityMgmt: integer("scoreVulnerabilityMgmt").default(1).notNull(),
  scoreIncidentResponse: integer("scoreIncidentResponse").default(1).notNull(),
  scoreBackupRecovery: integer("scoreBackupRecovery").default(1).notNull(),
  scoreThirdPartyRisk: integer("scoreThirdPartyRisk").default(1).notNull(),
  scoreSecurityAwareness: integer("scoreSecurityAwareness").default(1).notNull(),
  overallScore: integer("overallScore").default(0).notNull(),
  maturityLevel: maturityLevelEnum("maturityLevel").default("initial").notNull(),
  recommendations: text("recommendations"),
  assessedByUserId: integer("assessedByUserId").references(() => localUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SecurityMaturityAssessment = typeof securityMaturityAssessments.$inferSelect;
export type InsertSecurityMaturityAssessment = typeof securityMaturityAssessments.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ THREAT INTELLIGENCE FEED
// ═══════════════════════════════════════════════════════════════════════════════

export const threatIntelItems = pgTable("threatIntelItems", {
  id: serial("id").primaryKey(),
  organizationId: integer("organizationId").references(() => organizations.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  threatActor: varchar("threatActor", { length: 180 }),
  category: threatCategoryEnum("category").notNull(),
  severity: threatSeverityEnum("severity").default("medium").notNull(),
  tlp: tlpEnum("tlp").default("white").notNull(),
  affectedSectors: varchar("affectedSectors", { length: 512 }),
  indicators: text("indicators"),
  referenceUrl: varchar("referenceUrl", { length: 1024 }),
  cveId: varchar("cveId", { length: 32 }),
  cvssScore: varchar("cvssScore", { length: 8 }),
  isActive: integer("isActive").default(1).notNull(),
  createdByUserId: integer("createdByUserId").references(() => localUsers.id, { onDelete: "set null" }),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ThreatIntelItem = typeof threatIntelItems.$inferSelect;
export type InsertThreatIntelItem = typeof threatIntelItems.$inferInsert;

export const yallaAdminSessions = pgTable("yallaAdminSessions", {
  id: varchar("id", { length: 64 }).primaryKey().notNull(),
  adminUsername: varchar("adminUsername", { length: 120 }).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }).notNull(),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  isRevoked: integer("isRevoked").default(0).notNull(),
});

export type YallaAdminSession = typeof yallaAdminSessions.$inferSelect;
export type InsertYallaAdminSession = typeof yallaAdminSessions.$inferInsert;

export const yallaAdminAuditLogs = pgTable("yallaAdminAuditLogs", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }),
  adminUsername: varchar("adminUsername", { length: 120 }).notNull(),
  action: varchar("action", { length: 120 }).notNull(),
  target: varchar("target", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 64 }).notNull(),
  payload: text("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type YallaAdminAuditLog = typeof yallaAdminAuditLogs.$inferSelect;
export type InsertYallaAdminAuditLog = typeof yallaAdminAuditLogs.$inferInsert;

export const otpCodes = pgTable("otpCodes", {
  id: serial("id").primaryKey(),
  identifier: varchar("identifier", { length: 320 }).notNull(), // email or phone number
  codeHash: varchar("codeHash", { length: 64 }).notNull(), // SHA-256 of OTP
  purpose: varchar("purpose", { length: 32 }).notNull().default("login"), // login | register
  expiresAt: timestamp("expiresAt").notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = typeof otpCodes.$inferInsert;
