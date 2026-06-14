/**
 * DJAC TourGuide
 * ──────────────────────────────────────────────────────────────────────────────
 * Interactive step-by-step onboarding tour for new users.
 *
 * Features:
 *  - Spotlight overlay that highlights the target element
 *  - Floating tooltip with title, description, back/next/skip/done controls
 *  - Animated beacon (pulsing ring) on the target element
 *  - Keyboard support: →/Space = next, ← = back, Esc = skip
 *  - Smoothly scrolls target into view before spotlighting
 *  - Progress bar showing step completion
 *  - Plays sounds on step advance and completion
 *  - localStorage persistence: triggers once after registration, can be restarted
 *
 * Usage:
 *  import { TourGuide, setTourPending, restartTour } from "@/components/TourGuide";
 *  // In your app root or DashboardLayout:
 *  <TourGuide />
 *  // After new user registration:
 *  setTourPending();
 *  // To restart:
 *  restartTour();
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { sounds } from "@/lib/sounds";
import { useLocale } from "@/contexts/useLocale";
import {
    ArrowLeft, ArrowRight, X, CheckCircle2, Sparkles, MapPin,
} from "lucide-react";

// ── localStorage keys ─────────────────────────────────────────────────────────
const PENDING_KEY = "djac_tour_pending";
const DONE_KEY = "djac_tour_done";

export function setTourPending(): void {
    localStorage.setItem(PENDING_KEY, "true");
}

export function clearTourPending(): void {
    localStorage.removeItem(PENDING_KEY);
}

export function restartTour(): void {
    localStorage.setItem(PENDING_KEY, "true");
    localStorage.removeItem(DONE_KEY);
}

function isTourPending(): boolean {
    return (
        localStorage.getItem(PENDING_KEY) === "true" &&
        localStorage.getItem(DONE_KEY) !== "true"
    );
}

// ── Tour step definition ──────────────────────────────────────────────────────
export interface TourStep {
    /** `data-tour-id` on the target element. If undefined: generic centered tooltip (welcome/done). */
    targetId?: string;
    titleKey: string;
    titleFallback: string;
    descKey: string;
    descFallback: string;
    /** Where to position the tooltip relative to the target. Default: "auto" */
    placement?: "top" | "bottom" | "left" | "right" | "auto";
}

// ── Default tour steps (English fallbacks + translation key hooks) ─────────────
const TOUR_STEPS: TourStep[] = [
    {
        titleKey: "tour.step0Title",
        titleFallback: "Welcome to DJAC! 👋",
        descKey: "tour.step0Desc",
        descFallback:
            "Your all-in-one compliance platform for China–Saudi cross-border operations.\n\n" +
            "📊 Compliance tracking  •  🤖 AI-powered reports\n" +
            "🔍 Vendor risk analysis  •  📅 Deadline monitoring\n\n" +
            "In 7 quick steps, you'll master the essentials. Let's go! 🚀",
    },
    {
        targetId: "tour-menu-dashboard",
        titleKey: "tour.step1Title",
        titleFallback: "📊 Dashboard — Your Command Center",
        descKey: "tour.step1Desc",
        descFallback:
            "See everything at a glance: compliance score, risk levels, upcoming deadlines, " +
            "and framework coverage. This is your home base — check it daily.",
        placement: "right",
    },
    {
        targetId: "tour-menu-analysis",
        titleKey: "tour.step2Title",
        titleFallback: "🔍 Framework Analysis — Compare Laws",
        descKey: "tour.step2Desc",
        descFallback:
            "Compare PIPL, CSL, DSL, PDPL, and NCA side-by-side. " +
            "Spot overlaps, conflicts, and gaps across Saudi and Chinese regulations instantly.",
        placement: "right",
    },
    {
        targetId: "tour-menu-vendor-assessment",
        titleKey: "tour.step3Title",
        titleFallback: "🏢 Vendor Risk — Assess Third Parties",
        descKey: "tour.step3Desc",
        descFallback:
            "Upload a vendor profile and our AI scores compliance alignment, " +
            "flags data-residency gaps, and generates a risk report in seconds.",
        placement: "right",
    },
    {
        targetId: "tour-menu-report-center",
        titleKey: "tour.step4Title",
        titleFallback: "📄 Reports — Generate & Share",
        descKey: "tour.step4Desc",
        descFallback:
            "One click → AI-powered PDF or DOCX compliance report. " +
            "Share via secure time-limited links. Schedule auto-delivery weekly or monthly.",
        placement: "right",
    },
    {
        targetId: "tour-menu-calendar",
        titleKey: "tour.step5Title",
        titleFallback: "📅 Calendar — Never Miss a Deadline",
        descKey: "tour.step5Desc",
        descFallback:
            "Track PIPL, CSL, PDPL, and NCA deadlines. " +
            "DJAC emails you 30, 7, and 1 day before each one. Stress-free compliance.",
        placement: "right",
    },
    {
        targetId: "tour-menu-pro-intelligence",
        titleKey: "tour.step6Title",
        titleFallback: "🌍 Pro Intelligence — Live Regulatory Feed",
        descKey: "tour.step6Desc",
        descFallback:
            "Real-time Sino-Gulf regulatory updates, enforcement actions, " +
            "penalty calculators, and AI pipeline transparency. For power users.",
        placement: "right",
    },
    {
        targetId: "tour-menu-account-settings",
        titleKey: "tour.step7Title",
        titleFallback: "⚙️ Settings — Secure Your Account",
        descKey: "tour.step7Desc",
        descFallback:
            "🔐 Enable two-factor auth (TOTP)  •  👤 Update profile\n" +
            "🌐 Switch language (EN/AR/ZH)  •  🎨 Toggle dark mode\n" +
            "All under Account Settings.",
        placement: "right",
    },
    {
        titleKey: "tour.step8Title",
        titleFallback: "You're Ready! 🎉",
        descKey: "tour.step8Desc",
        descFallback:
            "✅ Take the tour — done!\n\n" +
            "Start here:\n" +
            "1️⃣ Run a Vendor Assessment\n" +
            "2️⃣ Generate your first Compliance Report\n" +
            "3️⃣ Check the Compliance Calendar\n\n" +
            "DJAC has your back. Go make compliance easy! 💪",
    },
];

// ── Spotlight padding ─────────────────────────────────────────────────────────
const HIGHLIGHT_PAD = 8;
const BEACON_SIZE = 44;

// ── Tooltip size estimate (for placement logic) ───────────────────────────────
const TIP_W = 340;
const TIP_H = 220;
const TIP_GAP = 16;

interface Rect {
    top: number;
    left: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

function computeTipPos(
    target: Rect,
    placement: TourStep["placement"],
    vpW: number,
    vpH: number,
): { top: number; left: number; position: TourStep["placement"] } {
    const effective: TourStep["placement"] =
        placement === "auto" || !placement
            ? target.left + target.width / 2 < vpW / 2
                ? "right"
                : "left"
            : placement;

    let top: number;
    let left: number;

    switch (effective) {
        case "right":
            left = target.right + TIP_GAP;
            top = target.top + target.height / 2 - TIP_H / 2;
            break;
        case "left":
            left = target.left - TIP_W - TIP_GAP;
            top = target.top + target.height / 2 - TIP_H / 2;
            break;
        case "bottom":
            top = target.bottom + TIP_GAP;
            left = target.left + target.width / 2 - TIP_W / 2;
            break;
        case "top":
        default:
            top = target.top - TIP_H - TIP_GAP;
            left = target.left + target.width / 2 - TIP_W / 2;
            break;
    }

    // Clamp to viewport
    left = Math.max(12, Math.min(left, vpW - TIP_W - 12));
    top = Math.max(12, Math.min(top, vpH - TIP_H - 12));

    return { top, left, position: effective };
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TourGuide() {
    const { t } = useLocale();
    const [active, setActive] = useState(false);
    const [stepIdx, setStepIdx] = useState(0);
    const [targetRect, setTargetRect] = useState<Rect | null>(null);
    const [vpSize, setVpSize] = useState({ w: window.innerWidth, h: window.innerHeight });
    const [visible, setVisible] = useState(false); // fade-in
    const rafRef = useRef<number | null>(null);
    const step = TOUR_STEPS[stepIdx];

    // ── Start / stop ──────────────────────────────────────────────────────────
    const startTour = useCallback(() => {
        setStepIdx(0);
        setActive(true);
        setVisible(false);
        setTimeout(() => setVisible(true), 30);
    }, []);

    const endTour = useCallback((completed = false) => {
        setVisible(false);
        setTimeout(() => {
            setActive(false);
            clearTourPending();
            localStorage.setItem(DONE_KEY, "true");
        }, 300);
        if (completed) sounds.tourComplete();
        else sounds.close();
    }, []);

    // On mount, check if tour is pending
    useEffect(() => {
        if (isTourPending()) {
            // Small delay so the dashboard has rendered nav items
            const timer = setTimeout(() => startTour(), 800);
            return () => clearTimeout(timer);
        }
    }, [startTour]);

    // ── Viewport resize ───────────────────────────────────────────────────────
    useEffect(() => {
        const handler = () => {
            setVpSize({ w: window.innerWidth, h: window.innerHeight });
        };
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    // ── Locate target element & scroll into view ──────────────────────────────
    useEffect(() => {
        if (!active || !step.targetId) {
            setTargetRect(null);
            return;
        }

        // Cancel previous animation frame
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        const update = () => {
            const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.targetId}"]`);
            if (el) {
                el.scrollIntoView({ block: "nearest", behavior: "smooth" });
                const rect = el.getBoundingClientRect();
                setTargetRect({
                    top: rect.top,
                    left: rect.left,
                    right: rect.right,
                    bottom: rect.bottom,
                    width: rect.width,
                    height: rect.height,
                });
            } else {
                setTargetRect(null);
            }
        };

        // Poll briefly to handle scroll animation
        let count = 0;
        const poll = () => {
            update();
            if (count++ < 8) rafRef.current = requestAnimationFrame(poll);
        };
        poll();

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [active, step.targetId, stepIdx]);

    // ── Keyboard shortcuts ────────────────────────────────────────────────────
    useEffect(() => {
        if (!active) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight" || e.key === " ") {
                e.preventDefault();
                advance();
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                goBack();
            } else if (e.key === "Escape") {
                endTour(false);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });

    const advance = useCallback(() => {
        if (stepIdx >= TOUR_STEPS.length - 1) {
            endTour(true);
        } else {
            sounds.tourStep();
            setVisible(false);
            setTimeout(() => {
                setStepIdx(i => i + 1);
                setVisible(true);
            }, 200);
        }
    }, [stepIdx, endTour]);

    const goBack = useCallback(() => {
        if (stepIdx === 0) return;
        sounds.click();
        setVisible(false);
        setTimeout(() => {
            setStepIdx(i => i - 1);
            setVisible(true);
        }, 200);
    }, [stepIdx]);

    if (!active) return null;

    const isFirst = stepIdx === 0;
    const isLast = stepIdx === TOUR_STEPS.length - 1;
    const progress = ((stepIdx) / (TOUR_STEPS.length - 1)) * 100;

    // Spotlight dims
    const pad = HIGHLIGHT_PAD;
    const hl = targetRect
        ? {
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            right: targetRect.right + pad,
            bottom: targetRect.bottom + pad,
            w: targetRect.width + pad * 2,
            h: targetRect.height + pad * 2,
        }
        : null;

    // Tooltip position
    const tipPos = targetRect
        ? computeTipPos(
            {
                top: targetRect.top,
                left: targetRect.left,
                right: targetRect.right,
                bottom: targetRect.bottom,
                width: targetRect.width,
                height: targetRect.height,
            },
            step.placement,
            vpSize.w,
            vpSize.h,
        )
        : { top: vpSize.h / 2 - TIP_H / 2, left: vpSize.w / 2 - TIP_W / 2, position: "bottom" as const };

    const overlayStyle: React.CSSProperties = {
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
        pointerEvents: "auto",
    };

    return createPortal(
        <div style={overlayStyle} role="dialog" aria-modal="true" aria-label={t("tour.dialogLabel", "Onboarding tour")}>
            {/* ── Dark overlay panels (spotlight effect) ── */}
            {hl ? (
                <>
                    {/* Top */}
                    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, hl.top), background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                    {/* Bottom */}
                    <div style={{ position: "fixed", top: hl.bottom, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                    {/* Left */}
                    <div style={{ position: "fixed", top: hl.top, left: 0, width: Math.max(0, hl.left), height: hl.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                    {/* Right */}
                    <div style={{ position: "fixed", top: hl.top, left: hl.right, right: 0, height: hl.h, background: "rgba(0,0,0,0.55)", pointerEvents: "none" }} />
                    {/* Highlight border ring */}
                    <div
                        style={{
                            position: "fixed",
                            top: hl.top,
                            left: hl.left,
                            width: hl.w,
                            height: hl.h,
                            borderRadius: 10,
                            border: "2px solid rgba(0,247,255,0.85)",
                            boxShadow: "0 0 0 4px rgba(0,247,255,0.18), 0 0 32px rgba(0,247,255,0.30)",
                            pointerEvents: "none",
                            animation: "djac-tour-ring-pulse 2s ease-in-out infinite",
                        }}
                    />
                    {/* Animated beacon */}
                    <div
                        style={{
                            position: "fixed",
                            top: targetRect!.top + targetRect!.height / 2 - BEACON_SIZE / 2,
                            left: targetRect!.left + targetRect!.width / 2 - BEACON_SIZE / 2,
                            width: BEACON_SIZE,
                            height: BEACON_SIZE,
                            borderRadius: "50%",
                            background: "rgba(0,247,255,0.12)",
                            border: "2px solid rgba(0,247,255,0.60)",
                            animation: "djac-tour-beacon 1.6s ease-in-out infinite",
                            pointerEvents: "none",
                        }}
                    />
                </>
            ) : (
                /* Full dark overlay for welcome/done steps */
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.52)", pointerEvents: "none" }} />
            )}

            {/* ── Skip button (top-right) ── */}
            <button
                onClick={() => endTour(false)}
                aria-label={t("tour.skip", "Skip tour")}
                style={{
                    position: "fixed",
                    top: 16,
                    right: 16,
                    zIndex: 9999,
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: 8,
                    padding: "6px 12px",
                    color: "rgba(255,255,255,0.80)",
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    backdropFilter: "blur(6px)",
                    transition: "background 0.15s",
                }}
                onMouseEnter={e => ((e.target as HTMLElement).style.background = "rgba(255,255,255,0.18)")}
                onMouseLeave={e => ((e.target as HTMLElement).style.background = "rgba(255,255,255,0.10)")}
            >
                <X size={12} />
                {t("tour.skip", "Skip tour")}
            </button>

            {/* ── Tooltip card ── */}
            <div
                style={{
                    position: "fixed",
                    top: tipPos.top,
                    left: tipPos.left,
                    width: TIP_W,
                    zIndex: 9999,
                    background: "linear-gradient(145deg, rgba(8,20,80,0.97) 0%, rgba(4,12,56,0.97) 100%)",
                    border: "1px solid rgba(0,247,255,0.25)",
                    borderRadius: 16,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.50), 0 0 0 1px rgba(0,247,255,0.12)",
                    padding: "20px 22px",
                    backdropFilter: "blur(16px)",
                    color: "#FFFFFF",
                    fontFamily: "inherit",
                    transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
                    transition: "transform 0.25s ease, opacity 0.25s ease",
                }}
            >
                {/* Step badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "rgba(0,247,255,0.80)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {isLast ? (
                            <CheckCircle2 size={12} style={{ color: "#01FF7F" }} />
                        ) : stepIdx === 0 ? (
                            <Sparkles size={12} style={{ color: "rgba(0,247,255,0.80)" }} />
                        ) : (
                            <MapPin size={12} style={{ color: "rgba(0,247,255,0.80)" }} />
                        )}
                        {isLast
                            ? t("tour.complete", "Complete!")
                            : isFirst
                                ? t("tour.welcome", "Welcome")
                                : `${t("tour.step", "Step")} ${stepIdx} / ${TOUR_STEPS.length - 2}`}
                    </div>
                    {/* Progress bar */}
                    <div style={{ flex: 1, marginLeft: 14, height: 3, background: "rgba(255,255,255,0.10)", borderRadius: 2, overflow: "hidden" }}>
                        <div
                            style={{
                                height: "100%",
                                width: `${progress}%`,
                                background: isLast ? "#01FF7F" : "rgba(0,247,255,0.80)",
                                borderRadius: 2,
                                transition: "width 0.35s ease",
                            }}
                        />
                    </div>
                </div>

                {/* Title */}
                <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, lineHeight: 1.25, color: "#FFFFFF" }}>
                    {t(step.titleKey, step.titleFallback)}
                </h3>

                {/* Description */}
                <p style={{ margin: "0 0 18px", fontSize: 12.5, lineHeight: 1.65, color: "rgba(255,255,255,0.72)" }}>
                    {t(step.descKey, step.descFallback)}
                </p>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    {/* Back */}
                    <button
                        onClick={goBack}
                        disabled={isFirst}
                        aria-label={t("tour.back", "Previous step")}
                        style={{
                            background: "transparent",
                            border: "1px solid rgba(255,255,255,0.18)",
                            borderRadius: 8,
                            padding: "8px 14px",
                            color: isFirst ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.70)",
                            fontSize: 12,
                            cursor: isFirst ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            transition: "all 0.15s",
                        }}
                    >
                        <ArrowLeft size={12} />
                        {t("tour.back", "Back")}
                    </button>

                    {/* Step dots */}
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        {TOUR_STEPS.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: i === stepIdx ? 16 : 5,
                                    height: 5,
                                    borderRadius: 3,
                                    background: i === stepIdx
                                        ? "rgba(0,247,255,0.90)"
                                        : i < stepIdx
                                            ? "rgba(1,255,127,0.60)"
                                            : "rgba(255,255,255,0.18)",
                                    transition: "all 0.25s ease",
                                }}
                            />
                        ))}
                    </div>

                    {/* Next / Done */}
                    <button
                        onClick={advance}
                        aria-label={isLast ? t("tour.done", "Finish tour") : t("tour.next", "Next step")}
                        style={{
                            background: isLast
                                ? "linear-gradient(135deg, #01FF7F, #00C96A)"
                                : "linear-gradient(135deg, rgba(0,247,255,0.90), rgba(0,180,255,0.90))",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 16px",
                            color: isLast ? "#020B45" : "#020B45",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                            transition: "all 0.15s",
                            boxShadow: "0 2px 12px rgba(0,247,255,0.25)",
                        }}
                    >
                        {isLast ? (
                            <>
                                <CheckCircle2 size={12} />
                                {t("tour.done", "Done!")}
                            </>
                        ) : (
                            <>
                                {t("tour.next", "Next")}
                                <ArrowRight size={12} />
                            </>
                        )}
                    </button>
                </div>

                {/* Keyboard hint */}
                {!isLast && (
                    <p style={{ margin: "10px 0 0", fontSize: 10, color: "rgba(255,255,255,0.30)", textAlign: "center" }}>
                        {t("tour.keyHint", "Use ← → arrow keys or Space to navigate · Esc to skip")}
                    </p>
                )}
            </div>

            {/* ── CSS keyframes injected once ── */}
            <style>{`
                @keyframes djac-tour-ring-pulse {
                    0%, 100% { box-shadow: 0 0 0 4px rgba(0,247,255,0.18), 0 0 32px rgba(0,247,255,0.30); }
                    50% { box-shadow: 0 0 0 8px rgba(0,247,255,0.08), 0 0 48px rgba(0,247,255,0.45); }
                }
                @keyframes djac-tour-beacon {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.5); opacity: 0.2; }
                }
            `}</style>
        </div>,
        document.body,
    );
}
