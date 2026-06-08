/**
 * deadline-store.ts — CRUD for complianceDeadlines.
 * Falls back to in-memory seeded global deadlines when DB is unavailable.
 */
import { and, eq, isNull, lt, gte, desc, or } from "drizzle-orm";
import { getDb } from "./db";
import { complianceDeadlines, organizationMembers, users, type ComplianceDeadline, type InsertComplianceDeadline } from "../drizzle/schema";

// ---------------------------------------------------------------------------
// Seeded global regulatory deadlines (no DB required)
// ---------------------------------------------------------------------------
const NOW = new Date("2026-03-23T00:00:00Z");
const d = (offsetDays: number) => new Date(NOW.getTime() + offsetDays * 86_400_000);

const GLOBAL_DEADLINES: ComplianceDeadline[] = [
    {
        id: 1,
        organizationId: null,
        frameworkCode: "PIPL",
        title: "PIPL Annual Personal Information Protection Impact Assessment",
        description:
            "Submit annual PIIA report to the Cyberspace Administration of China (CAC). Required for large-scale personal data processors.",
        deadlineDate: d(20),
        jurisdiction: "China",
        priority: "critical",
        status: "upcoming",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 2,
        organizationId: null,
        frameworkCode: "CSL",
        title: "MLPS Level 2/3 Annual Security Assessment Submission",
        description:
            "Multi-Level Protection Scheme annual review must be submitted to provincial security bureaus. MLPS 2.0 requirements apply.",
        deadlineDate: d(45),
        jurisdiction: "China",
        priority: "high",
        status: "upcoming",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 3,
        organizationId: null,
        frameworkCode: "DSL",
        title: "DSL Data Classification Annual Report",
        description:
            "Submit annual data classification and grading report as required under China Data Security Law Article 21.",
        deadlineDate: d(60),
        jurisdiction: "China",
        priority: "high",
        status: "upcoming",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 4,
        organizationId: null,
        frameworkCode: "PIPL",
        title: "PIPL Cross-Border Data Transfer Standard Contract Filing",
        description:
            "Standard contract for cross-border personal data transfers must be filed with CAC within 10 days of contract execution.",
        deadlineDate: d(7),
        jurisdiction: "China",
        priority: "critical",
        status: "upcoming",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 5,
        organizationId: null,
        frameworkCode: "PDPL",
        title: "PDPL Personal Data Processing Activity Registration",
        description:
            "Register all personal data processing activities with SDAIA's National Data Management Office as required by PDPL Article 7.",
        deadlineDate: d(15),
        jurisdiction: "Saudi Arabia",
        priority: "critical",
        status: "upcoming",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 6,
        organizationId: null,
        frameworkCode: "NCA",
        title: "NCA Essential Cybersecurity Controls (ECC) Annual Self-Assessment",
        description:
            "Submit annual ECC compliance self-assessment to the National Cybersecurity Authority. Mandatory for all government entities and critical infrastructure operators.",
        deadlineDate: d(30),
        jurisdiction: "Saudi Arabia",
        priority: "critical",
        status: "upcoming",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 7,
        organizationId: null,
        frameworkCode: "NCA",
        title: "NCA Cloud Cybersecurity Controls (CCC) Compliance Report",
        description:
            "Annual compliance report against NCA Cloud Cybersecurity Controls for organizations using cloud services in Saudi Arabia.",
        deadlineDate: d(75),
        jurisdiction: "Saudi Arabia",
        priority: "high",
        status: "upcoming",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 8,
        organizationId: null,
        frameworkCode: "PDPL",
        title: "PDPL Data Breach Notification — 72-Hour Window",
        description:
            "Any personal data breach must be reported to SDAIA within 72 hours of discovery. Ensure incident response plan is tested quarterly.",
        deadlineDate: d(-5),
        jurisdiction: "Saudi Arabia",
        priority: "critical",
        status: "overdue",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 9,
        organizationId: null,
        frameworkCode: "CSL",
        title: "CSL Network Security Emergency Response Plan Annual Drill",
        description:
            "Network operators must conduct an annual emergency response drill and submit the drill report to competent authorities.",
        deadlineDate: d(-10),
        jurisdiction: "China",
        priority: "medium",
        status: "overdue",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
    {
        id: 10,
        organizationId: null,
        frameworkCode: "NCA",
        title: "NCA Operational Technology Cybersecurity Controls (OTCC) Assessment",
        description:
            "Annual cybersecurity assessment for OT systems per NCA OTCC-1 framework. Required for energy, utilities and critical national infrastructure.",
        deadlineDate: d(90),
        jurisdiction: "Saudi Arabia",
        priority: "high",
        status: "upcoming",
        notificationsSent: null,
        assignedToUserId: null,
        completedAt: null,
        createdAt: NOW,
        updatedAt: NOW,
    },
];

let memoryDeadlines: ComplianceDeadline[] = [...GLOBAL_DEADLINES];
let nextId = GLOBAL_DEADLINES.length + 1;

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
export type DeadlineFilters = {
    organizationId?: number | null;
    jurisdiction?: "China" | "Saudi Arabia" | "Both";
    status?: "upcoming" | "overdue" | "completed" | "waived";
    frameworkCode?: string;
    limit?: number;
    includeGlobal?: boolean;
};

export async function listDeadlines(filters: DeadlineFilters = {}): Promise<ComplianceDeadline[]> {
    const db = await getDb();
    const limit = filters.limit ?? 200;

    if (!db) {
        let rows = [...memoryDeadlines];
        if (filters.status) rows = rows.filter(r => r.status === filters.status);
        if (filters.jurisdiction) rows = rows.filter(r => r.jurisdiction === filters.jurisdiction || r.jurisdiction === "Both");
        if (filters.frameworkCode) rows = rows.filter(r => r.frameworkCode === filters.frameworkCode);
        // Filter by org: include org-specific + global (null)
        if (filters.organizationId != null) {
            rows = rows.filter(r => r.organizationId === filters.organizationId || r.organizationId === null);
        }
        return rows.slice(0, limit);
    }

    const conditions = [];
    if (filters.status) conditions.push(eq(complianceDeadlines.status, filters.status));
    if (filters.jurisdiction) conditions.push(eq(complianceDeadlines.jurisdiction, filters.jurisdiction));
    if (filters.frameworkCode) conditions.push(eq(complianceDeadlines.frameworkCode, filters.frameworkCode));
    // Org isolation: show only this org's deadlines + global (null) deadlines
    if (filters.organizationId != null) {
        conditions.push(
            or(
                eq(complianceDeadlines.organizationId, filters.organizationId),
                isNull(complianceDeadlines.organizationId)
            )!
        );
    }

    const rows = await db
        .select()
        .from(complianceDeadlines)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(complianceDeadlines.deadlineDate))
        .limit(limit);

    return rows;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export type CreateDeadlineInput = {
    organizationId?: number | null;
    frameworkCode: string;
    title: string;
    description?: string;
    deadlineDate: Date;
    jurisdiction: "China" | "Saudi Arabia" | "Both";
    priority?: "low" | "medium" | "high" | "critical";
    assignedToUserId?: number | null;
};

export async function createDeadline(input: CreateDeadlineInput): Promise<ComplianceDeadline> {
    const db = await getDb();
    const now = new Date();
    const isOverdue = input.deadlineDate < now;

    if (!db) {
        const record: ComplianceDeadline = {
            id: nextId++,
            organizationId: input.organizationId ?? null,
            frameworkCode: input.frameworkCode,
            title: input.title.trim(),
            description: input.description?.trim() ?? null,
            deadlineDate: input.deadlineDate,
            jurisdiction: input.jurisdiction,
            priority: input.priority ?? "medium",
            status: isOverdue ? "overdue" : "upcoming",
            notificationsSent: null,
            assignedToUserId: input.assignedToUserId ?? null,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
        };
        memoryDeadlines.push(record);
        return record;
    }

    const values: InsertComplianceDeadline = {
        organizationId: input.organizationId ?? null,
        frameworkCode: input.frameworkCode,
        title: input.title.trim(),
        description: input.description?.trim() ?? null,
        deadlineDate: input.deadlineDate,
        jurisdiction: input.jurisdiction,
        priority: input.priority ?? "medium",
        status: isOverdue ? "overdue" : "upcoming",
        assignedToUserId: input.assignedToUserId ?? null,
    };

    const [inserted] = await db.insert(complianceDeadlines).values(values).returning({ id: complianceDeadlines.id });
    const id = inserted?.id ?? 0;
    const [row] = await db.select().from(complianceDeadlines).where(eq(complianceDeadlines.id, id)).limit(1);
    return row!;
}

// ---------------------------------------------------------------------------
// Complete  
// ---------------------------------------------------------------------------
export async function completeDeadline(id: number, organizationId: number | null): Promise<ComplianceDeadline | null> {
    const db = await getDb();
    const now = new Date();

    if (!db) {
        const idx = memoryDeadlines.findIndex(d => d.id === id && (d.organizationId === organizationId || d.organizationId === null));
        if (idx < 0) return null;
        memoryDeadlines[idx] = { ...memoryDeadlines[idx]!, status: "completed", completedAt: now, updatedAt: now };
        return memoryDeadlines[idx]!;
    }

    const whereClause = organizationId != null
        ? and(eq(complianceDeadlines.id, id), eq(complianceDeadlines.organizationId, organizationId))
        : eq(complianceDeadlines.id, id);

    await db
        .update(complianceDeadlines)
        .set({ status: "completed", completedAt: now })
        .where(whereClause);

    const [row] = await db.select().from(complianceDeadlines).where(eq(complianceDeadlines.id, id)).limit(1);
    return row ?? null;
}

// ---------------------------------------------------------------------------
// Stats summary
// ---------------------------------------------------------------------------
export type DeadlineSummary = {
    total: number;
    upcoming: number;
    overdue: number;
    completed: number;
    critical: number;
};

export async function getDeadlineSummary(organizationId?: number | null): Promise<DeadlineSummary> {
    const all = await listDeadlines({ organizationId, limit: 1000 });
    return {
        total: all.length,
        upcoming: all.filter(d => d.status === "upcoming").length,
        overdue: all.filter(d => d.status === "overdue").length,
        completed: all.filter(d => d.status === "completed").length,
        critical: all.filter(d => d.priority === "critical" && d.status !== "completed").length,
    };
}

// ---------------------------------------------------------------------------
// Org members for deadline assignment
// ---------------------------------------------------------------------------
export type OrgMemberForAssignment = {
    id: number;
    name: string;
    email: string;
    role: string;
};

/**
 * Returns active OAuth members of the given org, suitable for deadline assignment dropdowns.
 * Skips local-auth-only members since assignedToUserId references the OAuth users table.
 */
export async function listOrgMembersForDeadlines(
    organizationId: number | null | undefined,
): Promise<OrgMemberForAssignment[]> {
    if (!organizationId || organizationId < 0) return [];
    const db = await getDb();
    if (!db) return [];

    const rows = await db
        .select({
            userId: organizationMembers.userId,
            role: organizationMembers.role,
            userName: users.name,
            userEmail: users.email,
        })
        .from(organizationMembers)
        .leftJoin(users, eq(organizationMembers.userId, users.id))
        .where(
            and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.status, "active"),
            ),
        );

    return rows
        .filter(r => r.userId !== null)
        .map(r => ({
            id: r.userId!,
            name: r.userName ?? r.userEmail ?? `User ${r.userId}`,
            email: r.userEmail ?? "",
            role: r.role,
        }));
}
