import { useEffect, useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QueryErrorPanel } from "@/components/ui/query-error-panel";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Building2, Globe, Mail, Briefcase, Loader2,
    CalendarDays, ShieldCheck, CreditCard, Lock,
    CheckCircle2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const JURISDICTION_OPTIONS = [
    { value: "China", label: "China (CN)" },
    { value: "Saudi Arabia", label: "Saudi Arabia (SA)" },
    { value: "Both", label: "Both — China & Saudi Arabia" },
    { value: "Other", label: "Other / Custom" },
] as const;

const PLAN_COLORS: Record<string, string> = {
    free_trial: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300/30",
    starter: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-300/30",
    professional: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-300/30",
    enterprise: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-300/30",
};

const PLAN_LABELS: Record<string, string> = {
    free_trial: "Free Trial",
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
};

// ─── Days-left helper ─────────────────────────────────────────────────────────

function daysLeft(date: Date | string | null | undefined): number | null {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionHeading({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3">
            <Icon size={14} className="shrink-0" />
            {label}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OrgSettings() {
    const { t } = useLocale();
    usePageTitle(t("orgSettings.title", "Organization Settings"));

    const orgQuery = trpc.orgSettings.get.useQuery(undefined, { retry: false });

    useEffect(() => {
        if (orgQuery.error) toast.error(t("orgSettings.loadError", "Failed to load organization settings."));
    }, [orgQuery.error]);
    const updateMut = trpc.orgSettings.update.useMutation({
        onSuccess: () => {
            toast.success(t("orgSettings.savedSuccess", "Organization settings saved"));
            void orgQuery.refetch();
        },
        onError: err => toast.error(err.message),
    });

    const org = orgQuery.data;
    const isAdmin = org?.currentUserRole === "owner" || org?.currentUserRole === "admin";

    // ─── Form state ────────────────────────────────────────────────────────────
    const [name, setName] = useState("");
    const [billingEmail, setBillingEmail] = useState("");
    const [industry, setIndustry] = useState("");
    const [jurisdiction, setJurisdiction] = useState<string>("Both");

    // Track unsaved changes
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        if (org) {
            setName(org.name ?? "");
            setBillingEmail(org.billingEmail ?? "");
            setIndustry(org.industry ?? "");
            setJurisdiction(org.primaryJurisdiction ?? "Both");
            setDirty(false);
        }
    }, [org]);

    function markDirty() { setDirty(true); }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!isAdmin) return;
        updateMut.mutate({
            name: name || undefined,
            billingEmail: billingEmail || undefined,
            industry: industry || undefined,
            primaryJurisdiction: jurisdiction as "China" | "Saudi Arabia" | "Both" | "Other",
        });
        setDirty(false);
    }

    // ─── Skeleton ──────────────────────────────────────────────────────────────
    if (orgQuery.isLoading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />
                ))}
            </div>
        );
    }

    if (orgQuery.isError) {
        return (
            <div className="djac-page">
                <QueryErrorPanel
                    message={orgQuery.error?.message ?? t("orgSettings.loadError", "Failed to load organization settings.")}
                    onRetry={() => {
                        void orgQuery.refetch();
                    }}
                    retryLabel={t("common.retry", "Retry")}
                />
            </div>
        );
    }

    const trial = daysLeft(org?.trialEndsAt);

    return (
        <div className="djac-page">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Building2 size={22} className="text-primary" />
                        {t("orgSettings.title", "Organization Settings")}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("orgSettings.subtitle", "Manage your organization's profile and compliance configuration.")}
                    </p>
                </div>

                {/* Plan badge */}
                {org && (
                    <Badge
                        variant="outline"
                        className={`text-xs px-2.5 py-1 ${PLAN_COLORS[org.plan] ?? ""}`}
                    >
                        <CreditCard size={11} className="mr-1.5" />
                        {PLAN_LABELS[org.plan] ?? org.plan}
                        {trial !== null && (
                            <span className="ml-1.5 opacity-75">· {trial}d left</span>
                        )}
                    </Badge>
                )}
            </div>

            {/* ── Read-only org meta ───────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                        {t("orgSettings.identitySection", "Organization Identity")}
                    </CardTitle>
                    <CardDescription>
                        {t("orgSettings.identityDesc", "These values are set by the system and cannot be changed here.")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Slug */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <Lock size={14} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">
                                {t("orgSettings.slugLabel", "Organization Slug")}
                            </p>
                            <p className="text-sm font-mono font-medium truncate">
                                {org?.slug ?? "—"}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    {/* Seats */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <ShieldCheck size={14} className="text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-muted-foreground">
                                {t("orgSettings.maxSeats", "Max Seats")}
                            </p>
                            <p className="text-sm font-medium">
                                {org?.maxSeats ?? 5}
                                {" "}
                                <span className="text-muted-foreground text-xs">
                                    {t("orgSettings.seatsNote", "— upgrade plan to increase")}
                                </span>
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => window.location.assign("/billing")}
                        >
                            {t("orgSettings.managePlan", "Manage Plan")}
                        </Button>
                    </div>

                    {/* Trial dates */}
                    {org?.trialEndsAt && (
                        <>
                            <Separator />
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0">
                                    <CalendarDays size={14} className="text-amber-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground">
                                        {t("orgSettings.trialEnds", "Trial Ends")}
                                    </p>
                                    <p className="text-sm font-medium">
                                        {new Date(org.trialEndsAt).toLocaleDateString(undefined, {
                                            year: "numeric", month: "long", day: "numeric",
                                        })}
                                        {trial !== null && trial <= 7 && (
                                            <span className="ml-2 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                                                ({trial}d remaining)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── Editable profile form ────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                        {t("orgSettings.profileSection", "Organization Profile")}
                    </CardTitle>
                    <CardDescription>
                        {isAdmin
                            ? t("orgSettings.profileDescAdmin", "Edit your organization's display name, contact, and compliance configuration.")
                            : t("orgSettings.profileDescReadOnly", "You need owner or admin role to edit these settings.")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-5">

                        {/* Name */}
                        <div className="space-y-1.5">
                            <Label htmlFor="org-name" className="flex items-center gap-1.5">
                                <Building2 size={13} />
                                {t("orgSettings.nameLabel", "Display Name")}
                            </Label>
                            <Input
                                id="org-name"
                                value={name}
                                onChange={e => { setName(e.target.value); markDirty(); }}
                                placeholder={t("orgSettings.namePlaceholder", "Acme Compliance Inc.")}
                                disabled={!isAdmin || updateMut.isPending}
                                maxLength={255}
                            />
                        </div>

                        {/* Billing Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="org-billing-email" className="flex items-center gap-1.5">
                                <Mail size={13} />
                                {t("orgSettings.billingEmailLabel", "Billing Email")}
                            </Label>
                            <Input
                                id="org-billing-email"
                                type="email"
                                value={billingEmail}
                                onChange={e => { setBillingEmail(e.target.value); markDirty(); }}
                                placeholder="billing@yourcompany.com"
                                disabled={!isAdmin || updateMut.isPending}
                                maxLength={320}
                            />
                            <p className="text-xs text-muted-foreground">
                                {t("orgSettings.billingEmailNote", "Receives invoices, trial reminders, and compliance deadline alerts.")}
                            </p>
                        </div>

                        {/* Industry */}
                        <div className="space-y-1.5">
                            <Label htmlFor="org-industry" className="flex items-center gap-1.5">
                                <Briefcase size={13} />
                                {t("orgSettings.industryLabel", "Industry")}
                            </Label>
                            <Input
                                id="org-industry"
                                value={industry}
                                onChange={e => { setIndustry(e.target.value); markDirty(); }}
                                placeholder={t("orgSettings.industryPlaceholder", "e.g. FinTech, Healthcare, E-Commerce…")}
                                disabled={!isAdmin || updateMut.isPending}
                                maxLength={120}
                            />
                        </div>

                        {/* Primary Jurisdiction */}
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5">
                                <Globe size={13} />
                                {t("orgSettings.jurisdictionLabel", "Primary Jurisdiction")}
                            </Label>
                            <Select
                                value={jurisdiction}
                                onValueChange={v => { setJurisdiction(v); markDirty(); }}
                                disabled={!isAdmin || updateMut.isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {JURISDICTION_OPTIONS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {t("orgSettings.jurisdictionNote", "Controls which compliance frameworks are highlighted across the platform.")}
                            </p>
                        </div>

                        {/* Save row */}
                        {isAdmin && (
                            <div className="flex items-center gap-3 pt-1">
                                <Button
                                    type="submit"
                                    disabled={updateMut.isPending || !dirty}
                                    className="gap-1.5"
                                >
                                    {updateMut.isPending
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : <CheckCircle2 size={14} />}
                                    {t("orgSettings.saveButton", "Save Changes")}
                                </Button>
                                {!dirty && !updateMut.isPending && (
                                    <span className="text-xs text-muted-foreground">
                                        {t("orgSettings.noChanges", "All changes saved")}
                                    </span>
                                )}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* ── Danger zone (owner only) ─────────────────────────────────── */}
            {org?.currentUserRole === "owner" && (
                <Card className="border-destructive/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base text-destructive">
                            {t("orgSettings.dangerZone", "Danger Zone")}
                        </CardTitle>
                        <CardDescription>
                            {t("orgSettings.dangerZoneDesc", "Irreversible actions. Proceed with caution.")}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/20 bg-destructive/5 p-4">
                            <div>
                                <p className="text-sm font-medium">
                                    {t("orgSettings.deleteOrgTitle", "Delete Organization")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {t("orgSettings.deleteOrgDesc", "You must cancel any active subscription before deleting. Contact support to proceed.")}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive border-destructive/40 hover:bg-destructive/10 shrink-0"
                                onClick={() => window.location.assign("mailto:support@djac.io?subject=Delete+Organization+Request")}
                            >
                                {t("orgSettings.contactSupport", "Contact Support")}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
