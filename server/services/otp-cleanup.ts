/**
 * OTP Cleanup Scheduler
 * Periodically removes expired OTP codes from the database to prevent
 * unbounded table growth. Runs every 15 minutes.
 */
import { cleanupExpiredOtps } from "./otp";

const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

export function startOtpCleanupScheduler(): () => void {
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      await cleanupExpiredOtps();
    } catch (err) {
      console.warn("[OtpCleanup] Cleanup failed:", (err as Error).message);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(() => void run(), CLEANUP_INTERVAL_MS);
  console.info("[OtpCleanup] Scheduler started. Interval: 15min.");
  return () => clearInterval(timer);
}
