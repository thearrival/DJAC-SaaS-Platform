import { motion, useReducedMotion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { useLocale } from "@/contexts/useLocale";

const matrixData = [
    { category: "data_localization", csl: "required", dsl: "required", pipl: "required", pdpl: "required", nca: "partial", risk: "critical" },
    { category: "consent_mechanism", csl: "partial", dsl: "none", pipl: "required", pdpl: "required", nca: "none", risk: "high" },
    { category: "breach_notification", csl: "required", dsl: "required", pipl: "required", pdpl: "required", nca: "required", risk: "medium" },
    { category: "cross_border_transfer", csl: "required", dsl: "required", pipl: "required", pdpl: "partial", nca: "none", risk: "critical" },
    { category: "encryption_standards", csl: "required", dsl: "partial", pipl: "partial", pdpl: "partial", nca: "required", risk: "high" },
    { category: "access_management", csl: "partial", dsl: "none", pipl: "partial", pdpl: "required", nca: "required", risk: "medium" },
];

const StatusCell = ({ status, delay }: { status: string; delay: number }) => {
    if (status === "required") return (
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay, type: "spring", stiffness: 200 }}
        >
            <CheckCircle2 size={14} className="text-success mx-auto" />
        </motion.div>
    );
    if (status === "partial") return (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay, type: "spring" }}
        >
            <MinusCircle size={14} className="text-warning mx-auto" />
        </motion.div>
    );
    return (
        <motion.span
            className="block w-2 h-2 rounded-full bg-muted-foreground/30 mx-auto"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay }}
        />
    );
};

const riskColors: Record<string, string> = {
    critical: "bg-destructive/20 text-destructive border-destructive/30",
    high: "bg-warning/20 text-warning border-warning/30",
    medium: "bg-primary/20 text-primary border-primary/30",
};

export function ComplianceMatrix() {
    const { locale } = useLocale();
    const reduceMotion = useReducedMotion();
    const safeLocale = locale === "ar" || locale === "zh" ? locale : "en";

    const copy = {
        en: {
            title: "Compliance Control Matrix",
            subtitle: "Cross-framework requirement mapping",
            control: "Control",
            risk: "Risk",
            critical: "critical",
            high: "high",
            medium: "medium",
            categories: {
                data_localization: "Data Localization",
                consent_mechanism: "Consent Mechanism",
                breach_notification: "Breach Notification",
                cross_border_transfer: "Cross-Border Transfer",
                encryption_standards: "Encryption Standards",
                access_management: "Access Management",
            },
        },
        ar: {
            title: "مصفوفة ضوابط الامتثال",
            subtitle: "مواءمة المتطلبات عبر الأطر",
            control: "الضابط",
            risk: "المخاطر",
            critical: "حرج",
            high: "مرتفع",
            medium: "متوسط",
            categories: {
                data_localization: "توطين البيانات",
                consent_mechanism: "آلية الموافقة",
                breach_notification: "إشعار الاختراق",
                cross_border_transfer: "النقل عبر الحدود",
                encryption_standards: "معايير التشفير",
                access_management: "إدارة الوصول",
            },
        },
        zh: {
            title: "合规控制矩阵",
            subtitle: "跨框架要求映射",
            control: "控制项",
            risk: "风险",
            critical: "严重",
            high: "高",
            medium: "中",
            categories: {
                data_localization: "数据本地化",
                consent_mechanism: "同意机制",
                breach_notification: "泄露通知",
                cross_border_transfer: "跨境传输",
                encryption_standards: "加密标准",
                access_management: "访问管理",
            },
        },
    }[safeLocale];

    const riskLabel = (risk: string) => (risk === "critical" ? copy.critical : risk === "high" ? copy.high : copy.medium);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card rounded-xl p-5 overflow-hidden relative"
        >
            {/* Animated border top */}
            <motion.div
                className="absolute top-0 left-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                initial={{ width: "0%" }}
                animate={reduceMotion ? undefined : { width: "100%" }}
                transition={reduceMotion ? undefined : { duration: 1.5, delay: 0.5 }}
            />

            <div className="flex items-center gap-2 mb-1">
                <motion.div
                    animate={reduceMotion ? undefined : { rotate: [0, 360] }}
                    transition={reduceMotion ? undefined : { duration: 20, repeat: Infinity, ease: "linear" }}
                >
                    <Shield size={16} className="text-primary" />
                </motion.div>
                <h3 className="font-display font-semibold text-foreground text-sm">{copy.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{copy.subtitle}</p>

            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 text-muted-foreground font-mono uppercase tracking-wider text-[10px]">{copy.control}</th>
                            {["CSL", "DSL", "PIPL", "PDPL", "NCA"].map((f, i) => (
                                <motion.th
                                    key={f}
                                    className="text-center py-2 px-2 text-primary font-mono uppercase tracking-wider text-[10px]"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + i * 0.08 }}
                                >
                                    {f}
                                </motion.th>
                            ))}
                            <th className="text-center py-2 px-2 text-muted-foreground font-mono uppercase tracking-wider text-[10px]">{copy.risk}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrixData.map((row, i) => (
                            <motion.tr
                                key={row.category}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.08, type: "spring", stiffness: 120 }}
                                whileHover={{
                                    backgroundColor: "hsla(230, 50%, 20%, 0.3)",
                                    transition: { duration: 0.15 },
                                }}
                                className="border-b border-border/50 cursor-pointer"
                            >
                                <td className="py-2.5 px-2 text-foreground/80 font-medium">{copy.categories[row.category as keyof typeof copy.categories]}</td>
                                <td className="py-2.5 px-2"><StatusCell status={row.csl} delay={0.6 + i * 0.08} /></td>
                                <td className="py-2.5 px-2"><StatusCell status={row.dsl} delay={0.65 + i * 0.08} /></td>
                                <td className="py-2.5 px-2"><StatusCell status={row.pipl} delay={0.7 + i * 0.08} /></td>
                                <td className="py-2.5 px-2"><StatusCell status={row.pdpl} delay={0.75 + i * 0.08} /></td>
                                <td className="py-2.5 px-2"><StatusCell status={row.nca} delay={0.8 + i * 0.08} /></td>
                                <td className="py-2.5 px-2">
                                    <motion.span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase border ${riskColors[row.risk]}`}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.85 + i * 0.08, type: "spring" }}
                                        whileHover={{ scale: 1.1 }}
                                    >
                                        {row.risk === "critical" && <AlertTriangle size={10} />}
                                        {riskLabel(row.risk)}
                                    </motion.span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
