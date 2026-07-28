import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";

type UnifiedUser = {
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
};

type UserStats = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  newThisMonth: number;
  localUsers: number;
  oauthUsers: number;
  byRole: Record<string, number>;
};

type UserDetail = UnifiedUser & {
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
};

type ActivityEvent = {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  category: string;
  target: string | null;
  outcome: string | null;
  ipAddress: string | null;
  createdAt: string | null;
};

type RegistrationData = { month: string; count: number };

const API_BASE = "/api/admin-dashboard";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    if (res.status === 401)
      window.location.href = "/yalla-hack-owners-console/login";
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-bold ${color}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function Badge({ variant }: { variant: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
    suspended: "bg-red-500/10 text-red-600 border-red-200",
    pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${styles[variant] ?? "bg-slate-500/10 text-slate-600 border-slate-200"}`}
    >
      {variant}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    admin: "bg-violet-500/10 text-violet-600 border-violet-200",
    super_admin: "bg-purple-500/10 text-purple-600 border-purple-200",
    platform_admin: "bg-blue-500/10 text-blue-600 border-blue-200",
    yalla_hack_employee: "bg-cyan-500/10 text-cyan-600 border-cyan-200",
    professional_user: "bg-indigo-500/10 text-indigo-600 border-indigo-200",
    basic_user: "bg-slate-500/10 text-slate-600 border-slate-200",
    visitor: "bg-gray-500/10 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[role] ?? "bg-slate-500/10 text-slate-600 border-slate-200"}`}
    >
      {role}
    </span>
  );
}

function AreaChart({ data }: { data: RegistrationData[] }) {
  if (!data.length)
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No registration data available
      </p>
    );
  const max = Math.max(...data.map(d => d.count), 1);
  const points = data
    .map((d, i) => {
      const x = `${(i / (data.length - 1)) * 100}%`;
      const y = `${(1 - d.count / max) * 100}%`;
      return `${x} ${y}`;
    })
    .join(" ");
  const areaPoints = `0% 100% ${points} 100% 100%`;

  return (
    <svg
      viewBox="0 0 100 40"
      className="w-full h-32"
      preserveAspectRatio="none"
    >
      <polygon points={areaPoints} fill="hsl(var(--primary) / 0.1)" />
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="0.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => (
        <circle
          key={d.month}
          cx={`${(i / (data.length - 1)) * 100}%`}
          cy={`${(1 - d.count / max) * 100}%`}
          r="0.6"
          fill="hsl(var(--primary))"
        />
      ))}
    </svg>
  );
}

function PieChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  if (!entries.length)
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
    );
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const colors = [
    "hsl(var(--primary))",
    "#818cf8",
    "#34d399",
    "#fbbf24",
    "#f87171",
    "#a78bfa",
    "#2dd4bf",
    "#94a3b8",
  ];
  let cumulative = 0;
  const segments = entries.map(([label, value], i) => {
    const start = (cumulative / total) * 100;
    cumulative += value;
    const end = (cumulative / total) * 100;
    return { label, value, color: colors[i % colors.length], start, end };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
        {segments.map(s => {
          const startAngle = (s.start / 100) * 360 - 90;
          const endAngle = (s.end / 100) * 360 - 90;
          const largeArc = s.end - s.start > 50 ? 1 : 0;
          const x1 = 50 + 45 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 50 + 45 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 50 + 45 * Math.cos((endAngle * Math.PI) / 180);
          const y2 = 50 + 45 * Math.sin((endAngle * Math.PI) / 180);
          return (
            <path
              key={s.label}
              d={`M50 50 L${x1} ${y1} A45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={s.color}
              stroke="hsl(var(--background))"
              strokeWidth="1"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="hsl(var(--background))" />
      </svg>
      <div className="space-y-1">
        {segments.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-foreground capitalize">{s.label}</span>
            <span className="font-medium ml-auto">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserDetailPanel({
  user,
  onClose,
}: {
  user: UserDetail;
  onClose: () => void;
}) {
  const [suspending, setSuspending] = useState(false);

  const handleSuspend = async () => {
    setSuspending(true);
    try {
      await apiFetch(`/users/${user.id}/suspend`, {
        method: "POST",
        body: JSON.stringify({ suspend: user.status !== "suspended" }),
      });
      location.reload();
    } catch (e) {
      console.error("Failed to suspend user:", e);
      setSuspending(false);
    }
  };

  const handleRoleChange = async (role: string) => {
    try {
      await apiFetch(`/users/${user.id}/role`, {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      location.reload();
    } catch (e) {
      console.error("Failed to change role:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background border-l border-border shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">User Detail</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
              {user.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-lg">{user.name ?? "Unknown"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">ID</span>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Source</span>
              <p className="font-medium capitalize">{user.source}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <Badge variant={user.status} />
            </div>
            <div>
              <span className="text-muted-foreground">Role</span>
              <RoleBadge role={user.role} />
            </div>
            <div>
              <span className="text-muted-foreground">Phone</span>
              <p className="font-medium">{user.phoneNumber ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Locale</span>
              <p className="font-medium uppercase">{user.preferredLocale}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Company</span>
              <p className="font-medium">{user.companyName ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Job Title</span>
              <p className="font-medium">{user.jobTitle ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Industry</span>
              <p className="font-medium">{user.industry ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Organizations</span>
              <p className="font-medium">{user.orgCount}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Joined</span>
              <p className="font-medium">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Active</span>
              <p className="font-medium">
                {user.lastSignedIn
                  ? new Date(user.lastSignedIn).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="font-semibold text-sm">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSuspend}
                disabled={suspending}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${user.status === "suspended" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20"}`}
              >
                {suspending
                  ? "..."
                  : user.status === "suspended"
                    ? "Reactivate"
                    : "Suspend"}
              </button>
              <select
                onChange={e => handleRoleChange(e.target.value)}
                defaultValue=""
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background"
              >
                <option value="" disabled>
                  Change Role
                </option>
                <option value="basic_user">Basic User</option>
                <option value="professional_user">Professional</option>
                <option value="company_admin">Company Admin</option>
                <option value="platform_admin">Platform Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          {user.organizationMemberships.length > 0 && (
            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Organizations</h3>
              {user.organizationMemberships.map(m => (
                <div
                  key={m.orgId}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{m.orgName}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {m.role}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {m.joinedAt
                      ? new Date(m.joinedAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          {user.recentActivity.length > 0 && (
            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="font-semibold text-sm">Recent Activity</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {user.recentActivity.map(a => (
                  <div
                    key={a.id}
                    className="flex items-start gap-2 text-xs py-1.5 border-b border-border last:border-0"
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-primary/50" />
                    <div>
                      <p className="font-medium capitalize">
                        {a.action.replace(/_/g, " ")}
                      </p>
                      <p className="text-muted-foreground">
                        {a.category}
                        {a.createdAt
                          ? ` · ${new Date(a.createdAt).toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [total, setTotal] = useState(0);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const PAGE_SIZE = 20;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, userData, activityData, regData] = await Promise.all([
        apiFetch<UserStats>("/users/stats"),
        apiFetch<{ users: UnifiedUser[]; total: number }>(
          `/users?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}${search ? `&search=${encodeURIComponent(search)}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`
        ),
        apiFetch<ActivityEvent[]>("/activity?limit=20"),
        apiFetch<RegistrationData[]>("/users/registrations?months=12"),
      ]);
      setStats(statsData);
      setUsers(userData.users);
      setTotal(userData.total);
      setActivity(activityData);
      setRegistrations(regData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (userId: number) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this user? This action cannot be undone."
      )
    )
      return;
    setDeleting(userId);
    try {
      await apiFetch(`/users/${userId}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      console.error("Failed to delete user:", e);
    } finally {
      setDeleting(null);
    }
  };

  const openUserDetail = async (userId: number) => {
    try {
      const detail = await apiFetch<UserDetail>(`/users/${userId}`);
      setSelectedUser(detail);
    } catch (e) {
      console.error("Failed to load user detail:", e);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/yalla-hack-owners-console")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Portal
            </button>
            <h1 className="text-xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
          </div>
          <span className="text-xs text-muted-foreground">
            Yalla Hack Management Console
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-500/5 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading && !stats ? (
          <Spinner />
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Total Users"
                  value={stats.totalUsers}
                  color="text-foreground"
                />
                <StatCard
                  label="Active"
                  value={stats.activeUsers}
                  color="text-emerald-600"
                />
                <StatCard
                  label="New This Month"
                  value={stats.newThisMonth}
                  color="text-blue-600"
                />
                <StatCard
                  label="Suspended"
                  value={stats.suspendedUsers}
                  color="text-red-600"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-3">
                  User Growth (12 Months)
                </h2>
                <AreaChart data={registrations} />
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold mb-3">User Types</h2>
                {stats && <PieChart data={stats.byRole} />}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <h2 className="text-sm font-semibold">All Registered Users</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search name, email, company..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    className="flex-1 sm:w-64 px-3 py-1.5 text-sm rounded-lg border border-border bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <select
                    value={statusFilter}
                    onChange={e => {
                      setStatusFilter(e.target.value);
                      setPage(0);
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        User
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                        Contact
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                        Joined
                      </th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-12 text-muted-foreground text-sm"
                        >
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr
                          key={`${u.source}-${u.id}`}
                          className="border-b border-border hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => openUserDetail(u.id)}
                              className="flex items-center gap-3 text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                              </div>
                              <div>
                                <p className="font-medium text-sm hover:text-primary transition-colors">
                                  {u.name ?? "Unknown"}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {u.source} · {u.companyName ?? "—"}
                                </p>
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            <p className="text-xs">{u.email ?? "—"}</p>
                            <p className="text-xs">{u.phoneNumber ?? ""}</p>
                          </td>
                          <td className="px-4 py-3">
                            <RoleBadge role={u.role} />
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={u.status} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openUserDetail(u.id)}
                                className="px-2 py-1 text-xs rounded-md hover:bg-muted transition-colors"
                                title="View details"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={deleting === u.id}
                                className="px-2 py-1 text-xs rounded-md hover:bg-red-500/10 hover:text-red-600 transition-colors disabled:opacity-50"
                                title="Delete user"
                              >
                                {deleting === u.id ? "..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}–
                    {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                  </p>
                  <div className="flex gap-1">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1 text-xs rounded-md border border-border hover:bg-muted disabled:opacity-30 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4">
                Recent Platform Activity
              </h2>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {activity.map(a => (
                    <div
                      key={a.id}
                      className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.outcome === "deny" ? "bg-red-500" : a.outcome === "allow" ? "bg-emerald-500" : "bg-primary/50"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs">
                          <span className="font-medium">
                            {a.userName ?? "System"}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}
                            {a.action.replace(/_/g, " ")}
                          </span>
                          {a.target && (
                            <span className="text-muted-foreground">
                              {" "}
                              on <span className="font-medium">{a.target}</span>
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="capitalize">{a.category}</span>
                          {a.createdAt && (
                            <span>
                              {" "}
                              · {new Date(a.createdAt).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
