/**
 * DJAC Forgot Password page — enterprise redesign.
 * Route: /forgot-password
 */
import { useState } from "react";
import type React from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { APP_TITLE, APP_LOGO } from "@/const";
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck, Lock } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ForgotPassword() {
    usePageTitle("Account Recovery — DJAC");
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
        red: d ? "#FF1744" : "#dc2626",
        inputBg: d ? "rgba(255,255,255,0.06)" : "rgba(4,15,97,0.05)",
        gridColor: d ? "rgba(255,255,255,0.04)" : "rgba(4,15,97,0.05)",
        focusRing: d ? "rgba(0,247,255,0.28)" : "rgba(2,132,199,0.22)",
        radial: d
            ? "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(147,89,236,0.22) 0%,transparent 60%)"
            : "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(2,132,199,0.10) 0%,transparent 60%)",
    };

    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const mutation = trpc.localAuth.requestPasswordReset.useMutation({
        onSuccess: () => setSubmitted(true),
        onError: (e) => setError(e.message),
    });

    function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        setError("");
        mutation.mutate({ email });
    }

    const dynCss = `
        .djac-fp input { transition: border-color 0.15s, box-shadow 0.15s; }
        .djac-fp input:focus {
            border-color: ${C.cyan}99 !important;
            box-shadow: 0 0 0 3px ${C.focusRing} !important;
            outline: none;
        }
        .djac-fp-btn:hover:not(:disabled) {
            filter: brightness(1.1);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px ${C.cyan}38;
        }
        .djac-fp-btn:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
        @keyframes djacCheckIn {
            from { opacity:0; transform: scale(0.6); }
            to   { opacity:1; transform: scale(1); }
        }
        .djac-check-anim { animation: djacCheckIn 0.4s cubic-bezier(.34,1.56,.64,1) both; }
    `;

    return (
        <div dir={dir} className="djac-fp"
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
                            <ArrowLeft size={13} /> {t("forgot.backToLogin", "Back to Sign In")}
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Centered card */}
            <div style={{
                position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: "calc(100vh - 65px)", padding: "40px 24px"
            }}>
                <div style={{ width: "100%", maxWidth: 460 }}>

                    {submitted ? (
                        /* ── Success state ───────────────────────────────────── */
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
                                {t("forgot.successTitle", "Check Your Inbox")}
                            </h2>
                            <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.65, margin: "0 0 8px" }}>
                                {t("forgot.successBody", "If a DJAC account is registered to that address, a secure password reset link has been sent. The link expires in 30 minutes.")}
                            </p>
                            <p style={{ color: C.muted, fontSize: 12, margin: "0 0 28px" }}>
                                {t("forgot.successSpam", "If you don't see the email, please check your spam or junk folder.")}
                            </p>
                            {/* Security detail strip */}
                            <div style={{
                                background: `${C.cyan}0C`, border: `1px solid ${C.cyan}28`,
                                borderRadius: 9, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8, marginBottom: 24, textAlign: dir === "rtl" ? "right" : "left"
                            }}>
                                <ShieldCheck size={13} style={{ color: C.cyan, flexShrink: 0 }} />
                                <p style={{ margin: 0, fontSize: 10.5, color: C.muted }}>
                                    {t("forgot.securityNote", "Reset links are single-use, time-limited, and delivered over TLS 1.3. If you did not request this, no action is needed.")}
                                </p>
                            </div>
                            <Link href="/login">
                                <button style={{
                                    background: `linear-gradient(135deg,${C.cyan},${C.purple})`,
                                    border: "none", borderRadius: 10, color: "#fff", padding: "12px 28px",
                                    fontWeight: 700, fontSize: 13.5, cursor: "pointer"
                                }}>
                                    {t("forgot.backToLogin", "Back to Sign In")}
                                </button>
                            </Link>
                        </div>
                    ) : (
                        /* ── Recovery form ───────────────────────────────────── */
                        <div style={{
                            background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 22, padding: "36px 32px",
                            backdropFilter: "blur(12px)", boxShadow: "0 8px 40px rgba(0,0,0,0.11)"
                        }}>

                            {/* Icon + badge */}
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 14,
                                    background: `${C.cyan}14`, border: `1px solid ${C.cyan}38`,
                                    display: "flex", alignItems: "center", justifyContent: "center", color: C.cyan
                                }}>
                                    <Lock size={26} />
                                </div>
                            </div>

                            <div style={{ textAlign: "center", marginBottom: 20 }}>
                                <div style={{
                                    display: "inline-flex", alignItems: "center", gap: 6,
                                    background: `${C.cyan}12`, border: `1px solid ${C.cyan}32`,
                                    borderRadius: 99, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: C.cyan, marginBottom: 12
                                }}>
                                    <ShieldCheck size={10} /> {t("forgot.badge", "Secure Account Recovery")}
                                </div>
                                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: C.text }}>
                                    {t("forgot.title", "Reset Your Password")}
                                </h2>
                                <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                                    {t("forgot.subtitle", "Enter the email address linked to your DJAC account. A secure, time-limited reset link will be sent immediately.")}
                                </p>
                            </div>

                            {/* Security notice */}
                            <div style={{
                                background: `${C.cyan}0A`, border: `1px solid ${C.cyan}25`,
                                borderRadius: 9, padding: "9px 13px", display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 20
                            }}>
                                <ShieldCheck size={12} style={{ color: C.cyan, flexShrink: 0, marginTop: 1 }} />
                                <p style={{ margin: 0, fontSize: 10.5, color: C.muted, lineHeight: 1.55 }}>
                                    <strong style={{ color: C.cyan }}>{t("forgot.notice.header", "Privacy Protected")}</strong>
                                    {" · "}{t("forgot.notice.body", "For security, we never confirm whether an email address is registered. The reset link will only be sent if a matching account exists.")}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                <div style={{ position: "relative" }}>
                                    <Mail size={13} style={{
                                        position: "absolute",
                                        left: dir === "rtl" ? "auto" : 12, right: dir === "rtl" ? 12 : "auto",
                                        top: "50%", transform: "translateY(-50%)",
                                        color: C.muted, pointerEvents: "none",
                                    }} />
                                    <input
                                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder={t("forgot.emailPlaceholder", "your.work@email.com")}
                                        required autoComplete="email"
                                        aria-label={t("forgot.emailAriaLabel", "Work email address")}
                                        style={{
                                            width: "100%", background: C.inputBg,
                                            border: `1px solid ${error ? C.red : C.border}`,
                                            borderRadius: 10, color: C.text, fontSize: 13,
                                            padding: "11px 14px",
                                            paddingLeft: dir === "rtl" ? 14 : 36,
                                            paddingRight: dir === "rtl" ? 36 : 14,
                                            outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit",
                                        }}
                                    />
                                </div>
                                {error && <p role="alert" style={{ color: C.red, fontSize: 12, margin: 0 }}>{error}</p>}
                                <button type="submit" disabled={mutation.isPending} className="djac-fp-btn"
                                    style={{
                                        width: "100%", border: "none", borderRadius: 10, padding: "13px 0",
                                        background: mutation.isPending ? `${C.cyan}60` : `linear-gradient(135deg,${C.cyan},${C.purple})`,
                                        color: "#fff", fontWeight: 800, fontSize: 14,
                                        cursor: mutation.isPending ? "not-allowed" : "pointer",
                                        transition: "all 0.18s",
                                    }}>
                                    {mutation.isPending ? t("forgot.sending", "Sending secure link...") : t("forgot.sendButton", "Send Reset Link")}
                                </button>
                                <p role="status" aria-live="polite" style={{ color: C.muted, fontSize: 11, margin: 0, textAlign: "center" }}>
                                    {mutation.isPending ? t("forgot.sending", "Sending secure link...") : ""}
                                </p>
                            </form>

                            <div style={{ marginTop: 20, textAlign: "center" }}>
                                <Link href="/login" style={{ color: C.muted, textDecoration: "none", fontSize: 12.5, display: "inline-flex", alignItems: "center", gap: 5 }}>
                                    <ArrowLeft size={12} />
                                    {t("forgot.backToLogin", "Back to Sign In")}
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <p style={{ color: C.muted, fontSize: 10.5, textAlign: "center", marginTop: 18 }}>
                        {t("forgot.footer", "DJAC Tool · Enterprise Compliance Intelligence · Saudi Arabia · China · UAE")}
                    </p>
                </div>
            </div>
        </div>
    );
}
