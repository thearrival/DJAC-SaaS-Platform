import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Shield, LayoutGrid, Settings, Users, Activity } from "lucide-react";

interface StatItem {
    label: string;
    value: number;
    suffix?: string;
    accent: string;
    icon: React.ReactNode;
    sub: string;
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const frameRef = useRef<number>(0);
    const startRef = useRef<number | null>(null);
    const DURATION = 1400;

    useEffect(() => {
        startRef.current = null;
        function tick(ts: number) {
            if (startRef.current === null) startRef.current = ts;
            const progress = Math.min((ts - startRef.current) / DURATION, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) frameRef.current = requestAnimationFrame(tick);
        }
        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, [target]);

    return <>{count}{suffix}</>;
}

export function StatsRow({ stats }: { stats: StatItem[] }) {
    const reduceMotion = useReducedMotion();

    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
                gap: 12,
            }}
        >
            {stats.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    className="glass-card"
                    style={{
                        borderRadius: 12,
                        padding: "16px 18px",
                        cursor: "default",
                        position: "relative",
                        overflow: "hidden",
                        borderColor: `${stat.accent}30`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.2 } }}
                >
                    {/* Gradient sweep on hover */}
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `linear-gradient(135deg, ${stat.accent}08, ${stat.accent}18, transparent)`,
                            borderRadius: 12,
                        }}
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1, transition: { duration: 0.3 } }}
                    />

                    {/* Shimmer scan line */}
                    <motion.div
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            height: 1,
                            background: `linear-gradient(90deg, transparent, ${stat.accent}50, transparent)`,
                        }}
                        animate={reduceMotion ? undefined : { top: ["-10%", "110%"] }}
                        transition={reduceMotion ? undefined : { duration: 2.5, repeat: Infinity, ease: "linear", delay: i * 0.4 }}
                    />

                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background: `${stat.accent}1A`,
                                    border: `1px solid ${stat.accent}35`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: stat.accent,
                                }}
                            >
                                {stat.icon}
                            </div>
                            <div
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: stat.accent,
                                    boxShadow: `0 0 6px ${stat.accent}90`,
                                }}
                            />
                        </div>

                        <div
                            style={{
                                fontSize: 26,
                                fontWeight: 700,
                                color: stat.accent,
                                lineHeight: 1,
                                marginBottom: 4,
                                fontVariantNumeric: "tabular-nums",
                            }}
                        >
                            <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                        </div>

                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--djac-text)", marginBottom: 2 }}>
                            {stat.label}
                        </div>
                        <div style={{ fontSize: 9.5, color: "var(--djac-muted)" }}>
                            {stat.sub}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

// Default stat icons for convenience
export const StatIcons = {
    alert: <AlertTriangle style={{ width: 14, height: 14 }} />,
    shield: <Shield style={{ width: 14, height: 14 }} />,
    grid: <LayoutGrid style={{ width: 14, height: 14 }} />,
    settings: <Settings style={{ width: 14, height: 14 }} />,
    users: <Users style={{ width: 14, height: 14 }} />,
    activity: <Activity style={{ width: 14, height: 14 }} />,
};
