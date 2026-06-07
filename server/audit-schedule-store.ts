/**
 * Audit Schedule Store — DB operations for audit-schedule-router.ts
 */

import { and, asc, eq } from "drizzle-orm";
import { auditSchedules } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditType = "internal" | "external" | "regulatory" | "certification";
type AuditStatus = "planned" | "in_progress" | "completed" | "cancelled";
type Recurrence = "none" | "monthly" | "quarterly" | "biannual" | "annual";

export type AuditRow = {
    id: number;
    organizationId: number;
    title: string;
    description: string | null;
    auditType: AuditType;
    scope: string | null;
    status: AuditStatus;
    scheduledDate: Date;
    completedDate: Date | null;
    assignedToId: number | null;
    vendorId: number | null;
    findings: string | null;
    recurrence: Recurrence;
    nextOccurrence: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const MEM_AUDITS: AuditRow[] = [];
let memSeq = 1;

// ─── Recurrence helper ────────────────────────────────────────────────────────

function addMonths(d: Date, n: number): Date {
    const r = new Date(d);
    r.setMonth(r.getMonth() + n);
    return r;
}

export function calcNextOccurrence(completed: Date, rec: Recurrence): Date | null {
    switch (rec) {
        case "monthly": return addMonths(completed, 1);
        case "quarterly": return addMonths(completed, 3);
        case "biannual": return addMonths(completed, 6);
        case "annual": return addMonths(completed, 12);
        default: return null;
    }
}

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateAuditInput = {
    title: string;
    description?: string;
    auditType: AuditType;
    scope?: string[];
    status: AuditStatus;
    scheduledDate: string;
    assignedToId?: number;
    vendorId?: number;
    findings?: string;
    recurrence: Recurrence;
    notes?: string;
};

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listAudits(orgId: number): Promise<AuditRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_AUDITS
            .filter(a => a.organizationId === orgId)
            .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    }
    return db
        .select()
        .from(auditSchedules)
        .where(eq(auditSchedules.organizationId, orgId))
        .orderBy(asc(auditSchedules.scheduledDate)) as unknown as Promise<AuditRow[]>;
}

export async function createAudit(orgId: number, input: CreateAuditInput): Promise<{ id: number }> {
    const db = await getDb();
    const now = new Date();
    const scopeJson = input.scope ? JSON.stringify(input.scope) : null;
    const scheduledDate = new Date(input.scheduledDate);
    if (!db || orgId < 0) {
        const entry: AuditRow = {
            id: memSeq++,
            organizationId: orgId,
            title: input.title,
            description: input.description ?? null,
            auditType: input.auditType,
            scope: scopeJson,
            status: input.status,
            scheduledDate,
            completedDate: null,
            assignedToId: input.assignedToId ?? null,
            vendorId: input.vendorId ?? null,
            findings: input.findings ?? null,
            recurrence: input.recurrence,
            nextOccurrence: null,
            notes: input.notes ?? null,
            createdAt: now,
            updatedAt: now,
        };
        MEM_AUDITS.push(entry);
        return { id: entry.id };
    }
    const result = await db.insert(auditSchedules).values({
        organizationId: orgId,
        title: input.title,
        description: input.description ?? null,
        auditType: input.auditType,
        scope: scopeJson,
        status: input.status,
        scheduledDate,
        assignedToId: input.assignedToId ?? null,
        vendorId: input.vendorId ?? null,
        findings: input.findings ?? null,
        recurrence: input.recurrence,
        notes: input.notes ?? null,
    });
    return { id: (result as unknown as { insertId: number }).insertId };
}

export async function patchAudit(
    orgId: number,
    id: number,
    updates: Record<string, unknown>,
): Promise<void> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_AUDITS.findIndex(a => a.id === id && a.organizationId === orgId);
        if (idx >= 0) Object.assign(MEM_AUDITS[idx], updates, { updatedAt: new Date() });
        return;
    }
    await db
        .update(auditSchedules)
        .set({ ...updates, updatedAt: new Date() } as any)
        .where(and(eq(auditSchedules.id, id), eq(auditSchedules.organizationId, orgId)));
}

export async function completeAudit(
    orgId: number,
    id: number,
    findings: string | undefined,
): Promise<{ nextOccurrence: string | null; found: boolean }> {
    const db = await getDb();
    const completedDate = new Date();
    if (!db || orgId < 0) {
        const idx = MEM_AUDITS.findIndex(a => a.id === id && a.organizationId === orgId);
        if (idx >= 0) {
            const rec = MEM_AUDITS[idx].recurrence;
            const nextOcc = calcNextOccurrence(completedDate, rec);
            Object.assign(MEM_AUDITS[idx], { status: "completed", completedDate, nextOccurrence: nextOcc, updatedAt: new Date() });
            return { nextOccurrence: nextOcc?.toISOString() ?? null, found: true };
        }
        return { nextOccurrence: null, found: false };
    }
    const rows = await db
        .select()
        .from(auditSchedules)
        .where(and(eq(auditSchedules.id, id), eq(auditSchedules.organizationId, orgId)));
    if (!rows.length) return { nextOccurrence: null, found: false };
    const audit = rows[0];
    const rec = (audit.recurrence ?? "none") as Recurrence;
    const nextOcc = calcNextOccurrence(completedDate, rec);
    await db
        .update(auditSchedules)
        .set({
            status: "completed",
            completedDate,
            findings: findings ?? audit.findings ?? null,
            nextOccurrence: nextOcc ?? null,
            updatedAt: new Date(),
        } as any)
        .where(eq(auditSchedules.id, id));
    return { nextOccurrence: nextOcc?.toISOString() ?? null, found: true };
}

export async function removeAudit(orgId: number, id: number): Promise<void> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_AUDITS.findIndex(a => a.id === id && a.organizationId === orgId);
        if (idx >= 0) MEM_AUDITS.splice(idx, 1);
        return;
    }
    await db
        .delete(auditSchedules)
        .where(and(eq(auditSchedules.id, id), eq(auditSchedules.organizationId, orgId)));
}
