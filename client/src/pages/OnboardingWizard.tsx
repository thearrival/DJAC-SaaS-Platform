import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryErrorPanel } from "@/components/ui/query-error-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoaderCircle, Sparkles, Building2, Globe2, ClipboardList, ShieldCheck, FileText } from "lucide-react";

export default function OnboardingWizard() {
    usePageTitle("Onboarding");
    const { t } = useLocale();
    const [, navigate] = useLocation();
    const _utils = trpc.useUtils();

    const [activeStep, setActiveStep] = useState(0);
    const [selectedJurisdiction, setSelectedJurisdiction] = useState<"China" | "Saudi Arabia" | "Both" | "Other">("Both");
    const [selectedVendorId, setSelectedVendorId] = useState<number | null>(null);
    const [assessmentResult, setAssessmentResult] = useState<{ riskLevel?: string; overallScore?: number; gaps?: unknown[] } | null>(null);
    const [reportResult, setReportResult] = useState<{ fileName: string; format: "json" | "csv"; content: string } | null>(null);

    const [orgForm, setOrgForm] = useState({
        name: "",
        billingEmail: "",
        industry: "",
    });

    const subStatusQuery = trpc.billing.getSubscriptionStatus.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });
    const vendorsQuery = trpc.vendor.list.useQuery(undefined, { refetchOnWindowFocus: false });
    const deadlinesQuery = trpc.deadlines.list.useQuery(
        { jurisdiction: selectedJurisdiction === "Other" ? "Both" : selectedJurisdiction },
        { enabled: true, refetchOnWindowFocus: false }
    );

    const createOrgMutation = trpc.billing.createOrganization.useMutation({
        onSuccess: async () => {
            await subStatusQuery.refetch();
            setActiveStep(1);
        },
        onError: (err) => {
            toast.error(t("wizard.orgCreateError", "Failed to create organization.") + " " + err.message);
        },
    });

    const assessMutation = trpc.vendor.assess.useMutation({
        onSuccess: result => {
            setAssessmentResult(result);
            setActiveStep(4);
        },
        onError: (err) => {
            toast.error(t("wizard.assessError", "Assessment failed.") + " " + err.message);
        },
    });

    const reportMutation = trpc.vendor.report.useMutation({
        onSuccess: result => {
            setReportResult({
                fileName: result.fileName,
                format: result.format,
                content: typeof result.content === "string" ? result.content : JSON.stringify(result.content, null, 2),
            });
        },
        onError: (err) => {
            toast.error(t("wizard.reportError", "Failed to generate report.") + " " + err.message);
        },
    });

    const hasOrganization = Boolean(subStatusQuery.data?.organizationId);
    const organizationName = subStatusQuery.data?.organizationName ?? null;
    const vendors = vendorsQuery.data ?? [];
    const hasCoreLoadError = subStatusQuery.isError || vendorsQuery.isError || deadlinesQuery.isError;
    const coreLoadErrorMessage = subStatusQuery.error?.message ?? vendorsQuery.error?.message ?? deadlinesQuery.error?.message;

    const selectedVendor = useMemo(
        () => vendors.find(v => v.id === selectedVendorId) ?? null,
        [vendors, selectedVendorId]
    );

    const stepTitles = useMemo(
        () => [
            t("wizard.step1", "Organization Setup"),
            t("wizard.step2", "Jurisdiction Focus"),
            t("wizard.step3", "Vendor Selection"),
            t("wizard.step4", "Run Assessment"),
            t("wizard.step5", "Generate Report"),
        ] as const,
        [t]
    );

    const stepDone = {
        0: hasOrganization,
        1: Boolean(selectedJurisdiction),
        2: Boolean(selectedVendorId),
        3: Boolean(assessmentResult),
        4: Boolean(reportResult),
    } as const;

    useEffect(() => {
        const firstIncomplete = [0, 1, 2, 3, 4].find(i => !stepDone[i as 0 | 1 | 2 | 3 | 4]);
        if (typeof firstIncomplete === "number") {
            setActiveStep(firstIncomplete);
        }
    }, [hasOrganization, selectedJurisdiction, selectedVendorId, assessmentResult, reportResult]);

    const handleCreateOrganization = () => {
        if (!orgForm.name.trim() || !orgForm.billingEmail.trim()) return;
        createOrgMutation.mutate({
            name: orgForm.name.trim(),
            billingEmail: orgForm.billingEmail.trim(),
            industry: orgForm.industry.trim() || undefined,
            primaryJurisdiction: selectedJurisdiction,
        });
    };

    const handleRunAssessment = () => {
        if (!selectedVendorId) return;
        assessMutation.mutate({ vendorId: selectedVendorId });
    };

    const handleGenerateReport = () => {
        if (!selectedVendorId) return;
        reportMutation.mutate({ vendorId: selectedVendorId, format: "json" });
    };

    const downloadReport = () => {
        if (!reportResult) return;
        const blob = new Blob([reportResult.content], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = reportResult.fileName;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="djac-page">
            <Card className="border-primary/30 bg-gradient-to-r from-blue-50/50 via-background to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        {t("wizard.title", "5-Step Enterprise Onboarding Wizard")}
                    </CardTitle>
                    <CardDescription>
                        {t("wizard.subtitle", "Complete setup from organization to first compliance report in one guided flow.")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Visual progress bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-muted-foreground" role="status" aria-live="polite">
                                {t("wizard.progress", "Step {current} of {total}")
                                    .replace("{current}", String(activeStep + 1))
                                    .replace("{total}", String(stepTitles.length))}
                            </span>
                            <span className="text-xs font-semibold text-primary">
                                {Math.round(((activeStep + 1) / stepTitles.length) * 100)}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
                                style={{ width: `${((activeStep + 1) / stepTitles.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 md:grid-cols-5" aria-label={t("wizard.stepListLabel", "Onboarding steps")}>
                        {stepTitles.map((title, index) => {
                            const done = stepDone[index as 0 | 1 | 2 | 3 | 4];
                            const active = activeStep === index;
                            const statusText = done
                                ? t("wizard.stepStatusDone", "Completed")
                                : active
                                    ? t("wizard.stepStatusCurrent", "Current step")
                                    : t("wizard.stepStatusPending", "Pending");
                            return (
                                <button
                                    key={title}
                                    type="button"
                                    onClick={() => setActiveStep(index)}
                                    aria-current={active ? "step" : undefined}
                                    aria-label={t("wizard.stepButtonLabel", "Step {current} of {total}: {title}. {status}")
                                        .replace("{current}", String(index + 1))
                                        .replace("{total}", String(stepTitles.length))
                                        .replace("{title}", title)
                                        .replace("{status}", statusText)}
                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${active
                                        ? "border-primary bg-primary/10 shadow-sm"
                                        : done
                                            ? "border-emerald-500/40 bg-emerald-500/10"
                                            : "border-border bg-card hover:bg-muted/50"
                                        }`}
                                >
                                    {/* Numbered step indicator */}
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done
                                        ? "bg-emerald-500 text-white"
                                        : active
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                        }`}>
                                        {done ? "✓" : index + 1}
                                    </span>
                                    <span className="line-clamp-1">{title}</span>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {hasCoreLoadError && (
                <QueryErrorPanel
                    message={coreLoadErrorMessage ?? t("wizard.loadError", "Failed to load onboarding data.")}
                    onRetry={() => {
                        void subStatusQuery.refetch();
                        void vendorsQuery.refetch();
                        void deadlinesQuery.refetch();
                    }}
                    retryLabel={t("common.retry", "Retry")}
                />
            )}

            {activeStep === 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />1. {t("wizard.step1", "Organization Setup")}</CardTitle>
                        <CardDescription>
                            {hasOrganization
                                ? t("wizard.step1_done", "Organization is already configured.")
                                : t("wizard.step1_desc", "Create your organization and start trial setup.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {hasOrganization ? (
                            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                                {t("wizard.orgReady", "Organization connected")}: <strong>{organizationName}</strong>
                            </div>
                        ) : (
                            <>
                                <p className="text-xs text-muted-foreground">{t("wizard.requiredHint", "Fields marked with * are required.")}</p>
                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label>{t("wizard.orgName", "Organization name")} *</Label>
                                        <Input
                                            value={orgForm.name}
                                            onChange={e => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder={t("wizard.orgNamePlaceholder", "Acme Compliance")}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label>{t("wizard.billingEmail", "Billing email")} *</Label>
                                        <Input
                                            type="email"
                                            value={orgForm.billingEmail}
                                            onChange={e => setOrgForm(prev => ({ ...prev, billingEmail: e.target.value }))}
                                            placeholder={t("wizard.billingEmailPlaceholder", "finance@company.com")}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label>{t("wizard.industry", "Industry (optional)")}</Label>
                                    <Input
                                        value={orgForm.industry}
                                        onChange={e => setOrgForm(prev => ({ ...prev, industry: e.target.value }))}
                                        placeholder={t("wizard.industryPlaceholder", "Technology")}
                                    />
                                </div>
                                <Button onClick={handleCreateOrganization} disabled={createOrgMutation.isPending}>
                                    {createOrgMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    {t("wizard.createOrg", "Create Organization")}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeStep === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Globe2 className="h-4 w-4" />2. {t("wizard.step2", "Jurisdiction Focus")}</CardTitle>
                        <CardDescription>{t("wizard.step2_desc", "Pick your primary compliance jurisdiction to prioritize deadlines.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="max-w-sm space-y-1">
                            <Label>{t("wizard.jurisdiction", "Jurisdiction")}</Label>
                            <Select
                                value={selectedJurisdiction}
                                onValueChange={v => {
                                    const valid = ["China", "Saudi Arabia", "Both", "Other"] as const;
                                    if ((valid as readonly string[]).includes(v)) {
                                        setSelectedJurisdiction(v as typeof valid[number]);
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t("wizard.selectJurisdictionPlaceholder", "Select a jurisdiction")} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="China">{t("wizard.countryChina", "China")}</SelectItem>
                                    <SelectItem value="Saudi Arabia">{t("wizard.countrySaudiArabia", "Saudi Arabia")}</SelectItem>
                                    <SelectItem value="Both">{t("wizard.countryBoth", "Both")}</SelectItem>
                                    <SelectItem value="Other">{t("wizard.countryOther", "Other")}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-lg border p-3">
                            <p className="mb-2 text-sm font-medium">{t("wizard.deadlinePreview", "Deadline Preview")}</p>
                            {deadlinesQuery.isLoading ? (
                                <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{t("wizard.loadingDeadlines", "Loading...")}</p>
                            ) : deadlinesQuery.isError ? (
                                <QueryErrorPanel
                                    message={deadlinesQuery.error?.message ?? t("wizard.deadlinesLoadError", "Failed to load deadlines.")}
                                    onRetry={() => {
                                        void deadlinesQuery.refetch();
                                    }}
                                    retryLabel={t("common.retry", "Retry")}
                                    className="border-destructive/30 p-3"
                                    contentClassName="gap-2"
                                />
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {(deadlinesQuery.data ?? []).slice(0, 6).map(item => (
                                        <Badge key={item.id} variant="outline">
                                            {item.frameworkCode}: {item.title.slice(0, 28)}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Button onClick={() => setActiveStep(2)}>{t("wizard.continue", "Continue")}</Button>
                    </CardContent>
                </Card>
            )}

            {activeStep === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4" />3. {t("wizard.step3", "Vendor Selection")}</CardTitle>
                        <CardDescription>{t("wizard.step3_desc", "Choose an existing vendor profile or create one first.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {vendorsQuery.isLoading ? (
                            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{t("wizard.loadingVendors", "Loading vendors...")}</p>
                        ) : vendorsQuery.isError ? (
                            <QueryErrorPanel
                                message={vendorsQuery.error?.message ?? t("wizard.vendorsLoadError", "Failed to load vendors.")}
                                onRetry={() => {
                                    void vendorsQuery.refetch();
                                }}
                                retryLabel={t("common.retry", "Retry")}
                                className="border-destructive/30 p-3"
                            />
                        ) : vendors.length === 0 ? (
                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">{t("wizard.noVendors", "No vendor profiles found yet.")}</p>
                                <Button variant="outline" onClick={() => navigate("/vendor-assessment")}>
                                    {t("wizard.createVendor", "Go to Vendor Assessment to create one")}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="max-w-md space-y-1">
                                    <Label>{t("wizard.selectVendor", "Select vendor")}</Label>
                                    <Select
                                        value={selectedVendorId ? String(selectedVendorId) : ""}
                                        onValueChange={value => setSelectedVendorId(Number(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("wizard.selectVendorPlaceholder", "Choose a vendor")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vendors.map(vendor => (
                                                <SelectItem key={vendor.id} value={String(vendor.id)}>
                                                    {vendor.vendorName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedVendor ? (
                                    <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                                        {t("wizard.selectedVendor", "Selected")}: <strong>{selectedVendor.vendorName}</strong>
                                    </div>
                                ) : null}

                                <Button onClick={() => setActiveStep(3)} disabled={!selectedVendorId}>
                                    {t("wizard.continueToAssessment", "Continue to Assessment")}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeStep === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" />4. {t("wizard.step4", "Run Assessment")}</CardTitle>
                        <CardDescription>
                            {t("wizard.step4_desc", "Run AI compliance assessment for selected vendor.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {t("wizard.vendor", "Vendor")}: <strong>{selectedVendor?.vendorName ?? "—"}</strong>
                        </p>

                        <Button onClick={handleRunAssessment} disabled={!selectedVendorId || assessMutation.isPending}>
                            {assessMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {t("wizard.runAssessment", "Run Assessment")}
                        </Button>

                        {assessmentResult ? (
                            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm">
                                <p>
                                    {t("wizard.assessmentDone", "Assessment complete")}: {" "}
                                    <strong>{String(assessmentResult.riskLevel ?? t("wizard.unknown", "unknown"))}</strong>
                                </p>
                                <p>
                                    {t("wizard.score", "Score")}: <strong>{Number(assessmentResult.overallScore ?? 0)}%</strong>
                                </p>
                                <p>
                                    {t("wizard.gaps", "Gaps")}: <strong>{assessmentResult.gaps?.length ?? 0}</strong>
                                </p>
                            </div>
                        ) : null}

                        <Button variant="outline" onClick={() => setActiveStep(4)} disabled={!assessmentResult}>
                            {t("wizard.continueToReport", "Continue to Report")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {activeStep === 4 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" />5. {t("wizard.step5", "Generate Report")}</CardTitle>
                        <CardDescription>{t("wizard.step5_desc", "Export a first compliance report for stakeholders.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button onClick={handleGenerateReport} disabled={!selectedVendorId || reportMutation.isPending}>
                            {reportMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {t("wizard.generateReport", "Generate JSON Report")}
                        </Button>

                        {reportResult ? (
                            <div className="space-y-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3">
                                <p className="text-sm">
                                    {t("wizard.reportReady", "Report ready")}: <strong>{reportResult.fileName}</strong>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" onClick={downloadReport}>{t("wizard.download", "Download")}</Button>
                                    <Button size="sm" variant="outline" onClick={() => navigate("/report-center")}>{t("wizard.openReportCenter", "Open Report Center")}</Button>
                                </div>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
