interface GlobalScoreOverviewProps {
  jurisdictionScores: Record<string, number | undefined>;
  t: (key: string, fallback: string) => string;
}

const SCORE_TILES: Array<{ key: string; label: string }> = [
  { key: "china", label: "CN" },
  { key: "saudiArabia", label: "SA" },
  { key: "eu", label: "EU" },
  { key: "us", label: "US" },
  { key: "brazil", label: "BR" },
  { key: "global", label: "GL" },
  { key: "uk", label: "UK" },
  { key: "canada", label: "CA" },
  { key: "australia", label: "AU" },
  { key: "japan", label: "JP" },
  { key: "southKorea", label: "KR" },
  { key: "singapore", label: "SG" },
  { key: "india", label: "IN" },
  { key: "southAfrica", label: "ZA" },
  { key: "mexico", label: "MX" },
  { key: "uae", label: "AE" },
  { key: "qatar", label: "QA" },
  { key: "kuwait", label: "KW" },
  { key: "bahrain", label: "BH" },
  { key: "oman", label: "OM" },
  { key: "jordan", label: "JO" },
  { key: "egypt", label: "EG" },
  { key: "indonesia", label: "ID" },
  { key: "thailand", label: "TH" },
  { key: "vietnam", label: "VN" },
  { key: "philippines", label: "PH" },
  { key: "malaysia", label: "MY" },
  { key: "nigeria", label: "NG" },
  { key: "kenya", label: "KE" },
];

function scoreColor(score: number | undefined) {
  if (typeof score !== "number") return "var(--djac-muted)";
  if (score >= 85) return "#22c55e";
  if (score >= 65) return "#eab308";
  return "#ef4444";
}

function scoreBg(score: number | undefined) {
  if (typeof score !== "number") return "rgba(148,163,184,0.06)";
  if (score >= 85) return "rgba(34,197,94,0.10)";
  if (score >= 65) return "rgba(234,179,8,0.10)";
  return "rgba(239,68,68,0.10)";
}

export function GlobalScoreOverview({
  jurisdictionScores,
  t,
}: GlobalScoreOverviewProps) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">
        {t("enhanced.scoreOverview", "Global Jurisdiction Score Overview")}
      </h4>
      <div className="grid grid-cols-5 gap-1 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {SCORE_TILES.map(({ key, label }) => {
          const score = jurisdictionScores[key];
          return (
            <div
              key={key}
              title={`${label}: ${typeof score === "number" ? score : "—"}`}
              style={{
                background: scoreBg(score),
                borderLeft: `2px solid ${scoreColor(score)}`,
                borderRadius: 4,
                padding: "3px 6px",
                fontSize: 10,
                lineHeight: 1.3,
              }}
            >
              <span className="font-semibold">{label}</span>
              <span className="ml-1" style={{ color: scoreColor(score) }}>
                {typeof score === "number" ? score : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
