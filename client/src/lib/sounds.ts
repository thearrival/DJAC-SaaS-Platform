/**
 * DJAC Sound Manager
 * ──────────────────────────────────────────────────────────────────────────────
 * Professional micro-sounds synthesised entirely via Web Audio API.
 * No external audio files needed. All sounds are generated programmatically.
 *
 * Respects user preference:
 *  - disabled if `prefers-reduced-motion` is set (default)
 *  - user can override via localStorage("djac_sounds_enabled", "true"|"false")
 */

const STORAGE_KEY = "djac_sounds_enabled";

export function getSoundEnabled(): boolean {
    try {
        if (typeof window === "undefined") return false;
        const stored = window.localStorage?.getItem(STORAGE_KEY) ?? null;
        if (stored !== null) return stored === "true";
        // Default: disabled when user prefers reduced motion, enabled otherwise.
        if (typeof window.matchMedia !== "function") return true;
        return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
        return false;
    }
}

export function setSoundEnabled(enabled: boolean): void {
    try {
        if (typeof window === "undefined") return;
        window.localStorage?.setItem(STORAGE_KEY, String(enabled));
    } catch {
        // Ignore storage failures in privacy-restricted browsers.
    }
}

// ── AudioContext singleton (lazy-init, never closed) ─────────────────────────
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
    if (!getSoundEnabled()) return null;
    if (!_ctx || _ctx.state === "closed") {
        try {
            _ctx = new AudioContext();
        } catch {
            return null;
        }
    }
    if (_ctx.state === "suspended") {
        _ctx.resume().catch(() => { });
    }
    return _ctx;
}

// ── Primitive tone builder ───────────────────────────────────────────────────
function tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    peakGain = 0.14,
    attackTime = 0.005,
    releaseRatio = 0.65,
    delayMs = 0,
): void {
    const ctx = getCtx();
    if (!ctx) return;
    const at = ctx.currentTime + delayMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(peakGain, at + attackTime);
    gain.gain.exponentialRampToValueAtTime(
        0.0001,
        at + attackTime + duration * releaseRatio,
    );
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + attackTime + duration);
}

// ── Public sound catalogue ────────────────────────────────────────────────────

export const sounds = {
    /**
     * Soft click — used on every button/nav interaction.
     * Very short triangle wave at 820 Hz.
     */
    click(): void {
        tone(820, 0.055, "triangle", 0.07, 0.003, 0.7);
    },

    /**
     * Navigate — used when changing routes in the sidebar.
     * Two-note ascending whoosh.
     */
    navigate(): void {
        tone(560, 0.07, "sine", 0.06, 0.003, 0.65, 0);
        tone(780, 0.06, "sine", 0.05, 0.003, 0.65, 45);
    },

    /**
     * Success — ascending 3-note chime.
     * Used on form save / assessment complete / report generated.
     */
    success(): void {
        tone(523, 0.09, "sine", 0.14, 0.004, 0.70, 0);
        tone(659, 0.09, "sine", 0.12, 0.004, 0.70, 80);
        tone(784, 0.18, "sine", 0.10, 0.004, 0.75, 160);
    },

    /**
     * Error — descending buzz.
     * Used on form errors / tRPC rejections.
     */
    error(): void {
        tone(340, 0.09, "sawtooth", 0.08, 0.004, 0.65, 0);
        tone(280, 0.13, "sawtooth", 0.06, 0.004, 0.65, 100);
    },

    /**
     * Notification — bright two-ping.
     * Used when a new notification arrives.
     */
    notification(): void {
        tone(880, 0.055, "sine", 0.10, 0.003, 0.60, 0);
        tone(1047, 0.095, "sine", 0.08, 0.003, 0.65, 55);
    },

    /**
     * Tour step — gentle ascending interval.
     * Used when advancing to the next tour step.
     */
    tourStep(): void {
        tone(440, 0.07, "sine", 0.10, 0.003, 0.65, 0);
        tone(550, 0.09, "sine", 0.08, 0.003, 0.65, 55);
    },

    /**
     * Tour complete — full ascending 4-note fanfare.
     * Used when the onboarding tour is finished.
     */
    tourComplete(): void {
        tone(523, 0.08, "sine", 0.14, 0.004, 0.65, 0);
        tone(659, 0.08, "sine", 0.12, 0.004, 0.65, 80);
        tone(784, 0.08, "sine", 0.10, 0.004, 0.65, 160);
        tone(1047, 0.20, "sine", 0.09, 0.004, 0.75, 240);
    },

    /**
     * Open / expand — rising soft tone.
     * Used when dialogs / panels open.
     */
    open(): void {
        tone(600, 0.08, "sine", 0.07, 0.004, 0.70, 0);
        tone(720, 0.07, "sine", 0.06, 0.004, 0.70, 50);
    },

    /**
     * Close / dismiss — falling soft tone.
     * Used when dialogs / panels close.
     */
    close(): void {
        tone(720, 0.07, "sine", 0.06, 0.004, 0.70, 0);
        tone(540, 0.08, "sine", 0.05, 0.004, 0.70, 50);
    },
} as const;

export default sounds;
