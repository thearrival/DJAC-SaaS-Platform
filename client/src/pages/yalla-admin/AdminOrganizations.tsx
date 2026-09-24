/**
 * Yalla Hack Super Admin — Organization Management
 * View and manage tenant organizations.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  RefreshCw,
  ChevronLeft,
  Search,
  Ban,
  CheckCircle2,
} from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";
const YALLA_API = "/api/yalla-admin";

interface Org {
  id: number;
  name: string;
  plan: string;
  status: string;
  memberCount: number;
  createdAt: string;
  lastActivity: string;
}

export default function AdminOrganizations() {
  usePageTitle("Organizations — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  const flash = useCallback((kind: "ok" | "error", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_API}/organizations`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      setOrgs(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleSuspend(org: Org) {
    const suspend = org.status !== "suspended";
    setBusyIds(prev => new Set(prev).add(org.id));
    try {
      const res = await fetch(`${YALLA_API}/orgs/${org.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ suspend }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        flash(
          "error",
          data?.error ||
            `Failed to ${suspend ? "suspend" : "reactivate"} organization.`
        );
        return;
      }
      flash("ok", `${org.name} ${suspend ? "suspended" : "reactivated"}.`);
      setOrgs(prev =>
        prev.map(o =>
          o.id === org.id
            ? { ...o, status: suspend ? "suspended" : "active" }
            : o
        )
      );
    } catch {
      flash("error", "Network error. Please try again.");
    } finally {
      setBusyIds(prev => {
        const next = new Set(prev);
        next.delete(org.id);
        return next;
      });
    }
  }

  const filtered = orgs.filter(
    o => !search || o.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Inter', sans-serif",
        color: "#e2e8f0",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/yalla-hack-owners-console/dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Organizations
          </h1>
          <span style={{ fontSize: 12, color: "#7d8aa0" }}>
            {orgs.length} total
          </span>
        </div>
        <button
          onClick={loadData}
          style={{
            background: "none",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            padding: "6px 10px",
            color: "#94a3b8",
            cursor: "pointer",
          }}
        >
          <RefreshCw size={14} />
        </button>
      </header>

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {notice && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              background:
                notice.kind === "ok"
                  ? "rgba(74,222,128,0.08)"
                  : "rgba(239,68,68,0.08)",
              border:
                notice.kind === "ok"
                  ? "1px solid rgba(74,222,128,0.3)"
                  : "1px solid rgba(239,68,68,0.3)",
              color: notice.kind === "ok" ? "#10b981" : "#ef4444",
              fontSize: 13,
            }}
          >
            {notice.kind === "ok" ? (
              <CheckCircle2 size={14} />
            ) : (
              <Ban size={14} />
            )}
            {notice.text}
          </div>
        )}
        <div style={{ position: "relative", maxWidth: 320, marginBottom: 20 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#7d8aa0",
            }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search organizations..."
            style={{
              width: "100%",
              padding: "10px 14px 10px 36px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Organization
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Plan
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Members
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Created
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#7d8aa0",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#7d8aa0",
                    }}
                  >
                    No organizations found
                  </td>
                </tr>
              ) : (
                filtered.map(o => (
                  <tr
                    key={o.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{o.name}</div>
                      <div style={{ fontSize: 12, color: "#7d8aa0" }}>
                        ID: {o.id}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textTransform: "capitalize",
                      }}
                    >
                      {o.plan}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                      {o.memberCount}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#7d8aa0",
                        fontSize: 12,
                      }}
                    >
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <OrgStatusBadge status={o.status} />
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        title={
                          o.status === "suspended"
                            ? "Reactivate organization"
                            : "Suspend organization"
                        }
                        onClick={() => toggleSuspend(o)}
                        disabled={busyIds.has(o.id)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background:
                            o.status === "suspended"
                              ? "rgba(74,222,128,0.08)"
                              : "rgba(239,68,68,0.08)",
                          border:
                            o.status === "suspended"
                              ? "1px solid rgba(74,222,128,0.25)"
                              : "1px solid rgba(239,68,68,0.25)",
                          color:
                            o.status === "suspended" ? "#10b981" : "#ef4444",
                          cursor: busyIds.has(o.id) ? "not-allowed" : "pointer",
                          opacity: busyIds.has(o.id) ? 0.5 : 1,
                        }}
                      >
                        {o.status === "suspended" ? (
                          <>
                            <CheckCircle2 size={13} /> Reactivate
                          </>
                        ) : (
                          <>
                            <Ban size={13} /> Suspend
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function OrgStatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        background: isActive ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
        border: isActive
          ? "1px solid rgba(74,222,128,0.25)"
          : "1px solid rgba(248,113,113,0.25)",
        color: isActive ? "#10b981" : "#ef4444",
      }}
    >
      {isActive ? "active" : "suspended"}
    </span>
  );
}
