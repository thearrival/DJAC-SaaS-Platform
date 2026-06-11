import type React from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { Home, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  usePageTitle("Page Not Found");
  const [_location, setLocation] = useLocation();
  const { t, direction } = useLocale();

  const handleHome = () => setLocation("/dashboard");
  const handleBack = () => window.history.length > 1 ? window.history.back() : setLocation("/dashboard");

  return (
    <div
      dir={direction}
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "inherit",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle dot-grid overlay */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "radial-gradient(var(--border) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none", opacity: 0.6 }} />
      {/* Radial glow accent */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 500, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(147,89,236,0.14) 0%, transparent 70%)", filter: "blur(48px)", pointerEvents: "none" }} />

      <style>{`
        .djac-404-num {
          font-size: clamp(80px, 18vw, 130px);
          font-weight: 900;
          line-height: 1;
          background: linear-gradient(135deg, var(--djac-cyan, #00F7FF), var(--djac-purple, #9359EC));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
          margin-bottom: 0.5rem;
          letter-spacing: -0.04em;
        }
      `}</style>

      <div style={{ position: "relative", textAlign: "center", padding: "2rem 1.5rem", maxWidth: 480 }}>
        {/* 404 glyph */}
        <div className="djac-404-num">404</div>

        {/* Title */}
        <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: "var(--foreground)", margin: "0 0 0.75rem" }}>
          {t("notfound.title", "Page Not Found")}
        </h2>

        {/* Message */}
        <p style={{ color: "var(--muted-foreground)", maxWidth: 380, lineHeight: 1.65, margin: "0 auto 2rem" }}>
          {t("notfound.message", "This page doesn't exist or was moved. Head back to the dashboard to continue.")}
        </p>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleHome}
            style={{ background: "linear-gradient(135deg, #9359EC, #00F7FF)", color: "#fff", border: "none", padding: "0.65rem 1.6rem", borderRadius: 8, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontSize: "0.9rem", boxShadow: "0 4px 20px rgba(147,89,236,0.30)" }}
          >
            <Home className="w-4 h-4" />
            {t("notfound.goHome", "Go to Dashboard")}
          </button>
          <button
            type="button"
            onClick={handleBack}
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted-foreground)", padding: "0.65rem 1.4rem", borderRadius: 8, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, fontSize: "0.9rem" }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t("notfound.goBack", "Go Back")}
          </button>
        </div>
      </div>
    </div>
  );
}
