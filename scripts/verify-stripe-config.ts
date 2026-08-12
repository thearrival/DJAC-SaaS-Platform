import "dotenv/config";
import {
  evaluateStripeBillingConfig,
  STRIPE_PRICE_ENV_KEYS,
} from "../server/_core/env";

const config = evaluateStripeBillingConfig({
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  ...Object.fromEntries(STRIPE_PRICE_ENV_KEYS.map(k => [k, process.env[k]])),
});

console.log("=== DJAC Stripe Configuration Validation ===");
console.log(`Stripe Billing Enabled: ${config.enabled}`);
console.log(`All Config Ready:      ${config.ready}`);
console.log(`Partially Configured:  ${config.partiallyConfigured}`);
console.log(
  `Price IDs Configured:  ${config.configuredPriceCount} / ${STRIPE_PRICE_ENV_KEYS.length}`
);

if (config.missing.length > 0) {
  console.log(`\nMissing env vars (${config.missing.length}):`);
  config.missing.forEach(m => console.log(`  - ${m}`));
} else {
  console.log(`\nAll Stripe environment variables are configured!`);
}

console.log(
  `\nSecret Key:     ${process.env.STRIPE_SECRET_KEY ? "LOADED (" + process.env.STRIPE_SECRET_KEY.substring(0, 16) + "...)" : "MISSING"}`
);
console.log(
  `Webhook Secret: ${process.env.STRIPE_WEBHOOK_SECRET ? "LOADED (" + process.env.STRIPE_WEBHOOK_SECRET.substring(0, 12) + "...)" : "MISSING"}`
);

// Price ID verification
console.log(`\n--- Price ID Mapping ---`);
for (const key of STRIPE_PRICE_ENV_KEYS) {
  const val = process.env[key] ?? "";
  console.log(`${key}: ${val ? "SET (" + val + ")" : "EMPTY"}`);
}
