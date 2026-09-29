/**
 * Yalla Hack Founders Console — Onboarding Intelligence
 *
 * Server-authorized view of onboarding funnel + per-user timeline/responses.
 * Data comes from /api/admin-dashboard/onboarding (requireAdminSession).
 */
import { useCallback, useEffect, useState } from "react";
import type React from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { RefreshCw, Search, Sparkles } from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";
const BASE = "/yalla-hack-owners-console";

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 16,
};

export default function AdminOnboarding() {
  usePageTitle("Onboarding — Owners Console");
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/onboarding?days=${days}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate(`${BASE}/login`);
        return;
      }
      setData(await res.json());
    } catch {
      /* handled by empty state */
    } finally {
      setLoading(false);
    }
  }, [days, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const inspect = async () => {
    setUserError(null);
    setUserData(null);
    const id = Number(userId);
    if (!Number.isFinite(id) || id <= 0) {
      setUserError("Enter a valid user id");
      return;
    }
    const res = await fetch(`${ADMIN_API}/onboarding/users/${id}`, {
      credentials: "include",
    });
    if (res.status === 401) {
      navigate(`${BASE}/login`);
      return;
    }
    if (!res.ok) {
      setUserError("Could not load this user's onboarding");
      return;
    }
    setUserData(await res.json());
  };

  const totals = data?.totals ?? {};

  return (
    <div className="p-6 space-y-6" style={{ color: "#e5e7eb" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5" /> Onboarding Intelligence
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="rounded-md border border-border bg-black/30 px-3 py-1.5 text-sm"
            aria-label="Time window"
          >
            {[7, 30, 90, 365].map(d => (
              <option key={d} value={d}>
                Last {d} days
              </option>
            ))}
          </select>
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Started", value: totals.started },
          { label: "Completed", value: totals.completed },
          { label: "In progress", value: totals.in_progress },
          { label: "Skipped", value: totals.skipped },
        ].map(k => (
          <div key={k.label} style={cardStyle}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {k.label}
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {k.value ?? (loading ? "…" : 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div style={cardStyle}>
          <p className="mb-3 text-sm font-medium">Industries</p>
          {(data?.byIndustry ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.byIndustry.map((row: any) => (
                  <tr key={row.industry} className="border-b border-border">
                    <td className="py-1.5">{row.industry}</td>
                    <td className="py-1.5 text-end text-muted-foreground">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={cardStyle}>
          <p className="mb-3 text-sm font-medium">Recent onboarding events</p>
          {(data?.funnel ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.funnel.map((row: any) => (
                  <tr key={String(row.day)} className="border-b border-border">
                    <td className="py-1.5">
                      {new Date(row.day).toLocaleDateString()}
                    </td>
                    <td className="py-1.5 text-end text-muted-foreground">
                      {row.events}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div style={cardStyle}>
          <p className="mb-3 text-sm font-medium">Objectives</p>
          {(data?.byObjective ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.byObjective.map((row: any) => (
                  <tr key={row.objective} className="border-b border-border">
                    <td className="py-1.5">{row.objective}</td>
                    <td className="py-1.5 text-end text-muted-foreground">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={cardStyle}>
          <p className="mb-3 text-sm font-medium">Top recommended modules</p>
          {(data?.byModule ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.byModule.map((row: any) => (
                  <tr key={row.module_id} className="border-b border-border">
                    <td className="py-1.5">{row.module_id}</td>
                    <td className="py-1.5 text-end text-muted-foreground">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <p className="mb-3 text-sm font-medium">Personalization engagement</p>
        {(data?.engagement ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {data.engagement.map((row: any) => (
                <tr key={row.event_type} className="border-b border-border">
                  <td className="py-1.5">{row.event_type}</td>
                  <td className="py-1.5 text-end text-muted-foreground">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={cardStyle}>
        <p className="mb-3 text-sm font-medium">Inspect a user's onboarding</p>
        <div className="flex items-center gap-2 max-w-md">
          <input
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="User ID"
            aria-label="User ID"
            className="w-40 rounded-md border border-border bg-black/30 px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => void inspect()}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Search className="h-4 w-4" /> Inspect
          </button>
        </div>
        {userError && (
          <p role="alert" className="mt-2 text-sm text-red-400">
            {userError}
          </p>
        )}

        {userData && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Derived profile
                </p>
                <pre className="mt-1 overflow-auto rounded bg-black/30 p-2 text-xs">
                  {JSON.stringify(userData.state?.profile ?? {}, null, 2)}
                </pre>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">
                  Recommendations
                </p>
                <ul className="mt-1 space-y-1 text-xs">
                  {(userData.state?.recommendations ?? []).map((r: any) => (
                    <li key={r.moduleId} className="flex justify-between gap-2">
                      <span>{r.moduleId}</span>
                      <span className="text-muted-foreground">{r.ruleId}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">
                Responses
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-start">Question</th>
                    <th className="text-start">Answer</th>
                    <th className="text-end">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(userData.responses ?? []).map((r: any) => (
                    <tr key={r.questionId} className="border-b border-border">
                      <td className="py-1.5">{r.questionId}</td>
                      <td className="py-1.5">
                        {JSON.stringify(r.answerValue)}
                      </td>
                      <td className="py-1.5 text-end text-muted-foreground">
                        {new Date(r.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">
                Timeline
              </p>
              <ul className="space-y-1 text-xs">
                {(userData.timeline ?? []).map((e: any, i: number) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>{e.eventType}</span>
                    <span className="text-muted-foreground">
                      {new Date(e.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
