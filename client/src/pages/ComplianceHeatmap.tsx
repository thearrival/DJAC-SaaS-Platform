import { useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "low" | "none";
type RelationshipType =
    | "overlap"
    | "conflict"
    | "harmonization"
    | "coordination"
    | "gap"
    | "dependency";

interface MatrixRow {
    source: string;
    target: string;
    relationships: string[];
    actions: string[];
    maxSeverity: Severity;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FRAMEWORKS = ["CSL", "DSL", "PIPL", "PDPL", "NCA"] as const;
type Framework = (typeof FRAMEWORKS)[number];

const FRAMEWORK_LABELS: Record<Framework, { name: string; country: string }> = {
    CSL: { name: "Cybersecurity Law", country: "China" },
    DSL: { name: "Data Security Law", country: "China" },
    PIPL: { name: "Personal Information Protection", country: "China" },
    PDPL: { name: "Personal Data Protection Law", country: "Saudi Arabia" },
    NCA: { name: "National Cybersecurity Authority", country: "Saudi Arabia" },
};

const RELATIONSHIP_TYPES: RelationshipType[] = [
    "overlap",
    "conflict",
    "harmonization",
    "coordination",
    "gap",
    "dependency",
];

const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
    overlap: "rgba(255, 214, 0, 0.9)",
    conflict: "rgba(255, 23, 68, 0.9)",
    harmonization: "rgba(1, 255, 127, 0.9)",
    coordination: "rgba(0, 224, 255, 0.9)",
    gap: "rgba(255, 107, 43, 0.9)",
    dependency: "rgba(139, 92, 246, 0.9)",
};

const SEVERITY_BG: Record<Severity, string> = {
    critical: "rgba(255, 23, 68, 0.20)",
    high: "rgba(255, 107, 43, 0.18)",
    medium: "rgba(255, 214, 0, 0.16)",
    low: "rgba(1, 255, 127, 0.12)",
    none: "transparent",
};

const SEVERITY_BORDER: Record<Severity, string> = {
    critical: "rgba(255, 23, 68, 0.45)",
    high: "rgba(255, 107, 43, 0.40)",
    medium: "rgba(255, 214, 0, 0.35)",
    low: "rgba(1, 255, 127, 0.30)",
    none: "var(--djac-border)",
};

const SEVERITY_TEXT: Record<Severity, string> = {
    critical: "var(--djac-red)",
    high: "var(--djac-orange)",
    medium: "var(--djac-yellow)",
    low: "var(--djac-green)",
    none: "var(--muted-foreground)",
};

const _SEVERITY_ORDER: Record<Severity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    none: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCellMap(rows: MatrixRow[]): Map<string, MatrixRow> {
    const map = new Map<string, MatrixRow>();
    rows.forEach((r) => map.set(`${r.source}:${r.target}`, r));
    return map;
}

function severityLabel(s: Severity): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SeverityDot({ severity }: { severity: Severity }) {
    if (severity === "none") return null;
    return (
        <span
            className="inline-block h-2 w-2 rounded-full shrink-0"
            style={{ background: SEVERITY_TEXT[severity] }}
            aria-hidden="true"
        />
    );
}

function RelationshipBadge({ type }: { type: string }) {
    const knownType = type as RelationshipType;
    const color = RELATIONSHIP_COLORS[knownType] ?? "var(--djac-muted)";
    return (
        <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
                background: color.replace("0.9", "0.12"),
                color,
                border: `1px solid ${color.replace("0.9", "0.35")}`,
            }}
        >
            {type}
        </span>
    );
}

interface DetailPanelProps {
    cell: MatrixRow | null;
    source: Framework | null;
    target: Framework | null;
    onClose: () => void;
}

function DetailPanel({ cell, source, target, onClose }: DetailPanelProps) {
    const { t } = useLocale();
    if (!cell || !source || !target) return null;

    return (
        <div
            className="rounded-2xl border bg-card p-5 shadow-xl animate-in slide-in-from-right-4 duration-200"
            style={{ borderColor: SEVERITY_BORDER[cell.maxSeverity] }}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <SeverityDot severity={cell.maxSeverity} />
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            {t("heatmap.relationship", "Relationship")}
                        </span>
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                        {source} → {target}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {FRAMEWORK_LABELS[source].name} → {FRAMEWORK_LABELS[target].name}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span
                        className="rounded-full px-2.5 py-1 text-xs font-bold"
                        style={{
                            background: SEVERITY_BG[cell.maxSeverity],
                            color: SEVERITY_TEXT[cell.maxSeverity],
                            border: `1px solid ${SEVERITY_BORDER[cell.maxSeverity]}`,
                        }}
                    >
                        {severityLabel(cell.maxSeverity)}
                    </span>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-xs"
                        aria-label={t("heatmap.closeDetail", "Close detail panel")}
                    >
                        âœ•
                    </button>
                </div>
            </div>

            {/* Relationship types */}
            {cell.relationships.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {t("heatmap.types", "Relationship Types")}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {cell.relationships.map((rel) => (
                            <RelationshipBadge key={rel} type={rel} />
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended actions */}
            {cell.actions.length > 0 && (
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {t("heatmap.actions", "Recommended Actions")}
                    </p>
                    <ul className="space-y-2">
                        {cell.actions.slice(0, 5).map((action, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-foreground/85 leading-relaxed">
                                <span className="mt-0.5 text-primary shrink-0">â€º</span>
                                <span>{action}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ComplianceHeatmap() {
    usePageTitle("Compliance Heatmap");
    const { t } = useLocale();
    const [activeFilter, setActiveFilter] = useState<RelationshipType | "all">("all");
    const [selectedCell, setSelectedCell] = useState<{
        source: Framework;
        target: Framework;
    } | null>(null);

    const { data: matrix, isLoading, error, refetch } = trpc.compliance.matrix.useQuery();

    const cellMap = buildCellMap(Array.isArray(matrix) ? (matrix as MatrixRow[]) : []);

    function getCell(src: Framework, tgt: Framework): MatrixRow | undefined {
        return cellMap.get(`${src}:${tgt}`);
    }

    function isCellHighlighted(cell: MatrixRow | undefined): boolean {
        if (!cell) return false;
        if (activeFilter === "all") return true;
        return cell.relationships.includes(activeFilter);
    }

    // Summary stats
    const allCells = Array.from(cellMap.values());
    const criticalCount = allCells.filter((c) => c.maxSeverity === "critical").length;
    const highCount = allCells.filter((c) => c.maxSeverity === "high").length;
    const mediumCount = allCells.filter((c) => c.maxSeverity === "medium").length;
    const _lowCount = allCells.filter((c) => c.maxSeverity === "low" || c.maxSeverity === "none").length;
    const totalPairs = FRAMEWORKS.length * (FRAMEWORKS.length - 1);

    const selectedRow = selectedCell
        ? cellMap.get(`${selectedCell.source}:${selectedCell.target}`) ?? null
        : null;

    // ─── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="djac-page">

            {/* Page header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {t("heatmap.title", "Compliance Framework Heatmap")}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t(
                        "heatmap.subtitle",
                        "Cross-framework relationship severity matrix — China & Saudi Arabia regulatory landscape"
                    )}
                </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: t("heatmap.statTotal", "Total Pairs"),
                        value: isLoading ? "—" : String(totalPairs),
                        color: "var(--muted-foreground)",
                        bg: "var(--muted)",
                    },
                    {
                        label: t("heatmap.statCritical", "Critical"),
                        value: isLoading ? "—" : String(criticalCount),
                        color: "var(--djac-red)",
                        bg: "rgba(255, 23, 68, 0.10)",
                    },
                    {
                        label: t("heatmap.statHigh", "High"),
                        value: isLoading ? "—" : String(highCount),
                        color: "var(--djac-orange)",
                        bg: "rgba(255, 107, 43, 0.10)",
                    },
                    {
                        label: t("heatmap.statMedium", "Medium"),
                        value: isLoading ? "—" : String(mediumCount),
                        color: "var(--djac-yellow)",
                        bg: "rgba(255, 214, 0, 0.10)",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="djac-section-card rounded-xl border p-4 flex flex-col gap-1"
                        style={{ background: stat.bg }}
                    >
                        <span className="text-2xl font-bold" style={{ color: stat.color }}>
                            {stat.value}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveFilter("all")}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${activeFilter === "all"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                >
                    {t("heatmap.filterAll", "All")}
                </button>
                {RELATIONSHIP_TYPES.map((rel) => {
                    const color = RELATIONSHIP_COLORS[rel];
                    const isActive = activeFilter === rel;
                    return (
                        <button
                            key={rel}
                            onClick={() => setActiveFilter(rel)}
                            className="rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors capitalize"
                            style={
                                isActive
                                    ? {
                                        background: color.replace("0.9", "0.18"),
                                        borderColor: color.replace("0.9", "0.50"),
                                        color,
                                    }
                                    : {
                                        borderColor: "var(--djac-border)",
                                        color: "var(--djac-muted)",
                                    }
                            }
                        >
                            {t(`heatmap.filter.${rel}`, rel)}
                        </button>
                    );
                })}
            </div>

            {/* Heatmap + Detail panel */}
            <div className="flex flex-col xl:flex-row gap-5">

                {/* Matrix grid */}
                <div className="flex-1 min-w-0 overflow-x-auto">
                    {isLoading ? (
                        <div className="rounded-2xl border border-border/50 bg-card p-8 text-center text-sm text-muted-foreground animate-pulse">
                            {t("heatmap.loading", "Loading matrix data…")}
                        </div>
                    ) : error ? (
                        <div
                            className="rounded-2xl border p-8 text-center text-sm"
                            style={{ borderColor: "rgba(255, 23, 68, 0.30)", color: "var(--djac-red)" }}
                        >
                            <p>{error.message || t("heatmap.error", "Failed to load compliance matrix. Please refresh.")}</p>
                            <Button
                                size="sm"
                                variant="outline"
                                className="mt-3 h-7 text-xs"
                                onClick={() => {
                                    void refetch();
                                }}
                            >
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border/50 bg-card p-4 shadow-sm">
                            {/* Column headers */}
                            <div
                                className="grid gap-1.5 mb-1.5"
                                style={{
                                    gridTemplateColumns: `minmax(80px, 1fr) repeat(${FRAMEWORKS.length}, minmax(72px, 1fr))`,
                                }}
                            >
                                <div /> {/* empty top-left corner */}
                                {FRAMEWORKS.map((col) => (
                                    <div
                                        key={col}
                                        className="text-center text-xs font-bold text-muted-foreground py-2 px-1 tracking-wider uppercase"
                                    >
                                        {col}
                                        <div className="text-[10px] font-normal normal-case opacity-60 mt-0.5 hidden lg:block">
                                            {FRAMEWORK_LABELS[col].country}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Matrix rows */}
                            {FRAMEWORKS.map((src) => (
                                <div
                                    key={src}
                                    className="grid gap-1.5 mb-1.5"
                                    style={{
                                        gridTemplateColumns: `minmax(80px, 1fr) repeat(${FRAMEWORKS.length}, minmax(72px, 1fr))`,
                                    }}
                                >
                                    {/* Row label */}
                                    <div className="flex items-center pr-2">
                                        <div>
                                            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                {src}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground/60 hidden lg:block">
                                                {FRAMEWORK_LABELS[src].country}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cells */}
                                    {FRAMEWORKS.map((tgt) => {
                                        const isDiagonal = src === tgt;
                                        const cell = isDiagonal ? undefined : getCell(src, tgt);
                                        const severity: Severity = cell?.maxSeverity ?? "none";
                                        const highlighted = isDiagonal || isCellHighlighted(cell);
                                        const isSelected =
                                            selectedCell?.source === src && selectedCell?.target === tgt;

                                        if (isDiagonal) {
                                            return (
                                                <div
                                                    key={tgt}
                                                    className="rounded-xl flex items-center justify-center text-xs font-bold tracking-widest h-[68px]"
                                                    style={{
                                                        background: "var(--djac-card-hi)",
                                                        border: "1px solid var(--djac-border)",
                                                        color: "var(--djac-muted)",
                                                        opacity: 0.5,
                                                    }}
                                                    aria-label={`${src} self`}
                                                >
                                                    {src}
                                                </div>
                                            );
                                        }

                                        return (
                                            <button
                                                key={tgt}
                                                onClick={() => {
                                                    if (!cell) return;
                                                    if (isSelected) {
                                                        setSelectedCell(null);
                                                    } else {
                                                        setSelectedCell({ source: src, target: tgt });
                                                    }
                                                }}
                                                disabled={!cell}
                                                className="rounded-xl h-[68px] flex flex-col items-center justify-center gap-1 border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                style={{
                                                    background: highlighted
                                                        ? SEVERITY_BG[severity]
                                                        : "var(--djac-card-hi)",
                                                    borderColor: isSelected
                                                        ? SEVERITY_TEXT[severity]
                                                        : highlighted
                                                            ? SEVERITY_BORDER[severity]
                                                            : "var(--djac-border)",
                                                    opacity: highlighted ? 1 : 0.25,
                                                    cursor: cell ? "pointer" : "default",
                                                    boxShadow: isSelected
                                                        ? `0 0 0 2px ${SEVERITY_TEXT[severity]}40`
                                                        : undefined,
                                                    transform: isSelected ? "scale(0.97)" : undefined,
                                                }}
                                                aria-label={
                                                    cell
                                                        ? `${src} to ${tgt}: ${severity} severity, ${cell.relationships.join(", ")}`
                                                        : `${src} to ${tgt}: no data`
                                                }
                                            >
                                                {cell && severity !== "none" && (
                                                    <SeverityDot severity={severity} />
                                                )}
                                                <span
                                                    className="text-[10px] font-semibold"
                                                    style={{
                                                        color: cell ? SEVERITY_TEXT[severity] : "var(--muted-foreground)",
                                                    }}
                                                >
                                                    {cell ? severityLabel(severity) : "—"}
                                                </span>
                                                {cell && cell.relationships.length > 0 && (
                                                    <span className="text-[9px] text-muted-foreground/70 truncate max-w-[62px] text-center">
                                                        {cell.relationships[0]}
                                                        {cell.relationships.length > 1 ? ` +${cell.relationships.length - 1}` : ""}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail panel */}
                {selectedCell && (
                    <div className="xl:w-80 shrink-0">
                        <DetailPanel
                            cell={selectedRow}
                            source={selectedCell.source}
                            target={selectedCell.target}
                            onClose={() => setSelectedCell(null)}
                        />
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="rounded-xl border border-border/50 bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    {t("heatmap.legend", "Legend")}
                </p>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {/* Severity */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/70 mb-1.5 uppercase tracking-wide">
                            {t("heatmap.legendSeverity", "Severity")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {(["critical", "high", "medium", "low", "none"] as Severity[]).map((s) => (
                                <div key={s} className="flex items-center gap-1.5 text-xs">
                                    <span
                                        className="inline-block h-3 w-3 rounded-sm border"
                                        style={{
                                            background: SEVERITY_BG[s],
                                            borderColor: SEVERITY_BORDER[s],
                                        }}
                                    />
                                    <span className="capitalize" style={{ color: SEVERITY_TEXT[s] }}>
                                        {severityLabel(s)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Relationship types */}
                    <div>
                        <p className="text-[10px] text-muted-foreground/70 mb-1.5 uppercase tracking-wide">
                            {t("heatmap.legendRelationship", "Relationship Types")}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {RELATIONSHIP_TYPES.map((rel) => (
                                <RelationshipBadge key={rel} type={rel} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
