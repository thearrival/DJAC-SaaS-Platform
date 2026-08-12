/**
 * Yalla Hack Founders Portal — Login Page
 * Professional login for Yalla Hack founders and managers.
 * Manages all DJAC platform users, subscriptions, and operations.
 */
import { useState } from "react";
import type React from "react";
import { APP_TITLE, APP_LOGO } from "@/const";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Shield,
  Lock,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
  BarChart3,
  CreditCard,
  Building2,
} from "lucide-react";

const ADMIN_API = "/api/yalla-admin";

export default function FoundersLogin() {
  usePageTitle("Yalla Hack Founders — DJAC Admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/react-login`, {
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
        fontFamily: "'Inter', sans-serif",
        display: "flex",
      }}
    >
      {/* Left Panel — Branding */}
      <div
        style={{
          flex: "1 1 45%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background:
            "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0a0a0f 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-30%",
            width: "80%",
            height: "200%",
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 48,
            }}
          >
            <img src={APP_LOGO} alt={APP_TITLE} style={{ height: 40 }} />
            <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>
              DJAC
            </span>
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.2,
              margin: "0 0 16px",
            }}
          >
            Yalla Hack
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Founders Portal
            </span>
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#94a3b8",
              lineHeight: 1.6,
              marginBottom: 40,
              maxWidth: 380,
            }}
          >
            Manage all DJAC platform users, subscriptions, and operations. Full
            visibility and control from A to Z.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              {
                icon: <Users size={16} />,
                label: "User Management",
                desc: "View, suspend, and manage all users",
              },
              {
                icon: <CreditCard size={16} />,
                label: "Subscription Control",
                desc: "Monitor plans, revenue, and billing",
              },
              {
                icon: <Building2 size={16} />,
                label: "Organization Oversight",
                desc: "Manage tenant orgs and members",
              },
              {
                icon: <BarChart3 size={16} />,
                label: "Platform Analytics",
                desc: "Track usage, growth, and trends",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#a5b4fc",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div
        style={{
          flex: "1 1 55%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div style={{ maxWidth: 400, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.25)",
                fontSize: 11,
                color: "#a5b4fc",
                fontWeight: 600,
                letterSpacing: "0.05em",
                marginBottom: 16,
              }}
            >
              <Shield size={12} />
              SECURE ACCESS
            </div>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#fff",
                margin: "0 0 8px",
              }}
            >
              Welcome Back
            </h2>
            <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>
              Sign in to the Yalla Hack Founders Portal
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Username
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="Enter your username"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
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
              <label
                style={{
                  fontSize: 12,
                  color: "#94a3b8",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock
                  size={13}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#64748b",
                  }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 40px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontSize: 14,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
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
                padding: "14px",
                borderRadius: 10,
                background: loading
                  ? "rgba(99,102,241,0.5)"
                  : "linear-gradient(135deg, #6366f1, #a855f7)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                marginTop: 8,
              }}
            >
              {loading ? "Authenticating..." : "Sign In to Founders Portal"}
            </button>
          </form>

          <p
            style={{
              fontSize: 11,
              color: "#64748b",
              textAlign: "center",
              marginTop: 32,
              marginBottom: 0,
            }}
          >
            Protected by IP allowlist, rate limiting, and session controls. All
            actions are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
