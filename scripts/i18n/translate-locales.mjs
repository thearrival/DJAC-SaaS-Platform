#!/usr/bin/env node
/**
 * translate-locales.mjs — DJAC i18n parity pipeline.
 *
 * Keeps every locale pack in client/src/contexts/LocaleContext.tsx at full key
 * parity with the English source pack, using OpenAI for translation.
 *
 * Usage:
 *   node scripts/i18n/translate-locales.mjs --check
 *   node scripts/i18n/translate-locales.mjs --translate --locales fr,es
 *   node scripts/i18n/translate-locales.mjs --apply
 *   node scripts/i18n/translate-locales.mjs --translate --locales zh --missing-only
 *
 * Requires OPENAI_API_KEY in the environment or .env.local.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const CONTEXT_FILE = path.join(ROOT, "client/src/contexts/LocaleContext.tsx");
const OUT_DIR = path.join(ROOT, ".runtime/i18n");

const SOURCE_LOCALE = "en";
const ALL_LOCALES = ["en", "ar", "zh", "fr", "es", "de", "ja", "ko", "pt"];

const LANGUAGE_NAMES = {
  ar: "Arabic",
  zh: "Simplified Chinese (Mainland China)",
  fr: "French (France)",
  es: "Spanish (Spain / Latin America)",
  de: "German (Germany)",
  ja: "Japanese (Japan)",
  ko: "Korean (South Korea)",
  pt: "Portuguese (Brazil)",
};

// Terms kept in their canonical form across all locales.
const KEEP_TERMS = [
  "DJAC",
  "PIPL",
  "CSL",
  "DSL",
  "PDPL",
  "NCA-ECC",
  "GDPR",
  "UK GDPR",
  "NIS2",
  "DORA",
  "LGPD",
  "PIPA",
  "PDPA",
  "POPIA",
  "APPI",
  "HIPAA",
  "SOX",
  "GLBA",
  "MAS TRM",
  "PCI DSS",
  "PCI-DSS",
  "ISO 27001",
  "ISO 27701",
  "SOC 2",
  "EU AI Act",
  "CCPA",
  "CPRA",
  "SDAIA",
  "CAC",
  "ANPD",
  "PIPC",
  "ICO",
  "DSR",
  "DSAR",
  "RBAC",
  "MFA",
  "2FA",
  "TOTP",
  "OTP",
  "API",
  "PDF",
  "SLA",
  "KPI",
  "CTEM",
  "RAG",
  "AI",
  "GPT",
  "URL",
  "CSV",
  "ID",
  "IP",
];

const MODEL = process.env.OPENAI_TRANSLATE_MODEL || "gemini-2.5-flash";
const BATCH_SIZE = process.env.FORGE_PROXY_URL ? 600 : 60;
const CONCURRENCY = 4;
const MAX_CHUNK_RETRIES = 3;

/** Resolve LLM gateway credentials (Forge-compatible /v1/chat/completions). */
function resolveGateway() {
  loadDotEnvLocal();
  const url =
    process.env.BUILT_IN_FORGE_API_URL ||
    process.env.FORGE_API_URL ||
    "https://forge.manus.im";
  const key = process.env.BUILT_IN_FORGE_API_KEY || process.env.FORGE_API_KEY;
  // Also accept a direct OpenAI key if present.
  if (
    !key &&
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY.length > 20
  ) {
    return { url: "https://api.openai.com", key: process.env.OPENAI_API_KEY };
  }
  return { url: url.replace(/\/$/, ""), key };
}

// Optional: route requests through the temporary translation job deployed on
// Vercel (used when the Forge gateway is only reachable from that runtime).
const PROXY_URL = process.env.FORGE_PROXY_URL || "";

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    check: args.includes("--check"),
    translate: args.includes("--translate"),
    apply: args.includes("--apply"),
    missingOnly: args.includes("--missing-only"),
    locales: (() => {
      const i = args.indexOf("--locales");
      if (i === -1) return [];
      return (args[i + 1] || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
    })(),
  };
}

function loadDotEnvLocal() {
  if (process.env.OPENAI_API_KEY) return;
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

/** Extract the messages object from the TSX file via a temp ESM module. */
async function extractMessages() {
  const src = fs.readFileSync(CONTEXT_FILE, "utf8");
  const lines = src.split(/\r?\n/);
  const startIdx = lines.findIndex(l => l.startsWith("const messages"));
  if (startIdx === -1) throw new Error("messages object not found");
  let endIdx = -1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i] === "};") {
      endIdx = i;
      break;
    }
  }
  if (endIdx === -1) throw new Error("messages object end not found");
  const inner = lines.slice(startIdx + 1, endIdx).join("\n");
  const tmp = path.join(os.tmpdir(), `djac-i18n-${Date.now()}.mjs`);
  fs.writeFileSync(tmp, `export const messages = {\n${inner}\n};\n`, "utf8");
  try {
    const mod = await import(pathToFileURL(tmp).href);
    return { messages: mod.messages, startIdx, endIdx };
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

function systemPrompt(locale) {
  return [
    "You are a senior localization specialist for DJAC, an enterprise compliance and data-protection SaaS platform.",
    `Translate UI strings from English into ${LANGUAGE_NAMES[locale]} (locale code: ${locale}).`,
    "Register: professional, concise, natural for a software product interface. Prefer standard industry terminology used by compliance/legal software in the target market.",
    `Never translate these terms; keep them exactly as written: ${KEEP_TERMS.join(", ")}.`,
    "Preserve interpolation placeholders like {email}, {days}, {plan} exactly as they appear.",
    "Preserve punctuation style appropriate to the target locale. Do not add quotes around values.",
    "Respond with ONLY a valid JSON object mapping each input key to its translated string. Every input key must appear exactly once in the output.",
  ].join(" ");
}

async function translateChunk(gateway, locale, chunk, attempt = 1) {
  try {
    let raw;
    if (PROXY_URL) {
      // Route through the temporary translation job deployed on Vercel
      // (Forge gateway is only reachable from the deployment runtime).
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ locale, pairs: chunk }),
      });
      if (!res.ok) {
        throw new Error(
          `${res.status} ${res.statusText} — ${await res.text()}`
        );
      }
      const data = await res.json();
      raw = JSON.stringify(data.results ?? {});
    } else {
      const res = await fetch(`${gateway.url}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${gateway.key}`,
        },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt(locale) },
            {
              role: "user",
              content: JSON.stringify(
                Object.fromEntries(chunk.map(([k, v]) => [k, v]))
              ),
            },
          ],
        }),
      });
      if (!res.ok) {
        throw new Error(
          `${res.status} ${res.statusText} — ${await res.text()}`
        );
      }
      const data = await res.json();
      raw = data.choices?.[0]?.message?.content ?? "{}";
    }
    const cleaned = raw
      .replace(/^```(?:json)?\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    const out = {};
    const missing = [];
    for (const [k] of chunk) {
      const v = parsed[k];
      if (typeof v === "string" && v.trim().length > 0) out[k] = v.trim();
      else missing.push(k);
    }
    if (missing.length > 0 && attempt < MAX_CHUNK_RETRIES) {
      console.warn(
        `[${locale}] chunk retry (${attempt}): ${missing.length} keys missing/empty`
      );
      await new Promise(r => setTimeout(r, 1500 * attempt));
      const sub = await translateChunk(
        gateway,
        locale,
        chunk.filter(([k]) => missing.includes(k)),
        attempt + 1
      );
      return { ...out, ...sub };
    }
    for (const k of missing) {
      const fb = chunk.find(([ck]) => ck === k)?.[1];
      if (fb !== undefined) out[k] = fb; // graceful fallback to English
    }
    return out;
  } catch (err) {
    if (attempt >= MAX_CHUNK_RETRIES) {
      console.error(
        `[${locale}] chunk failed after ${attempt} attempts:`,
        err.message
      );
      return Object.fromEntries(chunk); // last-resort English fallback
    }
    await new Promise(r => setTimeout(r, 2000 * attempt));
    return translateChunk(gateway, locale, chunk, attempt + 1);
  }
}

async function run() {
  const args = parseArgs();
  const { messages, startIdx, endIdx } = await extractMessages();
  const enKeys = Object.keys(messages.en).sort();
  console.log(`Source locale "${SOURCE_LOCALE}": ${enKeys.length} keys`);

  const report = {};
  for (const loc of ALL_LOCALES) {
    if (loc === SOURCE_LOCALE) continue;
    const have = messages[loc] ? Object.keys(messages[loc]).length : 0;
    report[loc] = {
      have,
      missing: enKeys.filter(k => !(k in (messages[loc] || {}))),
    };
  }

  if (args.check || (!args.translate && !args.apply)) {
    console.table(
      Object.entries(report).map(([loc, r]) => ({
        locale: loc,
        keys: r.have,
        missing: r.missing.length,
        parity: r.missing.length === 0 ? "OK" : "GAPS",
      }))
    );
    return;
  }

  if (args.apply) {
    const merged = {};
    for (const loc of ALL_LOCALES) {
      if (loc === SOURCE_LOCALE) continue;
      const file = path.join(OUT_DIR, `${loc}.json`);
      if (!fs.existsSync(file)) {
        console.warn(`[--apply] no translation file for "${loc}", skipping`);
        continue;
      }
      const translations = JSON.parse(fs.readFileSync(file, "utf8"));
      // Start from existing pack, overlay fresh translations, drop stale keys.
      const base =
        loc === SOURCE_LOCALE
          ? {}
          : Object.fromEntries(
              Object.entries(messages[loc] || {}).filter(([k]) =>
                enKeys.includes(k)
              )
            );
      merged[loc] = { ...base, ...translations };
    }

    const lines = fs.readFileSync(CONTEXT_FILE, "utf8").split(/\r?\n/);
    const header = lines.slice(0, startIdx + 1); // up to and incl. "const messages ... = {"
    const footer = lines.slice(endIdx); // from "};" onwards
    const blocks = [];
    for (const loc of ALL_LOCALES) {
      const entries = Object.entries(
        loc === SOURCE_LOCALE ? messages.en : merged[loc]
      ).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      const body = entries
        .map(([k, v]) => `    ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
        .join("\n");
      blocks.push(`  ${JSON.stringify(loc)}: {\n${body}\n  },`);
    }
    const next = [...header, ...blocks.join("\n").split("\n"), ...footer];
    fs.writeFileSync(CONTEXT_FILE, next.join("\n"), "utf8");
    const total = enKeys.length * (ALL_LOCALES.length - 1);
    console.log(
      `[--apply] rewrote LocaleContext.tsx — ${
        ALL_LOCALES.length
      } locale packs, ~${total} translated strings total`
    );
    return;
  }

  // ── translate mode ──
  const gateway = resolveGateway();
  if (!gateway.key && !PROXY_URL) {
    console.error(
      "LLM gateway credentials required for --translate (BUILT_IN_FORGE_API_KEY / FORGE_API_KEY / OPENAI_API_KEY / FORGE_PROXY_URL)"
    );
    process.exit(1);
  }
  if (PROXY_URL) {
    console.log("Routing translations through FORGE_PROXY_URL job");
  } else {
    console.log(`Gateway: ${gateway.url} · model: ${MODEL}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const targets =
    args.locales.length > 0
      ? args.locales
      : ALL_LOCALES.filter(l => l !== SOURCE_LOCALE);

  for (const loc of targets) {
    if (loc === SOURCE_LOCALE) continue;
    let pending;
    if (args.missingOnly) {
      pending = report[loc].missing;
      console.log(`[${loc}] translating ${pending.length} MISSING keys only`);
    } else {
      pending = [...enKeys];
      console.log(`[${loc}] translating all ${pending.length} keys (fresh)`);
    }
    const existing = fs.existsSync(path.join(OUT_DIR, `${loc}.json`))
      ? JSON.parse(fs.readFileSync(path.join(OUT_DIR, `${loc}.json`), "utf8"))
      : {};
    pending = pending.filter(k => !(k in existing));
    if (pending.length === 0) {
      console.log(`[${loc}] nothing to do`);
      continue;
    }

    const pairs = pending.map(k => [k, messages.en[k]]);
    const chunks = [];
    for (let i = 0; i < pairs.length; i += BATCH_SIZE)
      chunks.push(pairs.slice(i, i + BATCH_SIZE));

    let done = 0;
    const results = {};
    const queue = [...chunks];
    async function worker() {
      while (queue.length > 0) {
        const chunk = queue.shift();
        if (!chunk) break;
        const out = await translateChunk(gateway, loc, chunk);
        Object.assign(results, out);
        done += chunk.length;
        console.log(`[${loc}] ${done}/${pairs.length}`);
      }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    fs.writeFileSync(
      path.join(OUT_DIR, `${loc}.json`),
      JSON.stringify({ ...existing, ...results }, null, 2),
      "utf8"
    );
    const stillMissing = pending.filter(k => results[k] === messages.en[k]);
    console.log(
      `[${loc}] saved ${Object.keys(results).length} translations` +
        (stillMissing.length
          ? ` (${stillMissing.length} fell back to English)`
          : "")
    );
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
