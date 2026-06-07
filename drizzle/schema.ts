import { int, mysqlEnum, mysqlTable, text, timestamp, tinyint, varchar } from "drizzle-orm/mysql-core";

// ─── Local Auth Users ──────────────────────────────────────────────────────────
/**
 * Stores platform-native (username/password) registrations.
 * Kept separate from the OAuth `users` table for clean segmentation.
 *
 * User types:
 *   visitor     – general explorer; only name + email required
 *   professional– CEO/CTO/Compliance Officer; extended profile fields
 *   admin       – platform administrator; created server-side only
 */
export const localUsers = mysqlTable("localUsers", {
  id: int("id").autoincrement().primaryKey(),
  /** Full display name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Unique login email — also used as username */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** bcrypt hash — NEVER store plaintext */
  passwordHash: varchar("passwordHash", { length: 72 }).notNull(),
  /** Segmentation: visitor | professional | admin | basic_user | professional_user | company_admin | platform_admin | yalla_hack_employee | super_admin */
  userType: mysqlEnum("userType", [
    "visitor",
    "professional",
    "admin",
    "basic_user",
    "professional_user",
    "company_admin",
    "platform_admin",
    "yalla_hack_employee",
    "super_admin",
  ])
    .default("visitor")
    .notNull(),
  /** Professional-only fields */
  companyName: varchar("companyName", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 120 }),
  industry: varchar("industry", { length: 120 }),
  complianceResponsibility: text("complianceResponsibility"),
  preferredLocale: mysqlEnum("preferredLocale", ["en", "ar", "zh"])
    .default("en")
    .notNull(),
  status: mysqlEnum("status", ["active", "pending", "suspended"])
    .default("pending")
    .notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
  /** TOTP 2FA: base32 secret stored once confirmed */
  totpSecret: varchar("totpSecret", { length: 64 }),
  /** 1 when 2FA is active for this account */
  mfaEnabled: int("mfaEnabled").default(0).notNull(),
  /** JSON-serialised array of 8 one-time backup codes (hashed) */
  mfaBackupCodes: text("mfaBackupCodes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LocalUser = typeof localUsers.$inferSelect;
export type InsertLocalUser = typeof localUsers.$inferInsert;

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  organizationName: varchar("organizationName", { length: 255 }),
  organizationType: varchar("organizationType", { length: 120 }),
  jobTitle: varchar("jobTitle", { length: 120 }),
  preferredLocale: mysqlEnum("preferredLocale", ["en", "ar", "zh"])
    .default("en")
    .notNull(),
  /** Platform role — governs feature access and dashboard tier */
  role: mysqlEnum("role", [
    "user",
    "admin",
    "basic_user",
    "professional_user",
    "company_admin",
    "platform_admin",
    "yalla_hack_employee",
    "super_admin",
  ]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "invited", "suspended"])
    .default("active")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Export all types for convenience
 */
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

/**
 * Visitor and onboarding intake records.
 * Captures public registration interest before OAuth identity exists.
 */
export const accessRequests = mysqlTable("accessRequests", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  organizationType: varchar("organizationType", { length: 120 }),
  useCase: text("useCase"),
  preferredLocale: mysqlEnum("preferredLocale", ["en", "ar", "zh"])
    .default("en")
    .notNull(),
  status: mysqlEnum("status", ["new", "reviewing", "approved", "archived"])
    .default("new")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = typeof accessRequests.$inferInsert;

/**
 * Consultation/support workflow records.
 * Supports both visitor and authenticated client inquiries.
 */
export const consultationRequests = mysqlTable("consultationRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  organizationName: varchar("organizationName", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 255 }).notNull(),
  jurisdictions: text("jurisdictions"),
  summary: text("summary").notNull(),
  vendorName: varchar("vendorName", { length: 255 }),
  techStackSummary: text("techStackSummary"),
  status: mysqlEnum("status", ["new", "in_review", "responded", "closed"])
    .default("new")
    .notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"])
    .default("medium")
    .notNull(),
  assignedAdminUserId: int("assignedAdminUserId").references(() => users.id),
  adminResponse: text("adminResponse"),
  respondedAt: timestamp("respondedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConsultationRequest = typeof consultationRequests.$inferSelect;
export type InsertConsultationRequest = typeof consultationRequests.$inferInsert;

/**
 * Structured user and platform activity stream.
 * Powers admin analytics, auditing, and notification generation.
 */
export const activityEvents = mysqlTable("activityEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id),
  /** Local (password) user reference — set when actorType relates to a localUser */
  localUserId: int("localUserId").references(() => localUsers.id),
  actorType: mysqlEnum("actorType", ["visitor", "client", "admin", "system"])
    .notNull(),
  /** Platform role of the actor at time of event */
  actorRole: varchar("actorRole", { length: 64 }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entityType", { length: 120 }).notNull(),
  entityId: int("entityId"),
  /** Target entity name/ref (e.g. vendor name, framework code) */
  targetEntity: varchar("targetEntity", { length: 255 }),
  /** Full event payload — JSON, sanitized */
  payload: text("payload"),
  /** Hashed IP for privacy-safe geo/bot detection */
  ipHash: varchar("ipHash", { length: 64 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityEvent = typeof activityEvents.$inferSelect;
export type InsertActivityEvent = typeof activityEvents.$inferInsert;

/**
 * Admin-facing notifications derived from platform activity.
 */
export const adminNotifications = mysqlTable("adminNotifications", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", [
    "registration",
    "consultation",
    "assessment",
    "support",
    "system",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  entityType: varchar("entityType", { length: 120 }),
  entityId: int("entityId"),
  isRead: int("isRead").default(0).notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;
export type InsertAdminNotification = typeof adminNotifications.$inferInsert;

/**
 * Compliance Framework Definitions
 * Stores the core frameworks: CSL, DSL, PIPL, PDPL, NCA
 */
export const frameworks = mysqlTable("frameworks", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(), // CSL, DSL, PIPL, PDPL, NCA
  name: text("name").notNull(),
  country: varchar("country", { length: 50 }).notNull(), // China, Saudi Arabia
  description: text("description"),
  scope: text("scope"), // Who it applies to
  enforcementAuthority: varchar("enforcementAuthority", { length: 255 }),
  maxPenalty: varchar("maxPenalty", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Framework = typeof frameworks.$inferSelect;
export type InsertFramework = typeof frameworks.$inferInsert;

/**
 * Compliance Controls/Requirements
 * Stores specific requirements, controls, and obligations for each framework
 */
export const complianceControls = mysqlTable("complianceControls", {
  id: int("id").autoincrement().primaryKey(),
  frameworkId: int("frameworkId").notNull().references(() => frameworks.id),
  controlCode: varchar("controlCode", { length: 100 }).notNull(),
  controlName: text("controlName").notNull(),
  category: varchar("category", { length: 100 }), // e.g., Data Protection, Security, Consent
  description: text("description"),
  requirement: text("requirement"), // Detailed requirement text
  applicability: varchar("applicability", { length: 255 }), // Who must comply
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceControl = typeof complianceControls.$inferSelect;
export type InsertComplianceControl = typeof complianceControls.$inferInsert;

/**
 * Framework Relationships & Dependencies
 * Maps overlaps, conflicts, and dependencies between frameworks
 */
export const frameworkRelationships = mysqlTable("frameworkRelationships", {
  id: int("id").autoincrement().primaryKey(),
  sourceFrameworkId: int("sourceFrameworkId").notNull().references(() => frameworks.id),
  targetFrameworkId: int("targetFrameworkId").notNull().references(() => frameworks.id),
  relationshipType: mysqlEnum("relationshipType", [
    "overlap",
    "conflict",
    "harmonization",
    "coordination",
    "gap",
    "dependency",
  ]).notNull(),
  description: text("description"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]),
  riskLevel: varchar("riskLevel", { length: 50 }),
  mitigation: text("mitigation"), // How to address the relationship
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FrameworkRelationship = typeof frameworkRelationships.$inferSelect;
export type InsertFrameworkRelationship = typeof frameworkRelationships.$inferInsert;

/**
 * Control Mappings
 * Maps which controls from different frameworks relate to each other
 */
export const controlMappings = mysqlTable("controlMappings", {
  id: int("id").autoincrement().primaryKey(),
  sourceControlId: int("sourceControlId").notNull().references(() => complianceControls.id),
  targetControlId: int("targetControlId").notNull().references(() => complianceControls.id),
  mappingType: mysqlEnum("mappingType", ["equivalent", "related", "conflicting", "complementary"]).notNull(),
  alignmentScore: int("alignmentScore"), // 0-100 percentage
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ControlMapping = typeof controlMappings.$inferSelect;
export type InsertControlMapping = typeof controlMappings.$inferInsert;

/**
 * Vendor Profiles
 * Stores information about vendors and their technology stacks
 */
export const vendors = mysqlTable("vendors", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  /** Organization this vendor belongs to. NULL = legacy / dev-bypass record isolated by userId only. */
  organizationId: int("organizationId").references(() => organizations.id),
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

/**
 * Technology Stack Components
 * Stores technology stack details for vendors
 */
export const techStackComponents = mysqlTable("techStackComponents", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  componentName: varchar("componentName", { length: 255 }).notNull(),
  componentType: varchar("componentType", { length: 100 }), // e.g., Database, API, Storage
  technology: varchar("technology", { length: 255 }),
  description: text("description"),
  dataHandling: text("dataHandling"), // How it handles data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TechStackComponent = typeof techStackComponents.$inferSelect;
export type InsertTechStackComponent = typeof techStackComponents.$inferInsert;

/**
 * Vendor Compliance Assessments
 * Stores assessment results for vendor technology stacks against compliance frameworks
 */
export const vendorAssessments = mysqlTable("vendorAssessments", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull().references(() => vendors.id),
  frameworkId: int("frameworkId").notNull().references(() => frameworks.id),
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  complianceScore: int("complianceScore"), // 0-100
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]),
  status: mysqlEnum("status", ["compliant", "partial", "non_compliant", "unknown"]),
  findings: text("findings"), // JSON array of findings
  recommendations: text("recommendations"), // JSON array of recommendations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VendorAssessment = typeof vendorAssessments.$inferSelect;
export type InsertVendorAssessment = typeof vendorAssessments.$inferInsert;

/**
 * Assessment Gaps
 * Tracks specific compliance gaps found during vendor assessments
 */
export const assessmentGaps = mysqlTable("assessmentGaps", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => vendorAssessments.id),
  controlId: int("controlId").notNull().references(() => complianceControls.id),
  gapDescription: text("gapDescription"),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]),
  remediation: text("remediation"),
  estimatedRemediationCost: varchar("estimatedRemediationCost", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssessmentGap = typeof assessmentGaps.$inferSelect;
export type InsertAssessmentGap = typeof assessmentGaps.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ SAAS MULTI-TENANCY & BILLING  (Migration: 0005_saas_billing)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Organizations — top-level tenant unit.
 * Every paying customer belongs to exactly one organization.
 * Users can belong to multiple organizations via organizationMembers.
 */
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique slug for URLs: acme-corp */
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  /** Display name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Administrative email — receives billing / trial emails */
  billingEmail: varchar("billingEmail", { length: 320 }).notNull(),
  /** Industry vertical */
  industry: varchar("industry", { length: 120 }),
  /** Primary operating jurisdiction (China / Saudi Arabia / Both) */
  primaryJurisdiction: mysqlEnum("primaryJurisdiction", ["China", "Saudi Arabia", "Both", "Other"]).default("Both"),
  /** Stripe Customer ID — set once checkout is initiated */
  stripeCustomerId: varchar("stripeCustomerId", { length: 64 }),
  /** Current subscription plan */
  plan: mysqlEnum("plan", ["free_trial", "starter", "professional", "enterprise"]).default("free_trial").notNull(),
  /** Trial state */
  trialStartedAt: timestamp("trialStartedAt"),
  trialEndsAt: timestamp("trialEndsAt"),
  trialReminderDay3Sent: int("trialReminderDay3Sent").default(0).notNull(),
  trialReminderDay6Sent: int("trialReminderDay6Sent").default(0).notNull(),
  trialExpiredNoticeSent: int("trialExpiredNoticeSent").default(0).notNull(),
  /** Whether org is actively billable */
  isActive: int("isActive").default(1).notNull(),
  /** Seat limit per plan */
  maxSeats: int("maxSeats").default(5).notNull(),
  /** Custom metadata (JSON) */
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;

/**
 * Organization Members — maps users to organizations with RBAC.
 * Roles:
 *   owner            – full control, billing access, can delete org
 *   admin            – full feature access, manage members
 *   compliance_officer – read/write compliance tools, reports, vendors
 *   analyst          – read-only insight access + can run assessments
 */
export const organizationMembers = mysqlTable("organizationMembers", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  userId: int("userId").references(() => users.id),
  localUserId: int("localUserId").references(() => localUsers.id),
  role: mysqlEnum("role", ["owner", "admin", "compliance_officer", "analyst"])
    .default("analyst")
    .notNull(),
  invitedByUserId: int("invitedByUserId"),
  inviteEmail: varchar("inviteEmail", { length: 320 }),
  inviteToken: varchar("inviteToken", { length: 64 }),
  inviteAcceptedAt: timestamp("inviteAcceptedAt"),
  status: mysqlEnum("status", ["active", "invited", "suspended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = typeof organizationMembers.$inferInsert;

/**
 * Subscriptions — one active subscription per organization.
 * Mirrors Stripe subscription lifecycle state.
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  /** Stripe Subscription ID */
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 64 }).unique(),
  /** Stripe Price ID for the active interval */
  stripePriceId: varchar("stripePriceId", { length: 64 }),
  plan: mysqlEnum("plan", ["starter", "professional", "enterprise"]).notNull(),
  billingInterval: mysqlEnum("billingInterval", ["monthly", "quarterly", "biannual", "annual"]).notNull(),
  /** Derived amount in USD cents */
  amountCents: int("amountCents").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  status: mysqlEnum("status", [
    "trialing",
    "active",
    "past_due",
    "canceled",
    "incomplete",
    "paused",
  ]).default("trialing").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: int("cancelAtPeriodEnd").default(0).notNull(),
  canceledAt: timestamp("canceledAt"),
  /** Stripe Invoice from last successful charge */
  lastInvoiceId: varchar("lastInvoiceId", { length: 64 }),
  /** Raw Stripe event metadata for audit */
  stripeMetadata: text("stripeMetadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Billing Events — immutable ledger of every Stripe webhook event.
 * Provides full audit trail for payments, refunds, invoices.
 */
export const billingEvents = mysqlTable("billingEvents", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  subscriptionId: int("subscriptionId").references(() => subscriptions.id),
  /** Stripe event ID — idempotency guard */
  stripeEventId: varchar("stripeEventId", { length: 64 }).unique(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  /** invoice.paid | charge.refunded | customer.subscription.updated, etc. */
  status: mysqlEnum("status", ["success", "failed", "pending", "refunded"]).default("pending").notNull(),
  amountCents: int("amountCents"),
  currency: varchar("currency", { length: 3 }).default("USD"),
  description: text("description"),
  /** Full Stripe payload (JSON string) for replay/debugging */
  rawPayload: text("rawPayload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillingEvent = typeof billingEvents.$inferSelect;
export type InsertBillingEvent = typeof billingEvents.$inferInsert;

/**
 * Compliance Reports — AI-generated reports persisted per organization.
 * Each report is versioned and linked to the frameworks it covers.
 */
export const complianceReports = mysqlTable("complianceReports", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id),
  generatedByUserId: int("generatedByUserId").references(() => users.id),
  generatedByLocalUserId: int("generatedByLocalUserId").references(() => localUsers.id),
  title: varchar("title", { length: 255 }).notNull(),
  reportType: mysqlEnum("reportType", [
    "full_compliance",
    "gap_analysis",
    "vendor_assessment",
    "risk_assessment",
    "executive_summary",
    "regulatory_deadline",
  ]).notNull(),
  /** Frameworks covered (JSON array of framework codes) */
  frameworks: text("frameworks").notNull(),
  /** AI job ID that produced this report */
  aiJobId: varchar("aiJobId", { length: 64 }),
  /** Report version — incremented on regeneration */
  version: int("version").default(1).notNull(),
  /** Overall posture score 0-100 */
  overallScore: int("overallScore"),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high", "critical"]),
  /** Full structured JSON report body */
  reportBody: text("reportBody").notNull(),
  /** Whether exported to PDF */
  exportedAt: timestamp("exportedAt"),
  exportedPdfUrl: varchar("exportedPdfUrl", { length: 512 }),
  status: mysqlEnum("status", ["generating", "ready", "failed", "archived"]).default("generating").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceReport = typeof complianceReports.$inferSelect;
export type InsertComplianceReport = typeof complianceReports.$inferInsert;

/**
 * API Keys — programmatic access tokens for CI/CD and integrations.
 * Raw key is never stored; only a SHA-256 hex hash and display prefix.
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  createdByUserId: int("createdByUserId").references(() => users.id),
  /** Human-readable label e.g. "GitHub Actions" */
  name: varchar("name", { length: 120 }).notNull(),
  /** SHA-256 hex of the raw key — never stored plaintext */
  keyHash: varchar("keyHash", { length: 64 }).notNull().unique(),
  /** First 8 chars of raw key, shown in UI after creation */
  keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(),
  /** JSON array of scope strings e.g. ["vendor:read","report:read"] */
  scopes: text("scopes"),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * User Interaction Logs — comprehensive capture of all user actions.
 * Feeds AI analytics, product usage dashboards, and regulatory audit trails.
 * All sensitive input is stored encrypted-at-rest in production.
 */
export const userInteractionLogs = mysqlTable("userInteractionLogs", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").references(() => organizations.id),
  userId: int("userId").references(() => users.id),
  localUserId: int("localUserId").references(() => localUsers.id),
  sessionId: varchar("sessionId", { length: 64 }),
  /** Page, module, or feature where the interaction happened */
  context: varchar("context", { length: 120 }).notNull(),
  /** Specific action type: 'run_assessment', 'generate_report', 'view_page', etc. */
  action: varchar("action", { length: 120 }).notNull(),
  /** Entity being acted on */
  entityType: varchar("entityType", { length: 120 }),
  entityId: int("entityId"),
  /** Inputs provided by the user (JSON — sanitized before storage) */
  inputSnapshot: text("inputSnapshot"),
  /** Output reference or summary */
  outputRef: text("outputRef"),
  /** Duration in ms for performance tracking */
  durationMs: int("durationMs"),
  /** Client IP (hashed for privacy) */
  ipHash: varchar("ipHash", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserInteractionLog = typeof userInteractionLogs.$inferSelect;
export type InsertUserInteractionLog = typeof userInteractionLogs.$inferInsert;

/**
 * One-time owner-access link nonces consumed by the isolated Yalla-Admin bootstrap flow.
 * Only the nonce hash is stored so the raw share token never lands in the database.
 */
export const yallaAdminAccessLinkNonces = mysqlTable("yallaAdminAccessLinkNonces", {
  id: int("id").autoincrement().primaryKey(),
  nonceHash: varchar("nonceHash", { length: 64 }).notNull().unique(),
  redirectTarget: varchar("redirectTarget", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt").defaultNow().notNull(),
  consumedByIp: varchar("consumedByIp", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type YallaAdminAccessLinkNonce = typeof yallaAdminAccessLinkNonces.$inferSelect;
export type InsertYallaAdminAccessLinkNonce = typeof yallaAdminAccessLinkNonces.$inferInsert;

/**
 * Compliance Deadlines — jurisdiction-specific regulatory milestones.
 * Drives reminder notifications and the compliance calendar view.
 */
export const complianceDeadlines = mysqlTable("complianceDeadlines", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").references(() => organizations.id),
  frameworkCode: varchar("frameworkCode", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  deadlineDate: timestamp("deadlineDate").notNull(),
  jurisdiction: mysqlEnum("jurisdiction", ["China", "Saudi Arabia", "Both"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["upcoming", "overdue", "completed", "waived"]).default("upcoming").notNull(),
  /** JSON array of notification send timestamps */
  notificationsSent: text("notificationsSent"),
  assignedToUserId: int("assignedToUserId").references(() => users.id),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceDeadline = typeof complianceDeadlines.$inferSelect;
export type InsertComplianceDeadline = typeof complianceDeadlines.$inferInsert;

/**
 * Audit Logs — immutable, granular record of every security and data-change event.
 * Backs the Super Admin audit-trail view and compliance evidence exports.
 *
 * Event categories:
 *   auth          – login / logout / token refresh / failed attempts
 *   data_write    – create / update / delete on any entity
 *   data_read     – sensitive read events (admin views, exports)
 *   role_change   – privilege escalation / de-escalation
 *   system        – AI orchestrator lifecycle, queue events, errors
 *   billing       – plan changes, Stripe webhooks
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  /** Platform user (OAuth) */
  userId: int("userId").references(() => users.id),
  /** Local (password) user */
  localUserId: int("localUserId").references(() => localUsers.id),
  /** Organisation context — null for platform-level events */
  organizationId: int("organizationId").references(() => organizations.id),
  /** Role at the time the event occurred */
  actorRole: varchar("actorRole", { length: 64 }),
  /** Broad event category */
  category: mysqlEnum("category", [
    "auth",
    "data_write",
    "data_read",
    "role_change",
    "system",
    "billing",
  ]).notNull(),
  /** Fine-grained action label, e.g. "vendor.create", "user.role.assign" */
  action: varchar("action", { length: 120 }).notNull(),
  /** Entity type affected (vendors, users, organizations …) */
  entityType: varchar("entityType", { length: 120 }),
  /** Numeric PK of affected entity */
  entityId: int("entityId"),
  /** Human-readable entity name/reference */
  targetEntity: varchar("targetEntity", { length: 255 }),
  /** Result of the action */
  outcome: mysqlEnum("outcome", ["success", "failure", "blocked"]).default("success").notNull(),
  /** Sanitized request / change payload (JSON) */
  payload: text("payload"),
  /** Privacy-safe hashed IP */
  ipHash: varchar("ipHash", { length: 64 }),
  /** User-Agent string, truncated */
  userAgent: varchar("userAgent", { length: 512 }),
  /** ISO timestamp — indexed for range queries */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ---------------------------------------------------------------------------
// Report Shares — signed share tokens for compliance reports
// ---------------------------------------------------------------------------
/**
 * Stores time-limited share tokens that allow public (unauthenticated) access
 * to a specific compliance report configuration.  A token encodes jurisdiction,
 * locale, and report type — no report body is stored; it is re-generated on
 * each view.
 */
export const reportShares = mysqlTable("reportShares", {
  id: int("id").autoincrement().primaryKey(),
  /** 32-byte URL-safe hex token — UUID v4 without dashes */
  token: varchar("token", { length: 64 }).notNull().unique(),
  jurisdiction: varchar("jurisdiction", { length: 64 }).notNull(),
  locale: mysqlEnum("locale", ["en", "ar", "zh"]).default("en").notNull(),
  reportType: varchar("reportType", { length: 64 }).notNull(),
  /** User who created the share link (nullable — guest shares not currently exposed) */
  createdByUserId: int("createdByUserId").references(() => users.id),
  /** Number of times the share link has been viewed */
  viewCount: int("viewCount").default(0).notNull(),
  /** Hard expiry — 7 days after creation by default */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ReportShare = typeof reportShares.$inferSelect;
export type InsertReportShare = typeof reportShares.$inferInsert;

// ---------------------------------------------------------------------------
// Remediation Tasks — Phase 29
// ---------------------------------------------------------------------------
/**
 * Tracks actionable remediation tasks derived from compliance gap findings.
 * Each task can optionally be linked to a vendor and a specific gap code,
 * assigned to an org member, and moved through a 4-stage Kanban workflow.
 */
export const remediationTasks = mysqlTable("remediationTasks", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  /** Optional link to a vendor profile */
  vendorId: int("vendorId"),
  /** Gap code from the assessment engine, e.g. "PIPL-DPO-001" */
  gapCode: varchar("gapCode", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull().default("medium"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "accepted_risk"]).notNull().default("open"),
  /** organizationMembers.id of the assigned member (null = unassigned) */
  assignedToUserId: int("assignedToUserId"),
  /** Optional target completion date */
  dueDate: timestamp("dueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RemediationTask = typeof remediationTasks.$inferSelect;
export type InsertRemediationTask = typeof remediationTasks.$inferInsert;

// ---------------------------------------------------------------------------
// Risk Register — Phase 30
// ---------------------------------------------------------------------------
/**
 * Formal risk register: each entry captures a named risk with a 5×5
 * likelihood × impact matrix score, treatment decision, optional linkage to
 * a vendor or gap finding, and an assigned owner.
 *
 * Risk score = likelihood (1-5) × impact (1-5):
 *   1-4   → Low
 *   5-9   → Medium
 *   10-14 → High
 *   15-25 → Critical
 */
export const riskRegister = mysqlTable("riskRegister", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  /** Broad risk category */
  category: mysqlEnum("category", ["operational", "legal", "technical", "financial", "reputational"]).notNull().default("operational"),
  /** Likelihood of occurrence: 1 (rare) – 5 (almost certain) */
  likelihood: int("likelihood").notNull().default(3),
  /** Impact if realized: 1 (negligible) – 5 (catastrophic) */
  impact: int("impact").notNull().default(3),
  /** Risk treatment decision */
  treatment: mysqlEnum("treatment", ["accept", "mitigate", "transfer", "avoid"]).notNull().default("mitigate"),
  /** Current lifecycle stage */
  status: mysqlEnum("status", ["open", "in_treatment", "closed", "accepted"]).notNull().default("open"),
  /** organizationMembers.id of the risk owner (nullable = unowned) */
  ownerId: int("ownerId"),
  /** Optional link to a vendor profile */
  vendorId: int("vendorId"),
  /** Gap code from assessment engine, e.g. "PIPL-DPO-001" */
  gapCode: varchar("gapCode", { length: 64 }),
  /** Framework control reference, e.g. "PIPL Art.28" or "NCA ECC-2-1-1" */
  controlReference: varchar("controlReference", { length: 128 }),
  /** Date this risk should be reviewed next */
  reviewDate: timestamp("reviewDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RiskEntry = typeof riskRegister.$inferSelect;
export type InsertRiskEntry = typeof riskRegister.$inferInsert;

// ---------------------------------------------------------------------------
// Compliance Policies — Phase 31
// ---------------------------------------------------------------------------
/**
 * Policy document registry.  Each entry represents an internal compliance
 * policy, standard, or procedure mapped to one or more framework controls.
 *
 * Lifecycle:
 *   draft → under_review → approved → active → retired
 *
 * Review cycle fields allow reminders when a policy is due for renewal.
 */
export const compliancePolicies = mysqlTable("compliancePolicies", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  /** Policy identifier / code, e.g. "POL-PIPL-001" */
  policyCode: varchar("policyCode", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  /** Policy type */
  policyType: mysqlEnum("policyType", ["policy", "standard", "procedure", "guideline"]).notNull().default("policy"),
  /** Applicable compliance frameworks (JSON array of codes, e.g. ["PIPL","PDPL"]) */
  frameworks: text("frameworks"),
  /** Mapped control references (JSON array, e.g. ["PIPL Art.28","NCA ECC-2-1-1"]) */
  controlReferences: text("controlReferences"),
  /** Lifecycle status */
  status: mysqlEnum("status", ["draft", "under_review", "approved", "active", "retired"]).notNull().default("draft"),
  /** organizationMembers.id of the policy owner */
  ownerId: int("ownerId"),
  /** Review frequency in months (e.g. 12 = annual) */
  reviewCycleMonths: int("reviewCycleMonths").default(12),
  /** Date of last approval */
  lastApprovedAt: timestamp("lastApprovedAt"),
  /** Date next review is due */
  nextReviewAt: timestamp("nextReviewAt"),
  /** Version label: "1.0", "2.3" etc. */
  version: varchar("version", { length: 20 }).default("1.0"),
  /** Optional URL or path to the document file */
  documentUrl: varchar("documentUrl", { length: 512 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CompliancePolicy = typeof compliancePolicies.$inferSelect;
export type InsertCompliancePolicy = typeof compliancePolicies.$inferInsert;

// ─── Compliance Incident Register (Phase 32) ─────────────────────────────────

export const complianceIncidents = mysqlTable("complianceIncidents", {
  id: int("id").primaryKey().autoincrement(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),

  // Identity
  incidentCode: varchar("incidentCode", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  // Classification
  incidentType: mysqlEnum("incidentType", [
    "data_breach", "unauthorized_access", "policy_violation",
    "system_outage", "third_party_breach", "other",
  ]).default("other").notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  status: mysqlEnum("status", [
    "open", "under_investigation", "contained", "resolved", "closed",
  ]).default("open").notNull(),

  // Linkage
  affectedFrameworks: text("affectedFrameworks"),    // JSON string[]
  affectedVendorId: int("affectedVendorId"),       // nullable FK (no onDelete to avoid cascade complexity)
  affectedDataTypes: text("affectedDataTypes"),     // JSON string[]
  affectedDataSubjects: int("affectedDataSubjects"), // count of impacted data subjects

  // People
  reportedById: int("reportedById"),               // organizationMembers.id (nullable)

  // Timeline
  occurredAt: timestamp("occurredAt"),
  detectedAt: timestamp("detectedAt"),
  containedAt: timestamp("containedAt"),
  resolvedAt: timestamp("resolvedAt"),

  // Regulatory notification
  regulatoryNotificationRequired: tinyint("regulatoryNotificationRequired").default(0).notNull(),
  regulatoryNotificationSentAt: timestamp("regulatoryNotificationSentAt"),
  notificationDeadlineHours: int("notificationDeadlineHours").default(72), // PIPL/GDPR 72h default

  // Analysis
  rootCause: text("rootCause"),
  lessonsLearned: text("lessonsLearned"),
  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceIncident = typeof complianceIncidents.$inferSelect;
export type InsertComplianceIncident = typeof complianceIncidents.$inferInsert;

// ── Phase 33: Audit Schedules ─────────────────────────────────────────────────
export const auditSchedules = mysqlTable("auditSchedules", {
  id: int("id").primaryKey().autoincrement(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),

  auditType: mysqlEnum("auditType", ["internal", "external", "regulatory", "certification"]).default("internal").notNull(),
  scope: text("scope"), // JSON string[] of framework codes

  status: mysqlEnum("status", ["planned", "in_progress", "completed", "cancelled"]).default("planned").notNull(),

  scheduledDate: timestamp("scheduledDate").notNull(),
  completedDate: timestamp("completedDate"),

  assignedToId: int("assignedToId"),
  vendorId: int("vendorId"),

  findings: text("findings"),
  recurrence: mysqlEnum("recurrence", ["none", "monthly", "quarterly", "biannual", "annual"]).default("none").notNull(),
  nextOccurrence: timestamp("nextOccurrence"),

  notes: text("notes"),

  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AuditSchedule = typeof auditSchedules.$inferSelect;
export type InsertAuditSchedule = typeof auditSchedules.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ CTEM — Continuous Threat Exposure Management  (Migration: 0007_ctem)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Assets — inventoried IT/OT/data assets tracked per vendor.
 * Each asset is the unit of analysis for CTEM scoring.
 */
export const ctemAssets = mysqlTable("ctemAssets", {
  id: int("id").primaryKey().autoincrement(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  vendorId: int("vendorId").references(() => vendors.id, { onDelete: "set null" }),
  assetName: varchar("assetName", { length: 255 }).notNull(),
  assetType: mysqlEnum("assetType", [
    "web_application",
    "api_endpoint",
    "database",
    "cloud_service",
    "network_device",
    "iot_device",
    "data_pipeline",
    "identity_provider",
    "storage_bucket",
    "other",
  ]).notNull().default("other"),
  /** Public IP, domain, or internal CIDR — hashed if sensitive */
  ipDomain: varchar("ipDomain", { length: 255 }),
  /** Primary deployment region */
  region: mysqlEnum("region", ["China", "Saudi Arabia", "Cross-border", "Other"]).notNull().default("Other"),
  /** Is this asset internet-facing? 1 = yes */
  isInternetFacing: tinyint("isInternetFacing").default(0).notNull(),
  /** Handles personal data under PIPL/PDPL? 1 = yes */
  handlesPersonalData: tinyint("handlesPersonalData").default(0).notNull(),
  /** Handles critical data under DSL/NCA? 1 = yes */
  handlesCriticalData: tinyint("handlesCriticalData").default(0).notNull(),
  /** 1 (low) – 10 (critical) business criticality */
  criticalityScore: int("criticalityScore").default(5).notNull(),
  status: mysqlEnum("status", ["active", "inactive", "decommissioned"]).default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CtemAsset = typeof ctemAssets.$inferSelect;
export type InsertCtemAsset = typeof ctemAssets.$inferInsert;

/**
 * Vulnerabilities — CVEs and custom findings linked to an asset.
 * The exploitAvailable flag is critical: only exploitable vulns drive CTEM priority.
 */
export const ctemVulnerabilities = mysqlTable("ctemVulnerabilities", {
  id: int("id").primaryKey().autoincrement(),
  assetId: int("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
  /** CVE ID if applicable, e.g. CVE-2024-12345 */
  cveId: varchar("cveId", { length: 64 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low", "informational"]).notNull().default("medium"),
  /** CVSS v3 base score 0.0–10.0 stored as integer ×10. e.g. 85 = 8.5 */
  cvssScore: int("cvssScore").default(0).notNull(),
  /** Public exploit available? 1 = yes — primary CTEM differentiator */
  exploitAvailable: tinyint("exploitAvailable").default(0).notNull(),
  /** Has this been validated/confirmed? */
  isConfirmed: tinyint("isConfirmed").default(0).notNull(),
  /** Is it patched / remediated? */
  isPatched: tinyint("isPatched").default(0).notNull(),
  discoveredAt: timestamp("discoveredAt").defaultNow().notNull(),
  patchedAt: timestamp("patchedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CtemVulnerability = typeof ctemVulnerabilities.$inferSelect;
export type InsertCtemVulnerability = typeof ctemVulnerabilities.$inferInsert;

/**
 * Attack Simulations — BAS-style simulated attack runs against an asset.
 * successProbability = 0–100 integer percentage.
 */
export const ctemAttackSimulations = mysqlTable("ctemAttackSimulations", {
  id: int("id").primaryKey().autoincrement(),
  assetId: int("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
  simulationType: mysqlEnum("simulationType", [
    "lateral_movement",
    "privilege_escalation",
    "data_exfiltration",
    "ransomware",
    "phishing",
    "api_abuse",
    "supply_chain",
    "ddos",
    "insider_threat",
    "other",
  ]).notNull().default("other"),
  /** 0-100 probability the simulated attack would succeed */
  successProbability: int("successProbability").default(0).notNull(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
  outputSummary: text("outputSummary"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CtemAttackSimulation = typeof ctemAttackSimulations.$inferSelect;
export type InsertCtemAttackSimulation = typeof ctemAttackSimulations.$inferInsert;

/**
 * CTEM Risk Scores — computed composite scores per asset.
 * Recalculated after each continuous compliance run.
 *
 * FinalPriorityScore = (exposureScore×0.35) + (exploitabilityScore×0.40) + (businessImpactScore×0.25)
 */
export const ctemRiskScores = mysqlTable("ctemRiskScores", {
  id: int("id").primaryKey().autoincrement(),
  assetId: int("assetId").notNull().references(() => ctemAssets.id, { onDelete: "cascade" }),
  /** 0–100 computed from internet-facing, criticality, vuln severity */
  exposureScore: int("exposureScore").default(0).notNull(),
  /** 0–100 computed from exploit availability + BAS success probability */
  exploitabilityScore: int("exploitabilityScore").default(0).notNull(),
  /** 0–100 computed from criticality + personal/critical data sensitivity */
  businessImpactScore: int("businessImpactScore").default(0).notNull(),
  /** Weighted composite: the primary sorting/prioritization field */
  finalPriorityScore: int("finalPriorityScore").default(0).notNull(),
  /** Derived tier: critical(80+) high(60-79) medium(40-59) low(<40) */
  priorityTier: mysqlEnum("priorityTier", ["critical", "high", "medium", "low"]).notNull().default("low"),
  /** Snapshot of score from the previous run — used for drift detection */
  previousFinalScore: int("previousFinalScore"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CtemRiskScore = typeof ctemRiskScores.$inferSelect;
export type InsertCtemRiskScore = typeof ctemRiskScores.$inferInsert;

/**
 * Continuous Compliance Runs — one record per scheduled or manual scan.
 * Ties together run metadata and provides an audit trail.
 */
export const continuousComplianceRuns = mysqlTable("continuousComplianceRuns", {
  id: int("id").primaryKey().autoincrement(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  vendorId: int("vendorId").references(() => vendors.id, { onDelete: "set null" }),
  runStatus: mysqlEnum("runStatus", ["queued", "running", "completed", "failed"]).notNull().default("queued"),
  triggeredBy: mysqlEnum("triggeredBy", ["manual", "scheduled", "webhook"]).notNull().default("manual"),
  /** AI job ID from the orchestrator (if AI-enhanced run) */
  aiJobId: varchar("aiJobId", { length: 64 }),
  /** Number of assets scanned */
  assetsScanned: int("assetsScanned").default(0).notNull(),
  /** Number of vulnerabilities discovered this run */
  vulnsFound: int("vulnsFound").default(0).notNull(),
  /** Number of exploitable vulns found */
  exploitableVulns: int("exploitableVulns").default(0).notNull(),
  /** Average final priority score across all assets this run */
  avgPriorityScore: int("avgPriorityScore").default(0).notNull(),
  /** Score delta vs previous run (+/-) — positive = worsened */
  scoreDelta: int("scoreDelta"),
  /** 1 = critical alert was raised (drift >20% or new critical exploitable vuln) */
  alertRaised: tinyint("alertRaised").default(0).notNull(),
  summary: text("summary"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContinuousComplianceRun = typeof continuousComplianceRuns.$inferSelect;
export type InsertContinuousComplianceRun = typeof continuousComplianceRuns.$inferInsert;

/**
 * Compliance Exposure Mappings — links a vulnerability to a specific
 * compliance control that it puts at risk.
 * Enables "this CVE puts you in breach of PDPL Art.19" style insights.
 */
export const complianceExposureMappings = mysqlTable("complianceExposureMappings", {
  id: int("id").primaryKey().autoincrement(),
  vulnerabilityId: int("vulnerabilityId").notNull().references(() => ctemVulnerabilities.id, { onDelete: "cascade" }),
  frameworkId: int("frameworkId").references(() => frameworks.id, { onDelete: "set null" }),
  /** Framework code shortcut (avoids join when frameworkId row deleted) */
  frameworkCode: varchar("frameworkCode", { length: 50 }),
  controlId: int("controlId").references(() => complianceControls.id, { onDelete: "set null" }),
  /** Control code shortcut */
  controlCode: varchar("controlCode", { length: 100 }),
  mappingReason: text("mappingReason").notNull(),
  severityImpact: mysqlEnum("severityImpact", ["critical", "high", "medium", "low"]).notNull().default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ComplianceExposureMapping = typeof complianceExposureMappings.$inferSelect;
export type InsertComplianceExposureMapping = typeof complianceExposureMappings.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ RBAC — Role-Based Access Control & Onboarding  (Migration: 0007_rbac_access_control)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * User Onboarding — tracks per-user wizard completion state.
 *
 * Every newly registered user starts at stage "not_started".
 * The server enforces that certain modules are inaccessible until stage = "completed".
 *
 * Stages:
 *   not_started          – just registered, wizard not opened
 *   account_type_selected – role intent chosen (DPO / legal / consultant / vendor / researcher)
 *   org_created          – user created a new organization
 *   org_joined           – user accepted an invite into an existing org
 *   jurisdiction_set     – primary compliance jurisdiction selected
 *   completed            – all steps done; full workspace unlocked
 */
export const userOnboarding = mysqlTable("userOnboarding", {
  id: int("id").autoincrement().primaryKey(),
  /** OAuth (Manus) user reference */
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  /** Local (password-login) user reference */
  localUserId: int("localUserId").references(() => localUsers.id, { onDelete: "cascade" }),
  /** Current wizard stage */
  stage: mysqlEnum("stage", [
    "not_started",
    "account_type_selected",
    "org_created",
    "org_joined",
    "jurisdiction_set",
    "completed",
  ]).default("not_started").notNull(),
  /**
   * Self-declared role intent — maps to the persona selected in the wizard.
   * Used to initialise dashboard layout, suggested workflows, and org role defaults.
   */
  accountIntent: mysqlEnum("accountIntent", [
    "compliance_professional",
    "legal_advisor",
    "enterprise_admin",
    "consultant",
    "vendor",
    "government",
    "researcher",
  ]),
  /** ISO locale selected during onboarding wizard */
  selectedLocale: mysqlEnum("selectedLocale", ["en", "ar", "zh"]).default("en").notNull(),
  /** Date/time the wizard was fully completed */
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type InsertUserOnboarding = typeof userOnboarding.$inferInsert;

/**
 * Role Permission Overrides — per-user, per-org, per-module capability grants.
 *
 * The default permission set is derived from the user's organizationMembers.role.
 * This table allows org owners/admins to GRANT additional capabilities to specific
 * members (e.g. allow an analyst to export PDFs) without promoting their org role.
 *
 * Module identifiers (one row per user-org-module triplet):
 *   vendor_assessment | gap_tracker | remediation_planner | risk_register
 *   policy_manager | incident_register | audit_schedule | compliance_tracker
 *   compliance_reports | report_center | compliance_heatmap | compliance_calendar
 *   vendor_compliance_profiles | assessment_history | api_keys | team_members
 *   org_settings | audit_log | pro_intelligence | transfer_checker | law_library
 *   framework_analysis | billing | admin_control_center | saas_metrics
 */
export const rolePermissions = mysqlTable("rolePermissions", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  /** The user this override applies to (OAuth user) */
  userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
  /** The user this override applies to (local-auth user) */
  localUserId: int("localUserId").references(() => localUsers.id, { onDelete: "cascade" }),
  /** Module or feature slug, e.g. "vendor_assessment" */
  module: varchar("module", { length: 120 }).notNull(),
  /** Can view / read the module */
  canView: tinyint("canView").default(0).notNull(),
  /** Can create new records in the module */
  canCreate: tinyint("canCreate").default(0).notNull(),
  /** Can edit existing records */
  canEdit: tinyint("canEdit").default(0).notNull(),
  /** Can delete records */
  canDelete: tinyint("canDelete").default(0).notNull(),
  /** Can export PDF / CSV reports */
  canExport: tinyint("canExport").default(0).notNull(),
  /** Can send member invitations from within the module */
  canInvite: tinyint("canInvite").default(0).notNull(),
  /** Admin user who granted this override */
  grantedByUserId: int("grantedByUserId").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

/**
 * Vendor Compliance Shares — signed, time-limited share tokens.
 *
 * A vendor generates a share token to allow an enterprise client to view
 * their compliance scorecard without being an org member. Optionally
 * restricted to a specific enterprise organizationId.
 *
 * Token format: 32-byte hex string (crypto.randomBytes(32))
 * expiry default: 30 days
 */
export const vendorShares = mysqlTable("vendorShares", {
  id: int("id").autoincrement().primaryKey(),
  vendorId: int("vendorId").notNull().references(() => vendors.id, { onDelete: "cascade" }),
  /** 64-char hex token — must be unique */
  shareToken: varchar("shareToken", { length: 64 }).notNull().unique(),
  /**
   * If set, ONLY this organization can use the token.
   * If NULL, any authenticated user can view the shared scorecard.
   */
  allowedOrgId: int("allowedOrgId").references(() => organizations.id, { onDelete: "set null" }),
  /** Hard expiry — null = never expires */
  expiresAt: timestamp("expiresAt"),
  /** Number of times this link has been accessed */
  viewCount: int("viewCount").default(0).notNull(),
  /** User who created the share token */
  createdByUserId: int("createdByUserId").references(() => users.id),
  /** 1 = token has been explicitly revoked before natural expiry */
  isRevoked: tinyint("isRevoked").default(0).notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VendorShare = typeof vendorShares.$inferSelect;
export type InsertVendorShare = typeof vendorShares.$inferInsert;

/**
 * Regulator Oversight Targets — grants a government/regulator org read-only
 * visibility into a specific enterprise organization's compliance data.
 *
 * Created exclusively by platform_admin / super_admin.
 * The regulator can then see ComplianceHeatmap, VendorComplianceProfiles,
 * and Framework Analysis data for the target org — all read-only.
 */
export const regulatorOversightTargets = mysqlTable("regulatorOversightTargets", {
  id: int("id").autoincrement().primaryKey(),
  /** The government/regulator organization */
  regulatorOrgId: int("regulatorOrgId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  /** The enterprise organization being monitored */
  targetOrgId: int("targetOrgId").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  /** Admin who granted this oversight relationship */
  grantedByAdminId: int("grantedByAdminId").references(() => users.id),
  /** Optional expiry for time-boxed regulatory reviews */
  expiresAt: timestamp("expiresAt"),
  /** 1 = oversight is currently active */
  isActive: tinyint("isActive").default(1).notNull(),
  /** Reason / regulatory basis (e.g. "PDPL Article 31 Audit") */
  justification: text("justification"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RegulatorOversightTarget = typeof regulatorOversightTargets.$inferSelect;
export type InsertRegulatorOversightTarget = typeof regulatorOversightTargets.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// ▌ COMPLIANCE EVIDENCE LOCKER  (Migration: 0016_compliance_evidence)
// ═══════════════════════════════════════════════════════════════════════

export const complianceEvidence = mysqlTable("complianceEvidence", {
  id: int("id").primaryKey().autoincrement(),
  organizationId: int("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sourceType: mysqlEnum("sourceType", [
    "audit_schedule",
    "policy",
    "risk",
    "gap",
    "remediation",
    "ctem_asset",
    "incident",
    "general",
  ])
    .notNull()
    .default("general"),
  sourceId: int("sourceId"),
  title: varchar("title", { length: 255 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  description: text("description"),
  addedByUserId: int("addedByUserId").references(() => localUsers.id, {
    onDelete: "set null",
  }),
  tags: varchar("tags", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ComplianceEvidence = typeof complianceEvidence.$inferSelect;
export type InsertComplianceEvidence = typeof complianceEvidence.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════
// ▌ DATA SUBJECT REQUEST TRACKER  (Migration: 0017_dsr_requests)
// ═══════════════════════════════════════════════════════════════════════

export const dsrRequests = mysqlTable("dsrRequests", {
  id: int("id").primaryKey().autoincrement(),
  organizationId: int("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  requestType: mysqlEnum("requestType", [
    "access",
    "rectification",
    "erasure",
    "portability",
    "restriction",
    "objection",
    "explanation",
  ]).notNull(),
  jurisdiction: mysqlEnum("jurisdiction", [
    "China",
    "Saudi Arabia",
    "Other",
  ])
    .notNull()
    .default("Other"),
  requesterName: varchar("requesterName", { length: 255 }).notNull(),
  requesterEmail: varchar("requesterEmail", { length: 320 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", [
    "received",
    "in_review",
    "pending_info",
    "completed",
    "rejected",
    "withdrawn",
  ])
    .notNull()
    .default("received"),
  priority: mysqlEnum("priority", ["normal", "high", "urgent"])
    .notNull()
    .default("normal"),
  dueDate: timestamp("dueDate").notNull(),
  completedAt: timestamp("completedAt"),
  assignedToUserId: int("assignedToUserId").references(() => localUsers.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DsrRequest = typeof dsrRequests.$inferSelect;
export type InsertDsrRequest = typeof dsrRequests.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ SERVICE REQUESTS — Pentest / Audit / SOC / Consulting engagement requests
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Cybersecurity service engagement requests submitted by client organizations.
 * Covers penetration testing, security audits, SOC support, and consulting.
 * Admin team reviews and assigns each request before scoping begins.
 */
export const serviceRequests = mysqlTable("serviceRequests", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  /** User who submitted the request */
  requestedByUserId: int("requestedByUserId").references(() => localUsers.id, {
    onDelete: "set null",
  }),
  /** Service category */
  serviceType: mysqlEnum("serviceType", [
    "penetration_test",
    "red_team",
    "security_audit",
    "soc_support",
    "incident_response",
    "consulting",
    "phishing_simulation",
    "cloud_security_review",
    "vulnerability_assessment",
    "compliance_gap_assessment",
  ]).notNull(),
  /** Short title / subject */
  title: varchar("title", { length: 255 }).notNull(),
  /** Full scope description, objectives, and context */
  description: text("description").notNull(),
  /** Target systems / assets in scope (JSON array or plain text) */
  scopeDetails: text("scopeDetails"),
  /** Desired start date */
  preferredStartDate: timestamp("preferredStartDate"),
  /** Budget range (free text, e.g. "$5,000 – $15,000") */
  budgetRange: varchar("budgetRange", { length: 120 }),
  /** Urgency / business priority */
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"])
    .default("medium")
    .notNull(),
  /** Workflow status */
  status: mysqlEnum("status", [
    "draft",
    "submitted",
    "under_review",
    "scoping",
    "approved",
    "in_progress",
    "completed",
    "cancelled",
    "on_hold",
  ])
    .default("submitted")
    .notNull(),
  /** Yalla-Hack employee assigned to handle this engagement */
  assignedToUserId: int("assignedToUserId").references(() => localUsers.id, {
    onDelete: "set null",
  }),
  /** Internal admin notes (not visible to client) */
  internalNotes: text("internalNotes"),
  /** Admin response / quote visible to the client */
  clientResponse: text("clientResponse"),
  respondedAt: timestamp("respondedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type InsertServiceRequest = typeof serviceRequests.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ ASSET INVENTORY — IT / OT / Cloud / SaaS asset register with risk tracking
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Central asset inventory for an organization's digital footprint.
 * Supports IT assets, cloud services, SaaS tools, IoT/OT devices.
 * Each asset carries a calculated risk score based on criticality + exposure.
 */
export const assetInventory = mysqlTable("assetInventory", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  /** Human-readable asset name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Asset category */
  assetType: mysqlEnum("assetType", [
    "server",
    "workstation",
    "network_device",
    "cloud_service",
    "saas_application",
    "database",
    "api_endpoint",
    "iot_device",
    "mobile_device",
    "industrial_ot",
    "web_application",
    "source_code_repo",
    "third_party_service",
  ]).notNull(),
  /** IP address, hostname, or URL */
  identifier: varchar("identifier", { length: 512 }),
  /** Owning team or department */
  owner: varchar("owner", { length: 255 }),
  /** Physical or cloud region */
  location: varchar("location", { length: 255 }),
  /** Business criticality (feeds into risk score) */
  criticality: mysqlEnum("criticality", ["low", "medium", "high", "critical"])
    .default("medium")
    .notNull(),
  /** Internet exposure level */
  exposure: mysqlEnum("exposure", ["internal", "vpn_only", "partner_only", "internet_facing"])
    .default("internal")
    .notNull(),
  /** Lifecycle state */
  status: mysqlEnum("status", ["active", "decommissioned", "under_review", "unknown"])
    .default("active")
    .notNull(),
  /** Calculated risk score 0–100 (criticality × exposure × vuln count) */
  riskScore: int("riskScore").default(0).notNull(),
  /** Operating system or platform */
  platform: varchar("platform", { length: 120 }),
  /** Software version or build */
  version: varchar("version", { length: 120 }),
  /** Date of last security scan */
  lastScannedAt: timestamp("lastScannedAt"),
  /** Number of open vulnerabilities linked via CTEM */
  openVulnCount: int("openVulnCount").default(0).notNull(),
  /** Tags / labels — JSON array */
  tags: varchar("tags", { length: 512 }),
  /** Free-form additional notes */
  notes: text("notes"),
  addedByUserId: int("addedByUserId").references(() => localUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssetInventoryItem = typeof assetInventory.$inferSelect;
export type InsertAssetInventoryItem = typeof assetInventory.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ SECURITY MATURITY — Multi-domain security maturity self-assessment scoring
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Captures a point-in-time security maturity assessment across multiple domains
 * (Governance, Access Control, Data Protection, Incident Response, etc.).
 * Each domain is scored 1–5 (initial → optimized).
 * Supports trend analysis across multiple assessment snapshots.
 */
export const securityMaturityAssessments = mysqlTable("securityMaturityAssessments", {
  id: int("id").autoincrement().primaryKey(),
  organizationId: int("organizationId")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  /** Human-friendly label (e.g. "Q2 2026 Self-Assessment") */
  title: varchar("title", { length: 255 }).notNull(),
  /** ISO framework reference (optional) */
  frameworkRef: varchar("frameworkRef", { length: 64 }),
  // ── Domain scores 1–5 ──────────────────────────────────────────────────
  scoreGovernance: int("scoreGovernance").default(1).notNull(),
  scoreAssetManagement: int("scoreAssetManagement").default(1).notNull(),
  scoreAccessControl: int("scoreAccessControl").default(1).notNull(),
  scoreDataProtection: int("scoreDataProtection").default(1).notNull(),
  scoreNetworkSecurity: int("scoreNetworkSecurity").default(1).notNull(),
  scoreVulnerabilityMgmt: int("scoreVulnerabilityMgmt").default(1).notNull(),
  scoreIncidentResponse: int("scoreIncidentResponse").default(1).notNull(),
  scoreBackupRecovery: int("scoreBackupRecovery").default(1).notNull(),
  scoreThirdPartyRisk: int("scoreThirdPartyRisk").default(1).notNull(),
  scoreSecurityAwareness: int("scoreSecurityAwareness").default(1).notNull(),
  // ── Derived ────────────────────────────────────────────────────────────
  /** Average of all domain scores × 20 = 0–100% */
  overallScore: int("overallScore").default(0).notNull(),
  /** Maturity level label */
  maturityLevel: mysqlEnum("maturityLevel", [
    "initial",
    "developing",
    "defined",
    "managed",
    "optimized",
  ])
    .default("initial")
    .notNull(),
  /** Analyst notes or AI-generated recommendations */
  recommendations: text("recommendations"),
  assessedByUserId: int("assessedByUserId").references(() => localUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SecurityMaturityAssessment = typeof securityMaturityAssessments.$inferSelect;
export type InsertSecurityMaturityAssessment = typeof securityMaturityAssessments.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ▌ THREAT INTELLIGENCE FEED — Curated internal threat intel items
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Stores curated threat intelligence items visible to org members.
 * Items can be seeded by Yalla-Hack staff (platform-wide) or created per-org.
 * organizationId = NULL means the item is a global/platform bulletin.
 */
export const threatIntelItems = mysqlTable("threatIntelItems", {
  id: int("id").autoincrement().primaryKey(),
  /** NULL = platform-wide bulletin visible to all orgs */
  organizationId: int("organizationId").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  /** Short descriptive title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Detailed threat description, indicators, and context */
  summary: text("summary").notNull(),
  /** Threat actor or campaign name */
  threatActor: varchar("threatActor", { length: 180 }),
  /** MITRE ATT&CK tactic or category */
  category: mysqlEnum("category", [
    "malware",
    "ransomware",
    "phishing",
    "apt",
    "zero_day",
    "ddos",
    "supply_chain",
    "data_breach",
    "vulnerability",
    "social_engineering",
    "insider_threat",
    "other",
  ]).notNull(),
  /** Severity / confidence tier */
  severity: mysqlEnum("severity", ["info", "low", "medium", "high", "critical"]).default("medium").notNull(),
  /** TLP classification */
  tlp: mysqlEnum("tlp", ["white", "green", "amber", "red"]).default("white").notNull(),
  /** Affected sectors — comma-separated tags */
  affectedSectors: varchar("affectedSectors", { length: 512 }),
  /** IoCs — comma-separated (IPs, domains, hashes) */
  indicators: text("indicators"),
  /** Link to external advisory / CVE */
  referenceUrl: varchar("referenceUrl", { length: 1024 }),
  /** CVE ID if applicable */
  cveId: varchar("cveId", { length: 32 }),
  /** CVSS score 0.0–10.0 */
  cvssScore: varchar("cvssScore", { length: 8 }),
  /** Is the item still relevant/active? */
  isActive: tinyint("isActive").default(1).notNull(),
  /** Created by Yalla-Hack analyst (platform user) */
  createdByUserId: int("createdByUserId").references(() => localUsers.id, {
    onDelete: "set null",
  }),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ThreatIntelItem = typeof threatIntelItems.$inferSelect;
export type InsertThreatIntelItem = typeof threatIntelItems.$inferInsert;
