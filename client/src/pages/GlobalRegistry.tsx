import { useMemo, useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Shield,
  BookOpen,
  Flag,
  Building2,
  Layers,
  Landmark,
  FileText,
  MapPin,
  LoaderCircle,
  Network,
} from "lucide-react";

const REGION_COLORS: Record<string, string> = {
  "North America":
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  Europe:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
  "Middle East":
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  "Asia-Pacific":
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
  Africa:
    "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Latin America":
    "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  "Global Standards":
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300",
};

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  privacy: Shield,
  cybersecurity: Shield,
  "security controls": Layers,
  "incident response": Shield,
  "zero trust": Network,
  "ai governance": BookOpen,
  "financial privacy": Landmark,
  "financial controls": Landmark,
  disclosure: FileText,
  "supply chain": Building2,
  "cloud security": Globe,
  "public safety": Shield,
  "tax data": FileText,
  "payment security": Shield,
  assurance: Shield,
  governance: Building2,
  "financial services": Landmark,
  "product security": Shield,
  "platform governance": Globe,
  "information security": Shield,
  resilience: Shield,
  "risk management": Shield,
  "cloud regulation": Globe,
  "cloud assurance": Shield,
  hardening: Shield,
  "industrial security": Shield,
  cryptography: Shield,
  automotive: Shield,
  "automotive supply chain": Building2,
  "functional safety": Shield,
  "critical infrastructure": Shield,
  "software supply chain": Building2,
  sbom: FileText,
  "threat intelligence": Shield,
  defense: Shield,
  "application security": Shield,
  "control mapping": Layers,
  "risk quantification": Shield,
};

function getCategoryIcon(category: string) {
  const key = Object.keys(CATEGORY_ICONS).find(k =>
    category.toLowerCase().includes(k)
  );
  return key ? CATEGORY_ICONS[key] : Shield;
}

export default function GlobalRegistry() {
  usePageTitle("Global Compliance Registry");

  const summaryQ = trpc.compliance.globalRegistrySummary.useQuery();
  const frameworksQ = trpc.compliance.globalFrameworks.useQuery();
  const jurisdictionsQ = trpc.compliance.globalJurisdictions.useQuery();
  const categoriesQ = trpc.compliance.globalFrameworkCategories.useQuery();

  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("frameworks");

  const frameworks = frameworksQ.data ?? [];

  const filteredFrameworks = useMemo(() => {
    return frameworks.filter(fw => {
      if (regionFilter !== "all" && fw.region !== regionFilter) return false;
      if (
        jurisdictionFilter !== "all" &&
        fw.jurisdiction !== jurisdictionFilter
      )
        return false;
      if (categoryFilter !== "all" && fw.category !== categoryFilter)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          fw.code.toLowerCase().includes(q) ||
          fw.name.toLowerCase().includes(q) ||
          fw.description.toLowerCase().includes(q) ||
          fw.authority.toLowerCase().includes(q) ||
          fw.jurisdiction.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    frameworks,
    regionFilter,
    jurisdictionFilter,
    categoryFilter,
    searchQuery,
  ]);

  const summary = summaryQ.data;
  const regions = ["all", ...(summaryQ.data ? Object.keys(REGION_COLORS) : [])];
  const jurisdictions = jurisdictionsQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const isLoading =
    frameworksQ.isLoading || jurisdictionsQ.isLoading || categoriesQ.isLoading;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" />
            Global Compliance Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and search the complete catalog of regulatory frameworks,
            standards, and guidelines worldwide.
          </p>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <SummaryCard label="Regions" value={summary.regions} icon={Globe} />
          <SummaryCard
            label="Jurisdictions"
            value={summary.jurisdictions}
            icon={Flag}
          />
          <SummaryCard
            label="Frameworks"
            value={summary.frameworks}
            icon={Shield}
          />
          <SummaryCard
            label="Categories"
            value={summary.categories}
            icon={Layers}
          />
          <SummaryCard
            label="Authorities"
            value={summary.authorities}
            icon={Landmark}
          />
          <SummaryCard
            label="Industry Editions"
            value={summary.editions}
            icon={Building2}
          />
          <SummaryCard
            label="AI Agents"
            value={summary.agents}
            icon={BookOpen}
          />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="frameworks">
            <Shield className="h-4 w-4 mr-2" />
            Frameworks & Standards
          </TabsTrigger>
          <TabsTrigger value="by-region">
            <Globe className="h-4 w-4 mr-2" />
            By Region
          </TabsTrigger>
        </TabsList>

        <TabsContent value="frameworks" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search frameworks, authorities, jurisdictions..."
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
                {regions
                  .filter(r => r !== "all")
                  .map(r => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select
              value={jurisdictionFilter}
              onValueChange={setJurisdictionFilter}
            >
              <SelectTrigger className="w-[180px]">
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[600px] rounded-lg border">
              <div className="p-4 space-y-2">
                {filteredFrameworks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No frameworks match your filters.
                  </div>
                ) : (
                  filteredFrameworks.map(fw => {
                    const Icon = getCategoryIcon(fw.category);
                    const regionColor =
                      REGION_COLORS[fw.region] ?? "bg-gray-100 text-gray-700";
                    return (
                      <Card
                        key={fw.code}
                        className="hover:shadow-sm transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">
                                  {fw.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs font-mono"
                                >
                                  {fw.code}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {fw.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge className={regionColor + " text-xs"}>
                                  {fw.region}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  <Flag className="h-3 w-3 mr-1 inline" />
                                  {fw.jurisdiction}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {fw.category}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  <Landmark className="h-3 w-3 mr-0.5 inline" />
                                  {fw.authority}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="by-region" className="space-y-6 mt-4">
          {regions
            .filter(r => r !== "all")
            .map(region => {
              const regionFws = frameworks.filter(fw => fw.region === region);
              if (regionFws.length === 0) return null;
              return (
                <Card key={region}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5" />
                      {region}
                      <Badge variant="secondary" className="ml-2">
                        {regionFws.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {regionFws.map(fw => (
                        <div
                          key={fw.code}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/50 transition-colors"
                        >
                          <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">
                              {fw.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {fw.authority}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Shield;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
