import { useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Search,
  Globe,
  LoaderCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  Info,
  Calendar,
  Building2,
  Scale,
} from "lucide-react";

const IMPACT_COLORS: Record<string, string> = {
  critical:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  medium:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
};

const STATUS_COLORS: Record<string, string> = {
  effective:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  proposed:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function RegulatoryChangeFeed() {
  usePageTitle("Regulatory Change Detection");

  const listQ = trpc.regulatoryChanges.list.useQuery({ limit: 50 });
  const statsQ = trpc.regulatoryChanges.stats.useQuery();
  const regionsQ = trpc.regulatoryChanges.regions.useQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [impactFilter, setImpactFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const changes = listQ.data ?? [];
  const stats = statsQ.data;
  const regions = regionsQ.data ?? [];

  const filteredChanges = useMemo(() => {
    return changes.filter(c => {
      if (regionFilter !== "all" && c.region !== regionFilter) return false;
      if (impactFilter !== "all" && c.impact !== impactFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.jurisdiction.toLowerCase().includes(q) ||
          c.framework.toLowerCase().includes(q) ||
          c.authority.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [changes, regionFilter, impactFilter, statusFilter, searchQuery]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            Regulatory Change Detection
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time intelligence on regulatory changes across global
            jurisdictions — detected, analyzed, and mapped to your compliance
            posture.
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <StatCard label="Total Changes" value={stats.total} icon={Bell} />
          <StatCard
            label="Critical"
            value={stats.critical}
            icon={AlertTriangle}
            color="text-red-500"
          />
          <StatCard
            label="High Impact"
            value={stats.high}
            icon={AlertCircle}
            color="text-orange-500"
          />
          <StatCard
            label="Effective"
            value={stats.effective}
            icon={CheckCircle2}
            color="text-emerald-500"
          />
          <StatCard
            label="Pending"
            value={stats.pending}
            icon={Clock}
            color="text-blue-500"
          />
          <StatCard label="Regions" value={stats.regions} icon={Globe} />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search changes by title, jurisdiction, framework..."
            className="pl-9"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {regions.map(r => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={impactFilter} onValueChange={setImpactFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Impact" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Impact</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="effective">Effective</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="proposed">Proposed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {listQ.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="h-[600px] rounded-lg border">
          <div className="p-4 space-y-3">
            {filteredChanges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No regulatory changes match your filters.
              </div>
            ) : (
              filteredChanges.map(change => (
                <Card
                  key={change.id}
                  className="hover:shadow-sm transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {change.impact === "critical" ? (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        ) : change.impact === "high" ? (
                          <AlertCircle className="h-5 w-5 text-orange-500" />
                        ) : (
                          <Info className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {change.title}
                          </span>
                          <Badge className={IMPACT_COLORS[change.impact] ?? ""}>
                            {change.impact}
                          </Badge>
                          <Badge className={STATUS_COLORS[change.status] ?? ""}>
                            {change.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {change.summary}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {change.jurisdiction}
                          </span>
                          <span className="flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            {change.framework}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {change.authority}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {change.effectiveDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Detected:{" "}
                            {new Date(change.detectedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {change.affectedArticles &&
                          change.affectedArticles.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              {change.affectedArticles.map(a => (
                                <Badge
                                  key={a}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {a}
                                </Badge>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof Bell;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`p-2 rounded-lg bg-primary/10 ${color ? color : "text-primary"}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
