import { motion, useReducedMotion } from "framer-motion";
import { Globe2, Shield, Lock, Server, Database } from "lucide-react";
import { useLocale } from "@/contexts/useLocale";

const NODES = [
    { id: "globe", icon: Globe2, color: "var(--djac-cyan)" },
    { id: "shield", icon: Shield, color: "var(--djac-purple)" },
    { id: "lock", icon: Lock, color: "var(--djac-green)" },
    { id: "server", icon: Server, color: "var(--djac-yellow)" },
    { id: "db", icon: Database, color: "var(--djac-red)" },
] as const;

const NODE_LABELS: Record<string, Record<"en" | "ar" | "zh", string>> = {
    globe: { en: "Ingestion", ar: "الاستيعاب", zh: "采集" },
    shield: { en: "Classify", ar: "التصنيف", zh: "分类" },
    lock: { en: "Encrypt", ar: "التشفير", zh: "加密" },
    server: { en: "Route", ar: "التوجيه", zh: "路由" },
    db: { en: "Vault", ar: "الخزنة", zh: "保险库" },
};

function FlowArrow({ color, index, reduceMotion }: { color: string; index: number; reduceMotion: boolean }) {
    return (
        <div style={{ position: "relative", display: "flex", alignItems: "center", flex: 1, minWidth: 24 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}40, ${color}80)` }} />
            {/* Traveling dot */}
            <motion.div
                style={{
                    position: "absolute",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: color,
                    boxShadow: `0 0 8px ${color}`,
                    top: "50%",
                    transform: "translateY(-50%)",
                }}
                animate={reduceMotion ? undefined : { left: ["-8px", "calc(100% + 2px)"] }}
                transition={reduceMotion ? undefined : {
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.35,
                }}
            />
            <svg width={10} height={10} viewBox="0 0 10 10" style={{ flexShrink: 0 }}>
                <path d="M0,5 L7,2 L7,8 Z" fill={`${color}80`} />
            </svg>
        </div>
    );
}

export function DataFlowVisualization() {
    const { locale } = useLocale();
    const reduceMotion = useReducedMotion();

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 0, padding: "12px 0" }}>
            {NODES.map((node, i) => {
                const Icon = node.icon;
                return (
                    <div key={node.id} style={{ display: "flex", alignItems: "center", flex: i < NODES.length - 1 ? undefined : 0 }}>
                        <motion.div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 5,
                            }}
                            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <motion.div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 10,
                                    background: `${node.color}15`,
                                    border: `1px solid ${node.color}40`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: node.color,
                                    position: "relative",
                                    overflow: "hidden",
                                }}
                                animate={{ boxShadow: [`0 0 0px ${node.color}00`, `0 0 12px ${node.color}40`, `0 0 0px ${node.color}00`] }}
                                transition={reduceMotion ? undefined : { duration: 2 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                            >
                                <Icon style={{ width: 18, height: 18 }} />
                            </motion.div>
                            <span style={{ fontSize: 8.5, color: "var(--djac-muted)", fontWeight: 600 }}>{NODE_LABELS[node.id][locale]}</span>
                        </motion.div>

                        {i < NODES.length - 1 && (
                            <div style={{ display: "flex", alignItems: "center", paddingBottom: 16, flex: 1, minWidth: 20 }}>
                                <FlowArrow color={NODES[i + 1].color} index={i} reduceMotion={!!reduceMotion} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
