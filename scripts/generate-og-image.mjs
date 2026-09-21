/**
 * Generates client/public/og-image.png (1200x630) — the branded Open Graph /
 * Twitter social card referenced by client/index.html.
 *
 * Reproducible via: node scripts/generate-og-image.mjs
 * Requires a local Chrome/Edge (headless) to rasterise the HTML card.
 */
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  existsSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const logoPath = resolve(root, "client", "public", "yalla-hack-logo.png");
const outPath = resolve(root, "client", "public", "og-image.png");

const BROWSERS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const browser = BROWSERS.find(p => existsSync(p));
if (!browser) {
  console.error("No Chrome/Edge found — cannot generate og-image.png");
  process.exit(1);
}

const logoUrl = pathToFileURL(logoPath).href;

const html = `<!doctype html>
<html>
<head><meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 1200px; height: 630px; overflow: hidden; }
  body {
    background: #050508;
    font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    color: #ffffff;
    position: relative;
  }
  .glow-magenta {
    position: absolute; width: 900px; height: 900px; left: -260px; top: -180px;
    background: radial-gradient(circle, rgba(217,0,255,0.42) 0%, rgba(217,0,255,0.10) 42%, rgba(217,0,255,0) 70%);
  }
  .glow-cyan {
    position: absolute; width: 1000px; height: 1000px; right: -300px; top: -260px;
    background: radial-gradient(circle, rgba(0,210,255,0.30) 0%, rgba(0,210,255,0.08) 45%, rgba(0,210,255,0) 72%);
  }
  .glow-bottom {
    position: absolute; width: 1200px; height: 420px; left: 0; bottom: -260px;
    background: radial-gradient(ellipse at 30% 100%, rgba(217,0,255,0.22) 0%, rgba(217,0,255,0) 65%);
  }
  .content { position: relative; padding: 118px 0 0 108px; }
  .logo { width: 148px; height: 151px; display: block; }
  .title {
    margin-top: 26px;
    font-size: 122px; font-weight: 800; letter-spacing: 2px; line-height: 1;
  }
  .subtitle {
    margin-top: 14px;
    font-size: 41px; font-weight: 600; letter-spacing: 0.2px;
    color: #00d2ff;
  }
  .tagline {
    margin-top: 16px;
    font-size: 30px; font-weight: 400; letter-spacing: 0.4px;
    color: #94a3b8;
  }
</style>
</head>
<body>
  <div class="glow-magenta"></div>
  <div class="glow-cyan"></div>
  <div class="glow-bottom"></div>
  <div class="content">
    <img class="logo" src="${logoUrl}" alt="" />
    <div class="title">DJAC</div>
    <div class="subtitle">Data, Jurisdiction &amp; AI Compliance</div>
    <div class="tagline">28 jurisdictions &bull; 9 languages &bull; AI-powered</div>
  </div>
</body>
</html>`;

const work = mkdtempSync(join(tmpdir(), "djac-og-"));
const htmlPath = join(work, "card.html");
writeFileSync(htmlPath, html, "utf8");

try {
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1200,630",
      "--screenshot=" + outPath,
      "--user-data-dir=" + join(work, "profile"),
      pathToFileURL(htmlPath).href,
    ],
    { stdio: "inherit" }
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}

const size = statSync(outPath).size;
console.log(`og-image.png written (${size} bytes)`);
