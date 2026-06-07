/**
 * Incident Store — DB operations for incident-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { complianceIncidents } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

type IncidentType = "data_breach" | "unauthorized_access" | "policy_violation" | "system_outage" | "third_party_breach" | "other";
type IncidentStatus = "open" | "under_investigation" | "contained" | "resolved" | "closed";
type IncidentSeverity = "critical" | "high" | "medium" | "low";

export type IncidentRow = {
    id: number;
    organizationId: number;
    incidentCode: string | null;
    title: string;
    description: string | null;
    incidentType: IncidentType;
    severity: IncidentSeverity;
    status: IncidentStatus;
    affectedFrameworks: string | null;
    affectedVendorId: number | null;
    affectedDataTypes: string | null;
    affectedDataSubjects: number | null;
    reportedById: number | null;
    occurredAt: Date | null;
    detectedAt: Date | null;
    containedAt: Date | null;
    resolvedAt: Date | null;
    regulatoryNotificationRequired: boolean;
    regulatoryNotificationSentAt: Date | null;
    notificationDeadlineHours: number;
    rootCause: string | null;
    lessonsLearned: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const MEM_INCIDENTS: IncidentRow[] = [];
let memSeq = 1;

// ─── Input type ───────────────────────────────────────────────────────────────

export type CreateIncidentInput = {
    incidentCode?: string;
    title: string;
    description?: string;
    incidentType: IncidentType;
    severity: IncidentSeverity;
    status: IncidentStatus;
    affectedFrameworks: string[];
    affectedVendorId?: number;
    affectedDataTypes: string[];
    affectedDataSubjects?: number;
    reportedById?: number;
    occurredAt?: string;
    detectedAt?: string;
    regulatoryNotificationRequired: boolean;
    notificationDeadlineHours: number;
    rootCause?: string;
    lessonsLearned?: string;
    notes?: string;
};

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listIncidents(orgId: number): Promise<IncidentRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return [...MEM_INCIDENTS.filter(i => i.organizationId === orgId)]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return db
        .select()
        .from(complianceIncidents)
        .where(eq(complianceIncidents.organizationId, orgId))
        .orderBy(desc(complianceIncidents.createdAt)) as unknown as Promise<IncidentRow[]>;
}

export async function createIncident(orgId: number, input: CreateIncidentInput): Promise<IncidentRow> {
    const db = await getDb();
    const now = new Date();
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : null;
    const detectedAt = input.detectedAt ? new Date(input.detectedAt) : null;
    const fwJson = JSON.stringify(input.affectedFrameworks);
    const dataTypesJson = JSON.stringify(input.affectedDataTypes);

    const baseRow: Omit<IncidentRow, "id"> = {
        organizationId: orgId,
        incidentCode: input.incidentCode ?? null,
        title: input.title,
        description: input.description ?? null,
        incidentType: input.incidentType,
        severity: input.severity,
        status: input.status,
        affectedFrameworks: fwJson,
        affectedVendorId: input.affectedVendorId ?? null,
        affectedDataTypes: dataTypesJson,
        affectedDataSubjects: input.affectedDataSubjects ?? null,
        reportedById: input.reportedById ?? null,
        occurredAt,
        detectedAt,
        containedAt: null,
        resolvedAt: null,
        regulatoryNotificationRequired: input.regulatoryNotificationRequired,
        regulatoryNotificationSentAt: null,
        notificationDeadlineHours: input.notificationDeadlineHours,
        rootCause: input.rootCause ?? null,
        lessonsLearned: input.lessonsLearned ?? null,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
    };

    if (!db || orgId < 0) {
        const incident: IncidentRow = { id: memSeq++, ...baseRow };
        MEM_INCIDENTS.push(incident);
        return incident;
    }

    const result = await db.insert(complianceIncidents).values({
        organizationId: orgId,
        incidentCode: input.incidentCode ?? null,
        title: input.title,
        description: input.description ?? null,
        incidentType: input.incidentType,
        severity: input.severity,
        status: input.status,
        affectedFrameworks: fwJson,
        affectedVendorId: input.affectedVendorId ?? null,
        affectedDataTypes: dataTypesJson,
        affectedDataSubjects: input.affectedDataSubjects ?? null,
        reportedById: input.reportedById ?? null,
        occurredAt,
        detectedAt,
        regulatoryNotificationRequired: input.regulatoryNotificationRequired ? 1 : 0,
        notificationDeadlineHours: input.notificationDeadlineHours,
        rootCause: input.rootCause ?? null,
        lessonsLearned: input.lessonsLearned ?? null,
        notes: input.notes ?? null,
    });
    const newId = (result as unknown as { insertId: number }).insertId;
    return { id: newId, ...baseRow };
}

/** Returns the updated row (in-memory) or { id } (DB), or null if not found. */
export async function patchIncident(
    orgId: number,
    id: number,
    updates: Record<string, unknown>,
): Promise<IncidentRow | { id: number } | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const incident = MEM_INCIDENTS.find(i => i.id === id && i.organizationId === orgId);
        if (!incident) return null;
        Object.assign(incident, updates);
        return incident;
    }
    const existing = await db
        .select({ id: complianceIncidents.id })
        .from(complianceIncidents)
        .where(and(eq(complianceIncidents.id, id), eq(complianceIncidents.organizationId, orgId)));
    if (!existing.length) return null;
    await db
        .update(complianceIncidents)
        .set(updates)
        .where(and(eq(complianceIncidents.id, id), eq(complianceIncidents.organizationId, orgId)));
    return { id };
}

/** Returns current status or null if not found. */
export async function getIncidentStatus(orgId: number, id: number): Promise<string | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_INCIDENTS.find(i => i.id === id && i.organizationId === orgId)?.status ?? null;
    }
    const rows = await db
        .select({ status: complianceIncidents.status })
        .from(complianceIncidents)
        .where(and(eq(complianceIncidents.id, id), eq(complianceIncidents.organizationId, orgId)));
    return rows[0]?.status ?? null;
}

export async function applyIncidentStatusTransition(
    orgId: number,
    id: number,
    newStatus: IncidentStatus,
): Promise<{ id: number; status: IncidentStatus } | null> {
    const db = await getDb();
    const now = new Date();
    if (!db || orgId < 0) {
        const incident = MEM_INCIDENTS.find(i => i.id === id && i.organizationId === orgId);
        if (!incident) return null;
        incident.status = newStatus;
        incident.updatedAt = now;
        if (newStatus === "contained") incident.containedAt = now;
        if (newStatus === "resolved" || newStatus === "closed") incident.resolvedAt = now;
        return { id: incident.id, status: incident.status };
    }
    const setPatch: Record<string, unknown> = { status: newStatus, updatedAt: now };
    if (newStatus === "contained") setPatch.containedAt = now;
    if (newStatus === "resolved" || newStatus === "closed") setPatch.resolvedAt = now;
    await db
        .update(complianceIncidents)
        .set(setPatch)
        .where(and(eq(complianceIncidents.id, id), eq(complianceIncidents.organizationId, orgId)));
    return { id, status: newStatus };
}

export async function markIncidentNotified(
    orgId: number,
    id: number,
): Promise<{ id: number; notifiedAt: Date } | null> {
    const db = await getDb();
    const now = new Date();
    if (!db || orgId < 0) {
        const incident = MEM_INCIDENTS.find(i => i.id === id && i.organizationId === orgId);
        if (!incident) return null;
        incident.regulatoryNotificationSentAt = now;
        incident.updatedAt = now;
        return { id, notifiedAt: now };
    }
    const rows = await db
        .select({ id: complianceIncidents.id })
        .from(complianceIncidents)
        .where(and(eq(complianceIncidents.id, id), eq(complianceIncidents.organizationId, orgId)));
    if (!rows.length) return null;
    await db
        .update(complianceIncidents)
        .set({ regulatoryNotificationSentAt: now, updatedAt: now })
        .where(and(eq(complianceIncidents.id, id), eq(complianceIncidents.organizationId, orgId)));
    return { id, notifiedAt: now };
}

export async function deleteIncident(orgId: number, id: number): Promise<boolean> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_INCIDENTS.findIndex(i => i.id === id && i.organizationId === orgId);
        if (idx === -1) return false;
        MEM_INCIDENTS.splice(idx, 1);
        return true;
    }
    const rows = await db
        .select({ id: complianceIncidents.id })
        .from(complianceIncidents)
        .where(and(eq(complianceIncidents.id, id), eq(complianceIncidents.organizationId, orgId)));
    if (!rows.length) return false;
    await db
        .delete(complianceIncidents)
        .where(and(eq(complianceIncidents.id, id), eq(complianceIncidents.organizationId, orgId)));
    return true;
}
