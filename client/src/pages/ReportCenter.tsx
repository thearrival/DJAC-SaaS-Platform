import ReactMarkdown from "react-markdown";
import type React from "react";
import remarkGfm from "remark-gfm";
import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { formatDateTime } from "@/lib/intl";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, FileText, Globe, MapPin, RefreshCw, Copy, Mail, Send, ShieldCheck, Sparkles, Files, Languages, BarChart3, TrendingUp, AlertTriangle, Link as LinkIcon, CheckCheck, Printer } from "lucide-react";
import { sounds } from "@/lib/sounds";
import { toast } from "sonner";

type Jurisdiction = "Saudi Arabia" | "China" | "both";
type ReportLocale = "en" | "ar" | "zh";
type ReportType = "full_compliance" | "gap_analysis" | "vendor_assessment" | "risk_assessment" | "executive_summary" | "regulatory_deadline";

interface ReportScorecardSummary {
    overallScore: number;
    saudiScore: number | null;
    chinaScore: number | null;
    gapCount: number;
    criticalFindings: number;
    frameworksCovered: number;
    obligationsCovered: number;
    reportVersion: string;
}

function deriveReportInsights(markdown: string) {
    const lines = markdown.split(/\r?\n/);
    const sectionCount = lines.filter(line => line.trim().startsWith("## ")).length;
    const subSectionCount = lines.filter(line => line.trim().startsWith("### ")).length;
    const tableRowCount = lines.filter(line => line.trim().startsWith("|") && !/^\|[-\s|]+\|?$/.test(line.trim())).length;
    const bulletCount = lines.filter(line => /^[-*]\s+/.test(line.trim())).length;

    return {
        sectionCount,
        subSectionCount,
        tableRowCount,
        bulletCount,
    };
}

export default function ReportCenter() {
    usePageTitle("Report Center");
    const { t, locale } = useLocale();
    const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("both");
    const [reportLocale, setReportLocale] = useState<ReportLocale>("en");
    const [reportType, setReportType] = useState<ReportType>("full_compliance");
    const [result, setResult] = useState<{
        markdown: string;
        reportId: string;
        generatedAt: string;
        title: string;
        templateName: string;
        reportType?: ReportType;
        reportVersion?: string;
        scorecardSummary?: ReportScorecardSummary;
    } | null>(null);
    const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [shareCopied, setShareCopied] = useState(false);
    const searchString = useSearch();
    const [, setLocation] = useLocation();

    function decodeBase64File(base64: string, mimeType: string) {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new Blob([bytes], { type: mimeType });
    }

    const generateMutation = trpc.compliance.report.useMutation({
        onSuccess(data) {
            setResult(data);
            toast.success(t("reportCenter.toastGenerated", "Report generated"), {
                description: `${t("reportCenter.toastReportId", "Report ID")}: ${data.reportId}`,
            });
        },
        onError(err) {
            toast.error(t("reportCenter.toastGenerationFailed", "Generation failed"), { description: err.message });
        },
    });

    function handleGenerate() {
        setResult(null);
        generateMutation.mutate({ jurisdiction, locale: reportLocale, reportType });
    }

    const downloadDocxMutation = trpc.compliance.reportDocx.useMutation({
        onSuccess(data) {
            const blob = decodeBase64File(data.base64, data.mimeType);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = data.fileName;
            link.click();
            URL.revokeObjectURL(url);
            toast.success(t("reportCenter.toastDocxDownloaded", "Official Word template downloaded"), {
                description: `${t("reportCenter.toastReportId", "Report ID")}: ${data.reportId}`,
            });
        },
        onError(err) {
            toast.error(t("reportCenter.toastDocxFailed", "Word export failed"), { description: err.message });
        },
    });

    const downloadPdfMutation = trpc.compliance.reportPdf.useMutation({
        onSuccess(data) {
            const blob = decodeBase64File(data.base64, data.mimeType);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = data.fileName;
            link.click();
            URL.revokeObjectURL(url);
            toast.success(t("reportCenter.toastPdfDownloaded", "PDF downloaded"), {
                description: `${t("reportCenter.toastReportId", "Report ID")}: ${data.reportId}`,
            });
        },
        onError(err) {
            toast.error(t("reportCenter.toastPdfFailed", "PDF export failed"), { description: err.message });
        },
    });

    const emailReportMutation = trpc.compliance.emailReport.useMutation({
        onSuccess(data) {
            setIsEmailDialogOpen(false);
            toast.success(t("reportCenter.toastEmailSent", "Report email sent"), {
                description: `${t("reportCenter.emailRecipient", "Recipient")}: ${recipientEmail}`,
            });
            setRecipientEmail("");
        },
        onError(err) {
            toast.error(t("reportCenter.toastEmailFailed", "Report email failed"), { description: err.message });
        },
    });

    function handleDownloadMd() {
        if (!result) return;
        const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${result.reportId}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t("reportCenter.toastDownloaded", "Markdown file downloaded"));
    }

    async function handleCopyMd() {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.markdown);
            toast.success(t("reportCenter.toastCopied", "Markdown copied to clipboard"));
        } catch {
            toast.error(t("reportCenter.toastCopyFailed", "Failed to copy markdown"));
        }
    }

    function handleDownloadDocx() {
        if (!result) return;
        downloadDocxMutation.mutate({ jurisdiction, locale: reportLocale, reportType });
    }

    function handleDownloadPdf() {
        if (!result) return;
        downloadPdfMutation.mutate({ jurisdiction, locale: reportLocale, reportType });
    }

    function handleOpenEmailDialog() {
        if (!result) return;
        setRecipientEmail("");
        setIsEmailDialogOpen(true);
    }

    function handleSendEmail() {
        if (!result || recipientEmail.trim().length === 0) {
            return;
        }
        emailReportMutation.mutate({
            jurisdiction,
            locale: reportLocale,
            reportType,
            recipientEmail: recipientEmail.trim(),
        });
    }

    const createShareMutation = trpc.compliance.createShareLink.useMutation({
        onSuccess(data) {
            const url = `${window.location.origin}/report-center?share=${data.token}`;
            setShareUrl(url);
            void navigator.clipboard.writeText(url).then(() => {
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 3000);
            });
            toast.success(t("reportCenter.toastShareCopied", "Share link copied to clipboard"), {
                description: t("reportCenter.toastShareExpiry", "Link expires in 7 days"),
            });
        },
        onError(err) {
            toast.error(t("reportCenter.toastShareFailed", "Failed to create share link"), { description: err.message });
        },
    });

    const reportByTokenQuery = trpc.compliance.reportByToken.useQuery(
        { token: new URLSearchParams(searchString).get("share") ?? "" },
        {
            enabled: Boolean(new URLSearchParams(searchString).get("share")),
            retry: false,
        }
    );

    useEffect(() => {
        if (reportByTokenQuery.data) {
            const data = reportByTokenQuery.data;
            setResult(data);
            setJurisdiction((data.jurisdiction as Jurisdiction) ?? "both");
            setReportLocale((data.locale as ReportLocale) ?? "en");
            setReportType((data.reportType as ReportType) ?? "full_compliance");
            toast.success(t("reportCenter.toastSharedReport", "Shared report loaded"));
        }
    }, [reportByTokenQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (reportByTokenQuery.error) {
            toast.error(t("reportCenter.toastShareInvalid", "Share link is expired or invalid"));
            setLocation("/report-center");
        }
    }, [reportByTokenQuery.error]); // eslint-disable-line react-hooks/exhaustive-deps

    function handleCreateShare() {
        if (!result) return;
        createShareMutation.mutate({ jurisdiction, locale: reportLocale, reportType, ttlDays: 7 });
    }

    async function handleCopyShareUrl() {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 3000);
            toast.success(t("reportCenter.toastShareCopied", "Share link copied to clipboard"));
        } catch {
            toast.error(t("reportCenter.toastCopyFailed", "Failed to copy"));
        }
    }

    const isLoading = generateMutation.isPending || reportByTokenQuery.isLoading;
    const isWorking = isLoading || downloadDocxMutation.isPending || downloadPdfMutation.isPending || emailReportMutation.isPending || createShareMutation.isPending;
    const reportInsights = result ? deriveReportInsights(result.markdown) : null;

    useEffect(() => {
        const handleWindowKeyDown = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") {
                return;
            }

            const activeTag = document.activeElement?.tagName;
            if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT" || activeTag === "BUTTON") {
                return;
            }

            event.preventDefault();
            if (!isWorking) {
                handleGenerate();
            }
        };

        window.addEventListener("keydown", handleWindowKeyDown);
        return () => window.removeEventListener("keydown", handleWindowKeyDown);
    }, [isWorking, jurisdiction, reportLocale, reportType]);

    return (
        <div className="djac-page">
            <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("reportCenter.emailDialogTitle", "Email PDF report")}</DialogTitle>
                        <DialogDescription>
                            {t("reportCenter.emailDialogDescription", "Send the official template-backed Word report. A rendered PDF copy is also attached for quick sharing.")}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground" htmlFor="report-email-recipient">
                                {t("reportCenter.emailRecipient", "Recipient")}
                            </label>
                            <Input
                                id="report-email-recipient"
                                type="email"
                                value={recipientEmail}
                                onChange={event => setRecipientEmail(event.target.value)}
                                placeholder={t("reportCenter.emailPlaceholder", "name@company.com")}
                            />
                        </div>
                        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                            {result?.title ?? t("reportCenter.title", "Report Center")}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                                {t("reportCenter.cancel", "Cancel")}
                            </Button>
                            <Button
                                className="gap-2"
                                onClick={handleSendEmail}
                                disabled={emailReportMutation.isPending || recipientEmail.trim().length === 0}
                            >
                                {emailReportMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        {t("reportCenter.sendingEmail", "Sending…")}
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4" />
                                        {t("reportCenter.sendEmail", "Send email")}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* ── Page header ── */}
            <div className="border-b border-border/40 bg-card/30 px-6 py-5 no-print djac-section-1">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="djac-gradient-text text-xl font-semibold">
                            {t("reportCenter.title", "Report Center")}
                        </h1>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {t(
                                "reportCenter.subtitle",
                                "Generate government-ready compliance reports in PDF and Markdown. Multi-jurisdiction · Multi-language · Audit ready."
                            )}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 py-6">
                <div className="sr-only" role="status" aria-live="polite">
                    {isWorking
                        ? t("reportCenter.loadingStatus", "Report generation in progress.")
                        : result
                            ? t("reportCenter.readyStatus", "Report generated and ready for download.")
                            : ""}
                </div>
                <div className="no-print mb-6 grid gap-4 lg:grid-cols-3 djac-section-2">
                    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-rose-500/5 dark:to-rose-500/10 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-rose-100 p-2 text-rose-700">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{t("reportCenter.professionalPackTitle", "Government-ready output")}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{t("reportCenter.professionalPackDesc", "Official Word-template export, audit identifiers, and structured Markdown for compliance records.")}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-sky-500/5 dark:to-sky-500/10 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
                                <Languages className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{t("reportCenter.localeReadyTitle", "Cross-border presentation")}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{t("reportCenter.localeReadyDesc", "Generate in English, Arabic, or Chinese with localized report content and template-aware PDF rendering.")}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-amber-500/5 dark:to-amber-500/10 p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-amber-100 dark:bg-amber-950/50 p-2 text-amber-700 dark:text-amber-400">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">{t("reportCenter.deliveryTitle", "Delivery workflow")}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{t("reportCenter.deliveryDesc", "Review online, download the official Word template output, and send the report package directly by email from the reporting workspace.")}</p>
                            </div>
                        </div>
                    </div>
                </div>
                {/* ── Controls panel ── */}
                <div className="no-print mb-6 grid gap-4 rounded-xl border border-border/40 bg-card/40 p-5 sm:grid-cols-2 lg:grid-cols-5">

                    {/* Jurisdiction */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            {t("reportCenter.jurisdiction", "Jurisdiction")}
                        </label>
                        <Select
                            value={jurisdiction}
                            onValueChange={v => setJurisdiction(v as Jurisdiction)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={t("reportCenter.selectJurisdictionPlaceholder", "Select jurisdiction")} />
                            </SelectTrigger>
                            <SelectContent>
                                {(["Saudi Arabia", "China", "both"] as Jurisdiction[]).map(j => (
                                    <SelectItem key={j} value={j}>
                                        {j === "Saudi Arabia"
                                            ? t("reportCenter.jurisdictionSaudi", "Saudi Arabia")
                                            : j === "China"
                                                ? t("reportCenter.jurisdictionChina", "China")
                                                : t("reportCenter.jurisdictionBoth", "Both Jurisdictions")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Language */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Globe className="h-3.5 w-3.5" />
                            {t("reportCenter.language", "Report Language")}
                        </label>
                        <Select
                            value={reportLocale}
                            onValueChange={v => setReportLocale(v as ReportLocale)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={t("reportCenter.selectLanguagePlaceholder", "Select language")} />
                            </SelectTrigger>
                            <SelectContent>
                                {(["en", "ar", "zh"] as ReportLocale[]).map(l => (
                                    <SelectItem key={l} value={l}>
                                        {l === "en"
                                            ? t("reportCenter.localeEnglish", "English")
                                            : l === "ar"
                                                ? t("reportCenter.localeArabic", "Arabic")
                                                : t("reportCenter.localeChinese", "Chinese")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Report Type */}
                    <div className="flex flex-col gap-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <BarChart3 className="h-3.5 w-3.5" />
                            {t("reportCenter.reportType", "Report Type")}
                        </label>
                        <Select
                            value={reportType}
                            onValueChange={v => setReportType(v as ReportType)}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder={t("reportCenter.selectReportTypePlaceholder", "Select type")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full_compliance">{t("reportCenter.typeFullCompliance", "Full Compliance")}</SelectItem>
                                <SelectItem value="gap_analysis">{t("reportCenter.typeGapAnalysis", "Gap Analysis")}</SelectItem>
                                <SelectItem value="vendor_assessment">{t("reportCenter.typeVendorAssessment", "Vendor Assessment")}</SelectItem>
                                <SelectItem value="risk_assessment">{t("reportCenter.typeRiskAssessment", "Risk Assessment")}</SelectItem>
                                <SelectItem value="executive_summary">{t("reportCenter.typeExecutiveSummary", "Executive Summary")}</SelectItem>
                                <SelectItem value="regulatory_deadline">{t("reportCenter.typeRegulatoryDeadline", "Regulatory Deadlines")}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Format badges — informational */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                            {t("reportCenter.outputFormats", "Output Formats")}
                        </label>
                        <div className="flex gap-2 pt-1.5">
                            <Badge variant="secondary" className="text-xs">{t("reportCenter.formatDocx", "Official DOCX")}</Badge>
                            <Badge variant="secondary" className="text-xs">{t("reportCenter.formatPdf", "PDF")}</Badge>
                            <Badge variant="secondary" className="text-xs">{t("reportCenter.formatMarkdown", "Markdown")}</Badge>
                        </div>
                    </div>

                    {/* Generate button */}
                    <div className="flex flex-col justify-end gap-1.5">
                        <Button
                            className="h-9 w-full gap-2"
                            onClick={handleGenerate}
                            disabled={isWorking}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("reportCenter.generating", "Generating…")}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4" />
                                    {t("reportCenter.generate", "Generate Report")}
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                            {t("reportCenter.generateShortcutHint", "Press Ctrl+Enter to generate from anywhere on this page.")}
                        </p>
                    </div>
                </div>

                {/* ── Pre-generate placeholder ── */}
                {!result && !isLoading && (
                    <div className="no-print flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/50 bg-card/20 py-24 text-center">
                        <FileText className="h-10 w-10 text-muted-foreground/40" />
                        <p className="text-base font-medium text-foreground/90">
                            {t("reportCenter.emptyTitle", "No report generated yet")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {t(
                                "reportCenter.placeholder",
                                "Select jurisdiction and language, then click Generate Report."
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            {t(
                                "reportCenter.placeholderSub",
                                "Reports are generated server-side from live compliance data and are signed with a unique Report ID."
                            )}
                        </p>
                    </div>
                )}

                {/* ── Loading skeleton ── */}
                {isLoading && (
                    <div className="no-print flex items-center justify-center gap-3 rounded-xl border border-border/40 bg-card/30 py-24" role="status" aria-live="polite">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                            {t(
                                "reportCenter.buildingReport",
                                "Building report — aggregating framework data, obligations, and cross-jurisdiction analysis…"
                            )}
                        </span>
                    </div>
                )}

                {/* ── Report preview + action bar ── */}
                {result && (
                    <div>
                        {/* ── Scorecard Panel ── */}
                        {result.scorecardSummary && (
                            <div className="no-print mb-5 rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card/80 to-primary/5 p-5 shadow-sm">
                                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                        <p className="text-sm font-semibold text-foreground">{t("reportCenter.scorecardTitle", "Compliance Scorecard")}</p>
                                        <Badge variant="outline" className="font-mono text-xs">{t("reportCenter.scorecardVersion", "v")} {result.scorecardSummary.reportVersion}</Badge>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">{result.templateName}</Badge>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                    {/* Overall score */}
                                    <div className="sm:col-span-1 lg:col-span-2 flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 p-4">
                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">{t("reportCenter.scorecardOverall", "Overall Score")}</p>
                                        <p className={`text-4xl font-bold ${result.scorecardSummary.overallScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : result.scorecardSummary.overallScore >= 65 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                                            {result.scorecardSummary.overallScore}
                                            <span className="text-xl font-medium text-muted-foreground">/100</span>
                                        </p>
                                        <div className="mt-2 h-1.5 w-full rounded-full bg-border/50">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${result.scorecardSummary.overallScore >= 80 ? "bg-emerald-500" : result.scorecardSummary.overallScore >= 65 ? "bg-amber-500" : "bg-rose-500"}`}
                                                style={{ width: `${result.scorecardSummary.overallScore}%` }}
                                            />
                                        </div>
                                    </div>
                                    {/* Saudi score */}
                                    {result.scorecardSummary.saudiScore !== null && (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-card/60 p-3">
                                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("reportCenter.scorecardSaudi", "Saudi Arabia")}</p>
                                            <p className="mt-1 text-2xl font-bold text-foreground">{result.scorecardSummary.saudiScore}<span className="text-sm text-muted-foreground">/100</span></p>
                                        </div>
                                    )}
                                    {/* China score */}
                                    {result.scorecardSummary.chinaScore !== null && (
                                        <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-card/60 p-3">
                                            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("reportCenter.scorecardChina", "China")}</p>
                                            <p className="mt-1 text-2xl font-bold text-foreground">{result.scorecardSummary.chinaScore}<span className="text-sm text-muted-foreground">/100</span></p>
                                        </div>
                                    )}
                                    {/* Gaps */}
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200/60 dark:border-rose-800/40 bg-rose-50/40 dark:bg-rose-950/20 p-3">
                                        <div className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-rose-600 dark:text-rose-400" /><p className="text-xs uppercase tracking-[0.14em] text-rose-700 dark:text-rose-400">{t("reportCenter.scorecardGaps", "Gaps")}</p></div>
                                        <p className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-400">{result.scorecardSummary.gapCount}</p>
                                    </div>
                                    {/* Critical findings */}
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-orange-200/60 dark:border-orange-800/40 bg-orange-50/40 dark:bg-orange-950/20 p-3">
                                        <p className="text-xs uppercase tracking-[0.14em] text-orange-700 dark:text-orange-400">{t("reportCenter.scorecardCritical", "Critical")}</p>
                                        <p className="mt-1 text-2xl font-bold text-orange-700 dark:text-orange-400">{result.scorecardSummary.criticalFindings}</p>
                                    </div>
                                    {/* Frameworks */}
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-card/60 p-3">
                                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{t("reportCenter.scorecardFrameworks", "Frameworks")}</p>
                                        <p className="mt-1 text-2xl font-bold text-foreground">{result.scorecardSummary.frameworksCovered}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="no-print mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-primary/10 p-2 text-primary"><Files className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("reportCenter.metricSections", "Sections")}</p>
                                        <p className="text-2xl font-semibold text-foreground">{reportInsights?.sectionCount ?? 0}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-sky-100 p-2 text-sky-700"><Sparkles className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("reportCenter.metricDetailBlocks", "Detail blocks")}</p>
                                        <p className="text-2xl font-semibold text-foreground">{(reportInsights?.subSectionCount ?? 0) + (reportInsights?.tableRowCount ?? 0)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700"><Mail className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("reportCenter.metricDelivery", "Delivery")}</p>
                                        <p className="text-sm font-semibold text-foreground">{t("reportCenter.metricDeliveryValue", "DOCX, PDF, Markdown, Email")}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-border/50 bg-card/70 p-4 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-rose-100 p-2 text-rose-700"><ShieldCheck className="h-4 w-4" /></div>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t("reportCenter.metricStatus", "Readiness")}</p>
                                        <p className="text-sm font-semibold text-foreground">{t("reportCenter.metricStatusValue", "Executive review ready")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="no-print mb-5 rounded-2xl border border-border/50 bg-gradient-to-r from-card via-card to-rose-500/5 dark:to-rose-500/10 p-5 shadow-sm">
                            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{t("reportCenter.executiveSummaryTitle", "Executive delivery summary")}</p>
                                    <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                                        {t("reportCenter.executiveSummaryDesc", "This package combines narrative analysis, structured comparison tables, and remediation priorities in a board-ready format aligned to the official reporting template.")}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">{jurisdiction === "both" ? t("reportCenter.jurisdictionBoth", "Both Jurisdictions") : jurisdiction}</Badge>
                                    <Badge variant="outline">{reportLocale.toUpperCase()}</Badge>
                                    <Badge variant="outline">{result.templateName}</Badge>
                                    {result.reportType && (
                                        <Badge variant="secondary" className="text-xs capitalize">{result.reportType.replace(/_/g, " ")}</Badge>
                                    )}
                                    {result.reportVersion && (
                                        <Badge variant="outline" className="font-mono text-xs">v{result.reportVersion}</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action bar */}
                        <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                    {result.reportId}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    {result.templateName}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {formatDateTime(result.generatedAt, locale)}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleCopyMd}
                                >
                                    <Copy className="h-4 w-4" />
                                    {t("reportCenter.copyMd", "Copy Markdown")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleDownloadMd}
                                >
                                    <Download className="h-4 w-4" />
                                    {t("reportCenter.downloadMd", "Download .md")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleOpenEmailDialog}
                                >
                                    <Mail className="h-4 w-4" />
                                    {t("reportCenter.emailPdf", "Email report package")}
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleDownloadDocx}
                                    disabled={downloadDocxMutation.isPending}
                                >
                                    {downloadDocxMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    {t("reportCenter.downloadDocx", "Download Official .docx")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleDownloadPdf}
                                    disabled={downloadPdfMutation.isPending}
                                >
                                    {downloadPdfMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    {t("reportCenter.exportPdf", "Download PDF")}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                    onClick={handleCreateShare}
                                    disabled={createShareMutation.isPending}
                                >
                                    {createShareMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : shareCopied ? (
                                        <CheckCheck className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <LinkIcon className="h-4 w-4" />
                                    )}
                                    {shareCopied
                                        ? t("reportCenter.shareLinkCopied", "Copied!")
                                        : t("reportCenter.shareLink", "Copy Share Link")}
                                </Button>
                            </div>
                            {/* Share URL preview */}
                            {shareUrl && (
                                <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-2">
                                    <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span className="flex-1 truncate text-xs text-muted-foreground">{shareUrl}</span>
                                    <button
                                        type="button"
                                        className="shrink-0 rounded p-1 hover:bg-accent"
                                        aria-label={t("reportCenter.copyShareLink", "Copy share link")}
                                        onClick={() => void handleCopyShareUrl()}
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="no-print mb-4 text-xs text-muted-foreground">
                            {t("reportCenter.actionsHint", "Download the official Word-template report, send the report package directly from this workspace, or keep the Markdown source for version control.")}
                        </p>

                        {/* Report preview */}
                        <div
                            id="djac-report-preview"
                            dir={reportLocale === "ar" ? "rtl" : "ltr"}
                            aria-label={t("reportCenter.previewAria", "Generated report preview")}
                            className="prose prose-sm dark:prose-invert max-w-none rounded-xl border border-border/40 bg-card/50 p-8
                                    prose-headings:font-semibold prose-headings:text-foreground
                                    prose-h1:text-2xl prose-h1:border-b prose-h1:border-border/50 prose-h1:pb-3
                                    prose-h2:text-lg prose-h2:mt-8 prose-h2:text-primary/90
                                    prose-h3:text-base prose-h3:mt-6
                                    prose-table:text-xs prose-td:py-1.5 prose-td:px-3 prose-th:py-1.5 prose-th:px-3
                                    prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground prose-blockquote:text-xs
                                    prose-hr:border-border/40
                                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded
                                    prose-strong:text-foreground"
                        >
                            <div className="not-prose mb-8 rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card to-sky-500/5 dark:to-sky-500/10 p-5 shadow-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex items-center gap-4">
                                        <img src={APP_LOGO} alt="Yalla Hack" className="h-10 w-auto max-w-[100px] object-contain" />
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                                                {result.templateName}
                                            </p>
                                            <h2 className="mt-1 text-xl font-semibold text-foreground">{result.title}</h2>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm text-muted-foreground sm:text-right">
                                        <div>{t("reportCenter.toastReportId", "Report ID")}: {result.reportId}</div>
                                        <div>{formatDateTime(result.generatedAt, locale)}</div>
                                    </div>
                                </div>
                            </div>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                                {result.markdown}
                            </ReactMarkdown>
                        </div>

                        {/* Bottom action bar */}
                        <div className="no-print mt-4 flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => { sounds.click(); window.print(); }}
                            >
                                <Printer className="h-4 w-4" />
                                {t("reportCenter.print", "Print / Save PDF")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleDownloadMd}
                            >
                                <Download className="h-4 w-4" />
                                {t("reportCenter.downloadMd", "Download .md")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleOpenEmailDialog}
                            >
                                <Mail className="h-4 w-4" />
                                {t("reportCenter.emailPdf", "Email report package")}
                            </Button>
                            <Button
                                size="sm"
                                className="gap-2"
                                onClick={handleDownloadDocx}
                                disabled={downloadDocxMutation.isPending}
                            >
                                {downloadDocxMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {t("reportCenter.downloadDocx", "Download Official .docx")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleDownloadPdf}
                                disabled={downloadPdfMutation.isPending}
                            >
                                {downloadPdfMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {t("reportCenter.exportPdf", "Download PDF")}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleCreateShare}
                                disabled={createShareMutation.isPending}
                            >
                                {createShareMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : shareCopied ? (
                                    <CheckCheck className="h-4 w-4 text-green-600" />
                                ) : (
                                    <LinkIcon className="h-4 w-4" />
                                )}
                                {shareCopied
                                    ? t("reportCenter.shareLinkCopied", "Copied!")
                                    : t("reportCenter.shareLink", "Copy Share Link")}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
