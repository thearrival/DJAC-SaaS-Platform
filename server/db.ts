import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { InsertUser, User, users } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { fixSslMode } from "./_core/ssl-helper";

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: pg.Pool | null = null;
let _lastDbCheckFailedAt = 0;
const DB_RETRY_BACKOFF_MS = 10_000;
let devUserOverride: Partial<User> = {};

function buildDevBypassUser(): User | null {
  if (!ENV.devAuthBypass) {
    return null;
  }

  const now = new Date();
  return {
    id: -1,
    openId: ENV.devAuthOpenId,
    name: ENV.devAuthName,
    email: ENV.devAuthEmail || null,
    loginMethod: "dev-bypass",
    organizationName: null,
    organizationType: null,
    jobTitle: null,
    preferredLocale: "en",
    role: ENV.devAuthRole,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    lastActivityAt: now,
    ...devUserOverride,
  };
}

export type UpdateUserProfileInput = {
  name?: string | null;
  email?: string | null;
  organizationName?: string | null;
  organizationType?: string | null;
  jobTitle?: string | null;
  preferredLocale?: "en" | "ar" | "zh";
};

export function getDatabaseUnavailableMessage() {
  if (!ENV.databaseUrl) {
    return "Database unavailable. Configure DATABASE_URL and run migrations (pnpm db:migrate).";
  }

  return "Database unavailable. Verify DATABASE_URL connectivity and ensure the database server is running.";
}

export async function getDb() {
  if (_db) return _db;

  const databaseUrl = ENV.databaseUrl;
  if (!databaseUrl) return null;

  const now = Date.now();
  if (now - _lastDbCheckFailedAt < DB_RETRY_BACKOFF_MS) {
    return null;
  }

  try {
    if (ENV.isProduction) {
      const connectionLimit = ENV.databasePoolSize;
      const sslUrl = fixSslMode(databaseUrl);

      _pool = new pg.Pool({
        connectionString: sslUrl,
        max: connectionLimit,
      });

      const client = await _pool.connect();
      await client.query("SELECT 1");
      client.release();

      _db = drizzle(_pool);
      console.info(`[Database] Pool created — max=${connectionLimit}`);
    } else {
      const client = new pg.Client(fixSslMode(databaseUrl));
      await client.connect();
      await client.end();
      _db = drizzle(fixSslMode(databaseUrl));
    }
    return _db;
  } catch (error) {
    _lastDbCheckFailedAt = now;
    console.warn("[Database] Connection unavailable:", String(error));
    _pool = null;
    _db = null;
    return null;
  }
}

export async function closeDbPool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
    _db = null;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (devUser && devUser.openId === user.openId) {
      devUserOverride = {
        ...devUserOverride,
        ...user,
        lastActivityAt: user.lastActivityAt ?? user.lastSignedIn ?? new Date(),
      };
      return;
    }

    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = [
      "name",
      "email",
      "loginMethod",
      "organizationName",
      "organizationType",
      "jobTitle",
    ] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.preferredLocale !== undefined) {
      values.preferredLocale = user.preferredLocale;
      updateSet.preferredLocale = user.preferredLocale;
    }

    if (user.status !== undefined) {
      values.status = user.status;
      updateSet.status = user.status;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    const activityTimestamp = user.lastActivityAt ?? user.lastSignedIn;
    if (activityTimestamp !== undefined) {
      values.lastActivityAt = activityTimestamp;
      updateSet.lastActivityAt = activityTimestamp;
    }

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (!values.lastActivityAt) {
      values.lastActivityAt = values.lastSignedIn;
    }

    if (Object.keys(updateSet).length === 0) {
      const now = new Date();
      updateSet.lastSignedIn = now;
      updateSet.lastActivityAt = now;
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (devUser?.openId === openId) {
      return devUser;
    }

    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (devUser?.id === userId) {
      return devUser;
    }

    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listUsersForAdmin(limit = 200) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    return devUser ? [devUser] : [];
  }

  return db.select().from(users).orderBy(desc(users.lastActivityAt), desc(users.lastSignedIn)).limit(limit);
}

export async function updateUserProfile(userId: number, updates: UpdateUserProfileInput) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (!devUser || devUser.id !== userId) {
      return undefined;
    }

    devUserOverride = {
      ...devUserOverride,
      ...updates,
      updatedAt: new Date(),
      lastActivityAt: new Date(),
    };
    return buildDevBypassUser() ?? undefined;
  }

  const updateSet: Record<string, unknown> = {
    lastActivityAt: new Date(),
  };

  const entries = Object.entries(updates) as Array<[keyof UpdateUserProfileInput, UpdateUserProfileInput[keyof UpdateUserProfileInput]]>;
  for (const [key, value] of entries) {
    if (value === undefined) continue;
    updateSet[key] = value;
  }

  await db.update(users).set(updateSet).where(eq(users.id, userId));
  return getUserById(userId);
}

export async function touchUserActivity(userId: number) {
  const db = await getDb();
  if (!db) {
    const devUser = buildDevBypassUser();
    if (devUser?.id === userId) {
      devUserOverride = {
        ...devUserOverride,
        lastActivityAt: new Date(),
      };
    }
    return;
  }

  await db.update(users).set({ lastActivityAt: new Date() }).where(eq(users.id, userId));
}
