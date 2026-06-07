import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";

const riskColor = (risk: string) => {
    if (risk === "low") return "from-success to-success/60";
    if (risk === "medium") return "from-primary to-secondary";
    return "from-warning to-destructive";
};

const riskBorder = (risk: string) => {
    if (risk === "low") return "border-success/30";
    if (risk === "medium") return "border-primary/30";
    return "border-warning/30";
};

const riskGlow = (risk: string) => {
    if (risk === "low") return "0 0 12px hsla(152, 100%, 50%, 0.3)";
    if (risk === "medium") return "0 0 12px hsla(185, 100%, 49%, 0.3)";
    return "0 0 12px hsla(38, 92%, 50%, 0.3)";
};

// Fallback rows used when DB has no vendor data yet
const FALLBACK_VENDORS = [
    { vendorId: 0, vendorName: "Alibaba Cloud", score: 78, risk: "medium" as const },
    { vendorId: 0, vendorName: "Huawei Cloud", score: 62, risk: "high" as const },
    { vendorId: 0, vendorName: "STC Solutions", score: 91, risk: "low" as const },
    { vendorId: 0, vendorName: "Tencent Cloud", score: 55, risk: "high" as const },
];

export function VendorRiskGauge() {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const reduceMotion = useReducedMotion();
    const { locale } = useLocale();
    const safeLocale = locale === "ar" || locale === "zh" ? locale : "en";

    const { data: rawVendors } = trpc.vendorCompliance.list.useQuery(undefined, {
        retry: false,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
    });

    // Take top 5 by composite score, fall back to static list if no DB data
    const vendors = (rawVendors && rawVendors.length > 0)
        ? [...rawVendors]
            .sort((a, b) => b.compositeScore - a.compositeScore)
            .slice(0, 5)
            .map(v => ({ vendorId: v.id, vendorName: v.vendorName, score: v.compositeScore, risk: v.riskLevel }))
        : FALLBACK_VENDORS;

    const copy = {
        en: { title: "Vendor", accent: "Risk Scores", subtitle: "Composite compliance scores across all frameworks", low: "low", medium: "medium", high: "high", critical: "critical" },
        ar: { title: "مخاطر", accent: "الموردين", subtitle: "درجات الامتثال المركبة عبر جميع الأطر", low: "منخفض", medium: "متوسط", high: "مرتفع", critical: "حرج" },
        zh: { title: "供应商", accent: "风险评分", subtitle: "跨所有框架的综合合规评分", low: "低", medium: "中", high: "高", critical: "严重" },
    }[safeLocale];

    const riskLabel = (risk: string) => {
        if (risk === "low") return copy.low;
        if (risk === "medium") return copy.medium;
        if (risk === "critical") return copy.critical;
        return copy.high;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="glass-card rounded-xl p-5"
        >
            <h3 className="font-display font-semibold text-foreground text-sm mb-1">
                {copy.title} <span className="text-gradient-cyan">{copy.accent}</span>
            </h3>
            <p className="text-xs text-muted-foreground mb-4">{copy.subtitle}</p>

            <div className="space-y-4">
                {vendors.map((v, i) => (
                    <motion.div
                        key={`${v.vendorName}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.12, type: "spring" }}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center justify-between mb-1.5">
                            <motion.span
                                className="text-xs text-foreground/80 font-medium"
                                animate={hoveredIdx === i ? { color: "hsl(185, 100%, 49%)" } : {}}
                            >
                                {v.vendorName}
                            </motion.span>
                            <div className="flex items-center gap-2">
                                <motion.span
                                    className="text-xs font-mono text-foreground font-bold"
                                    animate={hoveredIdx === i ? { scale: 1.15 } : { scale: 1 }}
                                >
                                    {v.score}%
                                </motion.span>
                                <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full border ${riskBorder(v.risk)} text-muted-foreground`}>
                                    {riskLabel(v.risk)}
                                </span>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
                            <motion.div
                                className={`h-full rounded-full bg-gradient-to-r ${riskColor(v.risk)} relative`}
                                initial={{ width: 0 }}
                                animate={{ width: `${v.score}%` }}
                                transition={{ duration: 1.2, delay: 0.6 + i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
                                style={{ boxShadow: hoveredIdx === i ? riskGlow(v.risk) : "none" }}
                            >
                                {/* Shimmer */}
                                <motion.div
                                    className="absolute inset-0"
                                    style={{
                                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                                    }}
                                    animate={reduceMotion ? undefined : { x: ["-100%", "300%"] }}
                                    transition={reduceMotion ? undefined : { duration: 3, repeat: Infinity, delay: 2 + i * 0.3, repeatDelay: 5 }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
