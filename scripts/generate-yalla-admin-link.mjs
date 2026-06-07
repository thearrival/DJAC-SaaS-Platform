import { createHmac, randomBytes } from "node:crypto";

function getArg(name, fallback = "") {
    const prefix = `--${name}=`;
    const direct = process.argv.find((arg) => arg.startsWith(prefix));
    if (direct) return direct.slice(prefix.length);
    return fallback;
}

const appUrl = (getArg("app-url", process.env.APP_URL || "") || "").replace(/\/$/, "");
const secret = (getArg("secret", process.env.YALLA_ADMIN_SECRET || "") || "").trim();
const entryPath = getArg("entry-path", "/yalla-hack-owners-console/enter");
const redirect = getArg("redirect", "/yalla-hack-owners-console/login");
const ttlMinutes = Number(getArg("ttl-minutes", "60"));
const nonceMode = (getArg("nonce-mode", "one-time") || "one-time").trim().toLowerCase();

if (!appUrl) {
    console.error("Missing APP_URL. Provide --app-url or export APP_URL.");
    process.exit(1);
}

if (!secret) {
    console.error("Missing YALLA_ADMIN_SECRET. Provide --secret or export YALLA_ADMIN_SECRET.");
    process.exit(1);
}

if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
    console.error("ttl-minutes must be a positive number.");
    process.exit(1);
}

const expires = Math.floor(Date.now() / 1000) + Math.round(ttlMinutes * 60);
const nonce = nonceMode === "none" ? "" : randomBytes(16).toString("hex");
const sig = createHmac("sha256", secret).update(`${redirect}:${expires}:${nonce}`).digest("hex");

const signedParams = new URLSearchParams({ expires: String(expires), sig });
if (nonce) signedParams.set("nonce", nonce);

const signedUrl = `${appUrl}${entryPath}?${signedParams.toString()}`;
const rawFallbackUrl = `${appUrl}${entryPath}?access_token=${encodeURIComponent(secret)}`;

console.log("Signed owner link:");
console.log(signedUrl);
console.log("");
console.log("Fallback raw-secret link:");
console.log(rawFallbackUrl);
console.log("");
console.log(`Expires at unix timestamp: ${expires}`);
console.log(`Redirect target used for signature: ${redirect}`);
console.log(`Replay protection: ${nonce ? `enabled (${nonce})` : "disabled"}`);
