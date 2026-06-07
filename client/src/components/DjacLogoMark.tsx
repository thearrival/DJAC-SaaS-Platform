/**
 * DjacLogoMark — high-fidelity SVG recreation of the Yalla Hack two-capsule
 * brand mark (the icon-only portion, without wordmark text).
 *
 * Visual design matches the original metallic glossy capsules:
 *  • Two 3-D pill shapes arranged diagonally (top-right elongated pill +
 *    bottom-left squarish capsule), faithful to the original brand asset.
 *  • Deep radial gradients simulate the liquid-metal cyan sheen:
 *      light-cyan specular peak → medium teal body → near-black dark edge.
 *  • Layered specular highlights (two overlapping ellipses) recreate the
 *    bright glossy reflection visible in the centre-upper area.
 *  • Each capsule is clipped so highlights are strictly contained.
 *  • Subtle drop-shadow adds perceived depth between the two shapes.
 *  • Transparent background — crisp in both light & dark modes.
 *  • React useId() scopes every SVG ID so multiple instances never conflict.
 *  • Fully accessible: aria-label + <title>.
 *
 * Usage:
 *   <DjacLogoMark />                      // 36 × 36 px (default)
 *   <DjacLogoMark size={48} />
 *   <DjacLogoMark size={32} className="rounded-md ring-1 ring-border" />
 */

import { useId } from "react";

interface DjacLogoMarkProps {
    /** Width & height of the rendered SVG element. Defaults to 36. */
    size?: number | string;
    className?: string;
    style?: React.CSSProperties;
    /** Overrides the accessible label. Defaults to "DJAC – Yalla Hack". */
    ariaLabel?: string;
}

export function DjacLogoMark({
    size = 36,
    className,
    style,
    ariaLabel = "DJAC – Yalla Hack",
}: DjacLogoMarkProps) {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, "_");

    // ── Shorthand ID builders ───────────────────────────────────────────────
    const id = (s: string) => `${uid}${s}`;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 36 36"
            width={size}
            height={size}
            className={className}
            style={style}
            aria-label={ariaLabel}
            role="img"
            fill="none"
        >
            <title>{ariaLabel}</title>

            <defs>
                {/* ── Clip paths (constrain highlights inside each capsule) ─ */}
                <clipPath id={id("cr")}>
                    {/* Right / top capsule — elongated pill */}
                    <rect x="12" y="2" width="23" height="11" rx="5.5" />
                </clipPath>
                <clipPath id={id("cl")}>
                    {/* Left / bottom capsule — squarish rounded rect */}
                    <rect x="1" y="23" width="18" height="12" rx="6" />
                </clipPath>

                {/* ── Right capsule radial gradient (userSpaceOnUse) ───────── */}
                {/* Origin at upper-centre-left of the right pill */}
                <radialGradient
                    id={id("gr")}
                    cx="0" cy="0" r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(21,5.5) scale(14,7)"
                >
                    <stop offset="0%" stopColor="#B8F0F8" />  {/* specular peak   */}
                    <stop offset="22%" stopColor="#22C2D8" />  {/* bright cyan      */}
                    <stop offset="58%" stopColor="#008090" />  {/* mid teal         */}
                    <stop offset="100%" stopColor="#002838" />  {/* dark edge        */}
                </radialGradient>

                {/* ── Left capsule radial gradient ─────────────────────────── */}
                {/* Origin at upper-centre-left of the left pill */}
                <radialGradient
                    id={id("gl")}
                    cx="0" cy="0" r="1"
                    gradientUnits="userSpaceOnUse"
                    gradientTransform="translate(9,25.5) scale(12,8)"
                >
                    <stop offset="0%" stopColor="#C0F2FA" />  {/* specular peak   */}
                    <stop offset="20%" stopColor="#18C8E0" />  {/* bright cyan      */}
                    <stop offset="55%" stopColor="#007888" />  {/* mid teal         */}
                    <stop offset="100%" stopColor="#002030" />  {/* dark edge        */}
                </radialGradient>

                {/* ── Depth shadow (shared) ────────────────────────────────── */}
                <filter id={id("sh")} x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow
                        dx="0.5" dy="1.5" stdDeviation="1.2"
                        floodColor="#001820" floodOpacity="0.45"
                    />
                </filter>
            </defs>

            {/* ═══════════════════════════════════════════════════════════════
                RIGHT / TOP CAPSULE  — elongated horizontal pill (upper-right)
                ═══════════════════════════════════════════════════════════════ */}
            <g filter={`url(#${id("sh")})`}>
                {/* Body with metallic radial gradient */}
                <rect
                    x="12" y="2" width="23" height="11" rx="5.5"
                    fill={`url(#${id("gr")})`}
                    stroke="#00D8EE" strokeWidth="0.45" strokeOpacity="0.65"
                />
                {/* Specular highlights clipped to capsule */}
                <g clipPath={`url(#${id("cr")})`}>
                    {/* Broad soft glow */}
                    <ellipse cx="22" cy="5.5" rx="8.5" ry="3"
                        fill="white" fillOpacity="0.22" />
                    {/* Tight bright peak */}
                    <ellipse cx="21.5" cy="4.4" rx="4.5" ry="1.6"
                        fill="white" fillOpacity="0.38" />
                </g>
            </g>

            {/* ═══════════════════════════════════════════════════════════════
                LEFT / BOTTOM CAPSULE — squarish rounded rect (lower-left)
                ═══════════════════════════════════════════════════════════════ */}
            <g filter={`url(#${id("sh")})`}>
                {/* Body with metallic radial gradient */}
                <rect
                    x="1" y="23" width="18" height="12" rx="6"
                    fill={`url(#${id("gl")})`}
                    stroke="#00D0E8" strokeWidth="0.45" strokeOpacity="0.65"
                />
                {/* Specular highlights clipped to capsule */}
                <g clipPath={`url(#${id("cl")})`}>
                    {/* Broad soft glow */}
                    <ellipse cx="9" cy="26.5" rx="7.5" ry="3"
                        fill="white" fillOpacity="0.24" />
                    {/* Tight bright peak */}
                    <ellipse cx="8.5" cy="25.3" rx="3.8" ry="1.5"
                        fill="white" fillOpacity="0.42" />
                </g>
            </g>
        </svg>
    );
}
