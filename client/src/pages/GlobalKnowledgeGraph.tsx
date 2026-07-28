import { useMemo, useState, useCallback, useRef } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Globe,
  Shield,
  Building2,
  Network,
  LoaderCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NODE_COLORS: Record<string, string> = {
  region: "fill-blue-500",
  framework: "fill-emerald-500",
  standard: "fill-purple-500",
  edition: "fill-amber-500",
  agent: "fill-rose-500",
};

const NODE_STROKES: Record<string, string> = {
  region: "stroke-blue-600",
  framework: "stroke-emerald-600",
  standard: "stroke-purple-600",
  edition: "stroke-amber-600",
  agent: "stroke-rose-600",
};

const EDGE_STYLES: Record<string, string> = {
  contains: "stroke-blue-300 dark:stroke-blue-700",
  activates: "stroke-amber-300 dark:stroke-amber-700",
  supports: "stroke-rose-300 dark:stroke-rose-700",
  maps_to: "stroke-purple-300 dark:stroke-purple-700",
};

export default function GlobalKnowledgeGraph() {
  usePageTitle("Global Compliance Knowledge Graph");

  const graphQ = trpc.compliance.globalKnowledgeGraph.useQuery();
  const summary = trpc.compliance.globalRegistrySummary.useQuery().data;

  const [activeView, setActiveView] = useState("graph");
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const graph = graphQ.data;

  const layout = useMemo(() => {
    if (!graph) return null;

    const nodes = graph.nodes.map(n => ({ ...n }));
    const edges = graph.edges.map(e => ({ ...e }));

    const regionNodes = nodes.filter(n => n.kind === "region");
    const frameworkNodes = nodes.filter(
      n => n.kind === "framework" || n.kind === "standard"
    );
    const editionNodes = nodes.filter(n => n.kind === "edition");
    const agentNodes = nodes.filter(n => n.kind === "agent");

    const positions: Record<string, { x: number; y: number }> = {};
    const centerX = 500;
    const centerY = 400;

    regionNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / regionNodes.length - Math.PI / 2;
      positions[n.id] = {
        x: centerX + 280 * Math.cos(angle),
        y: centerY + 200 * Math.sin(angle),
      };
    });

    frameworkNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / frameworkNodes.length - Math.PI / 2;
      positions[n.id] = {
        x: centerX + 160 * Math.cos(angle),
        y: centerY + 120 * Math.sin(angle),
      };
    });

    editionNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / editionNodes.length - Math.PI / 2;
      positions[n.id] = {
        x: centerX + 380 * Math.cos(angle),
        y: centerY + 280 * Math.sin(angle),
      };
    });

    agentNodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / agentNodes.length - Math.PI / 2;
      positions[n.id] = {
        x: centerX + 440 * Math.cos(angle),
        y: centerY + 320 * Math.sin(angle),
      };
    });

    return { nodes, edges, positions };
  }, [graph]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.2, Math.min(3, prev * delta)));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    },
    [offset]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [dragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Network className="h-7 w-7 text-primary" />
            Compliance Knowledge Graph
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualize the connections between regions, frameworks, industry
            editions, and AI agents.
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          <GraphStat label="Nodes" value={summary.graphNodes} />
          <GraphStat label="Edges" value={summary.graphEdges} />
          <GraphStat label="Frameworks" value={summary.frameworks} />
          <GraphStat label="Editions" value={summary.editions} />
          <GraphStat label="Agents" value={summary.agents} />
        </div>
      )}

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="graph">
            <Network className="h-4 w-4 mr-2" />
            Graph View
          </TabsTrigger>
          <TabsTrigger value="entities">
            <Shield className="h-4 w-4 mr-2" />
            Entity List
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />{" "}
                  Region
                  <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 ml-2" />{" "}
                  Framework
                  <span className="inline-block w-3 h-3 rounded-full bg-purple-500 ml-2" />{" "}
                  Standard
                  <span className="inline-block w-3 h-3 rounded-full bg-amber-500 ml-2" />{" "}
                  Edition
                  <span className="inline-block w-3 h-3 rounded-full bg-rose-500 ml-2" />{" "}
                  Agent
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setScale(s => Math.max(0.2, s * 0.8))}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setScale(s => Math.min(3, s * 1.25))}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={resetView}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div
                className="border rounded-lg overflow-hidden bg-background"
                style={{ height: 500, cursor: dragging ? "grabbing" : "grab" }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {graphQ.isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : layout ? (
                  <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    viewBox="0 0 1000 800"
                    style={{
                      transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
                    }}
                  >
                    {layout.edges.map((edge, i) => {
                      const source = layout.positions[edge.source];
                      const target = layout.positions[edge.target];
                      if (!source || !target) return null;
                      return (
                        <line
                          key={`edge-${i}`}
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          className={`${EDGE_STYLES[edge.relation] ?? "stroke-gray-300"} stroke-1 opacity-50`}
                        />
                      );
                    })}
                    {layout.nodes.map(n => {
                      const pos = layout.positions[n.id];
                      if (!pos) return null;
                      const color = NODE_COLORS[n.kind] ?? "fill-gray-400";
                      const stroke = NODE_STROKES[n.kind] ?? "stroke-gray-500";
                      const r =
                        n.kind === "region"
                          ? 18
                          : n.kind === "edition"
                            ? 14
                            : n.kind === "agent"
                              ? 12
                              : 10;
                      return (
                        <g key={n.id}>
                          <circle
                            cx={pos.x}
                            cy={pos.y}
                            r={r}
                            className={`${color} ${stroke} stroke-2`}
                            opacity={0.9}
                          />
                          <title>{n.label}</title>
                          <text
                            x={pos.x}
                            y={pos.y + r + 12}
                            textAnchor="middle"
                            className="fill-foreground text-[9px] font-medium"
                          >
                            {n.label.length > 25
                              ? n.label.slice(0, 24) + "…"
                              : n.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entities" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Regions (
                  {graph?.nodes.filter(n => n.kind === "region").length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {graph?.nodes
                    .filter(n => n.kind === "region")
                    .map(n => (
                      <div
                        key={n.id}
                        className="flex items-center gap-2 py-1.5 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {n.label}
                      </div>
                    ))}
                </ScrollArea>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Frameworks & Standards (
                  {graph?.nodes.filter(
                    n => n.kind === "framework" || n.kind === "standard"
                  ).length ?? 0}
                  )
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {graph?.nodes
                    .filter(
                      n => n.kind === "framework" || n.kind === "standard"
                    )
                    .map(n => (
                      <div
                        key={n.id}
                        className="flex items-center gap-2 py-1.5 text-sm"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${n.kind === "standard" ? "bg-purple-500" : "bg-emerald-500"}`}
                        />
                        <span className="truncate">{n.label}</span>
                      </div>
                    ))}
                </ScrollArea>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Industry Editions (
                  {graph?.nodes.filter(n => n.kind === "edition").length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {graph?.nodes
                    .filter(n => n.kind === "edition")
                    .map(n => (
                      <div
                        key={n.id}
                        className="flex items-center gap-2 py-1.5 text-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        {n.label}
                      </div>
                    ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GraphStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
