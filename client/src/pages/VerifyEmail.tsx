/**
 * DJAC Email Verification page.
 * Route: /verify-email?token=<jwt>
 *
 * Called when user clicks the verification link sent to their email.
 * Calls localAuth.verifyEmail with the JWT token from the URL.
 */
import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { APP_TITLE, APP_LOGO } from "@/const";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export default function VerifyEmail() {
  usePageTitle("Verify Email — DJAC");
  const { t } = useLocale();
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMut = trpc.localAuth.verifyEmail.useMutation({
    onSuccess: () => setStatus("success"),
    onError: err => {
      setStatus("error");
      setErrorMessage(err.message);
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided.");
      return;
    }
    verifyMut.mutate({ token });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--djac-bg, #0a0a0f)",
        color: "var(--djac-text, #e2e8f0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          padding: 40,
          borderRadius: 16,
          border: "1px solid var(--djac-border, rgba(255,255,255,0.08))",
          background: "var(--djac-card, rgba(15,15,25,0.9))",
          textAlign: "center",
        }}
      >
        <img
          src={APP_LOGO}
          alt={APP_TITLE}
          style={{ height: 36, marginBottom: 24 }}
        />

        {status === "loading" && (
          <>
            <Loader2
              size={40}
              style={{
                color: "#6366f1",
                marginBottom: 16,
                animation: "spin 1s linear infinite",
              }}
            />
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {t("verify.loading", "Verifying your email...")}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--djac-muted, #94a3b8)",
                lineHeight: 1.5,
              }}
            >
              {t(
                "verify.loadingSub",
                "Please wait while we verify your email address."
              )}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2
              size={48}
              style={{ color: "#22c55e", marginBottom: 16 }}
            />
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {t("verify.success", "Email Verified!")}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--djac-muted, #94a3b8)",
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              {t(
                "verify.successBody",
                "Your email address has been confirmed. You can now log in to your DJAC account."
              )}
            </p>
            <Link href="/login">
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 28px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg,#a855f7,#6366f1)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {t("verify.gotoLogin", "Go to Login")}
                <ArrowRight size={14} />
              </button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            {token ? (
              <XCircle
                size={48}
                style={{ color: "#ef4444", marginBottom: 16 }}
              />
            ) : (
              <AlertTriangle
                size={48}
                style={{ color: "#f59e0b", marginBottom: 16 }}
              />
            )}
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              {t("verify.error", "Verification Failed")}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: "var(--djac-muted, #94a3b8)",
                lineHeight: 1.5,
                marginBottom: 24,
              }}
            >
              {errorMessage ||
                t(
                  "verify.errorBody",
                  "The verification link is invalid or has expired. Please request a new verification email from your account settings."
                )}
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link href="/login">
                <button
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    background: "var(--djac-card-hi)",
                    border: "1px solid var(--djac-border)",
                    color: "var(--djac-muted)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t("verify.gotoLogin", "Go to Login")}
                </button>
              </Link>
              <Link href="/forgot-password">
                <button
                  style={{
                    padding: "10px 22px",
                    borderRadius: 8,
                    background: "linear-gradient(135deg,#a855f7,#6366f1)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {t("verify.requestNew", "Request New Link")}
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
