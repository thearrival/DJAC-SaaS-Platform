/**
 * Stripe Webhook Handler
 * ─────────────────────────────────────────────────────────────────────────────
 * Route:  POST /api/webhooks/stripe
 * Registered in server/_core/index.ts (or systemRouter.ts) as a raw Express
 * route — BEFORE express.json() so we receive the raw request body required
 * for Stripe signature verification.
 *
 * Critical: this route must use express.raw() middleware, not express.json().
 *
 * Handles:
 *   invoice.payment_succeeded    → mark sub active, record billing event
 *   invoice.payment_failed       → update sub to past_due
 *   customer.subscription.updated → sync plan / interval / status
 *   customer.subscription.deleted → cancel sub in DB
 *   checkout.session.completed   → initial subscription activation
 */

import type { Request, Response } from "express";
// Stripe type import for webhook event signature verification only
// We use a loose cast (AnyObj) for event payloads because Stripe v20 renamed
// several fields (invoice.subscription → invoice.parent.subscription_details,
// subscription.current_period_* removed, etc.) and we prefer runtime safety
// over fighting the latest type changes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;
import { ENV } from "./_core/env";
import { getDb } from "./db";
import {
    organizations,
    subscriptions,
    billingEvents,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStripe, PRICE_CATALOG } from "./billing";

type StripeSubscriptionStatus =
    | "trialing" | "active" | "past_due"
    | "canceled" | "incomplete" | "paused";

function mapStripeStatus(s: string): StripeSubscriptionStatus {
    const valid = ["trialing", "active", "past_due", "canceled", "incomplete", "paused"];
    return valid.includes(s) ? (s as StripeSubscriptionStatus) : "incomplete";
}

/** Resolve our plan name from a Stripe Price ID */
function resolvePlanFromPriceId(
    priceId: string,
): { plan: "starter" | "professional" | "enterprise"; interval: "monthly" | "quarterly" | "biannual" | "annual" } | null {
    const tier = PRICE_CATALOG.find((p) => p.stripePriceId === priceId);
    if (!tier) return null;
    return { plan: tier.plan, interval: tier.interval };
}

function resolveTier(
    plan: "starter" | "professional" | "enterprise",
    interval: "monthly" | "quarterly" | "biannual" | "annual",
) {
    return PRICE_CATALOG.find((tier) => tier.plan === plan && tier.interval === interval) ?? null;
}

async function upsertSubscriptionRecord(
    db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
    params: {
        organizationId: number;
        stripeSubscriptionId: string;
        stripePriceId?: string | null;
        plan: "starter" | "professional" | "enterprise";
        interval: "monthly" | "quarterly" | "biannual" | "annual";
        amountCents: number;
        currency?: string | null;
        status: StripeSubscriptionStatus;
        currentPeriodStart?: Date | null;
        currentPeriodEnd?: Date | null;
        cancelAtPeriodEnd?: number;
        canceledAt?: Date | null;
        lastInvoiceId?: string | null;
        stripeMetadata?: string | null;
    },
): Promise<void> {
    const existing = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, params.stripeSubscriptionId))
        .limit(1);

    const payload = {
        organizationId: params.organizationId,
        stripeSubscriptionId: params.stripeSubscriptionId,
        stripePriceId: params.stripePriceId ?? null,
        plan: params.plan,
        billingInterval: params.interval,
        amountCents: params.amountCents,
        currency: (params.currency ?? "USD").toUpperCase(),
        status: params.status,
        currentPeriodStart: params.currentPeriodStart ?? null,
        currentPeriodEnd: params.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? 0,
        canceledAt: params.canceledAt ?? null,
        lastInvoiceId: params.lastInvoiceId ?? null,
        stripeMetadata: params.stripeMetadata ?? null,
    };

    if (existing.length > 0) {
        await db
            .update(subscriptions)
            .set(payload)
            .where(eq(subscriptions.stripeSubscriptionId, params.stripeSubscriptionId));
        return;
    }

    await db.insert(subscriptions).values(payload);
}

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
    if (!ENV.stripeWebhookSecret) {
        res.status(400).json({ error: "Webhook secret not configured" });
        return;
    }

    const stripe = await getStripe();
    const sig = req.headers["stripe-signature"];
    if (!sig) {
        res.status(400).json({ error: "Missing Stripe signature" });
        return;
    }

    let event: import("stripe").Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(req.body as Buffer, sig, ENV.stripeWebhookSecret);
    } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        res.status(400).json({ error: "Invalid signature" });
        return;
    }

    const db = await getDb();
    if (!db) {
        // In-memory mode: acknowledge but skip persistence
        res.json({ received: true });
        return;
    }

    try {
        await processStripeEvent(event, db);
    } catch (err) {
        console.error("[Stripe Webhook] Processing error:", event.type, err);
        res.status(500).json({ error: "Webhook processing failed" });
        return;
    }

    res.json({ received: true });
}

export async function processStripeEvent(
    event: import("stripe").Stripe.Event,
    db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
) {
    const idempotencyGuard = async (): Promise<boolean> => {
        const existing = await db
            .select({ id: billingEvents.id })
            .from(billingEvents)
            .where(eq(billingEvents.stripeEventId, event.id))
            .limit(1);
        return existing.length > 0;
    };

    if (await idempotencyGuard()) {
        console.log("[Stripe Webhook] Duplicate event ignored:", event.id);
        return;
    }


    switch (event.type) {
        // ── Checkout complete → activate subscription ────────────────────────────
        case "checkout.session.completed": {
            const session = event.data.object as AnyObj;
            const orgId = Number(session.metadata?.organizationId);
            if (!orgId || !session.subscription) break;

            const plan = (session.metadata?.plan as "starter" | "professional" | "enterprise") ?? "starter";
            const interval = (session.metadata?.interval as "monthly" | "quarterly" | "biannual" | "annual") ?? "monthly";
            const tier = resolveTier(plan, interval);

            await db
                .update(organizations)
                .set({ plan, stripeCustomerId: String(session.customer ?? "") })
                .where(eq(organizations.id, orgId));

            await upsertSubscriptionRecord(db, {
                organizationId: orgId,
                stripeSubscriptionId: String(session.subscription),
                stripePriceId: session.metadata?.stripePriceId ?? null,
                plan,
                interval,
                amountCents: tier?.amountCents ?? 0,
                currency: session.currency ?? "usd",
                status: "trialing",
                cancelAtPeriodEnd: 0,
                stripeMetadata: JSON.stringify(session.metadata ?? {}),
            });

            await db.insert(billingEvents).values({
                organizationId: orgId,
                stripeEventId: event.id,
                eventType: event.type,
                status: "success",
                description: `Checkout completed — plan: ${plan}/${interval}`,
                rawPayload: JSON.stringify(event.data.object),
            });
            break;
        }

        // ── Invoice paid → subscription active ───────────────────────────────────
        case "invoice.payment_succeeded": {
            const invoice = event.data.object as AnyObj;

            const orgResult = await db
                .select({ id: organizations.id })
                .from(organizations)
                .where(eq(organizations.stripeCustomerId, String(invoice.customer ?? "")))
                .limit(1);

            const orgId = orgResult[0]?.id;
            if (!orgId) break;

            // Stripe v20: subscription may be under parent.subscription_details.subscription
            const subId: string = invoice.subscription
                ?? invoice.parent?.subscription_details?.subscription
                ?? "";
            const priceId: string = invoice.lines?.data?.[0]?.price?.id ?? "";
            const planInfo = resolvePlanFromPriceId(priceId);
            if (subId && planInfo) {
                const tier = resolveTier(planInfo.plan, planInfo.interval);
                await upsertSubscriptionRecord(db, {
                    organizationId: orgId,
                    stripeSubscriptionId: subId,
                    stripePriceId: priceId,
                    plan: planInfo.plan,
                    interval: planInfo.interval,
                    amountCents: tier?.amountCents ?? invoice.amount_paid ?? 0,
                    currency: invoice.currency ?? "usd",
                    status: "active",
                    currentPeriodStart: invoice.lines?.data?.[0]?.period?.start ? new Date(invoice.lines.data[0].period.start * 1000) : null,
                    currentPeriodEnd: invoice.lines?.data?.[0]?.period?.end ? new Date(invoice.lines.data[0].period.end * 1000) : null,
                    cancelAtPeriodEnd: 0,
                    lastInvoiceId: invoice.id,
                    stripeMetadata: JSON.stringify(invoice.lines?.data?.[0] ?? {}),
                });
            } else if (subId) {
                await db
                    .update(subscriptions)
                    .set({ status: "active", lastInvoiceId: invoice.id })
                    .where(eq(subscriptions.stripeSubscriptionId, subId));
            }

            await db.insert(billingEvents).values({
                organizationId: orgId,
                stripeEventId: event.id,
                eventType: event.type,
                status: "success",
                amountCents: invoice.amount_paid,
                currency: (invoice.currency ?? "usd").toUpperCase(),
                description: "Invoice payment succeeded",
                rawPayload: JSON.stringify(event.data.object),
            });
            break;
        }

        // ── Invoice failed → past_due ─────────────────────────────────────────────
        case "invoice.payment_failed": {
            const invoice = event.data.object as AnyObj;

            const orgResult = await db
                .select({ id: organizations.id })
                .from(organizations)
                .where(eq(organizations.stripeCustomerId, String(invoice.customer ?? "")))
                .limit(1);

            const orgId = orgResult[0]?.id;
            if (!orgId) break;

            const subIdFailed: string = invoice.subscription
                ?? invoice.parent?.subscription_details?.subscription
                ?? "";
            await db
                .update(subscriptions)
                .set({ status: "past_due" })
                .where(eq(subscriptions.stripeSubscriptionId, subIdFailed));

            await db.insert(billingEvents).values({
                organizationId: orgId,
                stripeEventId: event.id,
                eventType: event.type,
                status: "failed",
                description: "Invoice payment failed",
                rawPayload: JSON.stringify(event.data.object),
            });
            break;
        }

        // ── Subscription updated ──────────────────────────────────────────────────
        case "customer.subscription.updated": {
            const sub = event.data.object as AnyObj;

            const orgResult = await db
                .select({ id: organizations.id })
                .from(organizations)
                .where(eq(organizations.stripeCustomerId, String(sub.customer ?? "")))
                .limit(1);

            const orgId = orgResult[0]?.id;
            if (!orgId) break;

            const priceId: string = sub.items?.data?.[0]?.price?.id ?? "";
            const planInfo = resolvePlanFromPriceId(priceId);
            if (planInfo) {
                const tier = resolveTier(planInfo.plan, planInfo.interval);

                await upsertSubscriptionRecord(db, {
                    organizationId: orgId,
                    stripeSubscriptionId: sub.id,
                    stripePriceId: priceId,
                    plan: planInfo.plan,
                    interval: planInfo.interval,
                    amountCents: tier?.amountCents ?? 0,
                    currency: sub.currency ?? "usd",
                    status: mapStripeStatus(sub.status),
                    currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
                    currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
                    cancelAtPeriodEnd: sub.cancel_at_period_end ? 1 : 0,
                    stripeMetadata: JSON.stringify(sub.metadata ?? {}),
                });

                await db
                    .update(organizations)
                    .set({ plan: planInfo.plan })
                    .where(eq(organizations.id, orgId));
            } else {
                await db
                    .update(subscriptions)
                    .set({
                        stripePriceId: priceId || null,
                        status: mapStripeStatus(sub.status),
                        currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000) : null,
                        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
                        cancelAtPeriodEnd: sub.cancel_at_period_end ? 1 : 0,
                        stripeMetadata: JSON.stringify(sub.metadata ?? {}),
                    })
                    .where(eq(subscriptions.stripeSubscriptionId, sub.id));
            }

            await db.insert(billingEvents).values({
                organizationId: orgId,
                stripeEventId: event.id,
                eventType: event.type,
                status: "success",
                description: `Subscription updated to status: ${sub.status}`,
                rawPayload: JSON.stringify(event.data.object),
            });
            break;
        }

        // ── Subscription cancelled ────────────────────────────────────────────────
        case "customer.subscription.deleted": {
            const sub = event.data.object as AnyObj;

            const orgResult = await db
                .select({ id: organizations.id })
                .from(organizations)
                .where(eq(organizations.stripeCustomerId, String(sub.customer ?? "")))
                .limit(1);

            const orgId = orgResult[0]?.id;
            if (!orgId) break;

            await db
                .update(subscriptions)
                .set({
                    status: "canceled",
                    cancelAtPeriodEnd: 0,
                    canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : new Date(),
                })
                .where(eq(subscriptions.stripeSubscriptionId, sub.id));

            await db.insert(billingEvents).values({
                organizationId: orgId,
                stripeEventId: event.id,
                eventType: event.type,
                status: "success",
                description: "Subscription cancelled",
                rawPayload: JSON.stringify(event.data.object),
            });
            break;
        }

        default:
            // Acknowledge unhandled events silently
            break;
    }
}
