/**
 * SinoGulfHeatmap v3 — Global Regulatory Heatmap
 * Real-world simplified country outlines via Natural Earth coordinates.
 * All text is clean ASCII — no mojibake, no broken emoji.
 */
import { useMemo, useState, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/useTheme";
import { useLocale } from "@/contexts/useLocale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle, CheckCircle2, Clock, Info,
    FlaskConical, X, Zap, Filter, Globe, ShieldAlert, TrendingUp,
} from "lucide-react";

// ── ViewBox: lon 33–132  lat –4–52  →  800 × 460 px ──────────────────────────
const VB = { w: 800, h: 460, lonMin: 33, lonMax: 132, latMin: -4, latMax: 52 };

// ── Mercator-like equirectangular projection ──────────────────────────────────
function project(lon: number, lat: number) {
    return {
        x: ((lon - VB.lonMin) / (VB.lonMax - VB.lonMin)) * VB.w,
        y: ((VB.latMax - lat) / (VB.latMax - VB.latMin)) * VB.h,
    };
}

// Convert [lon, lat][] array → SVG path string using project()
function pts2path(pts: [number, number][]): string {
    return pts
        .map(([lon, lat], i) => {
            const p = project(lon, lat);
            return (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1);
        })
        .join(" ") + " Z";
}

// ── Country polygon data (simplified Natural Earth) ───────────────────────────
interface CountryPoly {
    id: string;
    name?: string;
    lx?: number;
    ly?: number;
    h?: boolean; // highlight (key hub country)
    pts: [number, number][];
}

const COUNTRY_POLYS: CountryPoly[] = [
    // ── Turkey ───────────────────────────────────────────────────────────────
    {
        id: "tr", name: "Turkey", lx: 35, ly: 39.0, pts: [
            [26, 41.5], [28, 41.5], [30, 41.2], [33, 37.8], [36, 36.8], [38, 37.0],
            [40.5, 37.2], [42, 37.2], [43.5, 37.5], [44.3, 38.5], [43, 39.5],
            [41, 40.8], [38, 40.8], [35, 38.5], [33, 37.5], [30, 38.2], [28, 39.2], [26, 41],
        ]
    },
    // ── Syria ────────────────────────────────────────────────────────────────
    {
        id: "sy", pts: [
            [36, 33.5], [36.9, 29.5], [38.5, 30.5], [39.5, 34.5], [40.5, 35.5],
            [42.2, 37.2], [38.8, 37.0], [37.2, 36.8], [36.1, 35.8],
        ]
    },
    // ── Jordan ───────────────────────────────────────────────────────────────
    {
        id: "jo", pts: [
            [34.9, 32.2], [36.9, 29.5], [38.5, 30.5], [39, 34.5], [36, 33.5], [35.5, 33.5],
        ]
    },
    // ── Israel/Palestine ─────────────────────────────────────────────────────
    {
        id: "il", pts: [
            [34.5, 31.5], [35.5, 31.8], [35.7, 33.5], [35.0, 33.5], [34.5, 32.0],
        ]
    },
    // ── Lebanon ──────────────────────────────────────────────────────────────
    {
        id: "lb", pts: [
            [35.1, 33.5], [36.2, 33.5], [36.5, 34.2], [35.9, 34.7], [35.1, 34.0],
        ]
    },
    // ── Iraq ─────────────────────────────────────────────────────────────────
    {
        id: "iq", name: "Iraq", lx: 44.5, ly: 33.0, pts: [
            [38.5, 30.5], [40.5, 31.8], [42, 31.0], [44.7, 29.5], [46.5, 28.7],
            [47.5, 28.0], [48.5, 28.5], [47.6, 29.9], [46.5, 30.0], [46.5, 31.5],
            [47.5, 33.0], [48.5, 34.5], [46.5, 37.3], [44.5, 37.5],
            [42.0, 37.2], [40.5, 35.5], [39.5, 34.5], [38.5, 30.5],
        ]
    },
    // ── Iran ─────────────────────────────────────────────────────────────────
    {
        id: "ir", name: "Iran", lx: 56.0, ly: 33.0, pts: [
            [44, 38.5], [46, 39.0], [49, 39.5], [52, 40.5], [55, 41.5],
            [57.5, 38.0], [60.5, 37.5], [61, 36.0], [63, 36.0], [62, 33.5],
            [61, 29.5], [60.5, 25.5], [57.5, 25.5], [55.5, 27.5],
            [52.5, 30.0], [50, 30.5], [48.5, 28.5], [47.6, 29.9], [46.5, 30.0],
            [46.5, 31.5], [47.5, 33.0], [48.5, 34.5], [46.5, 37.3], [44.5, 37.5],
        ]
    },
    // ── Saudi Arabia (highlighted) ───────────────────────────────────────────
    {
        id: "sa", name: "Saudi Arabia", lx: 46.0, ly: 23.5, h: true, pts: [
            [36.9, 29.5], [38.5, 30.5], [40.5, 31.8], [42.5, 31.0], [44.5, 29.5],
            [47.6, 29.9], [48.5, 28.5], [50.5, 26.0], [51.5, 24.5], [55.0, 22.0],
            [55.0, 21.5], [53.0, 20.5], [51.5, 19.0], [50.5, 17.5], [49.5, 16.5],
            [48.5, 15.5], [47.0, 15.5], [45.5, 14.0], [44.5, 13.5], [43.5, 13.0],
            [43.5, 15.0], [43.8, 17.5], [42.5, 17.5], [41.5, 17.2], [40.0, 17.0],
            [38.5, 17.5], [37.2, 19.5], [36.7, 21.0], [36.5, 24.0], [36.7, 27.0],
        ]
    },
    // ── Yemen ────────────────────────────────────────────────────────────────
    {
        id: "ye", name: "Yemen", lx: 47.0, ly: 15.5, pts: [
            [43.5, 13.0], [44.5, 13.5], [45.5, 14.0], [47.0, 15.5], [48.5, 15.5],
            [49.5, 16.5], [50.5, 17.5], [51.5, 18.5], [51.0, 16.5], [49.5, 14.5],
            [48.0, 13.5], [46.0, 12.5], [44.0, 12.0],
        ]
    },
    // ── Kuwait ───────────────────────────────────────────────────────────────
    {
        id: "kw", pts: [
            [46.5, 28.7], [47.6, 29.9], [48.5, 30.0], [48.5, 28.5], [47.5, 28.0],
        ]
    },
    // ── Qatar ────────────────────────────────────────────────────────────────
    {
        id: "qa", pts: [
            [50.5, 24.3], [51.6, 25.5], [51.6, 26.2], [51.2, 26.5], [50.8, 25.5],
        ]
    },
    // ── UAE (highlighted) ────────────────────────────────────────────────────
    {
        id: "ae", h: true, pts: [
            [51.5, 24.5], [51.5, 25.0], [52.5, 25.5], [54.0, 25.5], [55.1, 25.8],
            [56.4, 24.5], [56.0, 23.5], [54.5, 24.0], [53.5, 23.8],
        ]
    },
    // ── Oman ─────────────────────────────────────────────────────────────────
    {
        id: "om", name: "Oman", lx: 57.5, ly: 22.5, pts: [
            [55.0, 22.0], [56.5, 22.5], [58.5, 22.0], [59.5, 21.5], [60.0, 23.0],
            [58.5, 24.5], [57.5, 25.2], [56.5, 25.5], [55.1, 25.8], [55.5, 24.5], [55.5, 23.0],
        ]
    },
    // ── Afghanistan ──────────────────────────────────────────────────────────
    {
        id: "af", name: "Afghanistan", lx: 65.5, ly: 34.5, pts: [
            [61.0, 25.5], [62.5, 31.5], [63.5, 34.0], [66.5, 33.5], [68.5, 34.5],
            [70.5, 34.5], [72.0, 36.5], [73.5, 37.5], [71.5, 38.5], [69.0, 37.5],
            [66.5, 37.5], [63.5, 38.5], [61.5, 37.0], [61.0, 36.0], [63.0, 36.0], [62.0, 33.5], [61.0, 29.5],
        ]
    },
    // ── Pakistan ─────────────────────────────────────────────────────────────
    {
        id: "pk", name: "Pakistan", lx: 68.0, ly: 30.0, pts: [
            [60.5, 25.0], [62.0, 26.5], [62.5, 31.5], [61.0, 29.5], [62.0, 33.5],
            [64.5, 33.0], [66.5, 33.5], [68.5, 34.5], [70.5, 34.5], [72.5, 33.5],
            [74.5, 37.0], [74.0, 36.0], [72.0, 33.5], [71.0, 32.5], [70.0, 31.5],
            [68.5, 27.0], [66.0, 30.0], [63.5, 28.0], [62.5, 26.0], [61.0, 25.0],
        ]
    },
    // ── India ────────────────────────────────────────────────────────────────
    {
        id: "in", name: "India", lx: 79.5, ly: 22.0, pts: [
            [68.5, 23.0], [72.5, 22.5], [73.0, 20.5], [74.5, 16.0], [75.5, 14.5],
            [77.5, 8.5], [78.5, 9.5], [80.0, 10.5], [80.3, 13.5], [81.0, 16.0],
            [82.5, 20.0], [84.5, 21.5], [87.0, 22.5], [88.5, 23.0], [89.5, 22.5],
            [91.5, 23.0], [92.5, 22.5], [92.0, 20.0], [91.0, 18.0], [89.5, 25.0],
            [88.5, 27.5], [86.5, 28.5], [84.0, 28.0], [82.5, 27.5], [81.0, 28.5],
            [79.5, 29.5], [77.5, 31.5], [76.5, 32.0], [75.0, 32.5], [73.0, 34.5],
            [72.0, 36.0], [70.5, 34.5], [70.0, 32.0], [69.0, 30.0], [68.5, 27.0],
        ]
    },
    // ── Bangladesh ───────────────────────────────────────────────────────────
    {
        id: "bd", pts: [
            [88.5, 23.0], [89.5, 22.5], [91.5, 23.0], [92.5, 22.5], [92.0, 20.0], [89.5, 22.0],
        ]
    },
    // ── Sri Lanka ────────────────────────────────────────────────────────────
    {
        id: "lk", pts: [
            [80.0, 8.5], [81.5, 7.0], [81.2, 9.5], [80.5, 10.5],
        ]
    },
    // ── Myanmar ──────────────────────────────────────────────────────────────
    {
        id: "mm", name: "Myanmar", lx: 96.0, ly: 20.0, pts: [
            [92.5, 25.0], [94.0, 22.5], [95.0, 20.0], [97.5, 16.0], [98.5, 12.0], [98.0, 13.5],
            [99.0, 15.5], [100.5, 17.0], [101.0, 20.0], [101.5, 21.0], [101.0, 21.5], [100.5, 21.0],
            [99.0, 23.0], [97.5, 27.5], [95.0, 28.5], [92.0, 27.5],
        ]
    },
    // ── Laos ─────────────────────────────────────────────────────────────────
    {
        id: "la", pts: [
            [100.5, 21.5], [102.0, 22.5], [103.0, 22.5], [104.5, 22.0], [105.5, 18.0],
            [105.0, 16.5], [104.5, 14.5], [103.0, 14.5], [102.5, 13.5],
            [102.5, 16.0], [101.0, 20.0], [100.5, 21.5],
        ]
    },
    // ── Thailand ─────────────────────────────────────────────────────────────
    {
        id: "th", name: "Thailand", lx: 101.0, ly: 16.5, pts: [
            [101.0, 21.5], [100.5, 21.5], [99.0, 23.0], [97.5, 17.0], [98.5, 17.5],
            [99.5, 15.5], [100.5, 13.0], [101.5, 10.0], [101.0, 8.0], [100.5, 6.5],
            [102.0, 7.0], [103.5, 10.5], [102.5, 11.5], [102.5, 13.5], [104.5, 14.5],
            [105.0, 16.5], [105.5, 18.0], [104.5, 22.0], [102.0, 22.5], [101.0, 21.5],
        ]
    },
    // ── Cambodia ─────────────────────────────────────────────────────────────
    {
        id: "kh", pts: [
            [102.5, 13.5], [104.5, 14.5], [106.0, 12.0], [105.0, 10.5],
            [103.5, 10.5], [102.5, 11.5],
        ]
    },
    // ── Vietnam ──────────────────────────────────────────────────────────────
    {
        id: "vn", name: "Vietnam", lx: 107.0, ly: 17.0, pts: [
            [102.0, 22.5], [103.0, 22.5], [104.5, 22.0], [106.5, 21.5], [108.0, 21.0],
            [108.0, 16.0], [107.0, 14.0], [106.5, 11.0], [105.0, 10.5], [106.0, 12.0],
            [104.5, 14.5], [105.0, 16.5], [105.5, 18.0], [104.5, 22.0],
        ]
    },
    // ── Malaysia (peninsula) ─────────────────────────────────────────────────
    {
        id: "my", name: "Malaysia", lx: 102.0, ly: 4.5, pts: [
            [100.5, 5.5], [101.0, 6.5], [103.8, 7.5], [104.5, 6.5],
            [104.2, 4.5], [103.8, 2.5], [103.9, 1.3], [103.5, 1.5],
            [102.5, 2.0], [101.5, 3.0], [100.5, 4.0],
        ]
    },
    // ── Singapore (highlighted) ──────────────────────────────────────────────
    {
        id: "sg", h: true, pts: [
            [103.6, 1.1], [104.0, 1.1], [104.0, 1.5], [103.6, 1.5],
        ]
    },
    // ── Indonesia — Sumatra ──────────────────────────────────────────────────
    {
        id: "id-s", pts: [
            [95.5, 5.5], [97.5, 4.5], [100.5, 3.5], [102.5, 2.0], [104.5, 1.0],
            [106.0, -0.5], [106.0, -3.5], [104.0, -3.5], [102.0, -1.0], [99.5, 0.5], [97.0, 2.5],
        ]
    },
    // ── Indonesia — Borneo ───────────────────────────────────────────────────
    {
        id: "id-b", pts: [
            [109.0, 4.5], [114.5, 4.5], [116.0, 5.5], [117.5, 7.0], [118.5, 7.0],
            [118.5, 5.0], [116.5, 5.0], [115.0, 6.0], [114.0, 6.0], [112.0, 5.0], [110.5, 3.5], [109.0, 4.5],
        ]
    },
    // ── Indonesia — Java ─────────────────────────────────────────────────────
    {
        id: "id-j", pts: [
            [106.5, -6.5], [108.0, -6.5], [110.5, -7.0], [112.0, -7.5], [114.5, -8.5], [116.0, -9.5],
            [116.0, -8.5], [115.0, -8.0], [113.0, -7.0], [111.0, -6.8], [108.5, -6.5], [106.5, -6.5],
        ]
    },
    // ── Philippines ──────────────────────────────────────────────────────────
    {
        id: "ph", pts: [
            [118.0, 17.0], [119.5, 18.5], [121.5, 18.5], [122.0, 16.5],
            [120.5, 12.0], [118.5, 14.0], [118.0, 17.0],
        ]
    },
    // ── China (highlighted) ──────────────────────────────────────────────────
    {
        id: "cn", name: "China", lx: 108.0, ly: 35.0, h: true, pts: [
            [97.0, 28.5], [100.5, 22.5], [102.0, 22.5], [104.5, 22.0], [106.5, 21.5],
            [108.5, 21.0], [110.0, 20.0], [111.5, 21.5], [113.0, 22.5], [114.5, 22.5],
            [116.5, 23.5], [118.0, 24.5], [120.5, 27.5], [121.5, 31.2],
            [122.0, 32.0], [122.0, 38.0], [121.5, 40.5], [123.0, 42.0], [126.0, 48.0],
            [132.0, 48.5], [132.0, 52.0], [80.0, 52.0], [73.5, 52.0], [73.5, 43.0],
            [74.5, 40.5], [76.5, 39.5], [80.5, 35.0], [80.0, 31.0], [81.0, 29.5],
            [83.5, 28.5], [88.5, 28.5], [92.0, 28.5], [95.0, 28.5],
        ]
    },
    // ── Mongolia ─────────────────────────────────────────────────────────────
    {
        id: "mn", pts: [
            [87.5, 49.5], [91.5, 48.0], [96.0, 50.0], [100.0, 50.0], [104.0, 50.0],
            [110.0, 49.0], [113.0, 49.5], [119.0, 50.0], [122.0, 47.5], [119.0, 45.0],
            [115.0, 43.5], [110.0, 42.0], [107.0, 40.5], [100.0, 40.5],
            [95.0, 43.5], [91.5, 45.0], [87.5, 46.5],
        ]
    },
    // ── Taiwan ───────────────────────────────────────────────────────────────
    {
        id: "tw", pts: [
            [121.5, 25.5], [122.0, 24.5], [120.5, 22.0], [120.0, 23.5], [120.5, 24.5],
        ]
    },
    // ── South Korea ──────────────────────────────────────────────────────────
    {
        id: "kr", pts: [
            [126.0, 34.5], [129.5, 35.5], [129.5, 37.5], [127.5, 38.5], [126.0, 37.5], [124.5, 36.5],
        ]
    },
    // ── Kazakhstan (partial — visible area) ──────────────────────────────────
    {
        id: "kz", pts: [
            [51.5, 41.0], [55.5, 41.5], [60.0, 44.0], [64.0, 44.0], [68.0, 43.5],
            [73.5, 43.0], [73.5, 52.0], [68.0, 52.0], [60.0, 52.0], [51.5, 51.5],
            [49.5, 46.5], [50.5, 44.5], [51.5, 41.0],
        ]
    },
    // ── Uzbekistan / Turkmenistan ─────────────────────────────────────────────
    {
        id: "uz", pts: [
            [56.0, 37.5], [59.5, 37.5], [61.5, 37.0], [63.0, 36.5], [63.5, 38.5],
            [61.0, 41.0], [58.5, 42.0], [56.0, 41.5], [56.0, 37.5],
        ]
    },
    {
        id: "tm", pts: [
            [52.5, 39.5], [55.5, 41.5], [60.0, 44.0], [63.0, 36.5], [60.5, 37.5], [57.5, 38.0], [55.0, 41.5], [52.5, 39.5],
        ]
    },
    // ── Nepal / Bhutan ────────────────────────────────────────────────────────
    {
        id: "np", pts: [
            [80.0, 30.5], [81.5, 28.0], [83.5, 28.0], [86.5, 28.5], [88.0, 28.0],
            [88.0, 27.5], [84.0, 27.5], [80.0, 28.5],
        ]
    },
];

// ── City nodes ────────────────────────────────────────────────────────────────
const NODES = {
    riyadh: { lon: 46.7, lat: 24.7, label: "Riyadh", code: "SA", jurisdiction: "PDPL · NCA" },
    dubai: { lon: 55.3, lat: 25.2, label: "Dubai", code: "AE", jurisdiction: "DIFC · UAE" },
    singapore: { lon: 103.8, lat: 1.3, label: "Singapore", code: "SG", jurisdiction: "PDPA · MAS" },
    hongkong: { lon: 114.2, lat: 22.3, label: "Hong Kong (SAR)", code: "HK", jurisdiction: "PDPO · HK" },
    shanghai: { lon: 121.5, lat: 31.2, label: "Shanghai", code: "CN", jurisdiction: "PIPL · CSL" },
    beijing: { lon: 116.4, lat: 39.9, label: "Beijing", code: "CN", jurisdiction: "PIPL · CAC" },
} as const;

type NodeKey = keyof typeof NODES;
type PipeStatus = "compliant" | "approval_required" | "blocked" | "simulated_violation";
type Framework = "all" | "PIPL" | "PDPL" | "CSL" | "DSL";

interface Pipe {
    id: string;
    from: NodeKey;
    to: NodeKey;
    label: string;
    frameworks: string[];
    volume: "low" | "medium" | "high";
    status: PipeStatus;
    whatIfStatus?: PipeStatus;
    articles?: string[];
    penaltyExposure?: string;
    dataCategories?: string[];
}

const PIPES: Pipe[] = [
    {
        id: "ruh-dxb",
        from: "riyadh", to: "dubai",
        label: "GCC Hub Link",
        frameworks: ["PDPL"],
        volume: "high",
        status: "compliant",
        articles: ["PDPL Art. 12", "PDPL Art. 29"],
        penaltyExposure: "Up to SAR 5M",
        dataCategories: ["Personal Data", "Financial Records"],
    },
    {
        id: "dxb-sin",
        from: "dubai", to: "singapore",
        label: "Gulf-ASEAN Transit",
        frameworks: ["PDPL", "PIPL"],
        volume: "medium",
        status: "approval_required",
        articles: ["PIPL Art. 38", "CAC Standard Contracts required"],
        whatIfStatus: "blocked",
        penaltyExposure: "Up to \u00a550M or 5% annual revenue",
        dataCategories: ["Personal Data", "Biometric Data"],
    },
    {
        id: "sin-hkg",
        from: "singapore", to: "hongkong",
        label: "ASEAN-HKG Link",
        frameworks: ["PIPL"],
        volume: "medium",
        status: "compliant",
        penaltyExposure: "HKD 1M + potential imprisonment",
        dataCategories: ["Personal Data"],
    },
    {
        id: "hkg-sha",
        from: "hongkong", to: "shanghai",
        label: "Cross-Border PIPL",
        frameworks: ["PIPL", "DSL"],
        volume: "high",
        status: "approval_required",
        articles: ["PIPL Art. 38-40", "DSL Art. 31"],
        whatIfStatus: "simulated_violation",
        penaltyExposure: "Up to \u00a550M (PIPL) + DSL fines",
        dataCategories: ["Personal Data", "Important Data"],
    },
    {
        id: "sha-bej",
        from: "shanghai", to: "beijing",
        label: "CAC Oversight Path",
        frameworks: ["PIPL", "CSL", "DSL"],
        volume: "high",
        status: "compliant",
        penaltyExposure: "Regulatory audit exposure",
        dataCategories: ["Personal Data", "Critical Infrastructure Data"],
    },
    {
        id: "ruh-sha",
        from: "riyadh", to: "shanghai",
        label: "Sino-Saudi Data Corridor",
        frameworks: ["PIPL", "PDPL"],
        volume: "low",
        status: "approval_required",
        articles: ["PIPL Art. 38", "PDPL Art. 29", "CAC Pre-Transfer Assessment"],
        whatIfStatus: "simulated_violation",
        penaltyExposure: "Up to \u00a550M + SAR 5M dual exposure",
        dataCategories: ["Personal Data", "Financial Records", "Health Data"],
    },
    {
        id: "dxb-hkg",
        from: "dubai", to: "hongkong",
        label: "Gulf-HKG Express",
        frameworks: ["PDPL", "PIPL"],
        volume: "medium",
        status: "approval_required",
        articles: ["PIPL Art. 40 (1M+ users)", "PDPL Art. 33"],
        whatIfStatus: "blocked",
        penaltyExposure: "Up to \u00a550M (PIPL) + DIFC sanctions",
        dataCategories: ["Personal Data", "Financial Records"],
    },
];

// ── Color helpers ─────────────────────────────────────────────────────────────
function pipeColor(status: PipeStatus, isDark: boolean): string {
    switch (status) {
        case "compliant": return isDark ? "#00E676" : "#16a34a";
        case "approval_required": return isDark ? "#FFD600" : "#d97706";
        case "blocked": return isDark ? "#FF1744" : "#dc2626";
        case "simulated_violation": return isDark ? "#FF6B2B" : "#ea580c";
    }
}
function statusLabel(status: PipeStatus): string {
    switch (status) {
        case "compliant": return "Compliant";
        case "approval_required": return "CAC Approval Required";
        case "blocked": return "Data Transfer Blocked";
        case "simulated_violation": return "Violation Simulated";
    }
}
function statusIcon(status: PipeStatus) {
    switch (status) {
        case "compliant": return <CheckCircle2 className="h-3 w-3" />;
        case "approval_required": return <Clock className="h-3 w-3" />;
        case "blocked": return <X className="h-3 w-3" />;
        case "simulated_violation": return <AlertTriangle className="h-3 w-3" />;
    }
}
function scoreColor(score: number, isDark: boolean): string {
    if (score >= 80) return isDark ? "#00E676" : "#16a34a";
    if (score >= 50) return isDark ? "#FFD600" : "#d97706";
    return isDark ? "#FF1744" : "#dc2626";
}

// ── Bezier path for data corridor ─────────────────────────────────────────────
function cubicBez(from: { x: number; y: number }, to: { x: number; y: number }): string {
    const dx = (to.x - from.x) * 0.45;
    return `M${from.x},${from.y} C${from.x + dx},${from.y} ${to.x - dx},${to.y} ${to.x},${to.y}`;
}

// ── Compliance score per node ─────────────────────────────────────────────────
type ActivePipe = Pipe & { activeStatus: PipeStatus };
function calcScore(key: NodeKey, pipes: ActivePipe[]): number {
    const connected = pipes.filter(p => p.from === key || p.to === key);
    if (!connected.length) return 100;
    const scoreMap: Record<PipeStatus, number> = {
        compliant: 100, approval_required: 62, blocked: 18, simulated_violation: 14,
    };
    return Math.round(connected.reduce((s, p) => s + scoreMap[p.activeStatus], 0) / connected.length);
}

// SVG arc for score ring
function scoreArc(cx: number, cy: number, r: number, score: number): string {
    // Full circle: two 180-degree arcs (more robust than near-coincident-point hack)
    if (score >= 100)
        return `M ${cx} ${cy - r} a ${r} ${r} 0 1 0 0 ${2 * r} a ${r} ${r} 0 1 0 0 ${-(2 * r)}`;
    const endRad = ((score / 100) * 360 - 90) * (Math.PI / 180);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    return `M ${cx} ${cy - r} A ${r} ${r} 0 ${score > 50 ? 1 : 0} 1 ${x2.toFixed(3)} ${y2.toFixed(3)}`;
}

// ── Compass Rose ──────────────────────────────────────────────────────────────
function CompassRose({ cx, cy, s, color }: { cx: number; cy: number; s: number; color: string }) {
    return (
        <g opacity={0.45} aria-label="Compass rose">
            <polygon points={`${cx},${cy - s} ${cx - s * 0.26},${cy - s * 0.26} ${cx + s * 0.26},${cy - s * 0.26}`} fill={color} />
            <polygon points={`${cx},${cy + s} ${cx - s * 0.26},${cy + s * 0.26} ${cx + s * 0.26},${cy + s * 0.26}`} fill={color} opacity={0.35} />
            <polygon points={`${cx + s},${cy} ${cx + s * 0.26},${cy - s * 0.26} ${cx + s * 0.26},${cy + s * 0.26}`} fill={color} opacity={0.35} />
            <polygon points={`${cx - s},${cy} ${cx - s * 0.26},${cy - s * 0.26} ${cx - s * 0.26},${cy + s * 0.26}`} fill={color} opacity={0.35} />
            <circle cx={cx} cy={cy} r={s * 0.6} fill="none" stroke={color} strokeWidth={0.5} />
            <circle cx={cx} cy={cy} r={s * 0.12} fill={color} />
            <text x={cx} y={cy - s - 3} fill={color} fontSize="7" fontWeight="800" textAnchor="middle">N</text>
        </g>
    );
}

// ── Risk KPI Bar ──────────────────────────────────────────────────────────────
function RiskKPIBar({ counts, activePipes, isDark, C }: {
    counts: { compliant: number; approval_required: number; blocked: number; simulated_violation: number };
    activePipes: ActivePipe[];
    isDark: boolean;
    C: { cyan: string; muted: string; text: string; border: string };
}) {
    const riskWeights: Record<PipeStatus, number> = {
        compliant: 0, approval_required: 30, blocked: 85, simulated_violation: 100,
    };
    const totalRisk = activePipes.reduce((acc, p) => acc + riskWeights[p.activeStatus], 0);
    const riskScore = Math.max(0, Math.round(100 - totalRisk / Math.max(1, activePipes.length)));
    const riskColor = riskScore >= 80 ? (isDark ? "#00E676" : "#16a34a")
        : riskScore >= 55 ? (isDark ? "#FFD600" : "#d97706")
            : (isDark ? "#FF1744" : "#dc2626");
    const circ = 2 * Math.PI * 14;
    const dash = `${(riskScore / 100) * circ} ${circ}`;

    const tiles = [
        { label: "Corridors", value: activePipes.length, color: C.cyan },
        { label: "Compliant", value: counts.compliant, color: isDark ? "#00E676" : "#16a34a" },
        { label: "CAC Review", value: counts.approval_required, color: isDark ? "#FFD600" : "#d97706" },
        { label: "Blocked", value: counts.blocked + counts.simulated_violation, color: isDark ? "#FF1744" : "#dc2626" },
    ];

    return (
        <div style={{
            display: "flex", alignItems: "center",
            borderBottom: `1px solid ${C.border}`,
            background: isDark ? "rgba(3,8,20,0.65)" : "rgba(233,244,255,0.75)",
        }}>
            {tiles.map((tile, _i) => (
                <div key={tile.label} style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 8,
                    padding: "7px 14px",
                    borderRight: `1px solid ${C.border}`,
                }}>
                    <div style={{
                        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                        background: `${tile.color}14`, border: `1px solid ${tile.color}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 900, color: tile.color,
                    }}>
                        {tile.value}
                    </div>
                    <div style={{ fontSize: 8.5, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em" }}>
                        {tile.label}
                    </div>
                </div>
            ))}
            {/* Compliance score mini-gauge */}
            <div style={{ flexShrink: 0, padding: "7px 16px 7px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <TrendingUp style={{ width: 9, height: 9, color: C.muted }} />
                        <span style={{ fontSize: 8.5, color: C.muted, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.09em" }}>
                            Compliance Score
                        </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: riskColor, lineHeight: 1 }}>{riskScore}</span>
                        <span style={{ fontSize: 9, color: C.muted }}>/100</span>
                    </div>
                </div>
                <svg width={34} height={34} viewBox="0 0 34 34" style={{ flexShrink: 0 }} aria-hidden="true">
                    <circle cx={17} cy={17} r={14} fill="none" stroke={`${riskColor}20`} strokeWidth={4} />
                    <circle cx={17} cy={17} r={14} fill="none" stroke={riskColor} strokeWidth={4}
                        strokeDasharray={dash}
                        strokeLinecap="round"
                        style={{ transform: "rotate(-90deg)", transformOrigin: "17px 17px" }}
                    />
                </svg>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function SinoGulfHeatmap() {
    const { theme } = useTheme();
    const { t } = useLocale();
    const isDark = theme === "dark";

    const [whatIfMode, setWhatIfMode] = useState(false);
    const [hoveredPipe, setHoveredPipe] = useState<string | null>(null);
    const [selectedPipe, setSelectedPipe] = useState<string | null>(null);
    const [filterFw, setFilterFw] = useState<Framework>("all");
    const [tooltip, setTooltip] = useState<{ clientX: number; clientY: number; pipe: ActivePipe } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // ── Theme colour palette ─────────────────────────────────────────────────
    const C = useMemo(() => ({
        ocean: isDark ? "#030c1f" : "#d6e8f8",
        bg: isDark ? "#040f24" : "#eaf2fb",
        land: isDark ? "#0c1d3a" : "#c8d8ee",
        landAlt: isDark ? "#0e2248" : "#bdd0ea",
        landHigh: isDark ? "#112a52" : "#b2c8e6",
        landEdge: isDark ? "#1a3068" : "#8aaccd",
        grid: isDark ? "#0a1830" : "#c0cfe2",
        seaLabel: isDark ? "#2c4a78" : "#6888a8",
        text: isDark ? "#dce6ff" : "#1e293b",
        muted: isDark ? "#5a6fa8" : "#5c6b88",
        cyan: isDark ? "#00d4ff" : "#0284c7",
        accent: isDark ? "#00E676" : "#16a34a",
        border: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
        card: isDark ? "rgba(6,14,36,0.96)" : "rgba(248,252,255,0.97)",
    }), [isDark]);

    const activePipes = useMemo<ActivePipe[]>(() =>
        PIPES.map(p => ({ ...p, activeStatus: whatIfMode && p.whatIfStatus ? p.whatIfStatus : p.status })),
        [whatIfMode]);

    const filteredPipes = useMemo(() =>
        filterFw === "all" ? activePipes : activePipes.filter(p => p.frameworks.includes(filterFw)),
        [activePipes, filterFw]);

    const counts = useMemo(() => {
        const c = { compliant: 0, approval_required: 0, blocked: 0, simulated_violation: 0 };
        for (const p of activePipes) c[p.activeStatus]++;
        return c;
    }, [activePipes]);

    const handlePipeMouse = useCallback((e: React.MouseEvent, pipe: ActivePipe | null) => {
        if (pipe) { setHoveredPipe(pipe.id); setTooltip({ clientX: e.clientX, clientY: e.clientY, pipe }); }
        else { setHoveredPipe(null); setTooltip(null); }
    }, []);

    const handlePipeClick = useCallback((e: React.MouseEvent, pipe: ActivePipe) => {
        e.stopPropagation();
        setSelectedPipe(prev => prev === pipe.id ? null : pipe.id);
        setTooltip(null);
    }, []);

    const FW_PILLS: Framework[] = ["all", "PIPL", "PDPL", "CSL", "DSL"];

    return (
        <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: isDark
                ? "0 0 0 1px rgba(0,212,255,0.06), 0 8px 40px rgba(0,0,0,0.6)"
                : "0 4px 24px rgba(0,0,0,0.10)",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
        }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div style={{
                padding: "13px 18px 11px",
                borderBottom: `1px solid ${C.border}`,
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", flexWrap: "wrap", gap: 10,
                background: isDark ? "rgba(4,12,28,0.70)" : "rgba(240,248,255,0.80)",
                backdropFilter: "blur(8px)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: isDark ? `${C.cyan}18` : `${C.cyan}14`,
                        border: `1px solid ${C.cyan}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <Globe style={{ width: 15, height: 15, color: C.cyan }} />
                    </div>
                    <div>
                        <p style={{ color: C.muted, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0, marginBottom: 2 }}>
                            {t("heatmap.sinoGulf.sectionLabel", "Global Regulatory Heatmap")}
                        </p>
                        <h2 style={{ color: C.text, fontSize: 13.5, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
                            {t("heatmap.sinoGulf.title", "Sino-Gulf Data Residency Corridors")}
                        </h2>
                    </div>
                </div>

                {/* Controls row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* Framework filter */}
                    <div style={{ display: "flex", alignItems: "center", gap: 3, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderRadius: 8, padding: "3px 6px" }}>
                        <Filter style={{ width: 10, height: 10, color: C.muted }} />
                        {FW_PILLS.map(fw => (
                            <button key={fw} type="button" onClick={() => setFilterFw(fw)} style={{
                                fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                                border: `1px solid ${filterFw === fw ? C.cyan : "transparent"}`,
                                background: filterFw === fw ? `${C.cyan}1a` : "transparent",
                                color: filterFw === fw ? C.cyan : C.muted,
                                cursor: "pointer", transition: "all 0.15s",
                            }}>
                                {fw === "all" ? "All" : fw}
                            </button>
                        ))}
                    </div>

                    {/* Status badges */}
                    {([
                        ["compliant", "Compliant"],
                        ["approval_required", "Approval"],
                        ["blocked", "Blocked"],
                        ...(whatIfMode ? [["simulated_violation" as PipeStatus, "Simulated"]] : []),
                    ] as [PipeStatus, string][]).map(([status, lbl]) => (
                        <span key={status} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 9, fontWeight: 600,
                            color: pipeColor(status, isDark),
                            padding: "2px 7px",
                            border: `1px solid ${pipeColor(status, isDark)}35`,
                            borderRadius: 99,
                            background: `${pipeColor(status, isDark)}0e`,
                        }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: pipeColor(status, isDark), display: "inline-block" }} />
                            {lbl} ({counts[status]})
                        </span>
                    ))}

                    <Button
                        size="sm"
                        variant={whatIfMode ? "destructive" : "outline"}
                        onClick={() => { setWhatIfMode(v => !v); setSelectedPipe(null); setTooltip(null); }}
                        style={{ height: 26, fontSize: 10, fontWeight: 700, gap: 5, paddingLeft: 9, paddingRight: 9 }}
                    >
                        <FlaskConical className="h-3 w-3" />
                        {whatIfMode
                            ? t("heatmap.sinoGulf.exitSimulation", "Exit Simulation")
                            : t("heatmap.sinoGulf.whatIf", "What-If: 1M+ Records")}
                    </Button>
                </div>
            </div>

            {/* ── Risk KPI Bar ─────────────────────────────────────────────── */}
            <RiskKPIBar
                counts={counts}
                activePipes={activePipes}
                isDark={isDark}
                C={{ cyan: C.cyan, muted: C.muted, text: C.text, border: C.border }}
            />

            {/* ── Simulation Banner ─────────────────────────────────────────── */}
            {whatIfMode && (
                <div style={{
                    background: isDark ? "rgba(255,107,43,0.09)" : "rgba(234,88,12,0.06)",
                    borderBottom: `1px solid rgba(255,107,43,0.25)`,
                    padding: "7px 18px", display: "flex", alignItems: "center", gap: 8,
                }}>
                    <Zap style={{ color: "#FF6B2B", width: 12, height: 12, flexShrink: 0 }} />
                    <p style={{ color: isDark ? "#FF9B6B" : "#c2410c", fontSize: 10.5, margin: 0 }}>
                        <strong>Simulation active</strong> — 1M+ user-record transfer: Riyadh to Beijing.
                        Impacted regulations: <strong>PIPL Art. 38-40</strong>, <strong>PDPL Art. 29</strong>, <strong>DSL Art. 31</strong>.
                        Orange and red corridors require immediate remediation.
                    </p>
                </div>
            )}

            {/* ── Map ───────────────────────────────────────────────────────── */}
            <div ref={containerRef} style={{ position: "relative", flex: 1 }}>
                <style>{`
                    @keyframes djac-pipe-flow {
                        from { stroke-dashoffset: 40; }
                        to   { stroke-dashoffset: 0; }
                    }
                    @keyframes djac-node-pulse {
                        0%, 100% { opacity: 0.20; transform: scale(1); }
                        50%      { opacity: 0.06; transform: scale(1.4); }
                    }
                    @keyframes djac-node-alert {
                        0%, 100% { opacity: 0.40; transform: scale(1); }
                        50%      { opacity: 0.10; transform: scale(1.6); }
                    }
                `}</style>

                <svg
                    viewBox={`0 0 ${VB.w} ${VB.h}`}
                    style={{ width: "100%", display: "block", maxHeight: 460 }}
                    onClick={() => { setSelectedPipe(null); setTooltip(null); }}
                    aria-label="Global regulatory corridor map"
                >
                    {/* ── Defs ────────────────────────────────────────────── */}
                    <defs>
                        <filter id="sfh-glow-node" x="-60%" y="-60%" width="220%" height="220%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <filter id="sfh-glow-pipe" x="-30%" y="-100%" width="160%" height="300%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b" />
                            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        {/* Per-corridor gradient */}
                        {activePipes.map(pipe => {
                            const f = project(NODES[pipe.from].lon, NODES[pipe.from].lat);
                            const t2 = project(NODES[pipe.to].lon, NODES[pipe.to].lat);
                            const color = pipeColor(pipe.activeStatus, isDark);
                            return (
                                <linearGradient
                                    key={`lg-${pipe.id}`} id={`lg-${pipe.id}`}
                                    x1={f.x} y1={f.y} x2={t2.x} y2={t2.y}
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                                    <stop offset="50%" stopColor={color} stopOpacity="1.0" />
                                    <stop offset="100%" stopColor={color} stopOpacity="0.4" />
                                </linearGradient>
                            );
                        })}
                        {/* Ocean vignette */}
                        <radialGradient id="sfh-vignette" cx="50%" cy="60%" r="60%">
                            <stop offset="0%" stopColor={C.ocean} stopOpacity="0" />
                            <stop offset="100%" stopColor={C.ocean} stopOpacity="0.55" />
                        </radialGradient>
                        {/* Soft bloom filter for hub-country glow */}
                        <filter id="sfh-hub-blur" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
                        </filter>
                        {/* Ocean depth gradient — lighter at horizon, deeper in foreground */}
                        <linearGradient id="sfh-ocean-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={isDark ? "#020a1a" : "#cde3f5"} />
                            <stop offset="55%" stopColor={C.ocean} />
                            <stop offset="100%" stopColor={isDark ? "#010714" : "#b8d6ef"} />
                        </linearGradient>
                        {/* Node body radial gradient — inner glow */}
                        <radialGradient id="sfh-node-body" cx="38%" cy="35%" r="65%">
                            <stop offset="0%" stopColor={isDark ? "#1a4070" : "#ffffff"} />
                            <stop offset="100%" stopColor={isDark ? "#06102a" : "#d8eeff"} />
                        </radialGradient>
                    </defs>

                    {/* Ocean background — depth gradient */}
                    <rect width={VB.w} height={VB.h} fill="url(#sfh-ocean-grad)" />

                    {/* Graticule grid (10° spacing) */}
                    {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(f => (
                        <line key={`gy${f}`}
                            x1={0} y1={VB.h * f} x2={VB.w} y2={VB.h * f}
                            stroke={C.grid} strokeWidth={0.4} />
                    ))}
                    {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(f => (
                        <line key={`gx${f}`}
                            x1={VB.w * f} y1={0} x2={VB.w * f} y2={VB.h}
                            stroke={C.grid} strokeWidth={0.4} />
                    ))}

                    {/* ── Country land shapes ──────────────────────────────── */}
                    {COUNTRY_POLYS.map(c => (
                        <path
                            key={c.id}
                            d={pts2path(c.pts)}
                            fill={c.h ? C.landHigh : C.land}
                            stroke={C.landEdge}
                            strokeWidth={0.55}
                            opacity={0.92}
                        />
                    ))}

                    {/* ── Water bodies at correct geographic positions ──────── */}
                    {/* Persian / Arabian Gulf: lon 48-56, lat 24-27 */}
                    {(() => {
                        const p1 = project(48, 27); const p2 = project(57, 24);
                        const cx = (p1.x + p2.x) / 2; const cy = (p1.y + p2.y) / 2;
                        return <ellipse cx={cx} cy={cy} rx={Math.abs(p2.x - p1.x) / 2} ry={Math.abs(p2.y - p1.y) / 2 + 5} fill={C.ocean} opacity={0.85} />;
                    })()}
                    {/* Red Sea: lon 32-43, lat 12-30 */}
                    {(() => {
                        const pa = project(32, 26); const pb = project(44, 12);
                        return <ellipse cx={(pa.x + pb.x) / 2} cy={(pa.y + pb.y) / 2} rx={Math.abs(pb.x - pa.x) / 2} ry={Math.abs(pb.y - pa.y) / 2} fill={C.ocean} opacity={0.82} />;
                    })()}
                    {/* Arabian Sea: lon 55-72, lat 5-25 */}
                    {(() => {
                        const pa = project(55, 24); const pb = project(74, 5);
                        return <ellipse cx={(pa.x + pb.x) / 2} cy={(pa.y + pb.y) / 2 + 10} rx={Math.abs(pb.x - pa.x) / 2} ry={Math.abs(pb.y - pa.y) / 2} fill={C.ocean} opacity={0.78} />;
                    })()}
                    {/* Bay of Bengal: lon 80-100, lat 5-22 */}
                    {(() => {
                        const pa = project(80, 22); const pb = project(100, 5);
                        return <ellipse cx={(pa.x + pb.x) / 2} cy={(pa.y + pb.y) / 2} rx={Math.abs(pb.x - pa.x) / 2} ry={Math.abs(pb.y - pa.y) / 2} fill={C.ocean} opacity={0.75} />;
                    })()}
                    {/* South China Sea: lon 108-120, lat 0-22 */}
                    {(() => {
                        const pa = project(108, 22); const pb = project(121, 0);
                        return <ellipse cx={(pa.x + pb.x) / 2} cy={(pa.y + pb.y) / 2} rx={Math.abs(pb.x - pa.x) / 2} ry={Math.abs(pb.y - pa.y) / 2} fill={C.ocean} opacity={0.75} />;
                    })()}
                    {/* Gulf of Thailand / Andaman Sea */}
                    {(() => {
                        const pa = project(97, 15); const pb = project(106, 3);
                        return <ellipse cx={(pa.x + pb.x) / 2} cy={(pa.y + pb.y) / 2} rx={Math.abs(pb.x - pa.x) / 2} ry={Math.abs(pb.y - pa.y) / 2} fill={C.ocean} opacity={0.70} />;
                    })()}

                    {/* Vignette overlay */}
                    <rect width={VB.w} height={VB.h} fill="url(#sfh-vignette)" pointerEvents="none" />

                    {/* ── Country name labels ──────────────────────────────── */}
                    {COUNTRY_POLYS.filter(c => !!c.name && c.lx != null).map(c => {
                        const p = project(c.lx!, c.ly!);
                        return (
                            <text
                                key={"lbl-" + c.id}
                                x={p.x} y={p.y}
                                fill={c.h ? (isDark ? "#8fb8e0" : "#2e6a9e") : C.seaLabel}
                                fontSize={c.h ? 6.5 : 5.5}
                                fontWeight={c.h ? 700 : 400}
                                textAnchor="middle"
                                opacity={c.h ? 0.78 : 0.60}
                                style={{ pointerEvents: "none", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.22))" } as React.CSSProperties}
                            >
                                {c.name}
                            </text>
                        );
                    })}

                    {/* ── Geographic labels ────────────────────────────────── */}
                    <text x={project(52, 26).x} y={project(52, 26).y} fill={C.seaLabel} fontSize={7} fontWeight={700} textAnchor="middle" opacity={0.7} letterSpacing="0.08em">PERSIAN GULF</text>
                    <text x={project(38, 20).x} y={project(38, 20).y} fill={C.seaLabel} fontSize={7} fontWeight={700} textAnchor="middle" opacity={0.65} letterSpacing="0.08em">RED SEA</text>
                    <text x={project(63, 14).x} y={project(63, 14).y} fill={C.seaLabel} fontSize={8} fontWeight={700} textAnchor="middle" opacity={0.60} letterSpacing="0.07em">ARABIAN SEA</text>
                    <text x={project(89, 12).x} y={project(89, 12).y} fill={C.seaLabel} fontSize={8} fontWeight={700} textAnchor="middle" opacity={0.60} letterSpacing="0.07em">BAY OF BENGAL</text>
                    <text x={project(114, 10).x} y={project(114, 10).y} fill={C.seaLabel} fontSize={8} fontWeight={700} textAnchor="middle" opacity={0.60} letterSpacing="0.07em">SOUTH CHINA SEA</text>

                    {/* ── Latitude / longitude tick labels ────────────────── */}
                    {[50, 40, 30, 20, 10, 0].map(lat => {
                        const y = project(VB.lonMin, lat).y;
                        return (
                            <text key={lat} x={6} y={y + 3} fill={C.seaLabel} fontSize={6} opacity={0.5}>
                                {lat === 0 ? "EQ" : `${lat}N`}
                            </text>
                        );
                    })}
                    {[40, 60, 80, 100, 120].map(lon => {
                        const x = project(lon, VB.latMax).x;
                        return (
                            <text key={lon} x={x} y={VB.h - 4} fill={C.seaLabel} fontSize={6} opacity={0.4} textAnchor="middle">
                                {lon}E
                            </text>
                        );
                    })}

                    {/* ── Hub country atmospheric glow overlays ────────────── */}
                    {(() => {
                        const hubs: [number, number, string, number, number][] = [
                            [46.0, 23.5, C.cyan, 62, 46],  // Saudi Arabia
                            [55.2, 24.8, C.cyan, 20, 14],  // UAE
                            [114.2, 22.3, isDark ? "#FFD600" : "#d97706", 22, 15],  // Hong Kong (SAR)
                            [103.8, 1.3, C.cyan, 12, 9],  // Singapore
                            [108.0, 35.0, isDark ? "#FF6B2B" : "#ea580c", 105, 80],  // China
                        ];
                        return (
                            <g filter="url(#sfh-hub-blur)" opacity={isDark ? 0.30 : 0.18}>
                                {hubs.map(([lon, lat, color, rx, ry], i) => {
                                    const p = project(lon, lat);
                                    return <ellipse key={i} cx={p.x} cy={p.y} rx={rx} ry={ry} fill={color} />;
                                })}
                            </g>
                        );
                    })()}

                    {/* ── Data-transfer corridors ──────────────────────────── */}
                    {filteredPipes.map(pipe => {
                        const f = project(NODES[pipe.from].lon, NODES[pipe.from].lat);
                        const t2 = project(NODES[pipe.to].lon, NODES[pipe.to].lat);
                        const d = cubicBez(f, t2);
                        const color = pipeColor(pipe.activeStatus, isDark);
                        const isHov = hoveredPipe === pipe.id;
                        const isSel = selectedPipe === pipe.id;
                        const speed = pipe.volume === "high" ? 2.2
                            : pipe.volume === "medium" ? 3.4 : 5.2;

                        return (
                            <g key={pipe.id}>
                                {/* Glow on hover / select */}
                                {(isHov || isSel) && (
                                    <path d={d} fill="none" stroke={color} strokeWidth={10}
                                        opacity={0.13} filter="url(#sfh-glow-pipe)" />
                                )}
                                {/* Shadow track */}
                                <path d={d} fill="none" stroke={color} strokeWidth={4.5} opacity={0.08} />
                                {/* Gradient line */}
                                <path
                                    id={`sfh-pipe-${pipe.id}`}
                                    d={d} fill="none"
                                    stroke={`url(#lg-${pipe.id})`}
                                    strokeWidth={isHov || isSel ? 2.8 : 1.9}
                                    strokeLinecap="round"
                                />
                                {/* Animated dashes */}
                                <path d={d} fill="none" stroke={color}
                                    strokeWidth={isHov || isSel ? 2.8 : 1.9}
                                    strokeLinecap="round"
                                    strokeDasharray="7 16"
                                    opacity={0.78}
                                    style={{
                                        animation: "djac-pipe-flow linear infinite",
                                        animationDuration: `${speed}s`,
                                    }}
                                />
                                {/* Moving data-packet dots */}
                                {([0, 0.35, 0.70] as const).map((offset, i) => (
                                    <circle key={i} r={pipe.volume === "high" ? 2.8 : 2.2}
                                        fill={color} opacity={0.9} filter="url(#sfh-glow-node)">
                                        <animateMotion
                                            dur={`${speed}s`}
                                            begin={`${-(offset * speed).toFixed(2)}s`}
                                            repeatCount="indefinite"
                                        >
                                            <mpath href={`#sfh-pipe-${pipe.id}`} />
                                        </animateMotion>
                                    </circle>
                                ))}
                                {/* Invisible wide hit-area */}
                                <path d={d} fill="none" stroke="transparent" strokeWidth={22}
                                    style={{ cursor: "pointer" }}
                                    onMouseEnter={e => handlePipeMouse(e, pipe)}
                                    onMouseMove={e => handlePipeMouse(e, pipe)}
                                    onMouseLeave={e => handlePipeMouse(e, null)}
                                    onClick={e => handlePipeClick(e, pipe)}
                                />
                            </g>
                        );
                    })}

                    {/* ── Hub nodes ───────────────────────────────────────── */}
                    {(Object.entries(NODES) as [NodeKey, typeof NODES[NodeKey]][]).map(([key, node]) => {
                        const { x, y } = project(node.lon, node.lat);
                        const score = calcScore(key, activePipes);
                        const sColor = scoreColor(score, isDark);
                        const arcPath = scoreArc(x, y, 15, score);
                        const hasAlert = whatIfMode && activePipes.some(
                            p => (p.from === key || p.to === key) &&
                                (p.activeStatus === "simulated_violation" || p.activeStatus === "blocked"),
                        );
                        const accent = hasAlert ? pipeColor("simulated_violation", isDark) : C.cyan;
                        // Flip labels above the node when it is near the bottom edge (Singapore)
                        const flipUp = y > VB.h - 70;
                        // Flip labels to the left when the node is near the right edge (Shanghai, Beijing)
                        const flipLeft = x > VB.w - 120;
                        const lblAnchor = flipLeft ? "end" : "middle";
                        const lblX = flipLeft ? x - 22 : x;
                        const lbl1y = flipUp ? y - 31 : y + 30;
                        const lbl2y = flipUp ? y - 43 : y + 41;

                        return (
                            <g key={key}>
                                {/* Outermost halo — fade-pulse.
                                    MUST use transform-box:fill-box so the CSS scale
                                    animates around the element's own center, not the
                                    SVG viewport origin (which causes displacement on
                                    responsive / scaled SVGs). */}
                                <circle cx={x} cy={y} r={26} fill={`${accent}05`}
                                    stroke={accent} strokeWidth={0.6}
                                    style={{
                                        animation: `${hasAlert ? "djac-node-alert" : "djac-node-pulse"} ${hasAlert ? 1.5 : 4.0}s ease-in-out infinite`,
                                        transformBox: "fill-box",
                                        transformOrigin: "center",
                                    } as React.CSSProperties}
                                />
                                {/* Mid ring — faster pulse */}
                                <circle cx={x} cy={y} r={21} fill="none" stroke={accent} strokeWidth={0.9}
                                    style={{
                                        animation: `${hasAlert ? "djac-node-alert" : "djac-node-pulse"} ${hasAlert ? 1.0 : 2.8}s ease-in-out infinite`,
                                        animationDelay: hasAlert ? "0s" : "0.5s",
                                        transformBox: "fill-box",
                                        transformOrigin: "center",
                                    } as React.CSSProperties}
                                />
                                {/* Score ring track */}
                                <circle cx={x} cy={y} r={15} fill="none"
                                    stroke={isDark ? `${sColor}22` : `${sColor}1a`} strokeWidth={4.5} />
                                {/* Score arc */}
                                <path d={arcPath} fill="none" stroke={sColor} strokeWidth={4} strokeLinecap="round" />
                                {/* Node body — radial gradient for depth */}
                                <circle cx={x} cy={y} r={9.5}
                                    fill="url(#sfh-node-body)"
                                    stroke={accent}
                                    strokeWidth={hasAlert ? 2.4 : 1.8}
                                    filter="url(#sfh-glow-node)"
                                />
                                {/* Score % — centred inside node body */}
                                <text x={x} y={y} fill={sColor}
                                    fontSize={score >= 100 ? 5.2 : score >= 10 ? 6.8 : 7.5}
                                    fontWeight={900} textAnchor="middle"
                                    dominantBaseline="central"
                                    style={{ pointerEvents: "none" } as React.CSSProperties}>
                                    {score}%
                                </text>
                                {/* City · CODE — single inline label, no floating chip */}
                                <text x={lblX} y={lbl1y} fill={C.text}
                                    fontSize={9} fontWeight={700} textAnchor={lblAnchor}
                                    style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.35))" } as React.CSSProperties}>
                                    {node.label}
                                    <tspan fill={accent} fontSize={7} fontWeight={800} dx={3}>{node.code}</tspan>
                                </text>
                                {/* Jurisdiction */}
                                <text x={lblX} y={lbl2y} fill={C.muted}
                                    fontSize={6.5} textAnchor={lblAnchor} opacity={0.85}>
                                    {node.jurisdiction}
                                </text>
                            </g>
                        );
                    })}

                    {/* ── Compass rose ─────────────────────────────────────── */}
                    <CompassRose cx={756} cy={422} s={16} color={C.muted} />

                    {/* ── Scale bar ────────────────────────────────────────── */}
                    <g opacity={0.5}>
                        {(() => {
                            const x1 = 26; const x2 = 26 + ((10 / 99) * VB.w);
                            return <>
                                <line x1={x1} y1={438} x2={x2} y2={438} stroke={C.muted} strokeWidth={1} />
                                <line x1={x1} y1={434} x2={x1} y2={442} stroke={C.muted} strokeWidth={1} />
                                <line x1={x2} y1={434} x2={x2} y2={442} stroke={C.muted} strokeWidth={1} />
                                <text x={(x1 + x2) / 2} y={452} fill={C.muted} fontSize={6.5} textAnchor="middle">~1,100 km</text>
                            </>;
                        })()}
                    </g>
                </svg>

                {/* ── Hover Tooltip ─────────────────────────────────────────── */}
                {tooltip && containerRef.current && (() => {
                    const rect = containerRef.current.getBoundingClientRect();
                    const color = pipeColor(tooltip.pipe.activeStatus, isDark);
                    const TW = 240; const TH = 200;
                    let left = tooltip.clientX - rect.left + 16;
                    let top = tooltip.clientY - rect.top - 16;
                    if (left + TW > rect.width - 8) left = tooltip.clientX - rect.left - TW - 8;
                    if (top + TH > rect.height - 8) top = tooltip.clientY - rect.top - TH - 8;
                    return (
                        <div style={{
                            position: "absolute", left, top,
                            pointerEvents: "none", zIndex: 20,
                            background: isDark ? "rgba(4,12,32,0.96)" : "rgba(240,248,255,0.97)",
                            backdropFilter: "blur(16px)",
                            border: `1px solid ${color}45`,
                            borderTop: `2px solid ${color}`,
                            borderRadius: 10,
                            padding: "10px 13px",
                            boxShadow: `0 8px 32px ${color}1e, 0 2px 10px rgba(0,0,0,0.32)`,
                            minWidth: 208,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                                <div style={{ color, flexShrink: 0 }}>{statusIcon(tooltip.pipe.activeStatus)}</div>
                                <span style={{ color: C.text, fontSize: 12, fontWeight: 800 }}>{tooltip.pipe.label}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
                                <span style={{ color, fontSize: 10, fontWeight: 700 }}>{statusLabel(tooltip.pipe.activeStatus)}</span>
                            </div>
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 6 }}>
                                {tooltip.pipe.frameworks.map(fw => (
                                    <span key={fw} style={{
                                        fontSize: 9, fontWeight: 800, color,
                                        background: `${color}14`, border: `1px solid ${color}38`,
                                        borderRadius: 4, padding: "1px 5px",
                                    }}>{fw}</span>
                                ))}
                                <span style={{ fontSize: 9, color: C.muted, alignSelf: "center", marginLeft: 2 }}>{tooltip.pipe.volume} volume</span>
                            </div>
                            {/* Penalty exposure */}
                            {tooltip.pipe.penaltyExposure && (
                                <div style={{
                                    display: "flex", alignItems: "center", gap: 5,
                                    marginBottom: 5, padding: "3px 6px",
                                    background: isDark ? "rgba(255,107,43,0.10)" : "rgba(234,88,12,0.07)",
                                    borderRadius: 5, border: `1px solid rgba(255,107,43,0.22)`,
                                }}>
                                    <ShieldAlert style={{ width: 9, height: 9, color: isDark ? "#FF9B6B" : "#c2410c", flexShrink: 0 }} />
                                    <span style={{ color: isDark ? "#FF9B6B" : "#c2410c", fontSize: 9, fontWeight: 700 }}>
                                        {tooltip.pipe.penaltyExposure}
                                    </span>
                                </div>
                            )}
                            {/* Data categories */}
                            {tooltip.pipe.dataCategories && tooltip.pipe.dataCategories.length > 0 && (
                                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginBottom: 5 }}>
                                    {tooltip.pipe.dataCategories.map(dc => (
                                        <span key={dc} style={{
                                            fontSize: 8, color: C.muted,
                                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                                            border: `1px solid ${C.border}`,
                                            borderRadius: 3, padding: "1px 5px",
                                        }}>{dc}</span>
                                    ))}
                                </div>
                            )}
                            {/* Articles */}
                            {tooltip.pipe.articles && tooltip.pipe.articles.length > 0 && (
                                <div style={{ borderTop: `1px solid ${color}20`, paddingTop: 6 }}>
                                    <span style={{ fontSize: 7.5, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Required actions</span>
                                    {tooltip.pipe.articles.slice(0, 2).map((a, i) => (
                                        <p key={i} style={{ color: isDark ? "#FF9B6B" : "#c2410c", fontSize: 9.5, margin: i === 0 ? "3px 0 0" : "2px 0 0" }}>
                                            {a}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* ── Selected Corridor Detail Panel ────────────────────────────── */}
            {selectedPipe && (() => {
                const pipe = activePipes.find(p => p.id === selectedPipe)!;
                const color = pipeColor(pipe.activeStatus, isDark);
                const fromNode = NODES[pipe.from];
                const toNode = NODES[pipe.to];
                return (
                    <div style={{
                        borderTop: `1px solid ${color}40`,
                        background: isDark ? `${color}07` : `${color}05`,
                        padding: "11px 18px",
                        display: "flex", alignItems: "flex-start", gap: 12,
                    }}>
                        <div style={{ color, flexShrink: 0, marginTop: 2 }}>
                            {statusIcon(pipe.activeStatus)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
                                <span style={{ color: C.text, fontSize: 13, fontWeight: 800 }}>{pipe.label}</span>
                                <span style={{ color, fontSize: 11, fontWeight: 600 }}>— {statusLabel(pipe.activeStatus)}</span>
                                <span style={{ color: C.muted, fontSize: 10 }}>
                                    {fromNode.code} {fromNode.label} &rarr; {toNode.code} {toNode.label}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: pipe.articles ? 7 : 0 }}>
                                {pipe.frameworks.map(fw => (
                                    <Badge key={fw} variant="outline" style={{ fontSize: 10, height: 18, borderColor: `${color}50`, color }}>
                                        {fw}
                                    </Badge>
                                ))}
                                <Badge variant="outline" style={{ fontSize: 10, height: 18, borderColor: `${C.muted}50`, color: C.muted }}>
                                    {pipe.volume} volume
                                </Badge>
                            </div>
                            {pipe.articles && (
                                <p style={{ color: isDark ? "#FF9B6B" : "#c2410c", fontSize: 10.5, margin: 0 }}>
                                    <strong>Required actions:</strong> {pipe.articles.join("  ·  ")}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setSelectedPipe(null)}
                            aria-label="Close corridor detail"
                            style={{ color: C.muted, background: "none", border: "none", cursor: "pointer", padding: 2, flexShrink: 0 }}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                );
            })()}

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <div style={{
                padding: "7px 18px",
                borderTop: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 6,
                background: isDark ? "rgba(4,10,24,0.5)" : "rgba(240,248,255,0.6)",
            }}>
                <Info style={{ color: C.muted, width: 11, height: 11, flexShrink: 0 }} />
                <p style={{ color: C.muted, fontSize: 9, margin: 0 }}>
                    {t("heatmap.sinoGulf.hint", "Hover a corridor for details · Click to pin · Filter by regulatory framework · What-If simulates a 1M+ record mass-transfer scenario")}
                </p>
            </div>
        </div>
    );
}
