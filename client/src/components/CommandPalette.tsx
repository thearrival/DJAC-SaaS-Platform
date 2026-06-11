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
    Key,
    LayoutDashboard,
    LayoutGrid,
    ListChecks,
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

const NAV: NavEntry[] = [
    // Overview
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", group: "Overview" },
    // Intelligence
    { icon: FileSearch, label: "Framework Analysis", path: "/analysis", group: "Intelligence", keywords: "pipl csl dsl pdpl nca" },
    { icon: ShieldCheck, label: "Client Workspace", path: "/client-workspace", group: "Intelligence", keywords: "market entry" },
    { icon: ClipboardList, label: "Vendor Assessment", path: "/vendor-assessment", group: "Intelligence" },
    { icon: Bot, label: "Pro Intelligence", path: "/pro-intelligence", group: "Intelligence", keywords: "ai llm" },
    { icon: ArrowLeftRight, label: "Transfer Checker", path: "/transfer-checker", group: "Intelligence", keywords: "data transfer cross-border" },
    // Compliance
    { icon: Scale, label: "Legal Library", path: "/laws", group: "Compliance", keywords: "law regulation" },
    { icon: ClipboardList, label: "Gap Tracker", path: "/gap-tracker", group: "Compliance" },
    { icon: Wrench, label: "Remediation Planner", path: "/remediation-planner", group: "Compliance" },
    { icon: ShieldOff, label: "Risk Register", path: "/risk-register", group: "Compliance" },
    { icon: BookOpen, label: "Policy Manager", path: "/policy-manager", group: "Compliance" },
    { icon: ShieldAlert, label: "Incident Register", path: "/incident-register", group: "Compliance" },
    { icon: ClipboardCheck, label: "Audit Schedule", path: "/audit-schedule", group: "Compliance" },
    { icon: Activity, label: "Continuous Compliance", path: "/continuous-compliance", group: "Compliance" },
    { icon: UserCheck, label: "DSR Tracker", path: "/dsr-tracker", group: "Compliance", keywords: "data subject request gdpr" },
    // Risk & Vendor
    { icon: ShieldAlert, label: "Vendor Risk Dashboard", path: "/vendor-risk", group: "Risk & Vendor" },
    { icon: PieChart, label: "Vendor Compliance Profiles", path: "/vendor-compliance", group: "Risk & Vendor" },
    // Analytics
    { icon: CalendarCheck2, label: "Compliance Tracker", path: "/compliance-tracker", group: "Analytics" },
    { icon: BarChart2, label: "Compliance Scorecard", path: "/compliance-scorecard", group: "Analytics" },
    { icon: CalendarDays, label: "Compliance Calendar", path: "/compliance-calendar", group: "Analytics" },
    { icon: LayoutGrid, label: "Compliance Heatmap", path: "/heatmap", group: "Analytics" },
    // Reports
    { icon: FileText, label: "Report Center", path: "/report-center", group: "Reports" },
    { icon: FileDown, label: "Compliance Reports", path: "/compliance-reports", group: "Reports" },
    { icon: Bot, label: "Assessment History", path: "/assessment-history", group: "Reports" },
    { icon: FolderCheck, label: "Evidence Locker", path: "/evidence-locker", group: "Reports" },
    { icon: Sparkles, label: "Enhanced Comparison", path: "/dashboard-enhanced", group: "Reports" },
    // Platform
    { icon: TrendingUp, label: "SaaS Metrics", path: "/saas-metrics", group: "Platform" },
    { icon: Activity, label: "Operations Status", path: "/operations", group: "Platform" },
    { icon: ListChecks, label: "Onboarding Wizard", path: "/onboarding-wizard", group: "Platform" },
    { icon: Bell, label: "Notifications", path: "/notifications", group: "Platform" },
    // Account
    { icon: CreditCard, label: "Billing & Subscription", path: "/billing", group: "Account" },
    { icon: Settings, label: "Account Settings", path: "/account-settings", group: "Account" },
    { icon: Users, label: "Team Members", path: "/team-members", group: "Account" },
    { icon: Settings, label: "Org Settings", path: "/org-settings", group: "Account" },
    { icon: Key, label: "API Keys", path: "/api-keys", group: "Account" },
    // Admin
    { icon: Crown, label: "Admin Control Center", path: "/admin-control-center", group: "Admin" },
    { icon: Building2, label: "Company Dashboard", path: "/company/dashboard", group: "Admin" },
    { icon: Shield, label: "Audit Log", path: "/audit-log", group: "Admin" },
    { icon: ExternalLink, label: "Super Admin Dashboard", path: "/superadmin/dashboard", group: "Admin" },
];

// Deduplicated group order
const GROUP_ORDER = [
    "Overview", "Intelligence", "Compliance", "Risk & Vendor",
    "Analytics", "Reports", "Platform", "Account", "Admin",
];

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

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return NAV;
        return NAV.filter(e =>
            e.label.toLowerCase().includes(q) ||
            e.group.toLowerCase().includes(q) ||
            (e.keywords ?? "").toLowerCase().includes(q)
        );
    }, [query]);

    const grouped = useMemo(() => {
        const map = new Map<string, NavEntry[]>();
        for (const entry of filtered) {
            if (!map.has(entry.group)) map.set(entry.group, []);
            map.get(entry.group)!.push(entry);
        }
        return GROUP_ORDER.filter(g => map.has(g)).map(g => ({ group: g, items: map.get(g)! }));
    }, [filtered]);

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
                                    <span className="ml-auto text-xs text-muted-foreground">{item.group}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </span>
                ))}
            </CommandList>
        </CommandDialog>
    );
}
