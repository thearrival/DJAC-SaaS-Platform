import { createHash } from "node:crypto";
import { userInteractionLogs } from "../drizzle/schema";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";
import { broadcastSSE } from "./services/sse-bus";

type JsonLike = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

type InteractionLogInput = {
    context: string;
    action: string;
    entityType?: string;
    entityId?: number | null;
    inputSnapshot?: JsonLike;
    outputRef?: JsonLike;
    durationMs?: number;
};

const SENSITIVE_KEY_REGEX = /(password|secret|token|authorization|cookie|api[_-]?key|access[_-]?key|private[_-]?key)/i;

function sanitizeForStorage(value: unknown, depth = 0): unknown {
    if (depth > 5) return "[truncated-depth]";
    if (value == null) return null;
    if (typeof value === "string") return value.length > 2000 ? `${value.slice(0, 2000)}...[truncated]` : value;
    if (typeof value === "number" || typeof value === "boolean") return value;

    if (Array.isArray(value)) {
        return value.slice(0, 50).map(item => sanitizeForStorage(item, depth + 1));
    }

    if (typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>).slice(0, 80);
        const next: Record<string, unknown> = {};
        for (const [k, v] of entries) {
            if (SENSITIVE_KEY_REGEX.test(k)) {
                next[k] = "[redacted]";
            } else {
                next[k] = sanitizeForStorage(v, depth + 1);
            }
        }
        return next;
    }

    return String(value);
}

function toJsonText(value: unknown): string | null {
    if (value == null) return null;
    try {
        return JSON.stringify(sanitizeForStorage(value));
    } catch {
        return null;
    }
}

function getClientIp(ctx: TrpcContext): string {
    const forwarded = ctx.req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.trim()) {
        return forwarded.split(",")[0]?.trim() || "unknown";
    }
    const raw = ctx.req.socket?.remoteAddress;
    return raw || "unknown";
}

function hashIp(ip: string): string {
    const salt = ENV.cookieSecret || "djac-ip-hash-salt";
    return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function recordUserInteraction(ctx: TrpcContext, input: InteractionLogInput): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const localUserId = (ctx.user as { localUserId?: number } | null)?.localUserId ?? null;
    const userId = ctx.user && ctx.user.id > 0 ? ctx.user.id : null;
    const organizationId = ctx.organizationId && (ctx.organizationId as number) > 0
        ? ctx.organizationId
        : null;

    try {
        await db.insert(userInteractionLogs).values({
            organizationId,
            userId,
            localUserId,
            sessionId: null,
            context: input.context.slice(0, 120),
            action: input.action.slice(0, 120),
            entityType: input.entityType?.slice(0, 120) ?? null,
            entityId: input.entityId ?? null,
            inputSnapshot: toJsonText(input.inputSnapshot),
            outputRef: toJsonText(input.outputRef),
            durationMs: input.durationMs ?? null,
            ipHash: hashIp(getClientIp(ctx)),
            userAgent: ctx.req.headers["user-agent"]?.toString().slice(0, 512) ?? null,
        });

        broadcastSSE("interaction_logged", {
            context: input.context.slice(0, 120),
            action: input.action.slice(0, 120),
            entityType: input.entityType?.slice(0, 120) ?? null,
            entityId: input.entityId ?? null,
            organizationId,
            actorType: ctx.user ? "authenticated" : "anonymous",
            ts: new Date().toISOString(),
        });
    } catch (error) {
        console.warn("[InteractionLog] Failed to persist interaction", error);
    }
}
