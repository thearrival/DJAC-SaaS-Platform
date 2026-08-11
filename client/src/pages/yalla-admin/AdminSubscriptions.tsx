/**
 * Yalla Hack Super Admin — Subscription Management
 * View and manage platform subscriptions, billing events, and revenue.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { CreditCard, RefreshCw, ChevronLeft, DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";

interface Subscription {
  id: number; plan: string; status: string; billingInterval: string;
  amountCents: number; currency: string; organizationName: string;
  billingEmail: string; currentPeriodEnd: string; cancelAtPeriodEnd: number;
}

interface SubSummary {
  subscriptions: Subscription[];
  summary: Array<{ plan: string; status: string; count: number; totalAmountCents: number }>;
}

export default function AdminSubscriptions() {
  usePageTitle("Subscriptions — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [data, setData] = useState<SubSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_API}/subscriptions`, { credentials: "include" });
      if (res.status === 401) { navigate("/yalla-hack-owners-console/login"); return; }
      setData(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = data?.subscriptions?.filter(s => filter === "all" || s.status === filter) || [];
  const totalMRR = data?.summary?.reduce((sum, s) => sum + (s.status === "active" ? s.totalAmountCents : 0), 0) || 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/yalla-hack-owners-console/dashboard")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}><ChevronLeft size={18} /></button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Subscriptions</h1>
        </div>
        <button onClick={loadData} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#94a3b8", cursor: "pointer" }}><RefreshCw size={14} /></button>
      </header>

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {/* Revenue Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,25,0.8)" }}>
            <DollarSign size={18} style={{ color: "#4ade80", marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 800, color: "#4ade80" }}>${(totalMRR / 100).toLocaleString()}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Monthly Revenue</div>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,25,0.8)" }}>
            <Users size={18} style={{ color: "#6366f1", marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 800, color: "#6366f1" }}>{data?.subscriptions?.length || 0}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Total Subscriptions</div>
          </div>
          <div style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,25,0.8)" }}>
            <TrendingUp size={18} style={{ color: "#f59e0b", marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{data?.summary?.filter(s => s.status === "active").length || 0}</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Active Plans</div>
          </div>
        </div>

        {/* Filter */}
        <div style={{ marginBottom: 16 }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13 }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Organization</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Plan</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Amount</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Period End</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>No subscriptions found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 500 }}>{s.organizationName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{s.billingEmail}</div>
                  </td>
                  <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>{s.plan} / {s.billingInterval}</td>
                  <td style={{ padding: "12px 16px" }}><SubStatus status={s.status} /></td>
                  <td style={{ padding: "12px 16px" }}>${(s.amountCents / 100).toFixed(2)}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function SubStatus({ status }: { status: string }) {
  const colors: Record<string, string> = { active: "#4ade80", trialing: "#22d3ee", past_due: "#f59e0b", canceled: "#f87171", incomplete: "#94a3b8" };
  return <span style={{ fontSize: 11, fontWeight: 600, color: colors[status] || "#94a3b8" }}>{status}</span>;
}
