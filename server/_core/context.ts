import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import type { OrganizationMember } from "../../drizzle/schema";
import { ENV } from "./env";
import {
  resolveDevBypassUser,
  resolveOAuthUser,
  resolveApiKeyAuth,
  resolveLocalAuthUser,
} from "../services/auth-session";
import { resolveOrganizationForUser } from "../services/org-context";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  organizationId: number | null;
  organizationRole: OrganizationMember["role"] | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null;
  let organizationId: number | null = null;
  let organizationRole: OrganizationMember["role"] | null = null;

  if (ENV.devAuthBypass) {
    user = await resolveDevBypassUser();
    // Virtual dev org — id -1 passes !null checks so orgProcedure works
    // without requiring a real DB row; billing queries handle id=-1 gracefully.
    organizationId = -1;
    organizationRole = "owner";
  } else {
    // ── Path 1: OAuth session auth ──────────────────────────────────────────
    user = await resolveOAuthUser(opts.req);

    if (user) {
      // Session-authenticated user — resolve their org membership normally.
      const org = await resolveOrganizationForUser(user);
      organizationId = org.organizationId;
      organizationRole = org.organizationRole;
    } else {
      // ── Path 2: API key auth  Authorization: Bearer djac_<hex> ─────────
      const apiKeyResult = await resolveApiKeyAuth(opts.req);
      if (apiKeyResult) {
        user = apiKeyResult.user;
        organizationId = apiKeyResult.organizationId;
        organizationRole = apiKeyResult.organizationRole;
      }
    }

    // ── Path 3: Local auth session (djac_local_session JWT cookie) ──────────
    // Locally-registered users (email+password) never go through OAuth.
    // Without this path every protectedProcedure call returns UNAUTHORIZED,
    // which triggers main.tsx's global error handler to hard-reload the page,
    // causing the flash / redirect loop the user experiences on local dev.
    if (!user) {
      user = await resolveLocalAuthUser(opts.req);
      if (user) {
        // Virtual org — id -1 is the same convention as DEV_AUTH_BYPASS.
        // orgProcedure checks (organizationId !== null) pass; real DB queries
        // with id=-1 simply return empty result sets (not errors).
        organizationId = -1;
        organizationRole = "owner";
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    organizationId,
    organizationRole,
  };
}

