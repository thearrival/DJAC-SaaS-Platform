import { useState, useEffect } from "react";
import {
  Activity, Database, Shield, Server, Users, BookOpen,
  CheckCircle2, XCircle, Clock, HardDrive, RefreshCw
} from "lucide-react";

export default function AdminHealth() {
  const [status, setStatus] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [preRes, statsRes] = await Promise.all([
        fetch("/api/_preflight").then(r => r.json()),
        fetch("/api/_stats").then(r => r.json()),
      ]);
      setStatus(preRes);
      setStats(statsRes);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, []);

  if (loading && !stats) {
    return (
      <div className="djac-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div className="djac-page-spinner" />
      </div>
    );
  }
    { label: "Database", ok: stats?.dbConnected, icon: Database },
    { label: "Frameworks", ok: (stats?.frameworks as number) > 0, icon: BookOpen },
    { label: "Users", ok: true, icon: Users, detail: stats?.users },
  ];

  return (
    <div className="djac-page">
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
        <Activity size={22} style={{ color: "#6366f1" }} />
        System Health
      </h1>
      <p style={{ fontSize: 14, color: "var(--djac-muted)", marginBottom: 28 }}>
        Real-time platform status and diagnostics
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        {services.map((s) => (
          <div key={s.label} style={{
            background: "var(--djac-card)", border: "1px solid var(--djac-border)", borderRadius: 12, padding: 20,
            display: "flex", flexDirection: "column", gap: 8
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <s.icon size={18} style={{ color: s.ok ? "#22c55e" : "var(--djac-destructive)" }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {s.ok ? <CheckCircle2 size={14} style={{ color: "#22c55e" }} /> : <XCircle size={14} style={{ color: "var(--djac-destructive)" }} />}
              <span style={{ fontSize: 12, color: s.ok ? "#22c55e" : "var(--djac-destructive)" }}>{s.ok ? "OK" : "Down"}</span>
            </div>
            {s.detail !== undefined && <span style={{ fontSize: 12, color: "var(--djac-muted)" }}>{String(s.detail)} total</span>}
          </div>
        ))}
      </div>

      {status && (
        <div style={{
          background: "var(--djac-card)", border: "1px solid var(--djac-border)", borderRadius: 12, padding: 20,
          marginBottom: 16
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Server size={16} />
            Production Readiness
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {Object.entries(status.checks ?? {}).map(([k, v]) => (
              <div key={k} style={{
                background: v ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${v ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 500,
                color: v ? "#22c55e" : "var(--djac-destructive)"
              }}>
                {v ? "✓" : "✗"} {k.replace(/_/g, " ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && (
        <div style={{
          background: "var(--djac-card)", border: "1px solid var(--djac-border)", borderRadius: 12, padding: 20
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <HardDrive size={16} />
            Runtime Metrics
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { label: "Uptime", value: `${Math.floor((stats.uptime as number) / 60)}m ${Math.floor((stats.uptime as number) % 60)}s`, icon: Clock },
              { label: "Users", value: String(stats.users ?? 0), icon: Users },
              { label: "Frameworks", value: String(stats.frameworks ?? 0), icon: BookOpen },
              { label: "Memory RSS", value: `${Math.round((stats.memory as any)?.rss / 1024 / 1024)} MB`, icon: HardDrive },
              { label: "Node", value: String(stats.node), icon: Server },
            ].map((m) => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <m.icon size={14} style={{ color: "var(--djac-muted)" }} />
                <div>
                  <p style={{ fontSize: 11, color: "var(--djac-muted)", margin: 0 }}>{m.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
