/**
 * RegulatoryReview — admin-only, read-only review queue for citations that are
 * not freshly verified (stale / pending review / unverified).
 *
 * Verification is a human sign-off (see scripts/provenance-signoff.ts). This
 * page never marks anything verified.
 */

import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";
import { DESIGNATED_REVIEWER } from "@shared/regulatory-provenance";

const STATUS_META: Record<
  string,
  {
    key: string;
    fallback: string;
    className: string;
    icon: typeof AlertTriangle;
  }
> = {
  stale: {
    key: "regReview.stale",
    fallback: "Stale — due for re-verification",
    className: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    icon: AlertTriangle,
  },
  pending_review: {
    key: "regReview.pending",
    fallback: "Pending review",
    className: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    icon: AlertTriangle,
  },
  unverified: {
    key: "regReview.unverified",
    fallback: "Unverified",
    className: "bg-red-500/15 text-red-500 border-red-500/30",
    icon: AlertTriangle,
  },
};

export default function RegulatoryReview() {
  usePageTitle("Regulatory Review");
  const { t } = useLocale();
  const q = trpc.admin.provenanceQueue.useQuery(undefined, { retry: false });
  const entries = q.data ?? [];

  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  if (q.isError) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h1 className="text-lg font-semibold">
          {t("regReview.adminsOnly", "Admins only")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "regReview.adminsOnlyBody",
            "The regulatory review queue is available to platform administrators."
          )}
        </p>
      </div>
    );
  }

  const subtitle = t(
    "regReview.subtitle",
    "Citations that are not freshly verified. Sign-off is a human action by the designated reviewer ({reviewer}) via pnpm provenance:signoff. This console is read-only and never fabricates verification."
  ).replace("{reviewer}", DESIGNATED_REVIEWER);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">
          {t("regReview.title", "Regulatory Review Queue")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["stale", "pending_review", "unverified"] as const).map(status => {
          const meta = STATUS_META[status];
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground">
                  {t(meta.key, meta.fallback)}
                </div>
                <div className="mt-1 text-2xl font-bold">
                  {counts[status] ?? 0}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t(
              "regReview.needingAttention",
              "{count} citations needing attention"
            ).replace("{count}", String(entries.length))}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("regReview.loading", "Loading…")}
            </p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-emerald-500">
              {t(
                "regReview.allVerified",
                "All citations are freshly verified."
              )}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pr-3">
                      {t("regReview.colCode", "Code")}
                    </th>
                    <th className="py-2 pr-3">
                      {t("regReview.colSource", "Source")}
                    </th>
                    <th className="py-2 pr-3">
                      {t("regReview.colAuthority", "Authority")}
                    </th>
                    <th className="py-2 pr-3">
                      {t("regReview.colStatus", "Status")}
                    </th>
                    <th className="py-2 pr-3">
                      {t("regReview.colEffective", "Effective")}
                    </th>
                    <th className="py-2 pr-3">
                      {t("regReview.colLastVerified", "Last verified")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(e => {
                    const meta =
                      STATUS_META[e.status] ?? STATUS_META.unverified;
                    return (
                      <tr key={e.code} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-mono text-xs">
                          {e.code}
                        </td>
                        <td className="py-2 pr-3">
                          {e.sourceUrl ? (
                            <a
                              href={e.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              {e.sourceTitle}
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span>{e.sourceTitle}</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {e.authority ?? "—"}
                        </td>
                        <td className="py-2 pr-3">
                          <Badge variant="outline" className={meta.className}>
                            {t(meta.key, meta.fallback)}
                          </Badge>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {e.effectiveDate ?? "—"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {e.lastVerified ?? "—"}
                          {e.verifiedBy ? ` · ${e.verifiedBy}` : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
