/**
 * ProIntelligenceDashboard — DJAC Command Center v3
 * ──────────────────────────────────────────────────────────────────────────────
 * Three-panel Pro Intelligence view with rich animations and live data:
 *   Header:   Live clock · Threat arc meter · Module badges
 *   KPIs:     Animated stat tiles with sparklines + hover glows
 *   Ticker:   Scrolling regulatory news feed with edge fades
 *   Row 1:    SinoGulf regulatory corridor heatmap
 *   Row 2:    AI Orchestration Feed (60%) + Regulatory Pulse Matrix (40%)
 *   Row 3:    Framework Radar (hexagonal SVG) + AI Pipeline Activity bars
 *   Footer:   Animated system health indicators
 *
 * Route: /pro-intelligence
 */
import { memo } from "react";
import type React from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/useTheme";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SinoGulfArchitecture } from "@/components/SinoGulfArchitecture";
import { Globe3D, GLOBE_ARCS, type CorridorStatus } from "@/components/Globe3D";
import { buildMarkersFromFrameworks } from "@/components/globeData";
import { AIOrchestrationFeed } from "@/components/AIOrchestrationFeed";
import { RegulatoryPulseMatrix } from "@/components/RegulatoryPulseMatrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Globe2,
  Sparkles,
  Brain,
  Shield,
  AlertTriangle,
  Activity,
  Cpu,
  BarChart3,
  Radio,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type ThreatLevel = "NORMAL" | "ELEVATED" | "HIGH" | "CRITICAL";

type Colors = {
  cyan: string;
  green: string;
  orange: string;
  purple: string;
  red: string;
  yellow: string;
};

// ── Regulatory ticker items ───────────────────────────────────────────────────
const TICKER_ITEMS = [
  "🇪🇺  EU AI Act — First enforcement actions for high-risk AI systems · Jul 2025",
  "🇪🇺  GDPR — Data protection representative guidance updated · Jul 2025",
  "âš¡  AI pipeline processed 1,200+ vendor documents this assessment cycle",
  "ðŸ”´  NCA Critical Infrastructure Data Residency Audit ongoing — ECC Controls 2.0",
  "🇺🇸  CCPA — CPRA amendments effective for employee data · Jan 2026",
  "✅  Singapore ↔ Hong Kong (SAR) corridor fully compliant — no transfer restrictions",
  "⚠️  Hong Kong (SAR) ↔ Shanghai requires CAC cross-border data transfer approval",
  "🌐  12 frameworks monitored: GDPR · CCPA · LGPD · PIPL · PDPL · NIST CSF · ISO 27001 · SOC 2 · PCI DSS · FedRAMP · POPIA · UAE PDPL",
  "🛡️  DJAC AI Judge scoring 3 risk dimensions: Privacy · Security · Cross-border",
  "🇧🇷  LGPD — ANPD issues new data transfer guidelines for international operations · Jul 2025",
  "🇺🇸  NYDFS — Cybersecurity regulation updated for financial services · Jul 2025",
];

// ── Framework data for radar chart ───────────────────────────────────────────
const FRAMEWORKS = [
  { label: "PIPL", score: 82, angle: -90 },
  { label: "PDPL", score: 75, angle: -30 },
  { label: "CSL", score: 91, angle: 30 },
  { label: "DSL", score: 68, angle: 90 },
  { label: "ECC", score: 79, angle: 150 },
  { label: "Gen AI", score: 55, angle: 210 },
];

// ── Animated counter hook ─────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1400): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setVal(0);
      return;
    }
    const t0 = performance.now();
    let rafId: number;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased * 100) / 100);
      if (p < 1) rafId = requestAnimationFrame(tick);
      else setVal(target);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return val;
}

// ── Sparkline bars (5 animated mini bars) ────────────────────────────────────
function SparkBars({ color, values }: { color: string; values: number[] }) {
  return (
    <div
      style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 18 }}
    >
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: 4,
            borderRadius: 2,
            background: `${color}${Math.round(40 + v * 0.6)
              .toString(16)
              .padStart(2, "0")}`,
            height: `${Math.max(20, v)}%`,
            animation: `djac-bar-grow 0.6s ${i * 0.08}s cubic-bezier(0.34,1.56,0.64,1) both`,
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

// ── KPI Stat Tile ─────────────────────────────────────────────────────────────
function StatTile({
  label,
  value,
  suffix = "",
  icon: Icon,
  color,
  sublabel,
  isDark,
  pulse = false,
  decimals = 0,
  sparkValues,
}: {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  color: string;
  sublabel?: string;
  isDark: boolean;
  pulse?: boolean;
  sparkValues?: number[];
}) {
  const displayed = useCountUp(value);
  const displayStr =
    decimals > 0 ? displayed.toFixed(decimals) : String(Math.round(displayed));
  return (
    <div
      className="djac-pro-kpi-card"
      style={{
        flex: "1 1 160px",
        background: isDark ? `${color}07` : `${color}05`,
        border: `1px solid ${color}20`,
        borderTop: `2px solid ${color}`,
        borderRadius: 14,
        padding: "15px 16px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        position: "relative",
        overflow: "hidden",
        cursor: "default",
      }}
    >
      {/* Ambient corner glow */}
      <div
        style={{
          position: "absolute",
          top: -30,
          right: -30,
          width: 90,
          height: 90,
          background: `${color}18`,
          borderRadius: "50%",
          filter: "blur(28px)",
          pointerEvents: "none",
          transition: "opacity 0.3s",
        }}
      />
      {/* Header row: label + icon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            color: `${color}CC`,
            textTransform: "uppercase",
            letterSpacing: "0.11em",
          }}
        >
          {label}
        </span>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: `${color}14`,
            border: `1px solid ${color}28`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>
      </div>
      {/* Value */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span
          style={{
            fontSize: 30,
            fontWeight: 900,
            color,
            fontFamily: "var(--font-mono)",
            lineHeight: 1,
            textShadow: isDark ? `0 0 24px ${color}55` : "none",
          }}
        >
          {displayStr}
        </span>
        {suffix && (
          <span style={{ fontSize: 13, fontWeight: 700, color: `${color}88` }}>
            {suffix}
          </span>
        )}
      </div>
      {/* Sublabel + sparkline row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        {sublabel && (
          <span
            style={{
              fontSize: 9,
              color: "var(--djac-muted)",
              lineHeight: 1.4,
              maxWidth: "70%",
            }}
          >
            {sublabel}
          </span>
        )}
        {sparkValues && <SparkBars color={color} values={sparkValues} />}
      </div>
      {/* Live ping dot */}
      {pulse && (
        <span
          style={{
            position: "absolute",
            bottom: 10,
            right: 11,
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 0 0 ${color}66`,
            animation: "djac-live-ping 1.8s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
}

// ── Threat Level — bar strip + arc ────────────────────────────────────────────
function ThreatBar({ level, isDark }: { level: ThreatLevel; isDark: boolean }) {
  const levels: { id: ThreatLevel; color: string; pct: number }[] = [
    { id: "NORMAL", color: isDark ? "#10b981" : "#10b981", pct: 15 },
    { id: "ELEVATED", color: isDark ? "#f59e0b" : "#f59e0b", pct: 45 },
    { id: "HIGH", color: isDark ? "#f59e0b" : "#f59e0b", pct: 72 },
    { id: "CRITICAL", color: isDark ? "#ef4444" : "#ef4444", pct: 100 },
  ];
  const idx = levels.findIndex(l => l.id === level);
  const cur = levels[idx];
  // SVG arc (semicircle 0–180°)
  const R = 22,
    CX = 28,
    CY = 28;
  const pct = cur.pct / 100;
  const startAngle = Math.PI;
  const endAngle = Math.PI + Math.PI * pct;
  const x1 = CX + R * Math.cos(startAngle);
  const y1 = CY + R * Math.sin(startAngle);
  const x2 = CX + R * Math.cos(endAngle);
  const y2 = CY + R * Math.sin(endAngle);
  const largeArc = pct > 0.5 ? 1 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      {/* Mini arc gauge */}
      <svg
        width={56}
        height={32}
        viewBox="0 0 56 32"
        style={{ overflow: "visible" }}
      >
        {/* Track */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"}
          strokeWidth={5}
          strokeLinecap="round"
        />
        {/* Arc fill */}
        <path
          d={`M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={cur.color}
          strokeWidth={5}
          strokeLinecap="round"
          style={{
            filter: isDark ? `drop-shadow(0 0 4px ${cur.color}99)` : "none",
            transition: "all 0.5s ease",
          }}
        />
        <circle
          cx={CX}
          cy={CY}
          r={4}
          fill={cur.color}
          style={{
            filter: `drop-shadow(0 0 3px ${cur.color})`,
            transition: "fill 0.4s",
          }}
        />
      </svg>
      {/* Bar strip */}
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        {levels.map((l, i) => (
          <div
            key={l.id}
            style={{
              width: 22,
              height: 6,
              borderRadius: 2,
              transition: "background 0.4s, box-shadow 0.3s",
              background:
                i <= idx
                  ? l.color
                  : isDark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(0,0,0,0.09)",
              boxShadow: i === idx ? `0 0 6px ${l.color}80` : "none",
              ...(i === idx
                ? { animation: "djac-pulse-bar 1.6s ease-in-out infinite" }
                : {}),
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 900,
          color: cur.color,
          letterSpacing: "0.12em",
          textShadow: isDark ? `0 0 8px ${cur.color}80` : "none",
          animation:
            level !== "NORMAL"
              ? "djac-live-ping 1.8s ease-in-out infinite"
              : "none",
        }}
      >
        {level}
      </span>
    </div>
  );
}

// ── Ticker Tape with edge gradient fades ──────────────────────────────────────
function TickerTape({ isDark, color }: { isDark: boolean; color: string }) {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div
      style={{
        background: isDark ? "rgba(0,247,255,0.04)" : "rgba(2,132,199,0.04)",
        border: `1px solid ${color}20`,
        borderRadius: 10,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        height: 36,
        boxShadow: isDark ? `inset 0 0 0 1px ${color}10` : "none",
      }}
    >
      {/* Label */}
      <div
        style={{
          flexShrink: 0,
          padding: "0 14px",
          height: "100%",
          background: `linear-gradient(90deg, ${color}22, ${color}12)`,
          borderRight: `1px solid ${color}28`,
          display: "flex",
          alignItems: "center",
          gap: 6,
          zIndex: 2,
        }}
      >
        <Radio
          className="h-3 w-3"
          style={{
            color,
            animation: "djac-live-ping 1.8s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: 9.5,
            fontWeight: 800,
            color,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            whiteSpace: "nowrap",
          }}
        >
          REG FEED
        </span>
      </div>
      {/* Scrolling wrapper with edge fades */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          position: "relative",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%)",
        }}
      >
        <div
          className="djac-ticker-inner"
          style={{ display: "flex", whiteSpace: "nowrap" }}
        >
          {items.map((item, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                fontSize: 11.5,
                color: "var(--djac-muted)",
                padding: "0 34px",
                lineHeight: "36px",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section Label with flowing accent line ────────────────────────────────────
function SectionLabel({
  icon: Icon,
  label,
  color,
  sublabel,
}: {
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  label: string;
  color: string;
  sublabel?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
        position: "relative",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: `${color}14`,
          border: `1px solid ${color}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 12px ${color}28`,
          flexShrink: 0,
        }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              color: "var(--djac-text)",
              letterSpacing: "-0.01em",
            }}
          >
            {label}
          </span>
          {sublabel && (
            <span
              style={{
                fontSize: 10,
                color: "var(--djac-muted)",
                fontWeight: 500,
              }}
            >
              {sublabel}
            </span>
          )}
        </div>
        {/* Flowing gradient underline */}
        <div
          style={{
            marginTop: 4,
            height: 1.5,
            borderRadius: 99,
            background: `linear-gradient(90deg, ${color}, ${color}40, transparent)`,
            backgroundSize: "200% 100%",
            animation: "djac-gradient-shift 3s linear infinite",
          }}
        />
      </div>
    </div>
  );
}

// ── Framework Coverage Radar (SVG hexagonal) ──────────────────────────────────
function FrameworkRadar({ C, isDark }: { C: Colors; isDark: boolean }) {
  const cx = 110,
    cy = 100,
    maxR = 72;
  const _n = FRAMEWORKS.length;

  const toXY = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // Outer vertices (100%)
  const outer = FRAMEWORKS.map(f => toXY(f.angle, maxR));
  // Score vertices
  const scored = FRAMEWORKS.map(f => toXY(f.angle, (f.score / 100) * maxR));

  const pts = (arr: { x: number; y: number }[]) =>
    arr.map(p => `${p.x},${p.y}`).join(" ");

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  return (
    <div
      style={{
        background: isDark ? `${C.cyan}06` : `${C.cyan}04`,
        border: `1px solid ${C.cyan}18`,
        borderRadius: 14,
        padding: "16px 14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 2,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: `${C.cyan}14`,
            border: `1px solid ${C.cyan}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield className="h-3 w-3" style={{ color: C.cyan }} />
        </div>
        <span
          style={{ fontSize: 11.5, fontWeight: 800, color: "var(--djac-text)" }}
        >
          Framework Coverage
        </span>
        <div style={{ flex: 1, height: 1, background: `${C.cyan}15` }} />
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: C.cyan,
            background: `${C.cyan}12`,
            border: `1px solid ${C.cyan}25`,
            borderRadius: 99,
            padding: "2px 8px",
          }}
        >
          RADAR
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg
          viewBox="0 0 220 200"
          style={{
            width: 200,
            height: 182,
            flexShrink: 0,
            animation: "djac-fade-up 0.6s 0.15s both",
          }}
          role="img"
          aria-label="Framework compliance radar chart"
        >
          {/* Grid rings */}
          {rings.map((r, ri) => (
            <polygon
              key={ri}
              points={pts(FRAMEWORKS.map(f => toXY(f.angle, maxR * r)))}
              fill="none"
              stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}
              strokeWidth={1}
            />
          ))}
          {/* Axis spokes */}
          {outer.map((p, i) => (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
              strokeWidth={1}
            />
          ))}
          {/* Score fill polygon */}
          <polygon
            points={pts(scored)}
            fill={`${C.cyan}22`}
            stroke={C.cyan}
            strokeWidth={2}
            strokeLinejoin="round"
            style={{
              filter: isDark ? `drop-shadow(0 0 6px ${C.cyan}55)` : "none",
              animation:
                "djac-radar-draw 1s 0.3s cubic-bezier(0.22,1,0.36,1) both",
            }}
          />
          {/* Score dots */}
          {scored.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={C.cyan}
              stroke={isDark ? "#050508" : "#fff"}
              strokeWidth={2}
              style={{
                filter: isDark ? `drop-shadow(0 0 4px ${C.cyan})` : "none",
              }}
            />
          ))}
          {/* Labels */}
          {FRAMEWORKS.map((f, i) => {
            const lp = toXY(f.angle, maxR + 17);
            return (
              <text
                key={i}
                x={lp.x}
                y={lp.y + 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight={700}
                fill={isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)"}
                fontFamily="var(--font-sans)"
              >
                {f.label}
              </text>
            );
          })}
          {/* Center avg score */}
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fontWeight={900}
            fill={C.cyan}
            fontFamily="var(--font-mono)"
          >
            {Math.round(
              FRAMEWORKS.reduce((s, f) => s + f.score, 0) / FRAMEWORKS.length
            )}
          </text>
          <text
            x={cx}
            y={cy + 13}
            textAnchor="middle"
            fontSize={7}
            fontWeight={600}
            fill={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"}
          >
            AVG %
          </text>
        </svg>
        {/* Legend */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 5,
            flex: 1,
            minWidth: 0,
          }}
        >
          {FRAMEWORKS.map(f => {
            const barColor =
              f.score >= 80 ? C.green : f.score >= 65 ? C.yellow : C.orange;
            return (
              <div
                key={f.label}
                style={{ display: "flex", alignItems: "center", gap: 7 }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: "var(--djac-muted)",
                    width: 38,
                    flexShrink: 0,
                  }}
                >
                  {f.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: 99,
                    background: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 99,
                      width: `${f.score}%`,
                      background: `linear-gradient(90deg, ${barColor}, ${barColor}99)`,
                      animation:
                        "djac-bar-grow-x 0.8s cubic-bezier(0.22,1,0.36,1) both",
                      transformOrigin: "left",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 800,
                    color: barColor,
                    width: 26,
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {f.score}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── AI Jobs Activity Bars ─────────────────────────────────────────────────────
function AIJobsActivity({
  C,
  isDark,
  jobCount,
}: {
  C: Colors;
  isDark: boolean;
  jobCount: number;
}) {
  const bars = useRef<number[]>(
    Array.from({ length: 14 }, () => Math.floor(Math.random() * 70 + 20))
  );
  return (
    <div
      style={{
        background: isDark ? `${C.purple}07` : `${C.purple}05`,
        border: `1px solid ${C.purple}20`,
        borderRadius: 14,
        padding: "16px 14px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: `${C.purple}14`,
            border: `1px solid ${C.purple}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Cpu className="h-3 w-3" style={{ color: C.purple }} />
        </div>
        <span
          style={{ fontSize: 11.5, fontWeight: 800, color: "var(--djac-text)" }}
        >
          AI Pipeline Activity
        </span>
        <div style={{ flex: 1, height: 1, background: `${C.purple}15` }} />
        {jobCount > 0 && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: C.purple,
              background: `${C.purple}18`,
              border: `1px solid ${C.purple}35`,
              borderRadius: 99,
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: C.purple,
                display: "inline-block",
                animation: "djac-live-ping 1.8s ease-in-out infinite",
              }}
            />
            {jobCount} Active
          </span>
        )}
      </div>
      {/* Bar chart */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 4,
          height: 64,
          padding: "0 2px",
        }}
      >
        {bars.current.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderRadius: "3px 3px 0 0",
              background: `linear-gradient(180deg, ${C.purple}, ${C.purple}55)`,
              height: `${h}%`,
              animation: `djac-bar-grow 0.55s ${i * 0.04}s cubic-bezier(0.34,1.56,0.64,1) both`,
              transformOrigin: "bottom",
              opacity: 0.7 + (i / bars.current.length) * 0.3,
              boxShadow: isDark ? `0 -2px 6px ${C.purple}44` : "none",
            }}
          />
        ))}
      </div>
      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: 16,
          paddingTop: 4,
          borderTop: `1px solid ${C.purple}15`,
        }}
      >
        {[
          { label: "Queued", val: jobCount, color: C.yellow },
          { label: "Running", val: jobCount, color: C.green },
          { label: "Total Runs", val: 1204, color: C.purple },
          { label: "Success Rate", val: "98.7%", color: C.cyan },
        ].map(s => (
          <div
            key={s.label}
            style={{ display: "flex", flexDirection: "column", gap: 1 }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 900,
                color: s.color,
                fontFamily: "var(--font-mono)",
              }}
            >
              {s.val}
            </span>
            <span
              style={{
                fontSize: 9,
                color: "var(--djac-muted)",
                fontWeight: 500,
              }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Animated count-up for the jurisdiction panel ──────────────────────────────
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 550;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

const CORRIDOR_STATUS_META: Record<
  CorridorStatus,
  { label: string; color: string }
> = {
  cleared: { label: "Cleared", color: "#10b981" },
  approval: { label: "Approval required", color: "#f59e0b" },
  blocked: { label: "Blocked", color: "#ef4444" },
};

function exportCorridorsCsv() {
  const rows: string[][] = [
    ["Corridor", "From", "To", "Status", "Volume", "Data categories"],
    ...GLOBE_ARCS.map(a => [
      a.label ?? "",
      a.from.join(" "),
      a.to.join(" "),
      a.status ? CORRIDOR_STATUS_META[a.status].label : "",
      a.volume ?? "",
      (a.dataCategories ?? []).join("; "),
    ]),
  ];
  const csv = rows
    .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "djac-cross-border-corridors.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function corridorsSummary(opts: {
  whatIf: boolean;
  status: string;
  category: string;
  region: string;
}): string {
  const eff = (s?: CorridorStatus) =>
    opts.whatIf && s === "approval" ? "blocked" : s;
  const lines: string[] = [
    "DJAC — Global Regulatory Network",
    `Filters: status=${opts.status} · category=${opts.category} · region=${opts.region}${
      opts.whatIf ? " · what-if: stricter rules" : ""
    }`,
    `Corridors (${GLOBE_ARCS.length}):`,
  ];
  for (const a of GLOBE_ARCS) {
    const st = eff(a.status);
    lines.push(
      `• ${a.label ?? "Corridor"} — ${
        st ? CORRIDOR_STATUS_META[st].label : "n/a"
      }${a.volume ? ` · ${a.volume} volume` : ""}${
        a.dataCategories?.length ? ` · ${a.dataCategories.join(", ")}` : ""
      }`
    );
  }
  return lines.join("\n");
}

// ── Main page ─────────────────────────────────────────────────────────────────
const ProIntelligenceDashboard = memo(function ProIntelligenceDashboard() {
  usePageTitle("Pro Intelligence");
  const { t } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();

  // Live clock
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const datePart = now.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const C: Colors = useMemo(
    () => ({
      cyan: isDark ? "#00d2ff" : "#00d2ff",
      green: isDark ? "#10b981" : "#10b981",
      orange: isDark ? "#f59e0b" : "#f59e0b",
      purple: isDark ? "#d900ff" : "#d900ff",
      red: isDark ? "#ef4444" : "#ef4444",
      yellow: isDark ? "#f59e0b" : "#f59e0b",
    }),
    [isDark]
  );

  // Live data
  const jobsQuery = trpc.ai.listAssessmentJobs.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const matrixQuery = trpc.compliance.matrix.useQuery(undefined, {
    staleTime: 60_000,
  });

  // Real, per-jurisdiction framework counts → data-driven globe hubs.
  const globalFwQuery = trpc.compliance.globalFrameworks.useQuery(undefined, {
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
  const globeMarkers = useMemo(
    () => buildMarkersFromFrameworks(globalFwQuery.data ?? []),
    [globalFwQuery.data]
  );
  const globeRegions = useMemo(
    () =>
      Array.from(
        new Set(globeMarkers.map(m => m.region).filter(Boolean))
      ).sort() as string[],
    [globeMarkers]
  );

  const [globeSel, setGlobeSel] = useState<{
    type: "hub" | "arc";
    id: string;
    label: string;
    value?: number;
    status?: CorridorStatus;
    dataCategories?: string[];
  } | null>(null);
  const [corridorFilter, setCorridorFilter] = useState<CorridorStatus | "all">(
    "all"
  );
  const [whatIf, setWhatIf] = useState(false);
  const [timelapse, setTimelapse] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [showLabels, setShowLabels] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [compare, setCompare] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const corridorCategories = useMemo(
    () =>
      Array.from(
        new Set(GLOBE_ARCS.flatMap(a => a.dataCategories ?? []))
      ).sort(),
    []
  );
  const visibleCorridorCount = useMemo(
    () =>
      GLOBE_ARCS.filter(a => {
        const eff = whatIf && a.status === "approval" ? "blocked" : a.status;
        if (corridorFilter !== "all" && eff !== corridorFilter) return false;
        if (
          categoryFilter !== "all" &&
          !(a.dataCategories ?? []).includes(categoryFilter)
        )
          return false;
        return true;
      }).length,
    [corridorFilter, categoryFilter, whatIf]
  );
  const globeKpis = useMemo(() => {
    const c = { cleared: 0, approval: 0, blocked: 0 };
    for (const a of GLOBE_ARCS) {
      const eff = whatIf && a.status === "approval" ? "blocked" : a.status;
      if (eff) c[eff as keyof typeof c]++;
    }
    return { hubs: globeMarkers.length, corridors: GLOBE_ARCS.length, ...c };
  }, [globeMarkers.length, whatIf]);
  const compareData = useMemo(
    () =>
      compare.map(j => {
        const fws = (globalFwQuery.data ?? []).filter(
          f => f.jurisdiction === j
        );
        return { j, count: fws.length, codes: fws.map(f => f.code) };
      }),
    [compare, globalFwQuery.data]
  );
  const sharedCodes = useMemo(() => {
    if (compareData.length < 2) return [];
    const setB = new Set(compareData[1].codes);
    return compareData[0].codes.filter(c => setB.has(c));
  }, [compareData]);
  const selectedFrameworks = useMemo(() => {
    if (!globeSel) return [];
    return (globalFwQuery.data ?? [])
      .filter(f => f.jurisdiction === globeSel.id)
      .slice(0, 8);
  }, [globalFwQuery.data, globeSel]);

  const selectedArc = useMemo(
    () =>
      globeSel?.type === "arc"
        ? (GLOBE_ARCS.find(a => a.label === globeSel.label) ?? null)
        : null,
    [globeSel]
  );

  // Deep-link: apply ?jurisdiction/?status/?category/?whatif on load (once).
  const globeHydratedRef = useRef(false);
  useEffect(() => {
    if (globeHydratedRef.current || globeMarkers.length === 0) return;
    globeHydratedRef.current = true;
    const sp = new URLSearchParams(window.location.search);
    const j = sp.get("jurisdiction");
    if (j) {
      const m = globeMarkers.find(x => (x.id ?? x.label) === j);
      if (m)
        setGlobeSel({
          type: "hub",
          id: j,
          label: m.label ?? j,
          value: m.value,
        });
    }
    const st = sp.get("status");
    if (st && ["cleared", "approval", "blocked"].includes(st)) {
      setCorridorFilter(st as CorridorStatus);
    }
    const cat = sp.get("category");
    if (cat) setCategoryFilter(cat);
    const rg = sp.get("region");
    if (rg) setRegionFilter(rg);
    if (sp.get("whatif") === "1") setWhatIf(true);
  }, [globeMarkers]);
  // …and reflect selection + filters back into the URL so views are shareable.
  useEffect(() => {
    const url = new URL(window.location.href);
    const set = (k: string, v: string | null) => {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    };
    set("jurisdiction", globeSel?.type === "hub" ? globeSel.id : null);
    set("status", corridorFilter !== "all" ? corridorFilter : null);
    set("category", categoryFilter !== "all" ? categoryFilter : null);
    set("region", regionFilter !== "all" ? regionFilter : null);
    set("whatif", whatIf ? "1" : null);
    window.history.replaceState({}, "", url.toString());
  }, [globeSel, corridorFilter, categoryFilter, regionFilter, whatIf]);

  // Esc clears the current selection.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGlobeSel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const liveJobCount = useMemo(() => {
    if (!jobsQuery.data) return 0;
    return jobsQuery.data.filter(
      j => j.status === "running" || j.status === "queued"
    ).length;
  }, [jobsQuery.data]);

  const gapCount = useMemo(() => {
    const m = matrixQuery.data;
    if (!m) return 0;
    return (m as Array<{ maxSeverity?: string }>).filter(
      r => r.maxSeverity === "critical" || r.maxSeverity === "high"
    ).length;
  }, [matrixQuery.data]);
  const hasLiveDataError = jobsQuery.isError || matrixQuery.isError;

  const threatLevel: ThreatLevel =
    gapCount === 0
      ? "NORMAL"
      : gapCount <= 3
        ? "ELEVATED"
        : gapCount <= 8
          ? "HIGH"
          : "CRITICAL";

  // Session uptime
  const [uptimeSecs, setUptimeSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setUptimeSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const uptimeFmt = useMemo(() => {
    const h = Math.floor(uptimeSecs / 3600);
    const m = Math.floor((uptimeSecs % 3600) / 60);
    const s = uptimeSecs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [uptimeSecs]);

  return (
    <div className="djac-page">
      {/* ── Ambient radial backgrounds ───────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: isDark
            ? `radial-gradient(ellipse 80% 45% at 70% -5%, ${C.cyan}06 0%, transparent 65%),
                       radial-gradient(ellipse 50% 35% at 5% 85%, ${C.purple}06 0%, transparent 60%)`
            : `radial-gradient(ellipse 80% 45% at 70% -5%, ${C.cyan}05 0%, transparent 65%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {hasLiveDataError && (
          <div
            style={{
              border: `1px solid ${C.red}44`,
              background: isDark ? `${C.red}10` : `${C.red}08`,
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: isDark ? "#ef4444" : C.red,
                }}
              >
                {t("proIntel.errorTitle", "Live intelligence data unavailable")}
              </p>
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "var(--djac-muted)",
                }}
              >
                {t(
                  "proIntel.errorDesc",
                  "Failed to refresh AI job activity or the compliance matrix."
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void jobsQuery.refetch();
                void matrixQuery.refetch();
              }}
            >
              {t("common.retry", "Retry")}
            </Button>
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────────── */}
        <div
          className="djac-section-1"
          style={{
            background: isDark
              ? `linear-gradient(135deg, rgba(0,247,255,0.04) 0%, rgba(147,89,236,0.03) 100%)`
              : `linear-gradient(135deg, rgba(2,132,199,0.04) 0%, rgba(124,58,237,0.02) 100%)`,
            border: `1px solid ${C.cyan}20`,
            borderRadius: 18,
            padding: "20px 24px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            boxShadow: isDark
              ? `0 0 60px ${C.cyan}06, inset 0 1px 0 ${C.cyan}15`
              : `inset 0 1px 0 ${C.cyan}20`,
          }}
        >
          {/* Left: title */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              <Badge
                style={{
                  fontSize: 10,
                  height: 22,
                  gap: 4,
                  background: `${C.purple}18`,
                  border: `1px solid ${C.purple}45`,
                  color: C.purple,
                  borderRadius: 99,
                }}
              >
                <Sparkles className="h-2.5 w-2.5" />
                {t("proIntel.commandCenter", "Command Center")}
              </Badge>
              <Badge
                style={{
                  fontSize: 10,
                  height: 22,
                  gap: 5,
                  background: `${C.cyan}12`,
                  border: `1px solid ${C.cyan}38`,
                  color: C.cyan,
                  borderRadius: 99,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: C.cyan,
                    display: "inline-block",
                    animation: "djac-live-ping 1.8s ease-in-out infinite",
                  }}
                />
                {t("proIntel.liveBadge", "Live")}
              </Badge>
              <ThreatBar level={threatLevel} isDark={isDark} />
            </div>
            <h1
              style={{
                color: "var(--djac-text)",
                fontSize: 24,
                fontWeight: 900,
                margin: 0,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
              }}
            >
              {t("proIntel.title", "Pro Intelligence Dashboard")}
            </h1>
            <p
              style={{
                color: "var(--djac-muted)",
                fontSize: 12.5,
                margin: "5px 0 0",
                lineHeight: 1.5,
                maxWidth: 520,
              }}
            >
              {t(
                "proIntel.subtitle",
                "Sino-Gulf data residency · AI pipeline transparency · Regulatory enforcement pulse"
              )}
            </p>
          </div>
          {/* Right: module badges + clock */}
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {(
              [
                {
                  icon: Globe2,
                  label: t("proIntel.badgeHeatmap", "Heatmap"),
                  color: C.cyan,
                },
                {
                  icon: Bot,
                  label: t("proIntel.badgePipeline", "Pipeline"),
                  color: C.green,
                },
                {
                  icon: Brain,
                  label: t("proIntel.badgePulse", "Reg Pulse"),
                  color: C.orange,
                },
                { icon: Shield, label: "Radar", color: C.purple },
              ] as const
            ).map(({ icon: Icon, label, color }) => (
              <span
                key={label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color,
                  background: `${color}10`,
                  border: `1px solid ${color}25`,
                  borderRadius: 8,
                  padding: "5px 11px",
                  boxShadow: isDark ? `0 0 10px ${color}15` : "none",
                }}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </span>
            ))}
            {/* Live clock */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                background: isDark ? `${C.cyan}08` : `${C.cyan}06`,
                border: `1px solid ${C.cyan}30`,
                borderRadius: 12,
                padding: "7px 15px",
                minWidth: 140,
                boxShadow: isDark ? `0 0 20px ${C.cyan}15` : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 22,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  color: C.cyan,
                  lineHeight: 1.1,
                  textShadow: isDark ? `0 0 20px ${C.cyan}80` : "none",
                }}
              >
                {timePart}
              </span>
              <span
                style={{
                  fontSize: 9.5,
                  color: "var(--djac-muted)",
                  letterSpacing: "0.04em",
                  marginTop: 2,
                }}
              >
                {datePart}
              </span>
            </div>
          </div>
        </div>

        {/* ── KPI Stats Strip ───────────────────────────────────────── */}
        <div
          className="djac-section-2"
          style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          <StatTile
            label="Frameworks Monitored"
            value={6}
            icon={Shield}
            color={C.cyan}
            isDark={isDark}
            sublabel="PIPL · PDPL · CSL · DSL · ECC · Gen AI"
            sparkValues={[60, 75, 55, 90, 70, 85, 80, 65, 92, 78]}
          />
          <StatTile
            label="Active Corridors"
            value={7}
            icon={Globe2}
            color={C.green}
            isDark={isDark}
            sublabel="Sino-Gulf cross-border routes"
            sparkValues={[80, 65, 90, 72, 85, 60, 95, 70, 88, 75]}
          />
          <StatTile
            label="Compliance Gaps"
            value={gapCount}
            icon={AlertTriangle}
            color={C.orange}
            isDark={isDark}
            sublabel={
              gapCount === 0
                ? "No critical gaps detected"
                : "Critical / High severity"
            }
            pulse={gapCount > 0}
            sparkValues={[30, 45, 20, 60, 35, 50, 25, 40, 55, 30]}
          />
          <StatTile
            label="AI Jobs Running"
            value={liveJobCount}
            icon={Cpu}
            color={C.purple}
            isDark={isDark}
            sublabel="Active pipeline assessments"
            pulse={liveJobCount > 0}
            sparkValues={[50, 70, 45, 80, 60, 75, 55, 85, 65, 90]}
          />
          {/* Uptime tile */}
          <div
            className="djac-pro-kpi-card"
            style={{
              flex: "1 1 160px",
              background: isDark ? `${C.green}06` : `${C.green}04`,
              border: `1px solid ${C.green}20`,
              borderTop: `2px solid ${C.green}`,
              borderRadius: 14,
              padding: "15px 16px 13px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 90,
                height: 90,
                background: `${C.green}18`,
                borderRadius: "50%",
                filter: "blur(28px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: `${C.green}CC`,
                  textTransform: "uppercase",
                  letterSpacing: "0.11em",
                }}
              >
                Session Uptime
              </span>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 7,
                  background: `${C.green}14`,
                  border: `1px solid ${C.green}28`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Activity className="h-3.5 w-3.5" style={{ color: C.green }} />
              </div>
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 24,
                fontWeight: 900,
                color: C.green,
                lineHeight: 1,
                textShadow: isDark ? `0 0 24px ${C.green}55` : "none",
              }}
            >
              {uptimeFmt}
            </span>
            <span style={{ fontSize: 9, color: "var(--djac-muted)" }}>
              hh:mm:ss · dashboard live
            </span>
            <span
              style={{
                position: "absolute",
                bottom: 10,
                right: 11,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: C.green,
                animation: "djac-live-ping 1.8s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* ── Ticker tape ───────────────────────────────────────────── */}
        <div className="djac-section-2b">
          <TickerTape isDark={isDark} color={C.cyan} />
        </div>

        {/* ── 3D Globe: regulatory hubs + corridors ─────────────────── */}
        <section
          className="djac-section-2c"
          aria-label={t("proIntel.globeSection", "3D Regulatory Globe")}
        >
          <SectionLabel
            icon={Globe2}
            label={t("proIntel.badgeGlobe", "Global Regulatory Network")}
            color={C.cyan}
            sublabel="Regulatory hubs and cross-border corridors"
          />
          <div
            style={{
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              margin: "2px 0 12px",
            }}
          >
            {[
              {
                v: globeKpis.hubs,
                l: t("proIntel.kpiHubs", "Hubs"),
                c: C.cyan,
              },
              {
                v: globeKpis.corridors,
                l: t("proIntel.kpiCorridors", "Corridors"),
                c: "#94a3b8",
              },
              {
                v: globeKpis.cleared,
                l: t("proIntel.kpiCleared", "Cleared"),
                c: "#10b981",
              },
              {
                v: globeKpis.approval,
                l: t("proIntel.kpiApproval", "Approval"),
                c: "#f59e0b",
              },
              {
                v: globeKpis.blocked,
                l: t("proIntel.kpiBlocked", "Blocked"),
                c: "#ef4444",
              },
            ].map(k => (
              <div key={k.l}>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.c }}>
                  {k.v}
                </div>
                <div style={{ fontSize: 10.5, color: "#94a3b8" }}>{k.l}</div>
              </div>
            ))}
          </div>
          {compare.length > 0 && (
            <div
              style={{
                marginBottom: 12,
                border: `1px solid ${C.cyan}44`,
                background: "rgba(2,10,25,0.55)",
                borderRadius: 12,
                padding: "12px 16px",
                color: "#dbeafe",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <strong style={{ fontSize: 13 }}>
                  {t("proIntel.compare", "Compare jurisdictions")}
                </strong>
                <button
                  type="button"
                  onClick={() => setCompare([])}
                  aria-label="Clear comparison"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9fb4d4",
                    cursor: "pointer",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    compareData.length === 2 ? "1fr 1fr" : "1fr",
                  gap: 14,
                }}
              >
                {compareData.map(d => (
                  <div key={d.j}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{d.j}</div>
                    <div style={{ fontSize: 12, color: C.cyan }}>
                      {d.count} frameworks
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9fb4d4",
                        marginTop: 4,
                      }}
                    >
                      {d.codes.join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
              {compare.length === 2 ? (
                <p
                  style={{ margin: "10px 0 0", fontSize: 12, color: "#9fb4d4" }}
                >
                  {t("proIntel.shared", "Shared frameworks")}:{" "}
                  {sharedCodes.length ? sharedCodes.join(" · ") : "—"}
                </p>
              ) : (
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: 11.5,
                    color: "#94a3b8",
                  }}
                >
                  {t(
                    "proIntel.compareHint",
                    "Click hubs on the globe to add up to two jurisdictions."
                  )}
                </p>
              )}
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: globeSel
                ? "minmax(0,1.1fr) minmax(0,0.9fr)"
                : "1fr",
              gap: 18,
              alignItems: "center",
            }}
          >
            <Globe3D
              markers={globeMarkers.length > 0 ? globeMarkers : undefined}
              selectedId={globeSel?.type === "hub" ? globeSel.id : null}
              filterStatus={corridorFilter}
              filterCategory={categoryFilter === "all" ? null : categoryFilter}
              filterRegion={regionFilter === "all" ? null : regionFilter}
              whatIf={whatIf}
              timelapse={timelapse}
              showLabels={showLabels}
              autoRotate={autoRotate}
              selectedArc={selectedArc}
              onSelect={sel => {
                if (compareMode && sel.type === "hub") {
                  setCompare(prev =>
                    prev.includes(sel.id)
                      ? prev.filter(x => x !== sel.id)
                      : prev.length >= 2
                        ? [prev[1], sel.id]
                        : [...prev, sel.id]
                  );
                  return;
                }
                setGlobeSel({
                  type: sel.type,
                  id: sel.id,
                  label: sel.label,
                  value: sel.value,
                  status: sel.status,
                  dataCategories: sel.dataCategories,
                });
              }}
            />
            {globeSel && (
              <div
                style={{
                  border: `1px solid ${
                    globeSel.type === "arc" && globeSel.status
                      ? CORRIDOR_STATUS_META[globeSel.status].color
                      : C.cyan
                  }55`,
                  background: "rgba(2,10,25,0.55)",
                  borderRadius: 14,
                  padding: "18px 20px",
                  color: "#dbeafe",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                    {globeSel.label}
                  </h3>
                  {globeSel.type === "hub" ? (
                    <span style={{ fontSize: 12, color: C.cyan }}>
                      <CountUp
                        value={globeSel.value ?? selectedFrameworks.length}
                      />{" "}
                      frameworks
                    </span>
                  ) : globeSel.status ? (
                    <span
                      style={{
                        fontSize: 12,
                        color: CORRIDOR_STATUS_META[globeSel.status].color,
                      }}
                    >
                      {CORRIDOR_STATUS_META[globeSel.status].label}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setGlobeSel(null)}
                    aria-label="Close panel"
                    style={{
                      marginInlineStart: "auto",
                      background: "transparent",
                      border: "none",
                      color: "#9fb4d4",
                      cursor: "pointer",
                      fontSize: 18,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>

                {globeSel.type === "hub" ? (
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    {selectedFrameworks.map(f => (
                      <li
                        key={f.code}
                        style={{ display: "flex", gap: 8, fontSize: 13 }}
                      >
                        <span
                          style={{
                            fontFamily: "ui-monospace, monospace",
                            fontSize: 11,
                            color: C.cyan,
                            minWidth: 78,
                          }}
                        >
                          {f.code}
                        </span>
                        <span style={{ color: "#9fb4d4" }}>{f.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>
                    {globeSel.dataCategories?.length ? (
                      <div style={{ marginBottom: 10 }}>
                        <div
                          style={{
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            color: "#94a3b8",
                          }}
                        >
                          {t("proIntel.dataCategories", "Data categories")}
                        </div>
                        <div style={{ fontSize: 13, marginTop: 2 }}>
                          {globeSel.dataCategories.join(", ")}
                        </div>
                      </div>
                    ) : null}
                    <p
                      style={{
                        fontSize: 12,
                        color: "#9fb4d4",
                        margin: "0 0 4px",
                      }}
                    >
                      {t(
                        "proIntel.corridorHint",
                        "Cross-border data corridor between regulatory hubs."
                      )}
                    </p>
                  </div>
                )}

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {globeSel.type === "hub" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/global-registry?jurisdiction=${encodeURIComponent(
                            globeSel.id
                          )}`
                        )
                      }
                    >
                      Open in Global Registry
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/cross-border-data-flow")}
                    >
                      Open analysis
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard?.writeText(window.location.href);
                    }}
                  >
                    Copy link
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
            role="group"
            aria-label={t("proIntel.corridorFilter", "Filter corridors")}
          >
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {t("proIntel.corridors", "Corridors")}:
            </span>
            {(
              [
                ["all", "All"],
                ["cleared", "Cleared"],
                ["approval", "Approval"],
                ["blocked", "Blocked"],
              ] as const
            ).map(([v, label]) => {
              const active = corridorFilter === v;
              const col =
                v === "all"
                  ? C.cyan
                  : CORRIDOR_STATUS_META[v as CorridorStatus].color;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCorridorFilter(v)}
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${active ? col : "rgba(148,163,184,0.3)"}`,
                    background: active ? `${col}22` : "rgba(2,10,25,0.5)",
                    color: active ? col : "#9fb4d4",
                  }}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={whatIf}
              onClick={() => setWhatIf(v => !v)}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${
                  whatIf ? "#ef4444" : "rgba(148,163,184,0.3)"
                }`,
                background: whatIf
                  ? "rgba(239,68,68,0.15)"
                  : "rgba(2,10,25,0.5)",
                color: whatIf ? "#fca5a5" : "#9fb4d4",
              }}
            >
              {t("proIntel.whatIf", "What-if: stricter rules")}
            </button>
            <button
              type="button"
              aria-pressed={timelapse}
              onClick={() => setTimelapse(v => !v)}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${
                  timelapse ? C.cyan : "rgba(148,163,184,0.3)"
                }`,
                background: timelapse ? `${C.cyan}22` : "rgba(2,10,25,0.5)",
                color: timelapse ? C.cyan : "#9fb4d4",
              }}
            >
              {t("proIntel.timelapse", "Time-lapse")}
            </button>
            <button
              type="button"
              onClick={exportCorridorsCsv}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,10,25,0.5)",
                color: "#9fb4d4",
              }}
            >
              {t("proIntel.exportCsv", "Export CSV")}
            </button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(
                  corridorsSummary({
                    whatIf,
                    status: corridorFilter,
                    category: categoryFilter,
                    region: regionFilter,
                  })
                );
              }}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,10,25,0.5)",
                color: "#9fb4d4",
              }}
            >
              {t("proIntel.copySummary", "Copy summary")}
            </button>
            <button
              type="button"
              aria-pressed={showLabels}
              onClick={() => setShowLabels(v => !v)}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${
                  showLabels ? C.cyan : "rgba(148,163,184,0.3)"
                }`,
                background: showLabels ? `${C.cyan}22` : "rgba(2,10,25,0.5)",
                color: showLabels ? C.cyan : "#9fb4d4",
              }}
            >
              {t("proIntel.labels", "Labels")}
            </button>
            <button
              type="button"
              aria-pressed={autoRotate}
              onClick={() => setAutoRotate(v => !v)}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${
                  autoRotate ? C.cyan : "rgba(148,163,184,0.3)"
                }`,
                background: autoRotate ? `${C.cyan}22` : "rgba(2,10,25,0.5)",
                color: autoRotate ? C.cyan : "#9fb4d4",
              }}
            >
              {t("proIntel.spin", "Spin")}
            </button>
            <button
              type="button"
              aria-pressed={compareMode}
              onClick={() => {
                setCompareMode(v => !v);
                if (compareMode) setCompare([]);
              }}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${
                  compareMode ? C.cyan : "rgba(148,163,184,0.3)"
                }`,
                background: compareMode ? `${C.cyan}22` : "rgba(2,10,25,0.5)",
                color: compareMode ? C.cyan : "#9fb4d4",
              }}
            >
              {t("proIntel.compareBtn", "Compare")}
            </button>
            {(corridorFilter !== "all" ||
              categoryFilter !== "all" ||
              whatIf ||
              timelapse ||
              regionFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setCorridorFilter("all");
                  setCategoryFilter("all");
                  setWhatIf(false);
                  setTimelapse(false);
                  setRegionFilter("all");
                  setCompare([]);
                  setGlobeSel(null);
                }}
                style={{
                  fontSize: 11,
                  padding: "3px 10px",
                  borderRadius: 999,
                  cursor: "pointer",
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(2,10,25,0.5)",
                  color: "#9fb4d4",
                }}
              >
                {t("proIntel.resetFilters", "Reset filters")}
              </button>
            )}
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {t("proIntel.showing", "Showing")} {visibleCorridorCount}/
              {GLOBE_ARCS.length}
            </span>
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
            role="group"
            aria-label={t("proIntel.categoryFilter", "Filter by data category")}
          >
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {t("proIntel.dataType", "Data type")}:
            </span>
            {["all", ...corridorCategories].map(cat => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${
                      active ? C.cyan : "rgba(148,163,184,0.3)"
                    }`,
                    background: active ? `${C.cyan}22` : "rgba(2,10,25,0.5)",
                    color: active ? C.cyan : "#9fb4d4",
                  }}
                >
                  {cat === "all" ? t("common.all", "All") : cat}
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
            role="group"
            aria-label={t("proIntel.regionFilter", "Filter by region")}
          >
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {t("proIntel.region", "Region")}:
            </span>
            {["all", ...globeRegions].map(r => {
              const active = regionFilter === r;
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setRegionFilter(r)}
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${
                      active ? C.cyan : "rgba(148,163,184,0.3)"
                    }`,
                    background: active ? `${C.cyan}22` : "rgba(2,10,25,0.5)",
                    color: active ? C.cyan : "#9fb4d4",
                  }}
                >
                  {r === "all" ? t("common.all", "All") : r}
                </button>
              );
            })}
          </div>
          {whatIf && (
            <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#fca5a5" }}>
              {t(
                "proIntel.whatIfCaption",
                "Stress test: approval-required corridors are shown as blocked."
              )}
            </p>
          )}
          {globeMarkers.length > 0 && (
            <div
              style={{
                marginTop: 14,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
              aria-label={t("proIntel.globeHubs", "Jurisdictions")}
            >
              {globeMarkers
                .slice()
                .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
                .map(m => {
                  const id = m.id ?? m.label ?? "";
                  const active = globeSel?.id === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setGlobeSel({
                          type: "hub",
                          id,
                          label: m.label ?? id,
                          value: m.value,
                        })
                      }
                      style={{
                        fontSize: 11,
                        padding: "3px 9px",
                        borderRadius: 999,
                        cursor: "pointer",
                        border: `1px solid ${
                          active ? C.cyan : "rgba(148,163,184,0.3)"
                        }`,
                        background: active
                          ? "rgba(0,210,255,0.15)"
                          : "rgba(2,10,25,0.5)",
                        color: active ? "#bae6fd" : "#9fb4d4",
                      }}
                    >
                      {m.label}
                      <span style={{ opacity: 0.55 }}> {m.value ?? 0}</span>
                    </button>
                  );
                })}
            </div>
          )}
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              alignItems: "center",
            }}
            aria-label={t("proIntel.globeCorridors", "Cross-border corridors")}
          >
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              {t("proIntel.corridorList", "Cross-border corridors")}:
            </span>
            {GLOBE_ARCS.map(a => {
              const id = a.label ?? "";
              const active = globeSel?.type === "arc" && globeSel.id === id;
              const col = a.status
                ? CORRIDOR_STATUS_META[a.status].color
                : "#38bdf8";
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setGlobeSel({
                      type: "arc",
                      id,
                      label: id,
                      status: a.status,
                      dataCategories: a.dataCategories,
                    })
                  }
                  style={{
                    fontSize: 11,
                    padding: "3px 9px",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${
                      active ? col : "rgba(148,163,184,0.3)"
                    }`,
                    background: active ? `${col}22` : "rgba(2,10,25,0.5)",
                    color: active ? col : "#9fb4d4",
                  }}
                >
                  <span style={{ color: col }}>●</span> {id}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Row 1: Heatmap ────────────────────────────────────────── */}
        <section
          className="djac-section-3"
          aria-label={t("proIntel.heatmapSection", "Regulatory Heatmap")}
          dir="ltr"
        >
          <SectionLabel
            icon={Globe2}
            label={t("proIntel.badgeHeatmap", "Regulatory Corridor Heatmap")}
            color={C.cyan}
            sublabel="Sino-Gulf cross-border data architecture"
          />
          <SinoGulfArchitecture />
        </section>

        {/* ── Row 2: Pipeline + Pulse ───────────────────────────────── */}
        <div
          className="djac-section-4"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)",
            gap: 20,
            alignItems: "stretch",
          }}
          id="pro-intel-grid-2"
        >
          <section
            aria-label={t("proIntel.pipelineSection", "AI Orchestration Feed")}
          >
            <SectionLabel
              icon={Bot}
              label={t("proIntel.badgePipeline", "AI Orchestration Pipeline")}
              color={C.green}
              sublabel="Glass-box assessment engine"
            />
            <AIOrchestrationFeed />
          </section>
          <section
            aria-label={t("proIntel.pulseSection", "Regulatory Pulse Matrix")}
          >
            <SectionLabel
              icon={Brain}
              label={t("proIntel.badgePulse", "Regulatory Pulse Matrix")}
              color={C.orange}
              sublabel="Enforcement · Penalty exposure · PIPL calculator"
            />
            <RegulatoryPulseMatrix />
          </section>
        </div>

        {/* ── Row 3: Framework Radar + AI Activity ─────────────────── */}
        <div
          className="djac-section-5"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: 20,
            alignItems: "stretch",
          }}
          id="pro-intel-grid-3"
        >
          <FrameworkRadar C={C} isDark={isDark} />
          <AIJobsActivity C={C} isDark={isDark} jobCount={liveJobCount} />
        </div>

        {/* ── Footer system status ──────────────────────────────────── */}
        <div
          className="djac-section-6"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            padding: "12px 16px",
            background: isDark ? "rgba(255,255,255,0.018)" : "rgba(0,0,0,0.02)",
            border: `1px solid var(--djac-border)`,
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            {(
              [
                { label: "AI Engine", ok: true, color: C.green },
                { label: "DB Layer", ok: true, color: C.green },
                { label: "Compliance API", ok: true, color: C.green },
                { label: "Redis Queue", ok: liveJobCount >= 0, color: C.green },
                { label: "Threat Monitor", ok: true, color: C.cyan },
              ] as const
            ).map(({ label, ok, color }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: ok ? color : C.red,
                    display: "inline-block",
                    boxShadow: ok ? `0 0 6px ${color}88` : `0 0 6px ${C.red}88`,
                    animation: ok
                      ? "djac-live-ping 2.4s ease-in-out infinite"
                      : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 10.5,
                    color: "var(--djac-muted)",
                    fontWeight: 600,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: ok ? color : C.red,
                    fontWeight: 800,
                  }}
                >
                  {ok ? "OK" : "DOWN"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <BarChart3
              className="h-3 w-3"
              style={{ color: "var(--djac-muted)" }}
            />
            <span style={{ fontSize: 10.5, color: "var(--djac-muted)" }}>
              DJAC Pro Intelligence v3 · {gapCount} active gaps · {liveJobCount}{" "}
              AI jobs · {uptimeFmt} uptime
            </span>
          </div>
        </div>
      </div>

      {/* Global keyframes + responsive */}
      <style>{`
                @keyframes djac-live-ping {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0.2; }
                }
                @keyframes djac-pulse-bar {
                    0%, 100% { filter: brightness(1); }
                    50%       { filter: brightness(1.7); }
                }
                @keyframes djac-ticker-scroll {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes djac-bar-grow {
                    from { transform: scaleY(0); }
                    to   { transform: scaleY(1); }
                }
                @keyframes djac-bar-grow-x {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
                @keyframes djac-radar-draw {
                    from { opacity: 0; transform: scale(0.6); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @keyframes djac-gradient-shift {
                    0%   { background-position: 0%   50%; }
                    50%  { background-position: 100% 50%; }
                    100% { background-position: 0%   50%; }
                }
                .djac-ticker-inner {
                    animation: djac-ticker-scroll 65s linear infinite;
                    will-change: transform;
                }
                .djac-ticker-inner:hover { animation-play-state: paused; }
                .djac-pro-kpi-card {
                    transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1),
                                box-shadow 0.2s ease, border-color 0.2s ease;
                }
                .djac-pro-kpi-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 30px -12px rgba(0,0,0,0.22);
                }
                @media (max-width: 960px) {
                    #pro-intel-grid-2, #pro-intel-grid-3 { grid-template-columns: minmax(0,1fr) !important; }
                }
                @media (max-width: 600px) {
                    #pro-intel-grid-2, #pro-intel-grid-3 { gap: 12px !important; }
                }
            `}</style>
    </div>
  );
});

export default ProIntelligenceDashboard;
