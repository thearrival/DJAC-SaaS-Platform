/**
 * MultiEntity — parent/child organization management.
 *
 * A root organization can create child entities (which inherit its plan and
 * limits) and see consolidated vendor/member counts across them.
 */

import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Users, Boxes } from "lucide-react";

function Kpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
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

export default function MultiEntity() {
  usePageTitle("Organizations & Entities");
  const { t } = useLocale();
  const utils = trpc.useUtils();
  const q = trpc.orgEntities.list.useQuery(undefined, { retry: false });
  const [name, setName] = useState("");

  const create = trpc.orgEntities.createChild.useMutation({
    onSuccess: created => {
      toast.success(
        t("entities.created", "{name} created.").replace("{name}", created.name)
      );
      setName("");
      void utils.orgEntities.list.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const data = q.data;
  const entities = data?.entities ?? [];
  const totals = data?.totals ?? { vendors: 0, members: 0 };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Building2 className="h-6 w-6 text-primary" />
          {t("entities.title", "Organizations & Entities")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "entities.subtitle",
            "Manage child organizations. Entities inherit your plan and limits, and roll up into the totals below."
          )}
        </p>
      </div>

      {data?.parent && (
        <Card>
          <CardContent className="flex items-center gap-2 p-4 text-sm">
            <Badge variant="outline">
              {t("entities.childEntity", "Child entity")}
            </Badge>
            <span className="text-muted-foreground">
              {t("entities.partOf", "Part of")}{" "}
              <span className="font-medium text-foreground">
                {data.parent.name}
              </span>
            </span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          icon={<Boxes size={16} />}
          label={t("entities.entities", "Entities")}
          value={entities.length}
        />
        <Kpi
          icon={<Building2 size={16} />}
          label={t("entities.vendorsIncl", "Vendors (incl. this org)")}
          value={totals.vendors}
        />
        <Kpi
          icon={<Users size={16} />}
          label={t("entities.membersIncl", "Members (incl. this org)")}
          value={totals.members}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t("entities.createTitle", "Create a child entity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={e => {
              e.preventDefault();
              if (name.trim().length < 2) return;
              create.mutate({ name: name.trim() });
            }}
          >
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t(
                "entities.namePlaceholder",
                "Entity name (e.g. Acme Gulf FZE)"
              )}
              className="max-w-sm"
              maxLength={255}
            />
            <Button
              type="submit"
              disabled={name.trim().length < 2 || create.isPending}
            >
              <Plus size={14} className="mr-1.5" />
              {create.isPending
                ? t("entities.creating", "Creating…")
                : t("entities.create", "Create entity")}
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            {t(
              "entities.createNote",
              "Requires organization admin and MFA. One level of nesting is supported."
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            {t("entities.childEntities", "Child entities")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("entities.loading", "Loading…")}
            </p>
          ) : entities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("entities.empty", "No child entities yet.")}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-4">
                    {t("entities.colEntity", "Entity")}
                  </th>
                  <th className="py-2 pr-4">{t("entities.colPlan", "Plan")}</th>
                  <th className="py-2 pr-4">
                    {t("entities.colVendors", "Vendors")}
                  </th>
                  <th className="py-2 pr-4">
                    {t("entities.colMembers", "Members")}
                  </th>
                  <th className="py-2 pr-4">
                    {t("entities.colCreated", "Created")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entities.map(e => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{e.name}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline">{e.plan}</Badge>
                    </td>
                    <td className="py-2 pr-4">{e.vendors}</td>
                    <td className="py-2 pr-4">{e.members}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {String(e.createdAt).slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
