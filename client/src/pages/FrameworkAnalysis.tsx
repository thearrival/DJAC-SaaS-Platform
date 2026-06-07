import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Download, Info, Search, X } from "lucide-react";

// ── CSV export helper ─────────────────────────────────────────────────────────
function exportControlsCsv(controls: { controlCode: string; controlName: string; category?: string | null; description?: string | null; requirement?: string | null; applicability?: string | null }[], frameworkCode: string) {
  const header = ["controlCode", "controlName", "category", "description", "requirement", "applicability"];
  const rows = controls.map(c => [
    c.controlCode, c.controlName, c.category ?? "", c.description ?? "", c.requirement ?? "", c.applicability ?? "",
  ].map(v => { const s = String(v).replace(/"/g, '""'); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s; }).join(","));
  const csv = [header.join(","), ...rows].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = `${frameworkCode}-controls-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function FrameworkAnalysis() {
  usePageTitle("Framework Analysis");
  const { t } = useLocale();
  const { data: frameworks, isLoading: frameworksLoading, error: frameworksError, refetch: refetchFrameworks } = trpc.compliance.frameworks.useQuery();
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<number | null>(null);
  const [controlSearch, setControlSearch] = useState("");
  const [controlCategory, setControlCategory] = useState<string>("all");

  const { data: controls, isLoading: controlsLoading, error: controlsError, refetch: refetchControls } = trpc.compliance.controls.useQuery(
    selectedFrameworkId || 0,
    { enabled: selectedFrameworkId !== null }
  );

  const { data: relationships, isLoading: relationshipsLoading, error: relationshipsError, refetch: refetchRelationships } = trpc.compliance.relationships.useQuery(
    selectedFrameworkId || 0,
    { enabled: selectedFrameworkId !== null }
  );

  useEffect(() => {
    if (frameworksError) toast.error(t("analysis.loadError", "Failed to load compliance frameworks."));
  }, [frameworksError]);

  useEffect(() => {
    if (controlsError) toast.error(t("analysis.controlsError", "Failed to load framework controls."));
  }, [controlsError]);

  useEffect(() => {
    if (relationshipsError) toast.error(t("analysis.relationshipsError", "Failed to load framework relationships."));
  }, [relationshipsError]);

  // Reset filters when framework changes
  useEffect(() => { setControlSearch(""); setControlCategory("all"); }, [selectedFrameworkId]);

  const selectedFramework = frameworks?.find((f) => f.id === selectedFrameworkId);

  // Build ID → code lookup so relationship target shows framework name, not raw ID
  const frameworkById = (frameworks ?? []).reduce<Record<number, string>>(
    (acc, f) => { acc[f.id] = f.code; return acc; },
    {}
  );

  // Unique categories from loaded controls
  const categoryOptions = useMemo(() => {
    if (!controls) return [];
    const cats = [...new Set(controls.map(c => c.category).filter(Boolean))] as string[];
    return cats.sort();
  }, [controls]);

  // Category counts for filter pills
  const categoryCounts = useMemo(() => {
    if (!controls) return {} as Record<string, number>;
    return controls.reduce<Record<string, number>>((acc, c) => {
      if (c.category) { acc[c.category] = (acc[c.category] ?? 0) + 1; }
      return acc;
    }, {});
  }, [controls]);

  // Filtered + searched controls
  const filteredControls = useMemo(() => {
    if (!controls) return [];
    const q = controlSearch.toLowerCase().trim();
    return controls.filter(c => {
      if (controlCategory !== "all" && c.category !== controlCategory) return false;
      if (!q) return true;
      return (
        c.controlCode.toLowerCase().includes(q) ||
        c.controlName.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        (c.requirement ?? "").toLowerCase().includes(q)
      );
    });
  }, [controls, controlSearch, controlCategory]);

  // Use theme tokens for category badges
  const getCategoryColor = (category: string) => {
    const tokens: Record<string, string> = {
      "Consent & Transparency": "bg-primary/5 text-primary border border-primary/20",
      "Data Subject Rights": "bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-200 border border-green-300 dark:border-green-700",
      "Data Security": "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-200 border border-purple-300 dark:border-purple-700",
      "Data Transfer": "bg-orange-100 text-orange-900 dark:bg-orange-900/20 dark:text-orange-200 border border-orange-300 dark:border-orange-700",
      "Incident Response": "bg-destructive/10 text-destructive border border-destructive/20",
      "Risk Management": "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700",
      "Network Security": "bg-blue-100 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200 border border-blue-300 dark:border-blue-700",
      "Access Control": "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/20 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-700",
      "Data Management": "bg-pink-100 text-pink-900 dark:bg-pink-900/20 dark:text-pink-200 border border-pink-300 dark:border-pink-700",
      Governance: "bg-teal-100 text-teal-900 dark:bg-teal-900/20 dark:text-teal-200 border border-teal-300 dark:border-teal-700",
    };
    return tokens[category] || "bg-muted text-foreground border border-border";
  };

  // Use theme tokens for relationship badges
  const getRelationshipBadgeColor = (type: string) => {
    switch (type) {
      case "overlap":
        return "bg-primary/10 text-primary border border-primary/20";
      case "conflict":
        return "bg-destructive/10 text-destructive border border-destructive/20";
      case "coordination":
      case "harmonization":
        return "bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-200 border border-green-300 dark:border-green-700";
      case "gap":
        return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/20 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700";
      case "dependency":
        return "bg-purple-100 text-purple-900 dark:bg-purple-900/20 dark:text-purple-200 border border-purple-300 dark:border-purple-700";
      default:
        return "bg-muted text-foreground border border-border";
    }
  };

  const translateRelationship = (type: string) => {
    return t(`common.relationship.${type.toLowerCase()}`, type);
  };

  const translateSeverity = (severity: string) => {
    return t(`common.severity.${severity.toLowerCase()}`, severity);
  };

  return (
    <div className="djac-page">
      {/* Header */}
      <div className="djac-page-header">
        <h1 className="djac-gradient-text text-3xl font-bold mb-2">{t("analysis.title", "Framework Analysis")}</h1>
        <p className="text-muted-foreground">
          {t("analysis.subtitle", "See how every rule maps, overlaps, and conflicts — so you know exactly where you stand.")}
        </p>
      </div>

      {/* Framework Selection */}
      <Card className="mb-8 djac-section-2">
        <CardHeader>
          <CardTitle>{t("analysis.selectFramework", "Select Framework")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {frameworksLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                {t("analysis.loadingFrameworks", "Loading frameworks...")}
              </div>
            ) : frameworksError ? (
              <div className="col-span-full rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
                <p className="text-sm text-foreground">{t("analysis.loadError", "Failed to load compliance frameworks.")}</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { void refetchFrameworks(); }}>
                  {t("common.retry", "Retry")}
                </Button>
              </div>
            ) : (
              frameworks?.map((fw) => (
                <button
                  key={fw.id}
                  onClick={() => setSelectedFrameworkId(fw.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${selectedFrameworkId === fw.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-muted-foreground/40"
                    }`}
                >
                  <p className="font-bold text-lg">{fw.code}</p>
                  <p className="text-sm text-muted-foreground">{fw.country}</p>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedFramework && (
        <Card className="mb-8 border-dashed">
          <CardContent className="pt-8 pb-8">
            <div className="text-center max-w-lg mx-auto">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg,#00F7FF22,#9359EC22)", border: "1px solid #9359EC40" }}>
                <AlertCircle className="h-7 w-7" style={{ color: "#9359EC" }} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t("analysis.guidanceTitle", "Select a Framework to Begin")}</h3>
              <p className="text-sm text-muted-foreground mb-5">{t("analysis.guidanceBody", "Choose one of the 5 active compliance frameworks above. You'll see a full breakdown of its controls, cross-jurisdiction relationships, severity levels, and recommended mitigations.")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["CSL", "DSL", "PIPL", "PDPL", "NCA ECC"].map(fw => (
                  <span key={fw} className="rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground border-border">{fw}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedFramework && (
        <>
          {/* Framework Overview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">{selectedFramework.name}</CardTitle>
              <CardDescription>{selectedFramework.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">{t("analysis.scope", "Scope")}</h3>
                  <p className="text-sm text-muted-foreground">{selectedFramework.scope}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    {t("analysis.enforcementAuthority", "Enforcement Authority")}
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedFramework.enforcementAuthority}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t("analysis.maxPenalty", "Maximum Penalty")}</h3>
                  <p className="text-sm text-muted-foreground">{selectedFramework.maxPenalty}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{t("analysis.country", "Country")}</h3>
                  <Badge className={selectedFramework.country === "China" ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-green-100 text-green-900 dark:bg-green-900/20 dark:text-green-200 border border-green-300 dark:border-green-700"}>
                    {selectedFramework.country}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Strip */}
          {(controls !== undefined || relationships !== undefined) && (
            <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t("analysis.statControls", "Controls"), value: controls?.length ?? 0, color: "text-primary" },
                { label: t("analysis.statRelationships", "Relationships"), value: relationships?.length ?? 0, color: "text-purple-600 dark:text-purple-400" },
                { label: t("analysis.statConflicts", "Conflicts"), value: relationships?.filter(r => r.relationshipType === "conflict").length ?? 0, color: "text-destructive" },
                { label: t("analysis.statHarmonized", "Harmonized"), value: relationships?.filter(r => ["coordination", "harmonization", "overlap"].includes(r.relationshipType)).length ?? 0, color: "text-green-600 dark:text-green-400" },
              ].map(stat => (
                <div key={stat.label} className="rounded-lg border bg-card px-4 py-3 text-center">
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tabs for Controls and Relationships */}
          <Card>
            <CardHeader>
              <CardTitle>{t("analysis.details", "Details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="controls" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="controls">
                    {t("analysis.controls", "Controls")} ({filteredControls.length}{controlSearch || controlCategory !== "all" ? ` / ${controls?.length ?? 0}` : ""})
                  </TabsTrigger>
                  <TabsTrigger value="relationships">
                    {t("analysis.relationships", "Relationships")} ({relationships?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="controls" className="space-y-4">
                  {/* Search + filter toolbar */}
                  {controls && controls.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2 flex-wrap items-center">
                        <div className="relative flex-1 min-w-[180px]">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <Input
                            value={controlSearch}
                            onChange={e => setControlSearch(e.target.value)}
                            placeholder={t("analysis.searchControls", "Search controls, requirements…")}
                            className="pl-8 h-8 text-sm"
                          />
                          {controlSearch && (
                            <button onClick={() => setControlSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <Button
                          size="sm" variant="outline" className="h-8 gap-1.5 text-xs shrink-0"
                          onClick={() => exportControlsCsv(filteredControls, selectedFramework?.code ?? "controls")}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {t("analysis.exportCsv", "Export CSV")}
                        </Button>
                      </div>
                      {/* Category pills */}
                      {categoryOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => setControlCategory("all")}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${controlCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/40"}`}
                          >
                            All ({controls.length})
                          </button>
                          {categoryOptions.map(cat => (
                            <button
                              key={cat}
                              onClick={() => setControlCategory(prev => prev === cat ? "all" : cat)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${controlCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/40"}`}
                            >
                              {cat} ({categoryCounts[cat] ?? 0})
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {controlsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("analysis.loadingControls", "Loading controls...")}
                    </div>
                  ) : controlsError && !controls ? (
                    <div className="text-center py-8 text-muted-foreground space-y-3">
                      <p className="text-sm">{t("analysis.controlsError", "Failed to load framework controls.")}</p>
                      <Button variant="outline" size="sm" onClick={() => { void refetchControls(); }}>
                        {t("common.retry", "Retry")}
                      </Button>
                    </div>
                  ) : filteredControls.length > 0 ? (
                    <div className="space-y-3">
                      {filteredControls.map((control) => (
                        <div key={control.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <p className="font-bold text-lg">{control.controlCode}</p>
                              <p className="font-semibold text-foreground">{control.controlName}</p>
                            </div>
                            {control.category && (
                              <Badge className={getCategoryColor(control.category)}>{control.category}</Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3">{control.description}</p>

                          <div className="space-y-2 text-sm">
                            {control.requirement && (
                              <div className="flex gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">{t("analysis.requirement", "Requirement")}</p>
                                  <p className="text-muted-foreground">{control.requirement}</p>
                                </div>
                              </div>
                            )}

                            {control.applicability && (
                              <div className="flex gap-2">
                                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">{t("analysis.applicability", "Applicability")}</p>
                                  <p className="text-muted-foreground">{control.applicability}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : controls && controls.length > 0 ? (
                    <div className="text-center py-10 text-muted-foreground space-y-2">
                      <p className="text-sm">{t("analysis.noFilteredControls", "No controls match your search or filters.")}</p>
                      <button
                        onClick={() => { setControlSearch(""); setControlCategory("all"); }}
                        className="text-xs text-primary underline underline-offset-2 hover:opacity-75 transition-opacity"
                      >
                        {t("analysis.clearFilters", "Clear filters")}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("analysis.noControls", "No controls found for this framework")}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="relationships" className="space-y-4">
                  {relationshipsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("analysis.loadingRelationships", "Loading relationships...")}
                    </div>
                  ) : relationshipsError && !relationships ? (
                    <div className="text-center py-8 text-muted-foreground space-y-3">
                      <p className="text-sm">{t("analysis.relationshipsError", "Failed to load framework relationships.")}</p>
                      <Button variant="outline" size="sm" onClick={() => { void refetchRelationships(); }}>
                        {t("common.retry", "Retry")}
                      </Button>
                    </div>
                  ) : relationships && relationships.length > 0 ? (
                    <div className="space-y-3">
                      {relationships.map((rel) => (
                        <div key={rel.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                {selectedFramework.code} → {frameworkById[rel.targetFrameworkId] ?? `Framework ${rel.targetFrameworkId}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getRelationshipBadgeColor(rel.relationshipType)}>
                                {translateRelationship(rel.relationshipType)}
                              </Badge>
                              {rel.severity && (
                                <Badge variant="outline" className={
                                  rel.severity === "critical"
                                    ? "border-destructive/40 text-destructive"
                                    : rel.severity === "high"
                                      ? "border-orange-400 text-orange-700 dark:text-orange-300"
                                      : rel.severity === "medium"
                                        ? "border-yellow-400 text-yellow-700 dark:text-yellow-300"
                                        : "border-green-400 text-green-700 dark:text-green-300"
                                }>
                                  {translateSeverity(rel.severity)}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {rel.description && <p className="text-sm text-muted-foreground mb-3">{rel.description}</p>}

                          {rel.mitigation && (
                            <div className="bg-primary/5 border border-primary/20 rounded p-3 text-sm">
                              <p className="font-medium text-foreground mb-1">
                                {t("analysis.mitigation", "Mitigation")}
                              </p>
                              <p className="text-muted-foreground">{rel.mitigation}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("analysis.noRelationships", "No relationships found for this framework")}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
