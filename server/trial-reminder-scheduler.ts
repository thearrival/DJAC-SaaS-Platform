/**
 * Trial Reminder Scheduler
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends automated email reminders to free-trial organizations approaching
 * or reaching the end of their 7-day trial:
 *
 *   • 3 days before expiry — early-warning reminder
 *   • 1 day before expiry — final-day reminder
 *   • On/after expiry     — expired notice
 *
 * Runs every 6 hours. Uses an in-process dedup Set (keyed by orgId+milestone)
 * to prevent duplicate sends within the same server lifetime.  For multi-pod
 * deployments, replace the dedup Set with a DB-flag or Redis entry.
 *
 * Does nothing when SMTP is not configured (sendEmail falls back to console).
 */

import { eq } from "drizzle-orm";
import { organizations } from "../drizzle/schema";
import { getDb } from "./db";
import { sendEmail } from "./email";
import { ENV } from "./_core/env";

const INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours
const DAY_MS = 24 * 60 * 60 * 1000;

// Dedup: `${orgId}:${milestone}` — cleared on server restart only
const sentSet = new Set<string>();

type Milestone = "3d" | "1d" | "expired";

function daysUntilExpiry(trialEndsAt: Date): number {
    return (trialEndsAt.getTime() - Date.now()) / DAY_MS;
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}

function buildEmailHtml(orgName: string, milestone: Milestone, pricingUrl: string): string {
    const safeOrg = escapeHtml(orgName);
    if (milestone === "expired") {
        return `
<p>Dear ${safeOrg} team,</p>
<p>Your <strong>7-day free trial of DJAC</strong> has now expired.</p>
<p>To continue using DJAC's dual-jurisdiction compliance intelligence platform, please choose a plan:</p>
<p><a href="${pricingUrl}" style="background:#0284c7;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Plans & Upgrade</a></p>
<p>Your data is safely retained for 30 days while your account is inactive.</p>
<p>— The DJAC / Yalla Hack Team</p>`;
    }

    const dayLabel = milestone === "3d" ? "3 days" : "1 day";
    const urgencyNote = milestone === "1d"
        ? "<p><strong>This is your final reminder before your trial expires tomorrow.</strong></p>"
        : "";

    return `
<p>Dear ${safeOrg} team,</p>
<p>Your <strong>7-day free trial of DJAC</strong> expires in <strong>${dayLabel}</strong>.</p>
${urgencyNote}
<p>Upgrade now to keep uninterrupted access to:</p>
<ul>
  <li>AI-powered compliance assessments (PIPL, CSL, DSL, PDPL, NCA)</li>
  <li>Vendor risk analysis and dual-jurisdiction reporting</li>
  <li>Regulatory deadline calendar and audit trail</li>
</ul>
<p><a href="${pricingUrl}" style="background:#0284c7;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">Upgrade My Plan</a></p>
<p>— The DJAC / Yalla Hack Team</p>`;
}

function buildEmailText(orgName: string, milestone: Milestone, pricingUrl: string): string {
    if (milestone === "expired") {
        return `Dear ${orgName} team,\n\nYour 7-day free trial of DJAC has expired.\n\nUpgrade at: ${pricingUrl}\n\nYour data is retained for 30 days.\n\n— The DJAC / Yalla Hack Team`;
    }
    const dayLabel = milestone === "3d" ? "3 days" : "1 day";
    return `Dear ${orgName} team,\n\nYour DJAC trial expires in ${dayLabel}.\n\nUpgrade at: ${pricingUrl}\n\n— The DJAC / Yalla Hack Team`;
}

function buildSubject(milestone: Milestone): string {
    if (milestone === "expired") return "Your DJAC free trial has expired";
    if (milestone === "1d") return "DJAC: Your free trial expires tomorrow";
    return "DJAC: 3 days left in your free trial";
}

async function runReminderCheck(): Promise<void> {
    const db = await getDb();
    if (!db) return; // No DB — skip

    const trialOrgs = await db
        .select({
            id: organizations.id,
            name: organizations.name,
            billingEmail: organizations.billingEmail,
            trialEndsAt: organizations.trialEndsAt,
        })
        .from(organizations)
        .where(eq(organizations.plan, "free_trial"));

    if (trialOrgs.length === 0) return;

    const pricingUrl = `${ENV.appUrl}/pricing`;
    let sent = 0;

    for (const org of trialOrgs) {
        if (!org.trialEndsAt || !org.billingEmail) continue;

        const daysLeft = daysUntilExpiry(org.trialEndsAt);
        let milestone: Milestone | null = null;

        if (daysLeft <= 0) {
            milestone = "expired";
        } else if (daysLeft <= 1.5) {
            milestone = "1d";
        } else if (daysLeft <= 3.5) {
            milestone = "3d";
        }

        if (!milestone) continue;

        const dedupKey = `${org.id}:${milestone}`;
        if (sentSet.has(dedupKey)) continue; // Already sent this cycle

        await sendEmail({
            to: org.billingEmail,
            subject: buildSubject(milestone),
            html: buildEmailHtml(org.name, milestone, pricingUrl),
            text: buildEmailText(org.name, milestone, pricingUrl),
        });

        sentSet.add(dedupKey);
        sent++;
    }

    if (sent > 0) {
        console.log(`[TrialReminder] Sent ${sent} reminder email(s).`);
    }
}

export function startTrialReminderScheduler(): () => void {
    let running = false;

    const run = async () => {
        if (running) return;
        running = true;
        try {
            await runReminderCheck();
        } catch (err) {
            console.warn("[TrialReminder] Scheduler run failed:", err);
        } finally {
            running = false;
        }
    };

    void run(); // Run immediately on startup
    const timer = setInterval(() => void run(), INTERVAL_MS);

    console.log("[TrialReminder] Scheduler started. Interval: 6h.");

    return () => clearInterval(timer);
}
