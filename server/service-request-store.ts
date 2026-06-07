/**
 * Service Request Store — DB operations for service-request-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { serviceRequests } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export const SERVICE_TYPES = [
    "penetration_test", "red_team", "security_audit", "soc_support",
    "incident_response", "consulting", "phishing_simulation",
    "cloud_security_review", "vulnerability_assessment", "compliance_gap_assessment",
] as const;

export const REQUEST_STATUSES = [
    "draft", "submitted", "under_review", "scoping", "approved",
    "in_progress", "completed", "cancelled", "on_hold",
] as const;

export const PRIORITY_LEVELS = ["low", "medium", "high", "critical"] as const;

type ServiceType = typeof SERVICE_TYPES[number];
type RequestStatus = typeof REQUEST_STATUSES[number];
type PriorityLevel = typeof PRIORITY_LEVELS[number];

export type ServiceRequestRow = {
    id: number;
    organizationId: number;
    requestedByUserId: number | null;
    serviceType: ServiceType;
    title: string;
    description: string;
    scopeDetails: string | null;
    preferredStartDate: Date | null;
    budgetRange: string | null;
    priority: PriorityLevel;
    status: RequestStatus;
    assignedToUserId: number | null;
    internalNotes: string | null;
    clientResponse: string | null;
    respondedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const MEM_REQUESTS: ServiceRequestRow[] = [];
let memSeq = 1;

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateServiceRequestInput = {
    serviceType: ServiceType;
    title: string;
    description: string;
    scopeDetails?: string;
    preferredStartDate?: string;
    budgetRange?: string;
    priority: PriorityLevel;
};

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listRequests(orgId: number): Promise<ServiceRequestRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return [...MEM_REQUESTS.filter(r => r.organizationId === orgId)]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.organizationId, orgId))
        .orderBy(desc(serviceRequests.createdAt)) as unknown as Promise<ServiceRequestRow[]>;
}

export async function getRequest(orgId: number, id: number): Promise<ServiceRequestRow | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_REQUESTS.find(r => r.id === id && r.organizationId === orgId) ?? null;
    }
    const [row] = await db
        .select()
        .from(serviceRequests)
        .where(and(eq(serviceRequests.id, id), eq(serviceRequests.organizationId, orgId)))
        .limit(1);
    return (row as ServiceRequestRow) ?? null;
}

export async function createRequest(
    orgId: number,
    input: CreateServiceRequestInput,
    localUserId: number | null,
): Promise<{ row: ServiceRequestRow; insertId: number }> {
    const db = await getDb();
    const now = new Date();
    const preferredStartDate = input.preferredStartDate ? new Date(input.preferredStartDate) : null;

    if (!db || orgId < 0) {
        const newReq: ServiceRequestRow = {
            id: memSeq++,
            organizationId: orgId,
            requestedByUserId: localUserId,
            serviceType: input.serviceType,
            title: input.title,
            description: input.description,
            scopeDetails: input.scopeDetails ?? null,
            preferredStartDate,
            budgetRange: input.budgetRange ?? null,
            priority: input.priority,
            status: "submitted",
            assignedToUserId: null,
            internalNotes: null,
            clientResponse: null,
            respondedAt: null,
            completedAt: null,
            createdAt: now,
            updatedAt: now,
        };
        MEM_REQUESTS.push(newReq);
        return { row: newReq, insertId: newReq.id };
    }

    const [result] = await db.insert(serviceRequests).values({
        organizationId: orgId,
        requestedByUserId: localUserId,
        serviceType: input.serviceType,
        title: input.title,
        description: input.description,
        scopeDetails: input.scopeDetails ?? null,
        preferredStartDate,
        budgetRange: input.budgetRange ?? null,
        priority: input.priority,
        status: "submitted",
    });
    const insertId = (result as { insertId: number }).insertId;
    const [created] = await db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, insertId))
        .limit(1);
    return { row: created as ServiceRequestRow, insertId };
}

export async function cancelRequest(
    orgId: number,
    id: number,
): Promise<ServiceRequestRow | { id: number; status: "cancelled" } | "not_found" | "not_cancellable"> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const req = MEM_REQUESTS.find(r => r.id === id && r.organizationId === orgId);
        if (!req) return "not_found";
        if (!["draft", "submitted"].includes(req.status)) return "not_cancellable";
        req.status = "cancelled";
        req.updatedAt = new Date();
        return req;
    }
    const [existing] = await db
        .select()
        .from(serviceRequests)
        .where(and(eq(serviceRequests.id, id), eq(serviceRequests.organizationId, orgId)))
        .limit(1);
    if (!existing) return "not_found";
    if (!["draft", "submitted"].includes(existing.status)) return "not_cancellable";
    await db
        .update(serviceRequests)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(serviceRequests.id, id));
    return { id, status: "cancelled" };
}

export async function adminListRequests(): Promise<ServiceRequestRow[]> {
    const db = await getDb();
    if (!db) {
        return [...MEM_REQUESTS].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return db
        .select()
        .from(serviceRequests)
        .orderBy(desc(serviceRequests.createdAt)) as unknown as Promise<ServiceRequestRow[]>;
}

export async function adminUpdateRequest(
    id: number,
    updateValues: Record<string, unknown>,
): Promise<ServiceRequestRow | null> {
    const db = await getDb();
    if (!db) {
        const req = MEM_REQUESTS.find(r => r.id === id);
        if (!req) return null;
        Object.assign(req, updateValues);
        return req;
    }
    await db
        .update(serviceRequests)
        .set(updateValues as any)
        .where(eq(serviceRequests.id, id));
    const [updated] = await db
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, id))
        .limit(1);
    return (updated as ServiceRequestRow) ?? null;
}
