/**
 * Yalla Hack Super Admin — User Management
 * Search, filter, view, and manage platform users.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Search, Filter, ChevronLeft, ChevronRight, RefreshCw,
  UserCheck, UserX, Shield, Building2, Mail, Calendar,
  MoreVertical, Eye,
} from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";

interface AdminUser {
  id: number;
  source: "local" | "oauth";
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  companyName: string | null;
  jobTitle: string | null;
  industry: string | null;
  preferredLocale: string;
  lastSignedIn: string | null;
  createdAt: string | null;
  orgCount: number;
}

export default function AdminUsers() {
  usePageTitle("User Management — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const limit = 25;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${ADMIN_API}/users?${params}`, { credentials: "include" });
      if (res.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleSuspend(userId: number, suspend: boolean) {
    const action = suspend ? "suspend" : "activate";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await fetch(`${ADMIN_API}/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ suspend }),
      });
      if (res.ok) loadUsers();
    } catch {
      // silent
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/yalla-hack-owners-console/dashboard")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}>
            <ChevronLeft size={18} />
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Users</h1>
          <span style={{ fontSize: 12, color: "#64748b" }}>{total.toLocaleString()} total</span>
        </div>
        <button onClick={loadUsers} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#94a3b8", cursor: "pointer" }}>
          <RefreshCw size={14} />
        </button>
      </header>

      <main style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by name, email, company..."
              style={{
                width: "100%", padding: "10px 14px 10px 36px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
            style={{
              padding: "10px 14px", borderRadius: 8,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", fontSize: 13, outline: "none",
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* User Table */}
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>User</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Role</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Orgs</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Last Login</th>
                <th style={{ padding: "12px 16px", textAlign: "right", color: "#94a3b8", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>No users found</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{user.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{user.email || "—"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={user.status} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{user.role}</td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{user.orgCount}</td>
                    <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12 }}>
                      {user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : "Never"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => setSelectedUser(user)}
                        style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "4px 8px", color: "#94a3b8", cursor: "pointer" }}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}>
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: page >= totalPages - 1 ? "not-allowed" : "pointer", opacity: page >= totalPages - 1 ? 0.5 : 1 }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    active: { bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.25)", text: "#4ade80" },
    pending: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", text: "#f59e0b" },
    suspended: { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)", text: "#f87171" },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {status}
    </span>
  );
}
