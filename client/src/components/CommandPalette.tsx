/**
 * CommandPalette — Global ⌘K / Ctrl+K quick-launch palette.
 *
 * Accessible from anywhere inside DashboardLayout. Lists every navigation
 * route grouped by section plus quick-action shortcuts. Uses the shadcn
 * CommandDialog (cmdk) primitive so it is fully keyboard-navigable and
 * screen-reader friendly.
 *
 * Usage:
 *   <CommandPalette open={open} onOpenChange={setOpen} />
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useLocale } from "@/contexts/useLocale";
import { restartTour } from "@/components/TourGuide";
import {
  Activity,
  ArrowLeftRight,
  BarChart2,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CalendarCheck2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Crown,
  ExternalLink,
  FileDown,
  FileSearch,
  FileText,
  FolderCheck,
  Globe,
  Key,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Network,
  PieChart,
  Scale,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// ─── Route catalogue (mirrors DashboardLayout menuGroups) ────────────────────

interface NavEntry {
  icon: LucideIcon;
  label: string;
  path: string;
  group: string;
  keywords?: string;
}

function buildNav(t: (key: string, fallback: string) => string): NavEntry[] {
  const G = {
    overview: t("cmd.group.overview", "Overview"),
    global: t("cmd.group.global_intelligence", "Global Intelligence"),
    intelligence: t("cmd.group.intelligence", "Intelligence"),
    compliance: t("cmd.group.compliance", "Compliance"),
    risk: t("cmd.group.risk_vendor", "Risk & Vendor"),
    analytics: t("cmd.group.analytics", "Analytics"),
    reports: t("cmd.group.reports", "Reports"),
    platform: t("cmd.group.platform", "Platform"),
    account: t("cmd.group.account", "Account"),
    admin: t("cmd.group.admin", "Admin"),
  };
  return [
    {
      icon: LayoutDashboard,
      label: t("cmd.nav.dashboard", "Dashboard"),
      path: "/dashboard",
      group: G.overview,
    },
    {
      icon: Globe,
      label: t("cmd.nav.globalRegistry", "Global Registry"),
      path: "/global-registry",
      group: G.global,
      keywords: "regulatory frameworks standards jurisdictions regions",
    },
    {
      icon: Network,
      label: t("cmd.nav.knowledgeGraph", "Knowledge Graph"),
      path: "/knowledge-graph",
      group: G.global,
      keywords: "graph visualization connections nodes edges",
    },
    {
      icon: Building2,
      label: t("cmd.nav.industryEditions", "Industry Editions"),
      path: "/industry-editions",
      group: G.global,
      keywords: "finance healthcare government ai cloud telecom",
    },
    {
      icon: Bot,
      label: t("cmd.nav.aiAgents", "AI Agent Network"),
      path: "/ai-agents",
      group: G.global,
      keywords: "agents orchestration llm",
    },
    {
      icon: FileSearch,
      label: t("cmd.nav.frameworkAnalysis", "Framework Analysis"),
      path: "/analysis",
      group: G.intelligence,
      keywords: "pipl csl dsl pdpl nca",
    },
    {
      icon: ShieldCheck,
      label: t("cmd.nav.clientWorkspace", "Client Workspace"),
      path: "/client-workspace",
      group: G.intelligence,
      keywords: "market entry",
    },
    {
      icon: ClipboardList,
      label: t("cmd.nav.vendorAssessment", "Vendor Assessment"),
      path: "/vendor-assessment",
      group: G.intelligence,
    },
    {
      icon: Bot,
      label: t("cmd.nav.proIntelligence", "Pro Intelligence"),
      path: "/pro-intelligence",
      group: G.intelligence,
      keywords: "ai llm",
    },
    {
      icon: ArrowLeftRight,
      label: t("cmd.nav.transferChecker", "Transfer Checker"),
      path: "/transfer-checker",
      group: G.intelligence,
      keywords: "data transfer cross-border",
    },
    {
      icon: Scale,
      label: t("cmd.nav.legalLibrary", "Legal Library"),
      path: "/laws",
      group: G.compliance,
      keywords: "law regulation",
    },
    {
      icon: ClipboardList,
      label: t("cmd.nav.gapTracker", "Gap Tracker"),
      path: "/gap-tracker",
      group: G.compliance,
    },
    {
      icon: Wrench,
      label: t("cmd.nav.remediationPlanner", "Remediation Planner"),
      path: "/remediation-planner",
      group: G.compliance,
    },
    {
      icon: ShieldOff,
      label: t("cmd.nav.riskRegister", "Risk Register"),
      path: "/risk-register",
      group: G.compliance,
    },
    {
      icon: BookOpen,
      label: t("cmd.nav.policyManager", "Policy Manager"),
      path: "/policy-manager",
      group: G.compliance,
    },
    {
      icon: ShieldAlert,
      label: t("cmd.nav.incidentRegister", "Incident Register"),
      path: "/incident-register",
      group: G.compliance,
    },
    {
      icon: ClipboardCheck,
      label: t("cmd.nav.auditSchedule", "Audit Schedule"),
      path: "/audit-schedule",
      group: G.compliance,
    },
    {
      icon: Activity,
      label: t("cmd.nav.continuousCompliance", "Continuous Compliance"),
      path: "/continuous-compliance",
      group: G.compliance,
    },
    {
      icon: UserCheck,
      label: t("cmd.nav.dsrTracker", "DSR Tracker"),
      path: "/dsr-tracker",
      group: G.compliance,
      keywords: "data subject request gdpr",
    },
    {
      icon: ShieldAlert,
      label: t("cmd.nav.vendorRisk", "Vendor Risk Dashboard"),
      path: "/vendor-risk",
      group: G.risk,
    },
    {
      icon: PieChart,
      label: t("cmd.nav.vendorCompliance", "Vendor Compliance Profiles"),
      path: "/vendor-compliance",
      group: G.risk,
    },
    {
      icon: CalendarCheck2,
      label: t("cmd.nav.complianceTracker", "Compliance Tracker"),
      path: "/compliance-tracker",
      group: G.analytics,
    },
    {
      icon: BarChart2,
      label: t("cmd.nav.complianceScorecard", "Compliance Scorecard"),
      path: "/compliance-scorecard",
      group: G.analytics,
    },
    {
      icon: CalendarDays,
      label: t("cmd.nav.complianceCalendar", "Compliance Calendar"),
      path: "/compliance-calendar",
      group: G.analytics,
    },
    {
      icon: LayoutGrid,
      label: t("cmd.nav.complianceHeatmap", "Compliance Heatmap"),
      path: "/heatmap",
      group: G.analytics,
    },
    {
      icon: FileText,
      label: t("cmd.nav.reportCenter", "Report Center"),
      path: "/report-center",
      group: G.reports,
    },
    {
      icon: FileDown,
      label: t("cmd.nav.complianceReports", "Compliance Reports"),
      path: "/compliance-reports",
      group: G.reports,
    },
    {
      icon: Bot,
      label: t("cmd.nav.assessmentHistory", "Assessment History"),
      path: "/assessment-history",
      group: G.reports,
    },
    {
      icon: FolderCheck,
      label: t("cmd.nav.evidenceLocker", "Evidence Locker"),
      path: "/evidence-locker",
      group: G.reports,
    },
    {
      icon: Sparkles,
      label: t("cmd.nav.enhancedComparison", "Enhanced Comparison"),
      path: "/dashboard-enhanced",
      group: G.reports,
    },
    {
      icon: TrendingUp,
      label: t("cmd.nav.saasMetrics", "SaaS Metrics"),
      path: "/saas-metrics",
      group: G.platform,
    },
    {
      icon: Activity,
      label: t("cmd.nav.operationsStatus", "Operations Status"),
      path: "/operations",
      group: G.platform,
    },
    {
      icon: ListChecks,
      label: t("cmd.nav.onboardingWizard", "Onboarding Wizard"),
      path: "/onboarding-wizard",
      group: G.platform,
    },
    {
      icon: Bell,
      label: t("cmd.nav.notifications", "Notifications"),
      path: "/notifications",
      group: G.platform,
    },
    {
      icon: CreditCard,
      label: t("cmd.nav.billing", "Billing & Subscription"),
      path: "/billing",
      group: G.account,
    },
    {
      icon: Settings,
      label: t("cmd.nav.accountSettings", "Account Settings"),
      path: "/account-settings",
      group: G.account,
    },
    {
      icon: Users,
      label: t("cmd.nav.teamMembers", "Team Members"),
      path: "/team-members",
      group: G.account,
    },
    {
      icon: Settings,
      label: t("cmd.nav.orgSettings", "Org Settings"),
      path: "/org-settings",
      group: G.account,
    },
    {
      icon: Key,
      label: t("cmd.nav.apiKeys", "API Keys"),
      path: "/api-keys",
      group: G.account,
    },
    {
      icon: Crown,
      label: t("cmd.nav.adminControlCenter", "Admin Control Center"),
      path: "/admin-control-center",
      group: G.admin,
    },
    {
      icon: Building2,
      label: t("cmd.nav.companyDashboard", "Company Dashboard"),
      path: "/company/dashboard",
      group: G.admin,
    },
    {
      icon: Shield,
      label: t("cmd.nav.auditLog", "Audit Log"),
      path: "/audit-log",
      group: G.admin,
    },
    {
      icon: ExternalLink,
      label: t("cmd.nav.superAdmin", "Super Admin Dashboard"),
      path: "/superadmin/dashboard",
      group: G.admin,
    },
  ];
}

function getGroupOrder(t: (key: string, fallback: string) => string): string[] {
  return [
    t("cmd.group.overview", "Overview"),
    t("cmd.group.global_intelligence", "Global Intelligence"),
    t("cmd.group.intelligence", "Intelligence"),
    t("cmd.group.compliance", "Compliance"),
    t("cmd.group.risk_vendor", "Risk & Vendor"),
    t("cmd.group.analytics", "Analytics"),
    t("cmd.group.reports", "Reports"),
    t("cmd.group.platform", "Platform"),
    t("cmd.group.account", "Account"),
    t("cmd.group.admin", "Admin"),
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, navigate] = useLocation();
  const { t } = useLocale();
  const [query, setQuery] = useState("");

  // Reset query when palette closes
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const nav = useMemo(() => buildNav(t), [t]);
  const groupOrder = useMemo(() => getGroupOrder(t), [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nav;
    return nav.filter(
      e =>
        e.label.toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q) ||
        (e.keywords ?? "").toLowerCase().includes(q)
    );
  }, [query, nav]);

  const grouped = useMemo(() => {
    const map = new Map<string, NavEntry[]>();
    for (const entry of filtered) {
      if (!map.has(entry.group)) map.set(entry.group, []);
      map.get(entry.group)!.push(entry);
    }
    return groupOrder
      .filter(g => map.has(g))
      .map(g => ({
        group: g,
        items: map.get(g)!,
      }));
  }, [filtered, groupOrder]);

  function go(path: string) {
    onOpenChange(false);
    navigate(path);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("cmd.title", "Command Palette")}
      description={t("cmd.description", "Search pages and actions")}
      showCloseButton={false}
    >
      <CommandInput
        placeholder={t("cmd.placeholder", "Search pages, features…")}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{t("cmd.noResults", "No results found.")}</CommandEmpty>

        {grouped.map((section, idx) => (
          <span key={section.group}>
            {idx > 0 && <CommandSeparator />}
            <CommandGroup heading={section.group}>
              {section.items.map(item => (
                <CommandItem
                  key={item.path}
                  value={`${item.label} ${item.group} ${item.keywords ?? ""}`}
                  onSelect={() => go(item.path)}
                  className="gap-2.5 cursor-pointer"
                >
                  <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{item.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.group}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </span>
        ))}

        {(query.trim() === "" ||
          "restart product tour onboarding help guide".includes(
            query.trim().toLowerCase()
          )) && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t("cmd.groupHelp", "Help")}>
              <CommandItem
                value="Restart product tour onboarding help guide"
                onSelect={() => {
                  onOpenChange(false);
                  restartTour();
                }}
                className="gap-2.5 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{t("cmd.restartTour", "Restart product tour")}</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
