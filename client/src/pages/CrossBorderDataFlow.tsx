import { useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  ArrowLeftRight,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  MapPin,
  ArrowRight,
  DollarSign,
  LayoutGrid,
  GitBranch,
} from "lucide-react";

const RISK_COLORS: Record<string, string> = {
  critical:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  medium:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function CrossBorderDataFlow() {
  usePageTitle("Cross-Border Data Flow");

  const matrixQ = trpc.crossBorderFlow.matrix.useQuery();
  const jurisdictionsQ = trpc.crossBorderFlow.jurisdictions.useQuery();

  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [targetFilter, setTargetFilter] = useState<string>("all");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [viewMode, setViewMode] = useState("matrix");

  const isLoading = matrixQ.isLoading || jurisdictionsQ.isLoading;
  const isError = matrixQ.isError || jurisdictionsQ.isError;
  const matrix = matrixQ.data ?? [];
  const jurisdictions = jurisdictionsQ.data ?? [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="h-7 w-7 text-primary" />
              Cross-Border Data Flow
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <LoaderCircle className="h-6 w-6 animate-spin mr-2" />
          Loading cross-border data…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="h-7 w-7 text-primary" />
              Cross-Border Data Flow
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <XCircle className="h-8 w-8 mb-3 text-destructive" />
          <p>Failed to load cross-border data flow information.</p>
          <p className="text-xs mt-1">Please try again later.</p>
        </div>
      </div>
    );
  }

  const filteredMatrix = useMemo(() => {
    return matrix.filter(row => {
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (targetFilter !== "all" && row.target !== targetFilter) return false;
      if (riskFilter !== "all" && row.riskLevel !== riskFilter) return false;
      return true;
    });
  }, [matrix, sourceFilter, targetFilter, riskFilter]);

  const { data: routeDetail, isLoading: routeLoading } =
    trpc.crossBorderFlow.analyzeRoute.useQuery(
      { source: selectedSource, target: selectedTarget },
      { enabled: !!selectedSource && !!selectedTarget }
    );

  const riskMatrix = useMemo(() => {
    const jurs = jurisdictions;
    const map: Record<string, Record<string, string>> = {};
    for (const s of jurs) {
      map[s] = {};
      for (const t of jurs) {
        if (s === t) {
          map[s][t] = "same";
          continue;
        }
        const row = matrix.find(r => r.source === s && r.target === t);
        map[s][t] = row?.riskLevel ?? "unknown";
      }
    }
    return { jurs, map };
  }, [matrix, jurisdictions]);

  const jurs10 = riskMatrix.jurs.slice(0, 10);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="h-7 w-7 text-primary" />
            Cross-Border Data Flow
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analyze data transfer requirements, restrictions, and risk levels
            between jurisdictions worldwide.
          </p>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList>
          <TabsTrigger value="matrix">
            <LayoutGrid className="h-4 w-4 mr-1" />
            Matrix
          </TabsTrigger>
          <TabsTrigger value="heatmap">
            <Globe className="h-4 w-4 mr-1" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="analyzer">
            <GitBranch className="h-4 w-4 mr-1" />
            Route Analyzer
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {viewMode === "matrix" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={sourceFilter}
                      onValueChange={setSourceFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {jurisdictions.map(j => (
                          <SelectItem key={j} value={j}>
                            {j}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={targetFilter}
                      onValueChange={setTargetFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Targets</SelectItem>
                        {jurisdictions.map(j => (
                          <SelectItem key={j} value={j}>
                            {j}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={riskFilter} onValueChange={setRiskFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Risk Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risks</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-emerald-500" /> Low
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-amber-400" /> Medium
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-orange-500" /> High
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-500" /> Critical
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Transfer Routes ({filteredMatrix.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      {filteredMatrix.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No routes match your filters.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredMatrix.map((row, i) => (
                            <div
                              key={`${row.source}-${row.target}-${i}`}
                              className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors ${selectedSource === row.source && selectedTarget === row.target ? "bg-accent" : ""}`}
                              onClick={() => {
                                setSelectedSource(row.source);
                                setSelectedTarget(row.target);
                              }}
                            >
                              <div className="flex items-center gap-2 text-sm min-w-0">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{row.source}</span>
                                <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                                <span className="truncate">{row.target}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge
                                  className={RISK_COLORS[row.riskLevel] ?? ""}
                                >
                                  {row.riskLevel}
                                </Badge>
                                <span className="text-xs text-muted-foreground hidden md:inline">
                                  {row.transferMechanism}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {viewMode === "heatmap" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Risk Heatmap — Source vs Target
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="p-1 text-left text-muted-foreground font-medium">
                          Source \ Target
                        </th>
                        {jurs10.map(j => (
                          <th
                            key={j}
                            className="p-1 text-center text-muted-foreground font-medium rotate-text whitespace-nowrap"
                          >
                            {j}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jurs10.map(s => (
                        <tr key={s}>
                          <td className="p-1 font-medium text-muted-foreground whitespace-nowrap">
                            {s}
                          </td>
                          {jurs10.map(t => {
                            const risk = riskMatrix.map[s]?.[t];
                            const isSame = s === t;
                            return (
                              <td key={t} className="p-1">
                                <div
                                  className={`w-6 h-6 rounded mx-auto ${isSame ? "bg-muted" : risk === "critical" ? "bg-red-500" : risk === "high" ? "bg-orange-500" : risk === "medium" ? "bg-amber-400" : risk === "low" ? "bg-emerald-500" : "bg-muted"}`}
                                  title={
                                    isSame
                                      ? "Same jurisdiction"
                                      : `${s} → ${t}: ${risk ?? "unknown"}`
                                  }
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === "analyzer" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Route Analyzer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Source
                      </label>
                      <Select
                        value={selectedSource}
                        onValueChange={setSelectedSource}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {jurisdictions.map(j => (
                            <SelectItem key={j} value={j}>
                              {j}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Target
                      </label>
                      <Select
                        value={selectedTarget}
                        onValueChange={setSelectedTarget}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select target..." />
                        </SelectTrigger>
                        <SelectContent>
                          {jurisdictions.map(j => (
                            <SelectItem key={j} value={j}>
                              {j}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {!selectedSource && !selectedTarget && !routeLoading && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Select source and target to analyze data transfer
                        requirements.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Route Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {routeLoading && (
                      <div className="flex items-center justify-center py-8">
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                      </div>
                    )}
                    {routeDetail && !routeLoading && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-accent/30">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">
                              {routeDetail.sourceJurisdiction}
                            </span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">
                              {routeDetail.targetJurisdiction}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            className={RISK_COLORS[routeDetail.riskLevel] ?? ""}
                          >
                            Risk: {routeDetail.riskLevel.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {routeDetail.transferMechanism}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />{" "}
                              Requirements
                            </p>
                            {routeDetail.requirements?.length > 0 ? (
                              <ul className="space-y-1">
                                {routeDetail.requirements.map((r, i) => (
                                  <li
                                    key={i}
                                    className="text-sm flex items-start gap-2"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                None specified
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <XCircle className="h-3 w-3 text-red-500" />{" "}
                              Restrictions
                            </p>
                            {routeDetail.restrictions?.length > 0 ? (
                              <ul className="space-y-1">
                                {routeDetail.restrictions.map((r, i) => (
                                  <li
                                    key={i}
                                    className="text-sm flex items-start gap-2"
                                  >
                                    <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                None
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/20">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm">
                            Estimated Compliance Cost:{" "}
                            <strong>
                              {routeDetail.estimatedComplianceCost}
                            </strong>
                          </span>
                        </div>
                      </div>
                    )}
                    {!selectedSource && !selectedTarget && !routeLoading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p>
                          Select source and target jurisdictions to begin
                          analysis.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
