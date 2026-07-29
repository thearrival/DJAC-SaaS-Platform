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
      c2: "GDPR consent gap — cross-border flow",
      c3: "CCPA data retention mismatch",
      c4: "NIST CSF vulnerability window",
      c5: "Cross-jurisdiction transfer detected",
      c6: "SOC 2 audit log gap closed",
      r1: "APAC",
      r2: "EMEA",
      r3: "Global",
    },
    ar: {
      c1: "تم اكتشاف مخالفة في توطين البيانات",
      c2: "فجوة موافقة في GDPR لتدفق عابر للحدود",
      c3: "عدم تطابق في احتفاظ بيانات CCPA",
      c4: "نافذة ثغرة في NIST CSF",
      c5: "تم اكتشاف نقل عبر الولايات القضائية",
      c6: "تم إغلاق فجوة سجل التدقيق في SOC 2",
      r1: "آسيا والمحيط الهادئ",
      r2: "أوروبا والشرق الأوسط وأفريقيا",
      r3: "عالمي",
    },
    zh: {
      c1: "检测到数据本地化违规",
      c2: "GDPR 同意缺口 - 跨境流转",
      c3: "CCPA 数据保留不匹配",
      c4: "NIST CSF 漏洞窗口",
      c5: "检测到跨司法辖区传输",
      c6: "SOC 2 审计日志缺口已关闭",
      r1: "亚太",
      r2: "欧洲、中东和非洲",
      r3: "全球",
    },
  }[locale];

  return [
    {
      id: "1",
      title: copy.c1,
      framework: "GDPR",
      country: copy.r1,
      severity: "critical",
      time: "2 min",
    },
    {
      id: "2",
      title: copy.c2,
      framework: "GDPR",
      country: copy.r3,
      severity: "high",
      time: "8 min",
    },
    {
      id: "3",
      title: copy.c3,
      framework: "CCPA",
      country: copy.r2,
      severity: "medium",
      time: "15 min",
    },
    {
      id: "4",
      title: copy.c4,
      framework: "NIST CSF",
      country: copy.r2,
      severity: "high",
      time: "23 min",
    },
    {
      id: "5",
      title: copy.c5,
      framework: "PIPL",
      country: copy.r1,
      severity: "medium",
      time: "40 min",
    },
    {
      id: "6",
      title: copy.c6,
      framework: "SOC 2",
      country: copy.r3,
      severity: "low",
      time: "1 hr",
    },
  ];
}

interface LiveThreatFeedProps {
  entries?: ThreatEntry[];
  maxHeight?: number;
}

export function LiveThreatFeed({
  entries,
  maxHeight = 260,
}: LiveThreatFeedProps) {
  const { locale } = useLocale();
  const reduceMotion = useReducedMotion();
  const safeLocale = locale === "ar" || locale === "zh" ? locale : "en";
  const resolvedEntries = useMemo(
    () =>
      entries && entries.length > 0 ? entries : buildDefaultEntries(safeLocale),
    [entries, safeLocale]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 7,
        maxHeight,
        overflowY: "auto",
      }}
      className="djac-scroll"
    >
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
            transition={
              reduceMotion
                ? undefined
                : { duration: 0.35, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }
            }
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
                animate={
                  !reduceMotion && entry.severity === "critical"
                    ? { scale: [1, 1.4, 1] }
                    : undefined
                }
                transition={
                  !reduceMotion && entry.severity === "critical"
                    ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
                    : undefined
                }
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
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
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
              <p
                style={{
                  color: "var(--djac-muted)",
                  fontSize: 9,
                  margin: "2px 0 0",
                }}
              >
                {entry.framework} · {entry.country} ·{" "}
                <span style={{ color: col, fontWeight: 600 }}>
                  {entry.severity}
                </span>
              </p>
            </div>

            <span
              style={{
                color: "var(--djac-muted)",
                fontSize: 8.5,
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {entry.time}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
