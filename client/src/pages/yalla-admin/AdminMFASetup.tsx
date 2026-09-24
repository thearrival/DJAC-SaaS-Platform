/**
 * Yalla Hack Super Admin — MFA Setup
 * Enable or disable TOTP two-factor authentication for the founders account.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Shield, CheckCircle2, AlertTriangle, ShieldOff } from "lucide-react";

const ADMIN_API = "/api/yalla-admin";

export default function AdminMFASetup() {
  usePageTitle("MFA Setup — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"setup" | "confirm" | "done">("setup");
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`${ADMIN_API}/me`, { credentials: "include" }).then(res => {
      if (res.status === 401) navigate("/yalla-hack-owners-console/login");
    });
    fetch(`${ADMIN_API}/2fa/status`, { credentials: "include" })
      .then(res => (res.ok ? res.json() : { enabled: false }))
      .then(data => setEnabled(Boolean(data.enabled)))
      .catch(() => setEnabled(false));
  }, [navigate]);

  async function handleSetup() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`${ADMIN_API}/2fa/setup`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Setup failed");
        return;
      }
      const data = await res.json();
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setStep("confirm");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`${ADMIN_API}/2fa/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Invalid code");
        return;
      }
      const data = await res.json();
      setBackupCodes(data.backupCodes || []);
      setEnabled(true);
      setStep("done");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`${ADMIN_API}/2fa/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: disablePassword }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Could not disable 2FA");
        return;
      }
      setEnabled(false);
      setDisablePassword("");
      setStep("setup");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Inter', sans-serif",
        color: "#e2e8f0",
        padding: 24,
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 0",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/yalla-hack-owners-console/security")}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Two-Factor Authentication
          </h1>
          {enabled === true && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#10b981",
                background: "rgba(16,185,129,0.12)",
                border: "1px solid rgba(16,185,129,0.35)",
                borderRadius: 20,
                padding: "3px 10px",
              }}
            >
              ENABLED
            </span>
          )}
          {enabled === false && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#f59e0b",
                background: "rgba(245,158,11,0.10)",
                border: "1px solid rgba(245,158,11,0.35)",
                borderRadius: 20,
                padding: "3px 10px",
              }}
            >
              DISABLED
            </span>
          )}
        </div>
      </header>
      <main style={{ maxWidth: 480, margin: "0 auto" }}>
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {enabled === true && step !== "done" && (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              borderRadius: 12,
              border: "1px solid rgba(16,185,129,0.25)",
              background: "rgba(16,185,129,0.04)",
            }}
          >
            <Shield size={48} style={{ color: "#10b981", marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
              2FA Is Protecting Your Account
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
              Sign-in requires a time-based code from your authenticator app.
              Keep your backup codes somewhere safe.
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxWidth: 320,
                margin: "0 auto",
                textAlign: "left",
              }}
            >
              <label
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  fontWeight: 600,
                }}
              >
                Confirm your password to disable 2FA
              </label>
              <input
                type="password"
                value={disablePassword}
                onChange={e => setDisablePassword(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
                style={inputStyle}
              />
              <button
                onClick={handleDisable}
                disabled={busy || disablePassword.length === 0}
                style={{
                  padding: "12px 28px",
                  borderRadius: 10,
                  background:
                    busy || disablePassword.length === 0
                      ? "rgba(148,163,184,0.2)"
                      : "rgba(239,68,68,0.15)",
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#f87171",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor:
                    busy || disablePassword.length === 0
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <ShieldOff size={15} />
                {busy ? "Disabling…" : "Disable 2FA"}
              </button>
            </div>
          </div>
        )}

        {enabled === false && step === "setup" && (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Shield size={48} style={{ color: "#d900ff", marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
              Secure Your Account
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>
              Add an extra layer of security using an authenticator app.
            </p>
            <button
              onClick={handleSetup}
              disabled={busy}
              style={{
                padding: "12px 28px",
                borderRadius: 10,
                background: "linear-gradient(135deg,#d900ff,#d900ff)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? "Starting…" : "Begin Setup"}
            </button>
          </div>
        )}

        {enabled === false && step === "confirm" && (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <img
              src={qrDataUrl}
              alt="MFA QR Code"
              style={{
                width: 120,
                height: 120,
                marginBottom: 16,
                borderRadius: 8,
                padding: 8,
                background: "#fff",
              }}
            />
            <p style={{ fontSize: 12, color: "#7d8aa0", marginBottom: 8 }}>
              Or enter manually:
            </p>
            <code
              style={{ fontSize: 11, color: "#d900ff", wordBreak: "break-all" }}
            >
              {secret}
            </code>
            <div
              style={{ marginTop: 24, maxWidth: 240, margin: "24px auto 0" }}
            >
              <input
                value={code}
                onChange={e =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                maxLength={6}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 20,
                  textAlign: "center",
                  letterSpacing: 8,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={handleConfirm}
              disabled={code.length !== 6}
              style={{
                marginTop: 16,
                padding: "12px 28px",
                borderRadius: 10,
                background:
                  code.length === 6
                    ? "linear-gradient(135deg,#d900ff,#d900ff)"
                    : "rgba(99,102,241,0.3)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: code.length === 6 ? "pointer" : "not-allowed",
              }}
            >
              Verify & Enable
            </button>
          </div>
        )}

        {step === "done" && (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <CheckCircle2
              size={48}
              style={{ color: "#10b981", marginBottom: 16 }}
            />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
              MFA Enabled
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
              Save these backup codes securely. They can each be used once if
              you lose access to your authenticator.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 8,
                maxWidth: 320,
                margin: "0 auto",
              }}
            >
              {backupCodes.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: "#e2e8f0",
                  }}
                >
                  {c}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/yalla-hack-owners-console/dashboard")}
              style={{
                marginTop: 24,
                padding: "12px 28px",
                borderRadius: 10,
                background: "linear-gradient(135deg,#d900ff,#d900ff)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
