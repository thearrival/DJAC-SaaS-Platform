/**
 * Deadline Alert Scheduler
 * ─────────────────────────────────────────────────────────────────────────────
 * Sends automated email alerts to organization members when a compliance
 * deadline is approaching.  Milestone thresholds:
 *
 *   • 30 days before — advance planning alert
 *   •  7 days before — action-required warning
 *   •  1 day  before — final day urgent alert
 *
 * Runs every 2 hours.  Uses an in-process dedup Set (keyed by deadlineId +
 * milestone) to prevent duplicate sends within the same server lifetime.
 * For multi-pod deployments, replace the dedup Set with a DB flag or Redis.
 *
 * Covers both:
 *   • Org-specific deadlines  (organizationId != null) — emails active org
 *     members with owner / admin / compliance_officer roles.
 *   • Global deadlines        (organizationId == null) — emails the billing
 *     contact of every active organisation (same as trial-reminder pattern).
 *
 * Does nothing when SMTP is not configured (sendEmail falls back to console).
 */

import { and, eq, lte, gte, inArray } from "drizzle-orm";
import {
    complianceDeadlines,
    organizations,
    organizationMembers,
    users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { sendEmail } from "./email";
import { ENV } from "./_core/env";

const INTERVAL_MS = 2 * 60 * 60 * 1000; // every 2 hours
const DAY_MS = 24 * 60 * 60 * 1000;

// Dedup: `${deadlineId}:${milestone}` — cleared on server restart only
const sentSet = new Set<string>();

type Milestone = "30d" | "7d" | "1d";

function daysUntil(deadlineDate: Date): number {
    return (deadlineDate.getTime() - Date.now()) / DAY_MS;
}

function getMilestone(daysLeft: number): Milestone | null {
    if (daysLeft < 0) return null; // already past
    if (daysLeft <= 1.5) return "1d";
    if (daysLeft <= 7.5) return "7d";
    if (daysLeft <= 30.5) return "30d";
    return null;
}

function buildSubject(milestone: Milestone, deadlineTitle: string): string {
    if (milestone === "1d") return `DJAC: URGENT — "${deadlineTitle}" deadline is tomorrow`;
    if (milestone === "7d") return `DJAC: "${deadlineTitle}" deadline in 7 days`;
    return `DJAC: "${deadlineTitle}" deadline in 30 days`;
}

function buildEmailHtml(
    recipientName: string,
    milestone: Milestone,
    deadline: { title: string; frameworkCode: string; jurisdiction: string; description: string | null },
    calendarUrl: string,
): string {
    const dayLabel = milestone === "1d" ? "tomorrow" : milestone === "7d" ? "7 days" : "30 days";
    const urgencyStyle =
        milestone === "1d"
            ? "background:#7f1d1d;border-left:4px solid #ef4444;"
            : milestone === "7d"
                ? "background:#78350f;border-left:4px solid #f59e0b;"
                : "background:#1e3a5f;border-left:4px solid #3b82f6;";

    return `
<p>Dear ${recipientName},</p>
<div style="${urgencyStyle}padding:12px 16px;border-radius:6px;margin:16px 0;">
  <strong style="font-size:15px;">${deadline.title}</strong><br/>
  <span style="font-size:12px;opacity:0.8;">${deadline.frameworkCode} · ${deadline.jurisdiction}</span>
</div>
<p>This compliance deadline is due in <strong>${dayLabel}</strong>.</p>
${deadline.description ? `<p style="font-size:13px;opacity:0.8;">${deadline.description}</p>` : ""}
<p>Open the DJAC compliance calendar to view details and mark it as complete:</p>
<p><a href="${calendarUrl}" style="background:#0284c7;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View Compliance Calendar</a></p>
<p>— The DJAC / Yalla Hack Team</p>`;
}

function buildEmailText(
    recipientName: string,
    milestone: Milestone,
    deadline: { title: string; frameworkCode: string; jurisdiction: string },
    calendarUrl: string,
): string {
    const dayLabel = milestone === "1d" ? "tomorrow" : milestone === "7d" ? "7 days" : "30 days";
    return `Dear ${recipientName},\n\nCompliance deadline due in ${dayLabel}:\n${deadline.title} (${deadline.frameworkCode} · ${deadline.jurisdiction})\n\nView calendar: ${calendarUrl}\n\n— The DJAC / Yalla Hack Team`;
}

async function runAlertCheck(): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const now = new Date();
    const horizon = new Date(now.getTime() + 31 * DAY_MS);

    // Fetch upcoming deadlines within the next 31 days
    const upcoming = await db
        .select()
        .from(complianceDeadlines)
        .where(
            and(
                eq(complianceDeadlines.status, "upcoming"),
                gte(complianceDeadlines.deadlineDate, now),
                lte(complianceDeadlines.deadlineDate, horizon),
            ),
        );

    if (upcoming.length === 0) return;

    const calendarUrl = `${ENV.appUrl}/compliance-calendar`;
    let sent = 0;

    // Separate global vs org-specific
    const globalDeadlines = upcoming.filter((d) => d.organizationId == null);
    const orgDeadlines = upcoming.filter((d) => d.organizationId != null);

    // ── Global deadlines → email all org billing contacts ──────────────────
    if (globalDeadlines.length > 0) {
        const activeOrgs = await db
            .select({ id: organizations.id, name: organizations.name, billingEmail: organizations.billingEmail })
            .from(organizations)
            .where(inArray(organizations.plan, ["free_trial", "professional", "enterprise", "starter"]));

        for (const deadline of globalDeadlines) {
            const daysLeft = daysUntil(deadline.deadlineDate);
            const milestone = getMilestone(daysLeft);
            if (!milestone) continue;

            for (const org of activeOrgs) {
                if (!org.billingEmail) continue;
                const dedupKey = `${deadline.id}:${org.id}:${milestone}`;
                if (sentSet.has(dedupKey)) continue;

                await sendEmail({
                    to: org.billingEmail,
                    subject: buildSubject(milestone, deadline.title),
                    html: buildEmailHtml(org.name, milestone, deadline, calendarUrl),
                    text: buildEmailText(org.name, milestone, deadline, calendarUrl),
                });

                sentSet.add(dedupKey);
                sent++;
            }
        }
    }

    // ── Org-specific deadlines → email owner/admin/compliance_officer members ─
    for (const deadline of orgDeadlines) {
        const daysLeft = daysUntil(deadline.deadlineDate);
        const milestone = getMilestone(daysLeft);
        if (!milestone) continue;

        const dedupKey = `${deadline.id}:${milestone}`;
        if (sentSet.has(dedupKey)) continue;

        // Join org members to users to get email addresses
        const members = await db
            .select({ email: users.email, name: users.name })
            .from(organizationMembers)
            .innerJoin(users, eq(organizationMembers.userId, users.id))
            .where(
                and(
                    eq(organizationMembers.organizationId, deadline.organizationId!),
                    eq(organizationMembers.status, "active"),
                    inArray(organizationMembers.role, ["owner", "admin", "compliance_officer"]),
                ),
            );

        // Also check inviteEmail for invited but active compliance officers
        const invitedEmails = await db
            .select({ inviteEmail: organizationMembers.inviteEmail })
            .from(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.organizationId, deadline.organizationId!),
                    eq(organizationMembers.status, "invited"),
                    inArray(organizationMembers.role, ["owner", "admin", "compliance_officer"]),
                ),
            );

        const allEmails = [
            ...members.filter((m) => m.email).map((m) => ({ email: m.email!, name: m.name ?? "Team" })),
            ...invitedEmails.filter((m) => m.inviteEmail).map((m) => ({ email: m.inviteEmail!, name: "Team" })),
        ];

        for (const recipient of allEmails) {
            await sendEmail({
                to: recipient.email,
                subject: buildSubject(milestone, deadline.title),
                html: buildEmailHtml(recipient.name, milestone, deadline, calendarUrl),
                text: buildEmailText(recipient.name, milestone, deadline, calendarUrl),
            });
            sent++;
        }

        sentSet.add(dedupKey);
    }

    if (sent > 0) {
        console.info(`[DeadlineAlert] Sent ${sent} alert email(s).`);
    }
}

export function startDeadlineAlertScheduler(): () => void {
    let running = false;

    const run = async () => {
        if (running) return;
        running = true;
        try {
            await runAlertCheck();
        } catch (err) {
            console.warn("[DeadlineAlert] Scheduler run failed:", err);
        } finally {
            running = false;
        }
    };

    void run(); // Run immediately on startup
    const timer = setInterval(() => void run(), INTERVAL_MS);

    console.info("[DeadlineAlert] Scheduler started. Interval: 2h.");

    return () => clearInterval(timer);
}
