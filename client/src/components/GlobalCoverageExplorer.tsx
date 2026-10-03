import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { Search, Globe2, Landmark, ChevronDown } from "lucide-react";

const REGIONS = [
  "All",
  "North America",
  "Europe",
  "Middle East",
  "Asia-Pacific",
  "Africa",
  "Latin America",
  "Global Standards",
] as const;

/**
 * Interactive global-coverage explorer.
 *
 * Lets a visitor explore the real regulatory corpus — search by framework,
 * authority, or jurisdiction, filter by region, and expand any card for detail.
 * Backed by the live `compliance.globalFrameworks` data (no placeholder data).
 */
export function GlobalCoverageExplorer() {
  const { t } = useLocale();
  const { data: frameworks = [], isLoading } =
    trpc.compliance.globalFrameworks.useQuery();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<string>("All");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return frameworks.filter(f => {
      if (region !== "All" && f.region !== region) return false;
      if (!q) return true;
      return [f.code, f.name, f.authority, f.jurisdiction, f.category]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [frameworks, query, region]);

  const jurisdictionCount = useMemo(
    () => new Set(frameworks.map(f => f.jurisdiction)).size,
    [frameworks]
  );

  return (
    <section
      className="mx-auto w-full max-w-6xl px-4 py-16"
      aria-label={t("home.coverageTitle", "Global compliance coverage")}
    >
      <div className="mb-8 text-center">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-300">
          <Globe2 className="h-3.5 w-3.5" />
          {t("home.coverageEyebrow", "Live regulatory corpus")}
        </p>
        <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
          {t("home.coverageTitle", "Explore every jurisdiction and framework")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          {t(
            "home.coverageSubtitle",
            "Search the real corpus of frameworks, laws, and standards DJAC maps for you — across jurisdictions and regions."
          )}
        </p>
      </div>

      {/* Search + region filter */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t(
              "home.coverageSearch",
              "Search frameworks, authorities, jurisdictions…"
            )}
            aria-label={t("home.coverageSearch", "Search frameworks")}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                region === r
                  ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        {isLoading
          ? t("common.loading", "Loading…")
          : `${filtered.length} ${t("home.coverageResults", "frameworks")} · ${jurisdictionCount} ${t("home.coverageJurisdictions", "jurisdictions")}`}
      </p>

      {/* Grid of framework cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 60).map(f => {
          const isOpen = open === f.code;
          return (
            <button
              key={f.code}
              type="button"
              onClick={() => setOpen(isOpen ? null : f.code)}
              className="group flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-cyan-400/40 hover:bg-white/[0.06]"
              aria-expanded={isOpen}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-white">
                  {f.name}
                </span>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-slate-300">
                  {f.code}
                </span>
                <span className="rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-[10px] text-cyan-200">
                  {f.region}
                </span>
              </div>
              {isOpen && (
                <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-xs text-slate-400">
                  <p className="flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5 text-slate-500" />
                    {f.authority}
                  </p>
                  <p>
                    <span className="text-slate-500">
                      {t("home.coverageJurisdiction", "Jurisdiction")}:{" "}
                    </span>
                    {f.jurisdiction}
                  </p>
                  <p>
                    <span className="text-slate-500">
                      {t("signup.industry", "Category")}:{" "}
                    </span>
                    {f.category}
                  </p>
                  <p className="text-slate-300">{f.description}</p>
                  {f.scope && (
                    <p className="text-slate-500">
                      {t("home.coverageScope", "Scope")}: {f.scope}
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">
          {t("home.coverageEmpty", "No frameworks match your search.")}
        </p>
      )}
    </section>
  );
}
