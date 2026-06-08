/**
 * Remediation Store — DB operations for remediation-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { remediationTasks } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskStatus = "open" | "in_progress" | "resolved" | "accepted_risk";
type TaskSeverity = "critical" | "high" | "medium" | "low";

export type TaskRow = {
    id: number;
    organizationId: number;
    vendorId: number | null;
    gapCode: string | null;
    title: string;
    description: string | null;
    severity: TaskSeverity;
    status: TaskStatus;
    assignedToUserId: number | null;
    dueDate: Date | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const MEM_TASKS: TaskRow[] = [];
let memSeq = 1;

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateTaskInput = {
    title: string;
    description?: string;
    severity: TaskSeverity;
    status: TaskStatus;
    gapCode?: string;
    vendorId?: number;
    assignedToUserId?: number;
    dueDate?: string;
    notes?: string;
};

export type PatchTaskFields = Partial<Omit<CreateTaskInput, "dueDate" | "assignedToUserId">> & { assignedToUserId?: number | null };

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listTasks(orgId: number): Promise<TaskRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_TASKS.filter(t => t.organizationId === orgId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return db
        .select()
        .from(remediationTasks)
        .where(eq(remediationTasks.organizationId, orgId))
        .orderBy(desc(remediationTasks.createdAt)) as unknown as Promise<TaskRow[]>;
}

export async function createTask(orgId: number, input: CreateTaskInput): Promise<TaskRow> {
    const db = await getDb();
    const now = new Date();
    const dueDate = input.dueDate ? new Date(input.dueDate) : null;
    if (!db || orgId < 0) {
        const task: TaskRow = {
            id: memSeq++,
            organizationId: orgId,
            vendorId: input.vendorId ?? null,
            gapCode: input.gapCode ?? null,
            title: input.title,
            description: input.description ?? null,
            severity: input.severity,
            status: input.status,
            assignedToUserId: input.assignedToUserId ?? null,
            dueDate,
            notes: input.notes ?? null,
            createdAt: now,
            updatedAt: now,
        };
        MEM_TASKS.push(task);
        return task;
    }
    const [insertedRemediation] = await db.insert(remediationTasks).values({
        organizationId: orgId,
        vendorId: input.vendorId ?? null,
        gapCode: input.gapCode ?? null,
        title: input.title,
        description: input.description ?? null,
        severity: input.severity,
        status: input.status,
        assignedToUserId: input.assignedToUserId ?? null,
        dueDate,
        notes: input.notes ?? null,
    }).returning({ id: remediationTasks.id });
    const newId = insertedRemediation.id;
    return {
        id: newId,
        organizationId: orgId,
        vendorId: input.vendorId ?? null,
        gapCode: input.gapCode ?? null,
        title: input.title,
        description: input.description ?? null,
        severity: input.severity,
        status: input.status,
        assignedToUserId: input.assignedToUserId ?? null,
        dueDate,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
    };
}

/** Returns null if task not found. */
export async function updateTaskStatus(
    orgId: number,
    id: number,
    status: TaskStatus,
): Promise<{ id: number; status: TaskStatus } | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const task = MEM_TASKS.find(t => t.id === id && t.organizationId === orgId);
        if (!task) return null;
        task.status = status;
        task.updatedAt = new Date();
        return { id: task.id, status: task.status };
    }
    await db
        .update(remediationTasks)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(remediationTasks.id, id), eq(remediationTasks.organizationId, orgId)));
    return { id, status };
}

/** Returns null if task not found (in-memory path); { id } for DB path. */
export async function patchTask(
    orgId: number,
    id: number,
    fields: PatchTaskFields,
    dueDate: Date | null | undefined,
): Promise<TaskRow | { id: number } | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const task = MEM_TASKS.find(t => t.id === id && t.organizationId === orgId);
        if (!task) return null;
        Object.assign(task, fields);
        if (dueDate !== undefined) task.dueDate = dueDate;
        task.updatedAt = new Date();
        return task;
    }
    const updates: Record<string, unknown> = { ...fields, updatedAt: new Date() };
    if (dueDate !== undefined) updates.dueDate = dueDate;
    await db
        .update(remediationTasks)
        .set(updates)
        .where(and(eq(remediationTasks.id, id), eq(remediationTasks.organizationId, orgId)));
    return { id };
}

/** Returns false if task not found. */
export async function removeTask(orgId: number, id: number): Promise<boolean> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_TASKS.findIndex(t => t.id === id && t.organizationId === orgId);
        if (idx === -1) return false;
        MEM_TASKS.splice(idx, 1);
        return true;
    }
    await db
        .delete(remediationTasks)
        .where(and(eq(remediationTasks.id, id), eq(remediationTasks.organizationId, orgId)));
    return true;
}
