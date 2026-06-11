/**
 * DJACHero.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-page animated hero / landing screen for the DJAC Platform.
 *
 * Animations included:
 *   • Interactive particle-mesh canvas (mouse-repulsion + connecting lines)
 *   • Matrix-rain canvas (legal/math characters)
 *   • Animated hexagon-orbit shield (multi-ring with glowing nodes)
 *   • Typing-cursor headline animation
 *   • Animated gradient text (gradient-x keyframe)
 *   • Count-up stat cards with progress glow bar
 *   • glassmorphism feature cards with hover-reveal glow
 *   • Live-feed terminal with staggered entrance
 *   • SVG compliance-score arc gauge with tick marks
 *   • Scan-line sweep on CTA banner
 *   • Scroll-fade entrance via slide-up keyframe
 *
 * Design tokens from DJAC_DESIGN_SYSTEM.md are honoured:
 *   hsl(var(--background)), hsl(var(--card)), hsl(var(--border)),
 *   hsl(var(--muted-foreground)), Inter font, JetBrains Mono for monospace,
 *   OKLCH brand palette mapped to approximate sRGB for canvas / inline styles.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import {
    Shield,
    Globe2,
    Lock,
    Activity,
    ArrowRight,
    CheckCircle2,
    Scale,
    Building2,
    Network,
    Eye,
    Cpu,
} from "lucide-react";

// ─── Keyframe injection ────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes spin-slow   { to { transform: rotate(360deg); } }
  @keyframes spin-rev    { to { transform: rotate(-360deg); } }
  @keyframes glow-pulse  {
    0%, 100% { box-shadow: 0 0 12px rgba(59,130,246,.35); }
    50%       { box-shadow: 0 0 32px rgba(59,130,246,.75); }
  }
  @keyframes glow-green  {
    0%, 100% { box-shadow: 0 0 8px rgba(74,222,128,.4); }
    50%       { box-shadow: 0 0 20px rgba(74,222,128,.9); }
  }
  @keyframes slide-up    {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in     { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cursor-blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-12px); }
  }
  @keyframes gradient-x  {
    0%, 100% { background-position:   0% 50%; }
    50%       { background-position: 100% 50%; }
  }
  @keyframes scan {
    0%   { top: -2px; opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes data-in     {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes ring-appear {
    from { opacity: 0; transform: scale(.85); }
    to   { opacity: 1; transform: scale(1); }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Particle {
    x: number; y: number;
    vx: number; vy: number;
    size: number; opacity: number;
}

// ─── useCountUp ────────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 2000, decimals = 0): number {
    const [count, setCount] = useState(0);
    const startRef = useRef<number | null>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        startRef.current = null;
        const tick = (ts: number) => {
            if (!startRef.current) startRef.current = ts;
            const t = Math.min((ts - startRef.current) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
            setCount(parseFloat((eased * target).toFixed(decimals)));
            if (t < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target, duration, decimals]);

    return count;
}

// ─── useTyping ─────────────────────────────────────────────────────────────────

function useTyping(text: string, speed = 46, delay = 500): string {
    const [out, setOut] = useState("");
    useEffect(() => {
        let i = 0;
        let interval: ReturnType<typeof setInterval>;
        const timeout = setTimeout(() => {
            interval = setInterval(() => {
                i++;
                setOut(text.slice(0, i));
                if (i >= text.length) clearInterval(interval);
            }, speed);
        }, delay);
        return () => { clearTimeout(timeout); clearInterval(interval); };
    }, [text, speed, delay]);
    return out;
}

// ─── ParticleCanvas ─────────────────────────────────────────────────────────────

function ParticleCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ptRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const mouseRef = useRef({ x: -9999, y: -9999 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const n = Math.min(Math.floor((canvas.width * canvas.height) / 7500), 120);
            ptRef.current = Array.from({ length: n }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.45,
                vy: (Math.random() - 0.5) * 0.45,
                size: Math.random() * 1.8 + 0.4,
                opacity: Math.random() * 0.55 + 0.2,
            }));
        };

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const ps = ptRef.current;
            const w = canvas.width, h = canvas.height;

            for (let i = 0; i < ps.length; i++) {
                const p = ps[i];
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

                // mouse repulsion
                const dx = p.x - mouseRef.current.x;
                const dy = p.y - mouseRef.current.y;
                const md = Math.sqrt(dx * dx + dy * dy);
                if (md < 90 && md > 0) { p.x += (dx / md) * 1.8; p.y += (dy / md) * 1.8; }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99,157,255,${p.opacity})`;
                ctx.fill();

                for (let j = i + 1; j < ps.length; j++) {
                    const q = ps[j];
                    const lx = p.x - q.x, ly = p.y - q.y;
                    const d = Math.sqrt(lx * lx + ly * ly);
                    if (d < 130) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `rgba(99,157,255,${(1 - d / 130) * 0.18})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            rafRef.current = requestAnimationFrame(draw);
        };

        const onMouse = (e: MouseEvent) => {
            const r = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
        };

        init();
        draw();
        window.addEventListener("resize", init);
        canvas.addEventListener("mousemove", onMouse);
        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", init);
            canvas.removeEventListener("mousemove", onMouse);
        };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.55 }} />;
}

// ─── MatrixRain ────────────────────────────────────────────────────────────────

function MatrixRain({ className }: { className?: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize();

        const cols = Math.floor(canvas.width / 18);
        const drops: number[] = Array(cols).fill(1);
        const chars = "01アイΑΒΓΔ∑∂∇∈∉≈≠≤≥±∫§ℕℤℝℂ§¶©®™⊕⊗∴∵⟨⟩⌘⌛";

        const draw = () => {
            ctx.fillStyle = "rgba(0,0,0,0.05)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#0f6";
            ctx.font = "12px 'JetBrains Mono', monospace";
            for (let i = 0; i < drops.length; i++) {
                ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 18, drops[i] * 18);
                if (drops[i] * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
                drops[i]++;
            }
        };

        window.addEventListener("resize", resize);
        const id = setInterval(draw, 38);
        return () => { clearInterval(id); window.removeEventListener("resize", resize); };
    }, []);

    return <canvas ref={canvasRef} className={className} style={{ opacity: 0.035 }} />;
}

// ─── HexagonOrbit ──────────────────────────────────────────────────────────────

function HexagonOrbit() {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer ring */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    border: "1px solid rgba(99,157,255,.18)",
                    animation: "spin-slow 14s linear infinite",
                }}
            >
                {[0, 60, 120, 180, 240, 300].map(deg => (
                    <div
                        key={deg}
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                            top: "50%", left: "50%",
                            transform: `rotate(${deg}deg) translate(128px) translate(-50%,-50%)`,
                            background: "#60a5fa",
                            boxShadow: "0 0 10px 3px rgba(99,157,255,.7)",
                            animation: "glow-pulse 2.5s ease-in-out infinite",
                            animationDelay: `${deg * 7}ms`,
                        }}
                    />
                ))}
            </div>

            {/* Mid ring */}
            <div
                className="absolute w-44 h-44 rounded-full"
                style={{
                    border: "1px solid rgba(74,222,128,.18)",
                    animation: "spin-rev 9s linear infinite",
                }}
            >
                {[0, 90, 180, 270].map(deg => (
                    <div
                        key={deg}
                        className="absolute w-2 h-2 rounded-full"
                        style={{
                            top: "50%", left: "50%",
                            transform: `rotate(${deg}deg) translate(88px) translate(-50%,-50%)`,
                            background: "#4ade80",
                            boxShadow: "0 0 8px 2px rgba(74,222,128,.8)",
                            animation: "glow-green 2s ease-in-out infinite",
                            animationDelay: `${deg * 5}ms`,
                        }}
                    />
                ))}
            </div>

            {/* Inner ring */}
            <div
                className="absolute w-28 h-28 rounded-full"
                style={{
                    border: "1px solid rgba(99,157,255,.25)",
                    animation: "spin-slow 6s linear infinite",
                }}
            />

            {/* Core shield */}
            <div
                className="relative z-10 w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center"
                style={{
                    background: "linear-gradient(135deg,rgba(59,130,246,.18),rgba(16,185,129,.14))",
                    border: "1px solid rgba(99,157,255,.45)",
                    boxShadow: "0 0 36px rgba(59,130,246,.35), inset 0 0 18px rgba(59,130,246,.1)",
                    animation: "glow-pulse 3s ease-in-out infinite",
                }}
            >
                <Shield size={32} color="#93c5fd" />
            </div>
        </div>
    );
}

// ─── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
    label: string; value: number;
    suffix?: string; prefix?: string; decimals?: number;
    icon: ReactNode; color: string; delay?: number;
}

function StatCard({ label, value, suffix = "", prefix = "", decimals = 0, icon, color, delay = 0 }: StatCardProps) {
    const [active, setActive] = useState(false);
    const count = useCountUp(active ? value : 0, 2400, decimals);

    useEffect(() => {
        const t = setTimeout(() => setActive(true), 200 + delay);
        return () => clearTimeout(t);
    }, [delay]);

    const [hov, setHov] = useState(false);

    return (
        <div
            className="relative overflow-hidden rounded-xl p-5 cursor-default"
            style={{
                background: hov
                    ? `linear-gradient(135deg,hsl(var(--card)/.75),${color}0a)`
                    : "hsl(var(--card)/.6)",
                border: `1px solid ${hov ? color + "45" : "hsl(var(--border)/.45)"}`,
                backdropFilter: "blur(14px)",
                transition: "all .35s ease",
                transform: hov ? "translateY(-5px)" : "translateY(0)",
                boxShadow: hov ? `0 18px 44px ${color}22` : "none",
                animation: active ? `slide-up .65s ease ${delay}ms both` : "none",
            }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
        >
            {/* Top accent line */}
            <div
                className="absolute inset-x-0 top-0 h-px transition-opacity duration-300"
                style={{
                    background: `linear-gradient(90deg,transparent,${color},transparent)`,
                    opacity: hov ? 1 : 0,
                }}
            />

            <div className="flex items-start justify-between mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                        background: `${color}14`,
                        border: `1px solid ${color}28`,
                        boxShadow: hov ? `0 0 18px ${color}35` : "none",
                        transition: "box-shadow .35s",
                    }}
                >
                    {icon}
                </div>
                <Activity size={11} style={{ color: "hsl(var(--muted-foreground))", opacity: 0.35 }} />
            </div>

            <div className="text-[1.85rem] font-extrabold tracking-tight mb-1 font-[Inter]" style={{ color }}>
                {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count)}{suffix}
            </div>
            <div className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</div>

            {/* Bottom progress bar */}
            <div
                className="absolute bottom-0 left-0 h-[2px] transition-[width] duration-[1800ms] ease-out"
                style={{
                    width: active ? "100%" : "0%",
                    background: `linear-gradient(90deg,transparent,${color}80,transparent)`,
                    transitionDelay: `${delay + 500}ms`,
                }}
            />
        </div>
    );
}

// ─── FeatureCard ───────────────────────────────────────────────────────────────

interface FeatureCardProps {
    icon: ReactNode; title: string; description: string;
    accent: string; items: string[]; delay?: number;
}

function FeatureCard({ icon, title, description, accent, items, delay = 0 }: FeatureCardProps) {
    const [hov, setHov] = useState(false);

    return (
        <div
            className="relative rounded-2xl p-6 overflow-hidden cursor-default"
            style={{
                background: hov
                    ? `linear-gradient(150deg,hsl(var(--card)/.85),${accent}0a)`
                    : "hsl(var(--card)/.6)",
                border: `1px solid ${hov ? accent + "42" : "hsl(var(--border)/.45)"}`,
                backdropFilter: "blur(14px)",
                transition: "all .4s ease",
                boxShadow: hov ? `0 12px 40px ${accent}1e, inset 0 0 28px ${accent}06` : "none",
                animation: `slide-up .7s ease ${delay}ms both`,
            }}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
        >
            {/* Corner radial */}
            <div
                className="absolute top-0 right-0 w-28 h-28 rounded-bl-full pointer-events-none"
                style={{
                    background: `radial-gradient(circle at top right,${accent}18,transparent)`,
                    opacity: hov ? 1 : 0.4,
                    transition: "opacity .4s",
                }}
            />

            {/* Icon */}
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{
                    background: `${accent}14`,
                    border: `1px solid ${accent}28`,
                    boxShadow: hov ? `0 0 22px ${accent}35` : "none",
                    transition: "box-shadow .4s",
                }}
            >
                {icon}
            </div>

            <h3 className="font-bold text-base mb-2">{title}</h3>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {description}
            </p>

            <ul className="space-y-2">
                {items.map((item, i) => (
                    <li className="flex items-start gap-2 text-xs" key={i} style={{ color: "hsl(var(--muted-foreground))" }}>
                        <CheckCircle2 size={12} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
                        {item}
                    </li>
                ))}
            </ul>

            {/* Bottom glow */}
            <div
                className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
                style={{
                    background: `linear-gradient(90deg,transparent,${accent},transparent)`,
                    opacity: hov ? 1 : 0,
                    transition: "opacity .4s",
                }}
            />
        </div>
    );
}

// ─── DataFeed terminal ────────────────────────────────────────────────────────

const FEED: { t: string; msg: string; s: "ok" | "warn" | "err" }[] = [
    { t: "00:00:01", msg: "GDPR Art. 32 compliance scan — 0 critical gaps", s: "ok" },
    { t: "00:00:03", msg: "Saudi PDPL: 3 controller obligations resolved ✓", s: "ok" },
    { t: "00:00:06", msg: "Vendor risk update: Acme Corp → score 87 / 100", s: "warn" },
    { t: "00:00:09", msg: "AI pipeline: 12 frameworks processed in 4.1 s", s: "ok" },
    { t: "00:00:12", msg: "Transfer check: EU→US data flow — SCCs required ⚠", s: "warn" },
    { t: "00:00:15", msg: "PDPA (TH) conformity: 94 % — above threshold", s: "ok" },
    { t: "00:00:18", msg: "Audit log sealed: 247 policy events recorded", s: "ok" },
    { t: "00:00:21", msg: "Incident register: 1 low-severity event opened", s: "err" },
    { t: "00:00:24", msg: "ISO 27001 gap scan: 2 controls remain open", s: "warn" },
    { t: "00:00:27", msg: "Smart-contract processor flagged for DPA review", s: "err" },
];

function DataFeed() {
    const [shown, setShown] = useState<number[]>([]);

    useEffect(() => {
        FEED.forEach((_, i) => {
            setTimeout(() => setShown(prev => [...prev, i]), 700 + i * 340);
        });
    }, []);

    const sColor = { ok: "#4ade80", warn: "#fbbf24", err: "#f87171" };
    const sGlyph = { ok: "✓", warn: "⚠", err: "✗" };

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{
                background: "hsl(var(--card)/.55)",
                border: "1px solid hsl(var(--border)/.5)",
                backdropFilter: "blur(12px)",
            }}
        >
            {/* Titlebar */}
            <div
                className="flex items-center gap-3 px-4 py-2.5 border-b"
                style={{ borderColor: "hsl(var(--border)/.4)" }}
            >
                <div className="flex gap-1.5">
                    {["#f87171", "#fbbf24", "#4ade80"].map(c => (
                        <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.7 }} />
                    ))}
                </div>
                <span className="text-xs font-mono ml-1" style={{ color: "hsl(var(--muted-foreground))" }}>
                    djac-compliance-engine — live feed
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                    <div
                        className="w-1.5 h-1.5 rounded-full bg-green-400"
                        style={{ animation: "glow-green 1.6s ease-in-out infinite" }}
                    />
                    <span className="text-xs font-mono text-green-400">ACTIVE</span>
                </div>
            </div>

            {/* Lines */}
            <div className="p-4 font-mono text-xs space-y-1.5 max-h-60 overflow-hidden">
                {FEED.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-start gap-3"
                        style={{
                            opacity: shown.includes(i) ? 1 : 0,
                            transform: shown.includes(i) ? "translateX(0)" : "translateX(-10px)",
                            transition: "opacity .45s ease, transform .45s ease",
                        }}
                    >
                        <span style={{ color: "hsl(var(--muted-foreground))", opacity: 0.45, flexShrink: 0 }}>
                            +{item.t}
                        </span>
                        <span style={{ color: sColor[item.s], flexShrink: 0 }}>{sGlyph[item.s]}</span>
                        <span style={{ color: "hsl(var(--muted-foreground))", lineHeight: 1.5 }}>{item.msg}</span>
                    </div>
                ))}

                {/* Blinking cursor */}
                <div className="flex items-center gap-1.5 mt-1" style={{ color: "hsl(var(--muted-foreground))", opacity: 0.35 }}>
                    <span>›</span>
                    <span style={{ animation: "cursor-blink 1.1s step-end infinite" }}>_</span>
                </div>
            </div>
        </div>
    );
}

// ─── ScoreGauge ────────────────────────────────────────────────────────────────

function ScoreGauge({ score = 98.4 }: { score?: number }) {
    const R = 90;
    const C = 2 * Math.PI * R;
    const offset = C * (1 - score / 100);

    return (
        <div className="relative flex items-center justify-center" style={{ animation: "ring-appear .9s ease .4s both" }}>
            <svg width={240} height={240} viewBox="0 0 240 240">
                {/* Background track */}
                <circle cx={120} cy={120} r={R} fill="none" stroke="rgba(99,157,255,.1)" strokeWidth={15} />

                {/* Progress arc */}
                <circle
                    cx={120} cy={120} r={R}
                    fill="none"
                    stroke="url(#djac-arc)"
                    strokeWidth={15}
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                    transform="rotate(-90 120 120)"
                    style={{ transition: "stroke-dashoffset 2.2s cubic-bezier(.4,0,.2,1)" }}
                />

                <defs>
                    <linearGradient id="djac-arc" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>

                {/* Tick marks */}
                {Array.from({ length: 30 }, (_, i) => {
                    const a = (i / 30) * 2 * Math.PI - Math.PI / 2;
                    const major = i % 5 === 0;
                    const r1 = major ? 72 : 76;
                    return (
                        <line key={i}
                            x1={120 + r1 * Math.cos(a)} y1={120 + r1 * Math.sin(a)}
                            x2={120 + 84 * Math.cos(a)} y2={120 + 84 * Math.sin(a)}
                            stroke="rgba(99,157,255,.28)" strokeWidth={major ? 2 : 1}
                        />
                    );
                })}

                {/* Label */}
                <text x={120} y={108} textAnchor="middle" fill="white" fontSize={34} fontWeight={800} fontFamily="Inter">
                    {score}
                </text>
                <text x={120} y={128} textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize={11} fontFamily="Inter">
                    COMPLIANCE
                </text>
                <text x={120} y={144} textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize={11} fontFamily="Inter">
                    SCORE
                </text>
            </svg>

            {/* Glow bloom */}
            <div
                className="absolute inset-0 rounded-full -z-10"
                style={{ boxShadow: "0 0 70px rgba(59,130,246,.2)" }}
            />
        </div>
    );
}

// ─── Main hero page ────────────────────────────────────────────────────────────

export default function DJACHero() {
    const headline = useTyping("Enterprise Compliance,\nRedefined by AI.", 48, 500);

    return (
        <>
            {/* Inject keyframes into document head once */}
            <style>{KEYFRAMES}</style>

            <div className="djac-page relative min-h-screen overflow-x-hidden" style={{ paddingBottom: 0, gap: 0 }}>

                {/* ═══ FIXED BACKGROUND ═══════════════════════════════════════════ */}
                <div className="fixed inset-0 -z-10">
                    <ParticleCanvas />
                    <MatrixRain className="absolute inset-0 w-full h-full" />

                    {/* Radial colour blobs */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background:
                            "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(59,130,246,.09) 0%, transparent 70%)," +
                            "radial-gradient(ellipse 55% 40% at 85% 85%, rgba(16,185,129,.07) 0%, transparent 65%)",
                    }} />

                    {/* Fine grid */}
                    <div className="absolute inset-0 opacity-[.022] pointer-events-none" style={{
                        backgroundImage:
                            "linear-gradient(hsl(var(--foreground)) 1px,transparent 1px)," +
                            "linear-gradient(90deg,hsl(var(--foreground)) 1px,transparent 1px)",
                        backgroundSize: "64px 64px",
                    }} />
                </div>

                {/* ═══ SECTION 1 · HERO ═══════════════════════════════════════════ */}
                <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-28 text-center">

                    {/* Live badge */}
                    <div
                        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-8 border"
                        style={{
                            background: "rgba(59,130,246,.08)",
                            borderColor: "rgba(59,130,246,.28)",
                            color: "#93c5fd",
                            animation: "slide-up .5s ease .1s both",
                        }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: "glow-green 1.5s ease-in-out infinite" }} />
                        DJAC Platform v2 · AI-Native Compliance Engine — live
                    </div>

                    {/* Orbit */}
                    <div style={{ animation: "float 5.5s ease-in-out infinite" }}>
                        <HexagonOrbit />
                    </div>

                    {/* Typing headline */}
                    <h1
                        className="mt-8 text-5xl md:text-[4.25rem] font-extrabold tracking-tight leading-[1.1] whitespace-pre-line"
                        style={{
                            background: "linear-gradient(135deg,#f8fafc 0%,#93c5fd 48%,#4ade80 100%)",
                            backgroundSize: "200% 200%",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                            animation: "gradient-x 7s ease infinite",
                            minHeight: "7.5rem",
                        }}
                    >
                        {headline}
                        <span
                            className="inline-block w-[3px] bg-blue-400 ml-1 align-middle"
                            style={{ height: "0.85em", animation: "cursor-blink 1s step-end infinite" }}
                        />
                    </h1>

                    {/* Subtitle */}
                    <p
                        className="mt-6 max-w-2xl text-lg leading-relaxed"
                        style={{
                            color: "hsl(var(--muted-foreground))",
                            animation: "slide-up .7s ease 1.3s both",
                        }}
                    >
                        Unify GDPR, Saudi PDPL, UAE DIFC, China PIPL, and 40+ global frameworks into one
                        intelligent workspace — powered by a multi-model AI orchestration engine.
                    </p>

                    {/* CTA buttons */}
                    <div
                        className="mt-10 flex flex-wrap gap-4 justify-center"
                        style={{ animation: "slide-up .7s ease 1.5s both" }}
                    >
                        <button
                            className="group inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white"
                            style={{
                                background: "linear-gradient(135deg,#3b82f6,#10b981)",
                                boxShadow: "0 0 28px rgba(59,130,246,.45)",
                                border: "none",
                                cursor: "pointer",
                                transition: "box-shadow .3s,transform .2s",
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.transform = "scale(1.05)";
                                el.style.boxShadow = "0 0 48px rgba(59,130,246,.75)";
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.transform = "scale(1)";
                                el.style.boxShadow = "0 0 28px rgba(59,130,246,.45)";
                            }}
                        >
                            Launch Dashboard
                            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </button>

                        <button
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white"
                            style={{
                                background: "rgba(255,255,255,.04)",
                                border: "1px solid rgba(255,255,255,.14)",
                                cursor: "pointer",
                                backdropFilter: "blur(10px)",
                                transition: "background .3s,border-color .3s",
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = "rgba(255,255,255,.09)";
                                el.style.borderColor = "rgba(255,255,255,.28)";
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = "rgba(255,255,255,.04)";
                                el.style.borderColor = "rgba(255,255,255,.14)";
                            }}
                        >
                            <Eye size={16} />
                            View Docs
                        </button>
                    </div>

                    {/* Scroll cue */}
                    <div
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                        style={{ animation: "float 2.6s ease-in-out 2.5s infinite" }}
                    >
                        <span
                            className="text-[10px] font-mono tracking-[.25em] uppercase"
                            style={{ color: "hsl(var(--muted-foreground))", opacity: 0.4 }}
                        >
                            scroll
                        </span>
                        <div
                            className="w-px h-8"
                            style={{ background: "linear-gradient(to bottom,rgba(99,157,255,.55),transparent)" }}
                        />
                    </div>
                </section>

                {/* ═══ SECTION 2 · METRICS ════════════════════════════════════════ */}
                <section className="relative px-6 py-24">
                    <div className="max-w-6xl mx-auto">

                        <div className="text-center mb-14" style={{ animation: "slide-up .6s ease both" }}>
                            <div
                                className="inline-flex items-center gap-2 text-xs font-mono mb-3"
                                style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}
                            >
                                <div className="h-px w-8 bg-current" />
                                LIVE PLATFORM METRICS
                                <div className="h-px w-8 bg-current" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Built for Scale.{" "}
                                <span style={{
                                    background: "linear-gradient(90deg,#3b82f6,#10b981)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}>
                                    Engineered for Compliance.
                                </span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Global Frameworks" value={47} suffix="+" icon={<Globe2 size={20} color="#60a5fa" />} color="#3b82f6" delay={100} />
                            <StatCard label="AI Compliance Score" value={98.4} suffix="%" decimals={1} icon={<Cpu size={20} color="#4ade80" />} color="#10b981" delay={260} />
                            <StatCard label="Vendors Assessed" value={3200} suffix="+" icon={<Building2 size={20} color="#c084fc" />} color="#8b5cf6" delay={420} />
                            <StatCard label="Data Jurisdictions" value={62} icon={<Network size={20} color="#fb923c" />} color="#f97316" delay={580} />
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 3 · FEATURES ═══════════════════════════════════════ */}
                <section className="relative px-6 py-24">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-14">
                            <div
                                className="inline-flex items-center gap-2 text-xs font-mono mb-3"
                                style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}
                            >
                                <div className="h-px w-8 bg-current" />
                                CORE CAPABILITIES
                                <div className="h-px w-8 bg-current" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Every module your compliance team needs
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <FeatureCard
                                icon={<Shield size={24} color="#60a5fa" />}
                                title="AI Assessment Engine"
                                description="Multi-model orchestration across GPT-4o, Claude, and Gemini. Parallel framework analysis with automatic gap detection and remediation scoring."
                                accent="#3b82f6"
                                items={[
                                    "GDPR · PDPL · DIFC · PDPA simultaneous scan",
                                    "Automated control gap scoring 0–100",
                                    "AI-generated remediation roadmaps",
                                    "Framework-to-framework control mapping",
                                ]}
                                delay={100}
                            />
                            <FeatureCard
                                icon={<Scale size={24} color="#4ade80" />}
                                title="Jurisdiction Intelligence"
                                description="Real-time legal knowledge graph covering 40+ jurisdictions. Cross-border transfer risk scoring and proactive regulatory change alerts."
                                accent="#10b981"
                                items={[
                                    "40+ jurisdictions · live regulatory updates",
                                    "GDPR SCCs / BCRs adequacy checks",
                                    "Transfer risk calculator EU→US, EU→SA",
                                    "Law library with AI-powered search",
                                ]}
                                delay={250}
                            />
                            <FeatureCard
                                icon={<Lock size={24} color="#c084fc" />}
                                title="Enterprise RBAC"
                                description="Multi-layer role architecture with fine-grained per-module permissions, onboarding gates, vendor sharing tokens, and regulator oversight."
                                accent="#8b5cf6"
                                items={[
                                    "7 platform roles · 4 org roles",
                                    "Per-module permission overrides",
                                    "Vendor share tokens with expiry",
                                    "Regulator oversight relationships",
                                ]}
                                delay={400}
                            />
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 4 · LIVE FEED + GAUGE ═════════════════════════════ */}
                <section className="relative px-6 py-24">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left — live feed */}
                        <div style={{ animation: "slide-up .7s ease both" }}>
                            <div
                                className="inline-flex items-center gap-2 text-xs font-mono mb-4"
                                style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}
                            >
                                <div className="h-px w-8 bg-current" />
                                REAL-TIME COMPLIANCE EVENTS
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                                Always-on compliance<br />
                                <span style={{ color: "#4ade80" }}>monitoring engine</span>
                            </h2>
                            <p
                                className="text-sm leading-relaxed mb-7"
                                style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                                Stream live audit events, AI decisions, risk scoring updates, and cross-border
                                transfer flags — all in one immutable, timestamped compliance feed.
                            </p>
                            <DataFeed />
                        </div>

                        {/* Right — gauge + mini stats */}
                        <div className="flex flex-col items-center gap-8">
                            <ScoreGauge score={98.4} />

                            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                                {[
                                    { label: "Frameworks Active", value: "47", color: "#3b82f6" },
                                    { label: "Risk Posture", value: "Low", color: "#4ade80" },
                                    { label: "Open Gaps", value: "3", color: "#fbbf24" },
                                    { label: "Vendors Reviewed", value: "12/12", color: "#c084fc" },
                                ].map(({ label, value, color }) => (
                                    <div
                                        key={label}
                                        className="rounded-xl px-3 py-3 text-center"
                                        style={{
                                            background: `${color}08`,
                                            border: `1px solid ${color}22`,
                                        }}
                                    >
                                        <div className="font-bold text-base" style={{ color }}>{value}</div>
                                        <div className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 5 · TECH STACK BANNER ═════════════════════════════ */}
                <section className="relative px-6 py-24">
                    <div className="max-w-6xl mx-auto">
                        <div
                            className="relative rounded-2xl p-10 md:p-14 overflow-hidden text-center"
                            style={{
                                background:
                                    "linear-gradient(135deg,rgba(59,130,246,.07) 0%,rgba(16,185,129,.05) 100%)",
                                border: "1px solid rgba(99,157,255,.2)",
                                boxShadow: "0 0 90px rgba(59,130,246,.07)",
                            }}
                        >
                            {/* Scan line sweep */}
                            <div
                                className="absolute left-0 right-0 h-[2px] pointer-events-none"
                                style={{
                                    background:
                                        "linear-gradient(90deg,transparent 0%,rgba(99,157,255,.65) 50%,transparent 100%)",
                                    animation: "scan 5s linear infinite",
                                }}
                            />

                            <div
                                className="inline-flex items-center gap-2 text-xs font-mono mb-6"
                                style={{ color: "hsl(var(--muted-foreground))", opacity: 0.6 }}
                            >
                                <div className="h-px w-8 bg-current" />
                                ENTERPRISE TECH STACK
                                <div className="h-px w-8 bg-current" />
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                                Engineered on a{" "}
                                <span
                                    style={{
                                        background: "linear-gradient(90deg,#60a5fa,#34d399,#a78bfa)",
                                        backgroundSize: "200%",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                        animation: "gradient-x 4.5s ease infinite",
                                    }}
                                >
                                    production-grade
                                </span>{" "}
                                foundation
                            </h2>

                            <p
                                className="max-w-xl mx-auto mb-10 text-sm leading-relaxed"
                                style={{ color: "hsl(var(--muted-foreground))" }}
                            >
                                React 19 · TypeScript strict · tRPC 11 · Drizzle ORM · MariaDB · Express 4 ·
                                Tailwind CSS 4 · shadcn/ui · Wouter · Sonner
                            </p>

                            <div className="flex flex-wrap justify-center gap-3">
                                {[
                                    { label: "React 19", color: "#61dafb" },
                                    { label: "TypeScript", color: "#3178c6" },
                                    { label: "tRPC 11", color: "#398ccb" },
                                    { label: "Drizzle ORM", color: "#c5f74f" },
                                    { label: "Tailwind v4", color: "#38bdf8" },
                                    { label: "Express 4", color: "#68a063" },
                                    { label: "shadcn/ui", color: "#a78bfa" },
                                    { label: "Wouter", color: "#f97316" },
                                    { label: "Sonner", color: "#f59e0b" },
                                    { label: "MariaDB", color: "#4e9ad4" },
                                    { label: "Lucide React", color: "#e879f9" },
                                    { label: "Recharts", color: "#8884d8" },
                                ].map(({ label, color }) => (
                                    <span
                                        key={label}
                                        className="px-3 py-1.5 rounded-full text-xs font-mono font-medium"
                                        style={{
                                            background: `${color}0f`,
                                            border: `1px solid ${color}28`,
                                            color,
                                        }}
                                    >
                                        {label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ FOOTER ══════════════════════════════════════════════════════ */}
                <footer
                    className="relative px-6 py-10 border-t"
                    style={{ borderColor: "hsl(var(--border)/.35)" }}
                >
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">

                        {/* Brand */}
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{
                                    background: "linear-gradient(135deg,#3b82f6,#10b981)",
                                    boxShadow: "0 0 18px rgba(59,130,246,.45)",
                                }}
                            >
                                <Shield size={16} color="white" />
                            </div>
                            <span className="font-bold text-sm">DJAC Platform</span>
                            <span className="text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>v2.0</span>
                        </div>

                        <p className="text-xs text-center" style={{ color: "hsl(var(--muted-foreground))" }}>
                            © 2026 Yalla-Hack · Compliance data is jurisdiction-specific and subject to local law.
                        </p>

                        {/* Status */}
                        <div className="flex items-center gap-1.5 text-xs font-mono" style={{ color: "hsl(var(--muted-foreground))" }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ animation: "glow-green 1.6s ease-in-out infinite" }} />
                            All systems operational
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}
