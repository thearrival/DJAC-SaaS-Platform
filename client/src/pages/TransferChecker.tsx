/**
 * TransferChecker.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Data Transfer Compliance Checker — interactive 3-step wizard that calculates
 * exactly which regulatory obligations apply for any cross-border data flow
 * within the Sino-Gulf regulatory space.
 *
 * Route: /transfer-checker
 */
import { useMemo, useState } from "react";
import type React from "react";
import { useTheme } from "@/contexts/useTheme";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    AlertTriangle, ArrowLeftRight, CheckCircle2,
    ChevronRight, Clock, Info, ShieldAlert, X, Zap,
    BookOpen, FileWarning, Timer, Scale,
} from "lucide-react";

// ── Jurisdictions ─────────────────────────────────────────────────────────────
const JURISDICTIONS = [
    { value: "cn", label: "China", flag: "🇨🇳", frameworks: ["PIPL", "CSL", "DSL"] },
    { value: "sa", label: "Saudi Arabia", flag: "🇸🇦", frameworks: ["PDPL", "NCA"] },
    { value: "ae", label: "UAE / Dubai", flag: "🇦🇪", frameworks: ["DIFC Data Protection"] },
    { value: "sg", label: "Singapore", flag: "🇸🇬", frameworks: ["PDPA"] },
    { value: "hk", label: "Hong Kong (SAR)", flag: "🇭🇰", frameworks: ["PDPO"] },
    { value: "in", label: "India", flag: "🇮🇳", frameworks: ["DPDP Act 2023"] },
    { value: "eu", label: "European Union", flag: "🇪🇺", frameworks: ["GDPR"] },
    { value: "us", label: "United States", flag: "🇺🇸", frameworks: ["CCPA / sectoral"] },
    { value: "other", label: "Other", flag: "🌐", frameworks: [] },
] as const;

type Jurisdiction = typeof JURISDICTIONS[number]["value"];

// ── Data categories ───────────────────────────────────────────────────────────
const DATA_CATEGORIES = [
    { id: "pd", label: "Personal Data", desc: "Names, IDs, contact details" },
    { id: "spd", label: "Sensitive Personal Data", desc: "Race, religion, political views" },
    { id: "health", label: "Health / Medical", desc: "Medical records, biometric health" },
    { id: "bio", label: "Biometric", desc: "Fingerprints, facial recognition" },
    { id: "fin", label: "Financial Records", desc: "Payments, accounts, credit data" },
    { id: "child", label: "Children's Data", desc: "Data of users under 14" },
    { id: "crit", label: "Critical Data", desc: "Sectoral important data (CAC/NCA)" },
    { id: "nsd", label: "National Security Data", desc: "State secrets, defense-adjacent" },
    { id: "biz", label: "General Business Data", desc: "HR, contracts, operational records" },
] as const;

type DataCategoryId = typeof DATA_CATEGORIES[number]["id"];

type VolumeLevel = "low" | "medium" | "high";

// ── Risk levels ───────────────────────────────────────────────────────────────
type RiskLevel = "blocked" | "approval" | "review" | "restricted" | "clear";

interface ComplianceStep {
    id: string;
    level: "blocked" | "critical" | "high" | "medium" | "low";
    text: string;
    detail: string;
    framework?: string;
    article?: string;
    timeline?: string;
}

interface Assessment {
    overallRisk: RiskLevel;
    frameworks: string[];
    steps: ComplianceStep[];
    penaltyExposure: string[];
    estimatedTimeline: string;
    notes: string[];
}

// ── Rules engine ──────────────────────────────────────────────────────────────
function runAssessment(
    from: Jurisdiction,
    to: Jurisdiction,
    volume: VolumeLevel,
    types: DataCategoryId[],
): Assessment {
    const steps: ComplianceStep[] = [];
    const frameworks = new Set<string>();
    const notes: string[] = [];

    const chn = from === "cn" || to === "cn";
    const hkInv = from === "hk" || to === "hk";
    const saInv = from === "sa" || to === "sa";
    const aeInv = from === "ae" || to === "ae";
    const sgInv = from === "sg" || to === "sg";
    const euInv = from === "eu" || to === "eu";
    const inInv = from === "in" || to === "in";

    if (chn) { frameworks.add("PIPL"); frameworks.add("CSL"); frameworks.add("DSL"); }
    if (hkInv) { frameworks.add("PDPO (HK)"); }
    if (saInv) { frameworks.add("PDPL"); frameworks.add("NCA ECC"); }
    if (aeInv) { frameworks.add("DIFC Data Protection Law"); }
    if (sgInv) { frameworks.add("PDPA (Singapore)"); }
    if (euInv) { frameworks.add("GDPR"); }
    if (inInv) { frameworks.add("DPDP Act 2023"); }

    const hasSpd = types.some(t => ["spd", "health", "bio", "fin"].includes(t));
    const hasChild = types.includes("child");
    const hasCrit = types.includes("crit");
    const hasNsd = types.includes("nsd");

    // ── National Security / State Secrets ──────────────────────────────────
    if (hasNsd) {
        steps.push({
            id: "nsd-blocked", level: "blocked",
            text: "Transfer of national security data is prohibited across all Sino-Gulf frameworks",
            detail: "China DSL Art. 27 / Saudi Arabia PDPL Art. 2 exclusions: Data related to national security cannot be exported or transferred abroad.",
            framework: "DSL / PDPL",
            timeline: "BLOCKED",
        });
    }

    // ── China outbound ─────────────────────────────────────────────────────
    if (from === "cn") {
        if (hasCrit) {
            steps.push({
                id: "cn-crit-export", level: "blocked",
                text: "Critical / Important Data export is prohibited without State Council approval",
                detail: "DSL Art. 31: Operators of critical information infrastructure and national core data processors may not transfer important data abroad without a security assessment approved by the CAC and competent authority.",
                framework: "DSL", article: "Art. 31",
                timeline: "BLOCKED unless State Council approved",
            });
        }

        if (volume === "high") {
            steps.push({
                id: "cn-cac-security", level: "critical",
                text: "CAC Security Assessment required for 1M+ user-record transfer",
                detail: "PIPL Art. 40: Data processors who process PI of 1M+ individuals must submit to a CAC security assessment before any outbound transfer. Average processing time: 6–9 months.",
                framework: "PIPL", article: "Art. 40",
                timeline: "6–12 months",
            });
        } else if (volume === "medium") {
            steps.push({
                id: "cn-std-contract", level: "high",
                text: "Standard Contract required + CAC filing within 10 working days",
                detail: "PIPL Art. 38(4): Conclude a Personal Information Outbound Transfer Standard Contract (CAC template, March 2023). File with local CAC within 10 working days of signing.",
                framework: "PIPL", article: "Art. 38(4)",
                timeline: "4–8 weeks",
            });
        } else {
            steps.push({
                id: "cn-self-eval", level: "medium",
                text: "Self-evaluation report required for outbound transfer",
                detail: "CAC 2022 Measures Art. 5: All outbound data transfers require the processor to conduct and retain a risk self-evaluation report covering recipient security, transfer purpose, and sensitive data categories.",
                framework: "PIPL / CAC Measures",
                timeline: "2–4 weeks",
            });
        }

        if (hasSpd) {
            steps.push({
                id: "cn-pipl-sens", level: "high",
                text: "Separate explicit consent for Sensitive Personal Information",
                detail: "PIPL Art. 29: Sensitive PI (health, biometric, financial, religious belief) requires an additional stand-alone consent specifically for the cross-border transfer purpose.",
                framework: "PIPL", article: "Art. 29",
                timeline: "Before transfer",
            });
        }

        if (hasChild) {
            steps.push({
                id: "cn-child-pipl", level: "critical",
                text: "Guardian consent mandatory for minors' PI (under 14)",
                detail: "PIPL Art. 31: PI of minors under 14 is specially protected. Dedicated rules for minors' PI processing require guardian consent for outbound transfers.",
                framework: "PIPL", article: "Art. 31",
                timeline: "Before transfer",
            });
        }

        if (volume !== "low") {
            steps.push({
                id: "cn-piia", level: "medium",
                text: "Personal Information Impact Assessment (PIIA) required",
                detail: "PIPL Art. 55–56: Conduct a PIIA before cross-border transfer of PI. Document findings, retain records for 3 years, available for CAC inspection.",
                framework: "PIPL", article: "Art. 55-56",
                timeline: "2–6 weeks",
            });
        }

        steps.push({
            id: "cn-records", level: "low",
            text: "Maintain processing and transfer records for 3 years",
            detail: "PIPL Art. 51: Data processors must maintain records of PI processing activities; cross-border transfer agreements and self-evaluations must be kept for at least 3 years.",
            framework: "PIPL", article: "Art. 51",
            timeline: "Ongoing",
        });

        if (to === "sa") {
            notes.push("China and Saudi Arabia have no bilateral data-adequacy agreement. Both PIPL Art. 38 mechanisms AND PDPL Art. 29 safeguards must simultaneously be in place.");
        }
        if (to === "eu") {
            notes.push("EU is not on China's adequacy list. PIPL standard contracts to EU recipients must align with GDPR-equivalent protections.");
        }
    }

    // ── China inbound ──────────────────────────────────────────────────────
    if (to === "cn") {
        if (hasCrit) {
            steps.push({
                id: "cn-in-crit-sec", level: "critical",
                text: "Data classified as Critical enters China — CSL CII localization applies",
                detail: "CSL Art. 37 & DSL Art. 27: Critical Information Infrastructure Operators (CIIO) must store personal information and important data within China. Assess whether your entity qualifies as CIIO.",
                framework: "CSL / DSL", article: "Art. 37 / Art. 27",
                timeline: "Before operations",
            });
        }
        steps.push({
            id: "cn-localize-check", level: "medium",
            text: "Assess CSL Art. 37 data localization obligations",
            detail: "CSL Art. 37: All network operators processing personal info of Chinese individuals must ensure data is stored within China. Cross-border transfers require separate security assessment.",
            framework: "CSL", article: "Art. 37",
            timeline: "Before operations",
        });
    }

    // ── HK ↔ Mainland specific ─────────────────────────────────────────────
    if ((from === "hk" && to === "cn") || (from === "cn" && to === "hk")) {
        steps.push({
            id: "hk-cn-threshold", level: "high",
            text: "HK ↔ Mainland threshold rule: Standard Contract if >100K records/year",
            detail: "CAC 2023 Provisions: Transfers of PI between HK and Mainland China exceeding 100,000 users per year require filing of CAC-template standard contracts. HK PDPO Art. 33 also restricts cross-border transfers to adequate jurisdictions.",
            framework: "PIPL / PDPO", article: "2023 CAC Provisions",
            timeline: "3–6 months",
        });
    }

    // ── Saudi outbound ─────────────────────────────────────────────────────
    if (from === "sa") {
        if (hasCrit) {
            steps.push({
                id: "sa-crit-nca", level: "critical",
                text: "Critical sector data: NCA mandates on-premise storage — outbound transfer restricted",
                detail: "NCA CSCC / ECC Controls: Government, healthcare, finance, and telecom entities must store sensitive operational data within Saudi Arabia. Cross-border transfer of such data requires NCA authorization.",
                framework: "NCA ECC", article: "CSCC Domain 3",
                timeline: "Authorization required",
            });
        }

        steps.push({
            id: "sa-pdpl-29", level: "high",
            text: "SDAIA adequacy determination or contractual safeguards required",
            detail: "PDPL Art. 29: Transfer is only permitted to countries offering adequate protection (SDAIA-published list) or where contractual obligations providing equivalent protection are established.",
            framework: "PDPL", article: "Art. 29",
            timeline: "4–8 weeks",
        });

        if (!["ae", "sg", "eu"].includes(to)) {
            steps.push({
                id: "sa-binding-contract", level: "medium",
                text: "Execute binding cross-border data transfer agreement",
                detail: "SDAIA Guidelines: Recipient must sign a Data Transfer Agreement incorporating PDPL-equivalent protections. SDAIA may publish standard clauses; check SDAIA portal for updates.",
                framework: "PDPL",
                timeline: "4–6 weeks",
            });
        }

        if (hasSpd || types.includes("health") || types.includes("bio")) {
            steps.push({
                id: "sa-dpia", level: "high",
                text: "Data Protection Impact Assessment required for sensitive categories",
                detail: "PDPL Art. 5 & SDAIA Implementing Regulations: Processing of special categories (genetic, biometric, health, political, religious data) requires a DPIA documented before cross-border transfer.",
                framework: "PDPL", article: "Art. 5",
                timeline: "4–8 weeks",
            });
        }

        if (hasChild) {
            steps.push({
                id: "sa-child-consent", level: "high",
                text: "Guardian written consent required for minors' personal data",
                detail: "PDPL Art. 10: Processing and transferring personal information of children (under 18) requires verifiable written consent from parent or legal guardian.",
                framework: "PDPL", article: "Art. 10",
                timeline: "Before transfer",
            });
        }

        steps.push({
            id: "sa-record", level: "low",
            text: "Maintain SDAIA notification record for all outbound transfers",
            detail: "SDAIA may require entities to register cross-border data transfers in a national data transfer registry; monitor SDAIA portal for updated requirements.",
            framework: "PDPL",
            timeline: "Ongoing",
        });
    }

    // ── Saudi inbound ──────────────────────────────────────────────────────
    if (to === "sa") {
        steps.push({
            id: "sa-in-localize", level: "medium",
            text: "Assess NCA data residency obligations for sector",
            detail: "NCA ECC Controls / CITC for telecom: Critical sector entities operating in Saudi Arabia must store specified data types within the Kingdom. Confirm applicability before routing data to foreign cloud infrastructure.",
            framework: "NCA ECC",
            timeline: "Before operations",
        });
    }

    // ── GDPR cross-reference ───────────────────────────────────────────────
    if (euInv && (chn || saInv)) {
        steps.push({
            id: "gdpr-sccs", level: "high",
            text: "EU Standard Contractual Clauses (SCCs) required — neither China nor Saudi Arabia is adequacy-listed",
            detail: "GDPR Art. 46: Transfers to non-adequate third countries require SCCs, BCRs, or other approved safeguards. China and Saudi Arabia are not on the EU adequacy list. Apply EDPB supplementary measures where required.",
            framework: "GDPR", article: "Art. 46",
            timeline: "4–8 weeks",
        });
        if (from === "eu" && to === "cn") {
            notes.push("EU→China transfers additionally trigger PIPL obligations for the Chinese recipient. Dual-track compliance (GDPR SCCs + PIPL standard contracts) is required.");
        }
    }

    // ── Overall risk ───────────────────────────────────────────────────────
    const hasBlocked = steps.some(s => s.level === "blocked");
    const hasCritical = steps.some(s => s.level === "critical");
    const hasHigh = steps.some(s => s.level === "high");
    const hasMedium = steps.some(s => s.level === "medium");

    const overallRisk: RiskLevel = hasBlocked ? "blocked"
        : hasCritical ? "approval"
            : hasHigh ? "review"
                : hasMedium ? "restricted"
                    : "clear";

    // ── Penalty exposure ───────────────────────────────────────────────────
    const penaltyExposure: string[] = [];
    if (chn) penaltyExposure.push("PIPL: up to CNY 50M or 5% annual global revenue");
    if (chn) penaltyExposure.push("DSL: up to CNY 10M + business suspension");
    if (saInv) penaltyExposure.push("PDPL: up to SAR 5M (~$1.33M) + imprisonment for willful violations");
    if (euInv) penaltyExposure.push("GDPR: up to €20M or 4% global annual turnover");

    // ── Timeline (worst-case critical path) ───────────────────────────────
    const timelineSteps = steps.filter(s => s.timeline && !["Before transfer", "Before operations", "Ongoing", "BLOCKED"].includes(s.timeline));
    const estimatedTimeline = timelineSteps.length > 0
        ? timelineSteps.sort((a, b) => {
            const extractMax = (t?: string) => parseInt((t ?? "0").match(/\d+/g)?.pop() ?? "0");
            return extractMax(b.timeline) - extractMax(a.timeline);
        })[0].timeline ?? "4–8 weeks"
        : steps.length > 0 ? "2–4 weeks (standard review)" : "No major requirements";

    return { overallRisk, frameworks: [...frameworks], steps, penaltyExposure, estimatedTimeline, notes };
}

// ── Risk badge config ─────────────────────────────────────────────────────────
const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }> = {
    clear: { label: "Likely Compliant", color: "#16a34a", bg: "rgba(22,163,74,0.10)", Icon: CheckCircle2 },
    restricted: { label: "Minor Requirements", color: "#0ea5e9", bg: "rgba(14,165,233,0.10)", Icon: Info },
    review: { label: "Review Required", color: "#d97706", bg: "rgba(217,119,6,0.10)", Icon: Clock },
    approval: { label: "Regulatory Approval Needed", color: "#ea580c", bg: "rgba(234,88,12,0.11)", Icon: AlertTriangle },
    blocked: { label: "Transfer Blocked", color: "#dc2626", bg: "rgba(220,38,38,0.11)", Icon: X },
};

const STEP_COLORS: Record<ComplianceStep["level"], string> = {
    blocked: "#dc2626",
    critical: "#ea580c",
    high: "#d97706",
    medium: "#0ea5e9",
    low: "#16a34a",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function TransferChecker() {
    usePageTitle("Data Transfer Compliance Checker");
    const { theme } = useTheme();
    const { t } = useLocale();
    const isDark = theme === "dark";

    const [from, setFrom] = useState<Jurisdiction | "">("");
    const [to, setTo] = useState<Jurisdiction | "">("");
    const [volume, setVolume] = useState<VolumeLevel>("medium");
    const [types, setTypes] = useState<DataCategoryId[]>(["pd"]);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const assessment = useMemo<Assessment | null>(() => {
        if (!from || !to || from === to || types.length === 0 || step < 3) return null;
        return runAssessment(from as Jurisdiction, to as Jurisdiction, volume, types);
    }, [from, to, volume, types, step]);

    const C = useMemo(() => ({
        bg: isDark ? "#040f24" : "#f0f6ff",
        card: isDark ? "rgba(6,14,36,0.97)" : "rgba(248,252,255,0.98)",
        border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
        text: isDark ? "#dce6ff" : "#1e293b",
        muted: isDark ? "#5a6fa8" : "#64748b",
        accent: isDark ? "#00d4ff" : "#0284c7",
        inputBg: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
        hover: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    }), [isDark]);

    function toggleType(id: DataCategoryId) {
        setTypes(prev =>
            prev.includes(id) ? (prev.length > 1 ? prev.filter(x => x !== id) : prev)
                : [...prev, id]
        );
    }

    const canProgress1 = !!from && !!to && from !== to;
    const canRun = types.length > 0;

    const selectStyle: React.CSSProperties = {
        width: "100%", padding: "9px 12px", borderRadius: 9,
        border: `1px solid ${C.border}`,
        background: C.inputBg, color: C.text, fontSize: 13,
        outline: "none", cursor: "pointer",
        appearance: "none" as const,
    };

    const fromNode = JURISDICTIONS.find(j => j.value === from);
    const toNode = JURISDICTIONS.find(j => j.value === to);

    return (
        <div className="djac-page">
            {/* ── Page Header ── */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: `${C.accent}14`, border: `1px solid ${C.accent}28`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <ArrowLeftRight style={{ width: 18, height: 18, color: C.accent }} />
                    </div>
                    <div>
                        <h1 style={{ color: C.text, fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                            {t("transferChecker.title", "Data Transfer Compliance Checker")}
                        </h1>
                        <p style={{ color: C.muted, fontSize: 12, margin: 0, marginTop: 3 }}>
                            {t("transferChecker.subtitle", "Instantly determine which regulatory obligations, approvals, and contractual safeguards apply to any Sino-Gulf cross-border data transfer.")}
                        </p>
                    </div>
                </div>
                {/* Step progress bar */}
                <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
                    {([1, 2, 3] as const).map(s => (
                        <div key={s} style={{
                            height: 4, flex: 1, borderRadius: 4,
                            background: step >= s ? C.accent : C.border,
                            transition: "background 0.3s",
                        }} />
                    ))}
                </div>
                <p style={{ color: C.muted, fontSize: 10.5, marginTop: 5 }}>
                    {step === 1 && t("transferChecker.step1Label", "Step 1 of 3 — Set transfer endpoints")}
                    {step === 2 && t("transferChecker.step2Label", "Step 2 of 3 — Classify your data")}
                    {step === 3 && t("transferChecker.step3Label", "Step 3 — View compliance assessment")}
                </p>
            </div>

            <div className={step === 3 ? "djac-transfer-step3-grid" : undefined} style={{ display: "grid", gridTemplateColumns: step === 3 ? "1fr 1.5fr" : "1fr", gap: 20, maxWidth: step === 3 ? "none" : 620 }}>

                {/* ── Wizard panel ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                    {/* Step 1: Jurisdictions */}
                    <div style={{
                        background: C.card, border: `1px solid ${step === 1 ? C.accent + "44" : C.border}`,
                        borderRadius: 14, padding: 20,
                        boxShadow: step === 1 ? `0 0 0 2px ${C.accent}14` : "none",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <span style={{
                                width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 800,
                                background: step > 1 ? "#16a34a" : C.accent, color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                            }}>{step > 1 ? "âœ“" : "1"}</span>
                            <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>
                                {t("transferChecker.step1.title", "Transfer Endpoints")}
                            </span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "end" }}>
                            <div>
                                <label style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    {t("transferChecker.step1.from", "Source Jurisdiction")}
                                </label>
                                <Select value={from || "__empty__"} onValueChange={value => setFrom(value === "__empty__" ? "" : (value as Jurisdiction))} disabled={step > 1}>
                                    <SelectTrigger style={selectStyle} aria-label={t("transferChecker.step1.from", "Source Jurisdiction")}>
                                        <SelectValue placeholder="— Select —" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__empty__">— Select —</SelectItem>
                                        {JURISDICTIONS.map(j => (
                                            <SelectItem key={j.value} value={j.value}>{j.flag} {j.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div style={{ paddingBottom: 2 }}>
                                <ArrowLeftRight style={{ width: 18, height: 18, color: C.muted, opacity: 0.6 }} />
                            </div>
                            <div>
                                <label style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                    {t("transferChecker.step1.to", "Destination Jurisdiction")}
                                </label>
                                <Select value={to || "__empty__"} onValueChange={value => setTo(value === "__empty__" ? "" : (value as Jurisdiction))} disabled={step > 1}>
                                    <SelectTrigger style={selectStyle} aria-label={t("transferChecker.step1.to", "Destination Jurisdiction")}>
                                        <SelectValue placeholder="— Select —" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__empty__">— Select —</SelectItem>
                                        {JURISDICTIONS.filter(j => j.value !== from).map(j => (
                                            <SelectItem key={j.value} value={j.value}>{j.flag} {j.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Volume */}
                        <div style={{ marginTop: 16 }}>
                            <label style={{ fontSize: 10.5, fontWeight: 700, color: C.muted, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                {t("transferChecker.step1.volume", "Monthly Transfer Volume")}
                            </label>
                            <div style={{ display: "flex", gap: 8 }}>
                                {(["low", "medium", "high"] as const).map(v => (
                                    <button
                                        key={v} type="button" disabled={step > 1}
                                        onClick={() => setVolume(v)}
                                        style={{
                                            flex: 1, padding: "8px 6px", borderRadius: 8, cursor: step > 1 ? "default" : "pointer",
                                            border: `1px solid ${volume === v ? C.accent : C.border}`,
                                            background: volume === v ? `${C.accent}14` : C.inputBg,
                                            color: volume === v ? C.accent : C.muted,
                                            fontSize: 11, fontWeight: 700, textTransform: "capitalize",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {v === "low" ? t("transferChecker.volumeLow", "Low (<10K/mo)") : v === "medium" ? t("transferChecker.volumeMedium", "Medium (10K–1M)") : t("transferChecker.volumeHigh", "High (1M+)")}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active summary (collapsed view) */}
                        {step > 1 && fromNode && toNode && (
                            <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: `${C.accent}0a`, border: `1px solid ${C.accent}20`, display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 11.5 }}>{fromNode.flag} {fromNode.label}</span>
                                <ArrowLeftRight style={{ width: 12, height: 12, color: C.muted }} />
                                <span style={{ fontSize: 11.5 }}>{toNode.flag} {toNode.label}</span>
                                <span style={{ fontSize: 10, color: C.muted, marginLeft: "auto", textTransform: "capitalize" }}>{volume} volume</span>
                                <button type="button" onClick={() => setStep(1)} style={{ fontSize: 10, color: C.accent, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}>Edit</button>
                            </div>
                        )}

                        {step === 1 && (
                            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                                <Button onClick={() => setStep(2)} disabled={!canProgress1} size="sm" style={{ gap: 6 }}>
                                    {t("transferChecker.next", "Continue")} <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Data Categories */}
                    {step >= 2 && (
                        <div style={{
                            background: C.card, border: `1px solid ${step === 2 ? C.accent + "44" : C.border}`,
                            borderRadius: 14, padding: 20,
                            boxShadow: step === 2 ? `0 0 0 2px ${C.accent}14` : "none",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                                <span style={{
                                    width: 22, height: 22, borderRadius: "50%", fontSize: 11, fontWeight: 800,
                                    background: step > 2 ? "#16a34a" : C.accent, color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                }}>{step > 2 ? "âœ“" : "2"}</span>
                                <span style={{ color: C.text, fontSize: 13, fontWeight: 700 }}>
                                    {t("transferChecker.step2.title", "Data Classification")}
                                </span>
                                {step > 2 && (
                                    <button type="button" onClick={() => setStep(2)} style={{ fontSize: 10, color: C.accent, background: "none", border: "none", cursor: "pointer", marginLeft: "auto", fontWeight: 600 }}>Edit</button>
                                )}
                            </div>
                            <p style={{ fontSize: 10.5, color: C.muted, marginBottom: 12 }}>
                                {t("transferChecker.step2.hint", "Select all data categories included in this transfer. You must select at least one.")}
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                                {DATA_CATEGORIES.map(cat => {
                                    const selected = types.includes(cat.id);
                                    return (
                                        <button
                                            key={cat.id} type="button"
                                            disabled={step > 2}
                                            onClick={() => toggleType(cat.id)}
                                            title={cat.desc}
                                            style={{
                                                padding: "5px 11px", borderRadius: 20, cursor: step > 2 ? "default" : "pointer",
                                                border: `1px solid ${selected ? C.accent : C.border}`,
                                                background: selected ? `${C.accent}14` : C.inputBg,
                                                color: selected ? C.accent : C.muted,
                                                fontSize: 11, fontWeight: 600,
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {cat.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {step === 2 && (
                                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                                    <Button onClick={() => setStep(3)} disabled={!canRun} size="sm" style={{ gap: 6, background: "#16a34a", color: "#fff", border: "none" }}>
                                        <Zap className="h-3.5 w-3.5" />
                                        {t("transferChecker.runCheck", "Run Compliance Check")}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Results panel ── */}
                {step === 3 && assessment && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                        {/* Overall risk */}
                        {(() => {
                            const cfg = RISK_CONFIG[assessment.overallRisk];
                            return (
                                <div style={{
                                    padding: "16px 20px", borderRadius: 14,
                                    background: cfg.bg, border: `1.5px solid ${cfg.color}45`,
                                    display: "flex", alignItems: "center", gap: 14,
                                }}>
                                    <cfg.Icon style={{ width: 28, height: 28, color: cfg.color, flexShrink: 0 }} />
                                    <div>
                                        <p style={{ color: cfg.color, fontSize: 14, fontWeight: 800, margin: 0 }}>{cfg.label}</p>
                                        <p style={{ color: C.muted, fontSize: 10.5, margin: "3px 0 0" }}>
                                            {fromNode?.flag} {fromNode?.label} → {toNode?.flag} {toNode?.label}
                                            &nbsp;·&nbsp;
                                            <span style={{ textTransform: "capitalize" }}>{volume} volume</span>
                                            &nbsp;·&nbsp;
                                            {types.length} data {types.length === 1 ? "category" : "categories"}
                                        </p>
                                    </div>
                                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                        <p style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Est. Timeline</p>
                                        <p style={{ color: C.text, fontSize: 12, fontWeight: 800, margin: "2px 0 0", fontFamily: "monospace" }}>{assessment.estimatedTimeline}</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Applicable frameworks */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                                <Scale style={{ width: 13, height: 13, color: C.accent }} />
                                <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{t("transferChecker.results.frameworks", "Applicable Regulatory Frameworks")}</span>
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {assessment.frameworks.map(fw => (
                                    <Badge key={fw} variant="outline" style={{ fontSize: 10.5, fontWeight: 700, borderColor: `${C.accent}40`, color: C.accent }}>
                                        {fw}
                                    </Badge>
                                ))}
                                {assessment.frameworks.length === 0 && (
                                    <span style={{ color: C.muted, fontSize: 11 }}>No major frameworks triggered (check general local law)</span>
                                )}
                            </div>
                        </div>

                        {/* Compliance steps */}
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                                <BookOpen style={{ width: 13, height: 13, color: C.accent }} />
                                <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>
                                    {t("transferChecker.results.steps", "Required Compliance Actions")}
                                    <span style={{ color: C.muted, fontSize: 10.5, fontWeight: 400, marginLeft: 6 }}>({assessment.steps.length})</span>
                                </span>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {assessment.steps.length === 0 && (
                                    <p style={{ color: C.muted, fontSize: 11 }}>No specific actions identified for this combination.</p>
                                )}
                                {assessment.steps.map((s, i) => {
                                    const color = STEP_COLORS[s.level];
                                    return (
                                        <div key={s.id} style={{
                                            padding: "10px 13px", borderRadius: 10,
                                            border: `1px solid ${color}25`,
                                            background: `${color}07`,
                                            display: "flex", gap: 10, alignItems: "flex-start",
                                        }}>
                                            <span style={{
                                                width: 20, height: 20, borderRadius: "50%",
                                                background: `${color}18`, border: `1.5px solid ${color}35`,
                                                color, fontSize: 9.5, fontWeight: 800,
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                flexShrink: 0, marginTop: 1,
                                            }}>{i + 1}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                                    <p style={{ color, fontSize: 11.5, fontWeight: 700, margin: 0 }}>{s.text}</p>
                                                    {s.article && (
                                                        <span style={{ fontSize: 9, color: `${color}b0`, fontWeight: 600, border: `1px solid ${color}25`, borderRadius: 4, padding: "1px 5px" }}>{s.article}</span>
                                                    )}
                                                </div>
                                                <p style={{ color: C.muted, fontSize: 10.5, margin: "4px 0 0", lineHeight: 1.45 }}>{s.detail}</p>
                                                {s.timeline && s.timeline !== "Ongoing" && (
                                                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                                                        <Timer style={{ width: 10, height: 10, color: C.muted }} />
                                                        <span style={{ fontSize: 10, color: C.muted, fontFamily: "monospace" }}>{s.timeline}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span style={{
                                                fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                                                color, background: `${color}14`, border: `1px solid ${color}25`,
                                                borderRadius: 5, padding: "2px 6px", flexShrink: 0,
                                            }}>{s.level}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Penalty exposure */}
                        {assessment.penaltyExposure.length > 0 && (
                            <div style={{ background: C.card, border: `1px solid rgba(220,38,38,0.22)`, borderRadius: 14, padding: "12px 18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                                    <FileWarning style={{ width: 13, height: 13, color: "#dc2626" }} />
                                    <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{t("transferChecker.results.penalties", "Maximum Penalty Exposure")}</span>
                                </div>
                                {assessment.penaltyExposure.map((p, i) => (
                                    <p key={`penalty-${i}`} style={{ color: isDark ? "#fca5a5" : "#7f1d1d", fontSize: 10.5, margin: i > 0 ? "3px 0 0" : 0 }}>
                                        • {p}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Notes */}
                        {assessment.notes.length > 0 && (
                            <div style={{ background: isDark ? "rgba(250,204,21,0.06)" : "rgba(253,224,71,0.12)", border: `1px solid rgba(202,138,4,0.25)`, borderRadius: 14, padding: "12px 18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                                    <ShieldAlert style={{ width: 13, height: 13, color: "#d97706" }} />
                                    <span style={{ color: C.text, fontSize: 12, fontWeight: 700 }}>{t("transferChecker.results.notes", "Dual-Compliance Notes")}</span>
                                </div>
                                {assessment.notes.map((n, i) => (
                                    <p key={`note-${i}`} style={{ color: isDark ? "#fde68a" : "#78350f", fontSize: 10.5, margin: i > 0 ? "5px 0 0" : 0, lineHeight: 1.45 }}>
                                        {n}
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: "flex", gap: 8 }}>
                            <Button size="sm" variant="outline" onClick={() => { setStep(1); setFrom(""); setTo(""); setVolume("medium"); setTypes(["pd"]); }} style={{ gap: 5, fontSize: 11 }}>
                                <ArrowLeftRight className="h-3 w-3" />
                                {t("transferChecker.newCheck", "New Check")}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setStep(2)} style={{ gap: 5, fontSize: 11 }}>
                                {t("transferChecker.editData", "Edit Data Types")}
                            </Button>
                        </div>

                        {/* Disclaimer */}
                        <div style={{ padding: "10px 14px", borderRadius: 10, background: C.inputBg, border: `1px solid ${C.border}` }}>
                            <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                                <Info style={{ width: 11, height: 11, color: C.muted, flexShrink: 0, marginTop: 1 }} />
                                <p style={{ color: C.muted, fontSize: 9.5, margin: 0, lineHeight: 1.5 }}>
                                    {t("transferChecker.disclaimer", "This assessment is provided for informational purposes only and does not constitute legal advice. Consult qualified legal counsel before executing cross-border data transfers. Regulatory requirements change frequently; verify all requirements against current law.")}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
