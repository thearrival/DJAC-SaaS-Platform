import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationCenter } from "@/components/NotificationCenter";
import { TourGuide } from "@/components/TourGuide";
import { CommandPalette } from "@/components/CommandPalette";
import { sounds } from "@/lib/sounds";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLocale } from "@/contexts/useLocale";
import { useIsMobile } from "@/hooks/useMobile";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useNotificationBadge } from "@/hooks/useNotificationBadge";
import { useRbac } from "@/hooks/useRbac";
import { Activity, ArrowLeftRight, BarChart2, Bell, BookOpen, Bot, Briefcase, Building2, CalendarCheck2, CalendarDays, ClipboardCheck, ClipboardList, CreditCard, Crown, FileDown, FileSearch, FileText, FolderCheck, Key, LayoutDashboard, LayoutGrid, ListChecks, LogIn, LogOut, MessageSquareText, PanelLeft, PieChart, Scale, Search, Server, Settings, Shield, ShieldAlert, ShieldCheck, ShieldOff, Sparkles, TrendingUp, UserCheck, UserPlus, Users, Wrench, type LucideIcon } from "lucide-react";
import { CSSProperties, Suspense, useEffect, useRef, useState } from "react";
import { useLocation, Redirect } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import TrialBanner from "./TrialBanner";

type MenuItem = {
  icon: LucideIcon;
  labelKey: string;
  labelFallback: string;
  path: string;
  aliases?: string[];
};

type MenuGroup = {
  groupKey: string;
  groupFallback: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  // ── Overview ─────────────────────────────────────────────────────────────
  {
    groupKey: "layout.groupCore",
    groupFallback: "Overview",
    items: [
      {
        icon: LayoutDashboard,
        labelKey: "layout.menuDashboard",
        labelFallback: "Dashboard",
        path: "/dashboard",
      },
    ],
  },
  // ── Intelligence ─────────────────────────────────────────────────────────
  {
    groupKey: "layout.groupIntelligence",
    groupFallback: "Intelligence",
    items: [
      {
        icon: FileSearch,
        labelKey: "layout.menuAnalysis",
        labelFallback: "Framework Analysis",
        path: "/analysis",
      },
      {
        icon: ShieldCheck,
        labelKey: "layout.menuClientWorkspace",
        labelFallback: "Client Workspace",
        path: "/client-workspace",
        aliases: ["/market-entry"],
      },
      {
        icon: ClipboardList,
        labelKey: "layout.menuVendorAssessment",
        labelFallback: "Vendor Assessment",
        path: "/vendor-assessment",
      },
      {
        icon: Bot,
        labelKey: "layout.menuProIntelligence",
        labelFallback: "Pro Intelligence",
        path: "/pro-intelligence",
      },
      {
        icon: ArrowLeftRight,
        labelKey: "layout.menuTransferChecker",
        labelFallback: "Transfer Checker",
        path: "/transfer-checker",
      },
      {
        icon: MessageSquareText,
        labelKey: "layout.menuComplianceChat",
        labelFallback: "AI Compliance Chat",
        path: "/compliance-chat",
      },
    ],
  },
  // ── Cyber Operations ─────────────────────────────────────────────────────
  {
    groupKey: "layout.groupCyberOps",
    groupFallback: "Cyber Operations",
    items: [
      {
        icon: Briefcase,
        labelKey: "layout.menuServiceRequests",
        labelFallback: "Service Requests",
        path: "/service-requests",
      },
      {
        icon: Server,
        labelKey: "layout.menuAssetInventory",
        labelFallback: "Asset Inventory",
        path: "/asset-inventory",
      },
      {
        icon: ShieldAlert,
        labelKey: "layout.menuThreatIntel",
        labelFallback: "Threat Intel Feed",
        path: "/threat-intel",
      },
      {
        icon: TrendingUp,
        labelKey: "layout.menuSecurityMaturity",
        labelFallback: "Security Maturity",
        path: "/security-maturity",
      },
    ],
  },
  // ── Compliance ────────────────────────────────────────────────────────────
  {
    groupKey: "layout.groupCompliance",
    groupFallback: "Compliance",
    items: [
      {
        icon: Scale,
        labelKey: "layout.menuLaws",
        labelFallback: "Legal Library",
        path: "/laws",
      },
      {
        icon: ClipboardList,
        labelKey: "layout.menuGapTracker",
        labelFallback: "Gap Tracker",
        path: "/gap-tracker",
      },
      {
        icon: Wrench,
        labelKey: "layout.menuRemediationPlanner",
        labelFallback: "Remediation Planner",
        path: "/remediation-planner",
      },
      {
        icon: ShieldOff,
        labelKey: "layout.menuRiskRegister",
        labelFallback: "Risk Register",
        path: "/risk-register",
      },
      {
        icon: BookOpen,
        labelKey: "layout.menuPolicyManager",
        labelFallback: "Policy Manager",
        path: "/policy-manager",
      },
      {
        icon: ShieldAlert,
        labelKey: "layout.menuIncidentRegister",
        labelFallback: "Incident Register",
        path: "/incident-register",
      },
      {
        icon: ClipboardCheck,
        labelKey: "layout.menuAuditSchedule",
        labelFallback: "Audit Schedule",
        path: "/audit-schedule",
      },
      {
        icon: Activity,
        labelKey: "layout.menuContinuousCompliance",
        labelFallback: "Continuous Compliance",
        path: "/continuous-compliance",
      },
      {
        icon: UserCheck,
        labelKey: "layout.menuDsrTracker",
        labelFallback: "DSR Tracker",
        path: "/dsr-tracker",
      },
    ],
  },
  // ── Risk & Vendor ─────────────────────────────────────────────────────────
  {
    groupKey: "layout.groupRiskVendor",
    groupFallback: "Risk & Vendor",
    items: [
      {
        icon: ShieldAlert,
        labelKey: "layout.menuVendorRisk",
        labelFallback: "Vendor Risk Dashboard",
        path: "/vendor-risk",
      },
      {
        icon: PieChart,
        labelKey: "layout.menuVendorCompliance",
        labelFallback: "Vendor Compliance",
        path: "/vendor-compliance",
      },
    ],
  },
  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    groupKey: "layout.groupAnalytics",
    groupFallback: "Analytics",
    items: [
      {
        icon: CalendarCheck2,
        labelKey: "layout.menuTracker",
        labelFallback: "Compliance Tracker",
        path: "/compliance-tracker",
      },
      {
        icon: BarChart2,
        labelKey: "layout.menuComplianceScorecard",
        labelFallback: "Compliance Scorecard",
        path: "/compliance-scorecard",
      },
      {
        icon: CalendarDays,
        labelKey: "layout.menuCalendar",
        labelFallback: "Compliance Calendar",
        path: "/compliance-calendar",
      },
      {
        icon: LayoutGrid,
        labelKey: "layout.menuHeatmap",
        labelFallback: "Compliance Heatmap",
        path: "/heatmap",
      },
    ],
  },
  // ── Reports ───────────────────────────────────────────────────────────────
  {
    groupKey: "layout.groupReports",
    groupFallback: "Reports",
    items: [
      {
        icon: FileText,
        labelKey: "layout.menuReportCenter",
        labelFallback: "Report Center",
        path: "/report-center",
      },
      {
        icon: FileDown,
        labelKey: "layout.menuComplianceReports",
        labelFallback: "Compliance Reports",
        path: "/compliance-reports",
      },
      {
        icon: Bot,
        labelKey: "layout.menuAssessmentHistory",
        labelFallback: "Assessment History",
        path: "/assessment-history",
      },
      {
        icon: FolderCheck,
        labelKey: "layout.menuEvidenceLocker",
        labelFallback: "Evidence Locker",
        path: "/evidence-locker",
      },
      {
        icon: Sparkles,
        labelKey: "layout.menuEnhanced",
        labelFallback: "Enhanced Comparison",
        path: "/dashboard-enhanced",
      },
    ],
  },
  // ── Platform ──────────────────────────────────────────────────────────────
  {
    groupKey: "layout.groupPlatform",
    groupFallback: "Platform",
    items: [
      {
        icon: TrendingUp,
        labelKey: "layout.menuSaasMetrics",
        labelFallback: "SaaS Metrics",
        path: "/saas-metrics",
      },
      {
        icon: Activity,
        labelKey: "layout.menuOperations",
        labelFallback: "Operations",
        path: "/operations",
      },
      {
        icon: ListChecks,
        labelKey: "layout.menuOnboarding",
        labelFallback: "Onboarding Wizard",
        path: "/onboarding-wizard",
      },
      {
        icon: Bell,
        labelKey: "layout.menuNotifications",
        labelFallback: "Notifications",
        path: "/notifications",
      },
    ],
  },
  // ── Account ───────────────────────────────────────────────────────────────
  {
    groupKey: "layout.groupAccount",
    groupFallback: "Account",
    items: [
      {
        icon: CreditCard,
        labelKey: "layout.menuBilling",
        labelFallback: "Billing & Plan",
        path: "/billing",
      },
      {
        icon: Users,
        labelKey: "layout.menuTeamMembers",
        labelFallback: "Team Members",
        path: "/team-members",
      },
      {
        icon: Building2,
        labelKey: "layout.menuOrgSettings",
        labelFallback: "Org Settings",
        path: "/org-settings",
      },
      {
        icon: Settings,
        labelKey: "layout.menuAccountSettings",
        labelFallback: "Account Settings",
        path: "/account-settings",
      },
      {
        icon: Key,
        labelKey: "layout.menuApiKeys",
        labelFallback: "API Keys",
        path: "/api-keys",
      },
    ],
  },
];

const adminMenuItems: MenuItem[] = [
  {
    icon: Shield,
    labelKey: "layout.menuAdminControlCenter",
    labelFallback: "Admin Control Center",
    path: "/admin-control-center",
  },
  {
    icon: Activity,
    labelKey: "layout.menuAuditLog",
    labelFallback: "Audit Log",
    path: "/audit-log",
  },
  {
    icon: Briefcase,
    labelKey: "layout.menuAdminServiceRequests",
    labelFallback: "Manage Service Requests",
    path: "/admin/service-requests",
  },
  {
    icon: ShieldAlert,
    labelKey: "layout.menuAdminThreatIntel",
    labelFallback: "Publish Threat Intel",
    path: "/admin/threat-intel",
  },
];

const companyMenuItems: MenuItem[] = [
  {
    icon: Building2,
    labelKey: "layout.menuCompanyDashboard",
    labelFallback: "Company Dashboard",
    path: "/company/dashboard",
  },
];

const superAdminMenuItems: MenuItem[] = [
  {
    icon: Crown,
    labelKey: "layout.menuSuperAdminDashboard",
    labelFallback: "Super Admin",
    path: "/superadmin/dashboard",
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { direction } = useLocale();
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading: oauthLoading, user } = useAuth();
  const { localUser, isLoading: localLoading } = useLocalAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  // Show skeleton only while we truly don't know the auth state yet:
  // – local auth still loading, OR
  // – OAuth still loading AND we don't already have a localUser (local session)
  if (localLoading || (oauthLoading && !localUser)) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user && !localUser) {
    return <Redirect to="/login" />;
  }

  return (
    <OnboardingGate>
      <SidebarProvider
        dir={direction}
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </SidebarProvider>
    </OnboardingGate>
  );
}

/**
 * Redirects users who have not completed onboarding to the onboarding wizard.
 * Super admins and platform admins are exempt.
 */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, isPlatformAdmin } = useRbac();
  const [, navigate] = useLocation();
  const currentPath = window.location.pathname;

  // Admin users skip onboarding enforcement
  if (isSuperAdmin || isPlatformAdmin) return <>{children}</>;

  const { data, isLoading, isError } = trpc.rbac.onboardingStatus.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
  });

  // While loading, render children optimistically to avoid flash
  if (isLoading) return <>{children}</>;
  // On error, allow access (don't block users from the platform)
  if (isError) return <>{children}</>;

  const isComplete = data?.complete ?? true;
  const isOnWizardPage = currentPath === "/onboarding-wizard";

  // If onboarding complete or already on wizard page, proceed normally
  if (isComplete || isOnWizardPage) return <>{children}</>;

  // Redirect to onboarding wizard if not complete
  useEffect(() => {
    navigate("/onboarding-wizard");
  }, [navigate]);

  return null;
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { t, direction, locale } = useLocale();
  const { user } = useAuth();
  const { localUser } = useLocalAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  // ⌘K / Ctrl+K — open command palette from anywhere
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name ?? localUser?.name ?? "-";
  const displayEmail = user?.email ?? localUser?.email ?? "-";
  const avatarLetter = (user?.name ?? localUser?.name)?.charAt(0).toUpperCase() ?? "?";
  const handleSignOut = (destination: string) => {
    setShowSignOutDialog(false);
    sounds.navigate();
    // Clear BOTH auth sessions (OAuth session cookie + local-auth JWT cookie)
    // then hard-reload so React-Query caches are wiped and there is no reauth race.
    Promise.allSettled([
      fetch("/api/trpc/auth.logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: null }),
        credentials: "include",
      }),
      fetch("/api/trpc/localAuth.logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: null }),
        credentials: "include",
      }),
    ]).finally(() => {
      window.location.href = destination;
    });
  };
  const { isCompanyAdmin, isPlatformAdmin, isSuperAdmin, isLegacyAdmin } = useRbac();
  const notifBadge = useNotificationBadge();
  const adminGroup: MenuGroup | null =
    isCompanyAdmin || isPlatformAdmin || isLegacyAdmin || isSuperAdmin
      ? {
        groupKey: "layout.groupAdmin",
        groupFallback: "Administration",
        items: [
          ...(isCompanyAdmin ? companyMenuItems : []),
          ...(isPlatformAdmin || isLegacyAdmin ? adminMenuItems : []),
          ...(isSuperAdmin ? superAdminMenuItems : []),
        ],
      }
      : null;
  const allGroups: MenuGroup[] = adminGroup ? [...menuGroups, adminGroup] : menuGroups;
  const flatMenuItems = allGroups.flatMap(g => g.items);
  const activeMenuItem = flatMenuItems.find(item =>
    location === item.path ||
    location.startsWith(item.path + "/") ||
    item.aliases?.some(a => location === a || location.startsWith(a + "/"))
  );
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const rect = sidebarRef.current?.getBoundingClientRect();
      if (!rect) return;
      const newWidth =
        direction === "rtl"
          ? rect.right - e.clientX
          : e.clientX - rect.left;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth, direction]);

  return (
    <>
      <TourGuide />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      {/* Skip-to-main: visible on keyboard focus for accessibility */}
      <a
        href="#main-content"
        className="djac-skip-link"
      >
        Skip to main content
      </a>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          side={direction === "rtl" ? "right" : "left"}
          className="border-r-0 rtl:border-l-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-sidebar-border/60 bg-gradient-to-r rtl:bg-gradient-to-l from-sidebar via-sidebar to-sidebar-accent/30">
            <div className="flex items-center gap-3 ps-2 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-8 w-16 shrink-0 group rounded-md">
                  <img
                    src={APP_LOGO}
                    className="h-full w-full rounded-md object-contain"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-4 w-4 text-foreground rtl:rotate-180" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={APP_LOGO}
                      className="h-8 w-auto max-w-[80px] rounded-md object-contain shrink-0"
                      alt="Logo"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold tracking-tight truncate leading-none text-sm">
                        {APP_TITLE}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1.5">
                        <span className="djac-pulse-dot-green inline-block h-1.5 w-1.5 rounded-full bg-[var(--djac-green)] shrink-0" />
                        {t("layout.platformLive", "Intelligence Platform")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground rtl:rotate-180" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 djac-scroll overflow-y-auto">
            {allGroups.map(group => (
              <SidebarGroup key={group.groupKey} className="py-1 px-2">
                <SidebarGroupLabel className="mb-0.5 px-2 text-[10px] font-bold uppercase tracking-widest opacity-50">
                  {t(group.groupKey, group.groupFallback)}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map(item => {
                    const isActive =
                      location === item.path ||
                      location.startsWith(item.path + "/") ||
                      (item.aliases?.some(a => location === a || location.startsWith(a + "/")) ?? false);
                    // Derive tour-id from path for the spotlight system
                    const tourId = `tour-menu-${item.path.replace(/^\//, "").replace(/\//g, "-")}`;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => { sounds.navigate(); setLocation(item.path); }}
                          tooltip={t(item.labelKey, item.labelFallback)}
                          className="h-9 transition-all font-normal"
                          data-tour-id={tourId}
                        >
                          <div className="relative shrink-0">
                            <item.icon
                              className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                            />
                            {item.path === "/notifications" && notifBadge > 0 && (
                              <span
                                className="absolute -top-1.5 -end-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground leading-none"
                                aria-label={`${notifBadge} unread notifications`}
                              >
                                {notifBadge > 9 ? "9+" : notifBadge}
                              </span>
                            )}
                          </div>
                          <span>{t(item.labelKey, item.labelFallback)}</span>
                          {item.path === "/notifications" && notifBadge > 0 && (
                            <span className="ms-auto shrink-0 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground leading-none group-data-[collapsible=icon]:hidden">
                              {notifBadge > 99 ? "99+" : notifBadge}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-start group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {avatarLetter}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-medium truncate leading-none">
                        {displayName}
                      </p>
                      {isSuperAdmin && (
                        <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          Super
                        </span>
                      )}
                      {!isSuperAdmin && (isPlatformAdmin || isLegacyAdmin) && (
                        <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-primary/15 text-primary">
                          Admin
                        </span>
                      )}
                      {isCompanyAdmin && !isPlatformAdmin && !isLegacyAdmin && !isSuperAdmin && (
                        <span className="shrink-0 rounded px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-400">
                          Co.
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {displayEmail}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => { sounds.open(); setShowSignOutDialog(true); }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="me-2 h-4 w-4" />
                  <span>{t("layout.signOut", "Sign out")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>

          {/* Sign-out options dialog */}
          <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
            <DialogContent className="max-w-sm" dir={direction}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LogOut className="h-5 w-5 text-destructive" />
                  {t("layout.signOutTitle", "Sign out of DJAC?")}
                </DialogTitle>
                <DialogDescription>
                  {t("layout.signOutDesc", "Choose what to do after signing out.")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => handleSignOut("/login")}
                  className="djac-option-btn flex items-center gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-accent transition-colors text-start w-full"
                >
                  <LogIn className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{t("layout.signInAgain", "Sign in again")}</p>
                    <p className="text-xs text-muted-foreground">{t("layout.signInAgainDesc", "Return to the sign-in page")}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleSignOut("/signup")}
                  className="djac-option-btn flex items-center gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-accent transition-colors text-start w-full"
                >
                  <UserPlus className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{t("layout.registerNew", "Register new account")}</p>
                    <p className="text-xs text-muted-foreground">{t("layout.registerNewDesc", "Create a new DJAC account")}</p>
                  </div>
                </button>
                <button
                  onClick={() => handleSignOut("/login")}
                  className="djac-option-btn flex items-center gap-3 rounded-lg border px-4 py-3 text-sm hover:bg-accent transition-colors text-start w-full"
                >
                  <Users className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="font-medium">{t("layout.switchAccount", "Switch account")}</p>
                    <p className="text-xs text-muted-foreground">{t("layout.switchAccountDesc", "Sign in as a different user")}</p>
                  </div>
                </button>
                <button
                  onClick={() => { sounds.close(); setShowSignOutDialog(false); }}
                  className="mt-1 rounded-lg border px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors w-full"
                >
                  {t("layout.cancel", "Cancel")}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </Sidebar>
        <div
          className={`absolute top-0 end-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div >

      <SidebarInset>
        {isMobile ? (
          <div className="djac-topbar djac-topbar-mobile sticky top-0 z-40 flex min-h-14 items-center justify-between gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background [&_svg]:rtl:rotate-180" />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium tracking-tight text-foreground">
                  {activeMenuItem
                    ? t(activeMenuItem.labelKey, activeMenuItem.labelFallback)
                    : APP_TITLE}
                </span>
              </div>
            </div>
            <div className="djac-topbar-controls flex items-center justify-end gap-2">
              <button
                onClick={() => setCmdOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open command palette"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <NotificationCenter />
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
          </div>
        ) : (
          <div className="djac-topbar flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-muted-foreground text-xs font-medium tracking-tight hidden sm:block truncate">
                {APP_TITLE}
              </span>
              {activeMenuItem && (
                <>
                  <span className="djac-topbar-sep hidden sm:block" />
                  <span className="text-foreground text-sm font-semibold tracking-tight truncate">
                    {t(activeMenuItem.labelKey, activeMenuItem.labelFallback)}
                  </span>
                </>
              )}
            </div>

            {/* Right: system status + controls */}
            <div className="flex items-center gap-3">
              {/* Current date — locale aware */}
              <span className="hidden lg:block text-xs text-muted-foreground font-medium tabular-nums">
                {new Intl.DateTimeFormat(
                  locale === "ar" ? "ar-SA" : locale === "zh" ? "zh-CN" : "en-US",
                  { weekday: "short", month: "short", day: "numeric" }
                ).format(new Date())}
              </span>
              <div className="djac-topbar-sep hidden lg:block" />
              {/* Live system status indicator */}
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="djac-pulse-dot-green inline-block h-2 w-2 rounded-full bg-[var(--djac-green)] shrink-0" />
                <span>{t("layout.systemLive", "System Live")}</span>
              </div>
              <div className="djac-topbar-sep" />
              {/* Command palette trigger */}
              <button
                onClick={() => setCmdOpen(true)}
                className="hidden md:flex items-center gap-2 rounded-md border border-border/60 bg-background/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent hover:border-border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Open command palette (Ctrl+K)"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search…</span>
                <span className="ms-1 flex items-center gap-0.5 opacity-60">
                  <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium">⌘</kbd>
                  <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium">K</kbd>
                </span>
              </button>
              <NotificationCenter />
              <ThemeToggle />
              <LocaleSwitcher />
            </div>
          </div>
        )}
        <main id="main-content" className="djac-main-surface flex-1 min-h-[calc(100vh-3.5rem)] bg-background p-4 sm:p-5 lg:p-6">
          <TrialBanner />
          <div className="djac-page-enter">
            {/* Inner Suspense catches lazy-page chunk loading WITHOUT unmounting
                the sidebar/layout. The top-level Suspense in App.tsx handles
                the very first app boot only. */}
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[40vh]">
                <div className="djac-page-spinner" aria-label="Loading page" role="status" />
              </div>
            }>
              {children}
            </Suspense>
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
