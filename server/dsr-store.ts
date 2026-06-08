/**
 * DSR Store — DB operations for dsr-router.ts
 */

import { and, asc, eq } from "drizzle-orm";
import { dsrRequests } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export const REQUEST_TYPES = ["access", "rectification", "erasure", "portability", "restriction", "objection", "explanation"] as const;
export const JURISDICTIONS = ["China", "Saudi Arabia", "Other"] as const;
export const STATUSES = ["received", "in_review", "pending_info", "completed", "rejected", "withdrawn"] as const;
export const PRIORITIES = ["normal", "high", "urgent"] as const;

type RequestType = typeof REQUEST_TYPES[number];
type Jurisdiction = typeof JURISDICTIONS[number];
type Status = typeof STATUSES[number];
type Priority = typeof PRIORITIES[number];

export type DsrRow = {
    id: number;
    organizationId: number;
    requestType: RequestType;
    jurisdiction: Jurisdiction;
    requesterName: string;
    requesterEmail: string;
    description: string | null;
    status: Status;
    priority: Priority;
    dueDate: Date;
    completedAt: Date | null;
    assignedToUserId: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback (seeded) ─────────────────────────────────────────────

export function computeDueDate(jurisdiction: Jurisdiction, from: Date = new Date()): Date {
    const d = new Date(from);
    d.setDate(d.getDate() + (jurisdiction === "China" ? 21 : 30));
    return d;
}

const _now = new Date();
const MEM_DSRS: DsrRow[] = [
    { id: 1, organizationId: 1, requestType: "access", jurisdiction: "China", requesterName: "Li Wei", requesterEmail: "li.wei@example.cn", description: "Requesting a copy of all personal data held about me under PIPL Article 45.", status: "in_review", priority: "normal", dueDate: computeDueDate("China", new Date(_now.getTime() - 5 * 86400000)), completedAt: null, assignedToUserId: null, notes: "Verification of identity completed.", createdAt: new Date(_now.getTime() - 5 * 86400000), updatedAt: new Date(_now.getTime() - 3 * 86400000) },
    { id: 2, organizationId: 1, requestType: "erasure", jurisdiction: "Saudi Arabia", requesterName: "Khalid Al-Mansour", requesterEmail: "k.almansour@example.sa", description: "Requesting deletion of all personal data per PDPL Article 6.", status: "received", priority: "high", dueDate: computeDueDate("Saudi Arabia", new Date(_now.getTime() - 2 * 86400000)), completedAt: null, assignedToUserId: null, notes: null, createdAt: new Date(_now.getTime() - 2 * 86400000), updatedAt: new Date(_now.getTime() - 2 * 86400000) },
    { id: 3, organizationId: 1, requestType: "portability", jurisdiction: "China", requesterName: "Zhang Min", requesterEmail: "zhang.min@example.cn", description: "Requesting data portability to transfer records to another provider.", status: "completed", priority: "normal", dueDate: computeDueDate("China", new Date(_now.getTime() - 25 * 86400000)), completedAt: new Date(_now.getTime() - 3 * 86400000), assignedToUserId: null, notes: "Data exported and sent via secure channel.", createdAt: new Date(_now.getTime() - 25 * 86400000), updatedAt: new Date(_now.getTime() - 3 * 86400000) },
    { id: 4, organizationId: 1, requestType: "rectification", jurisdiction: "Saudi Arabia", requesterName: "Fatimah Al-Hassan", requesterEmail: "f.alhassan@example.sa", description: "Incorrect date of birth in our records — requesting correction.", status: "pending_info", priority: "urgent", dueDate: new Date(_now.getTime() + 3 * 86400000), completedAt: null, assignedToUserId: null, notes: "Waiting for ID document from requester.", createdAt: new Date(_now.getTime() - 10 * 86400000), updatedAt: new Date(_now.getTime() - 1 * 86400000) },
];

let memSeq = 5;

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateDsrInput = {
    requestType: RequestType;
    jurisdiction: Jurisdiction;
    requesterName: string;
    requesterEmail: string;
    description?: string;
    priority: Priority;
    assignedToUserId?: number;
    notes?: string;
};

export type PatchDsrInput = {
    status?: Status;
    priority?: Priority;
    assignedToUserId?: number | null;
    notes?: string;
    completedAt?: string | null;
};

// ─── Summary helper ───────────────────────────────────────────────────────────

export function buildDsrSummary(rows: { status: string; dueDate: Date | string }[]) {
    const counts: Record<string, number> = { received: 0, in_review: 0, pending_info: 0, completed: 0, rejected: 0, withdrawn: 0 };
    let overdue = 0;
    const now = new Date();
    for (const row of rows) {
        counts[row.status] = (counts[row.status] ?? 0) + 1;
        const due = typeof row.dueDate === "string" ? new Date(row.dueDate) : row.dueDate;
        if (due < now && row.status !== "completed" && row.status !== "rejected" && row.status !== "withdrawn") overdue++;
    }
    const open = counts.received + counts.in_review + counts.pending_info;
    return { counts, open, overdue, total: rows.length };
}

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listDsrs(
    orgId: number,
    filters?: { status?: Status; requestType?: RequestType; jurisdiction?: Jurisdiction },
): Promise<DsrRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        let items = MEM_DSRS.filter(d => d.organizationId === orgId);
        if (filters?.status) items = items.filter(d => d.status === filters.status);
        if (filters?.requestType) items = items.filter(d => d.requestType === filters.requestType);
        if (filters?.jurisdiction) items = items.filter(d => d.jurisdiction === filters.jurisdiction);
        return [...items].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    }
    const conditions = [eq(dsrRequests.organizationId, orgId)];
    if (filters?.status) conditions.push(eq(dsrRequests.status, filters.status));
    if (filters?.requestType) conditions.push(eq(dsrRequests.requestType, filters.requestType));
    if (filters?.jurisdiction) conditions.push(eq(dsrRequests.jurisdiction, filters.jurisdiction));
    return db
        .select()
        .from(dsrRequests)
        .where(and(...conditions))
        .orderBy(asc(dsrRequests.dueDate)) as unknown as Promise<DsrRow[]>;
}

export async function createDsr(
    orgId: number,
    input: CreateDsrInput,
    assignedToUserId: number | null,
): Promise<{ success: boolean; id: number; dueDate: Date }> {
    const db = await getDb();
    const now = new Date();
    const dueDate = computeDueDate(input.jurisdiction, now);
    if (!db || orgId < 0) {
        const item: DsrRow = {
            id: memSeq++,
            organizationId: orgId,
            requestType: input.requestType,
            jurisdiction: input.jurisdiction,
            requesterName: input.requesterName,
            requesterEmail: input.requesterEmail,
            description: input.description ?? null,
            status: "received",
            priority: input.priority,
            dueDate,
            completedAt: null,
            assignedToUserId,
            notes: input.notes ?? null,
            createdAt: now,
            updatedAt: now,
        };
        MEM_DSRS.push(item);
        return { success: true, id: item.id, dueDate };
    }
    const [inserted] = await db.insert(dsrRequests).values({
        organizationId: orgId,
        requestType: input.requestType,
        jurisdiction: input.jurisdiction,
        requesterName: input.requesterName,
        requesterEmail: input.requesterEmail,
        description: input.description ?? null,
        status: "received",
        priority: input.priority,
        dueDate,
        completedAt: null,
        assignedToUserId,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
    }).returning({ id: dsrRequests.id });
    const insertId = inserted.id;
    return { success: true, id: insertId, dueDate };
}

export async function patchDsr(
    orgId: number,
    id: number,
    update: Record<string, unknown>,
): Promise<boolean> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_DSRS.findIndex(d => d.id === id && d.organizationId === orgId);
        if (idx === -1) return false;
        Object.assign(MEM_DSRS[idx], update);
        return true;
    }
    const [existing] = await db
        .select({ id: dsrRequests.id, organizationId: dsrRequests.organizationId })
        .from(dsrRequests)
        .where(eq(dsrRequests.id, id));
    if (!existing || existing.organizationId !== orgId) return false;
    await db
        .update(dsrRequests)
        .set(update)
        .where(and(eq(dsrRequests.id, id), eq(dsrRequests.organizationId, orgId)));
    return true;
}

export async function removeDsr(orgId: number, id: number): Promise<boolean> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_DSRS.findIndex(d => d.id === id && d.organizationId === orgId);
        if (idx === -1) return false;
        MEM_DSRS.splice(idx, 1);
        return true;
    }
    const [existing] = await db
        .select({ id: dsrRequests.id, organizationId: dsrRequests.organizationId })
        .from(dsrRequests)
        .where(eq(dsrRequests.id, id));
    if (!existing || existing.organizationId !== orgId) return false;
    await db.delete(dsrRequests).where(and(eq(dsrRequests.id, id), eq(dsrRequests.organizationId, orgId)));
    return true;
}

export async function getDsrSummary(orgId: number) {
    const db = await getDb();
    if (!db || orgId < 0) {
        return buildDsrSummary(
            MEM_DSRS.filter(d => d.organizationId === orgId).map(d => ({ status: d.status, dueDate: d.dueDate }))
        );
    }
    const rows = await db
        .select({ status: dsrRequests.status, dueDate: dsrRequests.dueDate })
        .from(dsrRequests)
        .where(eq(dsrRequests.organizationId, orgId));
    return buildDsrSummary(rows as { status: string; dueDate: Date | string }[]);
}
