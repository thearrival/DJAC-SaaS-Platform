/**
 * DJAC Stripe Billing — Full Integration Test
 * Tests Stripe SDK connectivity, price ID validation, and webhook processing
 */
import "dotenv/config";
import Stripe from "stripe";
import {
  evaluateStripeBillingConfig,
  STRIPE_PRICE_ENV_KEYS,
} from "../server/_core/env";

type TestResult = { name: string; passed: boolean; detail: string };

async function run(): Promise<void> {
  const results: TestResult[] = [];
  const startTime = Date.now();

  function addResult(name: string, passed: boolean, detail: string) {
    results.push({ name, passed, detail });
    const icon = passed ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${name}`);
    if (!passed) console.log(`        ${detail}`);
  }

  console.log("=".repeat(70));
  console.log("  DJAC Stripe Billing — Full Integration Test Suite");
  console.log("=".repeat(70));
  console.log();

  // ── 1. Environment Configuration Check ──────────────────────────────
  console.log("── 1. Environment Configuration ──");
  const config = evaluateStripeBillingConfig({
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    ...Object.fromEntries(STRIPE_PRICE_ENV_KEYS.map(k => [k, process.env[k]])),
  });

  addResult("Stripe billing enabled", config.enabled, "Not enabled");
  addResult("All config ready", config.ready, config.missing.join(", "));
  addResult(
    "Secret key configured",
    Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    "Missing"
  );
  addResult(
    "Webhook secret configured",
    Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
    "Missing"
  );

  const priceCount = STRIPE_PRICE_ENV_KEYS.filter(k =>
    process.env[k]?.trim()
  ).length;
  addResult(
    `Price IDs configured (${priceCount}/12)`,
    priceCount === 12,
    `${priceCount}/12 configured`
  );

  // ── 2. Stripe SDK Initialization ────────────────────────────────────
  console.log("\n── 2. Stripe SDK Initialization ──");
  let stripe: Stripe;
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-02-25.clover",
    });
    addResult("Stripe SDK initialized", true, "");
  } catch (err) {
    addResult("Stripe SDK initialized", false, String(err));
    finish(results, startTime);
    return;
  }

  // ── 3. Price ID Validation ─────────────────────────────────────────
  console.log("\n── 3. Stripe Price ID Validation ──");
  const priceMap: Record<
    string,
    {
      priceId: string;
      valid: boolean;
      amount: number | null;
      currency: string | null;
      product: string | null;
    }
  > = {};

  for (const key of STRIPE_PRICE_ENV_KEYS) {
    const priceId = process.env[key]?.trim();
    if (!priceId) {
      addResult(`Price: ${key}`, false, "No price ID configured");
      continue;
    }

    try {
      const price = await stripe.prices.retrieve(priceId);
      const valid = price.active && price.type === "recurring";
      priceMap[key] = {
        priceId,
        valid,
        amount: price.unit_amount,
        currency: price.currency,
        product:
          typeof price.product === "string"
            ? price.product
            : (price.product?.name ?? null),
      };

      const planInterval = key
        .replace("STRIPE_PRICE_", "")
        .toLowerCase()
        .replace("_", "/");
      addResult(
        `Price: ${planInterval}`,
        valid,
        valid
          ? `$${(price.unit_amount! / 100).toFixed(2)} ${price.currency?.toUpperCase()}`
          : `Not active or not recurring`
      );
    } catch (err) {
      addResult(
        `Price: ${key}`,
        false,
        `Stripe API error: ${(err as Error).message}`
      );
    }
  }

  // ── 4. Price Amount Verification ────────────────────────────────────
  console.log("\n── 4. Price Amount Verification vs Catalog ──");
  const expectedPrices: Record<string, number> = {
    STRIPE_PRICE_STARTER_MONTHLY: 2900,
    STRIPE_PRICE_STARTER_QUARTERLY: 7900,
    STRIPE_PRICE_STARTER_BIANNUAL: 14900,
    STRIPE_PRICE_STARTER_ANNUAL: 24900,
    STRIPE_PRICE_PRO_MONTHLY: 7900,
    STRIPE_PRICE_PRO_QUARTERLY: 19900,
    STRIPE_PRICE_PRO_BIANNUAL: 37900,
    STRIPE_PRICE_PRO_ANNUAL: 69900,
    STRIPE_PRICE_ENTERPRISE_MONTHLY: 19900,
    STRIPE_PRICE_ENTERPRISE_QUARTERLY: 54900,
    STRIPE_PRICE_ENTERPRISE_BIANNUAL: 99900,
    STRIPE_PRICE_ENTERPRISE_ANNUAL: 200000,
  };

  let amountMismatches = 0;
  for (const [key, expected] of Object.entries(expectedPrices)) {
    const price = priceMap[key];
    if (!price || !price.valid) continue;
    if (price.amount !== expected) {
      amountMismatches++;
      addResult(
        `Amount match: ${key.split("_").slice(2).join("_").toLowerCase()}`,
        false,
        `Expected ${expected} cents, got ${price.amount}`
      );
    }
  }
  if (amountMismatches === 0) {
    addResult(
      "All 12 price amounts match catalog",
      true,
      "All prices verified against PRICE_CATALOG"
    );
  }

  // ── 5. Checkout Session Creation Test ───────────────────────────────
  console.log("\n── 5. Checkout Session Creation (API-level) ──");
  try {
    const priceId = process.env.STRIPE_PRICE_STARTER_MONTHLY!;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        organizationId: "test-99999",
        plan: "starter",
        interval: "monthly",
      },
      success_url: "http://localhost:3000/billing?success=1",
      cancel_url: "http://localhost:3000/pricing?cancelled=1",
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_email: "test@example.com",
    });

    addResult(
      "Checkout session created",
      !!session.url,
      `Session ID: ${session.id}`
    );
    addResult(
      "Checkout URL returned",
      session.url!.startsWith("https://checkout.stripe.com"),
      session.url ?? "No URL"
    );
    addResult(
      "Metadata preserved",
      session.metadata?.plan === "starter",
      `Plan: ${session.metadata?.plan}`
    );

    // Clean up: expire the session
    await stripe.checkout.sessions.expire(session.id);
  } catch (err) {
    addResult(
      "Checkout session creation",
      false,
      `API error: ${(err as Error).message}`
    );
  }

  // ── 6. Customer Portal Test ─────────────────────────────────────────
  console.log("\n── 6. Customer Portal Session ──");
  try {
    // Create a test customer first
    const customer = await stripe.customers.create({
      email: "test-integration@yalla-hack.com",
      name: "DJAC Test Customer",
      metadata: { source: "integration-test" },
    });

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: "http://localhost:3000/billing",
    });

    addResult(
      "Customer created (test)",
      !!customer.id,
      `Customer ID: ${customer.id}`
    );
    addResult("Portal session created", !!portal.url, `Portal URL returned`);

    // Clean up: delete test customer
    await stripe.customers.del(customer.id);
  } catch (err) {
    addResult(
      "Customer portal test",
      false,
      `API error: ${(err as Error).message}`
    );
  }

  // ── 7. Webhook Signature Verification ───────────────────────────────
  console.log("\n── 7. Webhook Signature Verification ──");
  try {
    const testPayload = JSON.stringify({
      id: "evt_test_123",
      object: "event",
      type: "checkout.session.completed",
      data: {
        object: { id: "cs_test_123", metadata: { organizationId: "1" } },
      },
    });

    // This will fail (expected) because we're using a fake signature
    // but it verifies the webhook construction code works
    try {
      stripe.webhooks.constructEvent(
        testPayload,
        "fake_sig",
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      addResult(
        "Webhook signature verification",
        false,
        "Should have thrown with fake signature"
      );
    } catch (err) {
      const msg = (err as Error).message;
      const isExpectedError =
        msg.includes("No signatures found") ||
        msg.includes("Signature") ||
        msg.includes("timestamp and signatures") ||
        msg.includes("Unable to extract");
      addResult(
        "Webhook verification correctly rejects invalid signatures",
        isExpectedError,
        isExpectedError ? "Expected behavior" : `Unexpected error: ${msg}`
      );
    }
  } catch (err) {
    addResult("Webhook signature verification", false, String(err));
  }

  // ── 8. Product Catalog Completeness ─────────────────────────────────
  console.log("\n── 8. Product Catalog Completeness ──");
  const requiredCombos = [
    ["starter", "monthly"],
    ["starter", "quarterly"],
    ["starter", "biannual"],
    ["starter", "annual"],
    ["pro", "monthly"],
    ["pro", "quarterly"],
    ["pro", "biannual"],
    ["pro", "annual"],
    ["enterprise", "monthly"],
    ["enterprise", "quarterly"],
    ["enterprise", "biannual"],
    ["enterprise", "annual"],
  ];

  let combosValid = 0;
  for (const [plan, interval] of requiredCombos) {
    const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()}`;
    const price = priceMap[envKey];
    if (price?.valid) combosValid++;
  }
  addResult(
    `Valid plan/interval combinations (${combosValid}/12)`,
    combosValid === 12,
    `${combosValid}/12 valid`
  );

  // Check product names are consistent
  console.log("\n  Product names:");
  const productNames = new Set<string>();
  for (const p of Object.values(priceMap)) {
    if (p?.product) productNames.add(p.product);
  }
  for (const name of [...productNames].sort()) {
    console.log(`    - ${name}`);
  }

  // ── 9. Currency Consistency ─────────────────────────────────────────
  console.log("\n── 9. Currency Consistency ──");
  const currencies = new Set(
    Object.values(priceMap)
      .filter(p => p?.valid)
      .map(p => p!.currency)
  );
  const allUSD = currencies.size === 1 && currencies.has("usd");
  addResult(
    "All prices in USD",
    allUSD,
    `Currencies: ${[...currencies].join(", ")}`
  );

  // ── 10. Pricing Hierarchy ───────────────────────────────────────────
  console.log("\n── 10. Pricing Hierarchy Validation ──");
  const intervals = ["monthly", "quarterly", "biannual", "annual"] as const;

  let hierarchyOk = true;
  for (const iv of intervals) {
    const starterKey = `STRIPE_PRICE_STARTER_${iv.toUpperCase()}`;
    const proKey = `STRIPE_PRICE_PRO_${iv.toUpperCase()}`;
    const enterpriseKey = `STRIPE_PRICE_ENTERPRISE_${iv.toUpperCase()}`;

    const starterPrice = priceMap[starterKey]?.amount ?? 0;
    const proPrice = priceMap[proKey]?.amount ?? 0;
    const enterprisePrice = priceMap[enterpriseKey]?.amount ?? 0;

    if (proPrice <= starterPrice || enterprisePrice <= proPrice) {
      hierarchyOk = false;
    }
  }
  addResult(
    "Starter < Professional < Enterprise for all intervals",
    hierarchyOk,
    hierarchyOk
      ? "Correct pricing hierarchy"
      : "Price hierarchy violation detected"
  );

  // ── Finish ──────────────────────────────────────────────────────────
  finish(results, startTime);
}

function finish(results: TestResult[], startTime: number) {
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log("\n" + "=".repeat(70));
  console.log(
    `  RESULTS: ${passed} passed, ${failed} failed, ${results.length} total`
  );
  console.log(`  Duration: ${duration}s`);
  console.log("=".repeat(70));

  if (failed > 0) {
    console.log("\n  FAILED TESTS:");
    for (const r of results) {
      if (!r.passed) console.log(`    - ${r.name}: ${r.detail}`);
    }
  }

  console.log(
    `\nIntegration test complete. ${failed === 0 ? "All checks passed!" : `${failed} issue(s) need attention.`}`
  );
}

run().catch(err => {
  console.error("Fatal error in integration test:", err);
  process.exit(1);
});
