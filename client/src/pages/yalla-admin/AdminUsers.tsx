/**
 * Yalla Hack Super Admin — User Management
 * Search, filter, view, and manage platform users.
 * Founders can suspend/reactivate, change roles, delete users, and
 * inspect full user details (profile, memberships, recent activity).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  X,
  Ban,
  CheckCircle2,
  Trash2,
  UserCog,
  Download,
  AlertTriangle,
} from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";

const ROLES = [
  "visitor",
  "basic_user",
  "professional_user",
  "company_admin",
  "admin",
  "platform_admin",
  "yalla_hack_employee",
  "super_admin",
] as const;

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

interface UserDetail extends AdminUser {
  organizationMemberships: Array<{
    orgId: number;
    orgName: string;
    role: string;
    joinedAt: string | null;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    category: string;
    createdAt: string | null;
  }>;
}

export default function AdminUsers() {
  usePageTitle("User Management — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [busyIds, setBusyIds] = useState<Set<number>>(new Set());
  const [notice, setNotice] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const limit = 25;

  const flash = useCallback((kind: "ok" | "error", text: string) => {
    setNotice({ kind, text });
    window.setTimeout(() => setNotice(null), 4000);
  }, []);

  // Debounce search input before querying the API
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(page * limit),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter) params.set("status", statusFilter);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`${ADMIN_API}/users?${params}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setLoadError("");
    } catch (e) {
      setLoadError(`Could not load users: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, roleFilter, navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!selectedUser) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    fetch(`${ADMIN_API}/users/${selectedUser.id}`, { credentials: "include" })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  const markBusy = (id: number) => setBusyIds(prev => new Set(prev).add(id));
  const unmarkBusy = (id: number) =>
    setBusyIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  async function toggleSuspend(user: AdminUser) {
    const suspend = user.status !== "suspended";
    markBusy(user.id);
    try {
      const res = await fetch(`${ADMIN_API}/users/${user.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ suspend }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        flash(
          "error",
          data?.error || `Failed to ${suspend ? "suspend" : "reactivate"} user.`
        );
        return;
      }
      flash(
        "ok",
        `${user.email || user.name} ${suspend ? "suspended" : "reactivated"}.`
      );
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id
            ? { ...u, status: suspend ? "suspended" : "active" }
            : u
        )
      );
    } catch {
      flash("error", "Network error. Please try again.");
    } finally {
      unmarkBusy(user.id);
    }
  }

  async function changeRole(user: AdminUser, role: string) {
    markBusy(user.id);
    try {
      const res = await fetch(`${ADMIN_API}/users/${user.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        flash("error", data?.error || "Failed to change role.");
        return;
      }
      flash("ok", `Role updated to ${role}.`);
      setUsers(prev => prev.map(u => (u.id === user.id ? { ...u, role } : u)));
    } catch {
      flash("error", "Network error. Please try again.");
    } finally {
      unmarkBusy(user.id);
    }
  }

  async function deleteUser(user: AdminUser) {
    markBusy(user.id);
    try {
      const res = await fetch(`${ADMIN_API}/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        flash("error", data?.error || "Failed to delete user.");
        return;
      }
      flash("ok", "User deleted.");
      setConfirmDelete(null);
      setSelectedUser(null);
      loadUsers();
    } catch {
      flash("error", "Network error. Please try again.");
    } finally {
      unmarkBusy(user.id);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  function exportCsv() {
    const header = [
      "id",
      "name",
      "email",
      "role",
      "status",
      "company",
      "orgs",
      "last_login",
      "created",
    ];
    const rows = users.map(u =>
      [
        u.id,
        u.name ?? "",
        u.email ?? "",
        u.role,
        u.status,
        u.companyName ?? "",
        u.orgCount,
        u.lastSignedIn ? new Date(u.lastSignedIn).toISOString() : "",
        u.createdAt ? new Date(u.createdAt).toISOString() : "",
      ]
        .map(v => {
          const s = String(v ?? "");
          return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-page${page + 1}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Inter', sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* Header */}
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
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Users</h1>
          <span style={{ fontSize: 12, color: "#7d8aa0" }}>
            {total.toLocaleString()} total
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={exportCsv}
            disabled={users.length === 0}
            title="Export current page as CSV"
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              color: users.length === 0 ? "#475569" : "#94a3b8",
              cursor: users.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <Download size={14} />
          </button>
          <button
            onClick={loadUsers}
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
        </div>
      </header>

      <main style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        {loadError && (
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
            {loadError}
          </div>
        )}
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

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
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
              onChange={e => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name, email, company..."
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
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="">All Roles</option>
            {ROLES.map(r => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* User Table */}
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
                <th style={thStyle}>User</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Orgs</th>
                <th style={thStyle}>Last Login</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#7d8aa0",
                    }}
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr
                    key={user.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500 }}>{user.name || "—"}</div>
                      <div style={{ fontSize: 12, color: "#7d8aa0" }}>
                        {user.email || "—"}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={user.status} />
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                      {user.role}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                      {user.orgCount}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#7d8aa0",
                        fontSize: 12,
                      }}
                    >
                      {user.lastSignedIn
                        ? new Date(user.lastSignedIn).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <ActionButton
                          title="Open full timeline"
                          onClick={() =>
                            navigate(
                              `/yalla-hack-owners-console/users/${user.id}`
                            )
                          }
                        >
                          <Eye size={14} />
                        </ActionButton>
                        <ActionButton
                          title="Quick profile"
                          onClick={() => setSelectedUser(user)}
                        >
                          <UserCog size={14} />
                        </ActionButton>
                        <ActionButton
                          title={
                            user.status === "suspended"
                              ? "Reactivate"
                              : "Suspend"
                          }
                          danger={user.status !== "suspended"}
                          disabled={busyIds.has(user.id)}
                          onClick={() => toggleSuspend(user)}
                        >
                          {user.status === "suspended" ? (
                            <CheckCircle2 size={14} />
                          ) : (
                            <Ban size={14} />
                          )}
                        </ActionButton>
                        <select
                          title="Change role"
                          value={user.role}
                          disabled={busyIds.has(user.id)}
                          onChange={e => changeRole(user, e.target.value)}
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: 6,
                            color: "#94a3b8",
                            fontSize: 11,
                            padding: "4px 6px",
                            outline: "none",
                            maxWidth: 130,
                          }}
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <ActionButton
                          title="Delete user"
                          danger
                          disabled={busyIds.has(user.id)}
                          onClick={() => setConfirmDelete(user)}
                        >
                          <Trash2 size={14} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 20,
            }}
          >
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                cursor: page === 0 ? "not-allowed" : "pointer",
                opacity: page === 0 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
                opacity: page >= totalPages - 1 ? 0.5 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: 24,
          }}
          onClick={() => setSelectedUser(null)}
        >
          <div
            style={{
              background: "#0b0b14",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              maxWidth: 640,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              padding: 24,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <UserCog size={18} style={{ color: "#d900ff" }} />
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  {selectedUser.name ||
                    selectedUser.email ||
                    `User #${selectedUser.id}`}
                </h2>
                <StatusBadge status={selectedUser.status} />
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#7d8aa0",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {detailLoading ? (
              <p style={{ fontSize: 13, color: "#7d8aa0" }}>
                Loading details...
              </p>
            ) : detail ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <DetailField label="Email" value={detail.email || "—"} />
                  <DetailField
                    label="Phone"
                    value={detail.phoneNumber || "—"}
                  />
                  <DetailField label="Role" value={detail.role} />
                  <DetailField
                    label="Company"
                    value={detail.companyName || "—"}
                  />
                  <DetailField
                    label="Job Title"
                    value={detail.jobTitle || "—"}
                  />
                  <DetailField
                    label="Industry"
                    value={detail.industry || "—"}
                  />
                  <DetailField
                    label="Locale"
                    value={detail.preferredLocale || "—"}
                  />
                  <DetailField
                    label="Signed Up"
                    value={
                      detail.createdAt
                        ? new Date(detail.createdAt).toLocaleString()
                        : "—"
                    }
                  />
                  <DetailField
                    label="Last Login"
                    value={
                      detail.lastSignedIn
                        ? new Date(detail.lastSignedIn).toLocaleString()
                        : "Never"
                    }
                  />
                  <DetailField
                    label="Organizations"
                    value={String(detail.orgCount)}
                  />
                </div>

                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#94a3b8",
                    margin: "0 0 10px",
                  }}
                >
                  Organization Memberships
                </h3>
                {detail.organizationMemberships.length === 0 ? (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#7d8aa0",
                      margin: "0 0 20px",
                    }}
                  >
                    No active memberships.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginBottom: 20,
                    }}
                  >
                    {detail.organizationMemberships.map(m => (
                      <div
                        key={m.orgId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: "#e2e8f0" }}>{m.orgName}</span>
                        <span style={{ color: "#7d8aa0" }}>
                          {m.role} ·{" "}
                          {m.joinedAt
                            ? new Date(m.joinedAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#94a3b8",
                    margin: "0 0 10px",
                  }}
                >
                  Recent Activity
                </h3>
                {detail.recentActivity.length === 0 ? (
                  <p style={{ fontSize: 12, color: "#7d8aa0", margin: 0 }}>
                    No recent activity.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {detail.recentActivity.slice(0, 10).map(a => (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 12,
                          padding: "6px 0",
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <span style={{ color: "#94a3b8" }}>
                          {a.category} / {a.action}
                        </span>
                        <span style={{ color: "#7d8aa0" }}>
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleString()
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: 13, color: "#ef4444" }}>
                Failed to load user details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 24,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: "#0b0b14",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 14,
              maxWidth: 420,
              width: "100%",
              padding: 24,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 10px" }}>
              Delete user?
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 20px" }}>
              This permanently deletes{" "}
              <strong style={{ color: "#fff" }}>
                {confirmDelete.name || confirmDelete.email}
              </strong>{" "}
              and their memberships, onboarding data and audit trail. This
              cannot be undone.
            </p>
            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#e2e8f0",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                disabled={busyIds.has(confirmDelete.id)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  background: "rgba(239,68,68,0.9)",
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busyIds.has(confirmDelete.id)
                    ? "not-allowed"
                    : "pointer",
                  opacity: busyIds.has(confirmDelete.id) ? 0.6 : 1,
                }}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: "#94a3b8",
  fontWeight: 600,
  fontSize: 11,
  textTransform: "uppercase",
};

function ActionButton({
  title,
  danger,
  disabled,
  onClick,
  children,
}: {
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: danger ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.04)",
        border: danger
          ? "1px solid rgba(239,68,68,0.25)"
          : "1px solid rgba(255,255,255,0.1)",
        borderRadius: 6,
        padding: "4px 8px",
        color: danger ? "#ef4444" : "#94a3b8",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {children}
    </button>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "#7d8aa0",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: "#e2e8f0" }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    active: {
      bg: "rgba(74,222,128,0.1)",
      border: "rgba(74,222,128,0.25)",
      text: "#10b981",
    },
    pending: {
      bg: "rgba(245,158,11,0.1)",
      border: "rgba(245,158,11,0.25)",
      text: "#f59e0b",
    },
    suspended: {
      bg: "rgba(248,113,113,0.1)",
      border: "rgba(248,113,113,0.25)",
      text: "#ef4444",
    },
  };
  const c = colors[status] || colors.pending;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      {status}
    </span>
  );
}
