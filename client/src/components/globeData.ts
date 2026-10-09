import type { GlobeMarker } from "./Globe3D";

/** Capital/hub coordinates for the jurisdictions DJAC covers. */
export const JURISDICTION_COORDS: Record<string, [number, number]> = {
  "United States": [38.9, -77.0],
  Canada: [45.4, -75.7],
  "European Union": [50.85, 4.35],
  "United Kingdom": [51.5, -0.12],
  "Saudi Arabia": [24.7, 46.7],
  "United Arab Emirates": [25.2, 55.3],
  Qatar: [25.29, 51.53],
  Bahrain: [26.23, 50.58],
  Oman: [23.59, 58.41],
  Kuwait: [29.37, 47.98],
  China: [39.9, 116.4],
  Singapore: [1.35, 103.8],
  Japan: [35.68, 139.7],
  "South Korea": [37.55, 126.99],
  Australia: [-33.87, 151.2],
  "New Zealand": [-41.29, 174.78],
  India: [28.6, 77.2],
  Malaysia: [3.14, 101.69],
  Indonesia: [-6.2, 106.85],
  Thailand: [13.75, 100.5],
  Vietnam: [21.03, 105.85],
  Philippines: [14.6, 120.98],
  "South Africa": [-25.75, 28.19],
  Nigeria: [9.06, 7.49],
  Kenya: [-1.29, 36.82],
  Egypt: [30.04, 31.24],
  "African Union": [9.03, 38.74],
  Brazil: [-23.55, -46.63],
  Mexico: [19.43, -99.13],
  Argentina: [-34.6, -58.38],
  Chile: [-33.45, -70.67],
  Colombia: [4.71, -74.07],
  "North America": [38.9, -77.0],
};

const SHORT: Record<string, string> = {
  "United States": "United States",
  "European Union": "European Union",
  "United Arab Emirates": "UAE",
  "United Kingdom": "UK",
  "South Korea": "South Korea",
  "South Africa": "South Africa",
  "New Zealand": "New Zealand",
  "African Union": "African Union",
  "North America": "North America",
};

/** Build globe markers from real frameworks, with per-jurisdiction counts. */
export function buildMarkersFromFrameworks(
  frameworks: { jurisdiction: string; code: string }[]
): GlobeMarker[] {
  const byJ: Record<string, { count: number; codes: string[] }> = {};
  for (const f of frameworks) {
    if (!JURISDICTION_COORDS[f.jurisdiction]) continue;
    const e = (byJ[f.jurisdiction] ??= { count: 0, codes: [] });
    e.count++;
    if (e.codes.length < 3) e.codes.push(f.code);
  }
  const entries = Object.entries(byJ);
  const max = Math.max(1, ...entries.map(([, v]) => v.count));
  return entries.map(([jurisdiction, v]) => {
    const [lat, lng] = JURISDICTION_COORDS[jurisdiction];
    return {
      id: jurisdiction,
      location: [lat, lng],
      value: v.count,
      size: 0.35 + 0.85 * (v.count / max),
      label: SHORT[jurisdiction] ?? jurisdiction,
      topFrameworks: v.codes,
    };
  });
}
