#!/usr/bin/env node

import pg from "pg";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("[seed-all-demo] DATABASE_URL is not set.");
  process.exit(1);
}

const fixedUrl = dbUrl.includes("sslmode=")
  ? dbUrl
  : dbUrl.includes("?")
    ? `${dbUrl}&sslmode=no-verify`
    : `${dbUrl}?sslmode=no-verify`;

const client = new pg.Client({
  connectionString: fixedUrl,
  ssl: { rejectUnauthorized: false },
});

const NOW = new Date();
const esc = s => (s ? `'${s.replace(/'/g, "''")}'` : "NULL");
const escDate = d => (d ? `'${d.toISOString()}'` : "NULL");

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const DEMO_ORGS = [
  {
    slug: "acme-corp-global",
    name: "Acme Corp Global",
    billingEmail: "billing@acmecorp.com",
    industry: "Technology",
    primaryJurisdiction: "Both",
    plan: "professional",
    maxSeats: 10,
    users: [
      { name: "Alice Chen", email: "alice@acmecorp.com", role: "owner" },
      {
        name: "Bob Martinez",
        email: "bob@acmecorp.com",
        role: "compliance_officer",
      },
    ],
    frameworkAssessments: [
      {
        frameworkCode: "PIPL",
        score: 72,
        riskLevel: "medium",
        status: "partial",
      },
      { frameworkCode: "CSL", score: 85, riskLevel: "low", status: "partial" },
      {
        frameworkCode: "DSL",
        score: 60,
        riskLevel: "high",
        status: "non_compliant",
      },
      {
        frameworkCode: "PDPL",
        score: 78,
        riskLevel: "medium",
        status: "partial",
      },
      {
        frameworkCode: "ECC",
        score: 90,
        riskLevel: "low",
        status: "compliant",
      },
      {
        frameworkCode: "GDPR",
        score: 65,
        riskLevel: "high",
        status: "non_compliant",
      },
    ],
    risks: [
      {
        title: "Cross-border PIPL data flows without CAC assessment",
        category: "regulatory",
        likelihood: 4,
        impact: 5,
        treatment: "mitigate",
      },
      {
        title: "PDPL consent records incomplete for marketing",
        category: "operational",
        likelihood: 3,
        impact: 4,
        treatment: "remediate",
      },
      {
        title: "GDPR DPO not appointed for EU operations",
        category: "regulatory",
        likelihood: 3,
        impact: 5,
        treatment: "mitigate",
      },
    ],
    deadlines: [
      {
        frameworkCode: "PIPL",
        title: "Annual PIIA Review Submission",
        daysFromNow: 30,
        priority: "high",
      },
      {
        frameworkCode: "CSL",
        title: "MLPS Level 3 Annual Assessment Due",
        daysFromNow: 60,
        priority: "critical",
      },
      {
        frameworkCode: "PDPL",
        title: "SDAIA Breach Notification Drill",
        daysFromNow: 45,
        priority: "high",
      },
      {
        frameworkCode: "GDPR",
        title: "Data Protection Impact Assessment Updates",
        daysFromNow: 90,
        priority: "medium",
      },
      {
        frameworkCode: "CSL",
        title: "Network Log Retention Audit",
        daysFromNow: 15,
        priority: "high",
      },
    ],
  },
  {
    slug: "eurotech-gmbh",
    name: "EuroTech GmbH",
    billingEmail: "finance@eurotech.de",
    industry: "Manufacturing",
    primaryJurisdiction: "Both",
    plan: "professional",
    maxSeats: 8,
    users: [
      { name: "Claudia Weber", email: "claudia@eurotech.de", role: "owner" },
    ],
    frameworkAssessments: [
      {
        frameworkCode: "GDPR",
        score: 88,
        riskLevel: "low",
        status: "compliant",
      },
      {
        frameworkCode: "NIS2",
        score: 75,
        riskLevel: "medium",
        status: "partial",
      },
      {
        frameworkCode: "DORA",
        score: 70,
        riskLevel: "medium",
        status: "partial",
      },
      {
        frameworkCode: "ISO-27001",
        score: 92,
        riskLevel: "low",
        status: "compliant",
      },
      {
        frameworkCode: "EU-AI-ACT",
        score: 55,
        riskLevel: "high",
        status: "non_compliant",
      },
    ],
    risks: [
      {
        title: "NIS2 incident reporting not tested for essential entity status",
        category: "regulatory",
        likelihood: 3,
        impact: 4,
        treatment: "mitigate",
      },
      {
        title: "EU AI Act classification of manufacturing QA model incomplete",
        category: "compliance",
        likelihood: 4,
        impact: 4,
        treatment: "assess",
      },
      {
        title: "DORA ICT third-party register missing sub-contractors",
        category: "operational",
        likelihood: 3,
        impact: 3,
        treatment: "accept",
      },
    ],
    deadlines: [
      {
        frameworkCode: "NIS2",
        title: "Incident Response Plan Annual Test",
        daysFromNow: 45,
        priority: "high",
      },
      {
        frameworkCode: "GDPR",
        title: "Data Subject Request SLA Compliance Review",
        daysFromNow: 20,
        priority: "medium",
      },
      {
        frameworkCode: "DORA",
        title: "ICT Risk Management Framework Update",
        daysFromNow: 75,
        priority: "high",
      },
      {
        frameworkCode: "EU-AI-ACT",
        title: "AI System Risk Classification Filing",
        daysFromNow: 120,
        priority: "critical",
      },
    ],
  },
  {
    slug: "pacifictrade-ltd",
    name: "PacificTrade Ltd",
    billingEmail: "accounts@pacifictrade.sg",
    industry: "Financial Services",
    primaryJurisdiction: "Both",
    plan: "enterprise",
    maxSeats: 20,
    users: [
      { name: "David Tan", email: "david@pacifictrade.sg", role: "owner" },
      { name: "Siti Rahmat", email: "siti@pacifictrade.sg", role: "admin" },
    ],
    frameworkAssessments: [
      {
        frameworkCode: "PDPA-SG",
        score: 91,
        riskLevel: "low",
        status: "compliant",
      },
      {
        frameworkCode: "MAS-TRM",
        score: 82,
        riskLevel: "low",
        status: "partial",
      },
      {
        frameworkCode: "PCI-DSS",
        score: 95,
        riskLevel: "low",
        status: "compliant",
      },
      { frameworkCode: "SOX", score: 85, riskLevel: "low", status: "partial" },
      {
        frameworkCode: "GLBA",
        score: 70,
        riskLevel: "medium",
        status: "partial",
      },
      {
        frameworkCode: "PIPL",
        score: 45,
        riskLevel: "critical",
        status: "non_compliant",
      },
      {
        frameworkCode: "PDPL-KSA",
        score: 60,
        riskLevel: "high",
        status: "non_compliant",
      },
    ],
    risks: [
      {
        title: "PIPL cross-border data transfer non-compliance",
        category: "regulatory",
        likelihood: 5,
        impact: 5,
        treatment: "mitigate",
      },
      {
        title: "MAS TRM cloud resilience testing overdue",
        category: "operational",
        likelihood: 3,
        impact: 4,
        treatment: "remediate",
      },
      {
        title: "PDPL-KSA data localization not implemented",
        category: "regulatory",
        likelihood: 4,
        impact: 5,
        treatment: "mitigate",
      },
      {
        title: "PCI-DSS quarterly scan schedule gap",
        category: "compliance",
        likelihood: 2,
        impact: 3,
        treatment: "accept",
      },
    ],
    deadlines: [
      {
        frameworkCode: "PDPA-SG",
        title: "Annual Data Protection Officer Report",
        daysFromNow: 60,
        priority: "high",
      },
      {
        frameworkCode: "MAS-TRM",
        title: "Technology Risk Management Review",
        daysFromNow: 30,
        priority: "high",
      },
      {
        frameworkCode: "PCI-DSS",
        title: "Quarterly ASV Scan Due",
        daysFromNow: 14,
        priority: "critical",
      },
      {
        frameworkCode: "PIPL",
        title: "CAC Security Assessment for Data Export",
        daysFromNow: 90,
        priority: "critical",
      },
      {
        frameworkCode: "SOX",
        title: "Internal Controls Certification Filing",
        daysFromNow: 45,
        priority: "high",
      },
    ],
  },
];

async function seed() {
  console.log("[seed-all-demo] Connecting to database...");
  await client.connect();

  try {
    const fwRes = await client.query(`SELECT "id", "code" FROM "frameworks"`);
    const codeToId = new Map();
    for (const row of fwRes.rows) {
      codeToId.set(row.code, row.id);
    }
    console.log(`[seed-all-demo] Found ${codeToId.size} frameworks.`);

    let orgCount = 0;
    let memberCount = 0;
    let assessmentCount = 0;
    let riskCount = 0;
    let deadlineCount = 0;

    for (const org of DEMO_ORGS) {
      const orgResult = await client.query(
        `INSERT INTO "organizations" ("slug", "name", "billingEmail", "industry", "primaryJurisdiction", "plan", "maxSeats", "isActive")
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
         ON CONFLICT ("slug") DO UPDATE SET
           "name" = EXCLUDED."name",
           "billingEmail" = EXCLUDED."billingEmail",
           "industry" = EXCLUDED."industry",
           "primaryJurisdiction" = EXCLUDED."primaryJurisdiction",
           "plan" = EXCLUDED."plan",
           "maxSeats" = EXCLUDED."maxSeats",
           "updatedAt" = NOW()
         RETURNING "id"`,
        [
          org.slug,
          org.name,
          org.billingEmail,
          org.industry,
          org.primaryJurisdiction,
          org.plan,
          org.maxSeats,
        ]
      );
      const orgId = orgResult.rows[0].id;
      orgCount++;

      for (const user of org.users) {
        const userResult = await client.query(
          `INSERT INTO "users" ("openId", "name", "email", "role", "status")
           VALUES ($1, $2, $3, $4, 'active')
           ON CONFLICT ("openId") DO UPDATE SET
             "name" = EXCLUDED."name",
             "email" = EXCLUDED."email",
             "role" = EXCLUDED."role",
             "updatedAt" = NOW()
           RETURNING "id"`,
          [
            `demo-${org.slug}-${user.email}`,
            user.name,
            user.email,
            user.role === "owner" ? "company_admin" : "user",
          ]
        );
        const userId = userResult.rows[0].id;

        await client.query(
          `INSERT INTO "organizationMembers" ("organizationId", "userId", "role", "status")
           VALUES ($1, $2, $3, 'active')
           ON CONFLICT DO NOTHING`,
          [orgId, userId, user.role]
        );
        memberCount++;
      }

      for (const fa of org.frameworkAssessments) {
        const frameworkId = codeToId.get(fa.frameworkCode);
        if (!frameworkId) continue;

        const ctrlRes = await client.query(
          `SELECT "id" FROM "complianceControls" WHERE "frameworkId" = $1 LIMIT 1`,
          [frameworkId]
        );
        if (ctrlRes.rows.length === 0) continue;

        const assessmentDate = addDays(NOW, -Math.floor(Math.random() * 60));
        await client.query(
          `INSERT INTO "vendorAssessments" ("vendorId", "frameworkId", "assessmentDate", "complianceScore", "riskLevel", "status", "findings", "recommendations")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [
            null,
            frameworkId,
            assessmentDate.toISOString(),
            fa.score,
            fa.riskLevel,
            fa.status,
            `${fa.frameworkCode} assessment scored ${fa.score}%. Status: ${fa.status}.`,
            `Improve ${fa.frameworkCode} compliance by addressing identified gaps.`,
          ]
        );
        assessmentCount++;
      }

      for (const risk of org.risks) {
        await client.query(
          `INSERT INTO "riskRegister" ("organizationId", "title", "description", "category", "likelihood", "impact", "treatment", "status", "notes")
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8)
           ON CONFLICT DO NOTHING`,
          [
            orgId,
            risk.title,
            `Demo risk entry: ${risk.title}`,
            risk.category,
            risk.likelihood,
            risk.impact,
            risk.treatment,
            `Automatically seeded demo risk. Review and update as needed.`,
          ]
        );
        riskCount++;
      }

      for (const dl of org.deadlines) {
        const deadlineDate = addDays(NOW, dl.daysFromNow);
        await client.query(
          `INSERT INTO "complianceDeadlines" ("organizationId", "frameworkCode", "title", "description", "deadlineDate", "jurisdiction", "priority", "status")
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'upcoming')
           ON CONFLICT DO NOTHING`,
          [
            orgId,
            dl.frameworkCode,
            dl.title,
            `Demo deadline for ${dl.frameworkCode}: ${dl.title}`,
            deadlineDate.toISOString(),
            "Both",
            dl.priority,
          ]
        );
        deadlineCount++;
      }
    }

    console.log(`[seed-all-demo] Seeded ${orgCount} organizations.`);
    console.log(`[seed-all-demo] Seeded ${memberCount} organization members.`);
    console.log(
      `[seed-all-demo] Seeded ${assessmentCount} compliance assessments.`
    );
    console.log(`[seed-all-demo] Seeded ${riskCount} risk register entries.`);
    console.log(
      `[seed-all-demo] Seeded ${deadlineCount} compliance deadlines.`
    );
    console.log("[seed-all-demo] Complete.");
  } catch (err) {
    console.error("[seed-all-demo] Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
