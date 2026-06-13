import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import fontkit from "@pdf-lib/fontkit";
import nodemailer from "nodemailer";
import PizZip from "pizzip";
import { PDFDocument, PDFEmbeddedPage, PDFPage, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { ENV } from "./_core/env";
import { parsedEnv } from "./services/config-schema";
import {
    generateComplianceReport,
    type ReportLocale,
    type ReportOptions,
} from "./report-generator";

type StyledLine = {
    text: string;
    fontSize: number;
    bold?: boolean;
    spacingAfter?: number;
    color?: [number, number, number];
    uppercase?: boolean;
};

type PdfFontBundle = {
    regular: PDFFont;
    bold: PDFFont;
    supportsUnicode: boolean;
};

const FONT_CANDIDATES: Record<ReportLocale, { regular: string[]; bold: string[] }> = {
    en: {
        regular: [
            "C:/Windows/Fonts/arial.ttf",
            "C:/Windows/Fonts/helvetica.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/System/Library/Fonts/Arial Unicode.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ],
        bold: [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/helveticabold.ttf",
            "C:/Windows/Fonts/segoeuib.ttf",
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/System/Library/Fonts/Arial Unicode.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ],
    },
    ar: {
        regular: [
            "C:/Windows/Fonts/segoeui.ttf",
            "C:/Windows/Fonts/arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf",
        ],
        bold: [
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",
        ],
    },
    zh: {
        regular: [
            "C:/Windows/Fonts/msyh.ttc",
            "C:/Windows/Fonts/msyh.ttf",
            "C:/Windows/Fonts/simsun.ttc",
            "/System/Library/Fonts/PingFang.ttc",
            "/System/Library/Fonts/STHeiti Light.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.otf",
        ],
        bold: [
            "C:/Windows/Fonts/msyhbd.ttc",
            "C:/Windows/Fonts/msyhbd.ttf",
            "C:/Windows/Fonts/simhei.ttf",
            "/System/Library/Fonts/PingFang.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.otf",
        ],
    },
};

export type GeneratedReportPdf = {
    reportId: string;
    generatedAt: string;
    title: string;
    templateName: string;
    fileName: string;
    mimeType: "application/pdf";
    renderMode: "template-native" | "rendered";
    base64: string;
};

export type GeneratedReportDocx = {
    reportId: string;
    generatedAt: string;
    title: string;
    templateName: string;
    fileName: string;
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    base64: string;
};

type GeneratedReportModel = ReturnType<typeof generateComplianceReport>;

type MarkdownBlock =
    | { kind: "heading"; level: 2 | 3; text: string }
    | { kind: "paragraph"; text: string; styleId?: string; bold?: boolean }
    | { kind: "table"; rows: string[][] };

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" as const;
const SIDEBAR_PLACEHOLDER = "“Got something very important to point out to your readers? Use a pull quote to make it stand out.”";
const execFileAsync = promisify(execFile);
const ENABLE_NATIVE_PDF_CONVERSION = parsedEnv.REPORT_NATIVE_PDF_CONVERSION && parsedEnv.NODE_ENV !== "test";

function fileNameFromReportId(reportId: string, extension: "pdf" | "docx") {
    return `${reportId}.${extension}`;
}

function sanitizeFallbackText(value: string) {
    // Replace emoji and symbols with ASCII equivalents for PDF encoding safety
    return value
        .replace(/\u26A0/g, "[!]")
        .replace(/[\u2022]/g, "-")
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u{1F534}\u{1F7E0}\u{1F7E1}\u{1F7E2}]/gu, "*") // Replace colored circle emoji
        // eslint-disable-next-line no-control-regex
        .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "")
        .trim();
}

function _toTemplateHeading(value: string, locale: ReportLocale) {
    if (locale === "en") {
        return value.toUpperCase();
    }
    return value;
}

function extractSubtitle(markdown: string) {
    for (const rawLine of markdown.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (line.startsWith("*") && line.endsWith("*")) {
            return cleanInlineMarkdown(line);
        }
    }
    return "";
}

function extractSidebarQuote(markdown: string) {
    const lines = markdown.split(/\r?\n/).map(line => line.trim());
    let foundSection = false;

    for (const line of lines) {
        if (line.startsWith("## ")) {
            foundSection = true;
            continue;
        }

        if (!foundSection || !line || line.startsWith("#") || line.startsWith("|") || /^[-*]\s+/.test(line)) {
            continue;
        }

        const cleaned = cleanInlineMarkdown(line);
        if (cleaned.length >= 60) {
            return cleaned;
        }
    }

    return "This report consolidates key compliance obligations, framework alignments, and remediation priorities for decision-ready review.";
}

function stripCoverContent(markdown: string) {
    const lines = markdown.split(/\r?\n/);
    const firstSectionIndex = lines.findIndex(line => line.trim().startsWith("## "));
    if (firstSectionIndex === -1) {
        return markdown;
    }
    return lines.slice(firstSectionIndex).join("\n");
}

function cleanInlineMarkdown(value: string) {
    return value
        .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeXml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function wrapCoverTitle(text: string, locale: ReportLocale) {
    const maxChars = locale === "en" ? 22 : 14;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= 1) {
        return [text];
    }

    const lines: string[] = [];
    let current = "";
    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxChars && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) {
        lines.push(current);
    }

    return lines;
}

function paragraphXml(
    text: string,
    options?: {
        styleId?: string;
        color?: string;
        bold?: boolean;
        caps?: boolean;
        size?: number;
        before?: number;
        after?: number;
        pageBreakBefore?: boolean;
    }
) {
    const paragraphProps: string[] = [];
    const runProps: string[] = [];

    if (options?.styleId) {
        paragraphProps.push(`<w:pStyle w:val="${options.styleId}"/>`);
    }
    if (typeof options?.before === "number" || typeof options?.after === "number") {
        paragraphProps.push(`<w:spacing${typeof options.before === "number" ? ` w:before="${options.before}"` : ""}${typeof options.after === "number" ? ` w:after="${options.after}"` : ""}/>`);
    }
    if (options?.pageBreakBefore) {
        paragraphProps.push("<w:pageBreakBefore/>");
    }
    if (options?.bold) {
        runProps.push("<w:b/>");
        runProps.push("<w:bCs/>");
    }
    if (options?.caps) {
        runProps.push("<w:caps/>");
    }
    if (options?.color) {
        runProps.push(`<w:color w:val="${options.color}"/>`);
    }
    if (options?.size) {
        runProps.push(`<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>`);
    }

    return `<w:p>${paragraphProps.length > 0 ? `<w:pPr>${paragraphProps.join("")}</w:pPr>` : ""}<w:r>${runProps.length > 0 ? `<w:rPr>${runProps.join("")}</w:rPr>` : ""}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function separatorXml() {
    return `<w:p><w:pPr><w:spacing w:after="220"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="D1282E"/></w:pBdr></w:pPr></w:p>`;
}

function pageBreakXml() {
    return "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>";
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
    const lines = markdown.split(/\r?\n/);
    const blocks: MarkdownBlock[] = [];

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]?.trim() ?? "";

        if (!line || /^---+$/.test(line)) {
            continue;
        }

        if (line.startsWith("## ")) {
            blocks.push({ kind: "heading", level: 2, text: cleanInlineMarkdown(line.slice(3)) });
            continue;
        }

        if (line.startsWith("### ")) {
            blocks.push({ kind: "heading", level: 3, text: cleanInlineMarkdown(line.slice(4)) });
            continue;
        }

        if (line.startsWith("|") && /^\|[-\s|]+\|?$/.test(lines[index + 1]?.trim() ?? "")) {
            const rows: string[][] = [];
            rows.push(line.split("|").map(cell => cleanInlineMarkdown(cell)).filter(Boolean));
            index += 2;
            while (index < lines.length && (lines[index]?.trim() ?? "").startsWith("|")) {
                rows.push(lines[index].split("|").map(cell => cleanInlineMarkdown(cell)).filter(Boolean));
                index += 1;
            }
            index -= 1;
            if (rows.length > 0) {
                blocks.push({ kind: "table", rows });
            }
            continue;
        }

        if (/^[-*]\s+/.test(line)) {
            blocks.push({ kind: "paragraph", styleId: "ListParagraph", text: `• ${cleanInlineMarkdown(line.replace(/^[-*]\s+/, ""))}` });
            continue;
        }

        if (line.startsWith("> ")) {
            blocks.push({ kind: "paragraph", styleId: "Quote", text: cleanInlineMarkdown(line.slice(2)) });
            continue;
        }

        // Skip image markdown lines — no image rendering available in the PDF renderer
        if (line.startsWith("![")) {
            continue;
        }

        const isEntirelyBold = /^\*\*[^*]+\*\*$/.test(line);
        blocks.push({ kind: "paragraph", text: cleanInlineMarkdown(line), bold: isEntirelyBold });
    }

    return blocks;
}

function tableCellXml(text: string, header = false) {
    const runProps = header ? "<w:rPr><w:b/><w:bCs/></w:rPr>" : "";
    return `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r>${runProps}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p></w:tc>`;
}

function tableXml(rows: string[][]) {
    const columnCount = Math.max(...rows.map(row => row.length), 1);
    const gridCols = Array.from({ length: columnCount }, () => "<w:gridCol w:w=\"2160\"/>").join("");
    const bodyRows = rows
        .map((row, rowIndex) => `<w:tr>${Array.from({ length: columnCount }, (_, colIndex) => tableCellXml(row[colIndex] ?? "", rowIndex === 0)).join("")}</w:tr>`)
        .join("");

    return `<w:tbl><w:tblPr><w:tblStyle w:val="Style6"/><w:tblW w:w="5000" w:type="pct"/><w:tblLook w:val="06A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr><w:tblGrid>${gridCols}</w:tblGrid>${bodyRows}</w:tbl>`;
}

function coverMetadataXml(report: GeneratedReportModel, options: ReportOptions) {
    const generatedValue = new Date(report.generatedAt).toLocaleString("en-US");
    return [
        paragraphXml(`Generated: ${generatedValue}`, { color: "7A7A7A", size: 20, after: 40 }),
        paragraphXml(`Report ID: ${report.reportId}`, { color: "7A7A7A", size: 20, after: 40 }),
        paragraphXml(`Jurisdiction: ${options.jurisdiction}`, { color: "7A7A7A", size: 20, after: 0 }),
    ].join("");
}

function buildDocxBodyXml(report: GeneratedReportModel, options: ReportOptions, originalDocumentXml: string) {
    const sectPrMatch = originalDocumentXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
    const sidebarParagraphMatch = originalDocumentXml.match(/<w:p>[\s\S]*?(?:descr="Sidebar"|Text Box 5)[\s\S]*?<\/w:p>/);
    const sidebarParagraphXml = sidebarParagraphMatch
        ? sidebarParagraphMatch[0].replace(SIDEBAR_PLACEHOLDER, escapeXml(`“${extractSidebarQuote(report.markdown)}”`))
        : "";

    const titleLines = wrapCoverTitle(options.locale === "en" ? report.title.toUpperCase() : report.title, options.locale)
        .map(line => paragraphXml(line, { styleId: "Title", after: 0 }));
    const subtitle = extractSubtitle(report.markdown);
    const bodyBlocks = parseMarkdownBlocks(stripCoverContent(report.markdown));
    const bodyXml = bodyBlocks
        .map(block => {
            if (block.kind === "heading") {
                return paragraphXml(block.text, { styleId: block.level === 2 ? "Heading2" : "Heading3", after: 80 });
            }
            if (block.kind === "table") {
                return tableXml(block.rows);
            }
            return paragraphXml(block.text, { styleId: block.styleId ?? "Normal", after: 70 });
        })
        .join("");

    const coverXml = [
        separatorXml(),
        "<w:p/><w:p/><w:p/>",
        titleLines.join(""),
        subtitle ? paragraphXml(options.locale === "en" ? subtitle.toUpperCase() : subtitle, { styleId: "Subtitle", after: 240 }) : "",
        coverMetadataXml(report, options),
        "<w:p/><w:p/>",
        sidebarParagraphXml,
        "<w:p/><w:p/><w:p/><w:p/>",
        paragraphXml("YALLA HACK", { styleId: "Heading3", after: 40 }),
        // Removed template name from cover
    ].join("");

    const sectionIntroXml = [
        separatorXml(),
        paragraphXml(`Report ID: ${report.reportId}`, { styleId: "Header", color: "7A7A7A", size: 16, after: 120 }),
    ].join("");

    return `${coverXml}${pageBreakXml()}${sectionIntroXml}${bodyXml}${sectPrMatch?.[0] ?? ""}`;
}

async function tryReadFile(filePath: string) {
    try {
        return await fs.readFile(filePath);
    } catch {
        return null;
    }
}

async function loadFontBytes(candidates: string[]) {
    for (const candidate of candidates) {
        const fontBytes = await tryReadFile(candidate);
        if (fontBytes) {
            return fontBytes;
        }
    }
    return null;
}

async function resolvePdfFonts(pdf: PDFDocument, locale: ReportLocale): Promise<PdfFontBundle> {
    pdf.registerFontkit(fontkit);

    const candidates = FONT_CANDIDATES[locale];
    if (candidates.regular.length > 0) {
        const regularBytes = await loadFontBytes(candidates.regular);
        const boldBytes = await loadFontBytes(candidates.bold);

        if (regularBytes) {
            // Try subsetting first (smaller PDF); fall back to full embed if fontkit
            // cannot subset the font (e.g. .ttc collections, partially-supported faces).
            const embedSafe = async (bytes: Uint8Array): Promise<PDFFont> => {
                try {
                    return await pdf.embedFont(bytes, { subset: true });
                } catch {
                    return await pdf.embedFont(bytes);
                }
            };

            const regular = await embedSafe(regularBytes);
            const bold = boldBytes ? await embedSafe(boldBytes) : regular;
            return {
                regular,
                bold,
                supportsUnicode: true,
            };
        }
    }

    return {
        regular: await pdf.embedFont(StandardFonts.Helvetica),
        bold: await pdf.embedFont(StandardFonts.HelveticaBold),
        supportsUnicode: false,
    };
}

function _markdownToStyledLines(markdown: string): StyledLine[] {
    const lines: StyledLine[] = [];

    for (const rawLine of markdown.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) {
            lines.push({ text: "", fontSize: 10, spacingAfter: 6 });
            continue;
        }

        if (/^\|[-\s|]+\|?$/.test(line)) {
            continue;
        }

        if (line.startsWith("# ")) {
            lines.push({ text: cleanInlineMarkdown(line.slice(2)), fontSize: 18, bold: true, spacingAfter: 10, color: [0.16, 0.16, 0.16] });
            continue;
        }

        if (line.startsWith("## ")) {
            lines.push({ text: cleanInlineMarkdown(line.slice(3)), fontSize: 16, bold: true, spacingAfter: 10, color: [0.48, 0.48, 0.48], uppercase: true });
            continue;
        }

        if (line.startsWith("### ")) {
            lines.push({ text: cleanInlineMarkdown(line.slice(4)), fontSize: 11, bold: true, spacingAfter: 7, color: [0.82, 0.16, 0.18], uppercase: true });
            continue;
        }

        if (line.startsWith("> ")) {
            lines.push({ text: cleanInlineMarkdown(line.slice(2)), fontSize: 9, spacingAfter: 6, color: [0.48, 0.48, 0.48] });
            continue;
        }

        if (line.startsWith("|")) {
            const cells = line
                .split("|")
                .map(cell => cleanInlineMarkdown(cell))
                .filter(Boolean);
            if (cells.length > 0) {
                lines.push({ text: cells.join(" | "), fontSize: 8.5, spacingAfter: 5, color: [0.18, 0.18, 0.18] });
            }
            continue;
        }

        if (/^[-*]\s+/.test(line)) {
            lines.push({ text: `• ${cleanInlineMarkdown(line.replace(/^[-*]\s+/, ""))}`, fontSize: 10, spacingAfter: 5, color: [0.1, 0.1, 0.14] });
            continue;
        }

        lines.push({ text: cleanInlineMarkdown(line), fontSize: 10, spacingAfter: 5, color: [0.1, 0.1, 0.14] });
    }

    return lines;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number) {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return [""];

    const lines: string[] = [];
    let current = words[0];

    for (let i = 1; i < words.length; i += 1) {
        const candidate = `${current} ${words[i]}`;
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
            current = candidate;
        } else {
            lines.push(current);
            current = words[i];
        }
    }

    lines.push(current);
    return lines;
}

async function loadLogoBytes() {
    const logoPath = path.resolve(process.cwd(), "client", "public", "yalla-hack-logo.png");
    try {
        return await fs.readFile(logoPath);
    } catch {
        return null;
    }
}

async function buildDocxBuffer(options: ReportOptions, report: GeneratedReportModel): Promise<Buffer> {
    const templatePath = path.resolve(process.cwd(), "audit", "templates", "official-report-template.docx");

    let templateBytes: Buffer;
    try {
        templateBytes = await fs.readFile(templatePath);
    } catch {
        return buildMinimalDocxBuffer(report);
    }

    try {
        const zip = new PizZip(templateBytes);
        const docEntry = zip.file("word/document.xml");
        if (!docEntry) {
            throw new Error("Template DOCX is missing word/document.xml");
        }
        const originalXml = docEntry.asText();
        const newBodyXml = buildDocxBodyXml(report, options, originalXml);
        const newDocumentXml = originalXml.replace(
            /<w:body>[\s\S]*?<\/w:body>/,
            `<w:body>${newBodyXml}</w:body>`
        );
        zip.file("word/document.xml", newDocumentXml);
        const generated = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
        return generated as Buffer;
    } catch (err) {
        console.error("[DJAC DOCX] Template content injection failed, generating minimal DOCX:", err);
        return buildMinimalDocxBuffer(report);
    }
}

/** Generates a valid minimal DOCX (ZIP) from scratch when the template file is absent or invalid. */
function buildMinimalDocxBuffer(report: GeneratedReportModel): Buffer {
    const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    const NS_RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
    const NS_CT = "http://schemas.openxmlformats.org/package/2006/content-types";
    const REL_HDR = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header";
    const REL_FTR = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer";
    const REL_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    const year = new Date().getFullYear();

    const safeTitle = escapeXml(report.title);
    const safeId = escapeXml(report.reportId);

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${NS_CT}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`;

    const dotRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_RELS}">
  <Relationship Id="rId1" Type="${REL_R}/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_RELS}">
  <Relationship Id="rId1" Type="${REL_HDR}" Target="header1.xml"/>
  <Relationship Id="rId2" Type="${REL_FTR}" Target="footer1.xml"/>
</Relationships>`;

    // Header: Yalla Hack brand + report title
    const headerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="${NS_W}">
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:shd w:val="clear" w:color="auto" w:fill="0A0A18"/><w:spacing w:before="80" w:after="40"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="22D3EE"/></w:rPr><w:t>YALLA HACK</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="80"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="18"/><w:color w:val="AAAAAA"/></w:rPr><w:t>${safeTitle}</w:t></w:r>
  </w:p>
  <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="003366"/></w:pBdr><w:spacing w:after="0"/></w:pPr></w:p>
</w:hdr>`;

    // Footer: 3-line Yalla Hack company info
    const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="${NS_W}">
  <w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="6" w:space="1" w:color="003366"/></w:pBdr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="888888"/></w:rPr><w:t>\u00A9 ${year} Yalla Hack  All rights reserved</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="888888"/></w:rPr><w:t>License Number: 1562528  |  Email: support@yalla-hack.net</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="13"/><w:color w:val="999999"/></w:rPr><w:t>Phone: +8618326095404 / +971 56 480 3488  |  Dubai Industrial City, Dubai, UAE</w:t></w:r>
  </w:p>
</w:ftr>`;

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${NS_W}" xmlns:r="${REL_R}">
  <w:body>
    <w:p><w:r><w:t>DJAC Compliance Report</w:t></w:r></w:p>
    <w:p><w:r><w:t>${safeTitle}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Report ID: ${safeId}</w:t></w:r></w:p>
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:footerReference w:type="default" r:id="rId2"/>
    </w:sectPr>
  </w:body>
</w:document>`;

    const zip = new PizZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", dotRels);
    zip.file("word/_rels/document.xml.rels", wordRels);
    zip.file("word/document.xml", documentXml);
    zip.file("word/header1.xml", headerXml);
    zip.file("word/footer1.xml", footerXml);
    return zip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;
}

async function tryReadPdfFrom(pathToPdf: string) {
    try {
        return await fs.readFile(pathToPdf);
    } catch {
        return null;
    }
}

async function tryConvertDocxToPdfViaSoffice(docxBuffer: Buffer) {
    const tempDir = path.join(os.tmpdir(), `djac-report-${randomUUID()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, "report.docx");
    const outputPath = path.join(tempDir, "report.pdf");
    await fs.writeFile(inputPath, docxBuffer);

    const candidates = process.platform === "win32"
        ? ["soffice.exe", "soffice", "libreoffice"]
        : ["soffice", "libreoffice"];

    try {
        for (const command of candidates) {
            try {
                await execFileAsync(
                    command,
                    ["--headless", "--convert-to", "pdf", "--outdir", tempDir, inputPath],
                    { windowsHide: true, timeout: 60_000 }
                );
                const converted = await tryReadPdfFrom(outputPath);
                if (converted) {
                    return converted;
                }
            } catch {
                // Try next converter command candidate.
            }
        }
        return null;
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
}

async function tryConvertDocxToPdfViaWordCom(docxBuffer: Buffer) {
    if (process.platform !== "win32") {
        return null;
    }

    const tempDir = path.join(os.tmpdir(), `djac-report-${randomUUID()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const inputPath = path.join(tempDir, "report.docx");
    const outputPath = path.join(tempDir, "report.pdf");
    await fs.writeFile(inputPath, docxBuffer);

    const inEscaped = inputPath.replace(/'/g, "''");
    const outEscaped = outputPath.replace(/'/g, "''");
    const script = [
        "$ErrorActionPreference = 'Stop'",
        "$word = New-Object -ComObject Word.Application",
        "$word.Visible = $false",
        "try {",
        `  $doc = $word.Documents.Open('${inEscaped}')`,
        `  $doc.SaveAs([ref]'${outEscaped}', [ref]17)`,
        "  $doc.Close()",
        "} finally {",
        "  $word.Quit()",
        "}",
    ].join("; ");

    try {
        await execFileAsync(
            "powershell",
            ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
            { windowsHide: true, timeout: 90_000 }
        );
        return await tryReadPdfFrom(outputPath);
    } catch {
        return null;
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    }
}

async function tryConvertDocxToNativePdf(docxBuffer: Buffer) {
    if (!ENABLE_NATIVE_PDF_CONVERSION) {
        return null;
    }

    const wordComPdf = await tryConvertDocxToPdfViaWordCom(docxBuffer);
    if (wordComPdf) {
        return wordComPdf;
    }
    return await tryConvertDocxToPdfViaSoffice(docxBuffer);
}

async function buildPdfBuffer(options: ReportOptions, report: GeneratedReportModel) {
    const pdf = await PDFDocument.create();

    // Load watermark PDF (reference background) — gracefully skipped when absent
    const watermarkPath = path.resolve(process.cwd(), "audit", "templates", "report-watermark.pdf");
    let watermarkPdfDoc: PDFDocument | null;
    let watermarkPage: PDFPage | null;
    let wm: PDFEmbeddedPage | null = null;
    try {
        const watermarkBytes = await fs.readFile(watermarkPath);
        watermarkPdfDoc = await PDFDocument.load(watermarkBytes);
        if (watermarkPdfDoc.getPageCount() === 0) throw new Error("Watermark PDF has no pages");
        watermarkPage = watermarkPdfDoc.getPage(0);
        wm = await pdf.embedPage(watermarkPage);
        if (!wm) throw new Error("Failed to embed watermark page");
    } catch (_err) {
        console.warn("[DJAC PDF] Watermark skipped:", (_err as Error).message);
        wm = null;
    }
    const fonts = await resolvePdfFonts(pdf, options.locale);
    const fontRegular = fonts.regular;
    const fontBold = fonts.bold;
    const logoBytes = await loadLogoBytes();
    const logoImage = logoBytes ? await pdf.embedPng(logoBytes) : null;

    pdf.setTitle(report.title);
    pdf.setAuthor("DJAC / Yalla Hack");
    pdf.setSubject(`DJAC Compliance Report PDF`);
    pdf.setProducer("DJAC Compliance Reporting Service");
    pdf.setCreator("DJAC Compliance Reporting Service");

    // Strict grid system and safe zone
    // A4: 210mm x 297mm, 72dpi = 595.28 x 841.89
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    // Margins: Top 25mm (71), Bottom 25mm (71), Left/Right 20mm (56.7)
    const marginX = 56.7;
    const marginY = 71;
    const safeWidth = pageWidth - 2 * marginX;
    const _safeHeight = pageHeight - 2 * marginY;
    // Report layout constants
    const HEADER_H = 80;
    const FOOTER_H = 52;
    const _sectionSpacing = 20;
    const _lineHeight = 15;
    const _normalizeText = (value: string) => (fonts.supportsUnicode ? value : sanitizeFallbackText(value));
    const _subtitle = _normalizeText(extractSubtitle(report.markdown));
    const _sidebarQuote = _normalizeText(extractSidebarQuote(report.markdown));
    const bodyMarkdown = stripCoverContent(report.markdown);
    // Parse Markdown into blocks (headings, paragraphs, tables)
    const blocks = parseMarkdownBlocks(bodyMarkdown);
    const _normalizedTitle = options.locale === "en"
        ? _normalizeText(report.title).toUpperCase()
        : _normalizeText(report.title);
    // const normalizedTemplateName = normalizeText(ENV.reportTemplateName);
    const _reportIdLabel = _normalizeText(`Report ID: ${report.reportId}`);
    const pages = [] as Array<{ page: ReturnType<PDFDocument["addPage"]>; cursorY: number }>;


    // --- Cover page now uses the original template-native DOCX ---
    // (No-op: cover is handled by the DOCX template in template-native mode)

    // --- Render cover page ---
    // Cover page is now rendered from the official DOCX template (template-native mode)
    // No manual drawing needed here

    // Header/Footer template
    function renderHeaderFooter(page: PDFPage): void {
        // ── Header: full-width dark branded band ──
        page.drawRectangle({ x: 0, y: pageHeight - HEADER_H, width: pageWidth, height: HEADER_H, color: rgb(0.04, 0.04, 0.1) });
        if (logoImage) {
            try {
                const maxLogoH = HEADER_H - 16;
                const maxLogoW = 200;
                let dims = logoImage.scale(1);
                let scale = 1;
                if (dims.width > maxLogoW) scale = Math.min(scale, maxLogoW / dims.width);
                if (dims.height > maxLogoH) scale = Math.min(scale, maxLogoH / dims.height);
                dims = logoImage.scale(scale);
                page.drawImage(logoImage, {
                    x: (pageWidth - dims.width) / 2,
                    y: pageHeight - HEADER_H + (HEADER_H - dims.height) / 2,
                    width: dims.width,
                    height: dims.height,
                });
            } catch { /* logo unavailable, skip */ }
        } else {
            // Text fallback when logo file is unavailable
            const yhText = "YALLA HACK";
            const yhSize = 18;
            page.drawText(yhText, {
                x: (pageWidth - fontBold.widthOfTextAtSize(yhText, yhSize)) / 2,
                y: pageHeight - HEADER_H / 2 - yhSize / 2,
                size: yhSize, font: fontBold, color: rgb(0.13, 0.83, 0.93),
            });
        }

        // ── Footer: full-width dark band with Yalla Hack company info ──
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: FOOTER_H, color: rgb(0.04, 0.04, 0.1) });
        const footerYear = new Date().getFullYear();
        const footerLines = [
            `\u00A9 ${footerYear} Yalla Hack  All rights reserved`,
            "License Number: 1562528  |  Email: support@yalla-hack.net",
            "Phone: +8618326095404 / +971 56 480 3488  |  Dubai Industrial City, Dubai, UAE",
        ];
        const fSize = 6.5;
        const fLineH = 9;
        let fY = FOOTER_H - 9;
        for (const fLine of footerLines) {
            const fW = fontRegular.widthOfTextAtSize(fLine, fSize);
            page.drawText(fLine, {
                x: Math.max(marginX, (pageWidth - fW) / 2),
                y: fY, size: fSize, font: fontRegular, color: rgb(0.65, 0.65, 0.7),
            });
            fY -= fLineH;
        }
    }

    // Create new page and render header/footer
    function createPage() {
        const page = pdf.addPage([pageWidth, pageHeight]);
        if (wm) page.drawPage(wm, { x: 0, y: 0, width: pageWidth, height: pageHeight, opacity: 0.13 });
        renderHeaderFooter(page);
        pages.push({ page, cursorY: pageHeight - marginY - HEADER_H });
        return pages[pages.length - 1];
    }

    // --- Modular section rendering ---
    function draw_section_heading(page: PDFPage, y: number, text: string, level = 2): number {
        const fontSize = level === 2 ? 16 : 13;
        const font = fontBold;
        const color = level === 2 ? rgb(0.04, 0.20, 0.42) : rgb(0.12, 0.12, 0.18);
        if (level === 2) y -= 8;  // extra breathing room above h2
        const lines = wrapText(text, font, fontSize, safeWidth);
        for (const line of lines) {
            page.drawText(line, { x: marginX, y, size: fontSize, font, color });
            y -= fontSize * 1.4;
        }
        if (level === 2) {
            // Red accent rule under h2 heading
            page.drawLine({
                start: { x: marginX, y: y + 6 },
                end: { x: marginX + safeWidth, y: y + 6 },
                thickness: 1.5,
                color: rgb(0.82, 0.16, 0.18),
            });
            y -= 8;
        }
        return y - 6;
    }
    function draw_section_paragraph(page: PDFPage, y: number, text: string, bold = false): number {
        const fontSize = 10;
        const font = bold ? fontBold : fontRegular;
        const lines = wrapText(text, font, fontSize, safeWidth);
        for (const line of lines) {
            page.drawText(line, { x: marginX, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.2) });
            y -= fontSize * 1.4;
        }
        return y - 6;
    }
    function draw_section_table(page: PDFPage, y: number, tableRows: string[][]): number {
        // Use the maximum column count across all rows (header row may have fewer columns
        // when empty cells are stripped by filter(Boolean) in parseMarkdownBlocks)
        const colCount = Math.max(...tableRows.map(row => row.length), 1);
        // Proportional column widths tuned to known table shapes
        const colWidths: number[] = (() => {
            if (colCount === 2) return [safeWidth * 0.35, safeWidth * 0.65];
            if (colCount === 4) return [safeWidth * 0.18, safeWidth * 0.27, safeWidth * 0.27, safeWidth * 0.28];
            if (colCount === 6) return [safeWidth * 0.30, safeWidth * 0.12, safeWidth * 0.12, safeWidth * 0.10, safeWidth * 0.13, safeWidth * 0.23];
            const w = safeWidth / colCount;
            return Array.from({ length: colCount }, () => w);
        })();
        const fontSize = colCount >= 6 ? 8.5 : colCount >= 4 ? 9 : 10;
        const tableWidth = colWidths.reduce((s, w) => s + w, 0);
        const rowHeights = tableRows.map(row => {
            let maxLines = 1;
            for (let c = 0; c < colCount; c++) {
                const cell = row[c] ?? "";
                const lines = wrapText(cell, fontRegular, fontSize, colWidths[c] - 8).length;
                if (lines > maxLines) maxLines = lines;
            }
            return maxLines * (fontSize * 1.4) + 8;
        });
        const headerHeight = rowHeights[0] ?? 22;

        /** Draw header row (row 0) on the given page at position startY. Returns new Y. */
        function drawHeaderRow(pg: PDFPage, startY: number): number {
            const headerRow = tableRows[0];
            let xOff = marginX;
            for (let c = 0; c < colCount; c++) {
                const cell = headerRow[c] ?? "";
                const cw = colWidths[c];
                pg.drawRectangle({ x: xOff, y: startY - headerHeight + 2, width: cw, height: headerHeight, color: rgb(0.86, 0.91, 0.96) });
                const cellLines = wrapText(cell, fontBold, fontSize, cw - 8);
                let cellY = startY - 6;
                for (const hLine of cellLines) {
                    pg.drawText(hLine, { x: xOff + 4, y: cellY, size: fontSize, font: fontBold, color: rgb(0.06, 0.18, 0.36) });
                    cellY -= fontSize * 1.4;
                }
                pg.drawLine({ start: { x: xOff, y: startY - headerHeight + 2 }, end: { x: xOff, y: startY + 2 }, thickness: 0.7, color: rgb(0.62, 0.68, 0.76) });
                xOff += cw;
            }
            pg.drawLine({ start: { x: marginX, y: startY - headerHeight + 2 }, end: { x: marginX + tableWidth, y: startY - headerHeight + 2 }, thickness: 0.7, color: rgb(0.62, 0.68, 0.76) });
            pg.drawLine({ start: { x: marginX + tableWidth, y: startY - headerHeight + 2 }, end: { x: marginX + tableWidth, y: startY + 2 }, thickness: 0.7, color: rgb(0.62, 0.68, 0.76) });
            return startY - headerHeight - 4;
        }

        for (let r = 0; r < tableRows.length; r++) {
            if (y - rowHeights[r] < marginY + FOOTER_H + 20) {
                current = createPage();
                // Critical fix: update local page reference so subsequent rows draw
                // on the NEW page, not the old one.
                page = current.page;
                y = pageHeight - marginY - HEADER_H;
                // Repeat header on new page for readability
                if (r > 0) {
                    y = drawHeaderRow(page, y);
                }
            }
            // Draw header row via dedicated helper
            if (r === 0) {
                y = drawHeaderRow(page, y);
                continue;
            }
            const row = tableRows[r];
            const rowHeight = rowHeights[r];
            const rowY = y;
            // Alternating row background: even data rows (r=2,4,...) get a very light tint
            const isEvenDataRow = r % 2 === 0;
            let xOffset = marginX;
            for (let c = 0; c < colCount; c++) {
                const cell = row[c] ?? "";
                const cw = colWidths[c];
                if (isEvenDataRow) {
                    page.drawRectangle({ x: xOffset, y: rowY - rowHeight + 2, width: cw, height: rowHeight, color: rgb(0.97, 0.98, 1.0) });
                }
                const cellLines = wrapText(cell, fontRegular, fontSize, cw - 8);
                let cellY = rowY - 6;
                for (const cellLine of cellLines) {
                    page.drawText(cellLine, { x: xOffset + 4, y: cellY, size: fontSize, font: fontRegular, color: rgb(0.15, 0.15, 0.2) });
                    cellY -= fontSize * 1.4;
                }
                page.drawLine({ start: { x: xOffset, y: rowY - rowHeight + 2 }, end: { x: xOffset, y: rowY + 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.82) });
                xOffset += cw;
            }
            page.drawLine({ start: { x: marginX, y: rowY - rowHeight + 2 }, end: { x: marginX + tableWidth, y: rowY - rowHeight + 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.82) });
            page.drawLine({ start: { x: marginX + tableWidth, y: rowY - rowHeight + 2 }, end: { x: marginX + tableWidth, y: rowY + 2 }, thickness: 0.5, color: rgb(0.8, 0.8, 0.82) });
            y = rowY - rowHeight - 4;
        }
        page.drawLine({ start: { x: marginX, y: y + 4 }, end: { x: marginX + tableWidth, y: y + 4 }, thickness: 0.7, color: rgb(0.62, 0.68, 0.76) });
        return y - 8;
    }


    let current = createPage();
    let y = pageHeight - marginY - HEADER_H;
    for (const block of blocks) {
        if (block.kind === "heading") {
            // Ensure enough vertical space before drawing a heading
            const minSpace = block.level === 2 ? 80 : 50;
            if (y < marginY + FOOTER_H + minSpace) {
                current = createPage();
                y = pageHeight - marginY - HEADER_H;
            }
            y = draw_section_heading(current.page, y, _normalizeText(block.text), block.level);
            continue;
        }
        // Overflow guard for paragraphs
        if (y < marginY + FOOTER_H + 30) {
            current = createPage();
            y = pageHeight - marginY - HEADER_H;
        }
        // Paragraph
        if (block.kind === "paragraph") {
            y = draw_section_paragraph(current.page, y, _normalizeText(block.text), block.bold);
            continue;
        }
        // Table
        if (block.kind === "table") {
            y = draw_section_table(
                current.page, y,
                block.rows.map(row => row.map(cell => _normalizeText(cell)))
            );
            continue;
        }
    }

    pages.forEach((entry, index) => {
        // Page number in the bottom-right of the footer band
        const pageNumberText = `${index + 1} / ${pages.length}`;
        entry.page.drawText(pageNumberText, {
            x: pageWidth - marginX - fontRegular.widthOfTextAtSize(pageNumberText, 6.5),
            y: FOOTER_H - 9,
            size: 6.5,
            font: fontRegular,
            color: rgb(0.75, 0.75, 0.78),
        });
    });

    return {
        report,
        buffer: Buffer.from(await pdf.save()),
    };
}

export async function generateComplianceReportPdf(options: ReportOptions): Promise<GeneratedReportPdf> {
    const report = generateComplianceReport(options);
    // Try DOCX-to-PDF conversion first (template-native)
    const docxBuffer = await buildDocxBuffer(options, report);
    let pdfBuffer: Buffer | null;
    let renderMode: "template-native" | "rendered" = "template-native";
    try {
        pdfBuffer = await tryConvertDocxToNativePdf(docxBuffer);
    } catch {
        pdfBuffer = null;
    }
    if (!pdfBuffer) {
        // Fallback: use custom PDF renderer
        const { buffer } = await buildPdfBuffer(options, report);
        pdfBuffer = buffer;
        renderMode = "rendered";
    }
    return {
        reportId: report.reportId,
        generatedAt: report.generatedAt,
        title: report.title,
        templateName: ENV.reportTemplateName,
        fileName: fileNameFromReportId(report.reportId, "pdf"),
        mimeType: "application/pdf",
        renderMode,
        base64: pdfBuffer.toString("base64"),
    };
}

export async function generateComplianceReportDocx(options: ReportOptions): Promise<GeneratedReportDocx> {
    const report = generateComplianceReport(options);
    const buffer = await buildDocxBuffer(options, report);
    return {
        reportId: report.reportId,
        generatedAt: report.generatedAt,
        title: report.title,
        templateName: ENV.reportTemplateName,
        fileName: fileNameFromReportId(report.reportId, "docx"),
        mimeType: DOCX_MIME,
        base64: buffer.toString("base64"),
    };
}

export async function emailComplianceReport(input: ReportOptions & { recipientEmail: string }) {
    if (!ENV.smtpHost || !ENV.smtpFrom) {
        throw new Error("SMTP is not configured. Set SMTP_HOST and SMTP_FROM to enable report email delivery.");
    }

    const report = generateComplianceReport(input);
    const docxBuffer = await buildDocxBuffer(input, report);
    const nativePdfBuffer = await tryConvertDocxToNativePdf(docxBuffer);
    const pdfBuffer = nativePdfBuffer ?? (await buildPdfBuffer(input, report)).buffer;
    const pdfMode = nativePdfBuffer ? "template-native" : "rendered";
    const transporter = nodemailer.createTransport({
        host: ENV.smtpHost,
        port: ENV.smtpPort,
        secure: ENV.smtpSecure,
        auth: ENV.smtpUser
            ? {
                user: ENV.smtpUser,
                pass: ENV.smtpPass,
            }
            : undefined,
    });

    const info = await transporter.sendMail({
        from: ENV.smtpFrom,
        to: input.recipientEmail,
        subject: `${report.title} (${report.reportId})`,
        text:
            `Please find attached the generated compliance report ${report.reportId}.\n\n` +
            `The authoritative attachment is the official Word-template document. ` +
            `A rendered PDF copy is also included for quick sharing.\n\n` +
            `PDF mode: ${pdfMode}\n` +
            `Template: ${ENV.reportTemplateName}\n` +
            `Generated at: ${report.generatedAt}\n`,
        attachments: [
            {
                filename: fileNameFromReportId(report.reportId, "docx"),
                content: docxBuffer,
                contentType: DOCX_MIME,
            },
            {
                filename: fileNameFromReportId(report.reportId, "pdf"),
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ],
    });

    return {
        success: true as const,
        reportId: report.reportId,
        generatedAt: report.generatedAt,
        templateName: ENV.reportTemplateName,
        pdfMode,
        messageId: info.messageId,
    };
}
