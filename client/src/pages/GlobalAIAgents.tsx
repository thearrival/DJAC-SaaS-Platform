import { useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Search,
  Globe,
  LoaderCircle,
  Shield,
  ShieldCheck,
  FileText,
  Bell,
  Eye,
  Users,
  Cloud,
  AlertTriangle,
  Building2,
  MessageSquareText,
  Sparkles,
  BookOpen,
} from "lucide-react";

const AGENT_ICONS: Record<string, typeof Bot> = {
  "global-reg-intel": Globe,
  "compliance-translation": BookOpen,
  "ai-governance": Sparkles,
  "security-architecture": Shield,
  "vendor-risk": Building2,
  "audit-readiness": ShieldCheck,
  "policy-generation": FileText,
  "evidence-collection": FileText,
  "executive-reporting": Eye,
  "continuous-monitoring": Bell,
  "reg-change-detection": Bell,
  "threat-intel": AlertTriangle,
  "third-party-risk": Users,
  "dpo-agent": ShieldCheck,
  "cloud-security": Cloud,
  "incident-response": AlertTriangle,
  "board-advisory": Eye,
  "compliance-copilot": MessageSquareText,
};

const AGENT_COLORS: Record<string, string> = {
  "global-reg-intel":
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  "compliance-translation":
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
  "ai-governance":
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  "security-architecture":
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  "vendor-risk":
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  "audit-readiness":
    "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300",
  "policy-generation":
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  "evidence-collection":
    "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300",
  "executive-reporting":
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300",
  "continuous-monitoring":
    "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
  "reg-change-detection":
    "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300",
  "threat-intel":
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  "third-party-risk":
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  "dpo-agent":
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
  "cloud-security":
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  "incident-response":
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  "board-advisory":
    "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300",
  "compliance-copilot":
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function GlobalAIAgents() {
  usePageTitle("AI Agent Network");

  const agentsQ = trpc.compliance.globalAiAgents.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");

  const agents = agentsQ.data ?? [];

  const regions = useMemo(() => {
    const r = new Set<string>();
    agents.forEach(a => a.regions.forEach(reg => r.add(reg)));
    return Array.from(r).sort();
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      if (regionFilter !== "all" && !a.regions.includes(regionFilter as any))
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.focus.toLowerCase().includes(q) ||
          a.regions.some(r => r.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [agents, regionFilter, searchQuery]);

  const isLoading = agentsQ.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            AI Agent Network
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            A coordinated multi-agent ecosystem powering intelligence across
            every compliance domain.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name, focus, or region..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
        >
          <option value="all">All Regions</option>
          {regions.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map(agent => {
            const Icon = AGENT_ICONS[agent.code] ?? Bot;
            const color =
              AGENT_COLORS[agent.code] ?? "bg-gray-100 text-gray-700";
            return (
              <Card
                key={agent.code}
                className="hover:shadow-sm transition-shadow"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{agent.name}</h3>
                      <Badge
                        variant="outline"
                        className="text-xs font-mono mt-0.5"
                      >
                        {agent.code}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{agent.focus}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {agent.regions.map(region => (
                      <Badge key={region} className={color + " text-xs"}>
                        {region}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-accent/30">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <MessageSquareText className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">Agent Orchestration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                All agents communicate through the existing orchestration layer
                using modular, event-driven workflows. Agent outputs are
                grounded in retrieved source evidence, and recommendations cite
                regulations, controls, and mappings. Human review remains
                available for high-risk actions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
