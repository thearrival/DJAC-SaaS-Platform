import { useEffect, useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Eye, EyeOff, Loader2, QrCode, ShieldCheck, ShieldOff, Copy, Check, User, Key, Shield, Volume2, VolumeX, PlayCircle } from "lucide-react";
import { restartTour } from "@/components/TourGuide";
import { getSoundEnabled, setSoundEnabled, sounds } from "@/lib/sounds";

// ─── Password field helper ────────────────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, autoComplete }: {
    value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <Input
                type={show ? "text" : "password"}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="pr-9"
            />
            <button
                type="button"
                onClick={() => setShow(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={show ? "Hide password" : "Show password"}
            >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
        </div>
    );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────
function ProfileTab() {
    const { t } = useLocale();
    const meQuery = trpc.localAuth.me.useQuery(undefined, { retry: false });

    useEffect(() => {
        if (meQuery.error) toast.error(t("accountSettings.loadError", "Failed to load profile."));
    }, [meQuery.error]);

    const updateMut = trpc.localAuth.updateProfile.useMutation({
        onSuccess: () => {
            toast.success(t("accountSettings.profileSaved", "Profile saved"));
            void meQuery.refetch();
        },
        onError: err => toast.error(err.message),
    });

    const user = meQuery.data;
    const [name, setName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [industry, setIndustry] = useState("");
    const [preferredLocale, setPreferredLocale] = useState<"en" | "ar" | "zh">("en");

    if (meQuery.isError && !meQuery.data) {
        return (
            <Card>
                <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                    <User size={20} className="text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t("accountSettings.loadError", "Failed to load profile.")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("accountSettings.retryHint", "Retry to refresh your account details.")}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { void meQuery.refetch(); }}>
                        {t("common.retry", "Retry")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    useEffect(() => {
        if (user) {
            setName(user.name ?? "");
            setJobTitle(user.jobTitle ?? "");
            setCompanyName(user.companyName ?? "");
            setIndustry(user.industry ?? "");
            setPreferredLocale(user.preferredLocale ?? "en");
        }
    }, [user]);

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        updateMut.mutate({ name, jobTitle, companyName, industry, preferredLocale });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User size={18} />
                    {t("accountSettings.profileTitle", "Profile Information")}
                </CardTitle>
                <CardDescription>{t("accountSettings.profileDesc", "Update your name, title and preferred language.")}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>{t("accountSettings.fieldName", "Full Name")}</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t("accountSettings.fieldEmail", "Email")}</Label>
                            <Input value={user?.email ?? ""} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t("accountSettings.fieldJobTitle", "Job Title")}</Label>
                            <Input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Compliance Officer" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t("accountSettings.fieldCompany", "Company")}</Label>
                            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Organisation name" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t("accountSettings.fieldIndustry", "Industry")}</Label>
                            <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Technology" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>{t("accountSettings.fieldLocale", "Preferred Language")}</Label>
                            <Select value={preferredLocale} onValueChange={v => setPreferredLocale(v as "en" | "ar" | "zh")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="ar">Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©</SelectItem>
                                    <SelectItem value="zh">ä¸­æ–‡</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button type="submit" disabled={updateMut.isPending}>
                        {updateMut.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                        {t("accountSettings.saveProfile", "Save Profile")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Password Tab ─────────────────────────────────────────────────────────────
function PasswordTab() {
    const { t } = useLocale();
    const changePwMut = trpc.localAuth.changePassword.useMutation({
        onSuccess: () => {
            toast.success(t("accountSettings.passwordChanged", "Password changed successfully"));
            setCurrent(""); setNext(""); setConfirm("");
        },
        onError: err => toast.error(err.message),
    });

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [matchErr, setMatchErr] = useState("");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMatchErr("");
        if (next !== confirm) { setMatchErr(t("accountSettings.passwordMismatch", "Passwords do not match")); return; }
        changePwMut.mutate({ currentPassword: current, newPassword: next });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Key size={18} />
                    {t("accountSettings.passwordTitle", "Change Password")}
                </CardTitle>
                <CardDescription>{t("accountSettings.passwordDesc", "Choose a strong password with at least 8 characters, one uppercase letter and one number.")}</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
                    <div className="space-y-1.5">
                        <Label>{t("accountSettings.currentPassword", "Current Password")}</Label>
                        <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t("accountSettings.newPassword", "New Password")}</Label>
                        <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t("accountSettings.confirmPassword", "Confirm New Password")}</Label>
                        <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
                    </div>
                    {matchErr && <p className="text-sm text-destructive">{matchErr}</p>}
                    {changePwMut.error && <p className="text-sm text-destructive">{changePwMut.error.message}</p>}
                    <Button type="submit" disabled={changePwMut.isPending || !current || !next || !confirm}>
                        {changePwMut.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                        {t("accountSettings.updatePassword", "Update Password")}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

// ─── Security / 2FA Tab ───────────────────────────────────────────────────────
type SetupStep = "idle" | "qr" | "confirm" | "backup_codes";

function SecurityTab() {
    const { t } = useLocale();
    const meQuery = trpc.localAuth.me.useQuery(undefined, { retry: false });
    const mfaEnabled = !!(meQuery.data?.mfaEnabled);

    const [step, setStep] = useState<SetupStep>("idle");
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [code, setCode] = useState("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [disablePassword, setDisablePassword] = useState("");
    const [copied, setCopied] = useState(false);

    const setupMut = trpc.localAuth.setup2fa.useMutation({
        onSuccess: data => { setQrDataUrl(data.qrDataUrl); setSecret(data.secret); setStep("qr"); },
        onError: err => toast.error(err.message),
    });

    const confirmMut = trpc.localAuth.confirm2fa.useMutation({
        onSuccess: data => { setBackupCodes(data.backupCodes); setStep("backup_codes"); void meQuery.refetch(); },
        onError: err => toast.error(err.message),
    });

    const disableMut = trpc.localAuth.disable2fa.useMutation({
        onSuccess: () => { toast.success(t("accountSettings.2faDisabled", "Two-factor authentication disabled")); void meQuery.refetch(); setDisablePassword(""); },
        onError: err => toast.error(err.message),
    });

    function copyBackupCodes() {
        void navigator.clipboard.writeText(backupCodes.join("\n")).then(() => {
            setCopied(true); setTimeout(() => setCopied(false), 2000);
        });
    }

    if (meQuery.isError && !meQuery.data) {
        return (
            <Card>
                <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                    <Shield size={20} className="text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {t("accountSettings.securityLoadError", "Failed to load security settings.")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t("accountSettings.retryHint", "Retry to refresh your account details.")}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { void meQuery.refetch(); }}>
                        {t("common.retry", "Retry")}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield size={18} />
                    {t("accountSettings.securityTitle", "Two-Factor Authentication")}
                </CardTitle>
                <CardDescription>{t("accountSettings.securityDesc", "Add an extra layer of protection to your account using an authenticator app.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Status badge */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{t("accountSettings.2faStatus", "Status")}</span>
                    {mfaEnabled
                        ? <Badge><ShieldCheck size={12} className="mr-1" />{t("accountSettings.2faActive", "Active")}</Badge>
                        : <Badge variant="outline">{t("accountSettings.2faInactive", "Inactive")}</Badge>
                    }
                </div>

                <Separator />

                {/* Enable flow */}
                {!mfaEnabled && step === "idle" && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">{t("accountSettings.2faEnableHint", "Scan the QR code with Google Authenticator, Authy, or any TOTP-compatible app.")}</p>
                        <Button onClick={() => setupMut.mutate()} disabled={setupMut.isPending}>
                            {setupMut.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <QrCode size={14} className="mr-2" />}
                            {t("accountSettings.2faSetup", "Set Up 2FA")}
                        </Button>
                    </div>
                )}

                {!mfaEnabled && step === "qr" && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{t("accountSettings.2faScanQr", "Scan this QR code with your authenticator app, then enter the 6-digit code below.")}</p>
                        <div className="flex justify-center">
                            <img src={qrDataUrl} alt="TOTP QR Code" className="w-44 h-44 rounded-lg border" />
                        </div>
                        <details className="text-xs text-muted-foreground">
                            <summary className="cursor-pointer">{t("accountSettings.2faManualEntry", "Can't scan? Enter manually")}</summary>
                            <p className="mt-1 font-mono bg-muted px-2 py-1 rounded break-all">{secret}</p>
                        </details>
                        <div className="space-y-1.5 max-w-xs">
                            <Label>{t("accountSettings.2faCode", "Authenticator Code")}</Label>
                            <Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000" maxLength={6} inputMode="numeric" autoComplete="one-time-code" />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => confirmMut.mutate({ code })} disabled={code.length !== 6 || confirmMut.isPending}>
                                {confirmMut.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                                {t("accountSettings.2faVerify", "Verify & Enable")}
                            </Button>
                            <Button variant="ghost" onClick={() => { setStep("idle"); setCode(""); }}>
                                {t("accountSettings.cancel", "Cancel")}
                            </Button>
                        </div>
                        {confirmMut.error && <p className="text-sm text-destructive">{confirmMut.error.message}</p>}
                    </div>
                )}

                {step === "backup_codes" && (
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {t("accountSettings.2faEnabled", "Two-factor authentication is now active!")}
                        </p>
                        <div className="rounded-lg border bg-muted/50 p-4">
                            <p className="text-xs font-medium mb-2">{t("accountSettings.backupCodesTitle", "One-time backup codes — save these now:")}</p>
                            <div className="grid grid-cols-2 gap-1">
                                {backupCodes.map(c => (
                                    <code key={c} className="font-mono text-xs bg-background border rounded px-2 py-0.5">{c}</code>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("accountSettings.backupCodesNote", "Each code can only be used once. Store them somewhere safe — they will not be shown again.")}</p>
                        <Button variant="outline" size="sm" onClick={copyBackupCodes}>
                            {copied ? <Check size={14} className="mr-2 text-green-500" /> : <Copy size={14} className="mr-2" />}
                            {copied ? t("accountSettings.copied", "Copied!") : t("accountSettings.copyBackupCodes", "Copy backup codes")}
                        </Button>
                        <Button onClick={() => setStep("idle")}>{t("accountSettings.done", "Done")}</Button>
                    </div>
                )}

                {/* Disable flow */}
                {mfaEnabled && step !== "backup_codes" && (
                    <div className="space-y-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">
                                    <ShieldOff size={14} className="mr-2" />
                                    {t("accountSettings.2faDisable", "Disable 2FA")}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t("accountSettings.2faDisableConfirmTitle", "Disable two-factor authentication?")}</AlertDialogTitle>
                                    <AlertDialogDescription>{t("accountSettings.2faDisableConfirmDesc", "Enter your password to confirm. Your account will be less secure without 2FA.")}</AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-2">
                                    <PasswordInput value={disablePassword} onChange={setDisablePassword} autoComplete="current-password" placeholder="Current password" />
                                </div>
                                {disableMut.error && <p className="text-sm text-destructive">{disableMut.error.message}</p>}
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDisablePassword("")}>{t("accountSettings.cancel", "Cancel")}</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => disableMut.mutate({ password: disablePassword })}
                                        disabled={!disablePassword || disableMut.isPending}
                                        className="bg-destructive hover:bg-destructive/90"
                                    >
                                        {disableMut.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                                        {t("accountSettings.2faDisableConfirm", "Yes, disable 2FA")}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Preferences Tab (sounds + tour) ────────────────────────────────────────
function PreferencesTab() {
    const { t } = useLocale();
    const [soundEnabled, setSoundEnabledState] = useState(() => getSoundEnabled());
    const [tourRestarted, setTourRestarted] = useState(false);

    function toggleSound(enabled: boolean) {
        setSoundEnabled(enabled);
        setSoundEnabledState(enabled);
        if (enabled) setTimeout(() => sounds.success(), 80);
    }

    function handleRestartTour() {
        restartTour();
        setTourRestarted(true);
        setTimeout(() => setTourRestarted(false), 3000);
        toast.success(t("accountSettings.tourRestarted", "Tour will start on your next page load."));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PlayCircle size={18} />
                    {t("accountSettings.prefTitle", "Preferences")}
                </CardTitle>
                <CardDescription>{t("accountSettings.prefDesc", "Sound effects and onboarding tour settings.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Sound toggle */}
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                        {soundEnabled ? <Volume2 size={18} className="text-primary" /> : <VolumeX size={18} className="text-muted-foreground" />}
                        <div>
                            <p className="text-sm font-medium">{t("accountSettings.soundTitle", "UI Sound Effects")}</p>
                            <p className="text-xs text-muted-foreground">{t("accountSettings.soundDesc", "Professional micro-sounds on clicks, navigation, and notifications.")}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={soundEnabled}
                        onClick={() => toggleSound(!soundEnabled)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${soundEnabled ? "bg-primary" : "bg-input"
                            }`}
                    >
                        <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${soundEnabled ? "translate-x-5" : "translate-x-0"
                                }`}
                        />
                    </button>
                </div>

                <Separator />

                {/* Restart tour */}
                <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                    <div>
                        <p className="text-sm font-medium">{t("accountSettings.tourTitle", "Onboarding Tour")}</p>
                        <p className="text-xs text-muted-foreground">{t("accountSettings.tourDesc", "Restart the guided walkthrough that shows all platform features.")}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRestartTour} disabled={tourRestarted}>
                        {tourRestarted ? <Check size={14} className="mr-2 text-green-500" /> : <PlayCircle size={14} className="mr-2" />}
                        {tourRestarted
                            ? t("accountSettings.tourPending", "Tour queued...")
                            : t("accountSettings.tourRestart", "Restart Tour")}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AccountSettings() {
    usePageTitle("Account Settings");
    const { t } = useLocale();

    return (
        <div className="djac-page">
            <div>
                <h1 className="text-2xl font-bold">{t("accountSettings.title", "Account Settings")}</h1>
                <p className="text-muted-foreground text-sm mt-1">{t("accountSettings.subtitle", "Manage your profile, password, and security preferences.")}</p>
            </div>

            <Tabs defaultValue="profile">
                <TabsList className="mb-4">
                    <TabsTrigger value="profile">{t("accountSettings.tabProfile", "Profile")}</TabsTrigger>
                    <TabsTrigger value="password">{t("accountSettings.tabPassword", "Password")}</TabsTrigger>
                    <TabsTrigger value="security">{t("accountSettings.tabSecurity", "Security")}</TabsTrigger>
                    <TabsTrigger value="preferences">{t("accountSettings.tabPreferences", "Preferences")}</TabsTrigger>
                </TabsList>
                <TabsContent value="profile"><ProfileTab /></TabsContent>
                <TabsContent value="password"><PasswordTab /></TabsContent>
                <TabsContent value="security"><SecurityTab /></TabsContent>
                <TabsContent value="preferences"><PreferencesTab /></TabsContent>
            </Tabs>
        </div>
    );
}
