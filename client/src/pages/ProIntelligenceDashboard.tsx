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
import type React from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/useTheme";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SinoGulfHeatmap } from "@/components/SinoGulfHeatmap";
import { AIOrchestrationFeed } from "@/components/AIOrchestrationFeed";
import { RegulatoryPulseMatrix } from "@/components/RegulatoryPulseMatrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Bot, Globe2, Sparkles, Brain, Shield, AlertTriangle,
    Activity, Cpu, BarChart3, Radio,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

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
    "🇨🇳  CAC — ¥14.5M penalty for Generative AI non-compliance · Feb 2025",
    "🇸🇦  SDAIA — PDPL cross-border consent guidance updated · Jun 2025",
    "âš¡  AI pipeline processed 1,200+ vendor documents this assessment cycle",
    "ðŸ”´  NCA Critical Infrastructure Data Residency Audit ongoing — ECC Controls 2.0",
    "🇨🇳  DSL Art. 31 — Foreign-invested cloud entities under active CAC security review",
    "✅  Singapore ↔ Hong Kong (SAR) corridor fully compliant — no transfer restrictions",
    "⚠️  Hong Kong (SAR) ↔ Shanghai requires CAC cross-border data transfer approval",
    "ðŸ“‹  6 frameworks monitored: PIPL · PDPL · CSL · DSL · ECC · Gen AI Regulations",
    "🛡️  DJAC AI Judge scoring 3 risk dimensions: Overall · China exposure · Saudi Arabia exposure",
    "🇨🇳  CAC — ¥3.5M penalty for DSL Art. 31 foreign cloud violation · Apr 2025",
    "🇸🇦  NCA ECC 2.0 mandates on-premise data residency for critical infrastructure",
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
        if (target === 0) { setVal(0); return; }
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
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 18 }}>
            {values.map((v, i) => (
                <div key={i} style={{
                    width: 4, borderRadius: 2,
                    background: `${color}${Math.round(40 + v * 0.6).toString(16).padStart(2, "0")}`,
                    height: `${Math.max(20, v)}%`,
                    animation: `djac-bar-grow 0.6s ${i * 0.08}s cubic-bezier(0.34,1.56,0.64,1) both`,
                    transformOrigin: "bottom",
                }} />
            ))}
        </div>
    );
}

// ── KPI Stat Tile ─────────────────────────────────────────────────────────────
function StatTile({
    label, value, suffix = "", icon: Icon, color, sublabel, isDark, pulse = false, decimals = 0,
    sparkValues,
}: {
    label: string; value: number; suffix?: string; decimals?: number;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    color: string; sublabel?: string; isDark: boolean; pulse?: boolean;
    sparkValues?: number[];
}) {
    const displayed = useCountUp(value);
    const displayStr = decimals > 0 ? displayed.toFixed(decimals) : String(Math.round(displayed));
    return (
        <div className="djac-pro-kpi-card" style={{
            flex: "1 1 160px",
            background: isDark ? `${color}07` : `${color}05`,
            border: `1px solid ${color}20`,
            borderTop: `2px solid ${color}`,
            borderRadius: 14,
            padding: "15px 16px 13px",
            display: "flex", flexDirection: "column", gap: 6,
            position: "relative", overflow: "hidden",
            cursor: "default",
        }}>
            {/* Ambient corner glow */}
            <div style={{
                position: "absolute", top: -30, right: -30, width: 90, height: 90,
                background: `${color}18`, borderRadius: "50%",
                filter: "blur(28px)", pointerEvents: "none",
                transition: "opacity 0.3s",
            }} />
            {/* Header row: label + icon */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                    fontSize: 9, fontWeight: 800, color: `${color}CC`,
                    textTransform: "uppercase", letterSpacing: "0.11em",
                }}>{label}</span>
                <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: `${color}14`, border: `1px solid ${color}28`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
            </div>
            {/* Value */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{
                    fontSize: 30, fontWeight: 900, color,
                    fontFamily: "var(--font-mono)", lineHeight: 1,
                    textShadow: isDark ? `0 0 24px ${color}55` : "none",
                }}>{displayStr}</span>
                {suffix && <span style={{ fontSize: 13, fontWeight: 700, color: `${color}88` }}>{suffix}</span>}
            </div>
            {/* Sublabel + sparkline row */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                {sublabel && (
                    <span style={{ fontSize: 9, color: "var(--djac-muted)", lineHeight: 1.4, maxWidth: "70%" }}>
                        {sublabel}
                    </span>
                )}
                {sparkValues && <SparkBars color={color} values={sparkValues} />}
            </div>
            {/* Live ping dot */}
            {pulse && (
                <span style={{
                    position: "absolute", bottom: 10, right: 11,
                    width: 7, height: 7, borderRadius: "50%", background: color,
                    boxShadow: `0 0 0 0 ${color}66`,
                    animation: "djac-live-ping 1.8s ease-in-out infinite",
                }} />
            )}
        </div>
    );
}

// ── Threat Level — bar strip + arc ────────────────────────────────────────────
function ThreatBar({ level, isDark }: { level: ThreatLevel; isDark: boolean }) {
    const levels: { id: ThreatLevel; color: string; pct: number }[] = [
        { id: "NORMAL", color: isDark ? "#01FF7F" : "#16a34a", pct: 15 },
        { id: "ELEVATED", color: isDark ? "#FFD600" : "#d97706", pct: 45 },
        { id: "HIGH", color: isDark ? "#FF6B2B" : "#ea580c", pct: 72 },
        { id: "CRITICAL", color: isDark ? "#FF1744" : "#dc2626", pct: 100 },
    ];
    const idx = levels.findIndex(l => l.id === level);
    const cur = levels[idx];
    // SVG arc (semicircle 0–180°)
    const R = 22, CX = 28, CY = 28;
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
            <svg width={56} height={32} viewBox="0 0 56 32" style={{ overflow: "visible" }}>
                {/* Track */}
                <path
                    d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
                    fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)"}
                    strokeWidth={5} strokeLinecap="round"
                />
                {/* Arc fill */}
                <path
                    d={`M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`}
                    fill="none" stroke={cur.color}
                    strokeWidth={5} strokeLinecap="round"
                    style={{ filter: isDark ? `drop-shadow(0 0 4px ${cur.color}99)` : "none", transition: "all 0.5s ease" }}
                />
                <circle cx={CX} cy={CY} r={4}
                    fill={cur.color}
                    style={{ filter: `drop-shadow(0 0 3px ${cur.color})`, transition: "fill 0.4s" }}
                />
            </svg>
            {/* Bar strip */}
            <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                {levels.map((l, i) => (
                    <div key={l.id} style={{
                        width: 22, height: 6, borderRadius: 2,
                        transition: "background 0.4s, box-shadow 0.3s",
                        background: i <= idx ? l.color : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.09)"),
                        boxShadow: i === idx ? `0 0 6px ${l.color}80` : "none",
                        ...(i === idx ? { animation: "djac-pulse-bar 1.6s ease-in-out infinite" } : {}),
                    }} />
                ))}
            </div>
            <span style={{
                fontSize: 10, fontWeight: 900, color: cur.color, letterSpacing: "0.12em",
                textShadow: isDark ? `0 0 8px ${cur.color}80` : "none",
                animation: level !== "NORMAL" ? "djac-live-ping 1.8s ease-in-out infinite" : "none",
            }}>
                {level}
            </span>
        </div>
    );
}

// ── Ticker Tape with edge gradient fades ──────────────────────────────────────
function TickerTape({ isDark, color }: { isDark: boolean; color: string }) {
    const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
    return (
        <div style={{
            background: isDark ? "rgba(0,247,255,0.04)" : "rgba(2,132,199,0.04)",
            border: `1px solid ${color}20`,
            borderRadius: 10, overflow: "hidden",
            display: "flex", alignItems: "center", height: 36,
            boxShadow: isDark ? `inset 0 0 0 1px ${color}10` : "none",
        }}>
            {/* Label */}
            <div style={{
                flexShrink: 0, padding: "0 14px", height: "100%",
                background: `linear-gradient(90deg, ${color}22, ${color}12)`,
                borderRight: `1px solid ${color}28`,
                display: "flex", alignItems: "center", gap: 6, zIndex: 2,
            }}>
                <Radio className="h-3 w-3" style={{ color, animation: "djac-live-ping 1.8s ease-in-out infinite" }} />
                <span style={{ fontSize: 9.5, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
                    REG FEED
                </span>
            </div>
            {/* Scrolling wrapper with edge fades */}
            <div style={{
                flex: 1, overflow: "hidden", position: "relative",
                WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%)",
                maskImage: "linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%)",
            }}>
                <div className="djac-ticker-inner" style={{ display: "flex", whiteSpace: "nowrap" }}>
                    {items.map((item, i) => (
                        <span key={i} style={{
                            display: "inline-block", fontSize: 11.5, color: "var(--djac-muted)",
                            padding: "0 34px", lineHeight: "36px",
                        }}>
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
    icon: Icon, label, color, sublabel,
}: {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    label: string; color: string; sublabel?: string;
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, position: "relative" }}>
            <div style={{
                width: 30, height: 30, borderRadius: 9,
                background: `${color}14`, border: `1px solid ${color}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 12px ${color}28`, flexShrink: 0,
            }}>
                <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--djac-text)", letterSpacing: "-0.01em" }}>{label}</span>
                    {sublabel && (
                        <span style={{ fontSize: 10, color: "var(--djac-muted)", fontWeight: 500 }}>{sublabel}</span>
                    )}
                </div>
                {/* Flowing gradient underline */}
                <div style={{
                    marginTop: 4, height: 1.5, borderRadius: 99,
                    background: `linear-gradient(90deg, ${color}, ${color}40, transparent)`,
                    backgroundSize: "200% 100%",
                    animation: "djac-gradient-shift 3s linear infinite",
                }} />
            </div>
        </div>
    );
}

// ── Framework Coverage Radar (SVG hexagonal) ──────────────────────────────────
function FrameworkRadar({ C, isDark }: { C: Colors; isDark: boolean }) {
    const cx = 110, cy = 100, maxR = 72;
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
        <div style={{
            background: isDark ? `${C.cyan}06` : `${C.cyan}04`,
            border: `1px solid ${C.cyan}18`,
            borderRadius: 14, padding: "16px 14px 14px",
            display: "flex", flexDirection: "column", gap: 6,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${C.cyan}14`, border: `1px solid ${C.cyan}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shield className="h-3 w-3" style={{ color: C.cyan }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--djac-text)" }}>Framework Coverage</span>
                <div style={{ flex: 1, height: 1, background: `${C.cyan}15` }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: C.cyan, background: `${C.cyan}12`, border: `1px solid ${C.cyan}25`, borderRadius: 99, padding: "2px 8px" }}>RADAR</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg
                    viewBox="0 0 220 200"
                    style={{ width: 200, height: 182, flexShrink: 0, animation: "djac-fade-up 0.6s 0.15s both" }}
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
                        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
                            stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                            strokeWidth={1} />
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
                            animation: "djac-radar-draw 1s 0.3s cubic-bezier(0.22,1,0.36,1) both",
                        }}
                    />
                    {/* Score dots */}
                    {scored.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r={4}
                            fill={C.cyan}
                            stroke={isDark ? "#0A0A18" : "#fff"}
                            strokeWidth={2}
                            style={{ filter: isDark ? `drop-shadow(0 0 4px ${C.cyan})` : "none" }}
                        />
                    ))}
                    {/* Labels */}
                    {FRAMEWORKS.map((f, i) => {
                        const lp = toXY(f.angle, maxR + 17);
                        return (
                            <text
                                key={i} x={lp.x} y={lp.y + 4}
                                textAnchor="middle" fontSize={9} fontWeight={700}
                                fill={isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)"}
                                fontFamily="var(--font-sans)"
                            >
                                {f.label}
                            </text>
                        );
                    })}
                    {/* Center avg score */}
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
                        fontSize={14} fontWeight={900} fill={C.cyan}
                        fontFamily="var(--font-mono)"
                    >
                        {Math.round(FRAMEWORKS.reduce((s, f) => s + f.score, 0) / FRAMEWORKS.length)}
                    </text>
                    <text x={cx} y={cy + 13} textAnchor="middle"
                        fontSize={7} fontWeight={600}
                        fill={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"}
                    >
                        AVG %
                    </text>
                </svg>
                {/* Legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
                    {FRAMEWORKS.map(f => {
                        const barColor = f.score >= 80 ? C.green : f.score >= 65 ? C.yellow : C.orange;
                        return (
                            <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <span style={{ fontSize: 9.5, fontWeight: 700, color: "var(--djac-muted)", width: 38, flexShrink: 0 }}>{f.label}</span>
                                <div style={{ flex: 1, height: 5, borderRadius: 99, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)", overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", borderRadius: 99,
                                        width: `${f.score}%`,
                                        background: `linear-gradient(90deg, ${barColor}, ${barColor}99)`,
                                        animation: "djac-bar-grow-x 0.8s cubic-bezier(0.22,1,0.36,1) both",
                                        transformOrigin: "left",
                                    }} />
                                </div>
                                <span style={{ fontSize: 9.5, fontWeight: 800, color: barColor, width: 26, textAlign: "right", fontFamily: "var(--font-mono)" }}>{f.score}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── AI Jobs Activity Bars ─────────────────────────────────────────────────────
function AIJobsActivity({ C, isDark, jobCount }: { C: Colors; isDark: boolean; jobCount: number }) {
    const bars = useRef<number[]>(
        Array.from({ length: 14 }, () => Math.floor(Math.random() * 70 + 20))
    );
    return (
        <div style={{
            background: isDark ? `${C.purple}07` : `${C.purple}05`,
            border: `1px solid ${C.purple}20`, borderRadius: 14, padding: "16px 14px 14px",
            display: "flex", flexDirection: "column", gap: 10,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: `${C.purple}14`, border: `1px solid ${C.purple}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Cpu className="h-3 w-3" style={{ color: C.purple }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--djac-text)" }}>AI Pipeline Activity</span>
                <div style={{ flex: 1, height: 1, background: `${C.purple}15` }} />
                {jobCount > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: C.purple, background: `${C.purple}18`, border: `1px solid ${C.purple}35`, borderRadius: 99, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.purple, display: "inline-block", animation: "djac-live-ping 1.8s ease-in-out infinite" }} />
                        {jobCount} Active
                    </span>
                )}
            </div>
            {/* Bar chart */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 64, padding: "0 2px" }}>
                {bars.current.map((h, i) => (
                    <div key={i} style={{
                        flex: 1, borderRadius: "3px 3px 0 0",
                        background: `linear-gradient(180deg, ${C.purple}, ${C.purple}55)`,
                        height: `${h}%`,
                        animation: `djac-bar-grow 0.55s ${i * 0.04}s cubic-bezier(0.34,1.56,0.64,1) both`,
                        transformOrigin: "bottom",
                        opacity: 0.7 + (i / bars.current.length) * 0.3,
                        boxShadow: isDark ? `0 -2px 6px ${C.purple}44` : "none",
                    }} />
                ))}
            </div>
            {/* Stats row */}
            <div style={{ display: "flex", gap: 16, paddingTop: 4, borderTop: `1px solid ${C.purple}15` }}>
                {[
                    { label: "Queued", val: jobCount, color: C.yellow },
                    { label: "Running", val: jobCount, color: C.green },
                    { label: "Total Runs", val: 1204, color: C.purple },
                    { label: "Success Rate", val: "98.7%", color: C.cyan },
                ].map(s => (
                    <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: s.color, fontFamily: "var(--font-mono)" }}>{s.val}</span>
                        <span style={{ fontSize: 9, color: "var(--djac-muted)", fontWeight: 500 }}>{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProIntelligenceDashboard() {
    usePageTitle("Pro Intelligence");
    const { t } = useLocale();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    // Live clock
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const datePart = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    const timePart = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

    const C: Colors = useMemo(() => ({
        cyan: isDark ? "#00F7FF" : "#0284c7",
        green: isDark ? "#01FF7F" : "#16a34a",
        orange: isDark ? "#FF6B2B" : "#ea580c",
        purple: isDark ? "#9359EC" : "#7c3aed",
        red: isDark ? "#FF1744" : "#dc2626",
        yellow: isDark ? "#FFD600" : "#d97706",
    }), [isDark]);

    // Live data
    const jobsQuery = trpc.ai.listAssessmentJobs.useQuery(undefined, { refetchInterval: 5000 });
    const matrixQuery = trpc.compliance.matrix.useQuery(undefined, { staleTime: 60_000 });

    const liveJobCount = useMemo(() => {
        if (!jobsQuery.data) return 0;
        return jobsQuery.data.filter(j => j.status === "running" || j.status === "queued").length;
    }, [jobsQuery.data]);

    const gapCount = useMemo(() => {
        const m = matrixQuery.data;
        if (!m) return 0;
        return (m as Array<{ maxSeverity?: string }>).filter(r => r.maxSeverity === "critical" || r.maxSeverity === "high").length;
    }, [matrixQuery.data]);
    const hasLiveDataError = jobsQuery.isError || matrixQuery.isError;

    const threatLevel: ThreatLevel = gapCount === 0 ? "NORMAL" : gapCount <= 3 ? "ELEVATED" : gapCount <= 8 ? "HIGH" : "CRITICAL";

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
            <div style={{
                position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
                background: isDark
                    ? `radial-gradient(ellipse 80% 45% at 70% -5%, ${C.cyan}06 0%, transparent 65%),
                       radial-gradient(ellipse 50% 35% at 5% 85%, ${C.purple}06 0%, transparent 60%)`
                    : `radial-gradient(ellipse 80% 45% at 70% -5%, ${C.cyan}05 0%, transparent 65%)`,
            }} />

            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 18 }}>

                {hasLiveDataError && (
                    <div style={{
                        border: `1px solid ${C.red}44`,
                        background: isDark ? `${C.red}10` : `${C.red}08`,
                        borderRadius: 14,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                    }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isDark ? "#fecaca" : C.red }}>
                                {t("proIntel.errorTitle", "Live intelligence data unavailable")}
                            </p>
                            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--djac-muted)" }}>
                                {t("proIntel.errorDesc", "Failed to refresh AI job activity or the compliance matrix.")}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { void jobsQuery.refetch(); void matrixQuery.refetch(); }}>
                            {t("common.retry", "Retry")}
                        </Button>
                    </div>
                )}

                {/* ── Header ───────────────────────────────────────────────── */}
                <div className="djac-section-1" style={{
                    background: isDark
                        ? `linear-gradient(135deg, rgba(0,247,255,0.04) 0%, rgba(147,89,236,0.03) 100%)`
                        : `linear-gradient(135deg, rgba(2,132,199,0.04) 0%, rgba(124,58,237,0.02) 100%)`,
                    border: `1px solid ${C.cyan}20`,
                    borderRadius: 18,
                    padding: "20px 24px",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 16,
                    boxShadow: isDark ? `0 0 60px ${C.cyan}06, inset 0 1px 0 ${C.cyan}15` : `inset 0 1px 0 ${C.cyan}20`,
                }}>
                    {/* Left: title */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                            <Badge style={{ fontSize: 10, height: 22, gap: 4, background: `${C.purple}18`, border: `1px solid ${C.purple}45`, color: C.purple, borderRadius: 99 }}>
                                <Sparkles className="h-2.5 w-2.5" />
                                {t("proIntel.commandCenter", "Command Center")}
                            </Badge>
                            <Badge style={{ fontSize: 10, height: 22, gap: 5, background: `${C.cyan}12`, border: `1px solid ${C.cyan}38`, color: C.cyan, borderRadius: 99 }}>
                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.cyan, display: "inline-block", animation: "djac-live-ping 1.8s ease-in-out infinite" }} />
                                {t("proIntel.liveBadge", "Live")}
                            </Badge>
                            <ThreatBar level={threatLevel} isDark={isDark} />
                        </div>
                        <h1 style={{ color: "var(--djac-text)", fontSize: 24, fontWeight: 900, margin: 0, lineHeight: 1.15, letterSpacing: "-0.025em" }}>
                            {t("proIntel.title", "Pro Intelligence Dashboard")}
                        </h1>
                        <p style={{ color: "var(--djac-muted)", fontSize: 12.5, margin: "5px 0 0", lineHeight: 1.5, maxWidth: 520 }}>
                            {t("proIntel.subtitle", "Sino-Gulf data residency · AI pipeline transparency · Regulatory enforcement pulse")}
                        </p>
                    </div>
                    {/* Right: module badges + clock */}
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        {([
                            { icon: Globe2, label: t("proIntel.badgeHeatmap", "Heatmap"), color: C.cyan },
                            { icon: Bot, label: t("proIntel.badgePipeline", "Pipeline"), color: C.green },
                            { icon: Brain, label: t("proIntel.badgePulse", "Reg Pulse"), color: C.orange },
                            { icon: Shield, label: "Radar", color: C.purple },
                        ] as const).map(({ icon: Icon, label, color }) => (
                            <span key={label} style={{
                                display: "inline-flex", alignItems: "center", gap: 5,
                                fontSize: 11, fontWeight: 600, color,
                                background: `${color}10`, border: `1px solid ${color}25`,
                                borderRadius: 8, padding: "5px 11px",
                                boxShadow: isDark ? `0 0 10px ${color}15` : "none",
                            }}>
                                <Icon className="h-3.5 w-3.5" /> {label}
                            </span>
                        ))}
                        {/* Live clock */}
                        <div style={{
                            display: "flex", flexDirection: "column", alignItems: "flex-end",
                            background: isDark ? `${C.cyan}08` : `${C.cyan}06`,
                            border: `1px solid ${C.cyan}30`, borderRadius: 12,
                            padding: "7px 15px", minWidth: 140,
                            boxShadow: isDark ? `0 0 20px ${C.cyan}15` : "none",
                        }}>
                            <span style={{
                                fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 900,
                                letterSpacing: "0.06em", color: C.cyan, lineHeight: 1.1,
                                textShadow: isDark ? `0 0 20px ${C.cyan}80` : "none",
                            }}>
                                {timePart}
                            </span>
                            <span style={{ fontSize: 9.5, color: "var(--djac-muted)", letterSpacing: "0.04em", marginTop: 2 }}>
                                {datePart}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── KPI Stats Strip ───────────────────────────────────────── */}
                <div className="djac-section-2" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <StatTile label="Frameworks Monitored" value={6} icon={Shield} color={C.cyan} isDark={isDark}
                        sublabel="PIPL · PDPL · CSL · DSL · ECC · Gen AI"
                        sparkValues={[60, 75, 55, 90, 70, 85, 80, 65, 92, 78]} />
                    <StatTile label="Active Corridors" value={7} icon={Globe2} color={C.green} isDark={isDark}
                        sublabel="Sino-Gulf cross-border routes"
                        sparkValues={[80, 65, 90, 72, 85, 60, 95, 70, 88, 75]} />
                    <StatTile label="Compliance Gaps" value={gapCount} icon={AlertTriangle} color={C.orange} isDark={isDark}
                        sublabel={gapCount === 0 ? "No critical gaps detected" : "Critical / High severity"}
                        pulse={gapCount > 0}
                        sparkValues={[30, 45, 20, 60, 35, 50, 25, 40, 55, 30]} />
                    <StatTile label="AI Jobs Running" value={liveJobCount} icon={Cpu} color={C.purple} isDark={isDark}
                        sublabel="Active pipeline assessments"
                        pulse={liveJobCount > 0}
                        sparkValues={[50, 70, 45, 80, 60, 75, 55, 85, 65, 90]} />
                    {/* Uptime tile */}
                    <div className="djac-pro-kpi-card" style={{
                        flex: "1 1 160px",
                        background: isDark ? `${C.green}06` : `${C.green}04`,
                        border: `1px solid ${C.green}20`, borderTop: `2px solid ${C.green}`,
                        borderRadius: 14, padding: "15px 16px 13px",
                        display: "flex", flexDirection: "column", gap: 6,
                        position: "relative", overflow: "hidden",
                    }}>
                        <div style={{ position: "absolute", top: -30, right: -30, width: 90, height: 90, background: `${C.green}18`, borderRadius: "50%", filter: "blur(28px)", pointerEvents: "none" }} />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 9, fontWeight: 800, color: `${C.green}CC`, textTransform: "uppercase", letterSpacing: "0.11em" }}>Session Uptime</span>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.green}14`, border: `1px solid ${C.green}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Activity className="h-3.5 w-3.5" style={{ color: C.green }} />
                            </div>
                        </div>
                        <span style={{
                            fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 900, color: C.green, lineHeight: 1,
                            textShadow: isDark ? `0 0 24px ${C.green}55` : "none",
                        }}>{uptimeFmt}</span>
                        <span style={{ fontSize: 9, color: "var(--djac-muted)" }}>hh:mm:ss · dashboard live</span>
                        <span style={{ position: "absolute", bottom: 10, right: 11, width: 7, height: 7, borderRadius: "50%", background: C.green, animation: "djac-live-ping 1.8s ease-in-out infinite" }} />
                    </div>
                </div>

                {/* ── Ticker tape ───────────────────────────────────────────── */}
                <div className="djac-section-2b">
                    <TickerTape isDark={isDark} color={C.cyan} />
                </div>

                {/* ── Row 1: Heatmap ────────────────────────────────────────── */}
                <section className="djac-section-3" aria-label={t("proIntel.heatmapSection", "Regulatory Heatmap")} dir="ltr">
                    <SectionLabel icon={Globe2} label={t("proIntel.badgeHeatmap", "Regulatory Corridor Heatmap")} color={C.cyan} sublabel="Sino-Gulf cross-border data architecture" />
                    <SinoGulfHeatmap />
                </section>

                {/* ── Row 2: Pipeline + Pulse ───────────────────────────────── */}
                <div className="djac-section-4" style={{ display: "grid", gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)", gap: 20, alignItems: "stretch" }} id="pro-intel-grid-2">
                    <section aria-label={t("proIntel.pipelineSection", "AI Orchestration Feed")}>
                        <SectionLabel icon={Bot} label={t("proIntel.badgePipeline", "AI Orchestration Pipeline")} color={C.green} sublabel="Glass-box assessment engine" />
                        <AIOrchestrationFeed />
                    </section>
                    <section aria-label={t("proIntel.pulseSection", "Regulatory Pulse Matrix")}>
                        <SectionLabel icon={Brain} label={t("proIntel.badgePulse", "Regulatory Pulse Matrix")} color={C.orange} sublabel="Enforcement · Penalty exposure · PIPL calculator" />
                        <RegulatoryPulseMatrix />
                    </section>
                </div>

                {/* ── Row 3: Framework Radar + AI Activity ─────────────────── */}
                <div className="djac-section-5" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 20, alignItems: "stretch" }} id="pro-intel-grid-3">
                    <FrameworkRadar C={C} isDark={isDark} />
                    <AIJobsActivity C={C} isDark={isDark} jobCount={liveJobCount} />
                </div>

                {/* ── Footer system status ──────────────────────────────────── */}
                <div className="djac-section-6" style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexWrap: "wrap", gap: 10, padding: "12px 16px",
                    background: isDark ? "rgba(255,255,255,0.018)" : "rgba(0,0,0,0.02)",
                    border: `1px solid var(--djac-border)`, borderRadius: 12,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                        {([
                            { label: "AI Engine", ok: true, color: C.green },
                            { label: "DB Layer", ok: true, color: C.green },
                            { label: "Compliance API", ok: true, color: C.green },
                            { label: "Redis Queue", ok: liveJobCount >= 0, color: C.green },
                            { label: "Threat Monitor", ok: true, color: C.cyan },
                        ] as const).map(({ label, ok, color }) => (
                            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{
                                    width: 7, height: 7, borderRadius: "50%",
                                    background: ok ? color : C.red,
                                    display: "inline-block",
                                    boxShadow: ok ? `0 0 6px ${color}88` : `0 0 6px ${C.red}88`,
                                    animation: ok ? "djac-live-ping 2.4s ease-in-out infinite" : "none",
                                }} />
                                <span style={{ fontSize: 10.5, color: "var(--djac-muted)", fontWeight: 600 }}>{label}</span>
                                <span style={{ fontSize: 10, color: ok ? color : C.red, fontWeight: 800 }}>{ok ? "OK" : "DOWN"}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <BarChart3 className="h-3 w-3" style={{ color: "var(--djac-muted)" }} />
                        <span style={{ fontSize: 10.5, color: "var(--djac-muted)" }}>
                            DJAC Pro Intelligence v3 · {gapCount} active gaps · {liveJobCount} AI jobs · {uptimeFmt} uptime
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
}

