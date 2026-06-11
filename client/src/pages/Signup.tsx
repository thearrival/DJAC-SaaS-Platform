/**
 * DJAC Signup / Login page - standalone (no DashboardLayout).
 * Routes: /signup  /login
 * Supports: 3 languages (EN / AR / ZH) + dark & light themes.
 */
import { useEffect, useState } from "react";
import type React from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast as sonnerToast } from "sonner";
import { APP_TITLE, APP_LOGO, getLoginUrl, isExternalOAuth } from "@/const";
import {
    Shield, ShieldCheck, Globe2, Zap, BookOpen, BarChart2, ArrowRight,
    LogIn, Mail, User, Building2, CheckCircle2, ChevronLeft, ChevronRight,
    Lock, Eye, EyeOff, Briefcase, UserPlus, Scale, Landmark, Package,
    Hash, AlertCircle, Smartphone, Chrome,
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeHengFooter } from "@/components/DeHengFooter";
import { sounds } from "@/lib/sounds";
import { setTourPending } from "@/components/TourGuide";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Error helpers ─────────────────────────────────────────────────────────────
// tRPC surfaces Zod validation failures as a JSON array in err.message.
// This function extracts the human-readable messages and joins them.
function parseTrpcError(err: { message: string }): string {
    try {
        const parsed = JSON.parse(err.message) as Array<{ message?: unknown }>;
        if (Array.isArray(parsed)) {
            const msgs = parsed
                .map(e => (typeof e.message === "string" ? e.message : ""))
                .filter(Boolean);
            if (msgs.length > 0) return msgs.join(" \u00b7 ");
        }
    } catch {
        // not JSON — fall through
    }
    return err.message;
}

// Theme-aware design tokens
function useC() {
    const { theme } = useTheme();
    const d = theme === "dark";
    return {
        bg: d ? "#040F61" : "#F0F4FF",
        bgDeep: d ? "#020B45" : "#FFFFFF",
        border: d ? "rgba(255,255,255,0.09)" : "rgba(4,15,97,0.11)",
        text: d ? "#FFFFFF" : "#020B45",
        muted: d ? "#9CA3AF" : "rgba(2,11,69,0.55)",
        cyan: d ? "#00F7FF" : "#0284c7",
        green: d ? "#01FF7F" : "#16a34a",
        purple: d ? "#9359EC" : "#7c3aed",
        orange: d ? "#FF6B2B" : "#ea580c",
        yellow: d ? "#FFD600" : "#d97706",
        red: d ? "#FF1744" : "#dc2626",
        inputBg: d ? "rgba(255,255,255,0.06)" : "rgba(4,15,97,0.05)",
        cardPanel: d ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.82)",
        tabBar: d ? "rgba(255,255,255,0.05)" : "rgba(4,15,97,0.05)",
        tabActive: d ? "rgba(255,255,255,0.10)" : "rgba(4,15,97,0.08)",
        gridColor: d ? "rgba(255,255,255,0.04)" : "rgba(4,15,97,0.05)",
        tagBg: d ? "rgba(255,255,255,0.05)" : "rgba(4,15,97,0.06)",
        radial: d
            ? "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(147,89,236,0.25) 0%,transparent 60%)"
            : "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(2,132,199,0.12) 0%,transparent 60%)",
        focusRing: d ? "rgba(0,247,255,0.30)" : "rgba(2,132,199,0.25)",
    } as const;
}
type DesignTokens = ReturnType<typeof useC>;

// Input style helpers — dir param enables RTL icon flipping
const mkBase = (C: DesignTokens): React.CSSProperties => ({
    width: "100%", background: C.inputBg, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "11px 14px", color: C.text, fontSize: 13,
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
});
const mkWithIcon = (C: DesignTokens, dir?: string): React.CSSProperties => ({
    ...mkBase(C),
    paddingLeft: dir === "rtl" ? 14 : 36,
    paddingRight: dir === "rtl" ? 36 : 14,
});
const mkIcon = (C: DesignTokens, color?: string, dir?: string): React.CSSProperties => ({
    position: "absolute",
    left: dir === "rtl" ? "auto" : 12,
    right: dir === "rtl" ? 12 : "auto",
    top: "50%", transform: "translateY(-50%)",
    color: color ?? C.muted, pointerEvents: "none",
});

function InlineChoiceSelect({
    value,
    onChange,
    placeholder,
    options,
    ariaLabel,
    C,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    options: string[];
    ariaLabel: string;
    C: DesignTokens;
}) {
    return (
        <Select value={value || "__empty__"} onValueChange={next => onChange(next === "__empty__" ? "" : next)}>
            <SelectTrigger aria-label={ariaLabel} style={{ ...mkBase(C), fontSize: 12.5 }}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="__empty__">{placeholder}</SelectItem>
                {options.map(option => (
                    <SelectItem key={option} value={option}>
                        {option}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// Password strength — label is a translation key suffix (Weak / Fair / Strong)
function pwStrength(pw: string, C: DesignTokens) {
    if (!pw) return { score: 0, label: "", color: C.border };
    let s = 0;
    if (pw.length >= 8) s++;
    if (pw.length >= 12) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (s <= 2) return { score: s, label: "Weak", color: C.red };
    if (s <= 3) return { score: s, label: "Fair", color: C.yellow };
    return { score: s, label: "Strong", color: C.green };
}

// Returns human-readable list of unmet password requirements.
function pwRequirements(pw: string): string[] {
    const issues: string[] = [];
    if (pw.length < 8) issues.push("At least 8 characters");
    if (!/[A-Z]/.test(pw)) issues.push("At least one uppercase letter (A–Z)");
    if (!/[0-9]/.test(pw)) issues.push("At least one number (0–9)");
    return issues;
}

// PasswordField
function PasswordField({ value, onChange, placeholder, showStrength, label, autoComplete }: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    showStrength?: boolean;
    label?: string;
    autoComplete?: string;
}) {
    const C = useC();
    const { t, direction } = useLocale();
    const dir = direction;
    const [show, setShow] = useState(false);
    const str = showStrength ? pwStrength(value, C) : null;
    const strLabel = str?.label ? t(`signup.strength${str.label}`, str.label) : "";
    return (
        <div>
            <div style={{ position: "relative" }}>
                <Lock size={13} style={mkIcon(C, undefined, dir)} />
                <input
                    required
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder ?? t("signup.password", "Password")}
                    aria-label={label ?? t("signup.password", "Password")}
                    style={{ ...mkWithIcon(C, dir), ...(dir === "rtl" ? { paddingLeft: 40 } : { paddingRight: 40 }) }}
                    autoComplete={autoComplete ?? "current-password"}
                />
                <button
                    type="button"
                    onClick={() => setShow(s => !s)}
                    style={{ position: "absolute", [dir === "rtl" ? "left" : "right"]: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 2, transition: "color 0.15s" }}
                    aria-label={show ? t("signup.hidePassword", "Hide password") : t("signup.showPassword", "Show password")}>
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
            {showStrength && value.length > 0 && (
                <div style={{ marginTop: 6 }}>
                    <div style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: str && str.score >= i * 1.5 ? str.color : C.border, transition: "background 0.2s" }} />
                        ))}
                    </div>
                    {str && <span style={{ fontSize: 10, color: str.color, marginTop: 3, display: "block" }}>{strLabel}</span>}
                    {pwRequirements(value).length > 0 && (
                        <ul style={{ margin: "4px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
                            {pwRequirements(value).map(req => (
                                <li key={req} style={{ fontSize: 11, color: C.red, display: "flex", alignItems: "center", gap: 4 }}>
                                    <span>&#9888;</span> {req}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

type TabId = "signin" | "register";
type RoleId = "compliance_officer" | "lawyer" | "company" | "government" | "consultant" | "vendor" | "visitor";
type RegStep = "choose_role" | RoleId;
type DatabaseReadiness = {
    ready: boolean;
    details: string;
};

// ─── Role definitions ────────────────────────────────────────────────────────────
type RoleDef = {
    id: RoleId;
    icon: React.ReactNode;
    accentKey: "cyan" | "green" | "purple" | "orange" | "yellow" | "red" | "muted";
    titleFallback: string;
    descFallback: string;
    badgeFallback: string;
    userType: "visitor" | "professional";
};

const ROLE_DEFS: RoleDef[] = [
    {
        id: "compliance_officer", icon: <Shield size={20} />, accentKey: "cyan",
        titleFallback: "Compliance Officer / DPO",
        descFallback: "Manage obligations, track regulatory gaps, and generate audit-ready compliance reports.",
        badgeFallback: "Compliance & Privacy", userType: "professional",
    },
    {
        id: "lawyer", icon: <Scale size={20} />, accentKey: "purple",
        titleFallback: "Lawyer / Legal Advisor",
        descFallback: "Research cross-border regulations, advise clients, and track legislative changes in real time.",
        badgeFallback: "Legal Profession", userType: "professional",
    },
    {
        id: "company", icon: <Building2 size={20} />, accentKey: "green",
        titleFallback: "Enterprise / Company",
        descFallback: "Register your organization, manage multi-team access, and centralize compliance obligations.",
        badgeFallback: "Corporate Entity", userType: "professional",
    },
    {
        id: "government", icon: <Landmark size={20} />, accentKey: "yellow",
        titleFallback: "Government / Regulator",
        descFallback: "Access regulatory frameworks, monitor cross-border market participants, and enforce obligations.",
        badgeFallback: "Public Authority", userType: "professional",
    },
    {
        id: "consultant", icon: <Briefcase size={20} />, accentKey: "orange",
        titleFallback: "Consultant / Advisor",
        descFallback: "Serve multiple clients from a single compliance workspace with multi-tenant case management.",
        badgeFallback: "Consulting Services", userType: "professional",
    },
    {
        id: "vendor", icon: <Package size={20} />, accentKey: "red",
        titleFallback: "Vendor / Supplier",
        descFallback: "Validate your compliance posture, share assessments with partners, and manage certifications.",
        badgeFallback: "Supply Chain", userType: "professional",
    },
    {
        id: "visitor", icon: <User size={20} />, accentKey: "muted",
        titleFallback: "Visitor / Researcher",
        descFallback: "Explore public compliance frameworks, regulatory databases, and reference documentation.",
        badgeFallback: "Public Access", userType: "visitor",
    },
];

// ─── Security notice ──────────────────────────────────────────────────────────────
function SecurityNotice({ C }: { C: DesignTokens }) {
    const { t } = useLocale();
    return (
        <div style={{
            background: `${C.cyan}0C`, border: `1px solid ${C.cyan}28`,
            borderRadius: 9, padding: "9px 13px",
            display: "flex", alignItems: "flex-start", gap: 9, marginBottom: 18,
        }}>
            <ShieldCheck size={13} style={{ color: C.cyan, flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 10.5, color: C.muted, lineHeight: 1.55 }}>
                <strong style={{ color: C.cyan, fontWeight: 700 }}>
                    {t("signup.securityNotice.header", "Secure Connection")}
                </strong>{" · "}
                {t("signup.securityNotice.body", "TLS 1.3 encrypted. Data processed under Saudi Arabia PDPL, China PIPL, and applicable cross-border transfer frameworks. No data shared with third parties without authorization.")}
            </p>
        </div>
    );
}

// ─── Data residency consent ───────────────────────────────────────────────────────
function DataResidencyConsent({ C, checked, onChange }: { C: DesignTokens; checked: boolean; onChange: (v: boolean) => void }) {
    const { t } = useLocale();
    return (
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0, accentColor: C.cyan }} />
            <span style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.55 }}>
                {t("signup.dataConsent", "I acknowledge that data may be processed and stored within Saudi Arabia and/or China data center regions in accordance with applicable laws (PDPL · PIPL · NCA ECC). I consent to cross-border data transfer for compliance service delivery.")}
            </span>
        </label>
    );
}

// ─── Terms & policy consent ───────────────────────────────────────────────────────
function TermsConsent({ C, checked, onChange }: { C: DesignTokens; checked: boolean; onChange: (v: boolean) => void }) {
    const { t } = useLocale();
    return (
        <label style={{ display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }}>
            <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
                style={{ marginTop: 3, flexShrink: 0, accentColor: C.cyan }} />
            <span style={{ fontSize: 10.5, color: C.muted, lineHeight: 1.55 }}>
                {t("signup.termsConsent.prefix", "I agree to the")}{" "}
                <Link href="/terms"><span style={{ color: C.cyan, textDecoration: "underline" }}>{t("signup.termsConsent.terms", "Terms of Service")}</span></Link>
                {" "}{t("signup.termsConsent.and", "and")}{" "}
                <Link href="/privacy"><span style={{ color: C.cyan, textDecoration: "underline" }}>{t("signup.termsConsent.privacy", "Privacy Policy")}</span></Link>
                {". "}{t("signup.termsConsent.legal", "This constitutes a binding legal agreement under applicable national laws.")}
            </span>
        </label>
    );
}

// ─── Role chooser step ────────────────────────────────────────────────────────────
function RoleChooser({ onSelect, onSignIn }: { onSelect: (role: RoleId) => void; onSignIn: () => void }) {
    const C = useC();
    const { t } = useLocale();
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <SecurityNotice C={C} />
            <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 5px", color: C.text }}>
                    {t("signup.chooseRole.title", "Select Your Access Profile")}
                </h2>
                <p style={{ color: C.muted, fontSize: 12.5, margin: 0 }}>
                    {t("signup.chooseRole.sub", "Your role determines workspace features, compliance templates, and data access permissions.")}
                </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                {ROLE_DEFS.map(role => {
                    const accent = (C[role.accentKey] ?? C.muted) as string;
                    return (
                        <button key={role.id} type="button" onClick={() => onSelect(role.id)}
                            className="djac-role-card"
                            style={{
                                background: `${accent}0C`, border: `1px solid ${accent}35`,
                                borderRadius: 12, padding: "14px", textAlign: "left" as const,
                                cursor: "pointer", transition: "all 0.15s",
                                display: "flex", flexDirection: "column", gap: 6,
                            }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: `${accent}18`, border: `1px solid ${accent}35`,
                                    display: "flex", alignItems: "center", justifyContent: "center", color: accent,
                                }}>
                                    {role.icon}
                                </div>
                                <ChevronRight size={13} style={{ color: accent, opacity: 0.7 }} />
                            </div>
                            <p style={{ fontWeight: 700, fontSize: 12, color: C.text, margin: 0 }}>
                                {t(`signup.role.${role.id}.title`, role.titleFallback)}
                            </p>
                            <p style={{ color: C.muted, fontSize: 10.5, margin: 0, lineHeight: 1.5 }}>
                                {t(`signup.role.${role.id}.desc`, role.descFallback)}
                            </p>
                        </button>
                    );
                })}
            </div>
            <p style={{ color: C.muted, fontSize: 11.5, textAlign: "center", margin: 0 }}>
                {t("signup.haveAccount", "Already have an account?")}{" "}
                <button type="button" onClick={onSignIn}
                    style={{ background: "none", border: "none", color: C.cyan, fontWeight: 600, fontSize: 11.5, cursor: "pointer", textDecoration: "underline" }}>
                    {t("signup.signIn", "Sign in")}
                </button>
            </p>
        </div>
    );
}

// Sign In form
function SignInForm({ onRegister, database }: { onRegister: () => void; database: DatabaseReadiness }) {
    const C = useC();
    const { t, direction } = useLocale();
    const dir = direction;
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [pendingToken, setPendingToken] = useState<string | null>(null);
    const [totpCode, setTotpCode] = useState("");
    const [, navigate] = useLocation();

    // Honour ?r= return URL set by InviteAccept or other protected pages
    const returnTo = new URLSearchParams(window.location.search).get("r") ?? "/dashboard";
    // Safety: only allow same-origin relative paths
    const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/dashboard";

    const loginMut = trpc.localAuth.login.useMutation({
        onSuccess: (data) => {
            if ("requireTotp" in data && data.requireTotp) {
                setPendingToken(data.pendingToken);
                setError("");
            } else {
                navigate(safeReturnTo);
            }
        },
        onError: (err) => setError(parseTrpcError(err)),
    });

    const verifyTotpMut = trpc.localAuth.verifyTotp.useMutation({
        onSuccess: () => navigate(safeReturnTo),
        onError: (err) => setError(err.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!database.ready) {
            setError(database.details || t("signup.databaseUnavailable", "Database unavailable. Please try again shortly."));
            return;
        }
        loginMut.mutate({ email, password });
    };

    const handleTotpSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!pendingToken) return;
        verifyTotpMut.mutate({ pendingToken, code: totpCode });
    };

    // TOTP challenge screen
    if (pendingToken) {
        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: C.text }}>{t("signup.totpTitle", "Two-Factor Authentication")}</h2>
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{t("signup.totpSub", "Enter the 6-digit code from your authenticator app, or a backup code.")}</p>
                </div>
                <form onSubmit={handleTotpSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ position: "relative" }}>
                        <Lock size={13} style={mkIcon(C, undefined, dir)} />
                        <input
                            required
                            type="text"
                            inputMode="numeric"
                            value={totpCode}
                            onChange={e => setTotpCode(e.target.value.replace(/\s/g, "").slice(0, 10))}
                            placeholder={t("signup.totpCodePlaceholder", "000000")}
                            style={mkWithIcon(C, dir)}
                            autoComplete="one-time-code"
                            autoFocus
                        />
                    </div>
                    {error && <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>{error}</p>}
                    <button type="submit" disabled={verifyTotpMut.isPending || totpCode.length < 6} className="djac-btn-primary" style={{
                        background: verifyTotpMut.isPending ? `${C.cyan}60` : `linear-gradient(135deg,${C.cyan},${C.purple})`,
                        border: "none", borderRadius: 10, padding: "13px 20px", color: "#fff",
                        fontWeight: 800, fontSize: 14, cursor: verifyTotpMut.isPending ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "all 0.18s", width: "100%",
                    }}>
                        <Shield size={15} /> {verifyTotpMut.isPending ? t("signup.verifying", "Verifying...") : t("signup.verifyCode", "Verify Code")}
                    </button>
                    <button type="button" onClick={() => { setPendingToken(null); setTotpCode(""); setError(""); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                        {t("signup.backToLogin", "← Back to sign in")}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <SecurityNotice C={C} />
            <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 6px", color: C.text }}>{t("signup.welcomeBack", "Welcome back")}</h2>
                <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{t("signup.signInSub", "Sign in to your DJAC compliance workspace.")}</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ color: C.muted, fontSize: 11, margin: "-2px 0 2px" }}>
                    {t("signup.requiredHint", "Fields marked as required must be completed.")}
                </p>
                <div style={{ position: "relative" }}>
                    <Mail size={13} style={mkIcon(C, undefined, dir)} />
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder={t("signup.emailAddress", "Email address")} style={mkWithIcon(C, dir)} autoComplete="email"
                        aria-label={t("signup.emailAddress", "Email address")} />
                </div>
                <PasswordField
                    value={password}
                    onChange={setPassword}
                    placeholder={t("signup.password", "Password")}
                    label={t("signup.password", "Password")}
                    autoComplete="current-password"
                />
                <div style={{ textAlign: dir === "rtl" ? "start" : "end", marginTop: -6 }}>
                    <Link href="/forgot-password" style={{ color: C.muted, fontSize: 12, textDecoration: "none" }}>
                        {t("signup.forgotPassword", "Forgot password?")}
                    </Link>
                </div>
                {error && <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>{error}</p>}
                <button type="submit" disabled={loginMut.isPending || !database.ready} className="djac-btn-primary" style={{
                    background: loginMut.isPending ? `${C.cyan}60` : `linear-gradient(135deg,${C.cyan},${C.purple})`,
                    border: "none", borderRadius: 10, padding: "13px 20px", color: "#fff",
                    fontWeight: 800, fontSize: 14, cursor: loginMut.isPending ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.18s", width: "100%",
                }}>
                    <LogIn size={15} /> {loginMut.isPending ? t("signup.signingIn", "Signing in...") : t("signup.signIn", "Sign In")}
                </button>
                <p role="status" aria-live="polite" style={{ color: C.muted, fontSize: 11, margin: 0 }}>
                    {loginMut.isPending ? t("signup.authBusy", "Authentication in progress...") : ""}
                </p>
                {!database.ready ? (
                    <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>
                        {database.details || t("signup.databaseUnavailable", "Database unavailable. Please try again shortly.")}
                    </p>
                ) : null}
            </form>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ color: C.muted, fontSize: 11 }}>{t("signup.or", "OR")}</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
            </div>
            {/* Google Sign-In */}
            <GoogleSignInButton C={C} t={t} />
            {isExternalOAuth() && (
                <a href={getLoginUrl()} style={{ textDecoration: "none" }}>
                    <button className="djac-btn-secondary" style={{ width: "100%", background: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", color: C.text, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.18s" }}>
                        <Shield size={15} style={{ color: C.cyan }} />
                        {t("signup.sso", "Continue with Organization SSO")}
                        <ArrowRight size={14} style={{ color: C.muted }} />
                    </button>
                </a>
            )}
            <p style={{ color: C.muted, fontSize: 12, textAlign: "center", margin: 0 }}>
                {t("signup.noAccount", "No account?")}{" "}
                <button type="button" onClick={onRegister}
                    style={{ background: "none", border: "none", color: C.cyan, fontWeight: 600, fontSize: 12, cursor: "pointer", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {t("signup.createAccount", "Create your account")} <ChevronRight size={12} />
                </button>
            </p>
        </div>
    );
}

// ─── Role-based registration form ───────────────────────────────────────────────
function RoleRegisterForm({ role, onBack, onSwitchToSignIn, database }: {
    role: RoleId;
    onBack: () => void;
    onSwitchToSignIn: () => void;
    database: DatabaseReadiness;
}) {
    const C = useC();
    const { t, direction } = useLocale();
    const dir = direction;
    const [, navigate] = useLocation();

    const roleDef = ROLE_DEFS.find(r => r.id === role)!;
    const accent = (C[roleDef.accentKey] ?? C.muted) as string;

    // ── Common fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [dataConsent, setDataConsent] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    // ── Role-specific fields
    const [orgName, setOrgName] = useState("");
    const [jobTitle, setJobTitle] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [licenseAuthority, setLicenseAuthority] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [crNumber, setCrNumber] = useState("");
    const [countryHQ, setCountryHQ] = useState("");
    const [industrySector, setIndustrySector] = useState("");
    const [empRange, setEmpRange] = useState("");
    const [designation, setDesignation] = useState("");
    const [vendorCategory, setVendorCategory] = useState("");
    const [primaryMarket, setPrimaryMarket] = useState("");
    const [certifications, setCertifications] = useState<string[]>([]);

    const returnTo = new URLSearchParams(window.location.search).get("r") ?? "/dashboard";
    const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/dashboard";

    const regMut = trpc.localAuth.register.useMutation({
        onSuccess: (data) => {
            if ("pendingVerification" in data && data.pendingVerification) {
                sounds.success();
                setPendingVerification(true);
            } else if ("user" in data && data.user) {
                sounds.success();
                setTourPending();
                sonnerToast.success(t("signup.accountCreated", "Account created! Welcome to DJAC."));
                navigate(safeReturnTo);
            }
        },
        onError: (err) => setError(parseTrpcError(err)),
    });

    const verifyOtpMut = trpc.localAuth.verifyOtp.useMutation({
        onSuccess: () => {
            sounds.success();
            setTourPending();
            navigate(safeReturnTo);
        },
        onError: (err) => setError(err.message),
    });

    const toggleTag = (arr: string[], setArr: (v: string[]) => void, val: string) =>
        setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

    const TagButton = ({ label, active, tagAccent, onToggle }: { label: string; active: boolean; tagAccent: string; onToggle: () => void }) => (
        <button type="button" onClick={onToggle} style={{
            background: active ? `${tagAccent}22` : C.inputBg,
            border: `1px solid ${active ? tagAccent + "60" : C.border}`,
            borderRadius: 7, color: active ? tagAccent : C.muted,
            fontSize: 11, fontWeight: active ? 700 : 500,
            padding: "4px 10px", cursor: "pointer", transition: "all 0.13s",
        }}>{label}</button>
    );

    const JURISDICTIONS = ["Saudi Arabia", "China", "UAE", "EU / GDPR", "Global"];
    const PRACTICE_AREAS = ["Privacy Law", "Data Protection", "Cybersecurity", "Corporate", "Cross-Border", "IP Law", "Regulatory Compliance"];
    const INDUSTRIES = ["Financial Services", "Healthcare", "Technology", "Manufacturing", "Retail", "Government", "Professional Services", "Energy", "Other"];
    const EMP_RANGES = ["1–50", "51–250", "251–1,000", "1,001–10,000", "10,000+"];
    const VENDOR_CATS = ["Technology / Software", "Professional Services", "Manufacturing", "Supply Chain / Logistics", "Data Processing", "Cloud Services", "Other"];
    const CERT_OPTIONS = ["ISO 27001", "SOC 2 Type II", "PCI DSS", "CSA STAR", "SAMA Compliant", "NCA ECC Compliant"];
    const MARKETS = ["Saudi Arabia", "China", "MENA", "APAC", "Europe", "Global"];

    const sectionLabel: React.CSSProperties = {
        fontSize: 10, fontWeight: 700, color: C.muted,
        textTransform: "uppercase", letterSpacing: "0.07em", margin: "4px 0 7px",
    };

    const ROLE_DEFAULT_TITLES: Partial<Record<RoleId, string>> = {
        lawyer: "Legal Advisor",
        company: "Company Representative",
        consultant: "Consultant",
        vendor: "Vendor Representative",
    };
    const effectiveTitle = (jobTitle || designation || ROLE_DEFAULT_TITLES[role] || "").trim();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (!database.ready) {
            setError(database.details || t("signup.databaseUnavailable", "Database unavailable. Please try again shortly."));
            return;
        }
        if (!termsAccepted) {
            setError(t("signup.mustAcceptTerms", "You must accept the Terms of Service to continue."));
            return;
        }
        if (role !== "visitor" && !dataConsent) {
            setError(t("signup.mustAcceptDataConsent", "Data processing consent is required for professional accounts."));
            return;
        }
        const reqs = pwRequirements(password);
        if (reqs.length > 0) { setError(reqs.join(" · ")); return; }

        // Client-side jobTitle guard — only applies to roles that expose the field.
        // For role-default titles the check is always satisfied; for roles with an
        // explicit field (compliance_officer / lawyer / government) the user must
        // have typed at least 2 characters.
        if (roleDef.userType === "professional" && effectiveTitle.length < 2) {
            setError(t("signup.errorJobTitleMin", "Job title must be at least 2 characters."));
            return;
        }

        const extras = JSON.stringify({ role, orgName, jobTitle, licenseNumber, licenseAuthority, selectedTags, crNumber, countryHQ, industrySector, empRange, designation, vendorCategory, certifications, primaryMarket });
        const base = { name, email, password, phoneNumber: phoneNumber || undefined } as const;
        if (roleDef.userType === "visitor") {
            regMut.mutate({ userType: "visitor", ...base });
        } else {
            regMut.mutate({
                userType: "professional",
                ...base,
                companyName: orgName,
                jobTitle: effectiveTitle,
                industry: industrySector || vendorCategory || undefined,
                complianceResponsibility: extras,
            });
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header with back button */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => { setPendingVerification(false); setOtpCode(""); onBack(); }} style={{
                    background: "none", border: `1px solid ${C.border}`, borderRadius: 8,
                    color: C.muted, cursor: "pointer", padding: "4px 10px",
                    display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                }}>
                    <ChevronLeft size={13} /> {pendingVerification ? t("signup.backToForm", "Edit details") : t("signup.back", "Back")}
                </button>
                {!pendingVerification && (
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: `${accent}14`, border: `1px solid ${accent}35`,
                    borderRadius: 99, padding: "3px 10px", fontSize: 9.5, fontWeight: 700, color: accent,
                }}>
                    {roleDef.icon}
                    <span>{t(`signup.role.${role}.badge`, roleDef.badgeFallback)}</span>
                </div>
                )}
            </div>

            {/* OTP verification screen — shown after successful registration */}
            {pendingVerification ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <SecurityNotice C={C} />
                    <div style={{
                        background: `${C.green}10`, border: `1px solid ${C.green}35`,
                        borderRadius: 10, padding: "12px 14px",
                        display: "flex", alignItems: "flex-start", gap: 9,
                    }}>
                        <CheckCircle2 size={16} style={{ color: C.green, flexShrink: 0, marginTop: 1 }} />
                        <div>
                            <p style={{ fontWeight: 700, fontSize: 12.5, color: C.green, margin: "0 0 3px" }}>
                                {t("signup.otpSentTitle", "Verification code sent!")}
                            </p>
                            <p style={{ color: C.muted, fontSize: 11.5, margin: 0, lineHeight: 1.5 }}>
                                {t("signup.otpSentBody", "A 6-digit code has been sent to {email}. Enter it below to activate your account.").replace("{email}", email)}
                            </p>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>
                            {t("signup.otpCodeLabel", "Verification Code")}
                        </label>
                        <div style={{ position: "relative" }}>
                            <Lock size={13} style={mkIcon(C, undefined, dir)} />
                            <input
                                required type="text" inputMode="numeric" maxLength={6}
                                value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="000000" style={mkWithIcon(C, dir)}
                                autoComplete="one-time-code" autoFocus
                                aria-label={t("signup.otpCodeAria", "6-digit verification code")}
                            />
                        </div>
                    </div>
                    {error && <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>{error}</p>}
                    <button
                        type="button"
                        onClick={() => { setError(""); verifyOtpMut.mutate({ identifier: email, code: otpCode, purpose: "register", name }); }}
                        disabled={verifyOtpMut.isPending || otpCode.length !== 6}
                        className="djac-btn-primary"
                        style={{
                            background: `linear-gradient(135deg,${C.green},${accent})`,
                            border: "none", borderRadius: 10, padding: "13px 20px", color: "#fff",
                            fontWeight: 800, fontSize: 14, cursor: verifyOtpMut.isPending ? "not-allowed" : "pointer",
                            opacity: otpCode.length === 6 ? 1 : 0.6,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "all 0.18s", width: "100%",
                        }}>
                        <Shield size={15} />
                        {verifyOtpMut.isPending ? t("signup.verifying", "Verifying...") : t("signup.activateAccount", "Activate Account")}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setError(""); handleSubmit({ preventDefault: () => {} } as React.FormEvent); }}
                        disabled={regMut.isPending}
                        style={{
                            background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer",
                            textDecoration: "underline", padding: "8px",
                        }}>
                        {t("signup.resendCode", "Didn't receive the code? Send again")}
                    </button>
                </div>
            ) : (
                <>
            <SecurityNotice C={C} />
            <div>
                <h2 style={{ fontSize: 19, fontWeight: 800, margin: "0 0 4px", color: C.text }}>
                    {t(`signup.role.${role}.title`, roleDef.titleFallback)}
                </h2>
                <p style={{ color: C.muted, fontSize: 12, margin: 0 }}>
                    {t(`signup.role.${role}.desc`, roleDef.descFallback)}
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {/* Common: name + email + phone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ position: "relative" }}>
                        <User size={12} style={mkIcon(C, undefined, dir)} />
                        <input required minLength={2} value={name} onChange={e => setName(e.target.value)}
                            placeholder={t("signup.fullName", "Full name")}
                            style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }} autoComplete="name" />
                    </div>
                    <div style={{ position: "relative" }}>
                        <Mail size={12} style={mkIcon(C, undefined, dir)} />
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder={t("signup.workEmail", "Work email")}
                            style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }} autoComplete="email" />
                    </div>
                </div>
                <div style={{ position: "relative" }}>
                    <Smartphone size={12} style={mkIcon(C, undefined, dir)} />
                    <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                        placeholder={t("signup.phoneNumber", "Phone with country code (optional)")}
                        style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }} autoComplete="tel" />
                </div>

                {/* Compliance Officer */}
                {role === "compliance_officer" && (<>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ position: "relative" }}>
                            <Building2 size={12} style={mkIcon(C, undefined, dir)} />
                            <input required minLength={2} value={orgName} onChange={e => setOrgName(e.target.value)}
                                placeholder={t("signup.orgName", "Organization name")}
                                style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                                aria-label={t("signup.orgName", "Organization")} />
                        </div>
                        <div style={{ position: "relative" }}>
                            <Briefcase size={12} style={mkIcon(C, undefined, dir)} />
                            <input required minLength={2} value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                                placeholder={t("signup.jobTitle", "Job title")}
                                style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                                aria-label={t("signup.jobTitle", "Job title")} />
                        </div>
                    </div>
                    <div>
                        <p style={sectionLabel}>{t("signup.jurisdictions", "Primary Jurisdictions")}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {JURISDICTIONS.map(j => (
                                <TagButton key={j} label={j} tagAccent={accent} active={selectedTags.includes(j)} onToggle={() => toggleTag(selectedTags, setSelectedTags, j)} />
                            ))}
                        </div>
                    </div>
                    <InlineChoiceSelect
                        value={industrySector}
                        onChange={setIndustrySector}
                        placeholder={t("signup.industryOptional", "Industry sector (optional)")}
                        options={INDUSTRIES}
                        ariaLabel={t("signup.industry", "Industry")}
                        C={C}
                    />
                </>)}

                {/* Lawyer */}
                {role === "lawyer" && (<>
                    <div style={{ position: "relative" }}>
                        <Building2 size={12} style={mkIcon(C, undefined, dir)} />
                        <input required minLength={2} value={orgName} onChange={e => setOrgName(e.target.value)}
                            placeholder={t("signup.lawFirm", "Law firm / Chambers")}
                            style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                            aria-label={t("signup.lawFirm", "Law firm")} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ position: "relative" }}>
                            <Hash size={12} style={mkIcon(C, undefined, dir)} />
                            <input required value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                                placeholder={t("signup.licenseNumber", "Bar license / reg. no.")}
                                style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                                aria-label={t("signup.licenseNumber", "License no.")} />
                        </div>
                        <div style={{ position: "relative" }}>
                            <Globe2 size={12} style={mkIcon(C, undefined, dir)} />
                            <input required value={licenseAuthority} onChange={e => setLicenseAuthority(e.target.value)}
                                placeholder={t("signup.licenseAuthority", "Issuing authority / jurisdiction")}
                                style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                                aria-label={t("signup.licenseAuthority", "Issuing authority")} />
                        </div>
                    </div>
                    <div>
                        <p style={sectionLabel}>{t("signup.practiceAreas", "Areas of Practice")}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {PRACTICE_AREAS.map(a => (
                                <TagButton key={a} label={a} tagAccent={accent} active={selectedTags.includes(a)} onToggle={() => toggleTag(selectedTags, setSelectedTags, a)} />
                            ))}
                        </div>
                    </div>
                </>)}

                {/* Company */}
                {role === "company" && (<>
                    <div style={{ position: "relative" }}>
                        <Building2 size={12} style={mkIcon(C, undefined, dir)} />
                        <input required minLength={2} value={orgName} onChange={e => setOrgName(e.target.value)}
                            placeholder={t("signup.companyLegalName", "Company legal name")}
                            style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                            aria-label={t("signup.companyLegalName", "Company legal name")} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ position: "relative" }}>
                            <Hash size={12} style={mkIcon(C, undefined, dir)} />
                            <input value={crNumber} onChange={e => setCrNumber(e.target.value)}
                                placeholder={t("signup.crNumber", "Commercial reg. no. (CR)")}
                                style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                                aria-label={t("signup.crNumber", "CR number")} />
                        </div>
                        <div style={{ position: "relative" }}>
                            <Globe2 size={12} style={mkIcon(C, undefined, dir)} />
                            <input required value={countryHQ} onChange={e => setCountryHQ(e.target.value)}
                                placeholder={t("signup.countryHQ", "Country of headquarters")}
                                style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                                aria-label={t("signup.countryHQ", "Country of HQ")} />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <InlineChoiceSelect
                            value={industrySector}
                            onChange={setIndustrySector}
                            placeholder={t("signup.industryRequired", "Industry sector *")}
                            options={INDUSTRIES}
                            ariaLabel={t("signup.industry", "Industry")}
                            C={C}
                        />
                        <InlineChoiceSelect
                            value={empRange}
                            onChange={setEmpRange}
                            placeholder={t("signup.employeesOptional", "Employees (optional)")}
                            options={EMP_RANGES}
                            ariaLabel={t("signup.employeeRange", "Employees")}
                            C={C}
                        />
                    </div>
                </>)}

                {/* Government */}
                {role === "government" && (<>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ position: "relative" }}>
                            <Landmark size={12} style={mkIcon(C, undefined, dir)} />
                            <input required minLength={2} value={orgName} onChange={e => setOrgName(e.target.value)}
                                placeholder={t("signup.ministry", "Ministry / Department")}
                                style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                                aria-label={t("signup.ministry", "Ministry")} />
                        </div>
                        <div style={{ position: "relative" }}>
                            <Globe2 size={12} style={mkIcon(C, undefined, dir)} />
                            <input required value={countryHQ} onChange={e => setCountryHQ(e.target.value)}
                                placeholder={t("signup.country", "Country / Jurisdiction")}
                                style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                                aria-label={t("signup.country", "Country")} />
                        </div>
                    </div>
                    <div style={{ position: "relative" }}>
                        <Briefcase size={12} style={mkIcon(C, undefined, dir)} />
                        <input required minLength={2} value={designation} onChange={e => setDesignation(e.target.value)}
                            placeholder={t("signup.designation", "Official designation / role title")}
                            style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                            aria-label={t("signup.designation", "Designation")} />
                    </div>
                    <div style={{ background: `${C.yellow}10`, border: `1px solid ${C.yellow}30`, borderRadius: 8, padding: "9px 13px", display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <AlertCircle size={13} style={{ color: C.yellow, flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 10.5, color: C.muted, lineHeight: 1.5 }}>
                            {t("signup.govNote", "Government accounts are subject to manual verification. Please use your official government-issued email address. Access will be activated within 1–3 business days.")}
                        </p>
                    </div>
                </>)}

                {/* Consultant */}
                {role === "consultant" && (<>
                    <div style={{ position: "relative" }}>
                        <Building2 size={12} style={mkIcon(C, undefined, dir)} />
                        <input required minLength={2} value={orgName} onChange={e => setOrgName(e.target.value)}
                            placeholder={t("signup.consultingFirm", "Consulting firm name")}
                            style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                            aria-label={t("signup.consultingFirm", "Consulting firm")} />
                    </div>
                    <div>
                        <p style={sectionLabel}>{t("signup.advisoryAreas", "Advisory Areas")}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {PRACTICE_AREAS.map(a => (
                                <TagButton key={a} label={a} tagAccent={accent} active={selectedTags.includes(a)} onToggle={() => toggleTag(selectedTags, setSelectedTags, a)} />
                            ))}
                        </div>
                    </div>
                    <InlineChoiceSelect
                        value={primaryMarket}
                        onChange={setPrimaryMarket}
                        placeholder={t("signup.selectMarket", "Primary market (optional)")}
                        options={MARKETS}
                        ariaLabel={t("signup.primaryMarket", "Primary market")}
                        C={C}
                    />
                </>)}

                {/* Vendor */}
                {role === "vendor" && (<>
                    <div style={{ position: "relative" }}>
                        <Building2 size={12} style={mkIcon(C, undefined, dir)} />
                        <input required minLength={2} value={orgName} onChange={e => setOrgName(e.target.value)}
                            placeholder={t("signup.vendorCompany", "Vendor company name")}
                            style={{ ...mkWithIcon(C, dir), fontSize: 12.5 }}
                            aria-label={t("signup.vendorCompany", "Vendor company")} />
                    </div>
                    <InlineChoiceSelect
                        value={vendorCategory}
                        onChange={setVendorCategory}
                        placeholder={t("signup.vendorCategoryRequired", "Vendor category *")}
                        options={VENDOR_CATS}
                        ariaLabel={t("signup.vendorCategory", "Vendor category")}
                        C={C}
                    />
                    <div>
                        <p style={sectionLabel}>{t("signup.certifications", "Existing Certifications (optional)")}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {CERT_OPTIONS.map(c => (
                                <TagButton key={c} label={c} tagAccent={accent} active={certifications.includes(c)} onToggle={() => toggleTag(certifications, setCertifications, c)} />
                            ))}
                        </div>
                    </div>
                </>)}

                {/* Password */}
                <PasswordField value={password} onChange={setPassword}
                    placeholder={t("signup.createPassword", "Create password")}
                    label={t("signup.createPassword", "Create password")}
                    showStrength autoComplete="new-password" />

                {/* Consent checkboxes */}
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    <TermsConsent C={C} checked={termsAccepted} onChange={setTermsAccepted} />
                    {role !== "visitor" && (
                        <DataResidencyConsent C={C} checked={dataConsent} onChange={setDataConsent} />
                    )}
                </div>

                {error && <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>{error}</p>}
                {!database.ready && (
                    <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>
                        {database.details || t("signup.databaseUnavailable", "Database unavailable. Please try again shortly.")}
                    </p>
                )}

                <button type="submit" disabled={regMut.isPending || !database.ready} className="djac-btn-primary" style={{
                    background: regMut.isPending ? `${accent}60` : `linear-gradient(135deg,${accent},${C.purple})`,
                    border: "none", borderRadius: 10, padding: "13px 20px", color: "#fff",
                    fontWeight: 800, fontSize: 14, cursor: regMut.isPending ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    transition: "all 0.18s", width: "100%",
                }}>
                    <UserPlus size={15} />
                    {regMut.isPending ? t("signup.creating", "Creating account...") : t("signup.createAccountCta", "Create Account")}
                </button>
                <p role="status" aria-live="polite" style={{ color: C.muted, fontSize: 11, margin: 0 }}>
                    {regMut.isPending ? t("signup.authBusy", "Authentication in progress...") : ""}
                </p>
            </form>
            </>
            )}

            <p style={{ color: C.muted, fontSize: 11.5, textAlign: "center", margin: 0 }}>
                {t("signup.haveAccount", "Already have an account?")}{" "}
                <button type="button" onClick={() => { onSwitchToSignIn(); setPendingVerification(false); }}
                    style={{ background: "none", border: "none", color: C.cyan, fontWeight: 600, fontSize: 11.5, cursor: "pointer", textDecoration: "underline" }}>
                    {t("signup.signIn", "Sign in")}
                </button>
            </p>
        </div>
    );
}

// ─── Google Sign-In Button ──────────────────────────────────────────────────
function GoogleSignInButton({ C, t }: { C: DesignTokens; t: (k: string, f: string) => string }) {
    const googleUrl = trpc.googleAuth.getAuthUrl.useQuery(
        { redirectTo: new URLSearchParams(window.location.search).get("r") ?? "/dashboard" },
        { enabled: false }
    );

    return (
        <button
            type="button"
            onClick={() => { void googleUrl.refetch().then(r => { if (r.data?.url) window.location.href = r.data.url; }); }}
            className="djac-btn-secondary"
            style={{
                width: "100%", background: C.inputBg, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "12px 20px", color: C.text, fontWeight: 700, fontSize: 13,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.18s",
            }}>
            <Chrome size={15} style={{ color: "#4285F4" }} />
            {t("signup.googleSignIn", "Continue with Google")}
        </button>
    );
}

// ─── IP Registration Section ────────────────────────────────────────────────────
// Displayed at the bottom of the left marketing panel (desktop) and below
// the stats block on mobile when the left panel is hidden.
function IpRegistrationSection({ C }: { C: DesignTokens }) {
    return (
        <div style={{ marginTop: 28, borderTop: `1px solid ${C.border}`, paddingTop: 22 }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 9 }}>
                <CheckCircle2 size={11} style={{ color: C.cyan, flexShrink: 0 }} />
                <span style={{
                    fontSize: 9.5, fontWeight: 700, color: C.muted,
                    textTransform: "uppercase" as const, letterSpacing: "0.06em",
                }}>
                    Official Registration &amp; Intellectual Property Protection
                </span>
            </div>
            <p style={{ color: C.muted, fontSize: 10.5, lineHeight: 1.6, margin: "0 0 14px" }}>
                This platform is officially registered and protected under international intellectual
                property authorities, ensuring authenticity, trust, and legal ownership.
            </p>
            {/* Authority logo cards — equal-height grid, logos aligned on same baseline */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
                {[
                    {
                        src: "/cnipa-logo.png",
                        alt: "China National Intellectual Property Administration",
                        fallbackChar: "国",
                        fallbackBg: "linear-gradient(135deg,#C8102E,#8B0000)",
                        fallbackColor: "#C8102E",
                        fallbackLabel: "CNIPA",
                        fallbackFontSize: 13,
                        name: "China National Intellectual",
                        name2: "Property Administration",
                    },
                    {
                        src: "/usco-logo.png",
                        alt: "United States Copyright Office",
                        fallbackChar: "©",
                        fallbackBg: "linear-gradient(135deg,#336E8D,#1a4a5e)",
                        fallbackColor: "#336E8D",
                        fallbackLabel: "U.S. COPYRIGHT",
                        fallbackFontSize: 16,
                        name: "United States",
                        name2: "Copyright Office",
                    },
                ].map(card => (
                    <div key={card.src} style={{
                        background: C.cardPanel, border: `1px solid ${C.border}`,
                        borderRadius: 10, padding: "12px 10px 10px",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        minHeight: 110,
                    }}>
                        {/* Fixed-size logo container — both cards are identical height */}
                        <div style={{
                            width: 100, height: 48,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 8, flexShrink: 0,
                        }}>
                            <img
                                src={card.src}
                                alt={card.alt}
                                style={{
                                    maxHeight: 44, maxWidth: 96,
                                    width: "auto", height: "auto",
                                    objectFit: "contain", display: "block",
                                }}
                                onError={e => {
                                    e.currentTarget.style.display = "none";
                                    const fb = e.currentTarget.nextElementSibling as HTMLElement | null;
                                    if (fb) fb.style.display = "flex";
                                }}
                            />
                            {/* Fallback (only shown when PNG missing) */}
                            <div style={{ display: "none", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: "50%",
                                    background: card.fallbackBg,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: card.fallbackFontSize, fontWeight: 900, color: "#fff",
                                    fontFamily: card.fallbackFontSize > 14 ? "Georgia, serif" : "inherit",
                                }}>{card.fallbackChar}</div>
                                <span style={{ fontSize: 6.5, fontWeight: 800, color: card.fallbackColor, letterSpacing: "0.5px" }}>{card.fallbackLabel}</span>
                            </div>
                        </div>
                        <p style={{ fontSize: 8.5, color: C.muted, textAlign: "center", lineHeight: 1.5, margin: 0 }}>
                            Registered under<br />
                            <strong style={{ color: C.text, fontSize: 8.5 }}>{card.name}<br />{card.name2}</strong>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Tab definitions
const TABS: { id: TabId; labelKey: string; labelFallback: string }[] = [
    { id: "signin", labelKey: "signup.tabSignIn", labelFallback: "Sign In" },
    { id: "register", labelKey: "signup.tabRegister", labelFallback: "Register" },
];

// Main page
export default function Signup() {
    usePageTitle("Sign In / Sign Up");
    const C = useC();
    const { theme } = useTheme();
    const { t, direction } = useLocale();
    const [tab, setTab] = useState<TabId>("signin");
    const [regStep, setRegStep] = useState<RegStep>("choose_role");
    const [database, setDatabase] = useState<DatabaseReadiness>({
        ready: true,
        details: "",
    });
    const [, navigate] = useLocation();

    const switchTab = (newTab: TabId) => {
        setTab(newTab);
        if (newTab === "register") setRegStep("choose_role");
    };

    // ── Already-authenticated redirect ──────────────────────────────────────
    // Check existing session via /api/trpc/localAuth.me — if logged in, skip auth forms
    const meQuery = trpc.localAuth.me.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        if (meQuery.data) {
            const returnTo = new URLSearchParams(window.location.search).get("r") ?? "/dashboard";
            const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/dashboard";
            navigate(safeReturnTo);
        }
    }, [meQuery.data, navigate]);
    // ────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        let active = true;

        const checkReadiness = async () => {
            try {
                const response = await fetch("/api/readyz", {
                    headers: { Accept: "application/json" },
                });
                const payload = await response.json().catch(() => null) as {
                    services?: { database?: { ready?: boolean; details?: string } };
                } | null;

                const dbReady = payload?.services?.database?.ready !== false;
                const dbDetails = String(payload?.services?.database?.details ?? "");

                if (active) {
                    setDatabase({ ready: dbReady, details: dbDetails });
                }
            } catch {
                if (active) {
                    setDatabase({
                        ready: false,
                        details: t("signup.databaseCheckFailed", "Could not verify database readiness. Check backend connectivity."),
                    });
                }
            }
        };

        void checkReadiness();
        const interval = window.setInterval(() => {
            void checkReadiness();
        }, 15000);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [t]);

    // Dynamic CSS — hover/focus/animation effects that can't be achieved inline
    const dynCss = `
        .djac-auth input, .djac-auth textarea, .djac-auth select {
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .djac-auth input:focus, .djac-auth textarea:focus, .djac-auth select:focus {
            border-color: ${C.cyan}99 !important;
            box-shadow: 0 0 0 3px ${C.focusRing} !important;
            outline: none;
        }
        .djac-btn-primary:hover:not(:disabled) {
            filter: brightness(1.12);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px ${C.cyan}38;
        }
        .djac-btn-primary:active:not(:disabled) {
            transform: translateY(0);
            box-shadow: none;
        }
        .djac-btn-secondary:hover {
            border-color: ${C.cyan}60 !important;
            background: ${C.border} !important;
        }
        .djac-role-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 24px rgba(0,0,0,0.13);
            border-color: ${C.cyan}50 !important;
        }
        .djac-auth .tab-btn:hover { opacity: 0.85; }
        .djac-auth .value-item { transition: transform 0.15s; }
        .djac-auth .value-item:hover { transform: translateX(${direction === "rtl" ? "-3px" : "3px"}); }
        .djac-auth .value-icon { transition: transform 0.2s, box-shadow 0.2s; }
        .djac-auth .value-item:hover .value-icon {
            transform: scale(1.1);
            box-shadow: 0 0 14px ${C.cyan}30;
        }
        @keyframes djacFadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
        }
        .djac-tab-content { animation: djacFadeUp 0.22s ease both; }
        .djac-hero-gradient {
            background: linear-gradient(135deg, ${C.cyan}, ${C.purple});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
            display: inline;
        }
        @media (max-width: 720px) {
            .djac-two-col { grid-template-columns: 1fr !important; }
            .djac-left-panel { display: none !important; }
            .djac-right-panel { padding: 28px 16px !important; }
            .djac-ip-mobile { display: block !important; }
        }
    `;

    const VALUE_PROPS = [
        { icon: <Globe2 size={17} />, accent: C.cyan, title: t("signup.vp1Title", "Dual-Jurisdiction Compliance Mapping"), desc: t("signup.vp1Desc", "CSL, DSL, PIPL, PDPL, and NCA ECC aligned side-by-side in a unified workspace.") },
        { icon: <Zap size={17} />, accent: C.yellow, title: t("signup.vp2Title", "Risk Scoring & Gap Analysis Engine"), desc: t("signup.vp2Desc", "Automated compliance gap detection with severity scoring and remediation guidance.") },
        { icon: <BarChart2 size={17} />, accent: C.purple, title: t("signup.vp3Title", "Automated Reporting & Evidence Export"), desc: t("signup.vp3Desc", "Board-ready reports in PDF, DOCX, and Excel with full audit trail packages.") },
        { icon: <BookOpen size={17} />, accent: C.green, title: t("signup.vp4Title", "Built for Government & Enterprise"), desc: t("signup.vp4Desc", "Purpose-built for compliance officers, DPOs, and legal teams operating cross-border.") },
        { icon: <Lock size={17} />, accent: C.orange, title: t("signup.vp5Title", "Secure Access with Audit-Grade Tracking"), desc: t("signup.vp5Desc", "Enterprise MFA, RBAC, and immutable audit logs ensuring regulatory-grade accountability.") },
    ];

    return (
        <div dir={direction} className="djac-auth" style={{ minHeight: "100vh", background: C.radial, backgroundColor: C.bg, color: C.text, fontFamily: "inherit" }}>
            <style dangerouslySetInnerHTML={{ __html: dynCss }} />
            {/* Grid overlay */}
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `linear-gradient(${C.gridColor} 1px,transparent 1px),linear-gradient(90deg,${C.gridColor} 1px,transparent 1px)`, backgroundSize: "40px 40px" }} />

            {/* Top nav */}
            <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
                <Link href="/">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        <img src={APP_LOGO} alt={APP_TITLE} style={{ height: 32, width: "auto", maxWidth: 74, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>DJAC Tool</span>
                            <span style={{ color: C.muted, fontSize: 9.5, letterSpacing: "0.01em" }}>Dual-Jurisdiction Assurance &amp; Compliance</span>
                        </div>
                    </div>
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <LocaleSwitcher />
                    <ThemeToggle />
                    <Link href="/">
                        <button style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, color: C.muted, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px" }}>
                            <ChevronLeft size={14} /> {t("signup.home", "Home")}
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Two-column layout */}
            <div className="djac-two-col" style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "calc(100vh - 67px)", maxWidth: 1140, margin: "0 auto", padding: "0 24px" }}>

                {/* Left: marketing content + IP authority section */}
                <div className="djac-left-panel" style={{ padding: "52px 48px 48px 8px", display: "flex", flexDirection: "column", justifyContent: "center" }}>

                    {/* Official platform badge */}
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: `${C.cyan}14`, border: `1px solid ${C.cyan}38`, borderRadius: 99, padding: "5px 13px", fontSize: 10.5, fontWeight: 700, color: C.cyan, marginBottom: 22, alignSelf: "flex-start" }}>
                        <ShieldCheck size={11} style={{ flexShrink: 0 }} />
                        {t("signup.tagline", "Enterprise Compliance Intelligence · China × Saudi Arabia")}
                    </div>

                    {/* Hero heading */}
                    <h1 key={theme} style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.14, margin: "0 0 10px" }}>
                        {t("signup.heroLine1", "Enterprise-Grade Compliance")}<br />
                        <span className="djac-hero-gradient">
                            {t("signup.heroLine2", "for Cross-Border Operations")}
                        </span>
                    </h1>

                    {/* Product tagline */}
                    <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.65, margin: "0 0 6px", fontWeight: 600 }}>
                        {t("signup.productTitle", "DJAC Tool — Dual-Jurisdiction Assurance and Compliance")}
                    </p>
                    <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.65, margin: "0 0 26px", maxWidth: 440 }}>
                        {t("signup.heroDesc", "The dual-jurisdiction platform built for compliance officers, DPOs, and legal teams managing China and Saudi Arabia regulatory obligations including PIPL, PDPL, CSL, DSL, and NCA ECC.")}
                    </p>

                    {/* Feature value prop list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 24 }}>
                        {VALUE_PROPS.map((v, i) => (
                            <div key={i} className="value-item" style={{ display: "flex", alignItems: "flex-start", gap: 13 }}>
                                <div className="value-icon" style={{ width: 34, height: 34, borderRadius: 9, background: `${v.accent}18`, border: `1px solid ${v.accent}35`, display: "flex", alignItems: "center", justifyContent: "center", color: v.accent, flexShrink: 0 }}>
                                    {v.icon}
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, fontSize: 12.5, margin: "0 0 2px", color: C.text }}>{v.title}</p>
                                    <p style={{ color: C.muted, fontSize: 11.5, margin: 0, lineHeight: 1.5 }}>{v.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Framework compliance tags */}
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 0 }}>
                        {["PIPL", "PDPL", "CSL", "DSL", "NCA ECC", "MLPS 2.0", "GDPR-Aligned", "Enterprise"].map(b => (
                            <span key={b} style={{ background: C.tagBg, border: `1px solid ${C.border}`, borderRadius: 99, fontSize: 9.5, fontWeight: 600, color: C.muted, padding: "3px 10px" }}>{b}</span>
                        ))}
                    </div>

                    {/* Enterprise trust badges */}
                    <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        {[
                            { label: "SOC 2 Ready", accent: C.green },
                            { label: "ISO 27001 Aligned", accent: C.cyan },
                            { label: "TLS 1.3 Encrypted", accent: C.purple },
                            { label: "PDPL · PIPL Compliant", accent: C.yellow },
                        ].map(b => (
                            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <ShieldCheck size={10} style={{ color: b.accent }} />
                                <span style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{b.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* IP Registration Authority Section */}
                    <IpRegistrationSection C={C} />

                </div>

                {/* Right: auth panel */}
                <div className="djac-right-panel" style={{ padding: "48px 8px 48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ background: C.cardPanel, border: `1px solid ${C.border}`, borderRadius: 22, padding: "32px 30px", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: `0 8px 40px rgba(0,0,0,0.13)` }}>
                        {/* Tab switcher */}
                        <div role="tablist" aria-label={t("signup.tabSwitcher", "Account type")} style={{ display: "flex", gap: 3, marginBottom: 28, background: C.tabBar, padding: 4, borderRadius: 12 }}>
                            {TABS.map(tp => (
                                <button key={tp.id} role="tab" aria-selected={tab === tp.id} aria-controls={`signup-panel-${tp.id}`} onClick={() => switchTab(tp.id)} style={{
                                    flex: 1,
                                    background: tab === tp.id ? C.tabActive : "transparent",
                                    border: `1px solid ${tab === tp.id ? C.border : "transparent"}`,
                                    borderRadius: 8, padding: "9px 4px", cursor: "pointer",
                                    color: tab === tp.id ? C.text : C.muted,
                                    fontWeight: tab === tp.id ? 700 : 500, fontSize: 13, transition: "all 0.15s",
                                }}>
                                    {t(tp.labelKey, tp.labelFallback)}
                                </button>
                            ))}
                        </div>
                        <div key={`${tab}-${regStep}`} id={`signup-panel-${tab}`} role="tabpanel" className="djac-tab-content">
                            {tab === "signin" && <SignInForm onRegister={() => switchTab("register")} database={database} />}
                            {tab === "register" && regStep === "choose_role" && (
                                <RoleChooser onSelect={(role) => setRegStep(role)} onSignIn={() => switchTab("signin")} />
                            )}
                            {tab === "register" && regStep !== "choose_role" && (
                                <RoleRegisterForm
                                    role={regStep as RoleId}
                                    onBack={() => setRegStep("choose_role")}
                                    onSwitchToSignIn={() => switchTab("signin")}
                                    database={database}
                                />
                            )}
                        </div>
                    </div>

                    {/* Social proof statistics */}
                    <div style={{ marginTop: 20 }}>
                        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "wrap" }}>
                            {[
                                { stat: "340+", lk: "signup.stat1", lf: "Organizations Onboarded" },
                                { stat: "8 min", lk: "signup.stat2", lf: "Full Gap Analysis" },
                                { stat: "87%", lk: "signup.stat3", lf: "Cost vs. Law Firm" },
                            ].map(s => (
                                <div key={s.lf} style={{ textAlign: "center" }}>
                                    <p style={{ color: C.cyan, fontWeight: 800, fontSize: 17, margin: "0 0 2px" }}>{s.stat}</p>
                                    <p style={{ color: C.muted, fontSize: 10.5, margin: 0 }}>{t(s.lk, s.lf)}</p>
                                </div>
                            ))}
                        </div>
                        {/* IP authority section shown on mobile (left panel hidden at <720px) */}
                        <div className="djac-ip-mobile" style={{ display: "none", marginTop: 20 }}>
                            <IpRegistrationSection C={C} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer — IP authority row + legal links */}
            <footer style={{ position: "relative", zIndex: 1, padding: "14px 24px 20px", borderTop: `1px solid ${C.border}` }}>
                <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>

                    {/* IP authority bar */}
                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <img
                                src="/cnipa-logo.png" alt="CNIPA"
                                style={{ height: 18, width: "auto", maxWidth: 54, objectFit: "contain", verticalAlign: "middle" }}
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                            <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>CNIPA Registered</span>
                        </div>
                        <span style={{ color: C.border, fontSize: 13 }}>·</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <img
                                src="/usco-logo.png" alt="U.S. Copyright Office"
                                style={{ height: 18, width: "auto", maxWidth: 54, objectFit: "contain", verticalAlign: "middle" }}
                                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                            <span style={{ fontSize: 10, color: C.muted, fontWeight: 500 }}>U.S. Copyright Office Registered</span>
                        </div>
                        <span style={{ color: C.border, fontSize: 13 }}>·</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.muted }}>
                            <ShieldCheck size={11} style={{ color: C.cyan }} />
                            © 2026 DJAC · All intellectual property rights reserved.
                        </span>
                    </div>

                    {/* Legal links */}
                    <p style={{ color: C.muted, fontSize: 11, margin: 0, textAlign: "center" }}>
                        By using DJAC you agree to our{" "}
                        <Link href="/terms">
                            <span style={{ color: C.cyan, cursor: "pointer", textDecoration: "underline" }}>Terms of Service</span>
                        </Link>
                        {" "}and{" "}
                        <Link href="/privacy">
                            <span style={{ color: C.cyan, cursor: "pointer", textDecoration: "underline" }}>Privacy Policy</span>
                        </Link>
                        .
                    </p>
                </div>
            </footer>
            <DeHengFooter />
        </div>
    );
}
