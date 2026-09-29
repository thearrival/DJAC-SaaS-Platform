import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  X,
  ArrowRight,
  FileText,
  Building2,
  CalendarCheck,
} from "lucide-react";

const STORAGE_KEY = "djac_welcome_banner_dismissed";

export function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    const tourDone = localStorage.getItem("djac_tour_done");
    if (!dismissed && tourDone === "true") {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #d900ff 0%, #d900ff 100%)",
        borderRadius: 14,
        padding: "16px 20px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap" as const,
        gap: 12,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{ fontSize: 15, fontWeight: 700, color: "var(--djac-text)" }}
        >
          👋 Welcome to DJAC — ready to get started?
        </span>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
          <Link
            href="/vendor-assessment"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--djac-text)",
              background: "var(--djac-card-hi)",
              borderRadius: 8,
              padding: "5px 10px",
              textDecoration: "none",
            }}
          >
            <Building2 size={13} /> Run Vendor Assessment{" "}
            <ArrowRight size={12} />
          </Link>
          <Link
            href="/report-center"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--djac-text)",
              background: "var(--djac-card-hi)",
              borderRadius: 8,
              padding: "5px 10px",
              textDecoration: "none",
            }}
          >
            <FileText size={13} /> Generate Report <ArrowRight size={12} />
          </Link>
          <Link
            href="/compliance-calendar"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "var(--djac-text)",
              background: "var(--djac-card-hi)",
              borderRadius: 8,
              padding: "5px 10px",
              textDecoration: "none",
            }}
          >
            <CalendarCheck size={13} /> Check Deadlines <ArrowRight size={12} />
          </Link>
        </div>
      </div>
      <button
        onClick={dismiss}
        style={{
          background: "var(--djac-card-hi)",
          border: "none",
          borderRadius: 8,
          padding: 6,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Dismiss"
      >
        <X size={16} color="#fff" />
      </button>
    </div>
  );
}
