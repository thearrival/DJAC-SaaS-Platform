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
  Info,
  Calendar,
  Building2,
  Scale,
  Gavel,
  BookOpen,
  Trash2,
} from "lucide-react";

const CHANGE_TYPE_ICONS: Record<string, typeof Bell> = {
  amendment: FileText,
  new_regulation: Gavel,
  repeal: Trash2,
  guidance: BookOpen,
  enforcement: AlertTriangle,
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  amendment:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  new_regulation:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  repeal:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
  guidance:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  enforcement:
    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
};

const STATUS_COLORS: Record<string, string> = {
  in_effect:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  pending: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  superseded:
    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

export default function RegulatoryChangeFeed() {
  usePageTitle("Regulatory Change Detection");

  const listQ = trpc.regulatoryChanges.list.useQuery({ limit: 50 });
  const statsQ = trpc.regulatoryChanges.stats.useQuery();
  const jurisdictionsQ = trpc.regulatoryChanges.jurisdictions.useQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const result = listQ.data;
  const changes = result?.rows ?? [];
  const stats = statsQ.data;
  const jurisdictions = jurisdictionsQ.data ?? [];

  const filteredChanges = useMemo(() => {
    return changes.filter(c => {
      if (jurisdictionFilter !== "all" && c.jurisdiction !== jurisdictionFilter)
        return false;
      if (typeFilter !== "all" && c.changeType !== typeFilter) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.title.toLowerCase().includes(q) ||
          c.jurisdiction.toLowerCase().includes(q) ||
          c.frameworkCode.toLowerCase().includes(q) ||
          c.source.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [changes, jurisdictionFilter, typeFilter, statusFilter, searchQuery]);

  const totalByStatus =
    stats?.byStatus.reduce((acc, s) => acc + s.count, 0) ?? 0;
  const effectiveCount =
    stats?.byStatus.find(s => s.status === "in_effect")?.count ?? 0;
  const pendingCount =
    stats?.byStatus.find(s => s.status === "pending")?.count ?? 0;
  const jurisdictionCount = stats?.byJurisdiction.length ?? 0;

  const statCards = [
    { label: "Total Changes", value: totalByStatus, icon: Bell },
    {
      label: "Enforcement Actions",
      value:
        stats?.byChangeType.find(t => t.changeType === "enforcement")?.count ??
        0,
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      label: "New Regulations",
      value:
        stats?.byChangeType.find(t => t.changeType === "new_regulation")
          ?.count ?? 0,
      icon: Gavel,
      color: "text-blue-500",
    },
    {
      label: "In Effect",
      value: effectiveCount,
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: Clock,
      color: "text-blue-500",
    },
    {
      label: "Jurisdictions",
      value: jurisdictionCount,
      icon: Globe,
    },
  ];

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
          {statCards.map(card => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              color={card.color}
            />
          ))}
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
        <Select
          value={jurisdictionFilter}
          onValueChange={setJurisdictionFilter}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Jurisdictions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jurisdictions</SelectItem>
            {jurisdictions.map(j => (
              <SelectItem key={j} value={j}>
                {j}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="amendment">Amendment</SelectItem>
            <SelectItem value="new_regulation">New Regulation</SelectItem>
            <SelectItem value="repeal">Repeal</SelectItem>
            <SelectItem value="guidance">Guidance</SelectItem>
            <SelectItem value="enforcement">Enforcement</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="in_effect">In Effect</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="superseded">Superseded</SelectItem>
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
                        {(() => {
                          const Icon =
                            CHANGE_TYPE_ICONS[change.changeType] ?? Info;
                          return (
                            <Icon
                              className={`h-5 w-5 ${
                                change.changeType === "enforcement"
                                  ? "text-red-500"
                                  : change.changeType === "new_regulation"
                                    ? "text-blue-500"
                                    : change.changeType === "repeal"
                                      ? "text-red-500"
                                      : "text-amber-500"
                              }`}
                            />
                          );
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">
                            {change.title}
                          </span>
                          <Badge
                            className={
                              CHANGE_TYPE_COLORS[change.changeType] ?? ""
                            }
                          >
                            {change.changeType.replace("_", " ")}
                          </Badge>
                          <Badge className={STATUS_COLORS[change.status] ?? ""}>
                            {change.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {change.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {change.jurisdiction}
                          </span>
                          <span className="flex items-center gap-1">
                            <Scale className="h-3 w-3" />
                            {change.frameworkCode}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {change.source}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Effective:{" "}
                            {new Date(
                              change.effectiveDate
                            ).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Published:{" "}
                            {new Date(
                              change.publicationDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {change.impact}
                        </p>
                        {change.url && (
                          <a
                            href={change.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-2 inline-block"
                          >
                            <FileText className="h-3 w-3 inline mr-1" />
                            View official publication
                          </a>
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
