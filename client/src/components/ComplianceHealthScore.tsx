import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/useLocale";

interface Props {
    score: number;
}

export function ComplianceHealthScore({ score }: Props) {
    const circumference = Math.PI * 120;
    const offset = circumference - (score / 100) * circumference;
    const [displayScore, setDisplayScore] = useState(0);
    const reduceMotion = useReducedMotion();
    const { locale } = useLocale();
    const safeLocale = locale === "ar" || locale === "zh" ? locale : "en";

    const copy = {
        en: {
            title: "System Health",
            good: "All systems operational.",
            medium: "Some areas need attention.",
            low: "Critical issues detected.",
        },
        ar: {
            title: "صحة النظام",
            good: "جميع الأنظمة تعمل بشكل سليم.",
            medium: "بعض الجوانب تحتاج إلى اهتمام.",
            low: "تم اكتشاف مشكلات حرجة.",
        },
        zh: {
            title: "系统健康",
            good: "所有系统运行正常。",
            medium: "部分区域需要关注。",
            low: "检测到严重问题。",
        },
    }[safeLocale];

    const color =
        score >= 80 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--primary))" : "hsl(var(--destructive))";

    const glowColor =
        score >= 80 ? "rgba(1, 255, 127, 0.4)" : score >= 50 ? "rgba(0, 247, 255, 0.4)" : "rgba(255, 23, 68, 0.4)";

    useEffect(() => {
        const duration = 1500;
        const start = performance.now();
        const step = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayScore(Math.round(score * eased));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [score]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="glass-card rounded-xl p-6 flex flex-col items-center relative overflow-hidden"
        >
            {/* Radial background pulse */}
            <motion.div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    background: `radial-gradient(circle at 50% 70%, ${glowColor}, transparent 70%)`,
                }}
                animate={reduceMotion ? undefined : { opacity: [0.02, 0.06, 0.02] }}
                transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity }}
            />

            <h2 className="font-display font-semibold text-sm text-primary mb-4 uppercase tracking-widest relative z-10">
                {copy.title}
            </h2>
            <div className="relative w-64 h-36">
                <svg viewBox="0 0 260 140" className="w-full h-full">
                    <defs>
                        <filter id="arcGlow">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={color} />
                            <stop offset="100%" stopColor="hsl(var(--secondary))" />
                        </linearGradient>
                    </defs>
                    {/* Background arc */}
                    <path
                        d="M 10 130 A 120 120 0 0 1 250 130"
                        fill="none"
                        stroke="hsl(var(--muted))"
                        strokeWidth="14"
                        strokeLinecap="round"
                    />
                    {/* Score arc with gradient & glow */}
                    <motion.path
                        d="M 10 130 A 120 120 0 0 1 250 130"
                        fill="none"
                        stroke="url(#arcGradient)"
                        strokeWidth="14"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        filter="url(#arcGlow)"
                    />
                    {/* Tick marks */}
                    {Array.from({ length: 11 }).map((_, i) => {
                        const angle = Math.PI + (Math.PI * i) / 10;
                        const r1 = 118;
                        const r2 = 124;
                        return (
                            <motion.line
                                key={i}
                                x1={130 + r1 * Math.cos(angle)}
                                y1={130 + r1 * Math.sin(angle)}
                                x2={130 + r2 * Math.cos(angle)}
                                y2={130 + r2 * Math.sin(angle)}
                                stroke="hsl(var(--muted-foreground))"
                                strokeWidth="1"
                                strokeOpacity="0.3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                            />
                        );
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                    <motion.span
                        className="font-display font-bold text-5xl text-foreground"
                        style={{ textShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}` }}
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8, type: "spring" }}
                    >
                        {displayScore}%
                    </motion.span>
                </div>
            </div>
            <motion.p
                className="text-sm text-muted-foreground mt-2 relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
            >
                {score >= 80
                    ? copy.good
                    : score >= 50
                        ? copy.medium
                        : copy.low}
            </motion.p>
        </motion.div>
    );
}
