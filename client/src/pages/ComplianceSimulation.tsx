import { useState } from "react";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FlaskConical,
  Globe,
  LoaderCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Sparkles,
  Zap,
  ArrowUpDown,
  SplitSquareHorizontal,
  TrendingUp,
  Target,
} from "lucide-react";

const ReadinessColor = (score: number) => {
  if (score >= 70) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};

const ReadinessBar = ({ score }: { score: number }) => (
  <div className="w-full bg-muted rounded-full h-2">
    <div
      className={`h-2 rounded-full transition-all ${score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
      style={{ width: `${score}%` }}
    />
  </div>
);

export default function ComplianceSimulation() {
  const { t } = useLocale();
  usePageTitle(t("simulation.title", "Compliance Simulation"));

  const scenariosQ = trpc.complianceSimulation.scenarios.useQuery();
  const runSimQ = trpc.complianceSimulation.run.useMutation();
  const runCustomQ = trpc.complianceSimulation.runCustom.useMutation();
  const jurisdictionsQ = trpc.crossBorderFlow.jurisdictions.useQuery();
  const frameworksQ = trpc.compliance.globalFrameworks.useQuery();

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("preset");
  const [customName, setCustomName] = useState("");
  const [customJurs, setCustomJurs] = useState<string[]>([]);
  const [customFws, setCustomFws] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const [dtBaseline, setDtBaseline] = useState(55);
  const [dtRiskTolerance, setDtRiskTolerance] = useState(50);
  const [dtJurisdictions, setDtJurisdictions] = useState(2);
  const [dtFrameworks, setDtFrameworks] = useState(3);
  const [dtResult, setDtResult] = useState<any>(null);

  const scenarios = scenariosQ.data ?? [];
  const jurisdictions = jurisdictionsQ.data ?? [];
  const frameworks = frameworksQ.data ?? [];

  const handleRunScenario = async (scenarioId: string) => {
    setRunning(true);
    setSelectedScenario(scenarioId);
    try {
      const res = await runSimQ.mutateAsync({ scenarioId });
      setResult(res);
    } finally {
      setRunning(false);
    }
  };

  const handleRunCustom = async () => {
    if (!customName.trim() || customJurs.length === 0) return;
    setRunning(true);
    try {
      const res = await runCustomQ.mutateAsync({
        name: customName,
        jurisdictions: customJurs,
        frameworks: customFws,
      });
      setResult(res);
    } finally {
      setRunning(false);
    }
  };

  const handleDigitalTwin = () => {
    const readinessDelta = Math.round(
      (dtRiskTolerance - 50) * 0.4 + (dtBaseline - 55) * 0.3
    );
    const projectedReadiness = Math.min(
      100,
      Math.max(
        10,
        Math.round(
          dtBaseline + readinessDelta - dtJurisdictions * 3 - dtFrameworks * 2
        )
      )
    );
    setDtResult({
      baseline: dtBaseline,
      projected: projectedReadiness,
      riskTolerance: dtRiskTolerance,
      jurisdictions: dtJurisdictions,
      frameworks: dtFrameworks,
      gaps: Math.round((100 - projectedReadiness) * 0.3),
      criticalGaps: Math.round((100 - projectedReadiness) * 0.08),
      timeline: `${dtJurisdictions * 2 + dtFrameworks + 2}-${dtJurisdictions * 3 + dtFrameworks * 2 + 6} months`,
      cost: `$${Math.round(dtJurisdictions * 150 + dtFrameworks * 80 + (100 - projectedReadiness) * 5)}K`,
    });
  };

  const toggleJurisdiction = (j: string) => {
    setCustomJurs(prev =>
      prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]
    );
  };
  const toggleFramework = (f: string) => {
    setCustomFws(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-primary" />
            {t("simulation.title", "Compliance Simulation")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(
              "simulation.subtitle",
              "Model compliance scenarios across jurisdictions — simulate market entry, regulation changes, and cross-border operations before they happen."
            )}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="preset">
            {t("simulation.tab.preset", "Preset")}
          </TabsTrigger>
          <TabsTrigger value="custom">
            {t("simulation.tab.custom", "Custom")}
          </TabsTrigger>
          <TabsTrigger value="digitaltwin">
            {t("simulation.tab.digitalTwin", "Digital Twin")}
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-1 space-y-4">
            {activeTab === "preset" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("simulation.scenarios", "Scenarios")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-2">
                    <div className="space-y-2">
                      {scenarios.map(scenario => (
                        <Card
                          key={scenario.id}
                          className={`cursor-pointer hover:shadow-sm transition-shadow ${selectedScenario === scenario.id ? "ring-2 ring-primary" : ""}`}
                          onClick={() => {
                            setSelectedScenario(scenario.id);
                            handleRunScenario(scenario.id);
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="font-medium text-sm">
                              {scenario.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {scenario.description}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {scenario.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {scenario.targetJurisdictions.length}{" "}
                                jurisdictions
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {activeTab === "custom" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {t("simulation.customSimulation", "Custom Simulation")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder={t(
                      "simulation.namePlaceholder",
                      "Simulation name..."
                    )}
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                  />
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {t("simulation.jurisdictions", "Jurisdictions")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {jurisdictions.slice(0, 15).map(j => (
                        <Badge
                          key={j}
                          variant={
                            customJurs.includes(j) ? "default" : "outline"
                          }
                          className="cursor-pointer text-xs"
                          onClick={() => toggleJurisdiction(j)}
                        >
                          {j}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {t("simulation.frameworks", "Frameworks")}
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-[150px] overflow-y-auto">
                      {frameworks.slice(0, 30).map(fw => (
                        <Badge
                          key={fw.code}
                          variant={
                            customFws.includes(fw.code) ? "default" : "outline"
                          }
                          className="cursor-pointer text-xs"
                          onClick={() => toggleFramework(fw.code)}
                        >
                          {fw.code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleRunCustom}
                    disabled={
                      running || !customName.trim() || customJurs.length === 0
                    }
                  >
                    {running ? (
                      <LoaderCircle className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {t("simulation.run", "Run Simulation")}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "digitaltwin" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <SplitSquareHorizontal className="h-5 w-5" />
                    Digital Twin
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {t(
                          "simulation.baselineReadiness",
                          "Baseline Readiness"
                        )}
                      </span>
                      <span className="font-bold">{dtBaseline}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={dtBaseline}
                      onChange={e => {
                        setDtBaseline(Number(e.target.value));
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {t("simulation.riskTolerance", "Risk Tolerance")}
                      </span>
                      <span className="font-bold">{dtRiskTolerance}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={dtRiskTolerance}
                      onChange={e => {
                        setDtRiskTolerance(Number(e.target.value));
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>
                        {t("simulation.jurisdictions", "Jurisdictions")}
                      </span>
                      <span className="font-bold">{dtJurisdictions}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={dtJurisdictions}
                      onChange={e => {
                        setDtJurisdictions(Number(e.target.value));
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>{t("simulation.frameworks", "Frameworks")}</span>
                      <span className="font-bold">{dtFrameworks}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={dtFrameworks}
                      onChange={e => {
                        setDtFrameworks(Number(e.target.value));
                      }}
                      className="w-full"
                    />
                  </div>
                  <Button className="w-full" onClick={handleDigitalTwin}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {t("simulation.projectImpact", "Project Impact")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            {(running || activeTab === "preset" || activeTab === "custom") &&
              running && (
                <Card>
                  <CardContent className="p-8 flex items-center justify-center">
                    <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">
                      {t("simulation.running", "Running simulation...")}
                    </span>
                  </CardContent>
                </Card>
              )}

            {(activeTab === "preset" || activeTab === "custom") &&
              !running &&
              !result && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FlaskConical className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      {t(
                        "simulation.emptyTitle",
                        "Select a scenario or create a custom simulation"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground/60 mt-1">
                      {t(
                        "simulation.emptyDesc",
                        "Model compliance risks, gaps, and costs before entering new markets."
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}

            {result &&
              !running &&
              (activeTab === "preset" || activeTab === "custom") && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {(result.scenarioId?.startsWith("custom")
                          ? t("simulation.custom", "Custom")
                          : t("simulation.scenario", "Scenario")) +
                          " " +
                          t("simulation.results", "Results")}
                        <Badge variant="secondary">
                          {t(
                            "simulation.readinessLabel",
                            "Readiness: {score}%"
                          ).replace("{score}", String(result.overallReadiness))}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {t(
                              "simulation.overallReadiness",
                              "Overall Compliance Readiness"
                            )}
                          </p>
                          <ReadinessBar score={result.overallReadiness} />
                        </div>
                        <div className="text-center px-4">
                          <div
                            className={`text-2xl font-bold ${ReadinessColor(result.overallReadiness)}`}
                          >
                            {result.overallReadiness}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("simulation.readiness", "Readiness")}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-accent/30 text-center">
                          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                          <div className="text-lg font-bold">
                            {result.totalGaps}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("simulation.totalGaps", "Total Gaps")}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-accent/30 text-center">
                          <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                          <div className="text-lg font-bold">
                            {result.criticalGaps}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("simulation.criticalGaps", "Critical Gaps")}
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-accent/30 text-center">
                          <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                          <div className="text-lg font-bold">
                            {result.recommendedTimeline}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("simulation.timeline", "Timeline")}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-2">
                          {t(
                            "simulation.jurisdictionBreakdown",
                            "Jurisdiction Breakdown"
                          )}
                        </h4>
                        {result.byJurisdiction?.map((j: any) => (
                          <div
                            key={j.jurisdiction}
                            className="flex items-center gap-3 p-2 rounded-lg bg-accent/20 mb-2"
                          >
                            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">
                                {j.jurisdiction}
                              </div>
                              <ReadinessBar score={j.readiness} />
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-sm font-bold ${ReadinessColor(j.readiness)}`}
                              >
                                {j.readiness}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {t(
                                  "simulation.gapsCount",
                                  "{count} gaps"
                                ).replace("{count}", String(j.gaps))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="text-sm font-semibold">
                            {t(
                              "simulation.aiRecommendation",
                              "AI Recommendation"
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.aiRecommendation}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

            {activeTab === "digitaltwin" && (
              <div className="space-y-4">
                {!dtResult && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <SplitSquareHorizontal className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-muted-foreground">
                        {t(
                          "simulation.dt.emptyTitle",
                          "Adjust the sliders and project impact"
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground/60 mt-1">
                        {t(
                          "simulation.dt.emptyDesc",
                          "See how changes to jurisdictions, frameworks, and risk tolerance affect your compliance posture."
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {dtResult && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <SplitSquareHorizontal className="h-5 w-5" />
                          {t("simulation.dt.title", "Digital Twin Projection")}
                          <Badge
                            variant={
                              dtResult.projected >= 70
                                ? "default"
                                : dtResult.projected >= 45
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {dtResult.projected}%
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-1">
                              {t(
                                "simulation.dt.currentBaseline",
                                "Current Baseline"
                              )}
                            </p>
                            <div className="text-2xl font-bold text-blue-500">
                              {dtResult.baseline}%
                            </div>
                            <ReadinessBar score={dtResult.baseline} />
                          </div>
                          <div className="p-4 rounded-lg border">
                            <p className="text-xs text-muted-foreground mb-1">
                              {t(
                                "simulation.dt.projectedReadiness",
                                "Projected Readiness"
                              )}
                            </p>
                            <div
                              className={`text-2xl font-bold ${ReadinessColor(dtResult.projected)}`}
                            >
                              {dtResult.projected}%
                            </div>
                            <ReadinessBar score={dtResult.projected} />
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <ArrowUpDown className="h-4 w-4" />
                          <span>
                            {t("simulation.dt.change", "Change:")}{" "}
                            <strong
                              className={
                                dtResult.projected >= dtResult.baseline
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              }
                            >
                              {dtResult.projected >= dtResult.baseline
                                ? "+"
                                : ""}
                              {dtResult.projected - dtResult.baseline}%
                            </strong>
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          <div className="p-3 rounded-lg bg-accent/30 text-center">
                            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                            <div className="text-lg font-bold">
                              {dtResult.gaps}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t(
                                "simulation.dt.projectedGaps",
                                "Projected Gaps"
                              )}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-accent/30 text-center">
                            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-red-500" />
                            <div className="text-lg font-bold">
                              {dtResult.criticalGaps}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("simulation.criticalGaps", "Critical Gaps")}
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-accent/30 text-center">
                            <Target className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                            <div className="text-lg font-bold">
                              {dtResult.timeline}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t("simulation.timeline", "Timeline")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/20">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm">
                            {t(
                              "simulation.dt.estimatedCost",
                              "Estimated Compliance Cost:"
                            )}{" "}
                            <strong>{dtResult.cost}</strong>
                          </span>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold">
                              {t("simulation.dt.insight", "What-If Insight")}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {dtResult.projected >= dtResult.baseline
                                ? t(
                                    "simulation.dt.insightPositive",
                                    "With a risk tolerance of {riskTolerance}% across {jurisdictions} jurisdiction(s) and {frameworks} framework(s), your compliance posture improves by {delta}%. Prioritize {focus} market engagement."
                                  )
                                    .replace(
                                      "{riskTolerance}",
                                      String(dtResult.riskTolerance)
                                    )
                                    .replace(
                                      "{jurisdictions}",
                                      String(dtResult.jurisdictions)
                                    )
                                    .replace(
                                      "{frameworks}",
                                      String(dtResult.frameworks)
                                    )
                                    .replace(
                                      "{delta}",
                                      String(
                                        dtResult.projected - dtResult.baseline
                                      )
                                    )
                                    .replace(
                                      "{focus}",
                                      dtResult.jurisdictions <= 2
                                        ? t(
                                            "simulation.dt.focusFocused",
                                            "focused"
                                          )
                                        : t("simulation.dt.focusBroad", "broad")
                                    )
                                : t(
                                    "simulation.dt.insightNegative",
                                    "Operating across {jurisdictions} jurisdiction(s) with {frameworks} framework(s) at {riskTolerance}% risk tolerance may reduce readiness by {delta}%. Consider phased market entry or reduced scope."
                                  )
                                    .replace(
                                      "{jurisdictions}",
                                      String(dtResult.jurisdictions)
                                    )
                                    .replace(
                                      "{frameworks}",
                                      String(dtResult.frameworks)
                                    )
                                    .replace(
                                      "{riskTolerance}",
                                      String(dtResult.riskTolerance)
                                    )
                                    .replace(
                                      "{delta}",
                                      String(
                                        dtResult.baseline - dtResult.projected
                                      )
                                    )}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
