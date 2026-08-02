import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Sparkles,
  Zap,
  Clock,
  Target,
  ShieldCheck,
  FileText,
  Building2,
  AlertTriangle,
} from "lucide-react";

const CATEGORY_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  assessment: ShieldCheck,
  deadline: Clock,
  report: FileText,
  vendor: Building2,
  risk: AlertTriangle,
};

const URGENCY_BADGE: Record<string, { label: string; color: string }> = {
  immediate: { label: "Now", color: "bg-red-500" },
  "this-week": { label: "This Week", color: "bg-amber-500" },
  "this-month": { label: "This Month", color: "bg-blue-500" },
};

interface RecommendationCardProps {
  frameworks: string[];
  objectives: string[];
  industry: string;
  country: string;
}

export function RecommendationCard({
  frameworks,
  objectives,
  industry,
  country,
}: RecommendationCardProps) {
  const { t } = useLocale();
  const [dismissed, setDismissed] = useState(false);

  const recsQuery = trpc.personalization.getRecommendations.useQuery(
    { frameworks, objectives, industry, country },
    {
      enabled: !dismissed && (frameworks.length > 0 || objectives.length > 0),
      staleTime: 300_000,
    }
  );

  if (dismissed) return null;
  if (!recsQuery.data || recsQuery.isLoading) return null;

  const { data } = recsQuery;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("recs.title", "Your Personalised Recommendations")}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            {t("recs.dismiss", "Dismiss")}
          </Button>
        </div>
        <CardDescription className="text-sm">{data.intro}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Recommended actions */}
        {data.actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
              {t("recs.recommendedActions", "Recommended Actions")}
            </p>
            {data.actions.slice(0, 3).map((action, i) => {
              const Icon = CATEGORY_ICON[action.category] || Target;
              const badge =
                URGENCY_BADGE[action.urgency] || URGENCY_BADGE["this-week"];
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <Icon size={16} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{action.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <Badge
                    className={`${badge.color} h-5 px-1.5 text-[10px] text-white shrink-0`}
                  >
                    {badge.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* Recommended frameworks */}
        {data.frameworks.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide mb-2">
              {t("recs.recommendedFrameworks", "Recommended Frameworks")}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {data.frameworks.map(fw => (
                <Badge key={fw.code} variant="outline" className="text-xs">
                  <Zap size={10} className="mr-1 text-amber-500" />
                  {fw.code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Timeline */}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock size={12} />
          {data.timeline}
        </p>
      </CardContent>
    </Card>
  );
}
