import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

interface FrameworkCardProps {
    code: string;
    name: string;
    country: string;
    score: number;
    accent: string;
    conflictCount?: number;
    relationCount?: number;
    countryFlag?: string;
    onClick?: () => void;
}

export function FrameworkCard({
    code,
    name,
    country,
    score,
    accent,
    conflictCount = 0,
    relationCount = 0,
    countryFlag,
    onClick,
}: FrameworkCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [2, -2]), { stiffness: 300, damping: 30 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-2, 2]), { stiffness: 300, damping: 30 });

    const scoreColor =
        score >= 80 ? "var(--djac-green)" : score >= 60 ? "var(--djac-yellow)" : "var(--djac-red)";

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            ref={cardRef}
            className="glass-card"
            style={{
                borderRadius: 12,
                padding: "14px 16px",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                borderColor: `${accent}25`,
                rotateX,
                rotateY,
                transformPerspective: 800,
                transformStyle: "preserve-3d",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ borderColor: `${accent}55`, transition: { duration: 0.2 } }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
        >
            {/* Holographic scan */}
            <motion.div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(105deg, transparent 40%, ${accent}0A 50%, transparent 60%)`,
                    borderRadius: 12,
                }}
                animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Top accent line */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: "10%",
                    right: "10%",
                    height: 1,
                    background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`,
                }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--djac-text)" }}>{code}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {conflictCount > 0 && (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: "var(--djac-orange)",
                                    background: "var(--djac-orange)1A",
                                    border: "1px solid var(--djac-orange)44",
                                    borderRadius: 99,
                                    padding: "1px 6px",
                                }}
                            >
                                !{conflictCount}
                            </span>
                        )}
                        <ArrowRight style={{ width: 11, height: 11, color: "var(--djac-muted)" }} />
                    </div>
                </div>

                {/* Name */}
                <p
                    style={{
                        color: "var(--djac-muted)",
                        fontSize: 9.5,
                        margin: "0 0 12px",
                        lineHeight: 1.4,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                    }}
                >
                    {name}
                </p>

                {/* Progress bar with shimmer */}
                <div style={{ marginBottom: 10 }}>
                    <div
                        style={{
                            height: 5,
                            background: "rgba(255,255,255,0.06)",
                            borderRadius: 99,
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        <motion.div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: "100%",
                                borderRadius: 99,
                                background: `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* Shimmer tip */}
                            <motion.div
                                style={{
                                    position: "absolute",
                                    top: -1,
                                    right: 0,
                                    width: 6,
                                    height: 7,
                                    borderRadius: 99,
                                    background: scoreColor,
                                    boxShadow: `0 0 8px ${scoreColor}`,
                                }}
                                animate={{ opacity: [1, 0.4, 1] }}
                                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span
                        style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: country === "China" ? "var(--djac-red)" : "var(--djac-green)",
                            background: country === "China" ? "var(--djac-red)1E" : "var(--djac-green)14",
                            border: `1px solid ${country === "China" ? "var(--djac-red)47" : "var(--djac-green)38"}`,
                            borderRadius: 99,
                            padding: "2px 7px",
                        }}
                    >
                        {countryFlag} {country}
                    </span>
                    <div>
                        <span style={{ color: scoreColor, fontSize: 13, fontWeight: 700 }}>{score}%</span>
                        <p style={{ color: "var(--djac-muted)", fontSize: 8.5, margin: 0 }}>{relationCount} pairs</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
