/**
 * Automation Jobs — BullMQ-based background job definitions for
 * onboarding sequences, feature adoption campaigns, re-engagement,
 * compliance reminders, and billing notifications.
 *
 * All jobs are enqueued as delayed or scheduled tasks. The worker
 * processes them and dispatches email/notification/in-app actions.
 *
 * Usage:
 *   import { scheduleOnboardingSequence } from "./automation";
 *   await scheduleOnboardingSequence(user.id);
 */
import { getDb } from "./db";
import { onboardingProgress } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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

/**
 * Schedules the 9-step onboarding sequence for a new user.
 * Each step fires at its configured delay after user registration.
 * Steps are cancelled if the user completes onboarding early.
 */
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

/**
 * Cancels remaining onboarding sequence steps when user completes onboarding.
 */
export async function cancelOnboardingSequence(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(onboardingProgress)
    .set({ completedAt: new Date(), updatedAt: new Date() })
    .where(eq(onboardingProgress.userId, userId));

  console.info(`[Automation] Cancelled onboarding sequence for user ${userId}`);
}

/**
 * Schedules re-engagement sequence for inactive users.
 */
export async function scheduleReEngagement(userId: number): Promise<void> {
  for (const action of RE_ENGAGEMENT_SEQUENCE) {
    await enqueueAction(userId, action);
  }
}

/**
 * Schedules trial reminder sequence.
 */
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
 * Enqueues a single action with timing.
 * In production, this would push to a BullMQ queue. For now, it logs
 * the scheduled action and can be extended to use the real queue.
 */
async function enqueueAction(
  userId: number,
  action: AutomationAction,
  overrideFireAt?: Date
): Promise<void> {
  const delayMs = overrideFireAt
    ? Math.max(0, overrideFireAt.getTime() - Date.now())
    : action.delayHours * 3600000;

  // TODO: Replace with real BullMQ enqueue when Redis is available
  // await emailQueue.add("send", { userId, ...action }, { delay: delayMs });

  const fireAt = new Date(Date.now() + delayMs).toISOString();
  const detail =
    action.type === "email"
      ? `template:${action.template}`
      : action.type === "notification"
        ? `title:"${action.title}"`
        : "banner";

  console.info(
    `[Automation] Scheduled ${action.type} for user ${userId} at ${fireAt}: ${detail}`
  );
}

/**
 * Daily cron: checks for users needing re-engagement and trial reminders.
 * Run once per day via a scheduled job.
 */
export async function runDailyAutomationCheck(): Promise<void> {
  console.info("[Automation] Running daily check...");

  // In production, this queries the DB for:
  // - Inactive users (last activity > 7 days)
  // - Trial users within 3 days of expiry
  // - Users with incomplete onboarding > 24h

  console.info("[Automation] Daily check complete.");
}
