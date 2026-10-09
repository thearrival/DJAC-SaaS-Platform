import { useMemo, useState } from "react";
import { useTheme } from "@/contexts/useTheme";
import { useLocale } from "@/contexts/useLocale";
import {
  ShieldCheck,
  AlertTriangle,
  Ban,
  ArrowRight,
  Info,
} from "lucide-react";

type NodeKey =
  | "beijing"
  | "shanghai"
  | "hongkong"
  | "singapore"
  | "riyadh"
  | "dubai";
type PipeStatus = "compliant" | "approval_required" | "blocked";

interface GNode {
  x: number;
  y: number;
  label: string;
  region: string;
  laws: string;
}
interface Pipe {
  id: string;
  from: NodeKey;
  to: NodeKey;
  label: string;
  frameworks: string[];
  status: PipeStatus;
  articles?: string[];
  penaltyExposure?: string;
  dataCategories?: string[];
}

const NODES: Record<NodeKey, GNode> = {
  beijing: {
    x: 170,
    y: 105,
    label: "Beijing",
    region: "China",
    laws: "PIPL · CAC",
  },
  shanghai: {
    x: 135,
    y: 255,
    label: "Shanghai",
    region: "China",
    laws: "PIPL · CSL",
  },
  hongkong: {
    x: 205,
    y: 400,
    label: "Hong Kong",
    region: "China (SAR)",
    laws: "PDPO · HK",
  },
  singapore: {
    x: 500,
    y: 300,
    label: "Singapore",
    region: "ASEAN transit",
    laws: "PDPA · SG",
  },
  riyadh: {
    x: 800,
    y: 145,
    label: "Riyadh",
    region: "Saudi Arabia",
    laws: "PDPL · SDAIA",
  },
  dubai: {
    x: 865,
    y: 305,
    label: "Dubai",
    region: "United Arab Emirates",
    laws: "UAE PDPL",
  },
};

const PIPES: Pipe[] = [
  {
    id: "ruh-dxb",
    from: "riyadh",
    to: "dubai",
    label: "GCC Hub Link",
    frameworks: ["PDPL"],
    status: "compliant",
    articles: ["PDPL Art. 12", "PDPL Art. 29"],
    penaltyExposure: "Up to SAR 5M",
    dataCategories: ["Personal Data", "Financial Records"],
  },
  {
    id: "dxb-sin",
    from: "dubai",
    to: "singapore",
    label: "Gulf–ASEAN Transit",
    frameworks: ["PDPL", "PIPL"],
    status: "approval_required",
    articles: ["PIPL Art. 38", "CAC standard contract"],
    penaltyExposure: "Up to ¥50M or 5% of annual revenue",
    dataCategories: ["Personal Data", "Biometric Data"],
  },
  {
    id: "sin-hkg",
    from: "singapore",
    to: "hongkong",
    label: "ASEAN–HKG Link",
    frameworks: ["PIPL"],
    status: "compliant",
    penaltyExposure: "HKD 1M + potential imprisonment",
    dataCategories: ["Personal Data"],
  },
  {
    id: "hkg-sha",
    from: "hongkong",
    to: "shanghai",
    label: "Cross-Border PIPL",
    frameworks: ["PIPL", "DSL"],
    status: "approval_required",
    articles: ["PIPL Art. 38–40", "DSL Art. 31"],
    penaltyExposure: "Up to ¥50M (PIPL) + DSL fines",
    dataCategories: ["Personal Data", "Important Data"],
  },
  {
    id: "sha-bej",
    from: "shanghai",
    to: "beijing",
    label: "CAC Oversight Path",
    frameworks: ["PIPL", "CSL", "DSL"],
    status: "compliant",
    penaltyExposure: "Regulatory audit exposure",
    dataCategories: ["Personal Data", "Critical Infrastructure Data"],
  },
  {
    id: "ruh-sha",
    from: "riyadh",
    to: "shanghai",
    label: "Sino–Saudi Data Corridor",
    frameworks: ["PIPL", "PDPL"],
    status: "approval_required",
    articles: ["PIPL Art. 38", "PDPL Art. 29", "CAC pre-transfer assessment"],
    penaltyExposure: "Up to ¥50M + SAR 5M (dual exposure)",
    dataCategories: ["Personal Data", "Financial Records", "Health Data"],
  },
  {
    id: "dxb-hkg",
    from: "dubai",
    to: "hongkong",
    label: "Gulf–HKG Express",
    frameworks: ["PDPL", "PIPL"],
    status: "approval_required",
    articles: ["PIPL Art. 40 (1M+ users)", "PDPL Art. 33"],
    penaltyExposure: "Up to ¥50M (PIPL) + DIFC sanctions",
    dataCategories: ["Personal Data", "Financial Records"],
  },
];

const STATUS: Record<
  PipeStatus,
  { color: string; label: string; icon: typeof ShieldCheck }
> = {
  compliant: { color: "#10b981", label: "Cleared", icon: ShieldCheck },
  approval_required: {
    color: "#f59e0b",
    label: "Approval required",
    icon: AlertTriangle,
  },
  blocked: { color: "#ef4444", label: "Blocked", icon: Ban },
};

function curved(a: GNode, b: GNode): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = (a.x + b.x) / 2 + (-dy / len) * len * 0.16;
  const cy = (a.y + b.y) / 2 + (dx / len) * len * 0.16;
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

/**
 * Sino–Gulf cross-border data architecture — a clean, business-facing,
 * interactive view of how data moves between China and the Gulf and what each
 * lane requires. Hovering or clicking a lane opens its requirements.
 */
export function SinoGulfArchitecture() {
  const { theme } = useTheme();
  const { t } = useLocale();
  const isDark = theme === "dark";
  const [hover, setHover] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { compliant: 0, approval_required: 0, blocked: 0 };
    for (const p of PIPES) c[p.status]++;
    return c;
  }, []);

  const selected = PIPES.find(p => p.id === sel) ?? null;
  const activeId = sel ?? hover;
  const card = isDark ? "rgba(6,14,36,0.85)" : "rgba(255,255,255,0.9)";
  const border = isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.10)";
  const muted = isDark ? "#94a3b8" : "#64748b";
  const text = isDark ? "#e2e8f0" : "#0f172a";
  const lane = isDark ? "rgba(56,189,248,0.06)" : "rgba(15,23,42,0.03)";

  return (
    <div
      style={{
        background: card,
        border: `1px solid ${border}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <style>{`@keyframes sga-flow{to{stroke-dashoffset:-60}}`}</style>

      {/* Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: `1px solid ${border}`,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>
            {t("sga.title", "Sino–Gulf Cross-Border Data Architecture")}
          </h3>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, color: muted }}>
            {t(
              "sga.subtitle",
              "How business data moves between China and the Gulf — and what each lane requires."
            )}
          </p>
        </div>
        {/* KPI strip */}
        <div style={{ display: "flex", gap: 14 }}>
          {(["compliant", "approval_required", "blocked"] as PipeStatus[]).map(
            s => (
              <div key={s} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: STATUS[s].color,
                  }}
                >
                  {counts[s]}
                </div>
                <div style={{ fontSize: 10.5, color: muted }}>
                  {t(`sga.kpi.${s}`, STATUS[s].label)}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Schematic */}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 460px", minWidth: 320, padding: 10 }}>
          <svg viewBox="0 0 1000 500" style={{ width: "100%", height: "auto" }}>
            {/* region backdrops */}
            <rect x="40" y="40" width="240" height="420" rx="18" fill={lane} />
            <text x="60" y="70" fontSize="12" fill={muted} fontWeight={600}>
              CHINA
            </text>
            <rect x="720" y="80" width="240" height="290" rx="18" fill={lane} />
            <text x="740" y="110" fontSize="12" fill={muted} fontWeight={600}>
              GULF
            </text>

            {/* lanes */}
            {PIPES.map(p => {
              const active = activeId === p.id;
              const color = STATUS[p.status].color;
              return (
                <path
                  key={p.id}
                  d={curved(NODES[p.from], NODES[p.to])}
                  fill="none"
                  stroke={color}
                  strokeWidth={active ? 3.5 : 2}
                  strokeOpacity={activeId && !active ? 0.22 : 0.85}
                  strokeDasharray="8 14"
                  style={{
                    animation: "sga-flow 2.2s linear infinite",
                    cursor: "pointer",
                    transition: "stroke-width .15s, stroke-opacity .15s",
                  }}
                  onMouseEnter={() => setHover(p.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setSel(prev => (prev === p.id ? null : p.id))}
                />
              );
            })}

            {/* nodes */}
            {(Object.keys(NODES) as NodeKey[]).map(k => {
              const n = NODES[k];
              return (
                <g key={k}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={9}
                    fill="#0b1e3a"
                    stroke="#38bdf8"
                    strokeWidth={2}
                  />
                  <circle cx={n.x} cy={n.y} r={4} fill="#7dd3fc" />
                  <text
                    x={n.x}
                    y={n.y - 18}
                    fontSize="15"
                    fontWeight={700}
                    fill={text}
                    textAnchor="middle"
                  >
                    {n.label}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 26}
                    fontSize="11"
                    fill={muted}
                    textAnchor="middle"
                  >
                    {n.laws}
                  </text>
                </g>
              );
            })}
          </svg>
          <p
            style={{
              margin: "2px 0 6px",
              fontSize: 11,
              color: muted,
              textAlign: "center",
            }}
          >
            {t(
              "sga.hint",
              "Hover a lane to preview · click to open its requirements"
            )}
          </p>
        </div>

        {/* Detail / legend */}
        <div
          style={{
            flex: "1 1 260px",
            minWidth: 260,
            padding: 16,
            borderInlineStart: `1px solid ${border}`,
          }}
        >
          {selected ? (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {(() => {
                  const I = STATUS[selected.status].icon;
                  return <I size={18} color={STATUS[selected.status].color} />;
                })()}
                <strong style={{ color: text, fontSize: 15 }}>
                  {selected.label}
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: muted,
                  fontSize: 12.5,
                  marginBottom: 12,
                }}
              >
                {NODES[selected.from].label} <ArrowRight size={13} />{" "}
                {NODES[selected.to].label}
              </div>
              <Badge
                color={STATUS[selected.status].color}
                label={t(
                  `sga.kpi.${selected.status}`,
                  STATUS[selected.status].label
                )}
              />
              <Detail
                label={t("sga.dataCategories", "Data categories")}
                value={(selected.dataCategories ?? []).join(", ")}
                text={text}
                muted={muted}
              />
              <Detail
                label={t("sga.frameworks", "Applicable laws")}
                value={selected.frameworks.join(" · ")}
                text={text}
                muted={muted}
              />
              {selected.articles?.length ? (
                <Detail
                  label={t("sga.requirements", "Requirements")}
                  value={selected.articles.join("; ")}
                  text={text}
                  muted={muted}
                />
              ) : null}
              {selected.penaltyExposure ? (
                <Detail
                  label={t("sga.penalty", "Penalty exposure")}
                  value={selected.penaltyExposure}
                  text={text}
                  muted={muted}
                />
              ) : null}
              <p
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  color: muted,
                  display: "flex",
                  gap: 6,
                }}
              >
                <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                {t(
                  "sga.disclaimer",
                  "Planning guidance only — confirm obligations with qualified counsel before relying on any transfer."
                )}
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 12.5, color: muted, marginTop: 0 }}>
                {t("sga.selectHint", "Select a lane to see what it requires.")}
              </p>
              <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                {(
                  ["compliant", "approval_required", "blocked"] as PipeStatus[]
                ).map(s => (
                  <div
                    key={s}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12.5,
                      color: text,
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 3,
                        borderRadius: 2,
                        background: STATUS[s].color,
                        display: "inline-block",
                      }}
                    />
                    {t(
                      `sga.legend.${s}`,
                      s === "compliant"
                        ? "Cleared for transfer"
                        : s === "approval_required"
                          ? "Approval / assessment required"
                          : "Transfer blocked"
                    )}
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

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        color,
        background: `${color}1f`,
        border: `1px solid ${color}55`,
        marginBottom: 12,
      }}
    >
      {label}
    </span>
  );
}

function Detail({
  label,
  value,
  text,
  muted,
}: {
  label: string;
  value: string;
  text: string;
  muted: string;
}) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: muted,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: text, marginTop: 2 }}>{value}</div>
    </div>
  );
}
