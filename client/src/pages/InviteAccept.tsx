/**
 * Invite Accept page  —  /invite-accept?token=<64-char-hex>
 *
 * Flow:
 *  1. Reads ?token from URL; queries lookupInvite (public).
 *  2. Displays org name, role, and inviteEmail.
 *  3. "Accept & Join" calls acceptInvite (protectedProcedure).
 *     - If user is not signed in → UNAUTHORIZED → redirect to /login?r=<current-url>
 *     - On success → redirect to /dashboard
 */
import type React from "react";
import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, Clock, Loader2, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
    owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-700",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700",
    compliance_officer: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-700",
    analyst: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
};

function rolePretty(role: string | null | undefined): string {
    if (!role) return "Member";
    return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InviteAccept() {
    usePageTitle("Accept Invitation — DJAC");
    const { t } = useLocale();
    const [, navigate] = useLocation();

    const token = new URLSearchParams(window.location.search).get("token") ?? "";

    const lookup = trpc.orgMembers.lookupInvite.useQuery(token, {
        enabled: token.length > 0,
        retry: false,
        refetchOnWindowFocus: false,
    });

    const acceptMut = trpc.orgMembers.acceptInvite.useMutation({
        onSuccess: () => {
            toast.success(t("inviteAccept.successTitle", "Welcome to the team!"));
            setTimeout(() => navigate("/dashboard"), 1500);
        },
        onError: (err) => {
            if (err.data?.code === "UNAUTHORIZED") {
                // Not signed in — redirect to login with a return URL
                const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                navigate(`/login?r=${returnUrl}`);
            } else {
                toast.error(err.message);
            }
        },
    });

    // ── No token provided ─────────────────────────────────────────────────────
    if (!token) {
        return (
            <InviteLayout>
                <InvalidCard
                    title={t("inviteAccept.invalidTitle", "Invalid Invitation")}
                    description={t("inviteAccept.invalidDesc", "This invitation link is not recognized or may have already been used.")}
                />
            </InviteLayout>
        );
    }

    // ── Loading ───────────────────────────────────────────────────────────────
    if (lookup.isLoading) {
        return (
            <InviteLayout>
                <Card className="w-full max-w-md border-border shadow-xl">
                    <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-muted-foreground">{t("inviteAccept.loadingTitle", "Loading invitation...")}</p>
                    </CardContent>
                </Card>
            </InviteLayout>
        );
    }

    if (lookup.isError) {
        return (
            <InviteLayout>
                <Card className="w-full max-w-md border-border shadow-xl">
                    <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
                        <XCircle className="h-10 w-10 text-destructive" />
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {t("inviteAccept.lookupLoadErrorTitle", "Unable to load invitation")}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {lookup.error?.message ?? t("inviteAccept.lookupLoadErrorDesc", "Please retry to verify this invitation link.")}
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => {
                                void lookup.refetch();
                            }}
                        >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            </InviteLayout>
        );
    }

    const inv = lookup.data;

    // ── Invalid / not found ───────────────────────────────────────────────────
    if (!inv || (!inv.valid && !inv.orgName)) {
        return (
            <InviteLayout>
                <InvalidCard
                    title={t("inviteAccept.invalidTitle", "Invalid Invitation")}
                    description={t("inviteAccept.invalidDesc", "This invitation link is not recognized or may have already been used.")}
                />
            </InviteLayout>
        );
    }

    // ── Expired ───────────────────────────────────────────────────────────────
    if (inv.expired || !inv.valid) {
        return (
            <InviteLayout>
                <InvalidCard
                    icon={<Clock className="h-10 w-10 text-amber-500" />}
                    title={t("inviteAccept.expiredTitle", "Invitation Expired")}
                    description={t("inviteAccept.expiredDesc", "This invitation link has expired. Contact the organization admin for a new one.")}
                    orgName={inv.orgName ?? undefined}
                />
            </InviteLayout>
        );
    }

    // ── Success state (post-accept) ───────────────────────────────────────────
    if (acceptMut.isSuccess) {
        return (
            <InviteLayout>
                <Card className="w-full max-w-md border-border shadow-xl">
                    <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
                        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                        <div>
                            <h2 className="text-xl font-bold text-foreground">
                                {t("inviteAccept.successTitle", "Welcome to the team!")}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("inviteAccept.successDesc", "Your invitation has been accepted. Redirecting to your dashboard...")}
                            </p>
                        </div>
                        <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" />
                    </CardContent>
                </Card>
            </InviteLayout>
        );
    }

    // ── Valid invite ──────────────────────────────────────────────────────────
    return (
        <InviteLayout>
            <Card className="w-full max-w-md border-border shadow-xl">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-3">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Building2 size={32} />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {t("inviteAccept.title", "You've been invited!")}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                        {inv.orgName}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-4">
                    {/* Role */}
                    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <ShieldCheck size={14} />
                            {t("inviteAccept.joinAs", "You'll join as:")}
                        </span>
                        <Badge
                            variant="outline"
                            className={["text-xs font-semibold px-3 py-1 rounded-full", ROLE_BADGE[inv.role ?? "analyst"] ?? ""].join(" ")}
                        >
                            {rolePretty(inv.role)}
                        </Badge>
                    </div>

                    {/* Invited email */}
                    {inv.inviteEmail && (
                        <p className="text-xs text-center text-muted-foreground">
                            Invitation sent to <span className="font-medium text-foreground">{inv.inviteEmail}</span>
                        </p>
                    )}

                    {/* Accept */}
                    <Button
                        className="w-full"
                        size="lg"
                        onClick={() => acceptMut.mutate(token)}
                        disabled={acceptMut.isPending}
                    >
                        {acceptMut.isPending ? (
                            <><Loader2 size={16} className="animate-spin mr-2" />{t("inviteAccept.accepting", "Accepting...")}</>
                        ) : (
                            t("inviteAccept.acceptButton", "Accept & Join")
                        )}
                    </Button>

                    {/* Sign-in note */}
                    <p className="text-xs text-center text-muted-foreground">
                        {t("inviteAccept.signInDesc", "Not signed in? You'll be redirected to sign in first.")}{" "}
                        <a href="/login" className="text-primary hover:underline">
                            {t("inviteAccept.signInButton", "Sign In")}
                        </a>
                    </p>
                </CardContent>
            </Card>
        </InviteLayout>
    );
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────

function InviteLayout({ children }: { children: React.ReactNode }) {
    const { t } = useLocale();
    const { theme } = useTheme();
    const d = theme === "dark";
    const gridColor = d ? "rgba(255,255,255,0.04)" : "rgba(4,15,97,0.05)";
    const radial = d
        ? "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(147,89,236,0.18) 0%,transparent 60%)"
        : "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(2,132,199,0.08) 0%,transparent 60%)";
    const borderColor = d ? "rgba(255,255,255,0.09)" : "rgba(4,15,97,0.11)";
    const mutedColor = d ? "#9CA3AF" : "rgba(2,11,69,0.55)";

    return (
        <div style={{
            minHeight: "100vh", background: radial, backgroundColor: d ? "#040F61" : "#F0F4FF",
            fontFamily: "Inter,system-ui,sans-serif", display: "flex", flexDirection: "column"
        }}>
            {/* Dot grid */}
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
                backgroundImage: `linear-gradient(${gridColor} 1px,transparent 1px),linear-gradient(90deg,${gridColor} 1px,transparent 1px)`,
                backgroundSize: "40px 40px"
            }} />

            {/* Nav */}
            <nav style={{
                position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 32px", borderBottom: `1px solid ${borderColor}`, backdropFilter: "blur(10px)"
            }}>
                <Link href="/">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        <img src={APP_LOGO} alt={APP_TITLE} style={{ height: 32, width: "auto", maxWidth: 74, objectFit: "contain" }}
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>DJAC Tool</span>
                            <span style={{ color: mutedColor, fontSize: 9, letterSpacing: "0.01em" }}>Dual-Jurisdiction Assurance &amp; Compliance</span>
                        </div>
                    </div>
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LocaleSwitcher />
                    <ThemeToggle />
                </div>
            </nav>

            {/* Content */}
            <div style={{
                position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", padding: "40px 24px 56px"
            }}>
                {/* Security notice strip */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 20,
                    background: d ? "rgba(0,247,255,0.06)" : "rgba(2,132,199,0.06)",
                    border: `1px solid ${d ? "rgba(0,247,255,0.20)" : "rgba(2,132,199,0.18)"}`,
                    borderRadius: 99, padding: "6px 16px", fontSize: 10.5
                }}>
                    <ShieldCheck size={11} style={{ color: d ? "#00F7FF" : "#0284c7" }} />
                    <span style={{ color: mutedColor }}>
                        {t("invite.layout.notice", "Verified invitation link · TLS 1.3 · DJAC Compliance Platform")}
                    </span>
                </div>
                {children}
                <p style={{ color: mutedColor, fontSize: 10.5, marginTop: 24, textAlign: "center" }}>
                    {t("invite.layout.footer", "DJAC Tool · Enterprise Compliance Intelligence · Saudi Arabia · China · UAE")}
                </p>
            </div>
        </div>
    );
}

// ─── Error card ───────────────────────────────────────────────────────────────

function InvalidCard({
    icon,
    title,
    description,
    orgName,
}: {
    icon?: React.ReactNode;
    title: string;
    description: string;
    orgName?: string;
}) {
    return (
        <Card className="w-full max-w-md border-border shadow-xl">
            <CardContent className="pt-10 pb-10 flex flex-col items-center gap-4 text-center">
                {icon ?? <XCircle className="h-12 w-12 text-destructive" />}
                <div>
                    <h2 className="text-xl font-bold text-foreground">{title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    {orgName && <p className="text-sm font-medium text-foreground mt-2">{orgName}</p>}
                </div>
                <a href="/" className="text-sm text-primary hover:underline">
                    Return to Home
                </a>
            </CardContent>
        </Card>
    );
}
