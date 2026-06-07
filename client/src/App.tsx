import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { FeatureGate } from "./components/FeatureGate";
import { LocaleProvider } from "./contexts/LocaleContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { resolveDefaultThemeForPath } from "@shared/themePolicy";

const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const ParticleField = lazy(() => import("./components/ParticleField").then((module) => ({ default: module.ParticleField })));
const CyberGrid = lazy(() => import("./components/CyberGrid").then((module) => ({ default: module.CyberGrid })));
const CookieConsentBanner = lazy(() =>
  import("./components/CookieConsentBanner").then((module) => ({ default: module.CookieConsentBanner }))
);

const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DevComponentShowcase = import.meta.env.DEV
  ? lazy(() => import("./pages/ComponentShowcase"))
  : null;
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardEnhanced = lazy(() => import("./pages/DashboardEnhanced"));
const FrameworkAnalysis = lazy(() => import("./pages/FrameworkAnalysis"));
const VendorAssessment = lazy(() => import("./pages/VendorAssessment"));
const ClientWorkspace = lazy(() => import("./pages/ClientWorkspace"));
const AdminControlCenter = lazy(() => import("./pages/AdminControlCenter"));
const OperationsStatus = lazy(() => import("./pages/OperationsStatus"));
const LawLibrary = lazy(() => import("./pages/LawLibrary"));
const ComplianceTracker = lazy(() => import("./pages/ComplianceTracker"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ReportCenter = lazy(() => import("./pages/ReportCenter"));
const Pricing = lazy(() => import("./pages/Pricing"));
const BillingAccount = lazy(() => import("./pages/BillingAccount"));
const ComplianceCalendar = lazy(() => import("./pages/ComplianceCalendar"));
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"));
const SaaSMetrics = lazy(() => import("./pages/SaaSMetrics"));
const ComplianceHeatmap = lazy(() => import("./pages/ComplianceHeatmap"));
const Notifications = lazy(() => import("./pages/Notifications"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const VendorRiskDashboard = lazy(() => import("./pages/VendorRiskDashboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ProIntelligenceDashboard = lazy(() => import("./pages/ProIntelligenceDashboard"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const TransferChecker = lazy(() => import("./pages/TransferChecker"));
const TeamMembers = lazy(() => import("./pages/TeamMembers"));
const OrgSettings = lazy(() => import("./pages/OrgSettings"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const ComplianceScorecard = lazy(() => import("./pages/ComplianceScorecard"));
const ApiKeys = lazy(() => import("./pages/ApiKeys"));
const GapTracker = lazy(() => import("./pages/GapTracker"));
const AssessmentHistory = lazy(() => import("./pages/AssessmentHistory"));
const VendorDetail = lazy(() => import("./pages/VendorDetail"));
const RemediationPlanner = lazy(() => import("./pages/RemediationPlanner"));
const RiskRegister = lazy(() => import("./pages/RiskRegister"));
const PolicyManager = lazy(() => import("./pages/PolicyManager"));
const IncidentRegister = lazy(() => import("./pages/IncidentRegister"));
const AuditSchedule = lazy(() => import("./pages/AuditSchedule"));
const VendorComplianceProfiles = lazy(() => import("./pages/VendorComplianceProfiles"));
const ComplianceReports = lazy(() => import("./pages/ComplianceReports"));
const ContinuousCompliance = lazy(() => import("./pages/ContinuousCompliance"));
const EvidenceLocker = lazy(() => import("./pages/EvidenceLocker"));
const DataSubjectRequests = lazy(() => import("./pages/DataSubjectRequests"));
const ComplianceChat = lazy(() => import("./pages/ComplianceChat"));
const DJACHero = lazy(() => import("./pages/DJACHero"));
const ServiceRequests = lazy(() => import("./pages/ServiceRequests"));
const AssetInventory = lazy(() => import("./pages/AssetInventory"));
const ThreatIntelFeed = lazy(() => import("./pages/ThreatIntelFeed"));
const SecurityMaturity = lazy(() => import("./pages/SecurityMaturity"));
const AdminServiceRequests = lazy(() => import("./pages/AdminServiceRequests"));
const AdminThreatIntel = lazy(() => import("./pages/AdminThreatIntel"));
const YallaAdminAccessBootstrap = lazy(() => import("./pages/yalla-admin/YallaAdminAccessBootstrap"));
const YallaAdminLogin = lazy(() => import("./pages/yalla-admin/YallaAdminLogin"));
const YallaAdminPortal = lazy(() => import("./pages/yalla-admin/YallaAdminPortal"));

// Root route: redirect already-authenticated users straight to /dashboard;
// non-authenticated users see the Signup/Login page.
function RootRoute() {
  const [, navigate] = useLocation();
  const meQuery = trpc.localAuth.me.useQuery(undefined, {
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (meQuery.data) {
      const r = new URLSearchParams(window.location.search).get("r");
      navigate((r && r.startsWith("/")) ? r : "/dashboard", { replace: true });
    }
  }, [meQuery.data, navigate]);
  if (meQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="djac-page-spinner" aria-label="Loading" role="status" />
      </div>
    );
  }
  return <Signup />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/404"}>
        <NotFound />
      </Route>
      {import.meta.env.DEV && DevComponentShowcase && (
        <Route path={"/component-showcase"}>
          <DevComponentShowcase />
        </Route>
      )}
      <Route path={"/privacy"}>
        <PrivacyPolicy />
      </Route>
      <Route path={"/terms"}>
        <TermsOfService />
      </Route>
      <Route path={"/signup"}>
        <Signup />
      </Route>
      <Route path={"/login"}>
        <Signup />
      </Route>
      <Route path={"/forgot-password"}>
        <ForgotPassword />
      </Route>
      <Route path={"/reset-password"}>
        <ResetPassword />
      </Route>
      <Route path={"/"}>
        <RootRoute />
      </Route>
      <Route path={"/pricing"}>
        <Pricing />
      </Route>
      <Route path={"/hero"}>
        <DJACHero />
      </Route>
      <Route path={"/invite-accept"}>
        <InviteAccept />
      </Route>
      {/* Yalla-Admin — isolated owner portal, outside DashboardLayout, no nav */}
      <Route path={"/yalla-hack-owners-console/enter"}>
        <YallaAdminAccessBootstrap />
      </Route>
      <Route path={"/yalla-hack-owners-console/login"}>
        <YallaAdminLogin />
      </Route>
      <Route path={"/yalla-hack-owners-console"}>
        <YallaAdminPortal />
      </Route>
      <Route path={"/yalla-admin/login"}>
        <NotFound />
      </Route>
      <Route path={"/yalla-admin"}>
        <NotFound />
      </Route>
      {/* All app routes share the DashboardLayout sidebar */}
      <Route>
        <DashboardLayout>
          <Switch>
            <Route path={"/dashboard"}>
              <Dashboard />
            </Route>
            <Route path={"/home"}>
              <Home />
            </Route>
            <Route path={"/dashboard-enhanced"}>
              <DashboardEnhanced />
            </Route>
            <Route path={"/analysis"}>
              <FrameworkAnalysis />
            </Route>
            <Route path={"/vendor-assessment"}>
              <VendorAssessment />
            </Route>
            <Route path={"/vendor-risk"}>
              <FeatureGate plan="professional" feature="Vendor Risk Dashboard">
                <VendorRiskDashboard />
              </FeatureGate>
            </Route>
            <Route path={"/transfer-checker"}>
              <TransferChecker />
            </Route>
            <Route path={"/market-entry"}>
              <ClientWorkspace />
            </Route>
            <Route path={"/client-workspace"}>
              <ClientWorkspace />
            </Route>
            <Route path={"/admin-control-center"}>
              <AdminControlCenter />
            </Route>
            <Route path={"/operations"}>
              <OperationsStatus />
            </Route>
            <Route path={"/laws"}>
              <LawLibrary />
            </Route>
            <Route path={"/compliance-tracker"}>
              <ComplianceTracker />
            </Route>
            <Route path={"/report-center"}>
              <ReportCenter />
            </Route>
            <Route path={"/billing"}>
              <BillingAccount />
            </Route>
            <Route path={"/compliance-calendar"}>
              <ComplianceCalendar />
            </Route>
            <Route path={"/onboarding-wizard"}>
              <OnboardingWizard />
            </Route>
            <Route path={"/saas-metrics"}>
              <FeatureGate plan="enterprise" feature="SaaS Metrics">
                <SaaSMetrics />
              </FeatureGate>
            </Route>
            <Route path={"/heatmap"}>
              <ComplianceHeatmap />
            </Route>
            <Route path={"/notifications"}>
              <Notifications />
            </Route>
            <Route path={"/company/dashboard"}>
              <CompanyDashboard />
            </Route>
            <Route path={"/superadmin/dashboard"}>
              <SuperAdminDashboard />
            </Route>
            <Route path={"/pro-intelligence"}>
              <ProIntelligenceDashboard />
            </Route>
            <Route path={"/account-settings"}>
              <AccountSettings />
            </Route>
            <Route path={"/team-members"}>
              <TeamMembers />
            </Route>
            <Route path={"/org-settings"}>
              <OrgSettings />
            </Route>
            <Route path={"/audit-log"}>
              <AuditLog />
            </Route>
            <Route path={"/compliance-scorecard"}>
              <ComplianceScorecard />
            </Route>
            <Route path={"/api-keys"}>
              <ApiKeys />
            </Route>
            <Route path={"/gap-tracker"}>
              <GapTracker />
            </Route>
            <Route path={"/assessment-history"}>
              <AssessmentHistory />
            </Route>
            <Route path={"/vendor/:id"}>
              <VendorDetail />
            </Route>
            <Route path={"/remediation-planner"}>
              <RemediationPlanner />
            </Route>
            <Route path={"/risk-register"}>
              <RiskRegister />
            </Route>
            <Route path={"/policy-manager"}>
              <PolicyManager />
            </Route>
            <Route path={"/incident-register"}>
              <IncidentRegister />
            </Route>
            <Route path={"/audit-schedule"}>
              <AuditSchedule />
            </Route>
            <Route path={"/vendor-compliance"}>
              <VendorComplianceProfiles />
            </Route>
            <Route path={"/compliance-reports"}>
              <ComplianceReports />
            </Route>
            <Route path={"/continuous-compliance"}>
              <ContinuousCompliance />
            </Route>
            <Route path={"/evidence-locker"}>
              <EvidenceLocker />
            </Route>
            <Route path={"/dsr-tracker"}>
              <DataSubjectRequests />
            </Route>
            <Route path={"/compliance-chat"}>
              <ComplianceChat />
            </Route>
            <Route path={"/service-requests"}>
              <ServiceRequests />
            </Route>
            <Route path={"/asset-inventory"}>
              <AssetInventory />
            </Route>
            <Route path={"/threat-intel"}>
              <ThreatIntelFeed />
            </Route>
            <Route path={"/security-maturity"}>
              <SecurityMaturity />
            </Route>
            <Route path={"/admin/service-requests"}>
              <AdminServiceRequests />
            </Route>
            <Route path={"/admin/threat-intel"}>
              <AdminThreatIntel />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function ThemedAppShell() {
  const [location] = useLocation();
  const defaultTheme = resolveDefaultThemeForPath(location);

  return (
    <ThemeProvider
      defaultTheme={defaultTheme}
      switchable
    >
      <TooltipProvider>
        <Toaster />
        <Suspense
          fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
              <div className="djac-page-spinner" aria-label="Loading" role="status" />
              <span className="text-xs text-muted-foreground tracking-wide select-none">Loading…</span>
            </div>
          }
        >
          {/* CookieConsentBanner is lazy — must live inside Suspense so React
              concurrent mode has a fallback while the chunk loads. Rendering it
              outside Suspense without a higher-level boundary causes the entire
              tree to silently defer (blank page) in React 18+ concurrent mode. */}
          <CookieConsentBanner />
          {/* Global background animation layer — renders behind every page */}
          <ParticleField />
          <CyberGrid />
          <Router />
        </Suspense>
      </TooltipProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <ThemedAppShell />
      </LocaleProvider>
    </ErrorBoundary>
  );
}

export default App;
