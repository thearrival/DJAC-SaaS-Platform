import "dotenv/config";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });

async function query(sql) {
  try {
    await pool.query(sql);
    return true;
  } catch (err) {
    if (err.message?.includes("already exists")) {
      return false; // silently skip
    }
    throw err;
  }
}

async function main() {
  console.log("Creating remaining tables...");

  // Vendors
  await query(`
    CREATE TABLE IF NOT EXISTS "vendors" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL REFERENCES "users"("id"),
      "organizationId" INTEGER REFERENCES "organizations"("id"),
      "vendorName" VARCHAR(255) NOT NULL,
      "vendorDescription" TEXT,
      "industry" VARCHAR(100),
      "businessRegistrationNumber" VARCHAR(120),
      "headquartersLocation" VARCHAR(120),
      "primaryContactName" VARCHAR(255),
      "primaryContactEmail" VARCHAR(320),
      "primaryContactRole" VARCHAR(120),
      "primaryContactPhone" VARCHAR(64),
      "serviceType" VARCHAR(120),
      "serviceScope" TEXT,
      "hostingEnvironment" VARCHAR(120),
      "operatingCountries" TEXT,
      "cloudProvider" VARCHAR(255),
      "dataLocations" TEXT,
      "regulatoryJurisdictions" TEXT,
      "certifications" TEXT,
      "dataProcessingActivities" TEXT,
      "criticalityLevel" VARCHAR(64),
      "riskTier" VARCHAR(64),
      "thirdPartyDependencies" VARCHAR(64),
      "fourthPartyDependencies" VARCHAR(64),
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Vendor Assessments
  await query(`
    CREATE TABLE IF NOT EXISTS "vendorAssessments" (
      "id" SERIAL PRIMARY KEY,
      "vendorId" INTEGER NOT NULL REFERENCES "vendors"("id"),
      "frameworkId" INTEGER NOT NULL REFERENCES "frameworks"("id"),
      "assessmentDate" TIMESTAMP DEFAULT NOW() NOT NULL,
      "complianceScore" INTEGER,
      "riskLevel" "severity",
      "status" "assessmentStatus",
      "findings" TEXT,
      "recommendations" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Tech Stack Components
  await query(`
    CREATE TABLE IF NOT EXISTS "techStackComponents" (
      "id" SERIAL PRIMARY KEY,
      "vendorId" INTEGER NOT NULL REFERENCES "vendors"("id"),
      "componentName" VARCHAR(255) NOT NULL,
      "componentType" VARCHAR(100),
      "technology" VARCHAR(255),
      "description" TEXT,
      "dataHandling" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Assessment Gaps
  await query(`
    CREATE TABLE IF NOT EXISTS "assessmentGaps" (
      "id" SERIAL PRIMARY KEY,
      "assessmentId" INTEGER NOT NULL REFERENCES "vendorAssessments"("id"),
      "controlId" INTEGER NOT NULL REFERENCES "complianceControls"("id"),
      "gapDescription" TEXT,
      "severity" "severity",
      "remediation" TEXT,
      "estimatedRemediationCost" VARCHAR(100),
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Compliance Policies
  await query(`
    CREATE TABLE IF NOT EXISTS "compliancePolicies" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "policyCode" VARCHAR(64),
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "policyType" "policyType" NOT NULL DEFAULT 'policy',
      "frameworks" TEXT,
      "controlReferences" TEXT,
      "status" "policyStatus" NOT NULL DEFAULT 'draft',
      "ownerId" INTEGER,
      "reviewCycleMonths" INTEGER DEFAULT 12,
      "lastApprovedAt" TIMESTAMP,
      "nextReviewAt" TIMESTAMP,
      "version" VARCHAR(20) DEFAULT '1.0',
      "documentUrl" VARCHAR(512),
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Compliance Incidents
  await query(`
    CREATE TABLE IF NOT EXISTS "complianceIncidents" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "incidentCode" VARCHAR(64),
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "incidentType" "incidentType" DEFAULT 'other' NOT NULL,
      "severity" "taskSeverity" DEFAULT 'medium' NOT NULL,
      "status" "incidentStatus" DEFAULT 'open' NOT NULL,
      "affectedFrameworks" TEXT,
      "affectedVendorId" INTEGER,
      "affectedDataTypes" TEXT,
      "affectedDataSubjects" INTEGER,
      "reportedById" INTEGER,
      "occurredAt" TIMESTAMP,
      "detectedAt" TIMESTAMP,
      "containedAt" TIMESTAMP,
      "resolvedAt" TIMESTAMP,
      "regulatoryNotificationRequired" INTEGER DEFAULT 0 NOT NULL,
      "regulatoryNotificationSentAt" TIMESTAMP,
      "notificationDeadlineHours" INTEGER DEFAULT 72,
      "rootCause" TEXT,
      "lessonsLearned" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Remediation Tasks
  await query(`
    CREATE TABLE IF NOT EXISTS "remediationTasks" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "vendorId" INTEGER,
      "gapCode" VARCHAR(64),
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "severity" "taskSeverity" NOT NULL DEFAULT 'medium',
      "status" "taskStatus" NOT NULL DEFAULT 'open',
      "assignedToUserId" INTEGER,
      "dueDate" TIMESTAMP,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Risk Register
  await query(`
    CREATE TABLE IF NOT EXISTS "riskRegister" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "category" "riskCategory" NOT NULL DEFAULT 'operational',
      "likelihood" INTEGER NOT NULL DEFAULT 3,
      "impact" INTEGER NOT NULL DEFAULT 3,
      "treatment" "treatment" NOT NULL DEFAULT 'mitigate',
      "status" "riskStatus" NOT NULL DEFAULT 'open',
      "ownerId" INTEGER,
      "vendorId" INTEGER,
      "gapCode" VARCHAR(64),
      "controlReference" VARCHAR(128),
      "reviewDate" TIMESTAMP,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Audit Schedules
  await query(`
    CREATE TABLE IF NOT EXISTS "auditSchedules" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "auditType" "auditType" DEFAULT 'internal' NOT NULL,
      "scope" TEXT,
      "status" "auditStatus" DEFAULT 'planned' NOT NULL,
      "scheduledDate" TIMESTAMP NOT NULL,
      "completedDate" TIMESTAMP,
      "assignedToId" INTEGER,
      "vendorId" INTEGER,
      "findings" TEXT,
      "recurrence" "recurrence" DEFAULT 'none' NOT NULL,
      "nextOccurrence" TIMESTAMP,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // DSR Requests
  await query(`
    CREATE TABLE IF NOT EXISTS "dsrRequests" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "requestType" "dsrRequestType" NOT NULL,
      "requesterName" VARCHAR(255) NOT NULL,
      "requesterEmail" VARCHAR(320) NOT NULL,
      "jurisdiction" "dsrJurisdiction" NOT NULL DEFAULT 'Other',
      "status" "dsrStatus" NOT NULL DEFAULT 'received',
      "priority" "dsrPriority" NOT NULL DEFAULT 'normal',
      "description" TEXT,
      "internalNotes" TEXT,
      "respondedAt" TIMESTAMP,
      "resolvedAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Compliance Evidence
  await query(`
    CREATE TABLE IF NOT EXISTS "complianceEvidence" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "sourceType" "evidenceSourceType" NOT NULL DEFAULT 'general',
      "sourceId" INTEGER,
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "fileUrl" VARCHAR(512),
      "fileType" VARCHAR(64),
      "fileSizeBytes" INTEGER,
      "collectedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "expiresAt" TIMESTAMP,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // CTEM Assets
  await query(`
    CREATE TABLE IF NOT EXISTS "ctemAssets" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "vendorId" INTEGER REFERENCES "vendors"("id") ON DELETE SET NULL,
      "assetName" VARCHAR(255) NOT NULL,
      "assetType" "ctemAssetType" NOT NULL DEFAULT 'other',
      "ipDomain" VARCHAR(255),
      "region" "region" NOT NULL DEFAULT 'Other',
      "isInternetFacing" INTEGER DEFAULT 0 NOT NULL,
      "handlesPersonalData" INTEGER DEFAULT 0 NOT NULL,
      "handlesCriticalData" INTEGER DEFAULT 0 NOT NULL,
      "criticalityScore" INTEGER DEFAULT 5 NOT NULL,
      "status" "assetStatus" DEFAULT 'active' NOT NULL,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // CTEM Vulnerabilities
  await query(`
    CREATE TABLE IF NOT EXISTS "ctemVulnerabilities" (
      "id" SERIAL PRIMARY KEY,
      "assetId" INTEGER NOT NULL REFERENCES "ctemAssets"("id") ON DELETE CASCADE,
      "cveId" VARCHAR(64),
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "severity" "vulnSeverity" NOT NULL DEFAULT 'medium',
      "cvssScore" INTEGER DEFAULT 0 NOT NULL,
      "exploitAvailable" INTEGER DEFAULT 0 NOT NULL,
      "isConfirmed" INTEGER DEFAULT 0 NOT NULL,
      "isPatched" INTEGER DEFAULT 0 NOT NULL,
      "discoveredAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "patchedAt" TIMESTAMP,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Service Requests
  await query(`
    CREATE TABLE IF NOT EXISTS "serviceRequests" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "serviceType" "serviceType" NOT NULL,
      "priority" "servicePriority" NOT NULL DEFAULT 'medium',
      "status" "serviceStatus" NOT NULL DEFAULT 'draft',
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "scope" TEXT,
      "frameworks" TEXT,
      "assignedToId" INTEGER,
      "requestedById" INTEGER,
      "vendorId" INTEGER,
      "scheduledDate" TIMESTAMP,
      "completedDate" TIMESTAMP,
      "findings" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Asset Inventory
  await query(`
    CREATE TABLE IF NOT EXISTS "assetInventory" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "assetType" "inventoryAssetType" NOT NULL,
      "assetName" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "ownerId" INTEGER,
      "location" VARCHAR(255),
      "ipAddress" VARCHAR(64),
      "exposure" "exposure" DEFAULT 'internal' NOT NULL,
      "status" "inventoryStatus" DEFAULT 'active' NOT NULL,
      "criticality" "criticality" DEFAULT 'medium' NOT NULL,
      "complianceFrameworks" TEXT,
      "department" VARCHAR(120),
      "vendorId" INTEGER,
      "purchaseDate" TIMESTAMP,
      "eolDate" TIMESTAMP,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Security Maturity
  await query(`
    CREATE TABLE IF NOT EXISTS "securityMaturityAssessments" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "domain" VARCHAR(120) NOT NULL,
      "maturityLevel" "maturityLevel" NOT NULL DEFAULT 'initial',
      "score" INTEGER DEFAULT 0 NOT NULL,
      "findings" TEXT,
      "recommendations" TEXT,
      "notes" TEXT,
      "assessedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Threat Intel
  await query(`
    CREATE TABLE IF NOT EXISTS "threatIntelItems" (
      "id" SERIAL PRIMARY KEY,
      "organizationId" INTEGER NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
      "title" VARCHAR(255) NOT NULL,
      "description" TEXT,
      "category" "threatCategory" NOT NULL DEFAULT 'other',
      "severity" "threatSeverity" NOT NULL DEFAULT 'medium',
      "tlp" "tlp" NOT NULL DEFAULT 'amber',
      "source" VARCHAR(255),
      "indicators" TEXT,
      "mitreAttackId" VARCHAR(64),
      "affectedAssets" TEXT,
      "recommendedActions" TEXT,
      "isActionable" INTEGER DEFAULT 0 NOT NULL,
      "publishedAt" TIMESTAMP,
      "expiresAt" TIMESTAMP,
      "notes" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
      "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  console.log("All supplementary tables created.");

  // Now apply RLS policies for these tables
  console.log("Applying RLS policies...");
  const rlsPromises = [
    query(`ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY`),
    query(`ALTER TABLE "vendorAssessments" ENABLE ROW LEVEL SECURITY`),
    query(`ALTER TABLE "compliancePolicies" ENABLE ROW LEVEL SECURITY`),
    query(`ALTER TABLE "complianceIncidents" ENABLE ROW LEVEL SECURITY`),
    query(`ALTER TABLE "remediationTasks" ENABLE ROW LEVEL SECURITY`),
    query(`ALTER TABLE "riskRegister" ENABLE ROW LEVEL SECURITY`),
  ];
  await Promise.all(rlsPromises);
  console.log("RLS enabled on supplementary tables.");

  await pool.end();
  console.log("Done.");
}

main().catch(err => {
  console.error("Failed:", err.message);
  process.exit(1);
});
