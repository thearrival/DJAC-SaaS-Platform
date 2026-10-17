/**
 * CompanyProfile — lightweight first-run gate.
 *
 * Data-heavy pages stay gated until the organization supplies the company
 * details the workspace personalises around (name, industry, jurisdiction).
 * This is intentionally separate from the heavier onboarding wizard.
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Briefcase, Globe, ArrowRight } from "lucide-react";

const JURISDICTIONS = [
  { value: "Global", label: "Global" },
  { value: "Both", label: "Both — China & Saudi Arabia" },
  { value: "China", label: "China (CN)" },
  { value: "Saudi Arabia", label: "Saudi Arabia (SA)" },
  { value: "EU", label: "European Union (EU)" },
  { value: "US", label: "United States (US)" },
  { value: "Brazil", label: "Brazil (BR)" },
  { value: "United Kingdom", label: "United Kingdom (UK)" },
  { value: "Canada", label: "Canada (CA)" },
  { value: "Australia", label: "Australia (AU)" },
  { value: "Japan", label: "Japan (JP)" },
  { value: "South Korea", label: "South Korea (KR)" },
  { value: "Singapore", label: "Singapore (SG)" },
  { value: "India", label: "India (IN)" },
  { value: "South Africa", label: "South Africa (ZA)" },
  { value: "Mexico", label: "Mexico (MX)" },
  { value: "Thailand", label: "Thailand (TH)" },
  { value: "Indonesia", label: "Indonesia (ID)" },
  { value: "Malaysia", label: "Malaysia (MY)" },
  { value: "Philippines", label: "Philippines (PH)" },
  { value: "Vietnam", label: "Vietnam (VN)" },
  { value: "Nigeria", label: "Nigeria (NG)" },
  { value: "Kenya", label: "Kenya (KE)" },
  { value: "United Arab Emirates", label: "United Arab Emirates (AE)" },
  { value: "Qatar", label: "Qatar (QA)" },
  { value: "Kuwait", label: "Kuwait (KW)" },
  { value: "Bahrain", label: "Bahrain (BH)" },
  { value: "Oman", label: "Oman (OM)" },
  { value: "Jordan", label: "Jordan (JO)" },
  { value: "Egypt", label: "Egypt (EG)" },
  { value: "Other", label: "Other / Custom" },
] as const;

type Jurisdiction = (typeof JURISDICTIONS)[number]["value"];

export default function CompanyProfile() {
  usePageTitle("Company Profile");
  const { t } = useLocale();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const orgQuery = trpc.orgSettings.get.useQuery(undefined, {
    retry: false,
  });
  const save = trpc.orgSettings.saveCompanyProfile.useMutation({
    onSuccess: () => {
      toast.success(
        t("companyProfile.saved", "Company profile saved. Welcome aboard!")
      );
      void utils.orgSettings.get.invalidate();
      navigate("/dashboard");
    },
    onError: err => toast.error(err.message),
  });

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("Both");

  useEffect(() => {
    const org = orgQuery.data;
    if (!org) return;
    setName(org.name ?? "");
    setIndustry(org.industry ?? "");
    setJurisdiction((org.primaryJurisdiction ?? "Both") as Jurisdiction);
  }, [orgQuery.data]);

  const canSubmit =
    name.trim().length >= 2 && industry.trim().length >= 1 && !save.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    save.mutate({
      name: name.trim(),
      industry: industry.trim(),
      primaryJurisdiction: jurisdiction,
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 size={24} />
        </div>
        <h1 className="text-2xl font-bold">
          {t("companyProfile.title", "Complete your company profile")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "companyProfile.subtitle",
            "Tell us about your organization so DJAC can tailor the regulatory data shown across your workspace. This takes under a minute."
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="cp-name" className="flex items-center gap-1.5">
            <Building2 size={13} />
            {t("companyProfile.nameLabel", "Organization name")}
          </Label>
          <Input
            id="cp-name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t(
              "companyProfile.namePlaceholder",
              "e.g. Acme Compliance Ltd."
            )}
            maxLength={255}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cp-industry" className="flex items-center gap-1.5">
            <Briefcase size={13} />
            {t("companyProfile.industryLabel", "Industry / sector")}
          </Label>
          <Input
            id="cp-industry"
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            placeholder={t(
              "companyProfile.industryPlaceholder",
              "e.g. Financial services, Healthcare, Technology"
            )}
            maxLength={120}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Globe size={13} />
            {t("companyProfile.jurisdictionLabel", "Primary jurisdiction")}
          </Label>
          <Select
            value={jurisdiction}
            onValueChange={v => setJurisdiction(v as Jurisdiction)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JURISDICTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t(
              "companyProfile.jurisdictionNote",
              "Controls which compliance frameworks and corridors are highlighted for your organization."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={!canSubmit}>
            {save.isPending
              ? t("companyProfile.saving", "Saving…")
              : t("companyProfile.save", "Save & continue")}
            <ArrowRight size={14} className="ml-1.5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {t(
              "companyProfile.required",
              "All three fields are required to unlock platform data."
            )}
          </span>
        </div>
      </form>
    </div>
  );
}
