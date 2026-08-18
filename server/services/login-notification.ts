/**
 * Login Notification Service
 * ─────────────────────────────────────────────────────────────────────────────
 * Requirement: Step 4 of the security audit
 *
 * a. First-login welcome email from hello@yalla-hack.com (idempotent — never
 *    resend on later logins).
 * b. Every subsequent login: security alert email with IP address, geolocated
 *    approximate location, ISO-8601 timestamp, and device/user-agent, sent
 *    asynchronously (never blocking the auth response).
 */

import type { IncomingMessage } from "node:http";
import { getDb } from "../db";
import { localUsers, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { emailService } from "../email/service";

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.socket?.remoteAddress || "unknown";
}

function getApproximateLocation(req: IncomingMessage): string {
  const country =
    req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"];
  const region = req.headers["x-vercel-ip-region"];
  const city = req.headers["x-vercel-ip-city"];
  if (typeof country === "string" && country.trim()) {
    const parts: string[] = [];
    if (typeof city === "string" && city.trim()) parts.push(city.trim());
    if (typeof region === "string" && region.trim()) parts.push(region.trim());
    parts.push(country.trim());
    return parts.join(", ");
  }
  const geo = req.headers["x-geo-location"] || req.headers["x-client-geo"];
  if (typeof geo === "string" && geo.trim()) return geo.trim();
  return "Unknown location";
}

function getUserAgent(req: IncomingMessage): string {
  const ua = req.headers["user-agent"];
  return typeof ua === "string" ? ua.slice(0, 200) : "Unknown device";
}

async function markFirstLoginSent(
  table: "localUsers" | "users",
  pk: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    if (table === "localUsers") {
      await db
        .update(localUsers)
        .set({ firstLoginEmailSent: 1, updatedAt: new Date() })
        .where(eq(localUsers.id, pk));
    } else {
      await db
        .update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, pk));
    }
  } catch {
    // non-critical — don't break login
  }
}

async function hasFirstLoginBeenSent(
  table: "localUsers" | "users",
  pk: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    if (table === "localUsers") {
      const [row] = await db
        .select({ firstLoginEmailSent: localUsers.firstLoginEmailSent })
        .from(localUsers)
        .where(eq(localUsers.id, pk))
        .limit(1);
      return row?.firstLoginEmailSent === 1;
    } else {
      const [row] = await db
        .select({ lastActivityAt: users.lastActivityAt })
        .from(users)
        .where(eq(users.id, pk))
        .limit(1);
      if (!row) return false;
      return row.lastActivityAt != null;
    }
  } catch {
    return false;
  }
}

/**
 * Called after a successful login. Sends the appropriate notification
 * asynchronously — never throws, never blocks the auth response.
 *
 * - First login (no prior lastSignedIn): sends welcome email + marks sent.
 * - Subsequent login: sends security alert with IP, location, timestamp, device.
 */
export function notifyLogin(
  req: IncomingMessage,
  user: { id: number; name: string | null; email: string | null },
  table: "localUsers" | "users",
  org?: { name: string } | null
): void {
  const email = user.email;
  if (!email) return;

  // Fire-and-forget — never await this promise in the auth handler
  (async () => {
    try {
      const sent = await hasFirstLoginBeenSent(table, user.id);
      if (!sent) {
        await emailService.sendWelcome(user, org ?? undefined);
        await markFirstLoginSent(table, user.id);
        console.info(
          `[LoginNotification] Welcome email sent to ${email} (first login)`
        );
      } else {
        const ip = getClientIp(req);
        const location = getApproximateLocation(req);
        const device = getUserAgent(req);
        const timestamp = new Date().toISOString();

        await emailService.sendSecurityAlert(
          user,
          ip,
          location,
          timestamp,
          device
        );
        console.info(
          `[LoginNotification] Security alert sent to ${email} (IP: ${ip})`
        );
      }
    } catch (err) {
      console.warn(
        "[LoginNotification] Failed to send:",
        (err as Error).message
      );
    }
  })();
}
