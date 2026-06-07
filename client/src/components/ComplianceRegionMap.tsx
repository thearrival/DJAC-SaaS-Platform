import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/contexts/useLocale";

type RegionCoverageRow = {
    region: string;
    vendors: number;
    assessments: number;
    criticalGaps: number;
};

type CorridorFlowRow = {
    source: string;
    target: string;
    weight: number;
};

type MetricKey = "vendors" | "assessments" | "criticalGaps";

type RegionPosition = {
    x: number;
    y: number;
    color: string;
    glow: string;
};

const regionPositions: Record<string, RegionPosition> = {
    China: {
        x: 600,
        y: 185,
        color: "#1d4ed8",
        glow: "rgba(29, 78, 216, 0.35)",
    },
    "Saudi Arabia": {
        x: 490,
        y: 220,
        color: "#0f766e",
        glow: "rgba(15, 118, 110, 0.35)",
    },
};

function metricLabel(metric: MetricKey, t: (key: string, fallback: string) => string) {
    if (metric === "vendors") return t("region.metricVendors", "Vendors");
    if (metric === "assessments") return t("region.metricAssessments", "Assessments");
    return t("region.metricCriticalGaps", "Critical Gaps");
}

export function ComplianceRegionMap({
    regionCoverage,
    corridorFlows,
}: {
    regionCoverage: RegionCoverageRow[];
    corridorFlows: CorridorFlowRow[];
}) {
    const { t } = useLocale();
    const [metric, setMetric] = useState<MetricKey>("vendors");
    const [focusedRegion, setFocusedRegion] = useState<string | null>(null);

    const normalizedCoverage = useMemo(() => {
        return regionCoverage.map(row => {
            const baseline = Math.max(...regionCoverage.map(item => item[metric]), 1);
            const intensity = row[metric] / baseline;
            return {
                ...row,
                intensity,
            };
        });
    }, [metric, regionCoverage]);

    const focused = normalizedCoverage.find(item => item.region === focusedRegion) ?? null;

    return (
        <Card className="border-border/70 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                    <span>{t("region.title", "Operational Region Map")}</span>
                    <Badge variant="outline">{t("region.badge", "Interactive")}</Badge>
                </CardTitle>
                <CardDescription>
                    {t("region.description", "China-Saudi compliance corridor with drill-down by vendors, assessments, and critical gaps.")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    {(["vendors", "assessments", "criticalGaps"] as MetricKey[]).map(key => (
                        <Button
                            key={key}
                            size="sm"
                            variant={metric === key ? "default" : "outline"}
                            onClick={() => setMetric(key)}
                        >
                            {metricLabel(key, t)}
                        </Button>
                    ))}
                </div>

                <div className="rounded-xl border border-border bg-white/90 p-3 shadow-inner dark:bg-slate-950/60">
                    <svg viewBox="0 0 900 420" className="h-[340px] w-full">
                        <defs>
                            <linearGradient id="mapBackground" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#f8fafc" />
                                <stop offset="100%" stopColor="#e2e8f0" />
                            </linearGradient>
                            <filter id="regionGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="12" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                            <marker id="flowArrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
                                <path d="M0,0 L12,6 L0,12 Z" fill="#334155" />
                            </marker>
                        </defs>

                        <rect x="0" y="0" width="900" height="420" rx="18" fill="url(#mapBackground)" />

                        <g opacity="0.35" fill="#94a3b8">
                            <path d="M90 120 L150 90 L245 100 L285 140 L230 180 L150 170 Z" />
                            <path d="M280 90 L360 70 L460 110 L430 165 L330 155 Z" />
                            <path d="M455 105 L555 120 L650 180 L620 250 L520 230 L475 180 Z" />
                            <path d="M645 145 L725 135 L790 185 L760 235 L690 225 Z" />
                        </g>

                        {corridorFlows.map((flow, index) => {
                            const sourcePosition = regionPositions[flow.source];
                            const targetPosition = regionPositions[flow.target];
                            if (!sourcePosition || !targetPosition) {
                                return null;
                            }

                            const midpointX = (sourcePosition.x + targetPosition.x) / 2;
                            const midpointY = Math.min(sourcePosition.y, targetPosition.y) - 36;
                            const thickness = Math.max(1.5, Math.min(8, flow.weight));

                            return (
                                <g key={`${flow.source}-${flow.target}-${index}`}>
                                    <path
                                        d={`M ${sourcePosition.x} ${sourcePosition.y} Q ${midpointX} ${midpointY} ${targetPosition.x} ${targetPosition.y}`}
                                        fill="none"
                                        stroke="#334155"
                                        strokeOpacity="0.5"
                                        strokeWidth={thickness}
                                        markerEnd="url(#flowArrow)"
                                    />
                                    <text
                                        x={midpointX}
                                        y={midpointY - 8}
                                        textAnchor="middle"
                                        className="fill-slate-700 text-[11px] font-semibold"
                                    >
                                        {flow.weight}
                                    </text>
                                </g>
                            );
                        })}

                        {normalizedCoverage.map(row => {
                            const position = regionPositions[row.region];
                            if (!position) return null;

                            const radius = 16 + row.intensity * 28;
                            const isFocused = focusedRegion === row.region;

                            return (
                                <g
                                    key={row.region}
                                    onMouseEnter={() => setFocusedRegion(row.region)}
                                    onMouseLeave={() => setFocusedRegion(null)}
                                    onClick={() => setFocusedRegion(row.region)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <circle
                                        cx={position.x}
                                        cy={position.y}
                                        r={radius + (isFocused ? 7 : 0)}
                                        fill={position.glow}
                                        filter="url(#regionGlow)"
                                    />
                                    <circle
                                        cx={position.x}
                                        cy={position.y}
                                        r={radius}
                                        fill={position.color}
                                        fillOpacity={isFocused ? 0.88 : 0.7}
                                        stroke="#0f172a"
                                        strokeWidth={isFocused ? 2.5 : 1.5}
                                    />
                                    <text
                                        x={position.x}
                                        y={position.y + 4}
                                        textAnchor="middle"
                                        className="fill-white text-[11px] font-bold"
                                    >
                                        {row[metric]}
                                    </text>
                                    <text
                                        x={position.x}
                                        y={position.y + radius + 18}
                                        textAnchor="middle"
                                        className="fill-slate-800 text-[12px] font-semibold"
                                    >
                                        {row.region}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {focused ? (
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                        <p className="text-sm font-semibold">{focused.region}</p>
                        <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                            <p>{t("region.labelVendors", "Vendors:")} <span className="font-medium text-foreground">{focused.vendors}</span></p>
                            <p>{t("region.labelAssessments", "Assessments:")} <span className="font-medium text-foreground">{focused.assessments}</span></p>
                            <p>{t("region.labelCriticalGaps", "Critical Gaps:")} <span className="font-medium text-foreground">{focused.criticalGaps}</span></p>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">{t("region.hoverHint", "Hover a region node to inspect compliance load.")}</p>
                )}
            </CardContent>
        </Card>
    );
}
