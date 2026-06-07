import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { useLocale } from "@/contexts/useLocale";

type Severity = "critical" | "high" | "medium" | "low";

export interface ThreatEntry {
    id: string;
    title: string;
    framework: string;
    country: string;
    severity: Severity;
    time: string;
}

const SEV_COLOR: Record<Severity, string> = {
    critical: "var(--djac-red)",
    high: "var(--djac-orange)",
    medium: "var(--djac-yellow)",
    low: "var(--djac-green)",
};

function buildDefaultEntries(locale: "en" | "ar" | "zh"): ThreatEntry[] {
    const copy = {
        en: {
            c1: "Data localization violation detected",
            c2: "PIPL consent gap — cross-border flow",
            c3: "PDPL data retention mismatch",
            c4: "NCA ECC vulnerability window",
            c5: "DSL cross-jurisdiction transfer",
            c6: "MLPS 2.0 audit log gap closed",
            china: "China",
            saudi: "Saudi Arabia",
        },
        ar: {
            c1: "تم اكتشاف مخالفة في توطين البيانات",
            c2: "فجوة موافقة في PIPL لتدفق عابر للحدود",
            c3: "عدم تطابق في احتفاظ بيانات PDPL",
            c4: "نافذة ثغرة في NCA ECC",
            c5: "نقل DSL عبر الولايات القضائية",
            c6: "تم إغلاق فجوة سجل التدقيق في MLPS 2.0",
            china: "الصين",
            saudi: "السعودية",
        },
        zh: {
            c1: "检测到数据本地化违规",
            c2: "PIPL 同意缺口 - 跨境流转",
            c3: "PDPL 数据保留不匹配",
            c4: "NCA ECC 漏洞窗口",
            c5: "DSL 跨司法辖区传输",
            c6: "MLPS 2.0 审计日志缺口已关闭",
            china: "中国",
            saudi: "沙特阿拉伯",
        },
    }[locale];

    return [
        { id: "1", title: copy.c1, framework: "CSL", country: copy.china, severity: "critical", time: "2 min" },
        { id: "2", title: copy.c2, framework: "PIPL", country: copy.china, severity: "high", time: "8 min" },
        { id: "3", title: copy.c3, framework: "PDPL", country: copy.saudi, severity: "medium", time: "15 min" },
        { id: "4", title: copy.c4, framework: "NCA ECC", country: copy.saudi, severity: "high", time: "23 min" },
        { id: "5", title: copy.c5, framework: "DSL", country: copy.china, severity: "medium", time: "40 min" },
        { id: "6", title: copy.c6, framework: "MLPS 2.0", country: copy.china, severity: "low", time: "1 hr" },
    ];
}

interface LiveThreatFeedProps {
    entries?: ThreatEntry[];
    maxHeight?: number;
}

export function LiveThreatFeed({ entries, maxHeight = 260 }: LiveThreatFeedProps) {
    const { locale } = useLocale();
    const reduceMotion = useReducedMotion();
    const safeLocale = locale === "ar" || locale === "zh" ? locale : "en";
    const resolvedEntries = useMemo(
        () => (entries && entries.length > 0 ? entries : buildDefaultEntries(safeLocale)),
        [entries, safeLocale]
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight, overflowY: "auto" }} className="djac-scroll">
            {resolvedEntries.map((entry, i) => {
                const col = SEV_COLOR[entry.severity];
                return (
                    <motion.div
                        key={entry.id}
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            padding: "9px 12px",
                            borderRadius: 9,
                            background: `${col}08`,
                            border: `1px solid ${col}25`,
                            position: "relative",
                            overflow: "hidden",
                        }}
                        initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                        animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                        transition={reduceMotion ? undefined : { duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Severity pulse dot */}
                        <div style={{ position: "relative", flexShrink: 0, marginTop: 3 }}>
                            <motion.div
                                style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: "50%",
                                    background: col,
                                    position: "relative",
                                    zIndex: 1,
                                }}
                                animate={!reduceMotion && entry.severity === "critical" ? { scale: [1, 1.4, 1] } : undefined}
                                transition={!reduceMotion && entry.severity === "critical" ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : undefined}
                            />
                            {!reduceMotion && entry.severity === "critical" && (
                                <motion.div
                                    style={{
                                        position: "absolute",
                                        inset: -3,
                                        borderRadius: "50%",
                                        background: col,
                                    }}
                                    animate={{ opacity: [0.4, 0], scale: [1, 2] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                                />
                            )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                                style={{
                                    color: "var(--djac-text)",
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    margin: 0,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                            >
                                {entry.title}
                            </p>
                            <p style={{ color: "var(--djac-muted)", fontSize: 9, margin: "2px 0 0" }}>
                                {entry.framework} · {entry.country} ·{" "}
                                <span style={{ color: col, fontWeight: 600 }}>{entry.severity}</span>
                            </p>
                        </div>

                        <span style={{ color: "var(--djac-muted)", fontSize: 8.5, flexShrink: 0, marginTop: 2 }}>
                            {entry.time}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
}
