/**
 * Yalla Hack Founders Console — Live Activity & Alerts
 * SSE live feed (falls back to polling), operational alerts center,
 * and rolling live metrics.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  RefreshCw,
  ChevronLeft,
  Radio,
  AlertTriangle,
  ShieldAlert,
  CreditCard,
  LifeBuoy,
  TrendingUp,
  Settings,
} from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";
const OWNER_API = "/api/yalla-admin";
const BASE = "/yalla-hack-owners-console";

interface LiveMetrics {
  generatedAt: string;
  sseClients: number;
  onlineRecently: number;
  activeFoundersSessions: number;
  signupsToday: number;
  loginsToday: number;
  failedLogins24h: number;
  openServiceRequests: number;
  unreadAdminNotifications: number;
  recentEvents: Array<{
    id: string;
    type: string;
    label: string;
    at: string;
  }>;
}

interface OperationalAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "security" | "billing" | "support" | "growth" | "system";
  title: string;
  detail: string;
  count?: number;
  createdAt: string;
}

interface SseEvent {
  id: string;
  event: string;
  data: unknown;
  receivedAt: string;
}

const SEVERITY_STYLES: Record<
  OperationalAlert["severity"],
  { bg: string; border: string; color: string; icon: React.ReactNode }
> = {
  critical: {
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.4)",
    color: "#ef4444",
    icon: <ShieldAlert size={16} />,
  },
  warning: {
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.4)",
    color: "#f59e0b",
    icon: <AlertTriangle size={16} />,
  },
  info: {
    bg: "rgba(0,210,255,0.08)",
    border: "rgba(0,210,255,0.3)",
    color: "#00d2ff",
    icon: <Radio size={16} />,
  },
};

const CATEGORY_ICONS: Record<OperationalAlert["category"], React.ReactNode> = {
  security: <ShieldAlert size={13} />,
  billing: <CreditCard size={13} />,
  support: <LifeBuoy size={13} />,
  growth: <TrendingUp size={13} />,
  system: <Settings size={13} />,
};

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(15,15,25,0.8)",
};

function KPI({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: danger && value > 0 ? "#ef4444" : "#f0abfc",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default function AdminLive() {
  usePageTitle("Live Activity — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [metrics, setMetrics] = useState<LiveMetrics | null>(null);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [sseEvents, setSseEvents] = useState<SseEvent[]>([]);
  const [sseConnected, setSseConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [liveRes, alertsRes] = await Promise.all([
        fetch(`${ADMIN_API}/live`, { credentials: "include" }),
        fetch(`${ADMIN_API}/alerts`, { credentials: "include" }),
      ]);
      if (liveRes.status === 401 || alertsRes.status === 401) {
        navigate(`${BASE}/login`);
        return;
      }
      if (!liveRes.ok) throw new Error(`live: HTTP ${liveRes.status}`);
      setMetrics(await liveRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      setError("");
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(`Could not load live data: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    load();
    // Poll every 15s as baseline
    pollRef.current = setInterval(load, 15_000);

    // SSE live feed (founders stream); fall back silently to polling only
    try {
      const es = new EventSource(`${OWNER_API}/stream`, {
        withCredentials: true,
      });
      esRef.current = es;
      es.onopen = () => setSseConnected(true);
      es.onerror = () => setSseConnected(false);
      const handler = (eventName: string) => (ev: MessageEvent) => {
        let parsed: unknown = ev.data;
        try {
          parsed = JSON.parse(ev.data as string);
        } catch {
          /* keep raw */
        }
        setSseEvents(prev =>
          [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              event: eventName,
              data: parsed,
              receivedAt: new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 80)
        );
      };
      // Common admin event names + catch-all
      for (const name of [
        "audit",
        "user",
        "security",
        "platform",
        "notification",
        "message",
      ]) {
        es.addEventListener(name, handler(name) as EventListener);
      }
      es.onmessage = handler("message");
    } catch {
      /* EventSource unsupported — polling covers us */
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      esRef.current?.close();
    };
  }, [load]);

  const mergedFeed = [
    ...(metrics?.recentEvents ?? []).map(e => ({
      id: `m-${e.id}`,
      label: e.label,
      at: e.at,
      kind: e.type,
      live: false as const,
    })),
    ...sseEvents.map(e => ({
      id: `s-${e.id}`,
      label: `${e.event}: ${
        typeof e.data === "object" && e.data
          ? JSON.stringify(e.data).slice(0, 120)
          : String(e.data).slice(0, 120)
      }`,
      at: e.receivedAt,
      kind: e.event,
      live: true as const,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 50);

  const criticalCount = alerts.filter(a => a.severity === "critical").length;

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
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate(`${BASE}/dashboard`)}
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
            Live Activity & Alerts
          </h1>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: sseConnected ? "#10b981" : "#64748b",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: sseConnected ? "#10b981" : "#64748b",
                boxShadow: sseConnected ? "0 0 6px #10b981" : "none",
              }}
            />
            {sseConnected ? "SSE connected" : "polling"}
          </span>
          {updatedAt && (
            <span style={{ fontSize: 11, color: "#64748b" }}>
              updated {updatedAt}
            </span>
          )}
        </div>
        <button
          onClick={load}
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
              color: "#ef4444",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {loading && !metrics ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <KPI label="SSE clients" value={metrics?.sseClients ?? 0} />
              <KPI label="Online (5m)" value={metrics?.onlineRecently ?? 0} />
              <KPI
                label="Founder sessions"
                value={metrics?.activeFoundersSessions ?? 0}
              />
              <KPI label="Signups today" value={metrics?.signupsToday ?? 0} />
              <KPI label="Logins today" value={metrics?.loginsToday ?? 0} />
              <KPI
                label="Failed logins 24h"
                value={metrics?.failedLogins24h ?? 0}
                danger
              />
              <KPI
                label="Open requests"
                value={metrics?.openServiceRequests ?? 0}
              />
              <KPI
                label="Unread notes"
                value={metrics?.unreadAdminNotifications ?? 0}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
                gap: 16,
              }}
            >
              {/* Alerts center */}
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <AlertTriangle size={14} color="#f59e0b" />
                    Operational alerts
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      color: criticalCount > 0 ? "#ef4444" : "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {alerts.length} active
                  </span>
                </div>
                {alerts.length === 0 ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#10b981",
                      padding: "12px 0",
                    }}
                  >
                    All clear — no operational alerts.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      maxHeight: 480,
                      overflowY: "auto",
                    }}
                  >
                    {alerts.map(a => {
                      const s = SEVERITY_STYLES[a.severity];
                      return (
                        <div
                          key={a.id}
                          style={{
                            padding: "12px 14px",
                            borderRadius: 10,
                            background: s.bg,
                            border: `1px solid ${s.border}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              color: s.color,
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            {s.icon}
                            {a.title}
                            {typeof a.count === "number" && (
                              <span
                                style={{
                                  marginLeft: "auto",
                                  fontSize: 12,
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {a.count}
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 12.5,
                              color: "#cbd5e1",
                              marginTop: 4,
                            }}
                          >
                            {a.detail}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 11,
                              color: "#64748b",
                              marginTop: 6,
                            }}
                          >
                            {CATEGORY_ICONS[a.category]}
                            {a.category}
                            <span style={{ marginLeft: "auto" }}>
                              {new Date(a.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live feed */}
              <div style={cardStyle}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Radio size={14} color="#00d2ff" />
                  Live event feed
                </div>
                {mergedFeed.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    Waiting for events…
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                      maxHeight: 480,
                      overflowY: "auto",
                    }}
                  >
                    {mergedFeed.map(ev => (
                      <div
                        key={ev.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "54px 1fr auto",
                          gap: 10,
                          padding: "8px 2px",
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: ev.live ? "#10b981" : "#00d2ff",
                          }}
                        >
                          {ev.live ? "SSE" : "poll"}
                        </span>
                        <span
                          style={{
                            fontSize: 12.5,
                            color: "#cbd5e1",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontFamily: "ui-monospace,monospace",
                          }}
                          title={ev.label}
                        >
                          {ev.label}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#64748b",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.at ? new Date(ev.at).toLocaleTimeString() : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
