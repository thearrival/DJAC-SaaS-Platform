import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useLocale } from "@/contexts/useLocale";

interface OrbNode {
    code: string;
    color: string;
}

interface FrameworkRelationshipOrbProps {
    nodes?: OrbNode[];
    centerLabel?: string;
    compact?: boolean;
}

const DEFAULT_NODES: OrbNode[] = [
    { code: "CSL", color: "hsl(var(--primary))" },
    { code: "DSL", color: "hsl(var(--secondary))" },
    { code: "PIPL", color: "hsl(var(--success))" },
    { code: "PDPL", color: "hsl(var(--warning))" },
    { code: "NCA", color: "hsl(var(--destructive))" },
];

const RADIUS = 80;
const SVG_SIZE = 240;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;

export function FrameworkRelationshipOrb({
    nodes = DEFAULT_NODES,
    centerLabel = "DJAC",
    compact = false,
}: FrameworkRelationshipOrbProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const reduceMotion = useReducedMotion();
    const { locale } = useLocale();
    const safeLocale = locale === "ar" || locale === "zh" ? locale : "en";

    const copy = {
        en: { title: "Framework", accent: "Nexus", subtitle: "Cross-border compliance relationships" },
        ar: { title: "إطار", accent: "الترابط", subtitle: "علاقات الامتثال العابر للحدود" },
        zh: { title: "框架", accent: "关联枢纽", subtitle: "跨境合规关系" },
    }[safeLocale];

    const fwData = nodes.map((n, i) => ({
        ...n,
        angle: -90 + (360 / nodes.length) * i,
    }));

    return (
        <div className={compact ? undefined : "glass-card rounded-xl p-4"}>
            {!compact && (
                <>
                    <h3 className="font-display font-semibold text-foreground text-sm mb-1">
                        {copy.title} <span className="text-gradient-cyan">{copy.accent}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mb-1">{copy.subtitle}</p>
                </>
            )}
            <div style={{ display: "flex", justifyContent: "center" }}>
                <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
                    <defs>
                        <filter id="orbGlow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <filter id="strongGlow">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="hsl(185,100%,49%)" stopOpacity="0.25" />
                            <stop offset="50%" stopColor="hsl(260,74%,56%)" stopOpacity="0.1" />
                            <stop offset="100%" stopColor="hsl(185,100%,49%)" stopOpacity="0" />
                        </radialGradient>
                    </defs>

                    {/* Animated center glow */}
                    <motion.circle cx={CX} cy={CY} r="55" fill="url(#centerGrad)"
                        animate={reduceMotion ? undefined : { r: [50, 58, 50], opacity: [0.5, 0.8, 0.5] }}
                        transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }} />

                    {/* Orbiting ring tracks */}
                    {[0, 1, 2].map((ring) => (
                        <motion.circle key={`ring-${ring}`} cx={CX} cy={CY} r={RADIUS - 10 + ring * 15}
                            fill="none" stroke="hsl(var(--primary))"
                            strokeOpacity={0.06 + ring * 0.02} strokeWidth="0.5"
                            strokeDasharray={ring === 1 ? "4 8" : ring === 2 ? "2 12" : "8 4"}
                            animate={reduceMotion ? undefined : { rotate: ring % 2 === 0 ? 360 : -360 }}
                            transition={reduceMotion ? undefined : { duration: 20 + ring * 10, repeat: Infinity, ease: "linear" }}
                            style={{ transformOrigin: `${CX}px ${CY}px` }} />
                    ))}

                    {/* Orbit particles */}
                    {[0, 1, 2, 3].map((p) => (
                        <motion.circle key={`op-${p}`} r="1.5" fill="hsl(var(--primary))" filter="url(#orbGlow)"
                            animate={reduceMotion ? undefined : {
                                cx: fwData.map((fw) => CX + RADIUS * Math.cos(((fw.angle + p * 90) * Math.PI) / 180)),
                                cy: fwData.map((fw) => CY + RADIUS * Math.sin(((fw.angle + p * 90) * Math.PI) / 180)),
                            }}
                            transition={reduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: "linear", delay: p * 2 }} />
                    ))}

                    {/* Connection lines with animated dash */}
                    {fwData.map((fw, i) => {
                        const x1 = CX + RADIUS * Math.cos((fw.angle * Math.PI) / 180);
                        const y1 = CY + RADIUS * Math.sin((fw.angle * Math.PI) / 180);
                        return fwData.slice(i + 1).map((fw2, j) => {
                            const x2 = CX + RADIUS * Math.cos((fw2.angle * Math.PI) / 180);
                            const y2 = CY + RADIUS * Math.sin((fw2.angle * Math.PI) / 180);
                            const isHi = hovered === fw.code || hovered === fw2.code;
                            return (
                                <motion.line key={`l-${i}-${j}`}
                                    x1={x1} y1={y1} x2={x2} y2={y2}
                                    stroke="hsl(var(--primary))"
                                    strokeOpacity={isHi ? 0.5 : 0.12}
                                    strokeWidth={isHi ? 1.5 : 0.5}
                                    strokeDasharray="4 4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1, strokeDashoffset: [0, -16] }}
                                    transition={{
                                        opacity: { duration: 0.5, delay: (i + j) * 0.1 },
                                        strokeDashoffset: { duration: 3, repeat: Infinity, ease: "linear" },
                                    }} />
                            );
                        });
                    })}

                    {/* Framework nodes */}
                    {fwData.map((fw, i) => {
                        const x = CX + RADIUS * Math.cos((fw.angle * Math.PI) / 180);
                        const y = CY + RADIUS * Math.sin((fw.angle * Math.PI) / 180);
                        const isHovered = hovered === fw.code;
                        return (
                            <motion.g key={fw.code}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.15, duration: 0.6, type: "spring" }}
                                onMouseEnter={() => setHovered(fw.code)}
                                onMouseLeave={() => setHovered(null)}
                                style={{ cursor: "pointer" }}
                            >
                                <motion.circle cx={x} cy={y} r="24" fill="none"
                                    stroke={fw.color} strokeWidth="0.5"
                                    strokeOpacity={isHovered ? 0.6 : 0.2}
                                    animate={!reduceMotion && isHovered ? { r: [24, 28, 24] } : {}}
                                    transition={!reduceMotion && isHovered ? { duration: 1.5, repeat: Infinity } : undefined} />
                                <circle cx={x} cy={y} r="18"
                                    fill="hsl(var(--card))" stroke={fw.color}
                                    strokeWidth={isHovered ? 2.5 : 1.5}
                                    filter={isHovered ? "url(#strongGlow)" : "url(#orbGlow)"} />
                                <text x={x} y={y + 4} textAnchor="middle"
                                    fill={fw.color} fontSize="8" fontFamily="JetBrains Mono, monospace" fontWeight="700">
                                    {fw.code}
                                </text>
                            </motion.g>
                        );
                    })}

                    {/* Center node with pulse */}
                    <motion.g initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.8, type: "spring", stiffness: 100 }}>
                        <motion.circle cx={CX} cy={CY} r="30" fill="none"
                            stroke="hsl(var(--primary))" strokeWidth="0.5" strokeOpacity="0.2"
                            animate={reduceMotion ? undefined : { r: [30, 36, 30], opacity: [0.2, 0.4, 0.2] }}
                            transition={reduceMotion ? undefined : { duration: 3, repeat: Infinity }} />
                        <circle cx={CX} cy={CY} r="22" fill="hsl(var(--card))"
                            stroke="hsl(var(--primary))" strokeWidth="2" filter="url(#strongGlow)" />
                        <text x={CX} y={CY + 3} textAnchor="middle"
                            fill="hsl(var(--primary))" fontSize="7"
                            fontFamily="JetBrains Mono, monospace" fontWeight="700">
                            {centerLabel}
                        </text>
                    </motion.g>

                    {/* Outer pulse waves */}
                    {[0, 1, 2].map((wave) => (
                        <motion.circle key={`wave-${wave}`} cx={CX} cy={CY} r={RADIUS + 15}
                            fill="none" stroke="hsl(var(--primary))" strokeWidth="0.5"
                            initial={{ opacity: 0.2, scale: 0.95 }}
                            animate={reduceMotion ? undefined : { opacity: 0, scale: 1.1 }}
                            transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, delay: wave * 1.3 }}
                            style={{ transformOrigin: `${CX}px ${CY}px` }} />
                    ))}
                </svg>
            </div>
        </div>
    );
}
