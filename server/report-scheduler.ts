/**
 * Scheduled Report Delivery
 * ─────────────────────────────────────────────────────────────────────────────
 * Automatically generates and emails compliance reports for each active
 * organization on two cadences:
 *
 *   • Weekly  — every Monday at or after 07:00 UTC
 *   • Monthly — on the 1st of each month at or after 07:00 UTC
 *
 * Runs every 6 hours. Uses an in-process dedup Set (keyed by orgId + ISO week/month)
 * to prevent duplicate sends within the same server lifetime.
 *
 * Does nothing when SMTP is not configured (sendEmail falls back to console log).
 */

import { eq } from "drizzle-orm";
import { organizations } from "../drizzle/schema";
import { getDb } from "./db";
import { emailComplianceReport } from "./report-delivery";
import { ENV } from "./_core/env";

const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

// Dedup keys: `${freq}:${orgId}:${period}` e.g. "weekly:7:2026-W01"
const sentSet = new Set<string>();

/** ISO week string like "2026-W01" */
function isoWeekKey(d: Date): string {
    const jan4 = new Date(d.getFullYear(), 0, 4);
    const weekNum = Math.ceil(((d.getTime() - jan4.getTime()) / 86_400_000 + jan4.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Month key like "2026-04" */
function monthKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function mapJurisdiction(
    raw: string | null | undefined,
): "Saudi Arabia" | "China" | "both" {
    if (!raw) return "both";
    const lower = raw.toLowerCase();
    if (lower.includes("saudi") || lower.includes("ksa")) return "Saudi Arabia";
    if (lower.includes("china") || lower.includes("cn")) return "China";
    return "both";
}

async function runScheduledReports(): Promise<void> {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
    const dayOfMonth = now.getUTCDate();
    const hourUtc = now.getUTCHours();

    const isWeeklyTrigger = dayOfWeek === 1 && hourUtc >= 7; // Monday ≥07:00 UTC
    const isMonthlyTrigger = dayOfMonth === 1 && hourUtc >= 7; // 1st of month ≥07:00 UTC

    if (!isWeeklyTrigger && !isMonthlyTrigger) return;

    const db = await getDb();
    if (!db) return;                  // no DB in this runtime — skip silently

    const activeOrgs = await db
        .select({
            id: organizations.id,
            name: organizations.name,
            billingEmail: organizations.billingEmail,
            primaryJurisdiction: organizations.primaryJurisdiction,
        })
        .from(organizations)
        .where(eq(organizations.isActive, 1));

    for (const org of activeOrgs) {
        if (!org.billingEmail) continue;

        const jurisdiction = mapJurisdiction(org.primaryJurisdiction);
        const locale: "en" | "ar" | "zh" = "en"; // default; orgs without locale preference get EN

        if (isWeeklyTrigger) {
            const key = `weekly:${org.id}:${isoWeekKey(now)}`;
            if (!sentSet.has(key)) {
                sentSet.add(key);
                void sendOrgReport(org.id, org.name, org.billingEmail, jurisdiction, locale, "weekly");
            }
        }

        if (isMonthlyTrigger) {
            const key = `monthly:${org.id}:${monthKey(now)}`;
            if (!sentSet.has(key)) {
                sentSet.add(key);
                void sendOrgReport(org.id, org.name, org.billingEmail, jurisdiction, locale, "monthly");
            }
        }
    }
}

async function sendOrgReport(
    orgId: number,
    orgName: string,
    email: string,
    jurisdiction: "Saudi Arabia" | "China" | "both",
    locale: "en" | "ar" | "zh",
    cadence: "weekly" | "monthly",
): Promise<void> {
    try {
        const label = cadence === "weekly" ? "Weekly" : "Monthly";
        await emailComplianceReport({
            jurisdiction,
            locale,
            reportType: "full_compliance",
            recipientEmail: email,
        });

        if (ENV.isDevelopment) {
            console.info(`[report-scheduler] ${label} report sent to ${email} for org ${orgId} (${orgName})`);
        }
    } catch (err) {
        console.error(`[report-scheduler] failed to send ${cadence} report for org ${orgId}:`, err);
    }
}

let timerId: ReturnType<typeof setInterval> | null = null;

export function startReportScheduler(): () => void {
    if (timerId) return () => { /* already running */ };

    // run immediately on startup (catches up if server restarted mid-day)
    void runScheduledReports();

    timerId = setInterval(() => void runScheduledReports(), INTERVAL_MS);

    return () => {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    };
}
