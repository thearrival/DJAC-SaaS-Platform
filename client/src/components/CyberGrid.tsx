// CyberGrid — DJAC_ANIMATION_EXPORT.tsx (exact spec)
// Fixed background grid: 20×20 scan lines, dual scan beams, 5 pulse points,
// 4 corner bracket decorations. All pointer-events-none, z-0.
import { motion } from "framer-motion";

export function CyberGrid() {
  const corners = [
    { top: "5%", left: "5%", rotation: 0 },
    { top: "5%", right: "5%", rotation: 90 },
    { bottom: "5%", right: "5%", rotation: 180 },
    { bottom: "5%", left: "5%", rotation: 270 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.04]">
      {/* Horizontal lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute left-0 right-0 h-px bg-primary"
          style={{ top: `${(i + 1) * 5}%` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.2, delay: i * 0.03, ease: "easeOut" }}
        />
      ))}

      {/* Vertical lines */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 w-px bg-primary"
          style={{ left: `${(i + 1) * 5}%` }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{
            duration: 1.2,
            delay: 0.5 + i * 0.03,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Scanning beam — horizontal */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, hsl(var(--primary)) 30%, hsl(var(--primary)) 70%, transparent 100%)",
          boxShadow:
            "0 0 30px hsl(var(--primary)), 0 0 60px hsl(var(--primary)), 0 0 100px hsl(var(--primary))",
        }}
        initial={{ top: "-2%" }}
        animate={{ top: "102%" }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {/* Scanning beam — vertical */}
      <motion.div
        className="absolute top-0 bottom-0 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, hsl(var(--secondary)) 30%, hsl(var(--secondary)) 70%, transparent 100%)",
          boxShadow:
            "0 0 20px hsl(var(--secondary)), 0 0 40px hsl(var(--secondary))",
        }}
        initial={{ left: "-2%" }}
        animate={{ left: "102%" }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
          delay: 2,
        }}
      />

      {/* Intersection pulse points */}
      {[
        { x: 25, y: 25 },
        { x: 50, y: 50 },
        { x: 75, y: 75 },
        { x: 25, y: 75 },
        { x: 75, y: 25 },
      ].map((point, i) => (
        <motion.div
          key={`pulse-${i}`}
          className="absolute w-2 h-2 rounded-full bg-primary"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            scale: [1, 2.5, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
        />
      ))}

      {/* Corner bracket decorations */}
      {corners.map((pos, i) => (
        <motion.div
          key={`corner-${i}`}
          className="absolute w-12 h-12"
          style={{
            top: pos.top,
            right: pos.right,
            bottom: pos.bottom,
            left: pos.left,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.6, scale: 1 }}
          transition={{ delay: 1.5 + i * 0.2, duration: 0.5 }}
        >
          <div
            className="absolute top-0 left-0 w-full h-px bg-primary"
            style={{ transform: `rotate(${pos.rotation}deg)` }}
          />
          <div
            className="absolute top-0 left-0 h-full w-px bg-primary"
            style={{ transform: `rotate(${pos.rotation}deg)` }}
          />
        </motion.div>
      ))}
    </div>
  );
}
