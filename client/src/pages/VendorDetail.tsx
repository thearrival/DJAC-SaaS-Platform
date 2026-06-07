/**
 * VendorDetail.tsx  —  /vendor/:id
 *
 * Drill-down view for a single vendor. Displays:
 *   • Profile tab   — all stored vendor fields (contact, services, certifications)
 *   • Assessment tab — dual-jurisdiction compliance scores + gap list
 *   • Tech Stack tab — technology components registered for this vendor
 *
 * Uses:  trpc.vendor.getDetail (profile + techStack + assessment in one call)
 */
import { useEffect, useState } from "react";
import type React from "react";
import { useRoute, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QueryErrorPanel } from "@/components/ui/query-error-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    vendorCriticalityLevelOptions,
    vendorRiskTierOptions,
    type VendorCriticalityLevel,
    type VendorRiskTier,
} from "@shared/vendorProfile";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Globe,
    Layers,
    Loader2,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Server,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    User,
} from "lucide-react";

// ─── Type helpers ─────────────────────────────────────────────────────────────

type Translate = (key: string, fallback: string) => string;

type Severity = "critical" | "high" | "medium" | "low";
type RiskLevel = "low" | "medium" | "high" | "critical";

// ─── Colour maps ──────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, { bg: string; text: string; border: string }> = {
    low: { bg: "rgba(0,210,110,0.08)", text: "#00d46a", border: "rgba(0,210,110,0.25)" },
    medium: { bg: "rgba(255,214,0,0.10)", text: "#e5c000", border: "rgba(255,214,0,0.30)" },
    high: { bg: "rgba(255,107,43,0.10)", text: "#ff7a38", border: "rgba(255,107,43,0.28)" },
    critical: { bg: "rgba(255,23,68,0.10)", text: "#ff4d6a", border: "rgba(255,23,68,0.30)" },
};

const SEV_CLASS: Record<Severity, string> = {
    critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300",
    low: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
};

const SCORE_COLOR = (s: number) =>
    s >= 80 ? "#00d46a" : s >= 60 ? "#e5c000" : s >= 40 ? "#ff7a38" : "#ff4d6a";

const STATUS_CLASS: Record<string, string> = {
    compliant: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    non_compliant: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

// ─── Score arc SVG ─────────────────────────────────────────────────────────────

function ScoreArc({ score, label }: { score: number; label: string }) {
    const r = 38;
    const cx = 50;
    const cy = 54;
    const circumference = Math.PI * r; // half-circle
    const dashOffset = circumference * (1 - score / 100);
    const color = SCORE_COLOR(score);

    return (
        <div className="flex flex-col items-center gap-1 min-w-[100px]">
            <svg width="100" height="64" viewBox="0 0 100 64">
                {/* track */}
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.12"
                    strokeWidth="9"
                    strokeLinecap="round"
                />
                {/* fill */}
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none"
                    stroke={color}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${dashOffset}`}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
                <text
                    x={cx}
                    y={cy - 4}
                    textAnchor="middle"
                    fontSize="20"
                    fontWeight="700"
                    fill={color}
                >
                    {score}
                </text>
            </svg>
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
    );
}

// ─── Gap item ─────────────────────────────────────────────────────────────────

function GapItem({
    gap,
    t,
}: {
    gap: {
        code: string;
        severity: Severity;
        title: string;
        description: string;
        mitigation: string;
        penaltyContext: string;
        frameworks: string[];
        jurisdiction: string;
    };
    t: Translate;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="rounded-lg border bg-card overflow-hidden">
            <button
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/40 transition-colors"
                onClick={() => setExpanded(e => !e)}
                aria-expanded={expanded}
            >
                <span
                    className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${SEV_CLASS[gap.severity]}`}
                >
                    {gap.severity}
                </span>
                <span className="flex-1 min-w-0 text-sm font-medium leading-snug">{gap.title}</span>
                <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
                    {gap.frameworks.join(", ")}
                    {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                    )}
                </span>
            </button>
            {expanded && (
                <div className="px-4 pb-4 space-y-2 border-t bg-accent/20">
                    <p className="text-sm text-muted-foreground pt-3">{gap.description}</p>
                    <div className="rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5">
                        <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                            {t("vendorDetail.mitigation", "Mitigation")}
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">{gap.mitigation}</p>
                    </div>
                    {gap.penaltyContext && (
                        <div className="rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-2.5">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-0.5">
                                {t("vendorDetail.penaltyContext", "Penalty Risk")}
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300">{gap.penaltyContext}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Profile field row ────────────────────────────────────────────────────────

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-0.5 py-2 border-b last:border-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <span className="text-sm break-words">{value}</span>
        </div>
    );
}

function ChipList({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    const items = value.split(/[,;|\n]/g).map(s => s.trim()).filter(Boolean);
    if (items.length === 0) return null;
    return (
        <div className="flex flex-col gap-1.5 py-2 border-b last:border-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <div className="flex flex-wrap gap-1.5">
                {items.map(item => (
                    <Badge key={item} variant="secondary" className="text-xs">
                        {item}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VendorDetail() {
    const { t } = useLocale();
    const [, params] = useRoute("/vendor/:id");
    const [, navigate] = useLocation();
    const vendorId = params?.id ? parseInt(params.id, 10) : 0;

    usePageTitle(t("vendorDetail.pageTitle", "Vendor Detail"));

    // ── Edit / delete state ────────────────────────────────────────────────
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editForm, setEditForm] = useState<{
        vendorName: string;
        vendorDescription: string;
        criticalityLevel: VendorCriticalityLevel | "";
        riskTier: VendorRiskTier | "";
        primaryContactName: string;
        primaryContactEmail: string;
        primaryContactRole: string;
        primaryContactPhone: string;
    }>({
        vendorName: "",
        vendorDescription: "",
        criticalityLevel: "",
        riskTier: "",
        primaryContactName: "",
        primaryContactEmail: "",
        primaryContactRole: "",
        primaryContactPhone: "",
    });

    const trpcUtils = trpc.useUtils();

    const patchMutation = trpc.vendor.patch.useMutation({
        onSuccess: () => {
            toast.success(t("vendorDetail.updateSuccess", "Vendor updated."));
            setEditOpen(false);
            void trpcUtils.vendor.getDetail.invalidate(vendorId);
            void trpcUtils.vendor.list.invalidate();
        },
        onError: (err) => {
            toast.error(t("vendorDetail.updateError", "Failed to update vendor.") + ": " + err.message);
        },
    });

    const deleteMutation = trpc.vendor.delete.useMutation({
        onSuccess: () => {
            toast.success(t("vendorDetail.deleteSuccess", "Vendor deleted."));
            navigate("/vendor-risk");
        },
        onError: (err) => {
            toast.error(t("vendorDetail.deleteError", "Failed to delete vendor.") + ": " + err.message);
        },
    });

    function openEdit(vendor: { vendorName: string; vendorDescription: string | null; criticalityLevel: string | null; riskTier: string | null; primaryContactName: string | null; primaryContactEmail: string | null; primaryContactRole: string | null; primaryContactPhone: string | null }) {
        setEditForm({
            vendorName: vendor.vendorName,
            vendorDescription: vendor.vendorDescription ?? "",
            criticalityLevel: (vendor.criticalityLevel ?? "") as VendorCriticalityLevel | "",
            riskTier: (vendor.riskTier ?? "") as VendorRiskTier | "",
            primaryContactName: vendor.primaryContactName ?? "",
            primaryContactEmail: vendor.primaryContactEmail ?? "",
            primaryContactRole: vendor.primaryContactRole ?? "",
            primaryContactPhone: vendor.primaryContactPhone ?? "",
        });
        setEditOpen(true);
    }

    function handleEditSave() {
        if (!editForm.criticalityLevel || !editForm.riskTier) return;
        patchMutation.mutate({
            vendorId,
            vendorName: editForm.vendorName,
            vendorDescription: editForm.vendorDescription,
            criticalityLevel: editForm.criticalityLevel,
            riskTier: editForm.riskTier,
            primaryContactName: editForm.primaryContactName,
            primaryContactEmail: editForm.primaryContactEmail,
            primaryContactRole: editForm.primaryContactRole,
            primaryContactPhone: editForm.primaryContactPhone,
        });
    }

    // ── Data query ─────────────────────────────────────────────────────────
    const detailQuery = trpc.vendor.getDetail.useQuery(vendorId, {
        enabled: vendorId > 0,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (detailQuery.error) {
            toast.error(t("vendorDetail.loadError", "Failed to load vendor details") + ": " + detailQuery.error.message);
        }
    }, [detailQuery.error]);

    if (!vendorId || isNaN(vendorId)) {
        return (
            <div className="p-8 flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-sm text-muted-foreground">
                    {t("vendorDetail.invalidId", "Invalid vendor ID.")}
                </p>
                <Button variant="outline" size="sm" asChild>
                    <Link href="/vendor-risk">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        {t("vendorDetail.backToList", "Back to Vendor Risk")}
                    </Link>
                </Button>
            </div>
        );
    }

    if (detailQuery.isLoading) {
        return (
            <div className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">{t("vendorDetail.loading", "Loading vendor profile…")}</span>
            </div>
        );
    }

    if (detailQuery.error || !detailQuery.data) {
        return (
            <div className="p-8 flex flex-col items-center gap-4 text-center">
                <ShieldAlert className="h-10 w-10 text-destructive" />
                <QueryErrorPanel
                    message={detailQuery.error?.message ?? t("vendorDetail.notFound", "Vendor not found.")}
                    onRetry={detailQuery.error ? () => {
                        void detailQuery.refetch();
                    } : undefined}
                    retryLabel={t("common.retry", "Retry")}
                    centered
                    className="w-full max-w-md border-destructive/30 p-3"
                />
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/vendor-risk">
                            <ArrowLeft className="h-4 w-4 mr-1.5" />
                            {t("vendorDetail.backToList", "Back to Vendor Risk")}
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    const { vendor, techStack, assessment } = detailQuery.data;
    const riskStyle = RISK_COLOR[assessment.riskLevel];
    const criticalGaps = assessment.gaps.filter(g => g.severity === "critical");
    const highGaps = assessment.gaps.filter(g => g.severity === "high");
    const mediumGaps = assessment.gaps.filter(g => g.severity === "medium");
    const lowGaps = assessment.gaps.filter(g => g.severity === "low");

    return (
        <div className="djac-page">
            {/* Breadcrumb + header */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/vendor-risk" className="hover:underline hover:text-foreground transition-colors">
                        {t("vendorDetail.breadcrumbList", "Vendor Risk")}
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="text-foreground font-medium truncate">{vendor.vendorName}</span>
                </div>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Building2 className="h-6 w-6 text-primary shrink-0" />
                            {vendor.vendorName}
                        </h1>
                        {vendor.industry && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                                {vendor.industry}
                                {vendor.headquartersLocation && ` · ${vendor.headquartersLocation}`}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {vendor.riskTier && (
                            <Badge
                                variant="outline"
                                style={{ background: riskStyle.bg, color: riskStyle.text, borderColor: riskStyle.border }}
                                className="text-xs font-semibold"
                            >
                                {vendor.riskTier.replace(/-/g, " ")}
                            </Badge>
                        )}
                        {vendor.criticalityLevel && (
                            <Badge variant="secondary" className="text-xs capitalize">
                                {vendor.criticalityLevel.replace(/-/g, " ")}
                            </Badge>
                        )}
                        <Badge className={`text-xs ${STATUS_CLASS[assessment.status] ?? ""}`}>
                            {assessment.status === "compliant"
                                ? t("vendorDetail.statusCompliant", "Compliant")
                                : assessment.status === "partial"
                                    ? t("vendorDetail.statusPartial", "Partial")
                                    : t("vendorDetail.statusNonCompliant", "Non-Compliant")}
                        </Badge>
                        <Separator orientation="vertical" className="h-5 hidden sm:block" />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(vendor)}
                            className="gap-1.5"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                            {t("vendorDetail.editProfile", "Edit Profile")}
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteOpen(true)}
                            className="gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t("vendorDetail.deleteVendor", "Delete")}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Score summary bar */}
            <Card>
                <CardContent className="py-5">
                    <div className="flex flex-wrap items-center justify-around gap-4 sm:gap-8">
                        <ScoreArc
                            score={assessment.overallScore}
                            label={t("vendorDetail.scoreOverall", "Overall")}
                        />
                        <ScoreArc
                            score={assessment.jurisdictionScores.china}
                            label={t("vendorDetail.scoreChina", "China (CN)")}
                        />
                        <ScoreArc
                            score={assessment.jurisdictionScores.saudiArabia}
                            label={t("vendorDetail.scoreKSA", "Saudi Arabia")}
                        />

                        <Separator orientation="vertical" className="h-16 hidden sm:block" />

                        <div className="flex flex-col gap-1 text-center">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                {t("vendorDetail.totalGaps", "Total Gaps")}
                            </span>
                            <span className="text-3xl font-bold">{assessment.gaps.length}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {criticalGaps.length > 0 && (
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xs font-medium text-red-500">{criticalGaps.length}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("vendorDetail.critical", "Critical")}
                                    </span>
                                </div>
                            )}
                            {highGaps.length > 0 && (
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xs font-medium text-orange-500">{highGaps.length}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("vendorDetail.high", "High")}
                                    </span>
                                </div>
                            )}
                            {mediumGaps.length > 0 && (
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xs font-medium text-yellow-500">{mediumGaps.length}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("vendorDetail.medium", "Medium")}
                                    </span>
                                </div>
                            )}
                            {lowGaps.length > 0 && (
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-xs font-medium text-green-500">{lowGaps.length}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {t("vendorDetail.low", "Low")}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="profile">
                <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="profile" className="gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        {t("vendorDetail.tabProfile", "Profile")}
                    </TabsTrigger>
                    <TabsTrigger value="assessment" className="gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {t("vendorDetail.tabAssessment", "Assessment")}
                        {(criticalGaps.length + highGaps.length) > 0 && (
                            <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-red-500 hover:bg-red-500">
                                {criticalGaps.length + highGaps.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="techstack" className="gap-1.5">
                        <Server className="h-3.5 w-3.5" />
                        {t("vendorDetail.tabTechStack", "Tech Stack")}
                        {techStack.length > 0 && (
                            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                                {techStack.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ── Profile ── */}
                <TabsContent value="profile" className="mt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Identity */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    {t("vendorDetail.sectionIdentity", "Company Identity")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FieldRow
                                    label={t("vendorDetail.fieldName", "Vendor Name")}
                                    value={vendor.vendorName}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldDescription", "Description")}
                                    value={vendor.vendorDescription}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldIndustry", "Industry")}
                                    value={vendor.industry}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldRegNo", "Registration No.")}
                                    value={vendor.businessRegistrationNumber}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldHQ", "HQ Location")}
                                    value={vendor.headquartersLocation}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldServiceType", "Service Type")}
                                    value={vendor.serviceType}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldServiceScope", "Service Scope")}
                                    value={vendor.serviceScope}
                                />
                            </CardContent>
                        </Card>

                        {/* Contact */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    {t("vendorDetail.sectionContact", "Primary Contact")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FieldRow
                                    label={t("vendorDetail.fieldContactName", "Name")}
                                    value={vendor.primaryContactName}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldContactRole", "Role")}
                                    value={vendor.primaryContactRole}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldContactEmail", "Email")}
                                    value={vendor.primaryContactEmail}
                                />
                                <FieldRow
                                    label={t("vendorDetail.fieldContactPhone", "Phone")}
                                    value={vendor.primaryContactPhone}
                                />
                            </CardContent>
                        </Card>

                        {/* Infrastructure */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary" />
                                    {t("vendorDetail.sectionInfrastructure", "Infrastructure")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FieldRow
                                    label={t("vendorDetail.fieldHosting", "Hosting Environment")}
                                    value={vendor.hostingEnvironment}
                                />
                                <ChipList
                                    label={t("vendorDetail.fieldCloudProviders", "Cloud Providers")}
                                    value={vendor.cloudProvider}
                                />
                                <ChipList
                                    label={t("vendorDetail.fieldDataLocations", "Data Locations")}
                                    value={vendor.dataLocations}
                                />
                                <ChipList
                                    label={t("vendorDetail.fieldOperatingCountries", "Operating Countries")}
                                    value={vendor.operatingCountries}
                                />
                                <FieldRow
                                    label={t("vendorDetail.field3rdParty", "3rd-Party Dependencies")}
                                    value={vendor.thirdPartyDependencies}
                                />
                                <FieldRow
                                    label={t("vendorDetail.field4thParty", "4th-Party Dependencies")}
                                    value={vendor.fourthPartyDependencies}
                                />
                            </CardContent>
                        </Card>

                        {/* Compliance profile */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-primary" />
                                    {t("vendorDetail.sectionCompliance", "Compliance Profile")}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChipList
                                    label={t("vendorDetail.fieldJurisdictions", "Regulatory Jurisdictions")}
                                    value={vendor.regulatoryJurisdictions}
                                />
                                <ChipList
                                    label={t("vendorDetail.fieldCertifications", "Certifications")}
                                    value={vendor.certifications}
                                />
                                <ChipList
                                    label={t("vendorDetail.fieldDataActivities", "Data Processing Activities")}
                                    value={vendor.dataProcessingActivities}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ── Assessment ── */}
                <TabsContent value="assessment" className="mt-4 space-y-4">
                    {/* Recommendations */}
                    {assessment.recommendations.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    {t("vendorDetail.recommendations", "Recommendations")}
                                </CardTitle>
                                <CardDescription>
                                    {t("vendorDetail.recommendationsDesc", "Priority actions to improve compliance posture")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-1.5">
                                    {assessment.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm">
                                            <span className="shrink-0 mt-0.5 text-emerald-500 font-bold text-xs">
                                                {i + 1}.
                                            </span>
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Gap list */}
                    <div>
                        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-orange-500" />
                            {t("vendorDetail.gapsTitle", "Compliance Gaps")}
                            <Badge variant="outline" className="ml-1 text-xs">{assessment.gaps.length}</Badge>
                        </h2>

                        {assessment.gaps.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
                                    <p className="text-sm font-medium">
                                        {t("vendorDetail.noGapsTitle", "No compliance gaps detected")}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {t("vendorDetail.noGapsDesc", "This vendor meets all assessed framework requirements.")}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                {(["critical", "high", "medium", "low"] as Severity[]).map(sev => {
                                    const gaps = assessment.gaps.filter(g => g.severity === sev);
                                    if (gaps.length === 0) return null;
                                    return gaps.map(gap => (
                                        <GapItem key={gap.code} gap={gap} t={t} />
                                    ));
                                })}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ── Tech Stack ── */}
                <TabsContent value="techstack" className="mt-4">
                    {techStack.length === 0 ? (
                        <Card>
                            <CardContent className="py-10 text-center">
                                <Server className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">
                                    {t("vendorDetail.noTechStack", "No tech stack components registered")}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {t("vendorDetail.noTechStackDesc", "Add technology components when registering the vendor.")}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {techStack.map(component => (
                                <Card key={component.id} className="overflow-hidden">
                                    <CardHeader className="pb-1 pt-3 px-4">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <Server className="h-3.5 w-3.5 text-primary shrink-0" />
                                            {component.componentName}
                                        </CardTitle>
                                        {component.componentType && (
                                            <CardDescription className="text-xs">
                                                {component.componentType}
                                                {component.technology ? ` · ${component.technology}` : ""}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="px-4 pb-3 space-y-1.5">
                                        {component.description && (
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {component.description}
                                            </p>
                                        )}
                                        {component.dataHandling && (
                                            <div className="rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2">
                                                <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-0.5">
                                                    {t("vendorDetail.dataHandling", "Data Handling")}
                                                </p>
                                                <p className="text-xs text-amber-700 dark:text-amber-300">
                                                    {component.dataHandling}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Back button */}
            <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                    <Link href="/vendor-risk">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        {t("vendorDetail.backToList", "Back to Vendor Risk")}
                    </Link>
                </Button>
            </div>

            {/* ── Edit Profile Sheet ─────────────────────────────────── */}
            <Sheet open={editOpen} onOpenChange={setEditOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{t("vendorDetail.editTitle", "Edit Vendor Profile")}</SheetTitle>
                        <SheetDescription>
                            {t("vendorDetail.editDesc", "Update key vendor details.")}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name">{t("vendorDetail.fieldName", "Vendor Name")}</Label>
                            <Input
                                id="edit-name"
                                value={editForm.vendorName}
                                onChange={e => setEditForm(f => ({ ...f, vendorName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-desc">{t("vendorDetail.fieldDescription", "Description")}</Label>
                            <Textarea
                                id="edit-desc"
                                rows={3}
                                value={editForm.vendorDescription}
                                onChange={e => setEditForm(f => ({ ...f, vendorDescription: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-contact-name">{t("vendorDetail.fieldContactName", "Contact Name")}</Label>
                            <Input
                                id="edit-contact-name"
                                value={editForm.primaryContactName}
                                onChange={e => setEditForm(f => ({ ...f, primaryContactName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-contact-email">{t("vendorDetail.fieldContactEmail", "Contact Email")}</Label>
                            <Input
                                id="edit-contact-email"
                                type="email"
                                value={editForm.primaryContactEmail}
                                onChange={e => setEditForm(f => ({ ...f, primaryContactEmail: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-contact-role">{t("vendorDetail.fieldContactRole", "Contact Role")}</Label>
                            <Input
                                id="edit-contact-role"
                                value={editForm.primaryContactRole}
                                onChange={e => setEditForm(f => ({ ...f, primaryContactRole: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-contact-phone">{t("vendorDetail.fieldContactPhone", "Phone")}</Label>
                            <Input
                                id="edit-contact-phone"
                                type="tel"
                                value={editForm.primaryContactPhone}
                                onChange={e => setEditForm(f => ({ ...f, primaryContactPhone: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t("vendorDetail.fieldCriticality", "Criticality Level")}</Label>
                            <Select
                                value={editForm.criticalityLevel}
                                onValueChange={v => setEditForm(f => ({ ...f, criticalityLevel: v as VendorCriticalityLevel }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select level…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendorCriticalityLevelOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.labels.en}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t("vendorDetail.fieldRiskTier", "Risk Tier")}</Label>
                            <Select
                                value={editForm.riskTier}
                                onValueChange={v => setEditForm(f => ({ ...f, riskTier: v as VendorRiskTier }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select tier…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendorRiskTierOptions.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.labels.en}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <SheetFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            {t("common.cancel", "Cancel")}
                        </Button>
                        <Button
                            onClick={handleEditSave}
                            disabled={patchMutation.isPending || !editForm.vendorName.trim() || !editForm.criticalityLevel || !editForm.riskTier}
                        >
                            {patchMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t("vendorDetail.saveChanges", "Save Changes")}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* ── Delete Confirm Dialog ──────────────────────────────── */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t("vendorDetail.deleteTitle", "Delete Vendor?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t("vendorDetail.deleteDesc", "This will permanently remove the vendor and all assessment data. This cannot be undone.")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteMutation.mutate({ vendorId })}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {t("vendorDetail.deleteConfirm", "Yes, Delete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
