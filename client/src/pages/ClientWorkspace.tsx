import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAiAssessmentJobs } from "@/hooks/useAiAssessmentJobs";
import { AIAssessmentJobProgress } from "@/components/AIAssessmentJobProgress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
    vendorCloudProviderOptions,
    vendorComplianceStandardOptions,
    vendorCountryOptions,
    vendorCriticalityLevelOptions,
    vendorDataProcessingActivityOptions,
    vendorDependencyLevelOptions,
    vendorHostingEnvironmentOptions,
    vendorIndustryOptions,
    vendorJurisdictionOptions,
    vendorJurisdictionValues,
    vendorRiskTierOptions,
    vendorServiceTypeOptions,
    type EnterpriseTechStackComponentInput,
    type VendorCloudProvider,
    type VendorComplianceStandard,
    type VendorCountry,
    type VendorCriticalityLevel,
    type VendorDataProcessingActivity,
    type VendorDependencyLevel,
    type VendorHostingEnvironment,
    type VendorIndustry,
    type VendorJurisdiction,
    type VendorOption,
    type VendorProfileLocale,
    type VendorRiskTier,
    type VendorServiceType,
} from "@shared/vendorProfile";
import { toast as sonnerToast } from "sonner";
import { useTheme } from "@/contexts/useTheme";
import { Activity, Eye, FileBadge, Plus, RefreshCw, ShieldCheck, Sparkles, Trash2, User2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Locale = VendorProfileLocale;

type VendorFormState = {
    vendorName: string;
    vendorDescription: string;
    industry: VendorIndustry | "";
    businessRegistrationNumber: string;
    headquartersLocation: VendorCountry | "";
    primaryContactName: string;
    primaryContactEmail: string;
    primaryContactRole: string;
    primaryContactPhone: string;
    serviceType: VendorServiceType | "";
    serviceScope: string;
    hostingEnvironment: VendorHostingEnvironment | "";
    cloudProviders: VendorCloudProvider[];
    operatingCountries: VendorCountry[];
    dataLocations: VendorCountry[];
    regulatoryJurisdictions: VendorJurisdiction[];
    certifications: VendorComplianceStandard[];
    dataProcessingActivities: VendorDataProcessingActivity[];
    criticalityLevel: VendorCriticalityLevel | "";
    riskTier: VendorRiskTier | "";
    thirdPartyDependencies: VendorDependencyLevel | "";
    fourthPartyDependencies: VendorDependencyLevel | "";
    techStackComponents: EnterpriseTechStackComponentInput[];
};

type ProfileFormState = {
    name: string;
    email: string;
    organizationName: string;
    organizationType: string;
    jobTitle: string;
    preferredLocale: Locale;
};

type ConsultationFormState = {
    contactName: string;
    contactEmail: string;
    organizationName: string;
    topic: string;
    jurisdictions: VendorJurisdiction[];
    summary: string;
    vendorName: string;
    techStackSummary: string;
};

type ValidationMessage = {
    key: string;
    fallback: string;
};

type DraftAssessmentResult = {
    overallScore: number;
    riskLevel: "low" | "medium" | "high" | "critical";
    status: "compliant" | "partial" | "non_compliant";
    jurisdictionScores: { china: number; saudiArabia: number };
    gaps: Array<{ code: string; severity: string; title: string; jurisdiction: string; frameworks: string[] }>;
    recommendations: string[];
};

const riskPalette: Record<string, string> = {
    low: "#16a34a",
    medium: "#ca8a04",
    high: "#ea580c",
    critical: "#dc2626",
};

const initialTechStackRow: EnterpriseTechStackComponentInput = {
    componentName: "",
    componentType: "",
    technology: "",
    description: "",
    dataHandling: "",
};

const initialVendorForm: VendorFormState = {
    vendorName: "",
    vendorDescription: "",
    industry: "",
    businessRegistrationNumber: "",
    headquartersLocation: "",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactRole: "",
    primaryContactPhone: "",
    serviceType: "",
    serviceScope: "",
    hostingEnvironment: "",
    cloudProviders: [],
    operatingCountries: [],
    dataLocations: [],
    regulatoryJurisdictions: [],
    certifications: [],
    dataProcessingActivities: [],
    criticalityLevel: "",
    riskTier: "",
    thirdPartyDependencies: "",
    fourthPartyDependencies: "",
    techStackComponents: [initialTechStackRow],
};

function optionLabel<T extends string>(
    option: VendorOption<T>,
    locale: Locale
) {
    if (locale === "ar") {
        return option.labels.ar ?? option.labels.en;
    }

    return option.labels[locale] ?? option.labels.en;
}

function toggleArrayValue<T extends string>(items: T[], value: T) {
    return items.includes(value)
        ? items.filter(entry => entry !== value)
        : [...items, value];
}

function isRequiredStringMissing(value: string) {
    return value.trim().length === 0;
}

function validateVendorForm(form: VendorFormState) {
    const requiredSingle = [
        form.vendorName,
        form.vendorDescription,
        form.industry,
        form.businessRegistrationNumber,
        form.headquartersLocation,
        form.primaryContactName,
        form.primaryContactEmail,
        form.primaryContactRole,
        form.serviceType,
        form.serviceScope,
        form.hostingEnvironment,
        form.criticalityLevel,
        form.riskTier,
        form.thirdPartyDependencies,
        form.fourthPartyDependencies,
    ];

    if (requiredSingle.some(value => isRequiredStringMissing(String(value)))) {
        return {
            key: "client.validationCompleteVendorFields",
            fallback: "Complete all required company and risk fields before saving.",
        } satisfies ValidationMessage;
    }

    if (form.operatingCountries.length === 0) {
        return {
            key: "client.validationOperatingCountries",
            fallback: "Select at least one operating country.",
        } satisfies ValidationMessage;
    }

    if (form.dataLocations.length === 0) {
        return {
            key: "client.validationDataLocations",
            fallback: "Select at least one data location.",
        } satisfies ValidationMessage;
    }

    if (form.regulatoryJurisdictions.length === 0) {
        return {
            key: "client.validationRegulatoryJurisdictions",
            fallback: "Select at least one regulatory jurisdiction.",
        } satisfies ValidationMessage;
    }

    if (form.dataProcessingActivities.length === 0) {
        return {
            key: "client.validationDataProcessingActivities",
            fallback: "Select at least one data processing activity.",
        } satisfies ValidationMessage;
    }

    if (
        ["single-public-cloud", "multi-cloud", "hybrid"].includes(form.hostingEnvironment) &&
        form.cloudProviders.length === 0
    ) {
        return {
            key: "client.validationCloudProviders",
            fallback: "Choose at least one cloud provider for your hosting environment.",
        } satisfies ValidationMessage;
    }

    const emptyTechStack = form.techStackComponents.some(
        row =>
            row.componentName.trim().length === 0 ||
            row.componentType.trim().length === 0 ||
            row.technology.trim().length === 0
    );

    if (emptyTechStack) {
        return {
            key: "client.validationTechStack",
            fallback: "Complete each technology stack row or remove empty rows.",
        } satisfies ValidationMessage;
    }

    return null;
}

function MultiChecklist<T extends string>({
    title,
    options,
    selected,
    onToggle,
    locale,
}: {
    title: string;
    options: ReadonlyArray<VendorOption<T>>;
    selected: T[];
    onToggle: (value: T) => void;
    locale: Locale;
}) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">{title}</p>
            <div className="flex flex-wrap gap-2">
                {options.map(option => {
                    const active = selected.includes(option.value);
                    return (
                        <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={active ? "default" : "outline"}
                            onClick={() => onToggle(option.value)}
                            className="h-8 rounded-full"
                            aria-pressed={active}
                        >
                            {optionLabel(option, locale)}
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

function ThemedValueSelect<T extends string>({
    value,
    onChange,
    options,
    placeholder,
    ariaLabel,
    locale,
    className = "h-10 w-full",
    allowEmpty = true,
}: {
    value: T | "";
    onChange: (value: T | "") => void;
    options: ReadonlyArray<VendorOption<T>>;
    placeholder: string;
    ariaLabel: string;
    locale: Locale;
    className?: string;
    allowEmpty?: boolean;
}) {
    const normalizedValue = value && value.length > 0 ? value : allowEmpty ? "__empty__" : undefined;

    return (
        <Select value={normalizedValue} onValueChange={next => onChange((next === "__empty__" ? "" : next) as T | "")}>
            <SelectTrigger className={className} aria-label={ariaLabel}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {allowEmpty && <SelectItem value="__empty__">{placeholder}</SelectItem>}
                {options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {optionLabel(option, locale)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function SimpleStringSelect({
    value,
    onChange,
    options,
    ariaLabel,
    placeholder,
    className = "h-10 w-full",
}: {
    value: string;
    onChange: (value: string) => void;
    options: ReadonlyArray<{ value: string; label: string }>;
    ariaLabel: string;
    placeholder?: string;
    className?: string;
}) {
    const hasMatchingValue = options.some(option => option.value === value);
    const normalizedValue = hasMatchingValue ? value : placeholder ? "__empty__" : undefined;

    return (
        <Select value={normalizedValue} onValueChange={next => onChange(next === "__empty__" ? "" : next)}>
            <SelectTrigger className={className} aria-label={ariaLabel}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {placeholder ? <SelectItem value="__empty__">{placeholder}</SelectItem> : null}
                {options.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export default function ClientWorkspace() {
    usePageTitle("My Workspace");
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const { t, locale } = useLocale();
    const localeKey = (locale === "en" || locale === "ar" || locale === "zh"
        ? locale
        : "en") as Locale;
    const { user, refresh } = useAuth();
    const utils = trpc.useUtils();

    const [profileForm, setProfileForm] = useState<ProfileFormState>({
        name: "",
        email: "",
        organizationName: "",
        organizationType: "",
        jobTitle: "",
        preferredLocale: localeKey,
    });
    const [vendorForm, setVendorForm] = useState<VendorFormState>(initialVendorForm);
    const [consultationForm, setConsultationForm] = useState<ConsultationFormState>({
        contactName: "",
        contactEmail: "",
        organizationName: "",
        topic: "",
        jurisdictions: [],
        summary: "",
        vendorName: "",
        techStackSummary: "",
    });
    const [activeJobId, setActiveJobId] = useState<string | null>(null);
    const [vendorSortKey, setVendorSortKey] = useState<"name" | "risk">("name");
    const [vendorJurisdictionFilter, setVendorJurisdictionFilter] = useState<string>("all");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewResult, setPreviewResult] = useState<DraftAssessmentResult | null>(null);

    const vendorListQuery = trpc.vendor.list.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });
    const jobListQuery = trpc.ai.listAssessmentJobs.useQuery({ limit: 30 }, {
        refetchInterval: 5000,
    });
    const saudiFrameworksQuery = trpc.compliance.frameworksByCountry.useQuery("Saudi Arabia");
    const chinaFrameworksQuery = trpc.compliance.frameworksByCountry.useQuery("China");

    const profileMutation = trpc.auth.updateProfile.useMutation({
        onSuccess: async () => {
            sonnerToast.success(t("client.toastProfileUpdated", "Profile updated"));
            await utils.auth.me.invalidate();
            await refresh();
        },
        onError: (err) => sonnerToast.error(t("client.profileUpdateFailed", "Profile update failed") + ": " + err.message),
    });

    const createVendorMutation = trpc.vendor.create.useMutation({
        onSuccess: async () => {
            sonnerToast.success(t("client.toastVendorSaved", "Vendor profile saved"));
            setVendorForm(initialVendorForm);
            await vendorListQuery.refetch();
        },
        onError: (err) => sonnerToast.error(t("client.vendorSaveFailed", "Vendor save failed") + ": " + err.message),
    });

    const assessDraftMutation = trpc.vendor.assessDraft.useMutation({
        onSuccess: (data) => {
            setPreviewResult(data as DraftAssessmentResult);
            setPreviewOpen(true);
        },
        onError: (err) => sonnerToast.error(t("client.previewError", "Preview failed") + ": " + err.message),
    });

    const submitConsultationMutation = trpc.portal.submitAuthenticatedConsultation.useMutation({
        onSuccess: () => {
            sonnerToast.success(t("client.toastConsultationSubmitted", "Consultation request submitted"));
            setConsultationForm({

                contactName: profileForm.name,
                contactEmail: profileForm.email,
                organizationName: profileForm.organizationName,
                topic: "",
                jurisdictions: [],
                summary: "",
                vendorName: "",
                techStackSummary: "",
            });
        },
        onError: (err) => sonnerToast.error(t("client.consultationSubmitFailed", "Consultation submission failed") + ": " + err.message),
    });

    const submitAssessmentMutation = trpc.ai.submitAssessment.useMutation({
        onSuccess: data => {
            setActiveJobId(data.jobId);
            sonnerToast.success(t("client.toastAssessmentQueued", "Assessment queued"), {
                description: `${t("client.toastAssessmentQueuedDesc", "Job is now running through the AI pipeline.")} (${data.jobId.slice(0, 8)})`,
            });
        },
        onError: (err) => sonnerToast.error(t("client.assessmentSubmitFailed", "Assessment submission failed") + ": " + err.message),
    });

    const { snapshots, subscribeToJob, connectionState } = useAiAssessmentJobs();

    useEffect(() => {
        if (!activeJobId) {
            return;
        }

        return subscribeToJob(activeJobId);
    }, [activeJobId, subscribeToJob]);

    useEffect(() => {
        if (!user) {
            return;
        }

        setProfileForm({
            name: user.name ?? "",
            email: user.email ?? "",
            organizationName: user.organizationName ?? "",
            organizationType: user.organizationType ?? "",
            jobTitle: user.jobTitle ?? "",
            preferredLocale: (user.preferredLocale ?? localeKey) as Locale,
        });

        setConsultationForm(prev => ({
            ...prev,
            contactName: prev.contactName || (user.name ?? ""),
            contactEmail: prev.contactEmail || (user.email ?? ""),
            organizationName: prev.organizationName || (user.organizationName ?? ""),
        }));
    }, [localeKey, user]);

    const activeSnapshot = activeJobId ? snapshots[activeJobId] : null;

    const vendorNameById = useMemo(() => {
        return new Map((vendorListQuery.data ?? []).map(vendor => [vendor.id, vendor.vendorName]));
    }, [vendorListQuery.data]);

    const filteredSortedVendors = useMemo(() => {
        const riskOrder: Record<string, number> = {
            "tier-1-critical": 4, "tier-2-high": 3, "tier-3-moderate": 2, "tier-4-low": 1,
        };
        let list = vendorListQuery.data ?? [];
        if (vendorJurisdictionFilter !== "all") {
            list = list.filter(v =>
                v.regulatoryJurisdictions
                    ? v.regulatoryJurisdictions.split(";").includes(vendorJurisdictionFilter)
                    : false
            );
        }
        return [...list].sort((a, b) =>
            vendorSortKey === "risk"
                ? (riskOrder[b.riskTier ?? ""] ?? 0) - (riskOrder[a.riskTier ?? ""] ?? 0)
                : (a.vendorName ?? "").localeCompare(b.vendorName ?? "")
        );
    }, [vendorListQuery.data, vendorSortKey, vendorJurisdictionFilter]);

    const completedAssessments = useMemo(() => {
        const jobs = jobListQuery.data ?? [];
        return jobs
            .filter(job => job.status === "completed" && job.result?.assessment)
            .map(job => ({
                jobId: job.id,
                vendorId: job.result?.inputSummary.vendorId ?? 0,
                vendorName:
                    vendorNameById.get(job.result?.inputSummary.vendorId ?? -1) ??
                    `Vendor ${job.result?.inputSummary.vendorId ?? "Unknown"}`,
                score: job.result?.assessment?.overallScore ?? 0,
                riskLevel: job.result?.assessment?.riskLevel ?? "low",
            }));
    }, [jobListQuery.data, vendorNameById]);

    const severityCards = useMemo(() => {
        const totals = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
        };

        for (const job of completedAssessments) {
            const key = job.riskLevel as keyof typeof totals;
            totals[key] += 1;
        }

        return totals;
    }, [completedAssessments]);

    const handleProfileSave = async () => {
        await profileMutation.mutateAsync(profileForm);
    };

    const handleCreateVendor = async () => {
        const validationError = validateVendorForm(vendorForm);
        if (validationError) {
            sonnerToast.error(t(validationError.key, validationError.fallback));
            return;
        }

        await createVendorMutation.mutateAsync({
            ...vendorForm,
            industry: vendorForm.industry as VendorIndustry,
            headquartersLocation: vendorForm.headquartersLocation as VendorCountry,
            serviceType: vendorForm.serviceType as VendorServiceType,
            hostingEnvironment: vendorForm.hostingEnvironment as VendorHostingEnvironment,
            criticalityLevel: vendorForm.criticalityLevel as VendorCriticalityLevel,
            riskTier: vendorForm.riskTier as VendorRiskTier,
            thirdPartyDependencies: vendorForm.thirdPartyDependencies as VendorDependencyLevel,
            fourthPartyDependencies: vendorForm.fourthPartyDependencies as VendorDependencyLevel,
        });
    };

    const handlePreviewScore = async () => {
        const validationError = validateVendorForm(vendorForm);
        if (validationError) {
            sonnerToast.error(t(validationError.key, validationError.fallback));
            return;
        }
        await assessDraftMutation.mutateAsync({
            ...vendorForm,
            industry: vendorForm.industry as VendorIndustry,
            headquartersLocation: vendorForm.headquartersLocation as VendorCountry,
            serviceType: vendorForm.serviceType as VendorServiceType,
            hostingEnvironment: vendorForm.hostingEnvironment as VendorHostingEnvironment,
            criticalityLevel: vendorForm.criticalityLevel as VendorCriticalityLevel,
            riskTier: vendorForm.riskTier as VendorRiskTier,
            thirdPartyDependencies: vendorForm.thirdPartyDependencies as VendorDependencyLevel,
            fourthPartyDependencies: vendorForm.fourthPartyDependencies as VendorDependencyLevel,
        });
    };

    const handleConsultationSubmit = async () => {
        if (
            !consultationForm.contactName.trim() ||
            !consultationForm.contactEmail.trim() ||
            !consultationForm.organizationName.trim() ||
            !consultationForm.topic.trim() ||
            !consultationForm.summary.trim() ||
            consultationForm.jurisdictions.length === 0
        ) {
            sonnerToast.error(t("client.validationCompleteConsultationFields", "Complete all consultation fields before submitting."));
            return;
        }

        await submitConsultationMutation.mutateAsync(consultationForm);
    };

    const handleRunAssessment = async (vendorId: number) => {
        await submitAssessmentMutation.mutateAsync({
            vendorId,
            waitForCompletion: false,
            persistResult: true,
        });
    };

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl">
                <Card>
                    <CardHeader>
                        <CardTitle>{t("client.signInTitle", "Client Workspace")}</CardTitle>
                        <CardDescription>{t("client.signInDesc", "Sign in to manage your organization profile and compliance assessments.")}</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="djac-page">
            <div className="rounded-2xl border p-6 shadow-xl" style={{ background: isDark ? "linear-gradient(135deg, #0a0f2e 0%, #0d1b4e 40%, #1a0a3e 100%)" : "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 40%, #F5F3FF 100%)", borderColor: "#9359EC40" }}>
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-widest" style={{ background: "#9359EC22", border: "1px solid #9359EC50", color: "#C084FC" }}>{t("client.heroBadge", "Client Workspace")}</span>
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: connectionState === 'open' ? '#01FF7F18' : '#FF174418', border: `1px solid ${connectionState === 'open' ? '#01FF7F40' : '#FF174440'}`, color: connectionState === 'open' ? '#01FF7F' : '#FF7777' }}>
                                {connectionState === 'open' ? 'â— Live' : 'â—‹ ' + connectionState}
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold" style={{ background: "linear-gradient(135deg,#C084FC,#00F7FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{t("client.heroTitle", "Compliance Operating Hub")}</h1>
                        <p className="mt-2 max-w-2xl text-sm" style={{ color: isDark ? "#CBD5E1" : "var(--djac-muted)" }}>
                            {t("client.heroDesc", "Manage your organization profile, submit vendor technology stacks, trigger AI assessments, and request jurisdiction-specific consultation support.")}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    {[
                        { step: "01", label: t("client.step1", "Set Organization Profile"), color: "#00F7FF" },
                        { step: "02", label: t("client.step2", "Register Vendor Stack"), color: "#9359EC" },
                        { step: "03", label: t("client.step3", "Trigger AI Assessment"), color: "#01FF7F" },
                        { step: "04", label: t("client.step4", "Request Consultation"), color: "#FFD600" },
                    ].map(s => (
                        <div key={s.step} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: `${s.color}14`, border: `1px solid ${s.color}30` }}>
                            <span className="text-xs font-bold" style={{ color: s.color }}>{s.step}</span>
                            <span className="text-xs" style={{ color: isDark ? "#CBD5E1" : "var(--djac-muted)" }}>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1.4fr]">
                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <User2 className="h-5 w-5 text-blue-600" />
                            {t("client.orgProfileTitle", "Organization Profile")}
                        </CardTitle>
                        <CardDescription>
                            {t("client.orgProfileDesc", "Keep account identity, contact ownership, and preferred language aligned for audit trails.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <Label>{t("client.labelName", "Name")}</Label>
                                <Input
                                    value={profileForm.name}
                                    onChange={event => setProfileForm(prev => ({ ...prev, name: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.labelEmail", "Email")}</Label>
                                <Input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={event => setProfileForm(prev => ({ ...prev, email: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.labelOrganization", "Organization")}</Label>
                                <Input
                                    value={profileForm.organizationName}
                                    onChange={event => setProfileForm(prev => ({ ...prev, organizationName: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.labelOrganizationType", "Organization Type")}</Label>
                                <Input
                                    value={profileForm.organizationType}
                                    onChange={event => setProfileForm(prev => ({ ...prev, organizationType: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.labelJobTitle", "Job Title")}</Label>
                                <Input
                                    value={profileForm.jobTitle}
                                    onChange={event => setProfileForm(prev => ({ ...prev, jobTitle: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.labelPreferredLocale", "Preferred Locale")}</Label>
                                <SimpleStringSelect
                                    value={profileForm.preferredLocale}
                                    onChange={value =>
                                        setProfileForm(prev => ({
                                            ...prev,
                                            preferredLocale: value as Locale,
                                        }))
                                    }
                                    ariaLabel={t("client.labelPreferredLocale", "Preferred Locale")}
                                    options={[
                                        { value: "en", label: t("client.localeEnglish", "English") },
                                        { value: "ar", label: t("client.localeArabic", "Arabic") },
                                        { value: "zh", label: t("client.localeChinese", "Chinese") },
                                    ]}
                                />
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {t("client.profileHint", "Keep your name, email, and organization up to date.")}
                        </p>
                        <Button onClick={handleProfileSave} disabled={profileMutation.isPending}>
                            {profileMutation.isPending ? t("client.saving", "Saving...") : t("client.saveProfile", "Save Profile")}
                        </Button>
                        {profileMutation.isPending && (
                            <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                                {t("client.profileSavingHint", "Saving profile changes...")}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/80">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ShieldCheck className="h-5 w-5 text-teal-600" />
                            {t("client.vendorIntakeTitle", "Vendor + Technology Intake")}
                        </CardTitle>
                        <CardDescription>
                            {t("client.vendorIntakeDesc", "Submit market-entry vendor details and component-level architecture signals for persistent compliance scoring.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <Label>{t("client.vendorName", "Vendor Name")}</Label>
                                <Input value={vendorForm.vendorName} onChange={event => setVendorForm(prev => ({ ...prev, vendorName: event.target.value }))} />
                            </div>
                            <div>
                                <Label>{t("client.industry", "Industry")}</Label>
                                <ThemedValueSelect
                                    value={vendorForm.industry}
                                    onChange={value => setVendorForm(prev => ({ ...prev, industry: value as VendorIndustry | "" }))}
                                    options={vendorIndustryOptions}
                                    placeholder={t("client.selectIndustry", "Select industry")}
                                    ariaLabel={t("client.industry", "Industry")}
                                    locale={localeKey}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>{t("client.vendorDescription", "Vendor Description")}</Label>
                                <Textarea
                                    rows={3}
                                    value={vendorForm.vendorDescription}
                                    onChange={event => setVendorForm(prev => ({ ...prev, vendorDescription: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.businessRegistrationNumber", "Business Registration Number")}</Label>
                                <Input
                                    value={vendorForm.businessRegistrationNumber}
                                    onChange={event =>
                                        setVendorForm(prev => ({ ...prev, businessRegistrationNumber: event.target.value }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>{t("client.headquartersLocation", "Headquarters Location")}</Label>
                                <ThemedValueSelect
                                    value={vendorForm.headquartersLocation}
                                    onChange={value => setVendorForm(prev => ({ ...prev, headquartersLocation: value as VendorCountry | "" }))}
                                    options={vendorCountryOptions}
                                    placeholder={t("client.selectLocation", "Select location")}
                                    ariaLabel={t("client.headquartersLocation", "Headquarters Location")}
                                    locale={localeKey}
                                />
                            </div>
                            <div>
                                <Label>{t("client.primaryContactName", "Primary Contact Name")}</Label>
                                <Input
                                    value={vendorForm.primaryContactName}
                                    onChange={event => setVendorForm(prev => ({ ...prev, primaryContactName: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.primaryContactEmail", "Primary Contact Email")}</Label>
                                <Input
                                    type="email"
                                    value={vendorForm.primaryContactEmail}
                                    onChange={event => setVendorForm(prev => ({ ...prev, primaryContactEmail: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.primaryContactRole", "Primary Contact Role")}</Label>
                                <Input
                                    value={vendorForm.primaryContactRole}
                                    onChange={event => setVendorForm(prev => ({ ...prev, primaryContactRole: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.primaryContactPhone", "Primary Contact Phone")}</Label>
                                <Input
                                    value={vendorForm.primaryContactPhone}
                                    onChange={event => setVendorForm(prev => ({ ...prev, primaryContactPhone: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.serviceType", "Service Type")}</Label>
                                <ThemedValueSelect
                                    value={vendorForm.serviceType}
                                    onChange={value => setVendorForm(prev => ({ ...prev, serviceType: value as VendorServiceType | "" }))}
                                    options={vendorServiceTypeOptions}
                                    placeholder={t("client.selectServiceType", "Select service type")}
                                    ariaLabel={t("client.serviceType", "Service Type")}
                                    locale={localeKey}
                                />
                            </div>
                            <div>
                                <Label>{t("client.hostingEnvironment", "Hosting Environment")}</Label>
                                <ThemedValueSelect
                                    value={vendorForm.hostingEnvironment}
                                    onChange={value => setVendorForm(prev => ({ ...prev, hostingEnvironment: value as VendorHostingEnvironment | "" }))}
                                    options={vendorHostingEnvironmentOptions}
                                    placeholder={t("client.selectHostingEnvironment", "Select hosting environment")}
                                    ariaLabel={t("client.hostingEnvironment", "Hosting Environment")}
                                    locale={localeKey}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>{t("client.serviceScope", "Service Scope")}</Label>
                                <Textarea
                                    rows={2}
                                    value={vendorForm.serviceScope}
                                    onChange={event => setVendorForm(prev => ({ ...prev, serviceScope: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.criticalityLevel", "Criticality Level")}</Label>
                                <ThemedValueSelect
                                    value={vendorForm.criticalityLevel}
                                    onChange={value => setVendorForm(prev => ({ ...prev, criticalityLevel: value as VendorCriticalityLevel | "" }))}
                                    options={vendorCriticalityLevelOptions}
                                    placeholder={t("client.selectLevel", "Select level")}
                                    ariaLabel={t("client.criticalityLevel", "Criticality Level")}
                                    locale={localeKey}
                                />
                            </div>
                            <div>
                                <Label>{t("client.riskTier", "Risk Tier")}</Label>
                                <ThemedValueSelect
                                    value={vendorForm.riskTier}
                                    onChange={value => setVendorForm(prev => ({ ...prev, riskTier: value as VendorRiskTier | "" }))}
                                    options={vendorRiskTierOptions}
                                    placeholder={t("client.selectTier", "Select tier")}
                                    ariaLabel={t("client.riskTier", "Risk Tier")}
                                    locale={localeKey}
                                />
                            </div>
                            <div>
                                <Label>{t("client.thirdPartyDependencies", "Third-party Dependencies")}</Label>
                                <ThemedValueSelect
                                    value={vendorForm.thirdPartyDependencies}
                                    onChange={value => setVendorForm(prev => ({ ...prev, thirdPartyDependencies: value as VendorDependencyLevel | "" }))}
                                    options={vendorDependencyLevelOptions}
                                    placeholder={t("client.selectDependencyLevel", "Select dependency level")}
                                    ariaLabel={t("client.thirdPartyDependencies", "Third-party Dependencies")}
                                    locale={localeKey}
                                />
                            </div>
                            <div>
                                <Label>{t("client.fourthPartyDependencies", "Fourth-party Dependencies")}</Label>
                                <ThemedValueSelect
                                    value={vendorForm.fourthPartyDependencies}
                                    onChange={value => setVendorForm(prev => ({ ...prev, fourthPartyDependencies: value as VendorDependencyLevel | "" }))}
                                    options={vendorDependencyLevelOptions}
                                    placeholder={t("client.selectDependencyLevel", "Select dependency level")}
                                    ariaLabel={t("client.fourthPartyDependencies", "Fourth-party Dependencies")}
                                    locale={localeKey}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 gap-4">
                            <MultiChecklist
                                title={t("client.cloudProviders", "Cloud Providers")}
                                locale={localeKey}
                                options={vendorCloudProviderOptions}
                                selected={vendorForm.cloudProviders}
                                onToggle={value =>
                                    setVendorForm(prev => ({
                                        ...prev,
                                        cloudProviders: toggleArrayValue(prev.cloudProviders, value),
                                    }))
                                }
                            />
                            <MultiChecklist
                                title={t("client.operatingCountries", "Operating Countries")}
                                locale={localeKey}
                                options={vendorCountryOptions}
                                selected={vendorForm.operatingCountries}
                                onToggle={value =>
                                    setVendorForm(prev => ({
                                        ...prev,
                                        operatingCountries: toggleArrayValue(prev.operatingCountries, value),
                                    }))
                                }
                            />
                            <MultiChecklist
                                title={t("client.dataLocations", "Data Locations")}
                                locale={localeKey}
                                options={vendorCountryOptions}
                                selected={vendorForm.dataLocations}
                                onToggle={value =>
                                    setVendorForm(prev => ({
                                        ...prev,
                                        dataLocations: toggleArrayValue(prev.dataLocations, value),
                                    }))
                                }
                            />
                            <MultiChecklist
                                title={t("client.regulatoryJurisdictions", "Regulatory Jurisdictions")}
                                locale={localeKey}
                                options={vendorJurisdictionOptions}
                                selected={vendorForm.regulatoryJurisdictions}
                                onToggle={value =>
                                    setVendorForm(prev => ({
                                        ...prev,
                                        regulatoryJurisdictions: toggleArrayValue(prev.regulatoryJurisdictions, value),
                                    }))
                                }
                            />
                            <MultiChecklist
                                title={t("client.complianceCertifications", "Compliance Certifications")}
                                locale={localeKey}
                                options={vendorComplianceStandardOptions}
                                selected={vendorForm.certifications}
                                onToggle={value =>
                                    setVendorForm(prev => ({
                                        ...prev,
                                        certifications: toggleArrayValue(prev.certifications, value),
                                    }))
                                }
                            />
                            <MultiChecklist
                                title={t("client.dataProcessingActivities", "Data Processing Activities")}
                                locale={localeKey}
                                options={vendorDataProcessingActivityOptions}
                                selected={vendorForm.dataProcessingActivities}
                                onToggle={value =>
                                    setVendorForm(prev => ({
                                        ...prev,
                                        dataProcessingActivities: toggleArrayValue(prev.dataProcessingActivities, value),
                                    }))
                                }
                            />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold">{t("client.techStackComponents", "Technology Stack Components")}</h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                        setVendorForm(prev => ({
                                            ...prev,
                                            techStackComponents: [...prev.techStackComponents, { ...initialTechStackRow }],
                                        }))
                                    }
                                >
                                    <Plus className="mr-1 h-3.5 w-3.5" /> {t("client.addComponent", "Add Component")}
                                </Button>
                            </div>

                            {vendorForm.techStackComponents.map((component, index) => (
                                <div key={index} className="rounded-lg border border-border p-3">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div>
                                            <Label>{t("client.componentName", "Component Name")}</Label>
                                            <Input
                                                value={component.componentName}
                                                onChange={event =>
                                                    setVendorForm(prev => ({
                                                        ...prev,
                                                        techStackComponents: prev.techStackComponents.map((entry, entryIndex) =>
                                                            entryIndex === index
                                                                ? { ...entry, componentName: event.target.value }
                                                                : entry
                                                        ),
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>{t("client.componentType", "Component Type")}</Label>
                                            <Input
                                                value={component.componentType}
                                                onChange={event =>
                                                    setVendorForm(prev => ({
                                                        ...prev,
                                                        techStackComponents: prev.techStackComponents.map((entry, entryIndex) =>
                                                            entryIndex === index
                                                                ? { ...entry, componentType: event.target.value }
                                                                : entry
                                                        ),
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>{t("client.technology", "Technology")}</Label>
                                            <Input
                                                value={component.technology}
                                                onChange={event =>
                                                    setVendorForm(prev => ({
                                                        ...prev,
                                                        techStackComponents: prev.techStackComponents.map((entry, entryIndex) =>
                                                            entryIndex === index
                                                                ? { ...entry, technology: event.target.value }
                                                                : entry
                                                        ),
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label>{t("client.dataHandling", "Data Handling")}</Label>
                                            <Input
                                                value={component.dataHandling ?? ""}
                                                onChange={event =>
                                                    setVendorForm(prev => ({
                                                        ...prev,
                                                        techStackComponents: prev.techStackComponents.map((entry, entryIndex) =>
                                                            entryIndex === index
                                                                ? { ...entry, dataHandling: event.target.value }
                                                                : entry
                                                        ),
                                                    }))
                                                }
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label>{t("client.description", "Description")}</Label>
                                            <Textarea
                                                rows={2}
                                                value={component.description ?? ""}
                                                onChange={event =>
                                                    setVendorForm(prev => ({
                                                        ...prev,
                                                        techStackComponents: prev.techStackComponents.map((entry, entryIndex) =>
                                                            entryIndex === index
                                                                ? { ...entry, description: event.target.value }
                                                                : entry
                                                        ),
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    {vendorForm.techStackComponents.length > 1 ? (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="mt-2 text-destructive"
                                            onClick={() =>
                                                setVendorForm(prev => ({
                                                    ...prev,
                                                    techStackComponents: prev.techStackComponents.filter(
                                                        (_, entryIndex) => entryIndex !== index
                                                    ),
                                                }))
                                            }
                                        >
                                            <Trash2 className="mr-1 h-3.5 w-3.5" /> {t("client.remove", "Remove")}
                                        </Button>
                                    ) : null}
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {t("client.requiredHint", "Fill in all required fields before saving.")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Button onClick={handleCreateVendor} disabled={createVendorMutation.isPending}>
                                {createVendorMutation.isPending ? t("client.saving", "Saving...") : t("client.saveVendorProfile", "Save Vendor Profile")}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handlePreviewScore}
                                disabled={assessDraftMutation.isPending}
                            >
                                {assessDraftMutation.isPending ? (
                                    <>{t("client.previewing", "Analysing...")}</>
                                ) : (
                                    <><Eye className="mr-1.5 h-4 w-4" />{t("client.previewScore", "Preview Compliance Score")}</>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setVendorForm(initialVendorForm)}
                            >
                                {t("client.resetForm", "Reset Form")}
                            </Button>
                        </div>
                        {createVendorMutation.isPending && (
                            <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                                {t("client.vendorSavingHint", "Saving vendor profile...")}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Preview Compliance Score Dialog ─────────────────────────── */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t("client.previewTitle", "Compliance Preview")}</DialogTitle>
                        <DialogDescription>
                            {t("client.previewDesc", "Estimated compliance snapshot based on the current form data.")}
                        </DialogDescription>
                    </DialogHeader>
                    {previewResult && (
                        <div className="space-y-4">
                            {/* Score ring + badges */}
                            <div className="flex items-center gap-4">
                                <div
                                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-2xl font-bold"
                                    style={{
                                        borderColor: riskPalette[previewResult.riskLevel] ?? "#64748b",
                                        color: riskPalette[previewResult.riskLevel] ?? "#64748b",
                                    }}
                                >
                                    {previewResult.overallScore}
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-sm text-muted-foreground">{t("client.previewOverallScore", "Overall Score")}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <Badge style={{ backgroundColor: riskPalette[previewResult.riskLevel] ?? "#64748b", color: "#fff" }}>
                                            {previewResult.riskLevel.toUpperCase()}
                                        </Badge>
                                        <Badge variant="outline">
                                            {previewResult.status.replace(/_/g, " ").toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Jurisdiction scores */}
                            <div>
                                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {t("client.previewJurisdictions", "Jurisdiction Scores")}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="rounded border px-3 py-2 text-center">
                                        <p className="text-lg font-bold">{previewResult.jurisdictionScores.china}</p>
                                        <p className="text-xs text-muted-foreground">{t("client.previewChina", "China")}</p>
                                    </div>
                                    <div className="rounded border px-3 py-2 text-center">
                                        <p className="text-lg font-bold">{previewResult.jurisdictionScores.saudiArabia}</p>
                                        <p className="text-xs text-muted-foreground">{t("client.previewSaudi", "Saudi Arabia")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Top 5 gaps sorted by severity */}
                            {previewResult.gaps.length > 0 && (
                                <div>
                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        {t("client.previewTopGaps", "Top Gaps")}
                                    </p>
                                    <ul className="space-y-1.5">
                                        {[...previewResult.gaps]
                                            .sort((a, b) => {
                                                const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                                                return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
                                            })
                                            .slice(0, 5)
                                            .map((gap) => (
                                                <li key={gap.code} className="flex items-start gap-2 text-sm">
                                                    <Badge
                                                        variant="outline"
                                                        className="mt-0.5 shrink-0 text-xs"
                                                        style={{
                                                            borderColor: riskPalette[gap.severity] ?? "#64748b",
                                                            color: riskPalette[gap.severity] ?? "#64748b",
                                                        }}
                                                    >
                                                        {gap.severity}
                                                    </Badge>
                                                    <span className="shrink-0 font-mono text-xs text-muted-foreground">{gap.code}</span>
                                                    <span className="flex-1">{gap.title}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <p className="rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
                                {t("client.previewDisclaimer", "This is a preview only. Save the vendor profile to persist and run the full AI-powered assessment.")}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                            {t("client.previewClose", "Close")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            {t("client.consultationTitle", "Consultation Request")}
                        </CardTitle>
                        <CardDescription>
                            {t("client.consultationDesc", "Send targeted questions to DJAC experts with context on jurisdictions, vendors, and technology concerns.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                                <Label>{t("client.contactName", "Contact Name")}</Label>
                                <Input
                                    value={consultationForm.contactName}
                                    onChange={event =>
                                        setConsultationForm(prev => ({ ...prev, contactName: event.target.value }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>{t("client.contactEmail", "Contact Email")}</Label>
                                <Input
                                    type="email"
                                    value={consultationForm.contactEmail}
                                    onChange={event =>
                                        setConsultationForm(prev => ({ ...prev, contactEmail: event.target.value }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>{t("client.labelOrganization", "Organization")}</Label>
                                <Input
                                    value={consultationForm.organizationName}
                                    onChange={event =>
                                        setConsultationForm(prev => ({ ...prev, organizationName: event.target.value }))
                                    }
                                />
                            </div>
                            <div>
                                <Label>{t("client.topic", "Topic")}</Label>
                                <Input
                                    value={consultationForm.topic}
                                    onChange={event => setConsultationForm(prev => ({ ...prev, topic: event.target.value }))}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>{t("client.jurisdictions", "Jurisdictions")}</Label>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {vendorJurisdictionValues.map(value => {
                                        const active = consultationForm.jurisdictions.includes(value);
                                        return (
                                            <Button
                                                key={value}
                                                type="button"
                                                size="sm"
                                                variant={active ? "default" : "outline"}
                                                aria-pressed={active}
                                                onClick={() =>
                                                    setConsultationForm(prev => ({
                                                        ...prev,
                                                        jurisdictions: toggleArrayValue(prev.jurisdictions, value),
                                                    }))
                                                }
                                            >
                                                {value}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <Label>{t("client.vendorNameOptional", "Vendor Name (Optional)")}</Label>
                                <Input
                                    value={consultationForm.vendorName}
                                    onChange={event => setConsultationForm(prev => ({ ...prev, vendorName: event.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>{t("client.techStackSummaryOptional", "Tech Stack Summary (Optional)")}</Label>
                                <Input
                                    value={consultationForm.techStackSummary}
                                    onChange={event =>
                                        setConsultationForm(prev => ({ ...prev, techStackSummary: event.target.value }))
                                    }
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Label>{t("client.summary", "Summary")}</Label>
                                <Textarea
                                    rows={4}
                                    value={consultationForm.summary}
                                    onChange={event => setConsultationForm(prev => ({ ...prev, summary: event.target.value }))}
                                    onKeyDown={event => {
                                        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                                            event.preventDefault();
                                            handleConsultationSubmit();
                                        }
                                    }}
                                    aria-label={t("client.summary", "Summary")}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">{t("client.ctrlEnterHint", "Ctrl+Enter to submit")}</p>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("client.consultationRequiredHint", "All fields except Vendor Name and Tech Stack are required.")}
                        </p>
                        <Button onClick={handleConsultationSubmit} disabled={submitConsultationMutation.isPending}>
                            {submitConsultationMutation.isPending ? t("client.submitting", "Submitting...") : t("client.submitConsultation", "Submit Consultation")}
                        </Button>
                        {submitConsultationMutation.isPending && (
                            <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                                {t("client.consultationSubmittingHint", "Submitting your consultation request...")}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileBadge className="h-5 w-5 text-indigo-600" />
                            {t("client.regulatoryWatchTitle", "Regulatory Update Watch")}
                        </CardTitle>
                        <CardDescription>
                            {t("client.regulatoryWatchDesc", "Quick references for current China and Saudi framework entries available in your environment.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-lg border border-border p-3">
                            <h3 className="text-sm font-semibold">{t("client.saudiArabia", "Saudi Arabia")}</h3>
                            {saudiFrameworksQuery.isLoading ? (
                                <p role="status" aria-live="polite" className="mt-2 animate-pulse text-xs text-muted-foreground">
                                    {t("client.loadingFrameworks", "Loading frameworks...")}
                                </p>
                            ) : saudiFrameworksQuery.isError ? (
                                <div className="mt-2 flex flex-col gap-2">
                                    <p className="text-xs text-destructive">{saudiFrameworksQuery.error?.message || t("client.frameworksLoadError", "Failed to load frameworks.")}</p>
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => saudiFrameworksQuery.refetch()}>{t("common.retry", "Retry")}</Button>
                                </div>
                            ) : (saudiFrameworksQuery.data ?? []).length === 0 ? (
                                <p className="mt-2 text-xs text-muted-foreground">{t("client.noFrameworksFound", "No frameworks available.")}</p>
                            ) : (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(saudiFrameworksQuery.data ?? []).map(framework => (
                                        <Badge key={framework.id} variant="secondary">
                                            {framework.code} · {framework.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="rounded-lg border border-border p-3">
                            <h3 className="text-sm font-semibold">{t("client.china", "China")}</h3>
                            {chinaFrameworksQuery.isLoading ? (
                                <p role="status" aria-live="polite" className="mt-2 animate-pulse text-xs text-muted-foreground">
                                    {t("client.loadingFrameworks", "Loading frameworks...")}
                                </p>
                            ) : chinaFrameworksQuery.isError ? (
                                <div className="mt-2 flex flex-col gap-2">
                                    <p className="text-xs text-destructive">{chinaFrameworksQuery.error?.message || t("client.frameworksLoadError", "Failed to load frameworks.")}</p>
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => chinaFrameworksQuery.refetch()}>{t("common.retry", "Retry")}</Button>
                                </div>
                            ) : (chinaFrameworksQuery.data ?? []).length === 0 ? (
                                <p className="mt-2 text-xs text-muted-foreground">{t("client.noFrameworksFound", "No frameworks available.")}</p>
                            ) : (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {(chinaFrameworksQuery.data ?? []).map(framework => (
                                        <Badge key={framework.id} variant="secondary">
                                            {framework.code} · {framework.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("client.regulatoryHint", "Use the Compliance Tracker and Framework Analysis sections for full obligation timelines and legal references.")}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Activity className="h-5 w-5 text-red-500" />
                            {t("client.assessmentIntelligenceTitle", "Assessment Intelligence")}
                        </CardTitle>
                        <CardDescription>
                            {t("client.assessmentIntelligenceDesc", "Monitor live AI pipeline progress and compare recent compliance scores.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeSnapshot ? <AIAssessmentJobProgress snapshot={activeSnapshot} /> : null}

                        <div className="rounded-lg border border-border p-3">
                            <p className="mb-3 text-sm font-medium">{t("client.recentScoreDistribution", "Recent Score Distribution")}</p>
                            {completedAssessments.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t("client.noCompletedAssessments", "No completed AI assessments yet.")}</p>
                            ) : (
                                <div className="space-y-2">
                                    {completedAssessments.slice(0, 10).map(entry => (
                                        <div key={entry.jobId} className="space-y-1">
                                            <div className="flex items-center justify-between gap-2 text-xs">
                                                <span className="font-medium text-foreground">{entry.vendorName}</span>
                                                <span className="text-muted-foreground">{entry.score.toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full"
                                                    style={{
                                                        width: `${Math.max(0, Math.min(100, entry.score))}%`,
                                                        backgroundColor: riskPalette[entry.riskLevel] ?? "#2563eb",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {(["critical", "high", "medium", "low"] as const).map(level => (
                                <div key={level} className="rounded-lg border border-border bg-muted/40 p-3">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t(`client.severity${level.charAt(0).toUpperCase()}${level.slice(1)}`, level)}</p>
                                    <p className="text-xl font-semibold">{severityCards[level]}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between gap-3 text-lg">
                            <span>{t("client.savedVendorsTitle", "Saved Vendors")}</span>
                            <Button type="button" size="sm" variant="outline" onClick={() => vendorListQuery.refetch()}>
                                <RefreshCw className="mr-1 h-3.5 w-3.5" /> {t("client.refresh", "Refresh")}
                            </Button>
                        </CardTitle>
                        <CardDescription>
                            {t("client.savedVendorsDesc", "Run or re-run AI assessments on stored profiles.")}
                        </CardDescription>
                        {(vendorListQuery.data ?? []).length > 1 && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <SimpleStringSelect
                                    value={vendorSortKey}
                                    onChange={value => setVendorSortKey(value as "name" | "risk")}
                                    ariaLabel={t("client.sortBy", "Sort by")}
                                    className="h-8 w-[170px] text-xs"
                                    options={[
                                        { value: "name", label: t("client.sortByName", "Name A→Z") },
                                        { value: "risk", label: t("client.sortByRisk", "Highest Risk First") },
                                    ]}
                                />
                                <ThemedValueSelect
                                    value={vendorJurisdictionFilter === "all" ? "" : (vendorJurisdictionFilter as VendorJurisdiction | "")}
                                    onChange={value => setVendorJurisdictionFilter(value || "all")}
                                    options={vendorJurisdictionOptions}
                                    placeholder={t("client.filterAllJurisdictions", "All Jurisdictions")}
                                    ariaLabel={t("client.filterByJurisdiction", "Filter by jurisdiction")}
                                    locale={localeKey}
                                    className="h-8 w-[220px] text-xs"
                                />
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {vendorListQuery.isError ? (
                            <div className="space-y-2">
                                <p className="text-sm text-destructive">{vendorListQuery.error?.message || t("client.vendorsLoadError", "Failed to load vendors.")}</p>
                                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => vendorListQuery.refetch()}>{t("common.retry", "Retry")}</Button>
                            </div>
                        ) : filteredSortedVendors.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                {vendorJurisdictionFilter !== "all"
                                    ? t("client.noMatchingVendors", "No vendors match the selected jurisdiction.")
                                    : t("client.noSavedVendors", "No vendor profiles saved yet.")}
                            </p>
                        ) : (
                            filteredSortedVendors.map(vendor => (
                                <div key={vendor.id} className="rounded-lg border border-border p-3">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-semibold">{vendor.vendorName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {vendor.serviceType ?? t("client.serviceFallback", "Service")} · {vendor.riskTier ?? t("client.riskTierPending", "Risk tier pending")}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleRunAssessment(vendor.id)}
                                            disabled={submitAssessmentMutation.isPending}
                                        >
                                            {t("client.runAssessment", "Run Assessment")}
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
