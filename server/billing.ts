/**
 * DJAC SaaS Billing — Stripe Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles:
 *   • Checkout session creation (hosted checkout)
 *   • Customer portal redirect
 *   • Webhook event processing (invoice, subscription lifecycle)
 *   • Trial management helpers
 *   • tRPC billing router (billingRouter)
 *
 * Environment variables required (see .env.example):
 *   STRIPE_SECRET_KEY        – sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET    – whsec_...  (from `stripe listen` or webhook dashboard)
 *   APP_URL                  – https://your-domain.com  (for redirect URLs)
 *
 * Stripe Price IDs must be created in your Stripe dashboard and set in ENV:
 *   STRIPE_PRICE_STARTER_MONTHLY      STRIPE_PRICE_STARTER_QUARTERLY
 *   STRIPE_PRICE_STARTER_BIANNUAL     STRIPE_PRICE_STARTER_ANNUAL
 *   STRIPE_PRICE_PRO_MONTHLY          STRIPE_PRICE_PRO_QUARTERLY
 *   STRIPE_PRICE_PRO_BIANNUAL         STRIPE_PRICE_PRO_ANNUAL
 *   STRIPE_PRICE_ENTERPRISE_MONTHLY   STRIPE_PRICE_ENTERPRISE_ANNUAL
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { orgAdminProcedure, orgProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";
import { parsedEnv } from "./services/config-schema";
import { getDb } from "./db";
import { recordUserInteraction } from "./interaction-logger";
import {
    organizations,
    organizationMembers,
    subscriptions,
    billingEvents,
    type Organization,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
    TRIAL_DAYS,
    daysRemainingInTrial,
    isAccessAllowed,
    isTrialExpired,
    trialEndsAt,
} from "./services/billing-entitlements";

// ─── Stripe Price Catalog ────────────────────────────────────────────────────

export interface PriceTier {
    plan: "starter" | "professional" | "enterprise";
    interval: "monthly" | "quarterly" | "biannual" | "annual";
    /** USD cents */
    amountCents: number;
    /** Human-readable label */
    label: string;
    /** Stripe Price ID — set via environment variable */
    stripePriceId: string;
    /** Marketing: discount vs monthly baseline */
    savingsLabel?: string;
}

export const PRICE_CATALOG: PriceTier[] = [
    // ── Starter ──────────────────────────────────────────────────────────────
    {
        plan: "starter", interval: "monthly", amountCents: 2900,
        label: "$29 / mo", stripePriceId: parsedEnv.STRIPE_PRICE_STARTER_MONTHLY,
    },
    {
        plan: "starter", interval: "quarterly", amountCents: 7900,
        label: "$79 / qtr", savingsLabel: "Save 9%", stripePriceId: parsedEnv.STRIPE_PRICE_STARTER_QUARTERLY,
    },
    {
        plan: "starter", interval: "biannual", amountCents: 14900,
        label: "$149 / 6mo", savingsLabel: "Save 14%", stripePriceId: parsedEnv.STRIPE_PRICE_STARTER_BIANNUAL,
    },
    {
        plan: "starter", interval: "annual", amountCents: 24900,
        label: "$249 / yr", savingsLabel: "Save 29%", stripePriceId: parsedEnv.STRIPE_PRICE_STARTER_ANNUAL,
    },
    // ── Professional ─────────────────────────────────────────────────────────
    {
        plan: "professional", interval: "monthly", amountCents: 7900,
        label: "$79 / mo", stripePriceId: parsedEnv.STRIPE_PRICE_PRO_MONTHLY,
    },
    {
        plan: "professional", interval: "quarterly", amountCents: 19900,
        label: "$199 / qtr", savingsLabel: "Save 16%", stripePriceId: parsedEnv.STRIPE_PRICE_PRO_QUARTERLY,
    },
    {
        plan: "professional", interval: "biannual", amountCents: 37900,
        label: "$379 / 6mo", savingsLabel: "Save 20%", stripePriceId: parsedEnv.STRIPE_PRICE_PRO_BIANNUAL,
    },
    {
        plan: "professional", interval: "annual", amountCents: 69900,
        label: "$699 / yr", savingsLabel: "Save 26%", stripePriceId: parsedEnv.STRIPE_PRICE_PRO_ANNUAL,
    },
    // ── Enterprise ───────────────────────────────────────────────────────────
    {
        plan: "enterprise", interval: "monthly", amountCents: 19900,
        label: "From $199 / mo", stripePriceId: parsedEnv.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    },
    {
        plan: "enterprise", interval: "annual", amountCents: 200000,
        label: "From $2,000 / yr", savingsLabel: "Save 16%", stripePriceId: parsedEnv.STRIPE_PRICE_ENTERPRISE_ANNUAL,
    },
];

export function getPriceTier(
    plan: PriceTier["plan"],
    interval: PriceTier["interval"],
): PriceTier | undefined {
    return PRICE_CATALOG.find((p) => p.plan === plan && p.interval === interval);
}

// ─── Stripe SDK (lazy init — only when key is present) ───────────────────────

let _stripe: import("stripe").default | null = null;

export async function getStripe(): Promise<import("stripe").default> {
    if (_stripe) return _stripe;
    if (!ENV.stripeSecretKey) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.",
        });
    }
    const Stripe = (await import("stripe")).default;
    _stripe = new Stripe(ENV.stripeSecretKey, { apiVersion: "2026-02-25.clover" });
    return _stripe;
}

// ─── Trial Helpers ───────────────────────────────────────────────────────────

export {
    TRIAL_DAYS,
    trialEndsAt,
    daysRemainingInTrial,
    isTrialExpired,
    isAccessAllowed,
};

// ─── Organization Bootstrapping ──────────────────────────────────────────────

export async function createOrganizationForUser(params: {
    slug: string;
    name: string;
    billingEmail: string;
    industry?: string;
    primaryJurisdiction?: "China" | "Saudi Arabia" | "Both" | "Other";
    ownerUserId?: number;
    ownerLocalUserId?: number;
}): Promise<Organization> {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const now = new Date();
    const trialEnd = trialEndsAt(now);

    const [inserted] = await db.insert(organizations).values({
        slug: params.slug,
        name: params.name,
        billingEmail: params.billingEmail,
        industry: params.industry,
        primaryJurisdiction: params.primaryJurisdiction ?? "Both",
        plan: "free_trial",
        trialStartedAt: now,
        trialEndsAt: trialEnd,
        isActive: 1,
        maxSeats: 5,
    }).returning({ id: organizations.id });

    const orgId = inserted.id;

    // Create the owner membership
    await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: params.ownerUserId,
        localUserId: params.ownerLocalUserId,
        role: "owner",
        status: "active",
    });

    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
    return org!;
}

// ─── tRPC Billing Router ─────────────────────────────────────────────────────

const planSchema = z.enum(["starter", "professional", "enterprise"]);
const intervalSchema = z.enum(["monthly", "quarterly", "biannual", "annual"]);

export const billingRouter = router({
    /** Return the public price catalog — no auth required */
    getPriceCatalog: publicProcedure.query(() => {
        return PRICE_CATALOG.map(({ plan, interval, amountCents, label, savingsLabel }) => ({
            plan,
            interval,
            amountCents,
            label,
            savingsLabel: savingsLabel ?? null,
        }));
    }),

    /** Return the current org's subscription status */
    getSubscriptionStatus: orgProcedure.query(async ({ ctx }) => {
        const db = await getDb();
        if (!db) return { plan: "free_trial" as const, trialDaysRemaining: 0, isActive: false };
        const orgId = ctx.organizationId;

        const [org] = await db
            .select()
            .from(organizations)
            .where(eq(organizations.id, orgId));

        if (!org) return { plan: "free_trial" as const, trialDaysRemaining: 0, isActive: false };

        const [sub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.organizationId, org.id))
            .limit(1);

        return {
            plan: org.plan,
            trialDaysRemaining: daysRemainingInTrial(org),
            trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
            isActive: isAccessAllowed(org, sub ?? null),
            subscriptionStatus: sub?.status ?? null,
            billingInterval: sub?.billingInterval ?? null,
            currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
            organizationId: org.id,
            organizationName: org.name,
        };
    }),

    /** Create a Stripe Checkout Session — redirects browser to hosted checkout */
    createCheckoutSession: orgAdminProcedure
        .input(z.object({
            plan: planSchema,
            interval: intervalSchema,
            organizationId: z.number().int().positive(),
        }))
        .mutation(async ({ ctx, input }) => {
            if (input.organizationId !== ctx.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Cannot manage billing for a different organization." });
            }

            const stripe = await getStripe();
            const tier = getPriceTier(input.plan, input.interval);

            if (!tier) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan/interval combination" });
            if (!tier.stripePriceId) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Stripe Price ID not configured for ${input.plan}/${input.interval}. Set the STRIPE_PRICE_* env variables.`,
                });
            }

            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

            const [org] = await db
                .select()
                .from(organizations)
                .where(eq(organizations.id, input.organizationId));

            if (!org) throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });

            const userEmail = (ctx.user as { email?: string }).email;
            const appUrl = ENV.appUrl || "http://localhost:3000";

            // Create or reuse Stripe Customer
            let customerId = org.stripeCustomerId ?? undefined;
            if (!customerId && userEmail) {
                const customer = await stripe.customers.create({
                    email: userEmail,
                    name: org.name,
                    metadata: { organizationId: String(org.id), organizationSlug: org.slug },
                });
                customerId = customer.id;
                await db
                    .update(organizations)
                    .set({ stripeCustomerId: customerId })
                    .where(eq(organizations.id, org.id));
            }

            const session = await stripe.checkout.sessions.create({
                mode: "subscription",
                customer: customerId,
                line_items: [{ price: tier.stripePriceId, quantity: 1 }],
                metadata: {
                    organizationId: String(org.id),
                    plan: input.plan,
                    interval: input.interval,
                    stripePriceId: tier.stripePriceId,
                },
                subscription_data: {
                    metadata: {
                        organizationId: String(org.id),
                        plan: input.plan,
                        interval: input.interval,
                        stripePriceId: tier.stripePriceId,
                    },
                },
                success_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=1`,
                cancel_url: `${appUrl}/pricing?cancelled=1`,
                allow_promotion_codes: true,
                billing_address_collection: "auto",
            });

            return { checkoutUrl: session.url };
        }),

    /** Open Stripe Customer Portal (manage / cancel subscription) */
    createPortalSession: orgAdminProcedure
        .input(z.object({ organizationId: z.number().int().positive() }))
        .mutation(async ({ ctx, input }) => {
            if (input.organizationId !== ctx.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Cannot manage billing for a different organization." });
            }

            const stripe = await getStripe();
            const db = await getDb();
            if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

            const [org] = await db
                .select()
                .from(organizations)
                .where(eq(organizations.id, input.organizationId));

            if (!org?.stripeCustomerId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "No billing account found. Please subscribe first." });
            }

            const appUrl = ENV.appUrl || "http://localhost:3000";

            const portal = await stripe.billingPortal.sessions.create({
                customer: org.stripeCustomerId,
                return_url: `${appUrl}/billing`,
            });

            return { portalUrl: portal.url };
        }),

    /** Get billing history for an organization */
    getBillingHistory: orgProcedure
        .input(z.object({ organizationId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
            if (input.organizationId !== ctx.organizationId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "Cannot read billing for a different organization." });
            }

            const db = await getDb();
            if (!db) return [];

            const events = await db
                .select()
                .from(billingEvents)
                .where(eq(billingEvents.organizationId, input.organizationId))
                .limit(50);

            return events.map((e) => ({
                id: e.id,
                eventType: e.eventType,
                status: e.status,
                amountCents: e.amountCents,
                currency: e.currency,
                description: e.description,
                createdAt: e.createdAt.toISOString(),
            }));
        }),

    /** Create a new organization (called on first sign-up / onboarding) */
    createOrganization: protectedProcedure
        .input(z.object({
            name: z.string().min(2, "Organization name must be at least 2 characters").max(255),
            billingEmail: z.string().email(),
            industry: z.string().max(120).optional(),
            primaryJurisdiction: z.enum(["China", "Saudi Arabia", "Both", "Other"]).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const startedAt = Date.now();
            if (ctx.organizationId) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "This account already belongs to an organization.",
                });
            }

            const userId = (ctx.user as { id: number }).id;
            const slug = input.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 80);

            const org = await createOrganizationForUser({
                slug: `${slug}-${userId}`,
                name: input.name,
                billingEmail: input.billingEmail,
                industry: input.industry,
                primaryJurisdiction: input.primaryJurisdiction,
                ownerUserId: userId,
            });

            void recordUserInteraction(ctx, {
                context: "billing.organization",
                action: "billing_organization_created",
                entityType: "organization",
                inputSnapshot: {
                    name: input.name,
                    billingEmail: input.billingEmail,
                    industry: input.industry ?? null,
                    primaryJurisdiction: input.primaryJurisdiction ?? null,
                },
                outputRef: {
                    organizationId: org.id,
                    organizationSlug: org.slug,
                    ownerUserId: userId,
                },
                durationMs: Date.now() - startedAt,
            });

            return {
                id: org.id,
                slug: org.slug,
                name: org.name,
                plan: org.plan,
                trialEndsAt: org.trialEndsAt?.toISOString(),
            };
        }),
});
