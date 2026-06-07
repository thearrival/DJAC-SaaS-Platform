// ParticleField — DJAC_ANIMATION_EXPORT.tsx (exact spec)
// Canvas particle mesh: 80 particles, dual-hue gradient connections,
// pulsing glow, mouse repulsion + boost, floating hexagons, DPI-aware.
import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    pulse: number;
    pulseSpeed: number;
    hue: number;
}

export function ParticleField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        const particles: Particle[] = [];
        const PARTICLE_COUNT = 80;
        const CONNECTION_DIST = 150;
        const MOUSE_RADIUS = 200;

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.setTransform(
                window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0
            );
        };
        resize();
        window.addEventListener("resize", resize);

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };
        window.addEventListener("mousemove", handleMouseMove);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * canvas.offsetWidth,
                y: Math.random() * canvas.offsetHeight,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2.5 + 0.5,
                alpha: Math.random() * 0.6 + 0.15,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.03,
                hue: Math.random() > 0.7 ? 260 : 185,
            });
        }

        let time = 0;

        const draw = () => {
            time += 0.01;
            const w = canvas.offsetWidth;
            const h = canvas.offsetHeight;
            ctx.clearRect(0, 0, w, h);

            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONNECTION_DIST) {
                        const strength = 1 - dist / CONNECTION_DIST;
                        const midX = (particles[i].x + particles[j].x) / 2;
                        const midY = (particles[i].y + particles[j].y) / 2;
                        const mouseDist = Math.sqrt(
                            (midX - mx) ** 2 + (midY - my) ** 2
                        );
                        const mouseBoost =
                            mouseDist < MOUSE_RADIUS
                                ? (1 - mouseDist / MOUSE_RADIUS) * 0.3
                                : 0;

                        const gradient = ctx.createLinearGradient(
                            particles[i].x, particles[i].y,
                            particles[j].x, particles[j].y
                        );
                        const baseAlpha = 0.06 * strength + mouseBoost;
                        gradient.addColorStop(0, `hsla(185, 100%, 60%, ${baseAlpha})`);
                        gradient.addColorStop(0.5, `hsla(220, 80%, 60%, ${baseAlpha * 1.5})`);
                        gradient.addColorStop(1, `hsla(260, 80%, 60%, ${baseAlpha})`);

                        ctx.beginPath();
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 0.5 + strength * 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            particles.forEach((p) => {
                p.pulse += p.pulseSpeed;
                const pulseAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));
                const mouseDist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
                const mouseInfluence =
                    mouseDist < MOUSE_RADIUS ? 1 - mouseDist / MOUSE_RADIUS : 0;
                const finalAlpha = Math.min(pulseAlpha + mouseInfluence * 0.5, 1);
                const finalSize = p.size + mouseInfluence * 2;

                // Glow halo
                if (finalAlpha > 0.3) {
                    ctx.beginPath();
                    const glow = ctx.createRadialGradient(
                        p.x, p.y, 0, p.x, p.y, finalSize * 4
                    );
                    glow.addColorStop(
                        0, `hsla(${p.hue}, 100%, 60%, ${finalAlpha * 0.3})`
                    );
                    glow.addColorStop(1, `hsla(${p.hue}, 100%, 60%, 0)`);
                    ctx.fillStyle = glow;
                    ctx.arc(p.x, p.y, finalSize * 4, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Core dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, finalSize, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${finalAlpha})`;
                ctx.fill();

                // Mouse repulsion
                if (mouseDist < MOUSE_RADIUS * 0.5) {
                    const angle = Math.atan2(p.y - my, p.x - mx);
                    const force = (1 - mouseDist / (MOUSE_RADIUS * 0.5)) * 0.5;
                    p.vx += Math.cos(angle) * force;
                    p.vy += Math.sin(angle) * force;
                }

                // Damping + movement
                p.vx *= 0.995;
                p.vy *= 0.995;
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0) { p.x = 0; p.vx *= -1; }
                if (p.x > w) { p.x = w; p.vx *= -1; }
                if (p.y < 0) { p.y = 0; p.vy *= -1; }
                if (p.y > h) { p.y = h; p.vy *= -1; }
            });

            // Floating hexagons
            for (let i = 0; i < 3; i++) {
                const hx = w * (0.2 + i * 0.3) + Math.sin(time * 0.5 + i) * 30;
                const hy = h * 0.5 + Math.cos(time * 0.3 + i * 2) * 50;
                const hexSize = 20 + i * 10;

                ctx.save();
                ctx.translate(hx, hy);
                ctx.rotate(time * 0.2 + i);
                ctx.beginPath();
                for (let s = 0; s < 6; s++) {
                    const angle = (Math.PI / 3) * s - Math.PI / 6;
                    const method = s === 0 ? "moveTo" : "lineTo";
                    ctx[method](Math.cos(angle) * hexSize, Math.sin(angle) * hexSize);
                }
                ctx.closePath();
                ctx.strokeStyle = `hsla(185, 100%, 60%, ${0.04 + Math.sin(time + i) * 0.02})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
                ctx.restore();
            }

            animId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ width: "100%", height: "100%" }}
        />
    );
}
