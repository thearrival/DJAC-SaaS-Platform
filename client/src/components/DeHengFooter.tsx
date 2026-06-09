/**
 * Shared DeHeng Law Firm partnership footer.
 * Displays the official legal partner branding consistently across all public pages.
 */
import { useLocale } from "@/contexts/useLocale";
import { useTheme } from "@/contexts/useTheme";

export function DeHengFooter() {
    const { t, direction } = useLocale();
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const dir = direction;

    const muted = isDark ? "rgba(255,255,255,0.40)" : "rgba(2,11,69,0.45)";
    const border = isDark ? "rgba(255,255,255,0.06)" : "rgba(4,15,97,0.11)";
    const accent = isDark ? "#00F7FF" : "#0284c7";
    const logoFilter = isDark
        ? "brightness(0.96) contrast(1.08)"
        : "brightness(0) saturate(100%) invert(8%) sepia(60%) saturate(2800%) hue-rotate(216deg) brightness(96%) contrast(102%)";

    return (
        <footer dir={dir} style={{
            borderTop: `1px solid ${border}`,
            padding: "20px 24px",
            textAlign: "center",
            fontFamily: "inherit",
        }}>
            {/* DeHeng partnership row */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 9,
            }}>
                <span style={{ fontSize: 10, color: muted, fontWeight: 500, letterSpacing: "0.03em" }}>
                    {t("footer.partnerPrefix", "In partnership with")}
                </span>
                <img
                    src="/deheng-logo.png"
                    alt="DeHeng Law Offices"
                    style={{
                        height: 22,
                        width: "auto",
                        maxWidth: 110,
                        objectFit: "contain",
                        filter: logoFilter,
                        verticalAlign: "middle",
                        transition: "filter 0.25s ease",
                    }}
                />
                <span style={{ fontSize: 9, color: muted, fontWeight: 500 }}>
                    {t("footer.dehengEst", "Est. 1993 · Global Practice")}
                </span>
            </div>

            {/* Platform footer row */}
            <div style={{
                fontSize: 10.5,
                color: muted,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                flexWrap: "wrap",
            }}>
                <span>© {new Date().getFullYear()} DJAC Tool</span>
                <span style={{ color: border }}>·</span>
                <span>{t("footer.tagline", "Dual-Jurisdiction Assurance & Compliance")}</span>
                <span style={{ color: border }}>·</span>
                <span>{t("footer.regions", "Saudi Arabia · China · UAE")}</span>
                <span style={{ color: border }}>·</span>
                <a href="mailto:sales@yalla-hack.com" style={{
                    color: accent,
                    textDecoration: "none",
                    fontSize: 10.5,
                }}>
                    sales@yalla-hack.com
                </a>
            </div>
        </footer>
    );
}
