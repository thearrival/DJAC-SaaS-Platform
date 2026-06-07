import PizZip from "pizzip";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const NS_RELS = "http://schemas.openxmlformats.org/package/2006/relationships";
const NS_CT = "http://schemas.openxmlformats.org/package/2006/content-types";
const REL_DOC = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const REL_HDR = `${REL_DOC}/header`;
const REL_FTR = `${REL_DOC}/footer`;
const year = new Date().getFullYear();

const zip = new PizZip();

// ── [Content_Types].xml ────────────────────────────────────────────────────────
zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${NS_CT}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/header1.xml"  ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
  <Override PartName="/word/footer1.xml"  ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
</Types>`);

// ── _rels/.rels ────────────────────────────────────────────────────────────────
zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_RELS}">
  <Relationship Id="rId1" Type="${REL_DOC}/officeDocument" Target="word/document.xml"/>
</Relationships>`);

// ── word/_rels/document.xml.rels ───────────────────────────────────────────────
zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_RELS}">
  <Relationship Id="rId1" Type="${REL_HDR}" Target="header1.xml"/>
  <Relationship Id="rId2" Type="${REL_FTR}" Target="footer1.xml"/>
</Relationships>`);

// ── word/header1.xml  (Yalla Hack branded header) ─────────────────────────────
zip.file("word/header1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="${NS_W}">
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:shd w:val="clear" w:color="auto" w:fill="0A0A18"/><w:spacing w:before="80" w:after="40"/></w:pPr>
    <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="22D3EE"/></w:rPr><w:t>YALLA HACK</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="80"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="18"/><w:color w:val="AAAAAA"/></w:rPr><w:t>DJAC — Dual-Jurisdiction Assurance and Compliance</w:t></w:r>
  </w:p>
  <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="003366"/></w:pBdr><w:spacing w:after="0"/></w:pPr></w:p>
</w:hdr>`);

// ── word/footer1.xml  (Yalla Hack company footer) ─────────────────────────────
zip.file("word/footer1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="${NS_W}">
  <w:p><w:pPr><w:pBdr><w:top w:val="single" w:sz="6" w:space="1" w:color="003366"/></w:pBdr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="888888"/></w:rPr><w:t>\u00A9 ${year} Yalla Hack  All rights reserved</w:t></w:r>
  </w:p>
  <w:p>
    <w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="40" w:line="240" w:lineRule="auto"/></w:pPr>
    <w:r><w:rPr><w:sz w:val="14"/><w:color w:val="888888"/></w:rPr><w:t>License Number: 1562528  |  Email: support@yalla-hack.net</w:t></w:r>
  </w:p>
</w:ftr>`);

// ── word/document.xml  (body the injection code replaces) ─────────────────────
zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${NS_W}" xmlns:r="${REL_DOC}">
  <w:body>
    <w:p><w:r><w:t>{{DJAC_REPORT_CONTENT}}</w:t></w:r></w:p>
    <w:sectPr>
      <w:headerReference w:type="default" r:id="rId1"/>
      <w:footerReference w:type="default" r:id="rId2"/>
      <w:pgSz w:w="12240" w:h="15840"/>
    </w:sectPr>
  </w:body>
</w:document>`);

const buf = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
const outPath = resolve(process.cwd(), "audit", "templates", "official-report-template.docx");
writeFileSync(outPath, buf);
console.log("Template written:", outPath, buf.length, "bytes");
