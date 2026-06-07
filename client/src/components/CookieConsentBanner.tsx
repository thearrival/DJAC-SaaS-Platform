/**
 * CookieConsentBanner
 *
 * Displays a cookie notice on first visit, stores the user's choice in
 * localStorage ("djac_cookie_consent": "accepted" | "declined").
 *
 * GDPR / PDPL / PIPL note: DJAC uses only strictly-necessary session cookies
 * for authentication. No analytics or advertising cookies are set.
 * This banner is required by EU/KSA/China privacy regulations as notice.
 */
import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";
import { useLocation } from "wouter";

const CONSENT_KEY = "djac_cookie_consent";

// Routes where the banner should NOT appear (legal pages themselves)
const EXEMPT_PATHS = ["/privacy", "/terms"];

export function CookieConsentBanner() {
    const [visible, setVisible] = useState(false);
    const [location] = useLocation();

    useEffect(() => {
        if (EXEMPT_PATHS.includes(location)) return;
        const stored = localStorage.getItem(CONSENT_KEY);
        if (!stored) setVisible(true);
    }, [location]);

    function accept() {
        localStorage.setItem(CONSENT_KEY, "accepted");
        setVisible(false);
    }

    function decline() {
        localStorage.setItem(CONSENT_KEY, "declined");
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-label="Cookie consent"
            style={{
                position: "fixed",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                maxWidth: 620,
                width: "calc(100% - 32px)",
                background: "var(--djac-card, rgba(4,15,97,0.96))",
                border: "1px solid var(--djac-border, rgba(255,255,255,0.10))",
                borderRadius: 14,
                padding: "16px 20px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                color: "var(--djac-text, #FFFFFF)",
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                gap: 12,
            }}
        >
            {/* Icon + text row */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <Cookie
                    size={20}
                    style={{ color: "var(--djac-cyan, #00F7FF)", flexShrink: 0, marginTop: 2 }}
                />
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--djac-muted, #9CA3AF)" }}>
                    DJAC uses strictly-necessary session cookies for authentication.
                    No tracking or advertising cookies are used. By continuing, you
                    acknowledge our{" "}
                    <a
                        href="/privacy"
                        style={{ color: "var(--djac-cyan, #00F7FF)", textDecoration: "underline" }}
                    >
                        Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                        href="/terms"
                        style={{ color: "var(--djac-cyan, #00F7FF)", textDecoration: "underline" }}
                    >
                        Terms of Service
                    </a>
                    .
                </p>
            </div>

            {/* Action row */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={decline}
                    style={{
                        background: "transparent",
                        border: "1px solid var(--djac-border, rgba(255,255,255,0.12))",
                        borderRadius: 8,
                        color: "var(--djac-muted, #9CA3AF)",
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        padding: "7px 16px",
                        fontFamily: "inherit",
                    }}
                >
                    Decline optional
                </button>
                <button
                    type="button"
                    onClick={accept}
                    style={{
                        background: "linear-gradient(135deg, var(--djac-cyan, #00F7FF), var(--djac-purple, #9359EC))",
                        border: "none",
                        borderRadius: 8,
                        color: "#040F61",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "7px 20px",
                        fontFamily: "inherit",
                    }}
                >
                    Accept & Continue
                </button>
            </div>
        </div>
    );
}
