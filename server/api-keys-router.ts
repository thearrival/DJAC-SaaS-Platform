/**
 * API Keys Router — programmatic access token management.
 *
 * Procedures:
 *   apiKeys.list     — list all keys for current org (hashes never returned)
 *   apiKeys.create   — generate a new key; raw value returned ONCE
 *   apiKeys.revoke   — soft-delete a key by id
 *
 * Key format:  djac_<32 random hex chars>
 * Stored as:   SHA-256(raw) in keyHash column; first 8 chars as keyPrefix
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { activeOrgProcedure, orgAdminProcedure, router } from "./_core/trpc";
import { recordAuditEvent } from "./audit-logger";
import { requireModulePermission } from "./_core/permission-guard";
import { listApiKeys, createApiKey, revokeApiKey } from "./api-keys-store";

export const apiKeysRouter = router({
    /**
     * List all active (non-revoked) API keys for the org.
     * Raw key is never returned — only id, name, prefix, scopes, dates.
     */
    list: activeOrgProcedure.query(async ({ ctx }) => {
        await requireModulePermission(ctx, "api_keys", "canView");
        return listApiKeys(ctx.organizationId as number);
    }),

    /**
     * Create a new API key. Returns the raw key ONCE — not stored.
     * Only org admins can create keys.
     */
    create: orgAdminProcedure
        .input(
            z.object({
                name: z.string().trim().min(2, "API key name must be at least 2 characters").max(120),
                scopes: z
                    .array(
                        z.enum([
                            "vendor:read",
                            "vendor:write",
                            "report:read",
                            "report:write",
                            "assessment:read",
                            "assessment:write",
                            "compliance:read",
                            "admin:read",
                        ]),
                    )
                    .min(1)
                    .max(8),
                expiresInDays: z.number().int().min(1).max(365).optional(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "api_keys", "canCreate");
            const orgId = ctx.organizationId as number;
            const expiresAt = input.expiresInDays
                ? new Date(Date.now() + input.expiresInDays * 86_400_000)
                : null;
            const scopesJson = JSON.stringify(input.scopes);
            const result = await createApiKey(orgId, ctx.user?.id ?? null, input.name, scopesJson, expiresAt);
            void recordAuditEvent(ctx, {
                category: "auth",
                action: "api_key.create",
                entityType: "apiKeys",
                entityId: result.id,
                payload: { name: input.name, scopes: input.scopes },
            });
            return result;
        }),

    /**
     * Revoke an API key by id. Only org admins can revoke.
     */
    revoke: orgAdminProcedure
        .input(z.number().int().positive())
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "api_keys", "canDelete");
            const orgId = ctx.organizationId as number;
            const found = await revokeApiKey(orgId, input);
            if (!found) throw new TRPCError({ code: "NOT_FOUND" });
            void recordAuditEvent(ctx, {
                category: "auth",
                action: "api_key.revoke",
                entityType: "apiKeys",
                entityId: input,
                payload: {},
            });
            return { success: true };
        }),
});
