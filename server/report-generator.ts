/**
 * DJAC Compliance Report Generator
 *
 * Produces audit-ready Markdown reports aggregating:
 *   - Regulatory framework coverage (Saudi Arabia / China / both)
 *   - Compliance obligations & deadlines from the timetable
 *   - Cross-jurisdiction comparison matrix
 *   - Prioritised remediation recommendations
 *   - Appendix: governing authorities + regulatory references
 *
 * Supports three output locales: English (en), Arabic (ar), Chinese (zh).
 * All data sources are static/seeded — no async DB call required.
 */

import { getComparisonTable, listComplianceObligations } from "./compliance-timetable";
import { listLawKnowledge } from "./legal-knowledge";

export type ReportLocale = "en" | "ar" | "zh";
export type ReportJurisdiction = "Saudi Arabia" | "China" | "both";
export type ReportType =
    | "full_compliance"
    | "gap_analysis"
    | "vendor_assessment"
    | "risk_assessment"
    | "executive_summary"
    | "regulatory_deadline";

export interface ReportOptions {
    jurisdiction: ReportJurisdiction;
    locale: ReportLocale;
    reportType?: ReportType;
}

export interface ReportScorecardSummary {
    overallScore: number;
    saudiScore: number | null;
    chinaScore: number | null;
    gapCount: number;
    criticalFindings: number;
    frameworksCovered: number;
    obligationsCovered: number;
    reportVersion: string;
}

// ── i18n label maps ───────────────────────────────────────────────────────────

const LABELS: Record<ReportLocale, Record<string, string>> = {
    en: {
        title: "DJAC Compliance Assessment Report",
        subtitle: "Multi-Jurisdictional Regulatory Compliance | Government-Ready",
        jurisdiction: "Jurisdiction",
        generated: "Generated",
        classification: "Classification",
        classificationValue: "CONFIDENTIAL — Audit Ready",
        preparedBy: "Prepared By",
        preparedByValue: "DJAC Automated Compliance Engine v1.0",
        execSummary: "Executive Summary",
        execSummaryIntro:
            "This report provides a comprehensive compliance assessment across the selected " +
            "regulatory jurisdictions. It aggregates framework coverage, obligation timelines, " +
            "cross-jurisdiction relationship analysis, and prioritised remediation guidance " +
            "suitable for direct submission to government regulatory bodies.",
        keyStats: "Key Statistics",
        frameworksLabel: "Frameworks Covered",
        obligationsLabel: "Total Obligations",
        criticalObligationsLabel: "Critical Obligations",
        authoritiesLabel: "Governing Authorities",
        frameworkCoverage: "1. Regulatory Framework Coverage",
        saudiFrameworks: "1.1 Saudi Arabia",
        chinaFrameworks: "1.2 People's Republic of China",
        crossJurisdiction: "1.3 Cross-Jurisdiction Relationship Analysis",
        complianceStatus: "2. Compliance Status Matrix",
        compMatrix: "2.1 Framework Comparison Matrix",
        securitySection: "3. Security Metrics & Risk Assessment",
        penaltiesSection: "3.1 Maximum Penalty Exposure",
        cwTopics: "4. Cross-Jurisdiction Topic Analysis",
        oblSection: "5. Compliance Obligations & Deadlines",
        criticalHeader: "5.1 Critical & High-Priority Obligations",
        ongoingHeader: "5.2 Ongoing Standing Obligations",
        recommendations: "6. Recommendations & Remediation Guidance",
        appendixSection: "7. Appendix",
        appendixAuthorities: "A. Governing Authorities",
        appendixReferences: "B. Regulatory References",
        appendixMeta: "C. Report Metadata",
        reportId: "Report ID",
        generatedAt: "Generated At",
        engineVersion: "Engine Version",
        engineValue: "DJAC v1.0 — Multi-Jurisdictional Compliance Automation Engine",
        critical: "CRITICAL",
        high: "HIGH",
        medium: "MEDIUM",
        low: "LOW",
        framework: "Framework",
        country: "Country",
        requirement: "Requirement",
        frequency: "Frequency",
        risk: "Risk",
        authority: "Authority",
        topic: "Topic",
        saudi: "Saudi Arabia",
        china: "China",
        notes: "Notes",
        confidentialNotice:
            "⚠ CONFIDENTIAL — This document is intended solely for authorised audit and " +
            "compliance review activities. Unauthorised distribution is prohibited.",
        pdfNote:
            "This report is formatted for direct submission to government regulatory bodies. " +
            "The accompanying Markdown version is suitable for version-controlled documentation repositories.",
    },
    ar: {
        title: "تقرير تقييم الامتثال — DJAC",
        subtitle: "الامتثال التنظيمي متعدد الولايات القضائية | جاهز للجهات الحكومية",
        jurisdiction: "الولاية القضائية",
        generated: "تاريخ الإصدار",
        classification: "التصنيف",
        classificationValue: "سري وخاضع للتدقيق",
        preparedBy: "أعدّه",
        preparedByValue: "محرك الامتثال الآلي DJAC — الإصدار 1.0",
        execSummary: "الملخص التنفيذي",
        execSummaryIntro:
            "يُقدّم هذا التقرير تقييماً شاملاً للامتثال عبر الاختصاصات القضائية التنظيمية المحددة، " +
            "ويجمع بين تغطية الأطر التنظيمية والجداول الزمنية للالتزامات وتحليل العلاقات عبر " +
            "الاختصاصات القضائية والتوجيهات العلاجية ذات الأولوية المناسبة للتقديم المباشر إلى الجهات الحكومية.",
        keyStats: "الإحصائيات الرئيسية",
        frameworksLabel: "الأطر المشمولة",
        obligationsLabel: "إجمالي الالتزامات",
        criticalObligationsLabel: "الالتزامات الحرجة",
        authoritiesLabel: "الهيئات التنظيمية",
        frameworkCoverage: "1. تغطية الإطار التنظيمي",
        saudiFrameworks: "1.1 المملكة العربية السعودية",
        chinaFrameworks: "1.2 جمهورية الصين الشعبية",
        crossJurisdiction: "1.3 تحليل العلاقات عبر الاختصاصات القضائية",
        complianceStatus: "2. مصفوفة حالة الامتثال",
        compMatrix: "2.1 مصفوفة مقارنة الأطر",
        securitySection: "3. مقاييس الأمن وتقييم المخاطر",
        penaltiesSection: "3.1 الحد الأقصى لمخاطر العقوبات",
        cwTopics: "4. تحليل المواضيع عبر الاختصاصات القضائية",
        oblSection: "5. الالتزامات التنظيمية والمواعيد النهائية",
        criticalHeader: "5.1 الالتزامات الحرجة وعالية الأولوية",
        ongoingHeader: "5.2 الالتزامات الدائمة والمستمرة",
        recommendations: "6. التوصيات وتوجيهات الإصلاح",
        appendixSection: "7. الملحق",
        appendixAuthorities: "أ. الهيئات التنظيمية",
        appendixReferences: "ب. المراجع التنظيمية",
        appendixMeta: "ج. بيانات التقرير",
        reportId: "معرّف التقرير",
        generatedAt: "وقت الإنشاء",
        engineVersion: "إصدار المحرك",
        engineValue: "DJAC الإصدار 1.0 — محرك أتمتة الامتثال متعدد الاختصاصات",
        critical: "حرج",
        high: "مرتفع",
        medium: "متوسط",
        low: "منخفض",
        framework: "الإطار",
        country: "الدولة",
        requirement: "المتطلب",
        frequency: "التكرار",
        risk: "المخاطر",
        authority: "الجهة المختصة",
        topic: "الموضوع",
        saudi: "المملكة العربية السعودية",
        china: "الصين",
        notes: "ملاحظات",
        confidentialNotice:
            "⚠ سري — هذه الوثيقة مخصصة حصرياً لأنشطة التدقيق ومراجعة الامتثال المعتمدة. يُحظر توزيعها دون إذن.",
        pdfNote:
            "هذا التقرير منسّق للتقديم المباشر إلى الجهات التنظيمية الحكومية. " +
            "نسخة Markdown المرفقة مناسبة لمستودعات التوثيق الخاضعة للتحكم بالإصدارات.",
    },
    zh: {
        title: "DJAC 合规评估报告",
        subtitle: "多司法管辖区监管合规 | 政府报送就绪",
        jurisdiction: "司法管辖区",
        generated: "生成日期",
        classification: "保密级别",
        classificationValue: "保密 — 已备审",
        preparedBy: "编制单位",
        preparedByValue: "DJAC 自动化合规引擎 v1.0",
        execSummary: "执行摘要",
        execSummaryIntro:
            "本报告对所选监管司法管辖区进行全面合规评估，汇总监管框架覆盖范围、" +
            "合规义务时间表、跨司法管辖区关系分析及优先整改指导意见，适合直接提交政府监管机构。",
        keyStats: "关键统计数据",
        frameworksLabel: "覆盖框架数",
        obligationsLabel: "合规义务总数",
        criticalObligationsLabel: "关键义务数",
        authoritiesLabel: "主管机构",
        frameworkCoverage: "一、监管框架覆盖范围",
        saudiFrameworks: "1.1 沙特阿拉伯",
        chinaFrameworks: "1.2 中华人民共和国",
        crossJurisdiction: "1.3 跨司法管辖区关系分析",
        complianceStatus: "二、合规状态矩阵",
        compMatrix: "2.1 框架对比矩阵",
        securitySection: "三、安全指标与风险评估",
        penaltiesSection: "3.1 最高处罚风险敞口",
        cwTopics: "四、跨司法管辖区专题分析",
        oblSection: "五、合规义务与截止日期",
        criticalHeader: "5.1 关键及高优先级义务",
        ongoingHeader: "5.2 持续性常态义务",
        recommendations: "六、建议与整改指南",
        appendixSection: "七、附录",
        appendixAuthorities: "附录A：主管机构",
        appendixReferences: "附录B：法规参考",
        appendixMeta: "附录C：报告元数据",
        reportId: "报告编号",
        generatedAt: "生成时间",
        engineVersion: "引擎版本",
        engineValue: "DJAC v1.0 — 多司法管辖区合规自动化引擎",
        critical: "紧急",
        high: "高",
        medium: "中",
        low: "低",
        framework: "框架",
        country: "国家/地区",
        requirement: "合规要求",
        frequency: "频率",
        risk: "风险",
        authority: "主管机构",
        topic: "主题",
        saudi: "沙特阿拉伯",
        china: "中国",
        notes: "备注",
        confidentialNotice:
            "⚠ 保密 — 本文件仅供授权审计及合规审查活动使用。未经授权不得分发。",
        pdfNote:
            "本报告已格式化，可直接提交政府监管机构。" +
            "随附的 Markdown 版本适用于版本控制文档管理系统。",
    },
};

function lbl(locale: ReportLocale, key: string): string {
    return LABELS[locale]?.[key] ?? LABELS.en[key] ?? key;
}

function hr(): string {
    return "\n\n---\n\n";
}

function badge(locale: ReportLocale, sev: string): string {
    const m: Record<string, string> = {
        critical: lbl(locale, "critical"),
        high: lbl(locale, "high"),
        medium: lbl(locale, "medium"),
        low: lbl(locale, "low"),
    };
    return m[sev.toLowerCase()] ?? sev;
}

function saudiFrameworkBlock(locale: ReportLocale): string {
    return (
        `| ${lbl(locale, "framework")} | ${lbl(locale, "authority")} | Max Penalty | Effective |\n` +
        `|---|---|---|---|\n` +
        `| **PDPL** — Personal Data Protection Law | SDAIA | SAR 5,000,000 | Sep 2023 |\n` +
        `| **NCA-ECC** — Essential Cybersecurity Controls | NCA | License revocation | 2018 (rev. 2021) |\n` +
        `| **NCA-CCC** — Cloud Cybersecurity Controls | NCA | Service suspension | 2020 |\n`
    );
}

function chinaFrameworkBlock(locale: ReportLocale): string {
    return (
        `| ${lbl(locale, "framework")} | ${lbl(locale, "authority")} | Max Penalty | Effective |\n` +
        `|---|---|---|---|\n` +
        `| **PIPL** — Personal Information Protection Law | CAC (NISA) | RMB 50M or 5% global revenue | Nov 2021 |\n` +
        `| **CSL** — Cybersecurity Law | CAC / MIIT | RMB 1,000,000 | Jun 2017 |\n` +
        `| **DSL** — Data Security Law | NPC / MIIT | RMB 10,000,000 | Sep 2021 |\n` +
        `| **MLPS 2.0** — Multi-Level Protection Scheme | MPS / MIIT | RMB 500,000 + criminal | Dec 2019 |\n`
    );
}

function buildRecommendations(locale: ReportLocale): string {
    const recs: Record<ReportLocale, string[]> = {
        en: [
            "**Immediate** — Appoint a Data Protection Officer (DPO) covering PDPL (Saudi) and PIPL (China) requirements; both regimes mandate this role explicitly.",
            "**30 days** — Complete cross-border data transfer impact assessments for all regulated data categories (personal, sensitive, critical).",
            "**60 days** — Achieve ISO 27001 baseline certification or equivalent evidence to satisfy NCA-ECC, CSL, and MLPS 2.0 prerequisites.",
            "**90 days** — Submit NCA ECC self-assessment to the National Cybersecurity Authority. Retain MLPS 2.0 third-party assessment evidence for CAC review.",
            "**Ongoing** — Maintain incident response procedures meeting 72-hour PDPL notification requirements and 24-hour PIPL critical-incident timelines.",
            "**Ongoing** — Maintain jurisdiction-specific evidence packs ready for SDAIA, NCA, and CAC regulatory examinations.",
            "**Annual** — Conduct formal internal cybersecurity audits aligned to NCA-ECC controls and CSL graded-protection requirements.",
        ],
        ar: [
            "**فوري** — تعيين مسؤول حماية البيانات (DPO) ليغطي التزامات نظام PDPL السعودي وPIPL الصيني — مطلوب صراحةً من كلا النظامين.",
            "**خلال 30 يوماً** — إتمام تقييمات أثر نقل البيانات عبر الحدود لجميع الفئات المنظمة (الشخصية والحساسة والحيوية).",
            "**خلال 60 يوماً** — الحصول على شهادة ISO 27001 الأساسية أو ما يعادلها لاستيفاء متطلبات NCA-ECC وCSL وMLPS 2.0.",
            "**خلال 90 يوماً** — تقديم التقييم الذاتي لـ NCA ECC إلى الهيئة الوطنية للأمن السيبراني، والاحتفاظ بأدلة التقييم المستقل لـ MLPS 2.0 لمراجعة CAC.",
            "**مستمر** — الحفاظ على إجراءات الاستجابة للحوادث التي تستوفي متطلبات الإخطار في غضون 72 ساعة وفق PDPL وخلال 24 ساعة للحوادث الحرجة وفق PIPL.",
            "**مستمر** — الاحتفاظ بحزم أدلة خاصة بكل اختصاص قضائي جاهزة لفحوصات جهات SDAIA وNCA وCAC.",
            "**سنوي** — إجراء عمليات تدقيق داخلية رسمية لأمن المعلومات طبقاً لضوابط NCA-ECC ومتطلبات الحماية المتدرجة بموجب CSL.",
        ],
        zh: [
            "**立即** — 任命数据保护官（DPO），同时覆盖沙特PDPL和中国PIPL合规义务——两项监管体系均明确要求设立该角色。",
            "**30天内** — 完成所有受监管数据类别（个人、敏感及关键数据）的跨境数据传输影响评估。",
            "**60天内** — 取得ISO 27001基础认证或等效证据，满足NCA-ECC、CSL和MLPS 2.0的前提条件。",
            "**90天内** — 向沙特NCA提交ECC自评估报告；为CAC合规审查保留MLPS 2.0第三方评估证据。",
            "**持续** — 建立并维护符合PDPL 72小时通报要求和PIPL关键事件24小时通报时限的事件响应程序。",
            "**持续** — 针对SDAIA、NCA和CAC监管检查，保存各司法管辖区专项证据包并保持随时可用状态。",
            "**每年** — 按NCA-ECC控制要求及CSL分级保护规定，开展正式内部信息安全审计。",
        ],
    };
    return recs[locale].map((r, i) => `${i + 1}. ${r}`).join("\n\n");
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateComplianceReport(opts: ReportOptions): {
    markdown: string;
    reportId: string;
    generatedAt: string;
    title: string;
    templateName: string;
    reportType: ReportType;
    reportVersion: string;
    scorecardSummary: ReportScorecardSummary;
} {
    const { locale, jurisdiction, reportType = "full_compliance" } = opts;
    const now = new Date();
    const reportId =
        `DJAC-${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, "0")}-` +
        `${String(now.getDate()).padStart(2, "0")}-` +
        `${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // ── Aggregate data sources (all synchronous) ──────────────────
    const allObligations = listComplianceObligations();
    const compTable = getComparisonTable();
    const laws = listLawKnowledge();

    const includeSaudi = jurisdiction !== "China";
    const includeChina = jurisdiction !== "Saudi Arabia";
    const includeBoth = jurisdiction === "both";

    const filtered =
        jurisdiction === "Saudi Arabia"
            ? allObligations.filter(o => o.country === "Saudi Arabia")
            : jurisdiction === "China"
                ? allObligations.filter(o => o.country === "China")
                : allObligations;

    const criticalCount = filtered.filter(o => o.riskLevel === "critical").length;
    const highCount = filtered.filter(o => o.riskLevel === "high").length;
    const gapCount = criticalCount + highCount;

    // ── Scorecard computation ─────────────────────────────────────
    const frameworksCovered = includeBoth ? 7 : includeSaudi ? 3 : 4;
    const scoreFormula = (obligations: typeof filtered) => {
        const crit = obligations.filter(o => o.riskLevel === "critical").length;
        const high = obligations.filter(o => o.riskLevel === "high").length;
        return Math.max(45, Math.min(95, Math.round(100 - crit * 5 - high * 2)));
    };
    const overallScore = scoreFormula(filtered);
    const saudiObls = allObligations.filter(o => o.country === "Saudi Arabia");
    const chinaObls = allObligations.filter(o => o.country === "China");
    const saudiScore = includeSaudi ? scoreFormula(saudiObls) : null;
    const chinaScore = includeChina ? scoreFormula(chinaObls) : null;
    const reportVersion = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.0`;
    const scorecardSummary: ReportScorecardSummary = {
        overallScore,
        saudiScore,
        chinaScore,
        gapCount,
        criticalFindings: criticalCount,
        frameworksCovered,
        obligationsCovered: filtered.length,
        reportVersion,
    };

    // ── Report type metadata ──────────────────────────────────────
    const REPORT_TYPE_TEMPLATES: Record<ReportType, { titleSuffix: Record<ReportLocale, string>; templateName: string }> = {
        full_compliance: { titleSuffix: { en: "Full Compliance Assessment", ar: "تقييم الامتثال الكامل", zh: "全面合规评估" }, templateName: "Full Compliance Template" },
        gap_analysis: { titleSuffix: { en: "Gap Analysis Report", ar: "تقرير تحليل الفجوات", zh: "差距分析报告" }, templateName: "Gap Analysis Template" },
        vendor_assessment: { titleSuffix: { en: "Vendor Assessment Report", ar: "تقرير تقييم الموردين", zh: "供应商评估报告" }, templateName: "Vendor Assessment Template" },
        risk_assessment: { titleSuffix: { en: "Risk Assessment Report", ar: "تقرير تقييم المخاطر", zh: "风险评估报告" }, templateName: "Risk Assessment Template" },
        executive_summary: { titleSuffix: { en: "Executive Summary", ar: "الملخص التنفيذي", zh: "执行摘要" }, templateName: "Executive Summary Template" },
        regulatory_deadline: { titleSuffix: { en: "Regulatory Deadline Tracker", ar: "متتبع المواعيد التنظيمية", zh: "监管截止日期追踪" }, templateName: "Deadline Tracker Template" },
    };
    const typeMeta = REPORT_TYPE_TEMPLATES[reportType];
    const reportTitle = `${lbl(locale, "title")} — ${typeMeta.titleSuffix[locale]}`;
    const templateName = typeMeta.templateName;
    const includeSection = (section: string) => {
        if (reportType === "full_compliance") return true;
        if (reportType === "executive_summary") return ["header", "exec", "recommendations", "appendix"].includes(section);
        if (reportType === "regulatory_deadline") return ["header", "exec", "obligations", "appendix"].includes(section);
        if (reportType === "risk_assessment") return ["header", "exec", "security", "obligations_critical", "recommendations", "appendix"].includes(section);
        if (reportType === "gap_analysis") return ["header", "exec", "gaps", "recommendations", "appendix"].includes(section);
        if (reportType === "vendor_assessment") return ["header", "exec", "frameworks", "vendor_checklist", "recommendations", "appendix"].includes(section);
        return true;
    };

    const jurisdictionLabel = includeBoth
        ? `${lbl(locale, "saudi")} & ${lbl(locale, "china")}`
        : jurisdiction;

    const authoritiesValue = includeBoth
        ? "SDAIA, NCA, CAC, MIIT, MPS"
        : includeSaudi
            ? "SDAIA, NCA, CITC"
            : "CAC, MIIT, MPS, NPC";

    const frameworksValue = includeBoth
        ? "7 (PDPL, NCA-ECC, NCA-CCC, PIPL, CSL, DSL, MLPS 2.0)"
        : includeSaudi
            ? "3 (PDPL, NCA-ECC, NCA-CCC)"
            : "4 (PIPL, CSL, DSL, MLPS 2.0)";

    const L = (key: string) => lbl(locale, key);
    const parts: string[] = [];

    // ── HEADER ────────────────────────────────────────────────────
    parts.push(
        `# ${reportTitle}\n\n` +
        `*${L("subtitle")}*\n\n` +
        `| | |\n|---|---|\n` +
        `| **${L("jurisdiction")}** | ${jurisdictionLabel} |\n` +
        `| **${L("generated")}** | ${now.toUTCString()} |\n` +
        `| **${L("classification")}** | ${L("classificationValue")} |\n` +
        `| **${L("preparedBy")}** | ${L("preparedByValue")} |\n` +
        `| **Report Type** | ${typeMeta.titleSuffix[locale]} |\n` +
        `| **Report Version** | ${reportVersion} |\n\n` +
        `> ${L("confidentialNotice")}\n`
    );

    parts.push(hr());

    // ── EXECUTIVE SUMMARY ─────────────────────────────────────────
    parts.push(`## ${L("execSummary")}\n\n${L("execSummaryIntro")}\n`);
    parts.push(`\n**Key Insights:**\n`);
    parts.push(`- Critical obligations are concentrated in cross-border data transfer and incident response.\n`);
    parts.push(`- Most high-risk gaps relate to incomplete documentation or missing DPO assignment.\n`);
    parts.push(`- Penalty exposure is highest for unreported breaches and non-compliance with NCA-ECC.\n`);
    parts.push(`- Ongoing obligations require regular evidence pack updates for both SDAIA and CAC.\n`);
    // Key statistics table
    parts.push(
        `\n| ${L("keyStats")} | |\n|---|---|\n` +
        `| **${L("frameworksLabel")}** | ${frameworksValue} |\n` +
        `| **${L("obligationsLabel")}** | ${filtered.length} |\n` +
        `| **${L("criticalObligationsLabel")}** | ${criticalCount} |\n` +
        `| **${L("authoritiesLabel")}** | ${authoritiesValue} |\n` +
        `| **Overall Score** | ${overallScore}/100 |\n`
    );

    parts.push(hr());

    // ── SECTION 1: FRAMEWORK COVERAGE ────────────────────────────
    if (includeSection("frameworks")) {
        parts.push(`## ${L("frameworkCoverage")}\n\n`);

        if (includeSaudi) {
            parts.push(`### ${L("saudiFrameworks")}\n\n${saudiFrameworkBlock(locale)}\n`);
        }
        if (includeChina) {
            parts.push(`### ${L("chinaFrameworks")}\n\n${chinaFrameworkBlock(locale)}\n`);
        }
        if (includeBoth && compTable.length > 0) {
            const top = compTable.slice(0, 6);
            parts.push(
                `### ${L("crossJurisdiction")}\n\n` +
                `| ${L("topic")} | ${L("saudi")} | ${L("china")} | ${L("notes")} |\n` +
                `|---|---|---|---|\n` +
                top.map(r => `| ${r.topic} | ${r.saudiArabia} | ${r.china} | ${r.notes ?? ""} |`).join("\n") +
                "\n"
            );
        }

        parts.push(hr());
    } // end frameworks

    // ── VENDOR CHECKLIST (vendor_assessment only) ─────────────────
    if (includeSection("vendor_checklist")) {
        parts.push(`## Vendor Compliance Checklist\n\n`);
        parts.push(
            `| Requirement | Framework | Status | Action Required |\n` +
            `|---|---|---|---|\n` +
            `| Data Processing Agreement (DPA) in place | PDPL / PIPL | ⚠ Pending | Execute DPA with all data processors |\n` +
            `| Vendor security audit completed | NCA-ECC / MLPS 2.0 | ⚠ In Progress | Complete within 30 days |\n` +
            `| Sub-processor registry maintained | PDPL Art. 15 / PIPL Art. 21 | ✗ Not Started | Build registry with approval flow |\n` +
            `| Breach notification SLA agreed (72h/24h) | PDPL / PIPL | ⚠ Partial | Confirm contractual SLA thresholds |\n` +
            `| Cross-border transfer mechanism documented | PDPL / PIPL | ✗ Not Started | Complete DPIA and Standard Clauses |\n` +
            `| Annual compliance attestation | NCA-CCC / CSL | ✗ Not Started | Schedule annual vendor review cycle |\n`
        );
        parts.push(hr());
    } // end vendor_checklist

    // ── SECTION 2: COMPLIANCE STATUS MATRIX ──────────────────────
    if (includeSection("all")) {
        parts.push(`## ${L("complianceStatus")}\n\n### ${L("compMatrix")}\n\n`);

        if (includeSaudi) {
            parts.push(
                `**${L("saudi")}**\n\n` +
                `| ${L("framework")} | Controls | ${L("authority")} | Status |\n` +
                `|---|---|---|---|\n` +
                `| PDPL | Art. 1–45 | SDAIA | Active |\n` +
                `| NCA-ECC | 114 controls | NCA | Active |\n` +
                `| NCA-CCC | 58 controls | NCA | Active |\n\n`
            );
        }
        if (includeChina) {
            parts.push(
                `**${L("china")}**\n\n` +
                `| ${L("framework")} | Controls | ${L("authority")} | Status |\n` +
                `|---|---|---|---|\n` +
                `| PIPL | Art. 1–74 | CAC (NISA) | Active |\n` +
                `| CSL | Art. 1–79 | CAC / MIIT | Active |\n` +
                `| DSL | Art. 1–55 | NPC / MIIT | Active |\n` +
                `| MLPS 2.0 | 300+ controls | MPS | Active |\n\n`
            );
        }

        parts.push(hr());
    } // end all (section 2)

    // ── SECTION 3: SECURITY METRICS ──────────────────────────────
    if (includeSection("security")) {
        parts.push(`## ${L("securitySection")}\n\n### ${L("penaltiesSection")}\n\n`);
        parts.push(`\n**Key Risk Insights:**\n`);
        parts.push(`- Penalty exposure is highest for unreported breaches and cross-border data transfer violations.\n`);
        parts.push(`- Saudi PDPL and China PIPL both impose multi-million penalties and criminal liability for severe violations.\n`);
        parts.push(`- NCA-ECC and MLPS 2.0 require ongoing technical and organizational controls to avoid service suspension.\n`);
        if (includeSaudi) {
            parts.push(
                `\n**${L("saudi")} — PDPL / NCA:**\n\n` +
                `- Maximum administrative fine: **SAR 5,000,000** per violation\n` +
                `- Criminal liability: up to **2 years imprisonment** for intentional breach\n` +
                `- NCA non-compliance: mandatory corrective order + potential service suspension\n\n`
            );
        }
        if (includeChina) {
            parts.push(
                `\n**${L("china")} — PIPL / CSL / DSL:**\n\n` +
                `- PIPL: up to **RMB 50,000,000** or **5% of prior-year global annual turnover** (whichever is higher)\n` +
                `- CSL: up to **RMB 1,000,000** per incident + mandatory business suspension\n` +
                `- DSL: up to **RMB 10,000,000** + criminal prosecution for data offences endangering national security\n\n`
            );
        }

        parts.push(hr());
    } // end security

    // ── SECTION 4: CROSS-JURISDICTION ANALYSIS (both only) ───────
    if (includeSection("all") && includeBoth && compTable.length > 0) {
        parts.push(
            `## ${L("cwTopics")}\n\n` +
            `| ${L("topic")} | ${L("saudi")} | ${L("china")} | ${L("notes")} |\n` +
            `|---|---|---|---|\n` +
            compTable.map(r => `| ${r.topic} | ${r.saudiArabia} | ${r.china} | ${r.notes ?? ""} |`).join("\n") +
            "\n"
        );
        parts.push(hr());
    }

    // ── GAP ANALYSIS SECTION (gap_analysis type only) ────────────
    if (includeSection("gaps")) {
        const gapObls = filtered.filter(
            o => o.riskLevel === "critical" || o.riskLevel === "high"
        );
        parts.push(`## Gap Analysis — High-Priority Remediation Items\n\n`);
        parts.push(
            `> **${gapObls.length} compliance gap(s) identified** across ${frameworksCovered} frameworks. ` +
            `Overall compliance score: **${overallScore}/100**.\n\n`
        );
        parts.push(
            `| Gap # | Requirement | Framework | Jurisdiction | Risk Level | Priority Action |\n` +
            `|---|---|---|---|---|---|\n` +
            gapObls.map((o, i) =>
                `| ${i + 1} | ${o.requirement} | ${o.framework} | ${o.country} | **${badge(locale, o.riskLevel)}** | Immediate remediation required |`
            ).join("\n") +
            "\n\n"
        );
        parts.push(hr());
    } // end gaps

    // ── SECTION 5: OBLIGATIONS ────────────────────────────────────
    if (includeSection("obligations") || includeSection("obligations_critical")) {
        parts.push(`## ${L("oblSection")}\n\n`);
        parts.push(`\n**Actionable Insights:**\n`);
        parts.push(`- Immediate focus: appoint DPO and complete cross-border data transfer assessments.\n`);
        parts.push(`- Ongoing: maintain evidence packs and incident response readiness.\n`);
        parts.push(`- Annual: schedule internal cybersecurity audits and regulatory self-assessments.\n`);

        const critAndHigh = filtered.filter(
            o => o.riskLevel === "critical" || o.riskLevel === "high"
        );
        const ongoing = filtered.filter(o => o.frequency === "ongoing");

        parts.push(
            `### ${L("criticalHeader")}\n\n` +
            `| ${L("requirement")} | ${L("framework")} | ${L("country")} | ${L("risk")} | ${L("frequency")} | ${L("authority")} |\n` +
            `|---|---|---|---|---|---|\n` +
            (critAndHigh.length > 0
                ? critAndHigh
                    .map(
                        o =>
                            `| ${o.requirement} | ${o.framework} | ${o.country} | ${badge(locale, o.riskLevel)} | ${o.frequency.replace(/_/g, " ")} | ${o.authority} |`
                    )
                    .join("\n") + "\n\n"
                : "_No critical or high obligations identified for this jurisdiction selection._\n\n")
        );

        if (includeSection("obligations") && ongoing.length > 0) {
            parts.push(
                `### ${L("ongoingHeader")}\n\n` +
                `| ${L("requirement")} | ${L("framework")} | ${L("country")} | ${L("authority")} |\n` +
                `|---|---|---|---|\n` +
                ongoing
                    .map(o => `| ${o.requirement} | ${o.framework} | ${o.country} | ${o.authority} |`)
                    .join("\n") +
                "\n\n"
            );
        }

        parts.push(hr());
    } // end obligations

    // ── SECTION 6: RECOMMENDATIONS ───────────────────────────────
    parts.push(`## ${L("recommendations")}\n\n`);
    // Add visual checklist (SVG placeholder)
    parts.push('![Remediation Checklist](remediation-checklist.svg)\n');
    // Add summary
    parts.push(`\n**Remediation Priorities:**\n`);
    parts.push(`- Appoint DPO and assign clear responsibility for compliance.\n`);
    parts.push(`- Complete cross-border data transfer impact assessments.\n`);
    parts.push(`- Achieve baseline ISO 27001 or equivalent certification.\n`);
    parts.push(`- Maintain incident response and evidence packs for all frameworks.\n`);
    parts.push(`- Schedule annual internal audits and regulatory self-assessments.\n`);
    // Original recommendations
    parts.push(`\n${buildRecommendations(locale)}\n`);

    parts.push(hr());

    // ── SECTION 7: APPENDIX ───────────────────────────────────────
    parts.push(`## ${L("appendixSection")}\n\n`);

    parts.push(`### ${L("appendixAuthorities")}\n\n`);
    if (includeSaudi) {
        parts.push(
            `- **SDAIA** — Saudi Data & Artificial Intelligence Authority *(PDPL enforcement)*\n` +
            `- **NCA** — National Cybersecurity Authority *(ECC & CCC enforcement)*\n` +
            `- **CITC** — Communications, Space & Technology Commission\n`
        );
    }
    if (includeChina) {
        parts.push(
            `- **CAC** — Cyberspace Administration of China *(PIPL, CSL, DSL enforcement)*\n` +
            `- **MIIT** — Ministry of Industry and Information Technology\n` +
            `- **MPS** — Ministry of Public Security *(MLPS enforcement)*\n` +
            `- **NPC** — National People's Congress *(DSL legislation)*\n`
        );
    }

    const relevantLaws = laws
        .filter(l =>
            includeBoth
                ? true
                : l.jurisdiction === jurisdiction || l.jurisdiction === "Cross-border"
        )
        .slice(0, 10);

    if (relevantLaws.length > 0) {
        parts.push(
            `\n### ${L("appendixReferences")}\n\n` +
            relevantLaws
                .map(l => `- **${l.title}** *(${l.jurisdiction})* — ${l.summary.slice(0, 140)}...`)
                .join("\n") +
            "\n"
        );
    }

    parts.push(
        `\n### ${L("appendixMeta")}\n\n` +
        `| Property | Value |\n|---|---|\n` +
        `| **${L("reportId")}** | \`${reportId}\` |\n` +
        `| **${L("generatedAt")}** | ${now.toISOString()} |\n` +
        `| **${L("engineVersion")}** | ${L("engineValue")} |\n` +
        `| **${L("jurisdiction")}** | ${jurisdictionLabel} |\n` +
        `| **Language** | ${locale.toUpperCase()} |\n\n`
    );

    parts.push(`> ${L("pdfNote")}\n`);

    return {
        markdown: parts.join(""),
        reportId,
        generatedAt: now.toISOString(),
        title: reportTitle,
        templateName,
        reportType,
        reportVersion,
        scorecardSummary,
    };
}
