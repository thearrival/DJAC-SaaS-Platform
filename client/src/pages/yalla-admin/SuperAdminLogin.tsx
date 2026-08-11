/**
 * Yalla Hack Super Admin — Login Page
 * Secure authentication for internal administrators.
 */
import { useState } from "react";
import type React from "react";
import { APP_TITLE, APP_LOGO } from "@/const";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Lock, AlertTriangle, Shield } from "lucide-react";

const ADMIN_API = "/api/yalla-admin";

export default function SuperAdminLogin() {
  usePageTitle("Yalla Hack Admin — Login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      window.location.href = "/yalla-hack-owners-console/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          padding: 40,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15,15,25,0.95)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={APP_LOGO} alt={APP_TITLE} style={{ height: 36, marginBottom: 16 }} />
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 20,
              background: "rgba(220,38,38,0.12)",
              border: "1px solid rgba(220,38,38,0.3)",
              fontSize: 11,
              color: "#f87171",
              fontWeight: 600,
              letterSpacing: "0.05em",
              marginBottom: 12,
            }}
          >
            <Shield size={12} />
            YALLA HACK INTERNAL
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: "0 0 8px" }}>
            Super Admin
          </h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
            Authorized personnel only. All actions are logged.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Username
            </label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={13}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 34px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

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
                color: "#fca5a5",
                fontSize: 13,
              }}
            >
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              borderRadius: 10,
              background: loading ? "rgba(168,85,247,0.5)" : "linear-gradient(135deg,#dc2626,#7c3aed)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <p style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 20, marginBottom: 0 }}>
          Protected by IP allowlist, rate limiting, and session controls.
        </p>
      </div>
    </div>
  );
}
