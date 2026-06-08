import { parseVendorMultiValue } from "@shared/vendorProfile";
import { hasMinRole } from "@shared/const";
import { and, desc, eq, inArray, lt, sql } from "drizzle-orm";
import {
    accessRequests,
    activityEvents,
    adminNotifications,
    assessmentGaps,
    consultationRequests,
    frameworks,
    userInteractionLogs,
    users,
    vendorAssessments,
    type AccessRequest,
    type ActivityEvent,
    type AdminNotification,
    type ConsultationRequest,
    type Framework,
    type User,
} from "../drizzle/schema";
import {
    getDb,
    getDatabaseUnavailableMessage,
    getUserById,
    listUsersForAdmin,
    touchUserActivity,
    updateUserProfile,
    type UpdateUserProfileInput,
} from "./db";
import { ENV } from "./_core/env";
import {
    listAllVendorProfiles,
    listTechStackComponentsByVendorIds,
} from "./vendor-store";

export type AccessRequestInput = {
    fullName: string;
    email: string;
    organizationName: string;
    organizationType?: string;
    useCase?: string;
    preferredLocale?: "en" | "ar" | "zh";
};

export type ConsultationRequestInput = {
    userId?: number | null;
    contactName: string;
    contactEmail: string;
    organizationName: string;
    topic: string;
    jurisdictions: string[];
    summary: string;
    vendorName?: string;
    techStackSummary?: string;
};

export type ActivityEventInput = {
    userId?: number | null;
    actorType: "visitor" | "client" | "admin" | "system";
    action: string;
    entityType: string;
    entityId?: number | null;
    metadata?: Record<string, unknown> | null;
};

export type AdminNotificationInput = {
    category: "registration" | "consultation" | "assessment" | "support" | "system";
    title: string;
    content?: string;
    entityType?: string;
    entityId?: number | null;
};

export type ConsultationResponseInput = {
    consultationId: number;
    status: "in_review" | "responded" | "closed";
    priority?: "low" | "medium" | "high";
    adminResponse: string;
    adminUserId: number;
};

export type UserAccessUpdateInput = {
    userId: number;
    role?: "user" | "admin";
    status?: "active" | "invited" | "suspended";
};

export type AccessRequestStatusUpdateInput = {
    accessRequestId: number;
    status: "new" | "reviewing" | "approved" | "archived";
    adminUserId: number;
};

export type AdminInteractionHeatmap = {
    contexts: string[];
    actions: string[];
    cells: Array<{
        context: string;
        action: string;
        value: number;
    }>;
    maxCellValue: number;
    totalEvents: number;
    windowDays: number;
};

export type InteractionPrivacyStats = {
    retentionDays: number;
    cutoffIso: string;
    totalLogs: number;
    logsOlderThanRetention: number;
};

export type InteractionRetentionRunResult = InteractionPrivacyStats & {
    dryRun: boolean;
    deletedLogs: number;
};

export type InteractionDeleteResult = {
    deletedLogs: number;
    userId: number | null;
    organizationId: number | null;
};

export type AdminOverview = {
    totals: {
        registeredClients: number;
        adminUsers: number;
        openAccessRequests: number;
        openConsultations: number;
        vendors: number;
        assessments: number;
        criticalGaps: number;
        unreadNotifications: number;
    };
    activitySeries: Array<{
        day: string;
        value: number;
    }>;
    riskDistribution: Array<{
        label: string;
        value: number;
    }>;
    regionCoverage: Array<{
        region: string;
        vendors: number;
        assessments: number;
        criticalGaps: number;
    }>;
    corridorFlows: Array<{
        source: string;
        target: string;
        weight: number;
    }>;
    usageHeatmap: AdminInteractionHeatmap;
    recentActivity: Awaited<ReturnType<typeof listActivityFeed>>;
    recentAssessments: Awaited<ReturnType<typeof listAssessmentSummaries>>;
    recentConsultations: Awaited<ReturnType<typeof listConsultationSummaries>>;
    notificationHighlights: Awaited<ReturnType<typeof listAdminNotifications>>;
};

let accessRequestId = 1;
let consultationRequestId = 1;
let activityEventId = 1;
let notificationId = 1;

const memoryAccessRequests: AccessRequest[] = [];
const memoryConsultationRequests: ConsultationRequest[] = [];
const memoryActivityEvents: ActivityEvent[] = [];
const memoryAdminNotifications: AdminNotification[] = [];

function canUseInMemoryFallback() {
    return ENV.allowInMemoryPersistenceFallback;
}

function trimToNull(value: string | undefined | null) {
    if (value == null) {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function normalizeEmail(value: string) {
    return value.trim().toLowerCase();
}

function toJsonText(value: Record<string, unknown> | null | undefined) {
    if (!value) {
        return null;
    }

    return JSON.stringify(value);
}

function fromJsonText<T>(value: string | null | undefined): T | null {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
}

async function loadAccessRequestById(id: number) {
    const db = await getDb();
    if (!db) {
        return memoryAccessRequests.find(request => request.id === id) ?? null;
    }

    const rows = await db
        .select()
        .from(accessRequests)
        .where(eq(accessRequests.id, id))
        .limit(1);
    return rows[0] ?? null;
}

async function loadConsultationRequestById(id: number) {
    const db = await getDb();
    if (!db) {
        return memoryConsultationRequests.find(request => request.id === id) ?? null;
    }

    const rows = await db
        .select()
        .from(consultationRequests)
        .where(eq(consultationRequests.id, id))
        .limit(1);
    return rows[0] ?? null;
}

export async function createAdminNotification(input: AdminNotificationInput) {
    const db = await getDb();
    const title = input.title.trim();
    const content = trimToNull(input.content) ?? null;
    const entityType = trimToNull(input.entityType);
    const entityId = input.entityId ?? null;
    const now = new Date();

    if (!db) {
        const record: AdminNotification = {
            id: notificationId++,
            category: input.category,
            title,
            content,
            entityType,
            entityId,
            isRead: 0,
            readAt: null,
            createdAt: now,
        };
        memoryAdminNotifications.unshift(record);
        return record;
    }

    const [inserted] = await db.insert(adminNotifications).values({
        category: input.category,
        title,
        content,
        entityType,
        entityId,
    }).returning({ id: adminNotifications.id });
    const id = inserted?.id ?? 0;
    const rows = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.id, id))
        .limit(1);
    return rows[0] ?? null;
}

export async function recordActivity(input: ActivityEventInput) {
    const db = await getDb();
    const now = new Date();
    const metadata = toJsonText(input.metadata);

    if (input.userId) {
        await touchUserActivity(input.userId);
    }

    if (!db) {
        const record: ActivityEvent = {
            id: activityEventId++,
            userId: input.userId ?? null,
            localUserId: null,
            actorType: input.actorType,
            actorRole: null,
            action: input.action.trim(),
            entityType: input.entityType.trim(),
            entityId: input.entityId ?? null,
            targetEntity: null,
            payload: null,
            ipHash: null,
            metadata,
            createdAt: now,
        };
        memoryActivityEvents.unshift(record);
        return record;
    }

    const [inserted] = await db.insert(activityEvents).values({
        userId: input.userId ?? null,
        actorType: input.actorType,
        action: input.action.trim(),
        entityType: input.entityType.trim(),
        entityId: input.entityId ?? null,
        metadata,
    }).returning({ id: activityEvents.id });
    const id = inserted?.id ?? 0;
    const rows = await db.select().from(activityEvents).where(eq(activityEvents.id, id)).limit(1);
    return rows[0] ?? null;
}

export async function createAccessRequest(input: AccessRequestInput) {
    const db = await getDb();
    if (!db && !canUseInMemoryFallback()) {
        throw new Error(getDatabaseUnavailableMessage());
    }

    const now = new Date();
    const values = {
        fullName: input.fullName.trim(),
        email: normalizeEmail(input.email),
        organizationName: input.organizationName.trim(),
        organizationType: trimToNull(input.organizationType),
        useCase: trimToNull(input.useCase),
        preferredLocale: input.preferredLocale ?? "en",
        status: "new" as const,
    };

    let record: AccessRequest | null = null;
    if (!db) {
        record = {
            id: accessRequestId++,
            ...values,
            createdAt: now,
            updatedAt: now,
        };
        memoryAccessRequests.unshift(record);
    } else {
        const [inserted] = await db.insert(accessRequests).values(values).returning({ id: accessRequests.id });
        record = await loadAccessRequestById(inserted?.id ?? 0);
    }

    if (!record) {
        throw new Error("Access request could not be created.");
    }

    await recordActivity({
        actorType: "visitor",
        action: "access_request_created",
        entityType: "access_request",
        entityId: record.id,
        metadata: {
            organizationName: record.organizationName,
            email: record.email,
        },
    });

    await createAdminNotification({
        category: "registration",
        title: `New access request from ${record.organizationName}`,
        content: `${record.fullName} requested onboarding access for ${record.organizationName}.`,
        entityType: "access_request",
        entityId: record.id,
    });

    return record;
}

export async function createConsultationRequest(input: ConsultationRequestInput) {
    const db = await getDb();
    if (!db && !canUseInMemoryFallback()) {
        throw new Error(getDatabaseUnavailableMessage());
    }

    const now = new Date();
    const values = {
        userId: input.userId ?? null,
        contactName: input.contactName.trim(),
        contactEmail: normalizeEmail(input.contactEmail),
        organizationName: input.organizationName.trim(),
        topic: input.topic.trim(),
        jurisdictions: JSON.stringify(input.jurisdictions),
        summary: input.summary.trim(),
        vendorName: trimToNull(input.vendorName),
        techStackSummary: trimToNull(input.techStackSummary),
        status: "new" as const,
        priority: "medium" as const,
        adminResponse: null,
        respondedAt: null,
        assignedAdminUserId: null,
    };

    let record: ConsultationRequest | null = null;
    if (!db) {
        record = {
            id: consultationRequestId++,
            ...values,
            createdAt: now,
            updatedAt: now,
        };
        memoryConsultationRequests.unshift(record);
    } else {
        const [inserted] = await db.insert(consultationRequests).values(values).returning({ id: consultationRequests.id });
        record = await loadConsultationRequestById(inserted?.id ?? 0);
    }

    if (!record) {
        throw new Error("Consultation request could not be created.");
    }

    await recordActivity({
        userId: record.userId,
        actorType: record.userId ? "client" : "visitor",
        action: "consultation_request_created",
        entityType: "consultation_request",
        entityId: record.id,
        metadata: {
            topic: record.topic,
            organizationName: record.organizationName,
            vendorName: record.vendorName,
        },
    });

    await createAdminNotification({
        category: "consultation",
        title: `New consultation request: ${record.topic}`,
        content: `${record.organizationName} submitted a consultation request.`,
        entityType: "consultation_request",
        entityId: record.id,
    });

    return record;
}

export async function listAccessRequests(limit = 50) {
    const db = await getDb();
    if (!db) {
        return memoryAccessRequests.slice(0, limit);
    }

    return db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt)).limit(limit);
}

export async function updateAccessRequestStatus(input: AccessRequestStatusUpdateInput) {
    const db = await getDb();
    const now = new Date();

    if (!db) {
        const target = memoryAccessRequests.find(item => item.id === input.accessRequestId);
        if (!target) {
            return null;
        }

        target.status = input.status;
        target.updatedAt = now;

        await recordActivity({
            userId: input.adminUserId,
            actorType: "admin",
            action: "access_request_updated",
            entityType: "access_request",
            entityId: target.id,
            metadata: {
                status: target.status,
                organizationName: target.organizationName,
            },
        });

        await createAdminNotification({
            category: "registration",
            title: `Access request ${target.id} updated`,
            content: `Status set to ${target.status} for ${target.organizationName}.`,
            entityType: "access_request",
            entityId: target.id,
        });

        return target;
    }

    await db
        .update(accessRequests)
        .set({
            status: input.status,
            updatedAt: now,
        })
        .where(eq(accessRequests.id, input.accessRequestId));

    const record = await loadAccessRequestById(input.accessRequestId);
    if (!record) {
        return null;
    }

    await recordActivity({
        userId: input.adminUserId,
        actorType: "admin",
        action: "access_request_updated",
        entityType: "access_request",
        entityId: record.id,
        metadata: {
            status: record.status,
            organizationName: record.organizationName,
        },
    });

    await createAdminNotification({
        category: "registration",
        title: `Access request ${record.id} updated`,
        content: `Status set to ${record.status} for ${record.organizationName}.`,
        entityType: "access_request",
        entityId: record.id,
    });

    return record;
}

export async function listConsultationRequests(limit = 50) {
    const db = await getDb();
    if (!db) {
        return memoryConsultationRequests.slice(0, limit);
    }

    return db
        .select()
        .from(consultationRequests)
        .orderBy(desc(consultationRequests.createdAt))
        .limit(limit);
}

export async function listAdminNotifications(limit = 50) {
    const db = await getDb();
    if (!db) {
        return memoryAdminNotifications.slice(0, limit);
    }

    return db
        .select()
        .from(adminNotifications)
        .orderBy(desc(adminNotifications.createdAt))
        .limit(limit);
}

export async function markAdminNotificationRead(notificationIdValue: number) {
    const db = await getDb();
    const now = new Date();
    if (!db) {
        const target = memoryAdminNotifications.find(item => item.id === notificationIdValue);
        if (!target) {
            return null;
        }

        target.isRead = 1;
        target.readAt = now;
        return target;
    }

    await db
        .update(adminNotifications)
        .set({
            isRead: 1,
            readAt: now,
        })
        .where(eq(adminNotifications.id, notificationIdValue));

    const rows = await db
        .select()
        .from(adminNotifications)
        .where(eq(adminNotifications.id, notificationIdValue))
        .limit(1);
    return rows[0] ?? null;
}

export async function respondToConsultationRequest(input: ConsultationResponseInput) {
    const db = await getDb();
    const now = new Date();
    if (!db) {
        const target = memoryConsultationRequests.find(item => item.id === input.consultationId);
        if (!target) {
            return null;
        }

        target.status = input.status;
        target.priority = input.priority ?? target.priority;
        target.adminResponse = input.adminResponse.trim();
        target.assignedAdminUserId = input.adminUserId;
        target.respondedAt = now;
        target.updatedAt = now;

        await recordActivity({
            userId: input.adminUserId,
            actorType: "admin",
            action: "consultation_request_updated",
            entityType: "consultation_request",
            entityId: target.id,
            metadata: {
                status: target.status,
                priority: target.priority,
            },
        });

        await createAdminNotification({
            category: "support",
            title: `Consultation ${target.id} updated`,
            content: `Admin response added for ${target.organizationName}.`,
            entityType: "consultation_request",
            entityId: target.id,
        });

        return target;
    }

    await db
        .update(consultationRequests)
        .set({
            status: input.status,
            priority: input.priority ?? "medium",
            adminResponse: input.adminResponse.trim(),
            assignedAdminUserId: input.adminUserId,
            respondedAt: now,
            updatedAt: now,
        })
        .where(eq(consultationRequests.id, input.consultationId));

    const record = await loadConsultationRequestById(input.consultationId);
    if (!record) {
        return null;
    }

    await recordActivity({
        userId: input.adminUserId,
        actorType: "admin",
        action: "consultation_request_updated",
        entityType: "consultation_request",
        entityId: record.id,
        metadata: {
            status: record.status,
            priority: record.priority,
        },
    });

    await createAdminNotification({
        category: "support",
        title: `Consultation ${record.id} updated`,
        content: `Admin response added for ${record.organizationName}.`,
        entityType: "consultation_request",
        entityId: record.id,
    });

    return record;
}

export async function saveUserProfile(userId: number, input: UpdateUserProfileInput) {
    const profile = await updateUserProfile(userId, input);
    if (!profile) {
        return null;
    }

    await recordActivity({
        userId,
        actorType: hasMinRole(profile.role, "admin") ? "admin" : "client",
        action: "profile_updated",
        entityType: "user",
        entityId: profile.id,
        metadata: {
            organizationName: profile.organizationName,
            preferredLocale: profile.preferredLocale,
        },
    });

    return profile;
}

export async function updateUserAccess(input: UserAccessUpdateInput) {
    const db = await getDb();
    const now = new Date();
    if (!db) {
        const target = await getUserById(input.userId);
        if (!target) {
            return null;
        }

        return {
            ...target,
            role: input.role ?? target.role,
            status: input.status ?? target.status,
            updatedAt: now,
            lastActivityAt: now,
        };
    }

    const updateSet: Record<string, unknown> = {
        lastActivityAt: now,
    };
    if (input.role) {
        updateSet.role = input.role;
    }
    if (input.status) {
        updateSet.status = input.status;
    }

    await db.update(users).set(updateSet).where(eq(users.id, input.userId));
    return getUserById(input.userId);
}

async function listRecentFrameworks() {
    const db = await getDb();
    if (!db) {
        return [] as Framework[];
    }

    return db.select().from(frameworks);
}

export async function listAssessmentSummaries(limit = 50) {
    const db = await getDb();
    if (!db) {
        return [] as Array<{
            id: number;
            vendorId: number;
            vendorName: string;
            frameworkCode: string;
            frameworkName: string;
            complianceScore: number | null;
            riskLevel: string | null;
            status: string | null;
            assessmentDate: Date;
            gapCount: number;
            criticalGapCount: number;
        }>;
    }

    const rows = await db
        .select()
        .from(vendorAssessments)
        .orderBy(desc(vendorAssessments.assessmentDate), desc(vendorAssessments.id))
        .limit(limit);

    const vendors = await listAllVendorProfiles(Math.max(limit * 4, 100));
    const vendorMap = new Map(vendors.map(vendor => [vendor.id, vendor]));
    const frameworkRows = await listRecentFrameworks();
    const frameworkMap = new Map(frameworkRows.map(row => [row.id, row]));
    const assessmentIds = rows.map(row => row.id);
    const gapRows = assessmentIds.length === 0
        ? []
        : await db.select().from(assessmentGaps).where(inArray(assessmentGaps.assessmentId, assessmentIds));

    return rows.map(row => {
        const vendor = vendorMap.get(row.vendorId);
        const framework = frameworkMap.get(row.frameworkId);
        const relatedGaps = gapRows.filter(gap => gap.assessmentId === row.id);
        const criticalGapCount = relatedGaps.filter(gap => gap.severity === "critical").length;

        return {
            id: row.id,
            vendorId: row.vendorId,
            vendorName: vendor?.vendorName ?? `Vendor ${row.vendorId}`,
            frameworkCode: framework?.code ?? `FW-${row.frameworkId}`,
            frameworkName: framework?.name ?? `Framework ${row.frameworkId}`,
            complianceScore: row.complianceScore ?? null,
            riskLevel: row.riskLevel ?? null,
            status: row.status ?? null,
            assessmentDate: row.assessmentDate,
            gapCount: relatedGaps.length,
            criticalGapCount,
        };
    });
}

export async function listAdminVendorSummaries(limit = 100) {
    const vendors = await listAllVendorProfiles(limit);
    const techRows = await listTechStackComponentsByVendorIds(vendors.map(vendor => vendor.id));
    const userRows = await listUsersForAdmin(limit * 2);
    const userMap = new Map(userRows.map(user => [user.id, user]));

    return vendors.map(vendor => {
        const owner = userMap.get(vendor.userId);
        const components = techRows.filter(component => component.vendorId === vendor.id);

        return {
            id: vendor.id,
            vendorName: vendor.vendorName,
            ownerName: owner?.name ?? "Unknown user",
            ownerOrganization: owner?.organizationName ?? owner?.email ?? "-",
            riskTier: vendor.riskTier ?? "-",
            criticalityLevel: vendor.criticalityLevel ?? "-",
            operatingCountries: parseVendorMultiValue(vendor.operatingCountries),
            dataLocations: parseVendorMultiValue(vendor.dataLocations),
            techStackCount: components.length,
            createdAt: vendor.createdAt,
        };
    });
}

export async function listActivityFeed(limit = 50) {
    const db = await getDb();
    const rows = !db
        ? memoryActivityEvents.slice(0, limit)
        : await db.select().from(activityEvents).orderBy(desc(activityEvents.createdAt)).limit(limit);

    const userRows = await listUsersForAdmin(limit * 2);
    const userMap = new Map(userRows.map(user => [user.id, user]));

    return rows.map(row => {
        const actor = row.userId != null ? userMap.get(row.userId) : null;
        const metadata = fromJsonText<Record<string, unknown>>(row.metadata);

        return {
            id: row.id,
            actorType: row.actorType,
            actorName:
                actor?.name ??
                (row.actorType === "visitor"
                    ? "Visitor"
                    : row.actorType === "system"
                        ? "System"
                        : "Unknown user"),
            actorOrganization: actor?.organizationName ?? actor?.email ?? null,
            action: row.action,
            entityType: row.entityType,
            entityId: row.entityId ?? null,
            metadata,
            createdAt: row.createdAt,
        };
    });
}

async function listUserInteractionRows(limit = 2000) {
    const db = await getDb();
    if (!db) {
        return [] as Array<{ context: string; action: string; createdAt: Date }>;
    }

    const rows = await db
        .select({
            context: userInteractionLogs.context,
            action: userInteractionLogs.action,
            createdAt: userInteractionLogs.createdAt,
        })
        .from(userInteractionLogs)
        .orderBy(desc(userInteractionLogs.createdAt))
        .limit(limit);

    return rows;
}

function getRetentionCutoff(retentionDays: number): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);
    return cutoff;
}

export async function getInteractionPrivacyStats(retentionDays = 90): Promise<InteractionPrivacyStats> {
    const db = await getDb();
    const cutoff = getRetentionCutoff(retentionDays);

    if (!db) {
        return {
            retentionDays,
            cutoffIso: cutoff.toISOString(),
            totalLogs: 0,
            logsOlderThanRetention: 0,
        };
    }

    const [totals] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userInteractionLogs);

    const [expired] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userInteractionLogs)
        .where(lt(userInteractionLogs.createdAt, cutoff));

    return {
        retentionDays,
        cutoffIso: cutoff.toISOString(),
        totalLogs: Number(totals?.count ?? 0),
        logsOlderThanRetention: Number(expired?.count ?? 0),
    };
}

export async function enforceInteractionRetention(retentionDays = 90, dryRun = true, actorUserId?: number | null): Promise<InteractionRetentionRunResult> {
    const stats = await getInteractionPrivacyStats(retentionDays);
    const db = await getDb();

    if (!db || dryRun || stats.logsOlderThanRetention === 0) {
        return {
            ...stats,
            dryRun,
            deletedLogs: 0,
        };
    }

    const cutoff = getRetentionCutoff(retentionDays);
    await db.delete(userInteractionLogs).where(lt(userInteractionLogs.createdAt, cutoff));

    void recordActivity({
        userId: actorUserId ?? null,
        actorType: actorUserId ? "admin" : "system",
        action: "interaction_retention_enforced",
        entityType: "userInteractionLogs",
        entityId: null,
        metadata: {
            purgedCount: stats.logsOlderThanRetention,
            retentionDays,
            executedAt: new Date().toISOString(),
        },
    }).catch(() => undefined);

    return {
        ...stats,
        dryRun: false,
        deletedLogs: stats.logsOlderThanRetention,
    };
}

export async function deleteInteractionLogsBySubject(input: {
    userId?: number;
    organizationId?: number;
    actorUserId?: number | null;
}): Promise<InteractionDeleteResult> {
    const db = await getDb();
    const userId = input.userId ?? null;
    const organizationId = input.organizationId ?? null;

    if (!userId && !organizationId) {
        return {
            deletedLogs: 0,
            userId,
            organizationId,
        };
    }

    if (!db) {
        return {
            deletedLogs: 0,
            userId,
            organizationId,
        };
    }

    const whereClause = userId && organizationId
        ? and(eq(userInteractionLogs.userId, userId), eq(userInteractionLogs.organizationId, organizationId))
        : userId
            ? eq(userInteractionLogs.userId, userId)
            : eq(userInteractionLogs.organizationId, organizationId!);

    const [countRow] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userInteractionLogs)
        .where(whereClause);

    const deletedLogs = Number(countRow?.count ?? 0);
    if (deletedLogs > 0) {
        await db.delete(userInteractionLogs).where(whereClause);
    }

    void recordActivity({
        userId: input.actorUserId ?? null,
        actorType: input.actorUserId ? "admin" : "system",
        action: "interaction_data_deleted",
        entityType: "userInteractionLogs",
        entityId: null,
        metadata: {
            targetUserId: userId,
            targetOrgId: organizationId,
            deletedCount: deletedLogs,
        },
    }).catch(() => undefined);

    return {
        deletedLogs,
        userId,
        organizationId,
    };
}

function normalizeHeatmapLabel(value: string, maxLength = 26): string {
    const normalized = value
        .trim()
        .replace(/[_.-]+/g, " ")
        .replace(/\s+/g, " ");

    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 1)}…`;
}

function buildInteractionHeatmap(
    rows: Array<{ context: string; action: string; createdAt: Date }>,
    windowDays = 14,
): AdminInteractionHeatmap {
    const now = Date.now();
    const cutoff = now - windowDays * 86_400_000;
    const inWindow = rows.filter(row => row.createdAt.getTime() >= cutoff);

    if (inWindow.length === 0) {
        return {
            contexts: [],
            actions: [],
            cells: [],
            maxCellValue: 0,
            totalEvents: 0,
            windowDays,
        };
    }

    const pairCounts = new Map<string, number>();
    const contextCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();

    for (const row of inWindow) {
        const context = normalizeHeatmapLabel(row.context);
        const action = normalizeHeatmapLabel(row.action);
        const pairKey = `${context}::${action}`;

        pairCounts.set(pairKey, (pairCounts.get(pairKey) ?? 0) + 1);
        contextCounts.set(context, (contextCounts.get(context) ?? 0) + 1);
        actionCounts.set(action, (actionCounts.get(action) ?? 0) + 1);
    }

    const contexts = Array.from(contextCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([context]) => context);

    const actions = Array.from(actionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([action]) => action);

    const contextSet = new Set(contexts);
    const actionSet = new Set(actions);
    const cells: AdminInteractionHeatmap["cells"] = [];
    let maxCellValue = 0;

    pairCounts.forEach((value, key) => {
        const [context, action] = key.split("::");
        if (!contextSet.has(context) || !actionSet.has(action)) {
            return;
        }
        cells.push({ context, action, value });
        if (value > maxCellValue) {
            maxCellValue = value;
        }
    });

    return {
        contexts,
        actions,
        cells,
        maxCellValue,
        totalEvents: inWindow.length,
        windowDays,
    };
}

export async function getAdminInteractionHeatmap(windowDays = 14, limit = 2000): Promise<AdminInteractionHeatmap> {
    const rows = await listUserInteractionRows(limit);
    return buildInteractionHeatmap(rows, windowDays);
}

export async function listConsultationSummaries(limit = 50) {
    const rows = await listConsultationRequests(limit);
    const userRows = await listUsersForAdmin(limit * 2);
    const userMap = new Map(userRows.map(user => [user.id, user]));

    return rows.map(row => ({
        id: row.id,
        contactName: row.contactName,
        contactEmail: row.contactEmail,
        organizationName: row.organizationName,
        topic: row.topic,
        jurisdictions: fromJsonText<string[]>(row.jurisdictions) ?? [],
        summary: row.summary,
        vendorName: row.vendorName,
        techStackSummary: row.techStackSummary,
        status: row.status,
        priority: row.priority,
        assignedAdminName:
            row.assignedAdminUserId != null ? userMap.get(row.assignedAdminUserId)?.name ?? null : null,
        adminResponse: row.adminResponse,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    }));
}

function buildActivitySeries(activityRows: Awaited<ReturnType<typeof listActivityFeed>>) {
    const labels = Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        return date.toISOString().slice(0, 10);
    });

    const counts = new Map(labels.map(label => [label, 0]));
    for (const row of activityRows) {
        const key = row.createdAt.toISOString().slice(0, 10);
        if (counts.has(key)) {
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
    }

    return labels.map(label => ({
        day: label.slice(5),
        value: counts.get(label) ?? 0,
    }));
}

function buildRegionCoverage(
    vendorRows: Awaited<ReturnType<typeof listAdminVendorSummaries>>,
    assessmentRows: Awaited<ReturnType<typeof listAssessmentSummaries>>
) {
    const trackedRegions = ["China", "Saudi Arabia"];
    const coverage = trackedRegions.map(region => ({
        region,
        vendors: 0,
        assessments: 0,
        criticalGaps: 0,
    }));

    for (const vendor of vendorRows) {
        for (const region of trackedRegions) {
            const touchesRegion = vendor.operatingCountries.includes(region) || vendor.dataLocations.includes(region);
            if (!touchesRegion) {
                continue;
            }

            const target = coverage.find(item => item.region === region);
            if (target) {
                target.vendors += 1;
            }
        }
    }

    for (const assessment of assessmentRows) {
        const vendor = vendorRows.find(item => item.id === assessment.vendorId);
        if (!vendor) {
            continue;
        }

        for (const region of trackedRegions) {
            const touchesRegion = vendor.operatingCountries.includes(region) || vendor.dataLocations.includes(region);
            if (!touchesRegion) {
                continue;
            }

            const target = coverage.find(item => item.region === region);
            if (target) {
                target.assessments += 1;
                target.criticalGaps += assessment.criticalGapCount;
            }
        }
    }

    return coverage;
}

function buildCorridorFlows(vendorRows: Awaited<ReturnType<typeof listAdminVendorSummaries>>) {
    const flowWeight = vendorRows.filter(vendor => {
        const regions = new Set([...vendor.operatingCountries, ...vendor.dataLocations]);
        return regions.has("China") && regions.has("Saudi Arabia");
    }).length;

    return flowWeight > 0
        ? [
            { source: "China", target: "Saudi Arabia", weight: flowWeight },
            { source: "Saudi Arabia", target: "China", weight: flowWeight },
        ]
        : [];
}

export async function getAdminOverview(): Promise<AdminOverview> {
    const [
        userRows,
        accessRows,
        consultationRows,
        notificationRows,
        vendorRows,
        assessmentRows,
        activityRows,
        interactionRows,
    ] = await Promise.all([
        listUsersForAdmin(250),
        listAccessRequests(100),
        listConsultationSummaries(100),
        listAdminNotifications(20),
        listAdminVendorSummaries(200),
        listAssessmentSummaries(200),
        listActivityFeed(40),
        listUserInteractionRows(2000),
    ]);

    const riskLevels = ["critical", "high", "medium", "low"] as const;
    const riskDistribution = riskLevels.map(level => ({
        label: level,
        value: assessmentRows.filter(row => row.riskLevel === level).length,
    }));

    return {
        totals: {
            registeredClients: userRows.filter(user => user.role === "user").length,
            adminUsers: userRows.filter(user => hasMinRole(user.role, "admin")).length,
            openAccessRequests: accessRows.filter(row => row.status !== "approved" && row.status !== "archived").length,
            openConsultations: consultationRows.filter(row => row.status !== "closed").length,
            vendors: vendorRows.length,
            assessments: assessmentRows.length,
            criticalGaps: assessmentRows.reduce((total, row) => total + row.criticalGapCount, 0),
            unreadNotifications: notificationRows.filter(row => !row.isRead && !row.readAt).length,
        },
        activitySeries: buildActivitySeries(activityRows),
        riskDistribution,
        regionCoverage: buildRegionCoverage(vendorRows, assessmentRows),
        corridorFlows: buildCorridorFlows(vendorRows),
        usageHeatmap: buildInteractionHeatmap(interactionRows, 14),
        recentActivity: activityRows.slice(0, 12),
        recentAssessments: assessmentRows.slice(0, 8),
        recentConsultations: consultationRows.slice(0, 8),
        notificationHighlights: notificationRows.slice(0, 8),
    };
}
