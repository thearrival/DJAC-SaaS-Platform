import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Shield,
  Bot,
  Globe,
  LoaderCircle,
  Rocket,
  CheckCircle2,
} from "lucide-react";

const EDITION_ICONS: Record<string, typeof Shield> = {
  Finance: Shield,
  Healthcare: Shield,
  Government: Building2,
  "Artificial Intelligence": Bot,
  Cloud: Globe,
  Telecommunications: Shield,
  Energy: Shield,
  Manufacturing: Building2,
  Retail: Shield,
  Education: Shield,
  "Critical Infrastructure": Shield,
  Defense: Shield,
  "Smart Cities": Globe,
};

const SECTOR_COLORS: Record<string, string> = {
  Finance:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  Healthcare:
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  Government:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  "Artificial Intelligence":
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  Cloud:
    "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300",
  Telecommunications:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
  Energy:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  Manufacturing:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300",
  Retail:
    "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300",
  Education:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300",
  "Critical Infrastructure":
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  Defense:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  "Smart Cities":
    "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
};

export default function GlobalIndustryEditions() {
  usePageTitle("Industry Editions");

  const editionsQ = trpc.compliance.globalIndustryEditions.useQuery();
  const frameworksQ = trpc.compliance.globalFrameworks.useQuery();
  const agentsQ = trpc.compliance.globalAiAgents.useQuery();
  const [selectedEdition, setSelectedEdition] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const editions = editionsQ.data ?? [];
  const frameworks = frameworksQ.data ?? [];
  const agents = agentsQ.data ?? [];

  const selected = editions.find(e => e.code === selectedEdition);

  const isLoading =
    editionsQ.isLoading || frameworksQ.isLoading || agentsQ.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Industry Editions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configuration-driven compliance editions that activate the right
            frameworks, AI agents, and controls for each sector.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <Rocket className="h-4 w-4 mr-2" />
              All Editions
            </TabsTrigger>
            <TabsTrigger value="detail" disabled={!selected}>
              <Building2 className="h-4 w-4 mr-2" />
              {selected ? selected.name : "Edition Detail"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {editions.map(ed => {
                const Icon = EDITION_ICONS[ed.sector] ?? Shield;
                const sectorColor =
                  SECTOR_COLORS[ed.sector] ?? "bg-gray-100 text-gray-700";
                return (
                  <Card
                    key={ed.code}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      selectedEdition === ed.code ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      setSelectedEdition(ed.code);
                      setActiveTab("detail");
                    }}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{ed.name}</h3>
                          <Badge className={sectorColor + " text-xs mt-1"}>
                            {ed.sector}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ed.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {ed.defaultFrameworkCodes.length} frameworks
                        </span>
                        <span className="flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          {ed.defaultAgentCodes.length} agents
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="detail" className="mt-4">
            {selected && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selected.name}
                      <Badge className={SECTOR_COLORS[selected.sector] ?? ""}>
                        {selected.sector}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selected.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <Shield className="h-4 w-4 text-emerald-500" />
                          Active Frameworks (
                          {selected.defaultFrameworkCodes.length})
                        </h4>
                        <ScrollArea className="h-[300px] pr-2">
                          <div className="space-y-2">
                            {selected.defaultFrameworkCodes.map(code => {
                              const fw = frameworks.find(f => f.code === code);
                              return (
                                <div
                                  key={code}
                                  className="flex items-center gap-2 p-2 rounded-md bg-accent/30"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  <div>
                                    <div className="text-sm font-medium">
                                      {fw?.name ?? code}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {fw?.authority ?? ""}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                          <Bot className="h-4 w-4 text-rose-500" />
                          Active AI Agents ({selected.defaultAgentCodes.length})
                        </h4>
                        <ScrollArea className="h-[300px] pr-2">
                          <div className="space-y-2">
                            {selected.defaultAgentCodes.map(code => {
                              const ag = agents.find(a => a.code === code);
                              return (
                                <div
                                  key={code}
                                  className="flex items-center gap-2 p-2 rounded-md bg-accent/30"
                                >
                                  <Bot className="h-4 w-4 text-rose-500 shrink-0" />
                                  <div>
                                    <div className="text-sm font-medium">
                                      {ag?.name ?? code}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {ag?.focus ?? ""}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
