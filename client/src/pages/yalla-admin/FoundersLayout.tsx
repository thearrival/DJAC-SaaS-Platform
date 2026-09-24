/**
 * FoundersLayout — persistent sidebar shell for every /yalla-hack-owners-console
 * page (except login). Provides navigation, active-route highlighting, session
 * guard, and logout. Content is rendered by the routed page inside <main>.
 */
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  BarChart3,
  Shield,
  ScrollText,
  Activity,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const BASE = "/yalla-hack-owners-console";

const NAV_ITEMS = [
  { path: `${BASE}/dashboard`, label: "Dashboard", icon: LayoutDashboard },
  { path: `${BASE}/users`, label: "Users", icon: Users },
  { path: `${BASE}/organizations`, label: "Organizations", icon: Building2 },
  { path: `${BASE}/subscriptions`, label: "Subscriptions", icon: CreditCard },
  { path: `${BASE}/analytics`, label: "Analytics", icon: BarChart3 },
  { path: `${BASE}/monitor`, label: "Platform Monitor", icon: Activity },
  { path: `${BASE}/security`, label: "Security", icon: Shield },
  { path: `${BASE}/audit`, label: "Audit Log", icon: ScrollText },
];

export default function FoundersLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Session guard: bounce to login when the cookie is missing/expired
  useEffect(() => {
    let cancelled = false;
    fetch("/api/yalla-admin/me", { credentials: "include" })
      .then(res => (res.ok ? res.json() : { authenticated: false }))
      .then(data => {
        if (cancelled) return;
        if (data.authenticated) {
          setUsername(data.username ?? "founder");
        } else {
          navigate(`${BASE}/login`, { replace: true });
        }
      })
      .catch(() => {
        /* network blip — page-level guards will handle it */
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Close the mobile drawer on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  async function handleLogout() {
    try {
      await fetch("/api/yalla-admin/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });
    } catch {
      /* ignore — cookie may already be gone */
    }
    navigate(`${BASE}/login`);
  }

  const isActive = (path: string) =>
    location === path || location.startsWith(`${path}/`);

  const sidebar = (
    <div
      style={{
        width: 236,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#08080e",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "20px 18px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 2,
            background: "linear-gradient(90deg,#d900ff,#00d2ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          YALLA HACK
        </div>
        <div style={{ fontSize: 12.5, color: "#cbd5e1", marginTop: 4 }}>
          Founders Console
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "none",
                borderLeft: active
                  ? "2px solid #d900ff"
                  : "2px solid transparent",
                background: active ? "rgba(217,0,255,0.10)" : "transparent",
                color: active ? "#f0abfc" : "#94a3b8",
                fontSize: 13.5,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 120ms, color 120ms",
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = "#111119";
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer: user + logout */}
      <div
        style={{
          padding: "14px 14px 16px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#d900ff,#7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {(username ?? "F").slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 12.5,
                color: "#e2e8f0",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {username ?? "…"}
            </div>
            <div style={{ fontSize: 10.5, color: "#64748b" }}>Founder</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(239,68,68,0.10)",
            border: "1px solid rgba(239,68,68,0.30)",
            color: "#f87171",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050508" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 30,
        }}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="lg:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.6)",
          }}
          onClick={() => setMenuOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 41,
            }}
          >
            {sidebar}
          </div>
        </div>
      )}

      {/* Content column */}
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
        className="lg:pl-[236px]"
      >
        {/* Mobile top bar */}
        <header
          className="lg:hidden"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            background: "rgba(5,5,8,0.92)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            style={{
              background: "none",
              border: "none",
              color: "#e2e8f0",
              cursor: "pointer",
              padding: 4,
            }}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>
            Founders Console
          </span>
        </header>

        <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}
