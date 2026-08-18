/**
 * Generates audit/templates/report-watermark.pdf — the branded background
 * template embedded into every DJAC compliance report PDF (rendered at 13%
 * opacity by server/report-delivery.ts). Reproducible via: node scripts/generate-watermark.mjs
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(
  __dirname,
  "..",
  "audit",
  "templates",
  "report-watermark.pdf"
);

// A4 in points (matches pageWidth/pageHeight used in report-delivery.ts)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const pdf = await PDFDocument.create();
const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
const font = await pdf.embedFont(StandardFonts.HelveticaBold);
const fontLight = await pdf.embedFont(StandardFonts.Helvetica);

const brand = rgb(0.38, 0.15, 0.55); // subtle violet
const frame = rgb(0.45, 0.4, 0.55);

// Double frame border
page.drawRectangle({
  x: 28,
  y: 28,
  width: PAGE_WIDTH - 56,
  height: PAGE_HEIGHT - 56,
  borderColor: frame,
  borderWidth: 1.2,
});
page.drawRectangle({
  x: 36,
  y: 36,
  width: PAGE_WIDTH - 72,
  height: PAGE_HEIGHT - 72,
  borderColor: frame,
  borderWidth: 0.6,
});

// Large centered brand mark
const wordmark = "DJAC";
const fontSize = 150;
const wmWidth = font.widthOfTextAtSize(wordmark, fontSize);
const cx = (PAGE_WIDTH - wmWidth) / 2;
const cy = PAGE_HEIGHT / 2 - 20;
page.drawText(wordmark, {
  x: cx,
  y: cy,
  size: fontSize,
  font,
  color: brand,
});

// Tagline under the wordmark
const tagline = "COMPLIANCE INTELLIGENCE";
const tagSize = 13;
const tagWidth = fontLight.widthOfTextAtSize(tagline, tagSize);
page.drawText(tagline, {
  x: (PAGE_WIDTH - tagWidth) / 2,
  y: PAGE_HEIGHT / 2 - 110,
  size: tagSize,
  font: fontLight,
  color: frame,
});

// Corner deco ticks
const tick = (x, y, len, horiz = true) => {
  page.drawLine({
    start: { x, y },
    end: horiz ? { x: x + len, y } : { x, y: y + len },
    thickness: 1.4,
    color: brand,
  });
};
tick(40, PAGE_HEIGHT - 40, 26);
tick(PAGE_WIDTH - 66, PAGE_HEIGHT - 40, 26);
tick(40, 40, 26);
tick(PAGE_WIDTH - 66, 40, 26);
tick(40, PAGE_HEIGHT - 66, 26, false);
tick(40, 66, 26, false);
tick(PAGE_WIDTH - 66, PAGE_HEIGHT - 66, 26, false);
tick(PAGE_WIDTH - 66, 66, 26, false);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, await pdf.save());
console.log(`Watermark template written: ${outPath}`);
