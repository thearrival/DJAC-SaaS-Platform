/**
 * VendorDataFlow — maps each third-party vendor's declared regulatory
 * jurisdictions, data locations and processing activities so the workspace can
 * see where vendor data actually flows. Read-only; based on vendor profile data.
 */

import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe2, Database, AlertTriangle } from "lucide-react";
import type React from "react";

const RISK_CLASS: Record<string, string> = {
  critical: "bg-red-500/15 text-red-500 border-red-500/30",
  high: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  medium: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
};

function Chips({ items, max = 5 }: { items: string[]; max?: number }) {
  if (items.length === 0)
    return <span className="text-xs text-muted-foreground">—</span>;
  const shown = items.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(i => (
        <span
          key={i}
          className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px]"
        >
          {i}
        </span>
      ))}
      {items.length > max && (
        <span className="text-[10px] text-muted-foreground">
          +{items.length - max}
        </span>
      )}
    </div>
  );
}

function DistributionList({
  title,
  data,
  empty,
  color = "#00d2ff",
}: {
  title: string;
  data: { name: string; count: number }[];
  empty: string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map(d => d.count));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.length === 0 ? (
          <p className="text-xs text-muted-foreground">{empty}</p>
        ) : (
          data.slice(0, 8).map(d => (
            <div key={d.name} className="text-xs">
              <div className="mb-1 flex justify-between">
                <span className="truncate">{d.name}</span>
                <span className="text-muted-foreground">{d.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded bg-muted">
                <div
                  className="h-full rounded"
                  style={{
                    width: `${(d.count / max) * 100}%`,
                    background: color,
                  }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            accent ? "bg-red-500/15 text-red-500" : "bg-primary/10 text-primary"
          }`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VendorDataFlow() {
  usePageTitle("Vendor Data Flow");
  const { t } = useLocale();
  const q = trpc.vendor.dataFlow.useQuery(undefined, { retry: false });
  const data = q.data;

  if (q.isLoading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        {t("vendorFlow.loading", "Loading data map…")}
      </div>
    );
  }

  if (q.isError) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        {t("vendorFlow.loadError", "Unable to load vendor data flows.")}
      </div>
    );
  }

  if (!data || data.totalVendors === 0) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-center">
        <Database className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">
          {t("vendorFlow.emptyTitle", "No vendor data flows yet")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "vendorFlow.emptyBody",
            "Register vendors with their jurisdictions and data locations to build this map."
          )}
        </p>
        <Link
          href="/vendor-assessment"
          className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          {t("vendorFlow.goToVendors", "Go to Vendor Assessment")}
        </Link>
      </div>
    );
  }

  const highRisk = data.vendors.filter(
    v => v.riskTier === "critical" || v.riskTier === "high"
  ).length;
  const noData = t("vendorFlow.noData", "No data yet.");

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("vendorFlow.title", "Vendor Data Flow")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "vendorFlow.subtitle",
            "Where third-party data is processed, stored and regulated — derived from your registered vendor profiles."
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Building2 size={16} />}
          label={t("vendorFlow.vendors", "Vendors")}
          value={data.totalVendors}
        />
        <Kpi
          icon={<Globe2 size={16} />}
          label={t("vendorFlow.jurisdictions", "Jurisdictions")}
          value={data.jurisdictionCounts.length}
        />
        <Kpi
          icon={<Database size={16} />}
          label={t("vendorFlow.dataLocations", "Data locations")}
          value={data.locationCounts.length}
        />
        <Kpi
          icon={<AlertTriangle size={16} />}
          label={t("vendorFlow.highRisk", "High / critical risk")}
          value={highRisk}
          accent
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DistributionList
          title={t("vendorFlow.distJurisdictions", "Regulatory jurisdictions")}
          data={data.jurisdictionCounts}
          empty={noData}
        />
        <DistributionList
          title={t("vendorFlow.distLocations", "Data locations")}
          data={data.locationCounts}
          empty={noData}
          color="#10b981"
        />
        <DistributionList
          title={t("vendorFlow.distActivities", "Processing activities")}
          data={data.categoryCounts}
          empty={noData}
          color="#f59e0b"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t("vendorFlow.matrix", "Vendor flow matrix")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-4">
                    {t("vendorFlow.colVendor", "Vendor")}
                  </th>
                  <th className="py-2 pr-4">
                    {t("vendorFlow.colRisk", "Risk")}
                  </th>
                  <th className="py-2 pr-4">
                    {t("vendorFlow.colHosting", "Hosting")}
                  </th>
                  <th className="py-2 pr-4">
                    {t("vendorFlow.colJurisdictions", "Jurisdictions")}
                  </th>
                  <th className="py-2 pr-4">
                    {t("vendorFlow.colLocations", "Data locations")}
                  </th>
                  <th className="py-2 pr-4">
                    {t("vendorFlow.colActivities", "Activities")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.vendors.map(v => (
                  <tr key={v.id} className="border-b align-top last:border-0">
                    <td className="py-2 pr-4 font-medium">{v.name}</td>
                    <td className="py-2 pr-4">
                      {v.riskTier ? (
                        <Badge
                          variant="outline"
                          className={RISK_CLASS[v.riskTier] ?? ""}
                        >
                          {v.riskTier}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-xs text-muted-foreground">
                      {v.hosting ?? v.cloudProvider ?? "—"}
                    </td>
                    <td className="py-2 pr-4">
                      <Chips items={v.jurisdictions} />
                    </td>
                    <td className="py-2 pr-4">
                      <Chips items={v.locations} />
                    </td>
                    <td className="py-2 pr-4">
                      <Chips items={v.categories} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        {t(
          "vendorFlow.disclaimer",
          "Based on declared vendor profile fields. Verify against each vendor's actual processing before relying on this map for regulatory filings."
        )}
      </p>
    </div>
  );
}
