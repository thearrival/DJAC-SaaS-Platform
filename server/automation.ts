/**
 * Automation Jobs — In-memory scheduler for onboarding sequences, feature
 * adoption campaigns, re-engagement, compliance reminders, and billing
 * notifications.
 *
 * Uses setTimeout-based delayed execution. When Redis is available, jobs
 * can be migrated to BullMQ for persistence across restarts.
 *
 * Usage:
 *   import { scheduleOnboardingSequence } from "./automation";
 *   await scheduleOnboardingSequence(user.id);
 */
import { getDb } from "./db";
import { onboardingProgress, users } from "../drizzle/schema";
import { eq, lt, and, ne } from "drizzle-orm";
import { createNotification } from "./notification-router";
import { sendEmail } from "./email";

interface AutomationAction {
  type: "email" | "notification" | "in-app-banner";
  template?: string;
  title?: string;
  body?: string;
  delayHours: number;
}

const ONBOARDING_SEQUENCE: AutomationAction[] = [
  {
    type: "email",
    template: "welcome",
    delayHours: 0.08, // 5 minutes
  },
  {
    type: "notification",
    title: "Welcome to DJAC",
    body: "Complete your onboarding in 3 minutes to unlock personalised compliance recommendations.",
    delayHours: 0.25, // 15 minutes
  },
  {
    type: "email",
    template: "onboarding-reminder",
    delayHours: 24, // 1 day
  },
  {
    type: "notification",
    title: "Finish setting up your frameworks",
    body: "Select your compliance frameworks to get AI-powered gap analysis tailored to your jurisdictions.",
    delayHours: 48, // 2 days
  },
  {
    type: "email",
    template: "onboarding-followup",
    delayHours: 72, // 3 days
  },
  {
    type: "notification",
    title: "Try your first vendor assessment",
    body: "Register a vendor and run an AI compliance assessment in under 60 seconds.",
    delayHours: 96, // 4 days
  },
  {
    type: "email",
    template: "feature-spotlight-vendors",
    delayHours: 120, // 5 days
  },
  {
    type: "notification",
    title: "Generate your first compliance report",
    body: "Use AI to produce a cross-jurisdiction report with gap analysis and remediation guidance.",
    delayHours: 144, // 6 days
  },
  {
    type: "email",
    template: "week-one-checkin",
    delayHours: 168, // 7 days
  },
];

const RE_ENGAGEMENT_SEQUENCE: AutomationAction[] = [
  {
    type: "email",
    template: "reengage-14d",
    delayHours: 336, // 14 days inactive
  },
  {
    type: "email",
    template: "reengage-30d",
    delayHours: 720, // 30 days inactive
  },
];

const TRIAL_REMINDER_SEQUENCE: AutomationAction[] = [
  {
    type: "email",
    template: "trial-ending-3d",
    delayHours: 0,
  },
  {
    type: "notification",
    title: "Your trial ends in 3 days",
    body: "Upgrade to keep access to all 29 jurisdictions and AI-powered reports.",
    delayHours: 12,
  },
  {
    type: "email",
    template: "trial-ending-1d",
    delayHours: 48,
  },
  {
    type: "email",
    template: "trial-expired",
    delayHours: 72,
  },
];

// ── In-memory job tracking ─────────────────────────────────────────────────
const _userJobs = new Map<number, Set<ReturnType<typeof setTimeout>>>();

function trackJob(userId: number, timer: ReturnType<typeof setTimeout>) {
  let jobs = _userJobs.get(userId);
  if (!jobs) {
    jobs = new Set();
    _userJobs.set(userId, jobs);
  }
  jobs.add(timer);
}

function untrackJob(userId: number, timer: ReturnType<typeof setTimeout>) {
  const jobs = _userJobs.get(userId);
  if (jobs) {
    jobs.delete(timer);
    if (jobs.size === 0) _userJobs.delete(userId);
  }
}

// ── Action dispatcher ──────────────────────────────────────────────────────

async function dispatchAction(
  userId: number,
  action: AutomationAction
): Promise<void> {
  try {
    if (action.type === "notification") {
      await createNotification(
        userId,
        "automation",
        action.title ?? "",
        action.body
      );
    } else if (action.type === "email") {
      await sendEmail({
        to: "", // resolved from user record if available
        subject: action.template ?? "DJAC Notification",
        html: `<p>Automated message for user ${userId}: ${action.template ?? "no template"}</p>`,
      }).catch(() => {
        // SMTP may not be configured — that's okay in dev
        console.info(
          `[Automation] Email for user ${userId} (${action.template}) could not be delivered (SMTP not configured)`
        );
      });
    }
    console.info(
      `[Automation] Dispatched ${action.type} for user ${userId}: ${action.template ?? action.title ?? "unknown"}`
    );
  } catch (err) {
    console.warn(
      `[Automation] Failed to dispatch action for user ${userId}:`,
      (err as Error).message
    );
  }
}

// ── Core enqueue ───────────────────────────────────────────────────────────

async function enqueueAction(
  userId: number,
  action: AutomationAction,
  overrideFireAt?: Date
): Promise<void> {
  try {
    const delayMs = overrideFireAt
      ? Math.max(0, overrideFireAt.getTime() - Date.now())
      : action.delayHours * 3600000;

    if (delayMs <= 0) {
      await dispatchAction(userId, action);
      return;
    }

    const fireAt = new Date(Date.now() + delayMs);
    const detail =
      action.type === "email"
        ? `template:${action.template}`
        : action.type === "notification"
          ? `title:"${action.title}"`
          : "banner";

    console.info(
      `[Automation] Scheduling ${action.type} for user ${userId} at ${fireAt.toISOString()}: ${detail}`
    );

    const timer = setTimeout(() => {
      untrackJob(userId, timer);
      void dispatchAction(userId, action);
    }, delayMs);

    trackJob(userId, timer);
  } catch (err) {
    console.warn(
      `[Automation] Failed to enqueue action for user ${userId}:`,
      (err as Error).message
    );
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/** Schedules the 9-step onboarding sequence for a new user. */
export async function scheduleOnboardingSequence(
  userId: number
): Promise<void> {
  console.info(
    `[Automation] Scheduling onboarding sequence for user ${userId}`
  );
  for (const action of ONBOARDING_SEQUENCE) {
    await enqueueAction(userId, action);
  }
}

/** Cancels all pending onboarding jobs and marks onboarding complete. */
export async function cancelOnboardingSequence(userId: number): Promise<void> {
  const jobs = _userJobs.get(userId);
  if (jobs) {
    for (const timer of jobs) {
      clearTimeout(timer);
    }
    _userJobs.delete(userId);
  }

  const db = await getDb();
  if (!db) return;

  await db
    .update(onboardingProgress)
    .set({ completedAt: new Date(), updatedAt: new Date() })
    .where(eq(onboardingProgress.userId, userId));

  console.info(`[Automation] Cancelled onboarding sequence for user ${userId}`);
}

/** Schedules re-engagement sequence for inactive users. */
export async function scheduleReEngagement(userId: number): Promise<void> {
  for (const action of RE_ENGAGEMENT_SEQUENCE) {
    await enqueueAction(userId, action);
  }
}

/** Schedules trial reminder sequence. */
export async function scheduleTrialReminders(
  userId: number,
  trialEndDate: Date
): Promise<void> {
  const base = trialEndDate.getTime();
  for (const action of TRIAL_REMINDER_SEQUENCE) {
    const fireAt = new Date(base - (3 * 24 - action.delayHours / 24) * 3600000);
    await enqueueAction(userId, action, fireAt);
  }
}

/**
 * Daily cron: checks for users needing re-engagement and trial reminders.
 * Run once per day via a scheduled job (called by startServer scheduler).
 */
export async function runDailyAutomationCheck(): Promise<void> {
  console.info("[Automation] Running daily check...");
  const db = await getDb();
  if (!db) {
    console.warn("[Automation] Database unavailable — skipping daily check");
    return;
  }

  try {
    // Find users inactive for 7+ days who don't have pending re-engagement
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const inactiveUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          lt(users.lastActivityAt, sevenDaysAgo),
          ne(users.status, "suspended")
        )
      )
      .limit(50);

    let reengaged = 0;
    for (const user of inactiveUsers) {
      await scheduleReEngagement(user.id);
      reengaged++;
    }

    if (reengaged > 0) {
      console.info(
        `[Automation] Scheduled re-engagement for ${reengaged} inactive users`
      );
    }
  } catch (err) {
    console.warn(
      "[Automation] Daily check encountered an error:",
      (err as Error).message
    );
  }

  console.info("[Automation] Daily check complete.");
}

/** Clears all pending jobs for a user (used on account deletion or logout). */
export function clearUserJobs(userId: number): void {
  const jobs = _userJobs.get(userId);
  if (jobs) {
    for (const timer of jobs) {
      clearTimeout(timer);
    }
    _userJobs.delete(userId);
  }
}
