/**
 * audit-logger.ts — Centralised audit-log writer for the DJAC platform.
 *
 * All security-relevant events (auth, data changes, role updates, billing,
 * system lifecycle) should be recorded here. The audit log is immutable from
 * the application layer (no UPDATE / DELETE exposed through tRPC).
 */
import { createHash } from "node:crypto";
import { auditLogs, type InsertAuditLog } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { broadcastSSE } from "./services/sse-bus";

type AuditCategory = InsertAuditLog["category"];
type AuditOutcome = InsertAuditLog["outcome"];

type AuditEventInput = {
    category: AuditCategory;
    action: string;
    entityType?: string;
    entityId?: number | null;
    targetEntity?: string;
    outcome?: AuditOutcome;
    payload?: unknown;
    localUserId?: number | null;
};

/** Sanitize and truncate a payload to safe storage text */
function sanitizePayload(value: unknown): string | null {
    if (value == null) return null;
    try {
        return JSON.stringify(value, (key, val) => {
            if (/(password|secret|token|auth|cookie|api[_-]?key)/i.test(key)) return "[redacted]";
            if (typeof val === "string" && val.length > 500) return val.slice(0, 500) + "…";
            return val;
        });
    } catch {
        return null;
    }
}

function getClientIp(ctx: TrpcContext): string {
    const forwarded = ctx.req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return forwarded.split(",")[0]?.trim() || "unknown";
    }
    return ctx.req.socket?.remoteAddress || "unknown";
}

function hashIp(ip: string): string {
    const salt = ENV.cookieSecret || "djac-audit-salt";
    return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function getHashedIpFromHeaders(headers: Record<string, string | string[] | undefined>): string | null {
    const forwarded = headers["x-forwarded-for"];
    const first = typeof forwarded === "string"
        ? forwarded.split(",")[0]?.trim()
        : Array.isArray(forwarded)
            ? forwarded[0]?.trim()
            : null;
    if (!first) return null;
    return hashIp(first);
}

/**
 * Record a platform audit event.
 * Silently swallows DB errors — audit logging must never break the main flow.
 */
export async function recordAuditEvent(
    ctx: TrpcContext,
    input: AuditEventInput
): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
        const userAgent = ctx.req.headers["user-agent"]?.toString().slice(0, 512) ?? null;
        const ipHash = hashIp(getClientIp(ctx));

        await db.insert(auditLogs).values({
            userId: ctx.user?.id ?? null,
            localUserId: input.localUserId ?? null,
            organizationId: ctx.organizationId ?? null,
            actorRole: ctx.user?.role ?? null,
            category: input.category,
            action: input.action.slice(0, 120),
            entityType: input.entityType?.slice(0, 120) ?? null,
            entityId: input.entityId ?? null,
            targetEntity: input.targetEntity?.slice(0, 255) ?? null,
            outcome: input.outcome ?? "success",
            payload: sanitizePayload(input.payload),
            ipHash,
            userAgent,
        });

        // Broadcast real-time to the owner portal for all tracked categories
        const BROADCAST_CATEGORIES: AuditCategory[] = ["auth", "billing", "system", "data_write", "data_read", "role_change"];
        if (BROADCAST_CATEGORIES.includes(input.category)) {
            broadcastSSE("platform_event", {
                category: input.category,
                action: input.action,
                entityType: input.entityType ?? null,
                entityId: input.entityId ?? null,
                outcome: input.outcome ?? "success",
                actorRole: ctx.user?.role ?? "anonymous",
                organizationId: ctx.organizationId ?? null,
                ts: new Date().toISOString(),
            });
        }
    } catch (err) {
        console.warn("[AuditLog] Failed to persist audit event:", err);
    }
}

/**
 * Record a system-level (non-request) audit event.
 * Used by the AI orchestrator, billing webhooks, and background jobs.
 */
export async function recordSystemAuditEvent(input: {
    category: AuditCategory;
    action: string;
    entityType?: string;
    entityId?: number | null;
    targetEntity?: string;
    outcome?: AuditOutcome;
    payload?: unknown;
    organizationId?: number | null;
    actorRole?: string;
}): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
        await db.insert(auditLogs).values({
            userId: null,
            localUserId: null,
            organizationId: input.organizationId ?? null,
            actorRole: input.actorRole ?? "system",
            category: input.category,
            action: input.action.slice(0, 120),
            entityType: input.entityType?.slice(0, 120) ?? null,
            entityId: input.entityId ?? null,
            targetEntity: input.targetEntity?.slice(0, 255) ?? null,
            outcome: input.outcome ?? "success",
            payload: sanitizePayload(input.payload),
            ipHash: null,
            userAgent: null,
        });
    } catch (err) {
        console.warn("[AuditLog] Failed to persist system audit event:", err);
    }
}

export async function recordTrpcFailureEvent(input: {
    ctx?: TrpcContext;
    path?: string;
    type?: string;
    code: string;
    message: string;
    procedureInput?: unknown;
    issues?: unknown;
    headers?: Record<string, string | string[] | undefined>;
}): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
        const localUserId = (input.ctx?.user as { localUserId?: number } | null | undefined)?.localUserId ?? null;
        const userId = input.ctx?.user && input.ctx.user.id > 0 ? input.ctx.user.id : null;
        const outcome = ["BAD_REQUEST", "PARSE_ERROR", "UNAUTHORIZED", "FORBIDDEN", "PRECONDITION_FAILED"].includes(input.code)
            ? "blocked"
            : "failure";

        await db.insert(auditLogs).values({
            userId,
            localUserId,
            organizationId: input.ctx?.organizationId ?? null,
            actorRole: input.ctx?.user?.role ?? "anonymous",
            category: "system",
            action: input.code === "BAD_REQUEST" || input.code === "PARSE_ERROR"
                ? "trpc.validation_failed"
                : "trpc.request_failed",
            entityType: "trpc",
            entityId: null,
            targetEntity: (input.path ?? input.type ?? "unknown").slice(0, 255),
            outcome,
            payload: sanitizePayload({
                code: input.code,
                message: input.message,
                input: input.procedureInput,
                issues: input.issues,
            }),
            ipHash: input.ctx ? hashIp(getClientIp(input.ctx)) : getHashedIpFromHeaders(input.headers ?? {}),
            userAgent: input.ctx?.req.headers["user-agent"]?.toString().slice(0, 512)
                ?? input.headers?.["user-agent"]?.toString().slice(0, 512)
                ?? null,
        });

        broadcastSSE("validation_event", {
            code: input.code,
            action: input.code === "BAD_REQUEST" || input.code === "PARSE_ERROR"
                ? "trpc.validation_failed"
                : "trpc.request_failed",
            target: (input.path ?? input.type ?? "unknown").slice(0, 255),
            outcome,
            actorRole: input.ctx?.user?.role ?? "anonymous",
            ts: new Date().toISOString(),
        });
    } catch (err) {
        console.warn("[AuditLog] Failed to persist tRPC failure event:", err);
    }
}
