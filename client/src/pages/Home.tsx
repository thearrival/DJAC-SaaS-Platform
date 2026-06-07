import { useAuth } from "@/_core/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { APP_LOGO, getLoginUrl } from "@/const";
import { ArrowRight, BarChart3, GitBranch, Zap, Sparkles, LogIn, BookOpen, TrendingUp } from "lucide-react";
import { vendorJurisdictionValues, type VendorJurisdiction } from "@shared/vendorProfile";
import { useEffect, useState } from "react";
import type React from "react";
import { toast as sonnerToast } from "sonner";
import { Link } from "wouter";

export default function Home() {
  usePageTitle("Home");
  const { user, isAuthenticated } = useAuth();
  const { localUser } = useLocalAuth();
  const effectiveUser = user ?? localUser;
  const effectivelyAuthenticated = isAuthenticated || !!localUser;
  const { t, locale } = useLocale();
  const year = new Date().getFullYear();

  const [accessForm, setAccessForm] = useState({
    fullName: user?.name ?? "",
    email: user?.email ?? "",
    organizationName: user?.organizationName ?? "",
    organizationType: user?.organizationType ?? "",
    useCase: "",
  });
  const [consultationForm, setConsultationForm] = useState({
    contactName: user?.name ?? "",
    contactEmail: user?.email ?? "",
    organizationName: user?.organizationName ?? "",
    topic: "",
    jurisdictions: [] as VendorJurisdiction[],
    summary: "",
    vendorName: "",
    techStackSummary: "",
  });

  const accessRequestMutation = trpc.portal.submitAccessRequest.useMutation({
    onSuccess: () => {
      sonnerToast.success(t("home.toast.accessRequested", "Access request submitted"));
      setAccessForm(prev => ({ ...prev, useCase: "" }));
    },
    onError: (err) => {
      sonnerToast.error(t("home.errors.accessRequestFailed", "Failed to submit access request.") + " " + err.message);
    },
  });

  const publicConsultationMutation = trpc.portal.submitConsultationRequest.useMutation({
    onSuccess: () => {
      sonnerToast.success(t("home.toast.consultationRequested", "Consultation request submitted"));
      setConsultationForm(prev => ({
        ...prev,
        topic: "",
        jurisdictions: [],
        summary: "",
        vendorName: "",
        techStackSummary: "",
      }));
    },
    onError: (err) => {
      sonnerToast.error(t("home.errors.consultationFailed", "Failed to submit consultation request.") + " " + err.message);
    },
  });

  const authenticatedConsultationMutation = trpc.portal.submitAuthenticatedConsultation.useMutation({
    onSuccess: () => {
      sonnerToast.success(t("home.toast.consultationRequested", "Consultation request submitted"));
      setConsultationForm(prev => ({
        ...prev,
        topic: "",
        jurisdictions: [],
        summary: "",
        vendorName: "",
        techStackSummary: "",
      }));
    },
    onError: (err) => {
      sonnerToast.error(t("home.errors.consultationFailed", "Failed to submit consultation request.") + " " + err.message);
    },
  });

  useEffect(() => {
    if (!effectiveUser) return;
    setAccessForm(prev => ({
      ...prev,
      fullName: prev.fullName || (effectiveUser.name ?? ""),
      email: prev.email || (effectiveUser.email ?? ""),
      organizationName: prev.organizationName || (user?.organizationName ?? ""),
      organizationType: prev.organizationType || (user?.organizationType ?? ""),
    }));
    setConsultationForm(prev => ({
      ...prev,
      contactName: prev.contactName || (effectiveUser.name ?? ""),
      contactEmail: prev.contactEmail || (effectiveUser.email ?? ""),
      organizationName: prev.organizationName || (user?.organizationName ?? ""),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, localUser]);

  const submitAccessRequest = async () => {
    if (
      !accessForm.fullName.trim() ||
      !accessForm.email.trim() ||
      !accessForm.organizationName.trim()
    ) {
      sonnerToast.error(t("home.errors.accessFormIncomplete", "Complete name, email, and organization fields."));
      return;
    }

    await accessRequestMutation.mutateAsync({
      fullName: accessForm.fullName,
      email: accessForm.email,
      organizationName: accessForm.organizationName,
      organizationType: accessForm.organizationType,
      useCase: accessForm.useCase,
      preferredLocale: (locale === "en" || locale === "ar" || locale === "zh" ? locale : "en"),
    });
  };

  const submitConsultationRequest = async () => {
    if (
      !consultationForm.contactName.trim() ||
      !consultationForm.contactEmail.trim() ||
      !consultationForm.organizationName.trim() ||
      !consultationForm.topic.trim() ||
      !consultationForm.summary.trim() ||
      consultationForm.jurisdictions.length === 0
    ) {
      sonnerToast.error(t("home.errors.consultationFormIncomplete", "Complete all consultation fields before submitting."));
      return;
    }

    const payload = {
      contactName: consultationForm.contactName,
      contactEmail: consultationForm.contactEmail,
      organizationName: consultationForm.organizationName,
      topic: consultationForm.topic,
      jurisdictions: consultationForm.jurisdictions,
      summary: consultationForm.summary,
      vendorName: consultationForm.vendorName || undefined,
      techStackSummary: consultationForm.techStackSummary || undefined,
    };

    if (effectivelyAuthenticated) {
      await authenticatedConsultationMutation.mutateAsync(payload);
      return;
    }

    await publicConsultationMutation.mutateAsync(payload);
  };

  const toggleJurisdiction = (jurisdiction: VendorJurisdiction) => {
    setConsultationForm(prev => ({
      ...prev,
      jurisdictions: prev.jurisdictions.includes(jurisdiction)
        ? prev.jurisdictions.filter(item => item !== jurisdiction)
        : [...prev.jurisdictions, jurisdiction],
    }));
  };

  const isAccessSubmitting = accessRequestMutation.isPending;
  const isConsultationSubmitting = publicConsultationMutation.isPending || authenticatedConsultationMutation.isPending;

  // Design tokens
  const C = {
    bg: "var(--djac-bg)", bgDeep: "var(--djac-bg-deep)", card: "var(--djac-card)",
    border: "var(--djac-border)", borderHi: "var(--djac-border-hi)",
    text: "var(--djac-text)", muted: "var(--djac-muted)",
    cyan: "#00F7FF", green: "#01FF7F", red: "#FF1744",
    orange: "#FF6B2B", yellow: "#FFD600", purple: "#9359EC",
  } as const;

  const inp: React.CSSProperties = {
    width: "100%", background: "var(--djac-input-bg)",
    border: "1px solid var(--djac-input-border)", borderRadius: 9,
    color: C.text, fontSize: 13, padding: "10px 13px",
    outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 10.5, fontWeight: 700, color: C.muted,
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6,
  };

  return (
    <div style={{ background: `linear-gradient(180deg, ${C.bgDeep} 0%, ${C.bg} 25%, ${C.bg} 75%, ${C.bgDeep} 100%)`, minHeight: "100vh", fontFamily: "Inter,system-ui,sans-serif", color: C.text }}>
      {/* dot-grid overlay */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(rgba(0,247,255,0.035) 1px, transparent 1px)", backgroundSize: "30px 30px", pointerEvents: "none", zIndex: 0 }} />
      {/* radial glow top */}
      <div style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 900, height: 500, background: "radial-gradient(ellipse, rgba(147,89,236,0.18) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 }} />
      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--djac-nav-bg)", backdropFilter: "blur(18px)", borderBottom: `1px solid ${C.border}`, fontFamily: "inherit" }}>
        <div className="djac-home-nav-inner" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 28px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <img src={APP_LOGO} alt={t("home.logoAlt", "DJAC logo")} style={{ height: 34, width: "auto", maxWidth: 84, objectFit: "contain" }} />
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.025em" }}>DJAC <span style={{ color: C.cyan }}>Tool</span></span>
          </div>
          <div className="djac-home-nav-actions" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <LocaleSwitcher />
            {effectivelyAuthenticated ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: C.muted, fontSize: 12 }}>{t("home.welcome", "Welcome")}, {effectiveUser?.name}</span>
                <Link href="/dashboard">
                  <button style={{ background: C.purple, border: "none", borderRadius: 9, color: "#fff", padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    {t("home.goToDashboard", "Dashboard")} <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link href="/signup">
                  <button style={{ background: C.purple, border: "none", borderRadius: 9, color: "#fff", padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    {t("home.signIn", "Sign In")} <LogIn style={{ width: 13, height: 13 }} />
                  </button>
                </Link>
                <a href={getLoginUrl()} style={{ color: C.muted, fontSize: 11, textDecoration: "underline", whiteSpace: "nowrap" }}>
                  {t("home.sso", "SSO")}
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "96px 28px 72px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${C.cyan}18`, border: `1px solid ${C.cyan}45`, borderRadius: 99, padding: "7px 18px", fontSize: 12, fontWeight: 700, color: C.cyan, marginBottom: 30, letterSpacing: "0.04em" }}>
          <Sparkles style={{ width: 12, height: 12 }} />
          {t("home.badge", "China × Saudi Arabia · Compliance Intelligence")}
        </div>
        <h1 style={{ fontSize: "clamp(38px,6.5vw,72px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05, margin: "0 0 22px" }}>
          {t("home.heroLine1", "Every Compliance Rule.")}{" "}
          <span style={{ background: `linear-gradient(130deg, ${C.cyan}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {t("home.heroLine2", "One Dashboard.")}
          </span>
        </h1>
        <p style={{ color: C.muted, fontSize: 18, lineHeight: 1.70, maxWidth: 620, margin: "0 auto 44px" }}>
          {t("home.heroSubtitle", "From China's CSL and PIPL to Saudi Arabia's PDPL and NCA — we map every regulation, flag every conflict, and track every deadline in real time, so your cross-border operations stay on the right side of the law.")}
        </p>
        <div className="djac-home-hero-actions" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
          {effectivelyAuthenticated ? (
            <>
              <Link href="/dashboard">
                <button style={{ background: `linear-gradient(130deg, ${C.cyan}DD, ${C.purple})`, border: "none", borderRadius: 12, color: "#fff", padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {t("home.viewDashboard", "Open Dashboard")} <ArrowRight style={{ width: 15, height: 15 }} />
                </button>
              </Link>
              <Link href="/analysis">
                <button style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                  {t("home.frameworkAnalysis", "Analyze Frameworks")}
                </button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup">
                <button style={{ background: `linear-gradient(130deg, ${C.cyan}CC, ${C.purple})`, border: "none", borderRadius: 12, color: "#fff", padding: "14px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                  {t("home.getStarted", "Get Started Free")} <ArrowRight style={{ width: 15, height: 15 }} />
                </button>
              </Link>
              <button onClick={() => document.getElementById("access-form")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 12, color: C.text, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                {t("home.requestAccess", "Request Access")}
              </button>
            </>
          )}
        </div>
        {/* Stats row */}
        <div className="djac-home-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, maxWidth: 700, margin: "0 auto" }}>
          {[
            { v: "5", l: t("home.statsFrameworksLabel", "Frameworks Covered") },
            { v: "2", l: t("home.statsJurisdictionsLabel", "Jurisdictions") },
            { v: "50+", l: t("home.statsControlsLabel", "Controls Mapped") },
            { v: "Real-time", l: t("home.statsRealtimeLabel", "Live Monitoring") },
          ].map((s) => (
            <div key={s.v} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 13, padding: "18px 10px" }}>
              <p style={{ color: C.cyan, fontSize: 24, fontWeight: 800, margin: 0 }}>{s.v}</p>
              <p style={{ color: C.muted, fontSize: 11, margin: "4px 0 0" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT WE DO */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "24px 28px 72px" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
            {t("home.featuresTitle", "What DJAC Does For You")}
          </h2>
          <p style={{ color: C.muted, fontSize: 14 }}>{t("home.platformNote", "Covering CSL · PIPL · DSL · PDPL · NCA · MLPS 2.0")}</p>
        </div>
        <div className="djac-home-feature-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {[
            { icon: <BarChart3 style={{ width: 24, height: 24 }} />, accent: C.cyan, title: t("home.featureComparativeTitle", "Side-by-Side Framework Comparison"), body: t("home.featureComparativeDesc", "Pick any two frameworks and instantly see what overlaps, what conflicts, and exactly what you need to do about it — no legal jargon.") },
            { icon: <GitBranch style={{ width: 24, height: 24 }} />, accent: C.purple, title: t("home.featureVisualTitle", "Conflict & Dependency Mapping"), body: t("home.featureVisualDesc", "Our relationship engine maps 10+ framework pairs to surface hidden legal conflicts before they become regulatory surprises or fines.") },
            { icon: <Zap style={{ width: 24, height: 24 }} />, accent: C.yellow, title: t("home.featureVendorTitle", "Market Entry Readiness Check"), body: t("home.featureVendorDesc", "AI-powered assessment of your tech stack and operations against every applicable framework obligation — know your gaps before you launch.") },
          ].map((f) => (
            <div key={f.title} style={{ background: `${f.accent}08`, border: `1px solid ${f.accent}30`, borderRadius: 18, padding: "28px 24px" }}>
              <div style={{ width: 50, height: 50, borderRadius: 13, background: `${f.accent}18`, border: `1px solid ${f.accent}45`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, color: f.accent }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 700, margin: "0 0 10px" }}>{f.title}</h3>
              <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.65, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ position: "relative", zIndex: 1, background: "var(--djac-section-alt)", padding: "72px 28px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 56px" }}>
            {t("home.howTitle", "Three Steps to Full Compliance Clarity")}
          </h2>
          <div className="djac-home-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 40 }}>
            {[
              { num: "01", color: C.cyan, icon: <LogIn style={{ width: 28, height: 28 }} />, title: t("home.step1Title", "Sign In Securely"), desc: t("home.step1Desc", "Secure enterprise login with role-based access. No shared passwords, no compliance shortcuts.") },
              { num: "02", color: C.purple, icon: <BookOpen style={{ width: 28, height: 28 }} />, title: t("home.step2Title", "Pick Your Frameworks"), desc: t("home.step2Desc", "Select the laws that apply to your operations — China, Saudi Arabia, or both — and pair them for instant side-by-side analysis.") },
              { num: "03", color: C.green, icon: <TrendingUp style={{ width: 28, height: 28 }} />, title: t("home.step3Title", "Get Clear, Actionable Answers"), desc: t("home.step3Desc", "See conflicts, track obligations, assess tech-stack readiness, and ask our AI assistant — all in one place, in your language.") },
            ].map(s => (
              <div key={s.num} style={{ textAlign: "center" }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: `${s.color}18`, border: `1px solid ${s.color}50`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px", position: "relative", color: s.color }}>
                  {s.icon}
                  <span style={{ position: "absolute", top: -10, right: -10, background: s.color, color: "#000", borderRadius: 99, width: 24, height: 24, fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.num}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 12px" }}>{s.title}</h3>
                <p style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.68, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FRAMEWORKS COVERED */}
      <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "72px 28px" }}>
        <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", textAlign: "center", margin: "0 0 52px" }}>
          {t("home.supportedFrameworks", "Frameworks We Cover")}
        </h2>
        <div className="djac-home-framework-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* China */}
          <div style={{ background: "rgba(255,23,68,0.05)", border: "1px solid rgba(255,23,68,0.22)", borderRadius: 18, padding: "32px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
              <span style={{ fontSize: 28 }}>🇨🇳</span>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#FF6B6B", margin: 0 }}>{t("home.china", "China")}</h3>
            </div>
            {[
              { code: "PIPL", name: t("home.pipl", "Personal Information Protection Law"), year: "2021" },
              { code: "CSL", name: t("home.csl", "Cybersecurity Law (CSL 2026 Amendment)"), year: "2017 / 2026" },
              { code: "DSL", name: t("home.dsl", "Data Security Law"), year: "2021" },
              { code: "MLPS", name: t("home.frameworks.mlps", "Multi-Level Protection Scheme 2.0"), year: "2019" },
            ].map(fw => (
              <div key={fw.code} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <span style={{ background: "rgba(255,70,70,0.15)", border: "1px solid rgba(255,70,70,0.3)", borderRadius: 7, color: "#FF7070", fontSize: 11, fontWeight: 700, padding: "4px 10px", flexShrink: 0 }}>{fw.code}</span>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{fw.name}</p>
                  <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>{t("home.frameworks.effective", "Effective")} {fw.year}</p>
                </div>
              </div>
            ))}
          </div>
          {/* Saudi Arabia */}
          <div style={{ background: "rgba(1,255,127,0.04)", border: "1px solid rgba(1,255,127,0.18)", borderRadius: 18, padding: "32px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26 }}>
              <span style={{ fontSize: 28 }}>🇸🇦</span>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: C.green, margin: 0 }}>{t("home.saudi", "Saudi Arabia")}</h3>
            </div>
            {[
              { code: "PDPL", name: t("home.pdpl", "Personal Data Protection Law"), year: "2022" },
              { code: "NCA-ECC", name: t("home.nca", "Essential Cybersecurity Controls"), year: "2018" },
              { code: "NCA-CCC", name: t("home.frameworks.ncaCcc", "Cloud Cybersecurity Controls"), year: "2020" },
              { code: "NCA-CSCC", "name": t("home.frameworks.ncaCscc", "Cyber Supply Chain Risk Management"), year: "2022" },
            ].map(fw => (
              <div key={fw.code} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <span style={{ background: "rgba(1,255,127,0.12)", border: "1px solid rgba(1,255,127,0.28)", borderRadius: 7, color: C.green, fontSize: 11, fontWeight: 700, padding: "4px 10px", flexShrink: 0 }}>{fw.code}</span>
                <div>
                  <p style={{ fontSize: 13.5, fontWeight: 500, margin: 0 }}>{fw.name}</p>
                  <p style={{ color: C.muted, fontSize: 11, margin: "2px 0 0" }}>{t("home.frameworks.effective", "Effective")} {fw.year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTAKE FORMS */}
      <section id="access-form" style={{ position: "relative", zIndex: 1, background: "var(--djac-section-alt)", padding: "80px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              {t("home.intakeTitle", "Get Access or Book a Consultation")}
            </h2>
            <p style={{ color: C.muted, fontSize: 15, maxWidth: 520, margin: "0 auto" }}>
              {t("home.intakeSubtitle", "Submit your registration or ask for compliance guidance — we typically respond within 24 hours.")}
            </p>
          </div>

          <div className="djac-home-intake-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Access Request */}
            <div style={{ background: `${C.purple}0A`, border: `1px solid ${C.purple}30`, borderRadius: 18, padding: "32px 28px" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{t("home.accessCardTitle", "Platform Access Request")}</h3>
              <p style={{ color: C.muted, fontSize: 13, margin: "0 0 28px" }}>{t("home.accessCardSubtitle", "Request organization onboarding and platform activation.")}</p>
              <p style={{ color: C.muted, fontSize: 11.5, margin: "0 0 12px" }}>{t("home.requiredHint", "Required fields: Name, Email, and Organization.")}</p>
              <div className="djac-home-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {([
                  { label: t("home.fieldFullName", "Full Name"), key: "fullName", type: "text" },
                  { label: t("home.fieldEmail", "Work Email"), key: "email", type: "email" },
                  { label: t("home.fieldOrganization", "Organization"), key: "organizationName", type: "text" },
                  { label: t("home.fieldOrganizationType", "Org Type"), key: "organizationType", type: "text" },
                ] as { label: string; key: keyof typeof accessForm; type: string }[]).map(f => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    <input type={f.type} value={accessForm[f.key] ?? ""} onChange={e => setAccessForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={inp} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>{t("home.fieldUseCase", "What will you use it for?")}</label>
                <textarea rows={3} value={accessForm.useCase} onChange={e => setAccessForm(prev => ({ ...prev, useCase: e.target.value }))} style={{ ...inp, resize: "vertical" }} />
              </div>
              <button onClick={submitAccessRequest} disabled={isAccessSubmitting} style={{ background: isAccessSubmitting ? `${C.purple}55` : C.purple, border: "none", borderRadius: 10, color: "#fff", padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: isAccessSubmitting ? "not-allowed" : "pointer", opacity: isAccessSubmitting ? 0.8 : 1, width: "100%" }}>
                {isAccessSubmitting ? t("home.submitting", "Submitting...") : t("home.submitAccess", "Submit Access Request")}
              </button>
              {isAccessSubmitting && <p style={{ color: C.muted, fontSize: 11.5, margin: "8px 0 0", textAlign: "center" }}>{t("home.submitDisabledHint", "Please wait while we submit your request.")}</p>}
            </div>

            {/* Consultation */}
            <div style={{ background: `${C.cyan}06`, border: `1px solid ${C.cyan}22`, borderRadius: 18, padding: "32px 28px" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{t("home.consultationCardTitle", "Compliance Consultation")}</h3>
              <p style={{ color: C.muted, fontSize: 13, margin: "0 0 28px" }}>{t("home.consultationCardSubtitle", "Ask for expert guidance on China-Saudi cross-border operations.")}</p>
              <p style={{ color: C.muted, fontSize: 11.5, margin: "0 0 12px" }}>{t("home.requiredHint", "Required fields: Name, Email, and Organization.")}</p>
              <div className="djac-home-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {([
                  { label: t("home.fieldContactName", "Your Name"), key: "contactName", type: "text" },
                  { label: t("home.fieldContactEmail", "Work Email"), key: "contactEmail", type: "email" },
                  { label: t("home.fieldConsultationOrg", "Organization"), key: "organizationName", type: "text" },
                  { label: t("home.fieldTopic", "Topic / Focus"), key: "topic", type: "text" },
                  { label: t("home.fieldVendor", "Vendor (Optional)"), key: "vendorName", type: "text" },
                  { label: t("home.fieldTechStack", "Tech Stack (Optional)"), key: "techStackSummary", type: "text" },
                ] as { label: string; key: keyof typeof consultationForm; type: string }[]).map(f => (
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    <input type={f.type} value={(consultationForm[f.key] ?? "") as string} onChange={e => setConsultationForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={inp} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>{t("home.fieldJurisdictions", "Which jurisdictions apply?")}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                  {vendorJurisdictionValues.map(j => {
                    const active = consultationForm.jurisdictions.includes(j);
                    return (
                      <button key={j} type="button" onClick={() => toggleJurisdiction(j)} style={{ background: active ? `${C.cyan}25` : "var(--djac-card-hi)", border: `1px solid ${active ? C.cyan + "70" : "var(--djac-border)"}`, borderRadius: 7, color: active ? C.cyan : C.muted, fontSize: 12, fontWeight: active ? 700 : 500, padding: "5px 12px", cursor: "pointer" }}>
                        {j}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>{t("home.fieldSummary", "Briefly describe your request")}</label>
                <textarea rows={3} value={consultationForm.summary} onChange={e => setConsultationForm(prev => ({ ...prev, summary: e.target.value }))} style={{ ...inp, resize: "vertical" }} />
              </div>
              <button onClick={submitConsultationRequest} disabled={isConsultationSubmitting} style={{ background: "transparent", border: `1px solid ${C.cyan}55`, borderRadius: 10, color: C.cyan, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: isConsultationSubmitting ? "not-allowed" : "pointer", opacity: isConsultationSubmitting ? 0.7 : 1, width: "100%" }}>
                {isConsultationSubmitting ? t("home.submitting", "Submitting...") : t("home.submitConsultation", "Submit Consultation Request")}
              </button>
              {isConsultationSubmitting && <p style={{ color: C.muted, fontSize: 11.5, margin: "8px 0 0", textAlign: "center" }}>{t("home.submitDisabledHint", "Please wait while we submit your request.")}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      {effectivelyAuthenticated && (
        <section style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "64px 28px" }}>
          <div className="djac-home-cta-card" style={{ background: `linear-gradient(135deg, ${C.purple}30, ${C.cyan}18)`, border: `1px solid ${C.cyan}30`, borderRadius: 20, padding: "52px 48px", textAlign: "center" }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 14px" }}>{t("home.ctaTitle", "Your compliance dashboard is ready.")}</h2>
            <p style={{ color: C.muted, fontSize: 15, marginBottom: 30, maxWidth: 480, margin: "0 auto 30px" }}>
              {t("home.ctaSubtitle", "Start analyzing framework conflicts and tracking obligations right now.")}
            </p>
            <Link href="/dashboard">
              <button style={{ background: C.purple, border: "none", borderRadius: 12, color: "#fff", padding: "14px 32px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
                {t("home.accessDashboard", "Go to Dashboard")} <ArrowRight style={{ width: 15, height: 15 }} />
              </button>
            </Link>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${C.border}`, padding: "32px 28px", textAlign: "center" }}>
        <p style={{ color: C.muted, fontSize: 13 }}>
          {`${t("home.footer.copyright", "(c)")} ${year} ${t("home.footer.credits", "DJAC Tool · Powered by Yalla Hack ·")} ${t("home.footer", "Enterprise compliance intelligence for global operations.")}`}
        </p>
      </footer>
    </div>
  );
}
