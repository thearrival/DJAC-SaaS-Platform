/**
 * DjacLogoMark — renders the DJAC brand mark from the PNG asset.
 *
 * Usage:
 *   <DjacLogoMark />                      // 36 × 36 px (default)
 *   <DjacLogoMark size={48} />
 *   <DjacLogoMark size={32} className="rounded-md ring-1 ring-border" />
 */

import { APP_LOGO } from "@/const";

interface DjacLogoMarkProps {
  /** Width & height of the rendered element. Defaults to 36. */
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  /** Overrides the accessible label. Defaults to "DJAC". */
  ariaLabel?: string;
}

export function DjacLogoMark({
  size = 36,
  className,
  style,
  ariaLabel = "DJAC",
}: DjacLogoMarkProps) {
  return (
    <img
      src={APP_LOGO}
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", ...style }}
    />
  );
}
