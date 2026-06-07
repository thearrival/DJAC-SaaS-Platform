import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG, NOT_PLATFORM_ADMIN_ERR_MSG, NOT_SUPER_ADMIN_ERR_MSG, NOT_COMPANY_ADMIN_ERR_MSG, hasMinRole } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { organizations, userOnboarding } from "../../drizzle/schema";
import { eq, or } from "drizzle-orm";
import { getDb } from "../db";
import { isTrialExpired } from "../services/billing-entitlements";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const requireOrganization = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (ctx.organizationId == null) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No organization is associated with this account yet.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user!,
      organizationId: ctx.organizationId,
      organizationRole: ctx.organizationRole,
    },
  });
});

export const orgProcedure = protectedProcedure.use(requireOrganization);

const requireOrgAdmin = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (ctx.organizationId == null) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No organization is associated with this account yet.",
    });
  }

  if (!ctx.organizationRole || !["owner", "admin"].includes(ctx.organizationRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Organization admin access required.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user!,
      organizationId: ctx.organizationId,
      organizationRole: ctx.organizationRole,
    },
  });
});

export const orgAdminProcedure = protectedProcedure.use(requireOrgAdmin);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // Use hasMinRole so super_admin, platform_admin, yalla_hack_employee
    // all pass — not just the literal "admin" role alias.
    if (!ctx.user || !hasMinRole(ctx.user.role, "admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/** orgProcedure + trial/access enforcement: throws FORBIDDEN when trial has expired */
const requireActiveAccess = t.middleware(async opts => {
  const { ctx, next } = opts;

  // Super admins, platform admins, and Yalla-Hack employees are never subject to trial limits
  if (ctx.user?.role && hasMinRole(ctx.user.role, "platform_admin")) {
    return next({ ctx: { ...ctx, user: ctx.user! } });
  }

  if (ctx.organizationId != null) {
    const db = await getDb();
    if (db) {
      const [org] = await db
        .select({ plan: organizations.plan, trialEndsAt: organizations.trialEndsAt, isActive: organizations.isActive })
        .from(organizations)
        .where(eq(organizations.id, ctx.organizationId));

      if (org && isTrialExpired(org)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "trial_expired",
        });
      }
    }
  }

  return next({ ctx: { ...ctx, user: ctx.user! } });
});

/** orgProcedure that also blocks expired free-trial accounts */
export const activeOrgProcedure = orgProcedure.use(requireActiveAccess);

// ─── Role-Scoped Procedures ─────────────────────────────────────────────────

/**
 * Allowed for Company Admin and above (company_admin, platform_admin,
 * yalla_hack_employee, super_admin, admin).
 * Typical use: manage organisation users, view org-wide compliance posture.
 */
export const companyAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!hasMinRole(ctx.user.role, "company_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_COMPANY_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/**
 * Allowed for Platform Admin and above (platform_admin, yalla_hack_employee,
 * super_admin, admin).
 * Typical use: cross-org oversight, user management, read-only compliance data.
 */
export const platformAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!hasMinRole(ctx.user.role, "platform_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_PLATFORM_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/**
 * Restricted to Yalla Hack Employees (yalla_hack_employee, super_admin).
 * Typical use: internal diagnostic tools, support features.
 */
export const yallaHackProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!hasMinRole(ctx.user.role, "yalla_hack_employee")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_PLATFORM_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

/**
 * Super Admin only — full platform visibility including audit logs,
 * SaaS metrics, and system health.
 */
export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }
    if (!hasMinRole(ctx.user.role, "super_admin")) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_SUPER_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);

// ─── Organisation Role–Scoped Procedures ─────────────────────────────────────

/**
 * Requires the caller to hold at minimum the `compliance_officer` org role
 * (owner, admin, or compliance_officer).  Analysts are excluded.
 */
const requireComplianceOfficer = t.middleware(async opts => {
  const { ctx, next } = opts;
  const allowed = ["owner", "admin", "compliance_officer"] as const;
  if (!ctx.organizationRole || !(allowed as readonly string[]).includes(ctx.organizationRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Compliance officer access required (10006).",
    });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user!,
      organizationId: ctx.organizationId!,
      organizationRole: ctx.organizationRole,
    },
  });
});

/** orgProcedure restricted to compliance officers, admins, and owners */
export const complianceOfficerProcedure = orgProcedure.use(requireComplianceOfficer);

/**
 * Requires the caller to have completed the onboarding wizard
 * (userOnboarding.stage = 'completed').  Falls through for users who have an
 * active organisation but no onboarding row (legacy / imported accounts).
 */
const requireOnboardingComplete = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Platform admins and above bypass the onboarding gate
  if (hasMinRole(ctx.user.role, "platform_admin")) {
    return next({ ctx: { ...ctx, user: ctx.user } });
  }

  const db = await getDb();
  if (db) {
    const localUserId = (ctx.user as { localUserId?: number }).localUserId ?? null;
    const conditions = [eq(userOnboarding.userId, ctx.user.id)];
    if (localUserId) conditions.push(eq(userOnboarding.localUserId, localUserId));

    const [row] = await db
      .select({ stage: userOnboarding.stage })
      .from(userOnboarding)
      .where(or(...conditions))
      .limit(1);

    // If the row exists and the stage is not yet completed, block access
    if (row && row.stage !== "completed") {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "onboarding_incomplete",
      });
    }
    // If no row exists we allow through (legacy accounts are treated as complete)
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

/** protectedProcedure that additionally requires completed onboarding */
export const onboardedProcedure = protectedProcedure.use(requireOnboardingComplete);
