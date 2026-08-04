/**
 * ProductTour — interactive, step-by-step walkthrough highlighting
 * key features for first-time users. Uses portal-based overlay with
 * spotlight effects and progress tracking.
 *
 * Persists completion state via localStorage and tRPC.
 */
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/contexts/useLocale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  LayoutDashboard,
  Building2,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Settings,
} from "lucide-react";

interface TourStep {
  target: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  offsetX?: number;
  offsetY?: number;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-id="tour-menu-dashboard"]',
    title: "Your Command Center",
    description:
      "See compliance health, critical gaps, and upcoming deadlines at a glance. This dashboard updates in real time as you add vendors and run assessments.",
    icon: LayoutDashboard,
  },
  {
    target: '[data-tour-id="tour-menu-analysis"]',
    title: "Compliance Framework Library",
    description:
      "Browse 46 frameworks across 29 jurisdictions. Select your frameworks to unlock AI-powered gap analysis and cross-jurisdiction comparisons.",
    icon: BookOpen,
    offsetX: 0,
    offsetY: 8,
  },
  {
    target: '[data-tour-id="tour-menu-vendor-assessment"]',
    title: "Vendor Risk Management",
    description:
      "Register and assess third-party vendors. DJAC runs automated compliance checks across all your selected frameworks and flags critical gaps.",
    icon: Building2,
  },
  {
    target: '[data-tour-id="tour-menu-risk-register"]',
    title: "Risk Register",
    description:
      "Track organizational risks with automated severity scoring. Link risks to vendors, frameworks, and remediation tasks for complete traceability.",
    icon: AlertTriangle,
  },
  {
    target: '[data-tour-id="tour-menu-incidents"]',
    title: "Incident Management",
    description:
      "Log security and compliance incidents. DJAC auto-maps relevant regulations and generates notification timelines based on your jurisdictions.",
    icon: ShieldCheck,
  },
  {
    target: '[data-tour-id="tour-menu-reports"]',
    title: "AI Report Generator",
    description:
      "Generate professional compliance reports with one click. Select jurisdictions and frameworks — DJAC's AI produces gap analysis, recommendations, and export-ready PDFs.",
    icon: FileText,
  },
  {
    target: '[data-tour-id="tour-menu-account-settings"]',
    title: "Team & Settings",
    description:
      "Invite team members, configure role-based access, set notification preferences, and manage your organization profile and billing.",
    icon: Settings,
  },
];

const STORAGE_KEY = "djac_tour_completed";
const TOUR_GUIDE_KEY = "djac_tour_done";

export function ProductTour() {
  const { t } = useLocale();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });

  const startTour = useCallback(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (done === "true") return;
    const tourGuideDone = localStorage.getItem(TOUR_GUIDE_KEY);
    if (tourGuideDone === "true") return;

    const timer = setTimeout(() => {
      setVisible(true);
      setStep(0);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    startTour();
  }, [startTour]);

  const positionHighlight = useCallback((targetSelector: string) => {
    const el = document.querySelector(targetSelector);
    if (!el) {
      setPosition({
        top: 120,
        left: window.innerWidth / 2 - 180,
        width: 360,
        height: 80,
      });
      return;
    }
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  useEffect(() => {
    if (visible && TOUR_STEPS[step]) {
      positionHighlight(TOUR_STEPS[step].target);
      const onResize = () => positionHighlight(TOUR_STEPS[step].target);
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
  }, [visible, step, positionHighlight]);

  const finishTour = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const nextStep = () => {
    if (step >= TOUR_STEPS.length - 1) finishTour();
    else setStep(s => s + 1);
  };

  const prevStep = () => {
    if (step <= 0) setVisible(false);
    else setStep(s => s - 1);
  };

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  if (!current) return null;

  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;
  const tooltipX = position.left + (current.offsetX ?? 0);
  const tooltipY = position.top + position.height + 12 + (current.offsetY ?? 0);
  const tooltipRight = tooltipX > window.innerWidth - 400;

  return createPortal(
    <>
      {/* Dark overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 9998,
        }}
        onClick={finishTour}
      />

      {/* Spotlight cutout */}
      <div
        style={{
          position: "fixed",
          top: position.top - 8,
          left: position.left - 8,
          width: position.width + 16,
          height: position.height + 16,
          borderRadius: 12,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      />

      {/* Tooltip card */}
      <div
        style={{
          position: "fixed",
          top: tooltipY,
          left: tooltipRight ? undefined : tooltipX,
          right: tooltipRight ? 24 : undefined,
          width: tooltipRight ? undefined : 380,
          maxWidth: "calc(100vw - 48px)",
          zIndex: 10000,
          background: "var(--djac-card, #fff)",
          border: "1px solid var(--djac-border, #e2e8f0)",
          borderRadius: 14,
          padding: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #0891b2, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <Icon size={18} />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              {current.title}
            </p>
            <Badge variant="outline" className="text-[10px] px-1.5">
              {step + 1} / {TOUR_STEPS.length}
            </Badge>
          </div>
          <button
            onClick={finishTour}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--djac-muted, #94a3b8)",
              padding: 4,
            }}
            aria-label={t("tour.close", "Close tour")}
          >
            <X size={16} />
          </button>
        </div>

        <p
          style={{
            fontSize: 13,
            color: "var(--djac-muted, #64748b)",
            lineHeight: 1.6,
            marginBottom: 16,
          }}
        >
          {current.description}
        </p>

        {/* Progress dots */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                height: 3,
                flex: 1,
                borderRadius: 2,
                background:
                  i <= step
                    ? "var(--primary, #0891b2)"
                    : "var(--djac-border, #e2e8f0)",
              }}
            />
          ))}
        </div>

        <div
          style={{ display: "flex", gap: 8, justifyContent: "space-between" }}
        >
          <Button variant="ghost" size="sm" onClick={prevStep}>
            <ChevronLeft size={14} />
            {step === 0 ? t("tour.skip", "Skip") : t("tour.back", "Back")}
          </Button>
          <Button size="sm" onClick={nextStep}>
            {isLast ? (
              <>
                <Check size={14} />
                {t("tour.finish", "Got it")}
              </>
            ) : (
              <>
                {t("tour.next", "Next")}
                <ChevronRight size={14} />
              </>
            )}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}
