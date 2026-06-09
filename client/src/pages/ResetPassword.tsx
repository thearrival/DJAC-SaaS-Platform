/**
 * DJAC Reset Password page — enterprise redesign.
 * Route: /reset-password?token=<jwt>
 */
import { useState, useMemo } from "react";
import type React from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, APP_LOGO } from "@/const";
import { Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldCheck, KeyRound } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeHengFooter } from "@/components/DeHengFooter";

export default function ResetPassword() {
    usePageTitle("Set New Password — DJAC");
    const { t, direction } = useLocale();
    const dir = direction;
    const { theme } = useTheme();
    const d = theme === "dark";
    const C = {
        bg: d ? "#040F61" : "#F0F4FF",
        bgDeep: d ? "#020B45" : "#FFFFFF",
        bg2: d ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.85)",
        border: d ? "rgba(255,255,255,0.09)" : "rgba(4,15,97,0.11)",
        text: d ? "#FFFFFF" : "#020B45",
        muted: d ? "#9CA3AF" : "rgba(2,11,69,0.55)",
        cyan: d ? "#00F7FF" : "#0284c7",
        purple: d ? "#9359EC" : "#7c3aed",
        green: d ? "#01FF7F" : "#16a34a",
        yellow: d ? "#FFD600" : "#d97706",
        red: d ? "#FF1744" : "#dc2626",
        inputBg: d ? "rgba(255,255,255,0.06)" : "rgba(4,15,97,0.05)",
        gridColor: d ? "rgba(255,255,255,0.04)" : "rgba(4,15,97,0.05)",
        focusRing: d ? "rgba(0,247,255,0.28)" : "rgba(2,132,199,0.22)",
        radial: d
            ? "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(147,89,236,0.22) 0%,transparent 60%)"
            : "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(2,132,199,0.10) 0%,transparent 60%)",
    };

    const [, navigate] = useLocation();
    const token = typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("token") ?? ""
        : "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const mutation = trpc.localAuth.resetPassword.useMutation({
        onSuccess: () => setDone(true),
        onError: (e) => setError(e.message),
    });

    // Password strength
    const pwScore = useMemo(() => {
        let s = 0;
        if (password.length >= 8) s++;
        if (password.length >= 12) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    }, [password]);

    const pwLabel = ["", t("pw.weak", "Weak"), t("pw.fair", "Fair"), t("pw.good", "Good"), t("pw.strong", "Strong"), t("pw.excellent", "Excellent")][pwScore] ?? "";
    const pwColor = ["", C.red, C.yellow, C.yellow, C.green, C.cyan][pwScore] ?? C.muted;

    const reqs = [
        { ok: password.length >= 8, label: t("pw.req.length", "At least 8 characters") },
        { ok: /[A-Z]/.test(password), label: t("pw.req.upper", "One uppercase letter (A–Z)") },
        { ok: /[0-9]/.test(password), label: t("pw.req.digit", "One number (0–9)") },
        { ok: /[^A-Za-z0-9]/.test(password), label: t("pw.req.special", "One special character (!@#$…)") },
    ];

    const mismatch = confirm.length > 0 && password !== confirm;

    function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setError("");
        if (password !== confirm) {
            setError(t("reset.mismatch", "Passwords do not match."));
            return;
        }
        if (!token) {
            setError(t("reset.missingToken", "Missing reset token. Use the link from your email."));
            return;
        }
        mutation.mutate({ token, newPassword: password });
    }

    const dynCss = `
        .djac-rp input { transition: border-color 0.15s, box-shadow 0.15s; }
        .djac-rp input:focus {
            border-color: ${C.cyan}99 !important;
            box-shadow: 0 0 0 3px ${C.focusRing} !important;
            outline: none;
        }
        .djac-rp-btn:hover:not(:disabled) {
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px ${C.cyan}38;
        }
        .djac-rp-btn:active:not(:disabled) { transform: translateY(0); }
        @keyframes djacCheckIn {
            from { opacity:0; transform: scale(0.6); }
            to   { opacity:1; transform: scale(1); }
        }
        .djac-check-anim { animation: djacCheckIn 0.4s cubic-bezier(.34,1.56,.64,1) both; }
    `;

    return (
        <div dir={dir} className="djac-rp"
            style={{ minHeight: "100vh", background: C.radial, backgroundColor: C.bg, color: C.text, fontFamily: "Inter,system-ui,sans-serif" }}>
            <style dangerouslySetInnerHTML={{ __html: dynCss }} />
            {/* Grid overlay */}
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
                backgroundImage: `linear-gradient(${C.gridColor} 1px,transparent 1px),linear-gradient(90deg,${C.gridColor} 1px,transparent 1px)`,
                backgroundSize: "40px 40px"
            }} />

            {/* Nav */}
            <nav style={{
                position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 32px", borderBottom: `1px solid ${C.border}`, backdropFilter: "blur(10px)"
            }}>
                <Link href="/">
                    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                        <img src={APP_LOGO} alt={APP_TITLE} style={{ height: 32, width: "auto", maxWidth: 74, objectFit: "contain" }}
                            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>DJAC Tool</span>
                            <span style={{ color: C.muted, fontSize: 9, letterSpacing: "0.01em" }}>Dual-Jurisdiction Assurance &amp; Compliance</span>
                        </div>
                    </div>
                </Link>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LocaleSwitcher />
                    <ThemeToggle />
                    <Link href="/login">
                        <button style={{
                            background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8,
                            color: C.muted, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "6px 12px"
                        }}>
                            <ArrowLeft size={13} /> {t("reset.backToLogin", "Back to Sign In")}
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Centered card */}
            <div style={{
                position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: "calc(100vh - 65px)", padding: "40px 24px"
            }}>
                <div style={{ width: "100%", maxWidth: 480 }}>

                    {done ? (
                        /* ── Success state ──────────────────────────────────────── */
                        <div style={{
                            background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: "44px 36px",
                            backdropFilter: "blur(12px)", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.11)"
                        }}>
                            <div className="djac-check-anim" style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                                <div style={{
                                    width: 72, height: 72, borderRadius: "50%",
                                    background: `${C.green}18`, border: `1px solid ${C.green}45`,
                                    display: "flex", alignItems: "center", justifyContent: "center"
                                }}>
                                    <CheckCircle2 size={36} style={{ color: C.green }} />
                                </div>
                            </div>
                            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 10px", color: C.text }}>
                                {t("reset.successTitle", "Password Updated")}
                            </h2>
                            <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.65, margin: "0 0 24px" }}>
                                {t("reset.successBody", "Your credentials have been changed securely. You will be redirected to sign in.")}
                            </p>
                            <button onClick={() => navigate("/login")} className="djac-rp-btn"
                                style={{
                                    background: `linear-gradient(135deg,${C.cyan},${C.purple})`,
                                    border: "none", borderRadius: 10, color: "#fff", padding: "12px 28px",
                                    fontWeight: 700, fontSize: 13.5, cursor: "pointer", transition: "all 0.18s"
                                }}>
                                {t("reset.goToLogin", "Continue to Sign In")}
                            </button>
                        </div>
                    ) : (
                        /* ── Reset form ─────────────────────────────────────────── */
                        <div style={{
                            background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: "36px 32px",
                            backdropFilter: "blur(12px)", boxShadow: "0 8px 40px rgba(0,0,0,0.11)"
                        }}>

                            {/* Icon */}
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: `${C.purple}18`, border: `1px solid ${C.purple}40`,
                                    display: "flex", alignItems: "center", justifyContent: "center", color: C.purple
                                }}>
                                    <KeyRound size={26} />
                                </div>
                            </div>

                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    background: `${C.purple}14`, border: `1px solid ${C.purple}32`,
                                    borderRadius: 99, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: C.purple, marginBottom: 12
                                }}>
                                    <ShieldCheck size={10} /> {t("reset.badge", "Secure Credential Reset")}
                                </div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: C.text }}>
                                    {t("reset.title", "Set New Password")}
                                </h2>
                                <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                                    {t("reset.subtitle", "Create a strong password for your DJAC compliance workspace. The link is single-use and expires shortly.")}
                                </p>
                            </div>

                            {/* Missing token banner */}
                            {!token && (
                                <div role="alert" style={{
                                    background: `${C.red}14`, border: `1px solid ${C.red}40`,
                                    borderRadius: 10, padding: "11px 14px", marginBottom: 18,
                                    color: C.red, fontSize: 12.5, lineHeight: 1.5
                                }}>
                                    <strong>{t("reset.tokenMissingTitle", "Invalid or Expired Link")}</strong>
                                    {" — "}{t("reset.missingToken", "The reset link is missing or has expired. Please request a new one.")}
                                </div>
                            )}

                            {/* SecurityNotice */}
                            <div style={{
                                background: `${C.cyan}0A`, border: `1px solid ${C.cyan}25`,
                                borderRadius: 9, padding: "9px 13px", display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 20
                            }}>
                                <ShieldCheck size={12} style={{ color: C.cyan, flexShrink: 0, marginTop: 1 }} />
                                <p style={{ margin: 0, fontSize: 10.5, color: C.muted, lineHeight: 1.55 }}>
                                    <strong style={{ color: C.cyan }}>{t("reset.notice.header", "End-to-End Encrypted")}</strong>
                                    {" · "}{t("reset.notice.body", "Your new password is transmitted over TLS 1.3 and stored as a salted hash. Old sessions are invalidated immediately after this change.")}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                {/* New password */}
                                <div>
                                    <div style={{ position: "relative" }}>
                                        <Lock size={13} style={{
                                            position: "absolute",
                                            left: dir === "rtl" ? "auto" : 12, right: dir === "rtl" ? 12 : "auto",
                                            top: "50%", transform: "translateY(-50%)",
                                            color: C.muted, pointerEvents: "none",
                                        }} />
                                        <input
                                            type={showPw ? "text" : "password"}
                                            value={password} onChange={e => setPassword(e.target.value)}
                                            placeholder={t("reset.newPasswordPlaceholder", "New password")}
                                            required autoComplete="new-password"
                                            aria-label={t("reset.newPasswordAriaLabel", "New password")}
                                            style={{
                                                width: "100%", background: C.inputBg,
                                                border: `1px solid ${C.border}`, borderRadius: 10,
                                                color: C.text, fontSize: 13, padding: "11px 40px",
                                                paddingLeft: dir === "rtl" ? 40 : 36,
                                                outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit",
                                            }}
                                        />
                                        <button type="button" onClick={() => setShowPw(v => !v)}
                                            style={{
                                                position: "absolute",
                                                right: dir === "rtl" ? "auto" : 12, left: dir === "rtl" ? 12 : "auto",
                                                top: "50%", transform: "translateY(-50%)",
                                                background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0
                                            }}>
                                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {/* Strength bar */}
                                    {password.length > 0 && (
                                        <div style={{ marginTop: 7 }}>
                                            <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                                                {[1, 2, 3, 4, 5].map(i => (
                                                    <div key={i} style={{
                                                        flex: 1, height: 3, borderRadius: 3,
                                                        background: i <= pwScore ? pwColor : `${C.border}`,
                                                        transition: "background 0.2s"
                                                    }} />
                                                ))}
                                            </div>
                                            <span style={{ fontSize: 10.5, color: pwColor, fontWeight: 600 }}>{pwLabel}</span>
                                        </div>
                                    )}
                                    {/* Requirements */}
                                    {password.length > 0 && (
                                        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
                                            {reqs.map(r => (
                                                <span key={r.label} style={{ fontSize: 10.5, color: r.ok ? C.green : C.muted, display: "flex", alignItems: "center", gap: 4 }}>
                                                    <span style={{ fontWeight: 800 }}>{r.ok ? "✓" : "·"}</span> {r.label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <div style={{ position: "relative" }}>
                                        <Lock size={13} style={{
                                            position: "absolute",
                                            left: dir === "rtl" ? "auto" : 12, right: dir === "rtl" ? 12 : "auto",
                                            top: "50%", transform: "translateY(-50%)",
                                            color: mismatch ? C.red : C.muted, pointerEvents: "none",
                                        }} />
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirm} onChange={e => setConfirm(e.target.value)}
                                            placeholder={t("reset.confirmPasswordPlaceholder", "Confirm new password")}
                                            required autoComplete="new-password"
                                            aria-label={t("reset.confirmAriaLabel", "Confirm new password")}
                                            style={{
                                                width: "100%", background: C.inputBg,
                                                border: `1px solid ${mismatch ? C.red : C.border}`, borderRadius: 10,
                                                color: C.text, fontSize: 13, padding: "11px 40px",
                                                paddingLeft: dir === "rtl" ? 40 : 36,
                                                outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit",
                                            }}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                                            style={{
                                                position: "absolute",
                                                right: dir === "rtl" ? "auto" : 12, left: dir === "rtl" ? 12 : "auto",
                                                top: "50%", transform: "translateY(-50%)",
                                                background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0
                                            }}>
                                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                        </button>
                                    </div>
                                    {mismatch && (
                                        <p style={{ color: C.red, fontSize: 11, margin: "4px 0 0" }}>
                                            {t("reset.mismatch", "Passwords do not match.")}
                                        </p>
                                    )}
                                </div>

                                {error && <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>{error}</p>}

                                <button type="submit" disabled={mutation.isPending || !token || mismatch}
                                    className="djac-rp-btn"
                                    style={{
                                        width: "100%", border: "none", borderRadius: 10, padding: "13px 0",
                                        background: (mutation.isPending || !token || mismatch)
                                            ? `${C.purple}60`
                                            : `linear-gradient(135deg,${C.purple},${C.cyan})`,
                                        color: "#fff", fontWeight: 800, fontSize: 14,
                                        cursor: (mutation.isPending || !token || mismatch) ? "not-allowed" : "pointer",
                                        transition: "all 0.18s",
                                    }}>
                                    {mutation.isPending ? t("reset.saving", "Updating password...") : t("reset.saveButton", "Set New Password")}
                                </button>
                            </form>

                            <div style={{ marginTop: 20, textAlign: "center" }}>
                                <Link href="/login" style={{ color: C.muted, textDecoration: "none", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}>
                                    <ArrowLeft size={12} />
                                    {t("reset.backToLogin", "Back to Sign In")}
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <p style={{ color: C.muted, fontSize: 10.5, textAlign: "center", marginTop: 18 }}>
                        {t("reset.footer", "DJAC Tool · Enterprise Compliance Intelligence · Saudi Arabia · China · UAE")}
                    </p>
                </div>
            </div>
            <DeHengFooter />
        </div>
    );
}
