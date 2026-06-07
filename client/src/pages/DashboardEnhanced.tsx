import { useEffect, useState } from "react";
import type React from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowRightLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  GitBranch,
  Shield,
  TrendingDown,
  Zap,
} from "lucide-react";

const severityRank: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const urgentFrequencies = new Set(["immediate", "within_2h", "within_24h", "within_48h", "within_72h"]);



export default function DashboardEnhanced() {
  usePageTitle("Analytics Dashboard");
  const { t } = useLocale();
  const frameworksQuery = trpc.compliance.frameworks.useQuery();
  const comparisonMatrixQuery = trpc.compliance.matrix.useQuery();
  const timetableQuery = trpc.compliance.timetable.useQuery();
  const lawsQuery = trpc.compliance.laws.useQuery();
  const comparisonTopicsQuery = trpc.compliance.comparisonTable.useQuery();
  const frameworks = frameworksQuery.data;
  const frameworksLoading = frameworksQuery.isLoading;
  const comparisonMatrix = comparisonMatrixQuery.data;
  const timetable = timetableQuery.data;
  const laws = lawsQuery.data;
  const comparisonTopics = comparisonTopicsQuery.data;
  const [selectedFramework1, setSelectedFramework1] = useState<number | null>(null);
  const [selectedFramework2, setSelectedFramework2] = useState<number | null>(null);

  useEffect(() => {
    if (!frameworks || frameworks.length === 0) return;
    if (selectedFramework1 !== null && selectedFramework2 !== null) return;

    const frameworkIdByCode = new Map(frameworks.map((fw) => [fw.code, fw.id]));
    const preferredPair = comparisonMatrix?.find(
      (row) => frameworkIdByCode.has(row.source) && frameworkIdByCode.has(row.target)
    );

    if (preferredPair) {
      if (selectedFramework1 === null) {
        setSelectedFramework1(frameworkIdByCode.get(preferredPair.source) ?? null);
      }
      if (selectedFramework2 === null) {
        setSelectedFramework2(frameworkIdByCode.get(preferredPair.target) ?? null);
      }
      return;
    }

    const fallbackFirst = frameworks[0]?.id ?? null;
    const fallbackSecond = frameworks.find((fw) => fw.id !== fallbackFirst)?.id ?? null;

    if (selectedFramework1 === null) setSelectedFramework1(fallbackFirst);
    if (selectedFramework2 === null && fallbackSecond !== null) setSelectedFramework2(fallbackSecond);
  }, [frameworks, comparisonMatrix, selectedFramework1, selectedFramework2]);

  const comparisonQuery = trpc.compliance.comparison.useQuery(
    {
      framework1Id: selectedFramework1 || 0,
      framework2Id: selectedFramework2 || 0,
    },
    { enabled: selectedFramework1 !== null && selectedFramework2 !== null }
  );
  const comparisonData = comparisonQuery.data;
  const hasCoreLoadError = frameworksQuery.isError || comparisonMatrixQuery.isError || timetableQuery.isError || lawsQuery.isError || comparisonTopicsQuery.isError || comparisonQuery.isError;
  const coreErrorMessage = frameworksQuery.error?.message
    ?? comparisonMatrixQuery.error?.message
    ?? timetableQuery.error?.message
    ?? lawsQuery.error?.message
    ?? comparisonTopicsQuery.error?.message
    ?? comparisonQuery.error?.message;

  const frameworkIdByCode = new Map((frameworks ?? []).map((framework) => [framework.code, framework.id]));
  const selectedFrameworkRows = (frameworks ?? []).filter(
    (framework) => framework.id === selectedFramework1 || framework.id === selectedFramework2
  );
  const selectedFrameworkCodes = selectedFrameworkRows.map((framework) => framework.code);
  const selectedCountries = Array.from(new Set(selectedFrameworkRows.map((framework) => framework.country)));

  const categories1 = Array.from(
    new Set((comparisonData?.controls1 ?? []).map((control) => control.category).filter(Boolean))
  ) as string[];
  const categories2 = Array.from(
    new Set((comparisonData?.controls2 ?? []).map((control) => control.category).filter(Boolean))
  ) as string[];
  const sharedCategories = categories1.filter((category) => categories2.includes(category));
  const uniqueCategories1 = categories1.filter((category) => !categories2.includes(category));
  const uniqueCategories2 = categories2.filter((category) => !categories1.includes(category));

  const obligationsByCountry = (timetable ?? [])
    .filter((item) => selectedCountries.includes(item.country))
    .sort((left, right) => severityRank[right.riskLevel] - severityRank[left.riskLevel]);

  const obligationsByFramework = obligationsByCountry.filter((item) =>
    selectedFrameworkCodes.some((code) => item.framework.toLowerCase().includes(code.toLowerCase()))
  );

  const displayedObligations = obligationsByFramework.length > 0 ? obligationsByFramework : obligationsByCountry;
  const urgentObligations = displayedObligations.filter((item) => urgentFrequencies.has(item.frequency)).slice(0, 6);

  const comparisonRows = comparisonTopics ?? [];
  const matrixRows = [...(comparisonMatrix ?? [])].sort(
    (left, right) => severityRank[right.maxSeverity] - severityRank[left.maxSeverity]
  );
  const focusedMatrixRows = matrixRows.filter(
    (row) => selectedFrameworkCodes.includes(row.source) || selectedFrameworkCodes.includes(row.target)
  );
  const matrixRowsToShow = (focusedMatrixRows.length > 0 ? focusedMatrixRows : matrixRows).slice(0, 12);

  const referenceLaws = (laws ?? [])
    .filter(
      (entry) =>
        entry.jurisdiction === "Cross-border" ||
        selectedCountries.includes(entry.jurisdiction) ||
        entry.frameworkCodes.some((code) => selectedFrameworkCodes.includes(code))
    )
    .slice(0, 4);

  const prioritizedRelationships = [...(comparisonData?.relationships ?? [])].sort(
    (left, right) => severityRank[right.severity] - severityRank[left.severity]
  );
  const riskQueue = prioritizedRelationships.filter((item) =>
    ["conflict", "gap", "dependency"].includes(item.relationshipType)
  );
  const vulnerabilityItems = riskQueue.length > 0 ? riskQueue : prioritizedRelationships;

  const getCountryColor = (country: string) => {
    return country === "China"
      ? "border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
      : "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400";
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case "overlap":
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      case "conflict":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "coordination":
      case "harmonization":
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case "gap":
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case "dependency":
        return <GitBranch className="h-5 w-5 text-purple-500" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case "overlap":
        return "border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20";
      case "conflict":
        return "border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20";
      case "coordination":
      case "harmonization":
        return "border-yellow-200 dark:border-yellow-800/40 bg-yellow-50 dark:bg-yellow-950/20";
      case "gap":
        return "border-orange-200 dark:border-orange-800/40 bg-orange-50 dark:bg-orange-950/20";
      case "dependency":
        return "border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-950/20";
      default:
        return "border-border bg-card";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-red-300 dark:border-red-800/50 bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400";
      case "high":
        return "border-orange-300 dark:border-orange-800/50 bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400";
      case "medium":
        return "border-yellow-300 dark:border-yellow-800/50 bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400";
      case "low":
        return "border-green-300 dark:border-green-800/50 bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300";
      default:
        return "border-border bg-muted text-foreground";
    }
  };

  const translateRelationship = (type: string) => {
    return t(`common.relationship.${type.toLowerCase()}`, type);
  };

  const translateSeverity = (severity: string) => {
    return t(`common.severity.${severity.toLowerCase()}`, severity);
  };

  const formatFrequency = (frequency: string) => {
    return t(`enhanced.freq.${frequency}`, frequency.replace(/_/g, " "));
  };

  const translateCountry = (country: string) => {
    if (country === "Saudi Arabia") return t("home.saudi", "Saudi Arabia");
    if (country === "China") return t("home.china", "China");
    if (country === "Cross-border") return t("home.crossBorder", "Cross-border");
    return country;
  };

  const translateJurisdiction = (jurisdiction: string) => {
    if (jurisdiction === "Cross-border") return t("home.crossBorder", "Cross-border");
    return translateCountry(jurisdiction);
  };

  const swapFrameworks = () => {
    setSelectedFramework1(selectedFramework2);
    setSelectedFramework2(selectedFramework1);
  };

  const loadPairFromMatrix = (sourceCode: string, targetCode: string) => {
    setSelectedFramework1(frameworkIdByCode.get(sourceCode) ?? null);
    setSelectedFramework2(frameworkIdByCode.get(targetCode) ?? null);
  };

  return (
    <div className="djac-page">
      {hasCoreLoadError && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 py-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <p className="font-medium text-foreground">{t("enhanced.errorTitle", "Comparison data unavailable")}</p>
              <p className="text-sm text-muted-foreground">{coreErrorMessage ?? t("enhanced.errorDesc", "Failed to load one or more comparison datasets.")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              void frameworksQuery.refetch();
              void comparisonMatrixQuery.refetch();
              void timetableQuery.refetch();
              void lawsQuery.refetch();
              void comparisonTopicsQuery.refetch();
              if (selectedFramework1 !== null && selectedFramework2 !== null) {
                void comparisonQuery.refetch();
              }
            }}>
              {t("common.retry", "Retry")}
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">{t("enhanced.title", "DJAC Tool - Enhanced Comparison")}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t(
              "enhanced.subtitle",
              "Advanced framework analysis with relationships, vulnerabilities, and coordination opportunities"
            )}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-transparent">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t("enhanced.frameworksTitle", "Compliance Frameworks")}</p>
              <p className="mt-2 text-3xl font-bold text-blue-950 dark:text-blue-100">{frameworks?.length ?? 0}</p>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{t("enhanced.statFrameworksDesc", "Saudi Arabia and China data packs loaded.")}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-transparent">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t("home.saudi", "Saudi Arabia")}</p>
              <p className="mt-2 text-3xl font-bold text-emerald-950 dark:text-emerald-100">
                {(frameworks ?? []).filter((framework) => framework.country === "Saudi Arabia").length}
              </p>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{t("enhanced.statSaudiDesc", "PDPL, NCA, ECC, CCC, CSCC, OTCC and related controls.")}</p>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900/40 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-transparent">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{t("home.china", "China")}</p>
              <p className="mt-2 text-3xl font-bold text-red-950 dark:text-red-100">
                {(frameworks ?? []).filter((framework) => framework.country === "China").length}
              </p>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{t("enhanced.statChinaDesc", "CSL, DSL, PIPL, MLPS 2.0 and transfer obligations.")}</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 dark:border-purple-900/40 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/30 dark:to-transparent">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">{t("enhanced.tabMatrix", "Matrix")}</p>
              <p className="mt-2 text-3xl font-bold text-purple-950 dark:text-purple-100">{comparisonMatrix?.length ?? 0}</p>
              <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">{t("enhanced.statMatrixDesc", "Cross-framework relationships ready for pair selection.")}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-foreground">{t("enhanced.frameworksTitle", "Compliance Frameworks")}</h2>
          <Badge variant="outline" className="text-sm">
            {selectedFrameworkCodes.length > 0
              ? `${selectedFrameworkCodes.join(` ${t("common.vs", "vs")} `)}`
              : t("enhanced.awaitingPair", "Awaiting pair selection")}
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {frameworksLoading ? (
            <div className="col-span-full rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
              {t("enhanced.loadingFrameworks", "Loading frameworks...")}
            </div>
          ) : frameworksQuery.isError ? (
            <div className="col-span-full rounded-xl border border-destructive/40 bg-destructive/5 py-12 text-center">
              <p className="text-sm text-muted-foreground">{frameworksQuery.error?.message ?? t("enhanced.frameworksLoadError", "Failed to load frameworks.")}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 h-7 text-xs"
                onClick={() => {
                  void frameworksQuery.refetch();
                }}
              >
                {t("common.retry", "Retry")}
              </Button>
            </div>
          ) : frameworks && frameworks.length > 0 ? (
            frameworks.map((framework) => (
              <Card
                key={framework.id}
                className={`transition-all hover:-translate-y-0.5 hover:shadow-lg ${selectedFramework1 === framework.id || selectedFramework2 === framework.id
                  ? "border-primary shadow-md"
                  : "border-border"
                  }`}
              >
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">{framework.code}</CardTitle>
                      <CardDescription className="mt-1 text-sm">{framework.name}</CardDescription>
                    </div>
                    <Badge className={getCountryColor(framework.country)}>{translateCountry(framework.country)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="line-clamp-3 text-muted-foreground">{framework.description}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>
                      <strong className="text-foreground">{t("enhanced.authorityLabel", "Authority")}:</strong>{" "}
                      {framework.enforcementAuthority}
                    </p>
                    <p>
                      <strong className="text-foreground">{t("enhanced.scopeLabel", "Scope")}:</strong> {framework.scope}
                    </p>
                    <p>
                      <strong className="text-foreground">{t("dashboard.maxPenaltyLabel", "Max Penalty")}:</strong>{" "}
                      {framework.maxPenalty}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full rounded-xl border border-dashed border-destructive py-12 text-center text-destructive">
              {t("enhanced.noFrameworks", "No frameworks found. Please seed the database or check your backend.")}
            </div>
          )}
        </div>
      </div>

      <Card className="overflow-hidden border-2 border-border shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-white to-emerald-50 dark:bg-none dark:from-transparent dark:via-transparent dark:to-transparent">
          <CardTitle className="text-2xl text-foreground">{t("enhanced.advancedTitle", "Advanced Framework Comparison")}</CardTitle>
          <CardDescription>
            {t(
              "enhanced.advancedDesc",
              "Analyze relationships, overlaps, conflicts, vulnerabilities, and coordination opportunities"
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="comparison" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comparison">{t("enhanced.tabComparison", "Comparison")}</TabsTrigger>
              <TabsTrigger value="vulnerabilities">{t("enhanced.tabVulnerabilities", "Vulnerabilities")}</TabsTrigger>
              <TabsTrigger value="matrix">{t("enhanced.tabMatrix", "Matrix")}</TabsTrigger>
            </TabsList>

            <TabsContent value="comparison" className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">{t("enhanced.framework1", "Framework 1")}</label>
                  <Select
                    value={selectedFramework1 ? String(selectedFramework1) : undefined}
                    onValueChange={(value) => setSelectedFramework1(Number(value))}
                    disabled={!frameworks || frameworks.length === 0}
                  >
                    <SelectTrigger className="w-full rounded-lg border-2 border-border font-medium hover:border-primary">
                      <SelectValue placeholder={t("enhanced.noFrameworksOption", "No frameworks available")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(frameworks ?? []).map((framework) => (
                        <SelectItem key={framework.id} value={String(framework.id)}>
                          {framework.code} - {framework.name} ({translateCountry(framework.country)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center lg:pb-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={swapFrameworks}
                    disabled={selectedFramework1 === null || selectedFramework2 === null}
                    className="gap-2"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    {t("enhanced.swapButton", "Swap")}
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">{t("enhanced.framework2", "Framework 2")}</label>
                  <Select
                    value={selectedFramework2 ? String(selectedFramework2) : undefined}
                    onValueChange={(value) => setSelectedFramework2(Number(value))}
                    disabled={!frameworks || frameworks.length === 0}
                  >
                    <SelectTrigger className="w-full rounded-lg border-2 border-border font-medium hover:border-primary">
                      <SelectValue placeholder={t("enhanced.noFrameworksOption", "No frameworks available")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(frameworks ?? []).map((framework) => (
                        <SelectItem key={framework.id} value={String(framework.id)}>
                          {framework.code} - {framework.name} ({translateCountry(framework.country)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!frameworksLoading && frameworks && frameworks.length > 0 && selectedFramework1 && selectedFramework2 ? (
                comparisonData ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Card className="border-red-200 dark:border-red-900/40 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-transparent">
                        <CardContent className="pt-6 text-center">
                          <p className="text-sm font-medium text-red-700 dark:text-red-300">{comparisonData.framework1.code}</p>
                          <p className="mt-2 text-3xl font-bold text-red-950 dark:text-red-100">{comparisonData.controls1.length}</p>
                          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{t("enhanced.controlsLabel", "Controls")}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-transparent">
                        <CardContent className="pt-6 text-center">
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{comparisonData.framework2.code}</p>
                          <p className="mt-2 text-3xl font-bold text-emerald-950 dark:text-emerald-100">{comparisonData.controls2.length}</p>
                          <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{t("enhanced.controlsLabel", "Controls")}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-transparent">
                        <CardContent className="pt-6 text-center">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{t("enhanced.totalRelationships", "Total Relationships")}</p>
                          <p className="mt-2 text-3xl font-bold text-blue-950 dark:text-blue-100">{comparisonData.relationships.length}</p>
                          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{t("enhanced.crossJurisdictionDesc", "Cross-jurisdiction links active.")}</p>
                        </CardContent>
                      </Card>
                      <Card className="border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-transparent">
                        <CardContent className="pt-6 text-center">
                          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{t("enhanced.criticalWindows", "Critical windows")}</p>
                          <p className="mt-2 text-3xl font-bold text-amber-950 dark:text-amber-100">{urgentObligations.length}</p>
                          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{t("enhanced.urgentWindowsStat", "Urgent reporting and regulatory deadlines surfaced.")}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-2">
                      <Card className="border-border">
                        <CardHeader>
                          <CardTitle className="text-lg text-foreground">{t("enhanced.frameworkProfileTitle", "Selected Framework Profile")}</CardTitle>
                          <CardDescription>{t("enhanced.frameworkProfileDesc", "Source content mapped into framework summaries and control families.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold text-red-950 dark:text-red-100">{comparisonData.framework1.code}</p>
                                <p className="text-sm text-red-700 dark:text-red-400">{translateCountry(comparisonData.framework1.country)}</p>
                              </div>
                              <Badge className={getCountryColor(comparisonData.framework1.country)}>
                                {translateCountry(comparisonData.framework1.country)}
                              </Badge>
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-red-900 dark:text-red-300">
                              <p>
                                <strong>{t("enhanced.authorityLabel", "Authority")}:</strong> {comparisonData.framework1.enforcementAuthority}
                              </p>
                              <p>
                                <strong>{t("enhanced.scopeLabel", "Scope")}:</strong> {comparisonData.framework1.scope}
                              </p>
                              <p>
                                <strong>{t("dashboard.maxPenaltyLabel", "Max Penalty")}:</strong> {comparisonData.framework1.maxPenalty}
                              </p>
                            </div>
                          </div>

                          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-lg font-semibold text-emerald-950 dark:text-emerald-100">{comparisonData.framework2.code}</p>
                                <p className="text-sm text-emerald-700 dark:text-emerald-400">{translateCountry(comparisonData.framework2.country)}</p>
                              </div>
                              <Badge className={getCountryColor(comparisonData.framework2.country)}>
                                {translateCountry(comparisonData.framework2.country)}
                              </Badge>
                            </div>
                            <div className="mt-4 space-y-2 text-sm text-emerald-900 dark:text-emerald-300">
                              <p>
                                <strong>{t("enhanced.authorityLabel", "Authority")}:</strong> {comparisonData.framework2.enforcementAuthority}
                              </p>
                              <p>
                                <strong>{t("enhanced.scopeLabel", "Scope")}:</strong> {comparisonData.framework2.scope}
                              </p>
                              <p>
                                <strong>{t("dashboard.maxPenaltyLabel", "Max Penalty")}:</strong> {comparisonData.framework2.maxPenalty}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border">
                        <CardHeader>
                          <CardTitle className="text-lg text-foreground">{t("enhanced.controlCoverageTitle", "Control Coverage Snapshot")}</CardTitle>
                          <CardDescription>{t("enhanced.controlCoverageDesc", "Overlap and unique control families derived from the attached frameworks.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="mb-2 text-sm font-semibold text-foreground">{t("enhanced.sharedCategories", "Shared control categories")}</p>
                            <div className="flex flex-wrap gap-2">
                              {sharedCategories.length > 0 ? (
                                sharedCategories.map((category) => (
                                  <Badge key={category} className="border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                                    {category}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-muted-foreground">{t("enhanced.noSharedCategories", "No direct category overlap found for the selected pair.")}</span>
                              )}
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <p className="mb-2 text-sm font-semibold text-foreground">{comparisonData.framework1.code} {t("enhanced.uniqueSuffix", "unique")}</p>
                              <div className="flex flex-wrap gap-2">
                                {uniqueCategories1.length > 0 ? (
                                  uniqueCategories1.map((category) => (
                                    <Badge key={category} className="border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
                                      {category}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">{t("enhanced.noUniqueCategories", "No unique categories.")}</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="mb-2 text-sm font-semibold text-foreground">{comparisonData.framework2.code} {t("enhanced.uniqueSuffix", "unique")}</p>
                              <div className="flex flex-wrap gap-2">
                                {uniqueCategories2.length > 0 ? (
                                  uniqueCategories2.map((category) => (
                                    <Badge key={category} className="border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                                      {category}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">{t("enhanced.noUniqueCategories", "No unique categories.")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                      <Card className="border-border">
                        <CardHeader>
                          <CardTitle className="text-lg text-foreground">{t("enhanced.frameworkRelationships", "Framework Relationships")}</CardTitle>
                          <CardDescription>{t("enhanced.relationshipsDesc", "Relationships, mitigation notes, and action recommendations from the integrated reference pack.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {comparisonData.relationships.length > 0 ? (
                            comparisonData.relationships.map((relationship) => (
                              <div
                                key={relationship.id}
                                className={`rounded-xl border-2 p-4 ${getRelationshipColor(relationship.relationshipType)}`}
                              >
                                <div className="flex items-start gap-4">
                                  {getRelationshipIcon(relationship.relationshipType)}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-foreground">
                                        {translateRelationship(relationship.relationshipType)}
                                      </p>
                                      {relationship.severity && (
                                        <Badge className={`${getSeverityColor(relationship.severity)} border`}>
                                          {translateSeverity(relationship.severity)}
                                        </Badge>
                                      )}
                                      {relationship.sourceDirection && relationship.targetDirection ? (
                                        <Badge variant="outline">
                                          {relationship.sourceDirection} -&gt; {relationship.targetDirection}
                                        </Badge>
                                      ) : null}
                                    </div>
                                    {relationship.description ? (
                                      <p className="text-sm text-muted-foreground">{relationship.description}</p>
                                    ) : null}
                                    {relationship.actionRecommendation ? (
                                      <div className="rounded-lg bg-background/80 p-3 text-sm text-muted-foreground">
                                        <strong className="text-foreground">{t("enhanced.actionLabel", "Action")}:</strong> {relationship.actionRecommendation}
                                      </div>
                                    ) : null}
                                    {relationship.mitigation ? (
                                      <div className="rounded-lg bg-background/80 p-3 text-sm text-muted-foreground">
                                        <strong className="text-foreground">{t("enhanced.mitigation", "Mitigation")}:</strong>{" "}
                                        {relationship.mitigation}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground">
                              {t("enhanced.noRelationships", "No relationships found between the selected frameworks.")}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-border">
                        <CardHeader>
                          <CardTitle className="text-lg text-foreground">{t("enhanced.timetableTitle", "Regulatory Timetable Impact")}</CardTitle>
                          <CardDescription>{t("enhanced.timetableDesc", "Deadlines and recurring obligations for the selected jurisdictions.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {displayedObligations.length > 0 ? (
                            displayedObligations.slice(0, 6).map((obligation) => (
                              <div key={obligation.id} className="rounded-xl border border-border bg-muted/40 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-foreground">{obligation.requirement}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      {obligation.framework} · {obligation.authority}
                                    </p>
                                  </div>
                                  <Badge className={`${getSeverityColor(obligation.riskLevel)} border`}>
                                    {translateSeverity(obligation.riskLevel)}
                                  </Badge>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Badge variant="outline">{formatFrequency(obligation.frequency)}</Badge>
                                  {obligation.deadline ? <Badge variant="outline">{obligation.deadline}</Badge> : null}
                                  <Badge className={getCountryColor(obligation.country)}>{translateCountry(obligation.country)}</Badge>
                                </div>
                              </div>
                            ))
                          ) : timetableQuery.isError ? (
                            <div className="rounded-xl border border-destructive/40 bg-destructive/5 py-8 text-center">
                              <p className="text-sm text-muted-foreground">{timetableQuery.error?.message ?? t("enhanced.timetableLoadError", "Failed to load timetable data.")}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3 h-7 text-xs"
                                onClick={() => {
                                  void timetableQuery.refetch();
                                }}
                              >
                                {t("common.retry", "Retry")}
                              </Button>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground">
                              {t("enhanced.noTimetableRows", "No timetable rows available for the selected pair.")}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                    {t("enhanced.noComparisonData", "No comparison data found for the selected frameworks.")}
                  </div>
                )
              ) : null}
            </TabsContent>

            <TabsContent value="vulnerabilities" className="space-y-6">
              {comparisonData && comparisonData.relationships.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Card className="border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20">
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {prioritizedRelationships.filter((item) => item.severity === "critical").length}
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400">{t("enhanced.critical", "Critical")}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-200 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20">
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {prioritizedRelationships.filter((item) => item.severity === "high").length}
                        </p>
                        <p className="text-xs text-orange-700 dark:text-orange-400">{t("enhanced.high", "High")}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-yellow-200 dark:border-yellow-900/40 bg-yellow-50 dark:bg-yellow-950/20">
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                          {prioritizedRelationships.filter((item) => item.severity === "medium").length}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">{t("enhanced.medium", "Medium")}</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-950/20">
                      <CardContent className="pt-4 text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {prioritizedRelationships.filter((item) => item.severity === "low").length}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400">{t("enhanced.low", "Low")}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                          <Shield className="h-5 w-5 text-red-500" />
                          {t("enhanced.penaltyTitle", "Penalty Exposure and Legal Pressure")}
                        </CardTitle>
                        <CardDescription>{t("enhanced.penaltyDesc", "Maximum penalty context and direct legal exposure for the active pair.")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {comparisonData.penaltyRiskSummary.map((item) => (
                          <div key={item.frameworkCode} className="rounded-xl border border-border bg-muted/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-foreground">{item.frameworkCode}</p>
                              <Badge variant="outline">{t("enhanced.penaltyContext", "Penalty context")}</Badge>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{item.maxPenalty}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                          <Clock3 className="h-5 w-5 text-amber-500" />
                          {t("enhanced.urgentWindowsTitle", "Urgent Reporting Windows")}
                        </CardTitle>
                        <CardDescription>{t("enhanced.urgentWindowsDesc", "Immediate escalation triggers from Saudi and China reporting requirements.")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {urgentObligations.length > 0 ? (
                          urgentObligations.map((obligation) => (
                            <div key={obligation.id} className="rounded-xl border border-border bg-muted/40 p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-foreground">{obligation.requirement}</p>
                                <Badge className={`${getSeverityColor(obligation.riskLevel)} border`}>
                                  {translateSeverity(obligation.riskLevel)}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm text-muted-foreground">
                                {translateCountry(obligation.country)} · {obligation.authority} · {formatFrequency(obligation.frequency)}
                                {obligation.deadline ? ` · ${obligation.deadline}` : ""}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground">
                            {t("enhanced.noUrgentWindows", "No urgent reporting windows found for the active pair.")}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">{t("enhanced.riskQueueTitle", "Risk Action Queue")}</CardTitle>
                      <CardDescription>{t("enhanced.riskQueueDesc", "Conflicts, gaps, and dependencies extracted into an operational remediation list.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {vulnerabilityItems.length > 0 ? (
                        vulnerabilityItems.map((item) => (
                          <div key={item.id} className={`rounded-xl border-2 p-4 ${getRelationshipColor(item.relationshipType)}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-foreground">{translateRelationship(item.relationshipType)}</p>
                                  {item.severity ? (
                                    <Badge className={`${getSeverityColor(item.severity)} border`}>
                                      {translateSeverity(item.severity)}
                                    </Badge>
                                  ) : null}
                                </div>
                                {item.description ? <p className="text-sm text-muted-foreground">{item.description}</p> : null}
                                {item.actionRecommendation ? (
                                  <p className="text-sm text-foreground">
                                    <strong>{t("enhanced.actionLabel", "Action")}:</strong> {item.actionRecommendation}
                                  </p>
                                ) : null}
                                {item.mitigation ? (
                                  <p className="text-sm text-muted-foreground">
                                    <strong className="text-foreground">{t("enhanced.mitigation", "Mitigation")}:</strong>{" "}
                                    {item.mitigation}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground">
                          {t("enhanced.noVulnerabilities", "No vulnerabilities found")}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                  {t("enhanced.noVulnerabilities", "No vulnerabilities found")}
                </div>
              )}
            </TabsContent>

            <TabsContent value="matrix" className="space-y-6">
              {comparisonMatrix && comparisonMatrix.length > 0 ? (
                <>
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground">{t("enhanced.matrixInteractiveTitle", "Interactive Relationship Matrix")}</CardTitle>
                      <CardDescription>{t("enhanced.matrixSelectHint", "Select any matrix row to push that pair into the Comparison and Vulnerabilities sections.")}</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                      <table className="w-full min-w-[840px] border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50 text-left">
                            <th className="px-4 py-3 font-semibold text-foreground">{t("enhanced.matrixSource", "Source")}</th>
                            <th className="px-4 py-3 font-semibold text-foreground">{t("enhanced.matrixTarget", "Target")}</th>
                            <th className="px-4 py-3 font-semibold text-foreground">{t("enhanced.matrixRelationships", "Relationships")}</th>
                            <th className="px-4 py-3 font-semibold text-foreground">{t("enhanced.matrixMaxSeverity", "Max severity")}</th>
                            <th className="px-4 py-3 font-semibold text-foreground">{t("enhanced.matrixActionsCol", "Actions")}</th>
                            <th className="px-4 py-3 font-semibold text-foreground">{t("enhanced.matrixUsePair", "Use pair")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matrixRowsToShow.map((row) => {
                            const isSelectedPair =
                              row.source === selectedFrameworkRows[0]?.code ||
                              row.source === selectedFrameworkRows[1]?.code ||
                              row.target === selectedFrameworkRows[0]?.code ||
                              row.target === selectedFrameworkRows[1]?.code;

                            return (
                              <tr
                                key={`${row.source}-${row.target}`}
                                className={`border-b border-border transition-colors hover:bg-muted/40 ${isSelectedPair ? "bg-blue-50/70 dark:bg-blue-950/20" : ""
                                  }`}
                              >
                                <td className="px-4 py-3 font-semibold text-foreground">{row.source}</td>
                                <td className="px-4 py-3 font-semibold text-foreground">{row.target}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {row.relationships.map((relationship) => (
                                      <Badge key={`${row.source}-${row.target}-${relationship}`} variant="secondary">
                                        {translateRelationship(relationship)}
                                      </Badge>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={`${getSeverityColor(row.maxSeverity)} border`}>
                                    {translateSeverity(row.maxSeverity)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{row.actions.length}</td>
                                <td className="px-4 py-3">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadPairFromMatrix(row.source, row.target)}
                                  >
                                    {t("enhanced.loadPair", "Load pair")}
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-lg text-foreground">{t("enhanced.comparisonNotesTitle", "Saudi Arabia vs China Comparison Notes")}</CardTitle>
                        <CardDescription>{t("enhanced.comparisonNotesDesc", "The attached cross-jurisdiction report is surfaced here as a quick executive matrix.")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {comparisonRows.slice(0, 8).map((row) => (
                          <div key={row.topic} className="rounded-xl border border-border bg-muted/40 p-4">
                            <p className="font-semibold text-foreground">{row.topic}</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("home.saudi", "Saudi Arabia")}</p>
                                <p className="mt-1 text-sm text-foreground">{row.saudiArabia}</p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("home.china", "China")}</p>
                                <p className="mt-1 text-sm text-foreground">{row.china}</p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-muted-foreground">{row.notes}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-lg text-foreground">{t("enhanced.matrixActionGuidanceTitle", "Matrix Action Guidance")}</CardTitle>
                        <CardDescription>{t("enhanced.matrixActionGuidanceDesc", "Recommended handling steps per relationship group from the integrated dataset.")}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {matrixRowsToShow.slice(0, 6).map((row) => (
                          <div key={`${row.source}-${row.target}-action`} className="rounded-xl border border-border bg-muted/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-foreground">
                                {row.source} -&gt; {row.target}
                              </p>
                              <Badge className={`${getSeverityColor(row.maxSeverity)} border`}>
                                {translateSeverity(row.maxSeverity)}
                              </Badge>
                            </div>
                            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                              {row.actions.slice(0, 2).map((action) => (
                                <li key={action}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : comparisonQuery.isError ? (
                <div className="rounded-xl border border-destructive/40 bg-destructive/5 py-12 text-center">
                  <p className="text-sm text-muted-foreground">{comparisonQuery.error?.message ?? t("enhanced.comparisonLoadError", "Failed to load comparison data.")}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-7 text-xs"
                    onClick={() => {
                      void comparisonQuery.refetch();
                    }}
                  >
                    {t("common.retry", "Retry")}
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
                  {t("enhanced.noMatrixData", "No matrix data available")}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <Clock3 className="h-5 w-5 text-blue-500" />
              {t("dashboard.keyDeadlines", "Key Regulatory Deadlines & Schedules")}
            </CardTitle>
            <CardDescription>{t("enhanced.deadlinesDesc", "Operational timelines from the attached Saudi and China reports.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {displayedObligations.length > 0 ? (
              displayedObligations.slice(0, 8).map((obligation) => (
                <div key={obligation.id} className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{obligation.requirement}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {translateCountry(obligation.country)} · {obligation.framework} · {obligation.authority}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{formatFrequency(obligation.frequency)}</Badge>
                      {obligation.deadline ? <Badge variant="outline">{obligation.deadline}</Badge> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{obligation.description}</p>
                </div>
              ))
            ) : timetableQuery.isError ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 py-8 text-center">
                <p className="text-sm text-muted-foreground">{timetableQuery.error?.message ?? t("enhanced.timetableLoadError", "Failed to load timetable data.")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 h-7 text-xs"
                  onClick={() => {
                    void timetableQuery.refetch();
                  }}
                >
                  {t("common.retry", "Retry")}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground">
                {t("enhanced.noTimetableData", "No timetable data available for the selected jurisdictions.")}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <BookOpen className="h-5 w-5 text-emerald-500" />
              {t("enhanced.legalBriefsTitle", "Legal Reference Briefs")}
            </CardTitle>
            <CardDescription>{t("enhanced.legalBriefsDesc", "Official-source summaries and legal notes connected to the selected frameworks.")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {referenceLaws.length > 0 ? (
              referenceLaws.map((entry) => (
                <div key={entry.slug} className="rounded-xl border border-border bg-muted/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{entry.title}</p>
                    <Badge variant="outline">{translateJurisdiction(entry.jurisdiction)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{entry.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.frameworkCodes.map((code) => (
                      <Badge key={`${entry.slug}-${code}`} className="border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                        {code}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    <strong className="text-foreground">{t("enhanced.sourcesLabel", "Sources")}:</strong> {entry.sources.join(" · ")}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border py-8 text-center text-muted-foreground">
                {t("enhanced.noLegalBriefs", "No legal briefs matched the selected frameworks.")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-blue-950 dark:text-blue-100">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {t("enhanced.overlappingControls", "Overlapping Controls")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 dark:text-blue-300">
            {sharedCategories.length > 0
              ? `${t("enhanced.sharedCategoriesActive", "Shared categories for this pair:")} ${sharedCategories.slice(0, 4).join(", ")}${sharedCategories.length > 4 ? "..." : ""}`
              : t(
                "enhanced.overlappingControlsDesc",
                "Identify common compliance requirements that can be addressed with unified controls across both frameworks."
              )}
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900/40 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-red-950 dark:text-red-100">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              {t("enhanced.conflictingRequirements", "Conflicting Requirements")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-900 dark:text-red-300">
            {riskQueue.length > 0
              ? `${riskQueue.length} ${t("enhanced.conflictsActiveCount", "high-priority conflict, gap, or dependency items active for the selected frameworks.")}`
              : t(
                "enhanced.conflictingRequirementsDesc",
                "Recognize contradictory obligations requiring separate infrastructure or jurisdiction-specific implementations."
              )}
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-emerald-950 dark:text-emerald-100">
              <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              {t("enhanced.coordinationOpportunities", "Coordination Opportunities")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-900 dark:text-emerald-300">
            {urgentObligations.length > 0
              ? `${urgentObligations.length} ${t("enhanced.urgentActiveCount", "urgent reporting or escalation windows can be coordinated from this page.")}`
              : t(
                "enhanced.coordinationOpportunitiesDesc",
                "Discover ways to align operations with multiple frameworks simultaneously through strategic control implementation."
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
