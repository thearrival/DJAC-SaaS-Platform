// TEMPORARY i18n translation job - deleted immediately after the batch runs.
// POST { locale, pairs: [[key, english], ...] } -> { results, failures, errors }
const TOKEN = "e77a06bf9eb69da817a1f9622c673cd286225403633deb7a";

const MODEL = "gemini-2.5-flash";
const CHUNK_SIZE = 40;
const CONCURRENCY = 10;
const MAX_RETRIES = 3;

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

const FEW_SHOT_INPUT = {
  menuRiskRegister: "Risk Register",
  commonSave: "Save",
  pageDashboard: "Dashboard",
};

// ASCII-escaped target-language examples (no encoding pitfalls in transit).
const FEW_SHOT_OUTPUT = {
  ar: {
    menuRiskRegister:
      "\u0633\u062c\u0644 \u0627\u0644\u0645\u062e\u0627\u0637\u0631",
    commonSave: "\u062d\u0641\u0638",
    pageDashboard:
      "\u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645",
  },
  zh: {
    menuRiskRegister: "\u98ce\u9669\u767b\u8bb0\u518c",
    commonSave: "\u4fdd\u5b58",
    pageDashboard: "\u4eea\u8868\u677f",
  },
  fr: {
    menuRiskRegister: "Registre des risques",
    commonSave: "Enregistrer",
    pageDashboard: "Tableau de bord",
  },
  es: {
    menuRiskRegister: "Registro de riesgos",
    commonSave: "Guardar",
    pageDashboard: "Panel de control",
  },
  de: {
    menuRiskRegister: "Risikoregister",
    commonSave: "Speichern",
    pageDashboard: "\u00dcbersicht",
  },
  ja: {
    menuRiskRegister: "\u30ea\u30b9\u30af\u767b\u9332\u7c3f",
    commonSave: "\u4fdd\u5b58",
    pageDashboard: "\u30c0\u30c3\u30b7\u30e5\u30dc\u30fc\u30c9",
  },
  ko: {
    menuRiskRegister: "\uc704\ud5d8 \ub4f1\ub85d\ubd80",
    commonSave: "\uc800\uc7a5",
    pageDashboard: "\ub300\uc2dc\ubcf4\ub4dc",
  },
  pt: {
    menuRiskRegister: "Registro de riscos",
    commonSave: "Salvar",
    pageDashboard: "Painel",
  },
};

let lastError = "";

function systemPrompt(locale) {
  const out = FEW_SHOT_OUTPUT[locale] ?? FEW_SHOT_OUTPUT.fr;
  return [
    "You are a senior localization specialist for DJAC, an enterprise compliance and data-protection SaaS platform.",
    "",
    "TASK: You will receive a JSON object where each value is an English UI string. Translate EVERY value into " +
      LANGUAGE_NAMES[locale] +
      " (locale code: " +
      locale +
      ").",
    "Return a JSON object with the SAME keys, each mapped to the translated string.",
    "",
    "CRITICAL RULES:",
    "1. NEVER copy the English text as your output. Every output value MUST be written in " +
      LANGUAGE_NAMES[locale] +
      ". If a response is returned unchanged from English, the task is considered FAILED.",
    "2. Keep these terms exactly as written: " + KEEP_TERMS.join(", ") + ".",
    "3. Preserve interpolation placeholders like {email}, {days}, {plan} exactly.",
    "4. Professional, concise software-UI register using standard compliance/legal terminology of the target market.",
    "",
    "EXAMPLE of correct behaviour:",
    "Input: " + JSON.stringify(FEW_SHOT_INPUT),
    "Correct output: " + JSON.stringify(out),
    "(Note how every output value is fully translated into " +
      LANGUAGE_NAMES[locale] +
      ". Copying the English input would be WRONG.)",
    "",
    "Respond with ONLY the JSON object. No markdown, no explanations.",
    "",
    "Reminder: output language = " + LANGUAGE_NAMES[locale] + ".",
  ].join("\n");
}

async function callLLM(gateway, apiKey, locale, pairs) {
  const res = await fetch(`${gateway.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt(locale) },
        { role: "user", content: JSON.stringify(Object.fromEntries(pairs)) },
      ],
      max_tokens: 16384,
      thinking: { budget_tokens: 128 },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `LLM ${res.status} ${res.statusText}: ${text.slice(0, 250)}`
    );
  }
  const data = await res.json();
  let raw = data.choices?.[0]?.message?.content ?? "";
  if (!raw && Array.isArray(data.choices?.[0]?.message?.content)) {
    raw = data.choices[0].message.content.map(p => p.text ?? "").join("");
  }
  raw = String(raw)
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim();
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`bad JSON from LLM (${raw.slice(0, 120)})`);
  }
}

async function translateChunk(gateway, apiKey, locale, pairs, attempt = 1) {
  try {
    const parsed = await callLLM(gateway, apiKey, locale, pairs);
    const out = {};
    const missing = [];
    for (const [k] of pairs) {
      const v = parsed[k];
      if (typeof v === "string" && v.trim().length > 0) out[k] = v.trim();
      else missing.push(k);
    }
    if (missing.length > 0 && attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 1200 * attempt));
      const sub = await translateChunk(
        gateway,
        apiKey,
        locale,
        pairs.filter(([k]) => missing.includes(k)),
        attempt + 1
      );
      return { ...out, ...sub };
    }
    // Mark unresolvable keys as null so the caller can retry them later
    // instead of silently accepting English fallbacks.
    for (const k of missing) {
      out[k] = null;
    }
    return out;
  } catch (err) {
    lastError = String(err.message || err).slice(0, 300);
    if (attempt >= MAX_RETRIES) {
      throw err;
    }
    await new Promise(r => setTimeout(r, 1500 * attempt));
    return translateChunk(gateway, apiKey, locale, pairs, attempt + 1);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST" || req.query.t !== TOKEN) {
    res.status(404).send("Not Found");
    return;
  }
  const gateway = process.env.BUILT_IN_FORGE_API_URL || "";
  const apiKey = process.env.BUILT_IN_FORGE_API_KEY || "";
  if (!gateway || !apiKey) {
    res.status(500).json({ error: "gateway not configured" });
    return;
  }
  const { locale, pairs } = req.body || {};
  if (!locale || !Array.isArray(pairs) || pairs.length === 0) {
    res.status(400).json({ error: "locale and pairs required" });
    return;
  }

  const chunks = [];
  for (let i = 0; i < pairs.length; i += CHUNK_SIZE) {
    chunks.push(pairs.slice(i, i + CHUNK_SIZE));
  }

  const results = {};
  const errors = [];
  const queue = [...chunks];
  async function worker() {
    while (queue.length > 0) {
      const chunk = queue.shift();
      if (!chunk) break;
      try {
        const out = await translateChunk(gateway, apiKey, locale, chunk);
        Object.assign(results, out);
        if (Object.values(out).some(v => v === null))
          errors.push(lastError || "null translations");
      } catch (err) {
        errors.push(String(err.message || err).slice(0, 300));
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const translated = Object.values(results).filter(
    v => typeof v === "string"
  ).length;
  const nulls = Object.values(results).filter(v => v === null).length;
  res.status(200).json({
    locale,
    translated,
    nulls,
    failedKeys: chunks.flat().length - translated - nulls,
    errors: errors.slice(0, 3),
    sample: Object.entries(results).slice(0, 3),
    results,
  });
}
