/**
 * Yalla Hack Super Admin — Organization Management
 * View and manage tenant organizations.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { RefreshCw, ChevronLeft, Search } from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";

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

  const filtered = orgs.filter(
    o => !search || o.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
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
          <span style={{ fontSize: 12, color: "#64748b" }}>
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
        <div style={{ position: "relative", maxWidth: 320, marginBottom: 20 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#64748b",
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
                      <div style={{ fontSize: 12, color: "#64748b" }}>
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
                        color: "#64748b",
                        fontSize: 12,
                      }}
                    >
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleDateString()
                        : "—"}
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
