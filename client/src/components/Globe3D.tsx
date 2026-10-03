import createGlobe from "cobe";
import { useEffect, useRef } from "react";

export type GlobeMarker = { location: [number, number]; size: number };
export type GlobeArc = { from: [number, number]; to: [number, number] };

/** Key regulatory hubs (lat, lng). */
export const GLOBE_MARKERS: GlobeMarker[] = [
  { location: [39.9, 116.4], size: 0.09 }, // Beijing, China
  { location: [22.3, 114.2], size: 0.06 }, // Hong Kong
  { location: [24.7, 46.7], size: 0.09 }, // Riyadh, Saudi Arabia
  { location: [25.2, 55.3], size: 0.07 }, // Dubai, UAE
  { location: [50.85, 4.35], size: 0.08 }, // Brussels, EU
  { location: [38.9, -77.0], size: 0.08 }, // Washington, US
  { location: [51.5, -0.12], size: 0.06 }, // London, UK
  { location: [1.35, 103.8], size: 0.06 }, // Singapore
  { location: [35.68, 139.7], size: 0.05 }, // Tokyo, Japan
  { location: [-33.87, 151.2], size: 0.05 }, // Sydney, Australia
  { location: [-23.55, -46.63], size: 0.05 }, // São Paulo, Brazil
  { location: [-1.29, 36.82], size: 0.05 }, // Nairobi, Kenya
];

/** Cross-border regulatory corridors. */
export const GLOBE_ARCS: GlobeArc[] = [
  { from: [39.9, 116.4], to: [24.7, 46.7] }, // China → Saudi
  { from: [39.9, 116.4], to: [50.85, 4.35] }, // China → EU
  { from: [24.7, 46.7], to: [50.85, 4.35] }, // Saudi → EU
  { from: [50.85, 4.35], to: [38.9, -77.0] }, // EU → US
  { from: [25.2, 55.3], to: [1.35, 103.8] }, // UAE → Singapore
  { from: [38.9, -77.0], to: [-23.55, -46.63] }, // US → Brazil
];

/**
 * Lightweight interactive 3D globe (WebGL via `cobe`, ~5KB).
 *
 * No external textures or network calls, so it needs no CSP changes. Used in
 * the Pro-Intelligence view to show regulatory hubs and cross-border corridors.
 */
export function Globe3D({
  markers = GLOBE_MARKERS,
  arcs = GLOBE_ARCS,
  className,
}: {
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let raf = 0;
    const size = canvas.offsetWidth || 420;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: size * 2,
      height: size * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.08, 0.15, 0.25],
      markerColor: [0.0, 0.82, 1.0],
      glowColor: [0.06, 0.12, 0.2],
      markers,
      arcs,
      arcColor: [0.0, 0.82, 1.0],
      arcWidth: 0.5,
      arcHeight: 0.3,
      markerElevation: 0.02,
    });

    const loop = () => {
      phi += 0.0035;
      globe.update({ phi });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
    };
  }, [markers, arcs]);

  return (
    <canvas
      ref={canvasRef}
      aria-label="3D globe of DJAC regulatory hubs and cross-border corridors"
      role="img"
      className={className}
      style={{
        width: "100%",
        height: "auto",
        aspectRatio: "1 / 1",
        maxWidth: 520,
        margin: "0 auto",
        display: "block",
      }}
    />
  );
}
