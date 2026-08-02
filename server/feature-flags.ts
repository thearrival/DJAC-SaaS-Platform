/**
 * Feature Flags — runtime toggles for gradual rollouts and A/B testing.
 * Stored in PostgreSQL with an in-memory cache (refreshed every 60s).
 *
 * Usage:
 *   import { isFeatureEnabled } from "./feature-flags";
 *   if (await isFeatureEnabled("new-onboarding")) { ... }
 */
import { featureFlags } from "../drizzle/schema";
import { getDb } from "./db";

interface FlagCache {
  enabled: boolean;
  rolloutPct: number;
  targetOrgIds: number[];
  updatedAt: number;
}

const cache = new Map<string, FlagCache>();
let lastRefresh = 0;
const TTL_MS = 60_000;

async function refreshCache() {
  const db = await getDb();
  if (!db) return;

  const rows = await db.select().from(featureFlags);
  cache.clear();
  for (const row of rows) {
    cache.set(row.name, {
      enabled: row.enabled ?? false,
      rolloutPct: row.rolloutPercentage ?? 0,
      targetOrgIds: (row.targetOrgIds as number[]) ?? [],
      updatedAt: Date.now(),
    });
  }
  lastRefresh = Date.now();
}

export async function isFeatureEnabled(
  flag: string,
  organizationId?: number
): Promise<boolean> {
  if (Date.now() - lastRefresh > TTL_MS) await refreshCache();

  const entry = cache.get(flag);
  if (!entry) return false;
  if (!entry.enabled) return false;
  if (entry.rolloutPct >= 100) return true;
  if (entry.rolloutPct <= 0) return false;
  if (organizationId && entry.targetOrgIds.includes(organizationId))
    return true;

  const hash = simpleHash(`${flag}-${organizationId ?? "anon"}`);
  return hash % 100 < entry.rolloutPct;
}

function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export async function refreshFeatureFlags() {
  await refreshCache();
}
