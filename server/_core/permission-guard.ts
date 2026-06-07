import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import { getEffectivePermissionsFromCtx } from "../rbac";
import { recordAuditEvent } from "../audit-logger";
import type { ModuleSlug } from "../../shared/const";

export type PermissionAction = "canView" | "canCreate" | "canEdit" | "canDelete" | "canExport" | "canInvite";

export async function requireModulePermission(
    ctx: TrpcContext,
    module: ModuleSlug,
    action: PermissionAction,
): Promise<void> {
    const perms = await getEffectivePermissionsFromCtx(ctx, module);
    if (perms[action]) {
        return;
    }

    void recordAuditEvent(ctx, {
        category: "role_change",
        action: "permission_denied",
        entityType: "rbac",
        targetEntity: `${module}:${action}`,
        outcome: "blocked",
        payload: {
            module,
            action,
            orgRole: ctx.organizationRole ?? null,
            isOverride: perms.isOverride,
        },
    });

    throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions for ${module} (${action}).`,
    });
}

export async function requireModulePermissionIfOrgContext(
    ctx: TrpcContext,
    module: ModuleSlug,
    action: PermissionAction,
): Promise<void> {
    if (ctx.organizationId == null) {
        return;
    }
    await requireModulePermission(ctx, module, action);
}
