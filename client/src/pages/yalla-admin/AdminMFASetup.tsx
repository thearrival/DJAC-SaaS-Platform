/**
 * Yalla Hack Super Admin — MFA Setup
 * Enable TOTP two-factor authentication for admin accounts.
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Shield, QrCode, Key, CheckCircle2, AlertTriangle } from "lucide-react";

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

  useEffect(() => {
    fetch(`${ADMIN_API}/me`, { credentials: "include" }).then(res => {
      if (res.status === 401) navigate("/yalla-hack-owners-console/login");
    });
  }, [navigate]);

  async function handleSetup() {
    setError("");
    try {
      const res = await fetch(`${ADMIN_API}/2fa/setup`, { method: "POST", credentials: "include" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Setup failed"); return; }
      const data = await res.json();
      setQrDataUrl(data.qrDataUrl);
      setSecret(data.secret);
      setStep("confirm");
    } catch { setError("Network error"); }
  }

  async function handleConfirm() {
    setError("");
    try {
      const res = await fetch(`${ADMIN_API}/2fa/confirm`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ code }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Invalid code"); return; }
      const data = await res.json();
      setBackupCodes(data.backupCodes || []);
      setStep("done");
    } catch { setError("Network error"); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Inter', sans-serif", color: "#e2e8f0", padding: 24 }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 0", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/yalla-hack-owners-console/dashboard")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>←</button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Two-Factor Authentication</h1>
        </div>
      </header>
      <main style={{ maxWidth: 480, margin: "0 auto" }}>
        {error && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: 13, marginBottom: 16 }}><AlertTriangle size={14} />{error}</div>}
        
        {step === "setup" && (
          <div style={{ textAlign: "center", padding: 32, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
            <Shield size={48} style={{ color: "#6366f1", marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Secure Your Account</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 24px" }}>Add an extra layer of security using an authenticator app.</p>
            <button onClick={handleSetup} style={{ padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>Begin Setup</button>
          </div>
        )}

        {step === "confirm" && (
          <div style={{ textAlign: "center", padding: 32, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
            <img src={qrDataUrl} alt="MFA QR Code" style={{ width: 120, height: 120, marginBottom: 16, borderRadius: 8, padding: 8, background: "#fff" }} />
            <p style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Or enter manually:</p>
            <code style={{ fontSize: 11, color: "#a855f7", wordBreak: "break-all" }}>{secret}</code>
            <div style={{ marginTop: 24, maxWidth: 240, margin: "24px auto 0" }}>
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} style={{ width: "100%", padding: "12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 20, textAlign: "center", letterSpacing: 8, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={handleConfirm} disabled={code.length !== 6} style={{ marginTop: 16, padding: "12px 28px", borderRadius: 10, background: code.length === 6 ? "linear-gradient(135deg,#6366f1,#a855f7)" : "rgba(99,102,241,0.3)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: code.length === 6 ? "pointer" : "not-allowed" }}>Verify & Enable</button>
          </div>
        )}

        {step === "done" && (
          <div style={{ textAlign: "center", padding: 32, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
            <CheckCircle2 size={48} style={{ color: "#4ade80", marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>MFA Enabled</h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>Save these backup codes securely. They can each be used once if you lose access to your authenticator.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, maxWidth: 320, margin: "0 auto" }}>
              {backupCodes.map((c, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, fontFamily: "monospace", color: "#e2e8f0" }}>{c}</div>
              ))}
            </div>
            <button onClick={() => navigate("/yalla-hack-owners-console/dashboard")} style={{ marginTop: 24, padding: "12px 28px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>Done</button>
          </div>
        )}
      </main>
    </div>
  );
}
