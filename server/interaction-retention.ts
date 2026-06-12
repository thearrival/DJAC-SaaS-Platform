import { ENV } from "./_core/env";
import { enforceInteractionRetention } from "./control-center-store";

const HOUR_MS = 60 * 60 * 1000;

export function startInteractionRetentionScheduler(): () => void {
    if (!ENV.interactionRetentionAutoRun) {
        console.info("[InteractionRetention] Auto-run disabled.");
        return () => undefined;
    }

    const intervalMs = ENV.interactionRetentionIntervalHours * HOUR_MS;
    let running = false;

    const run = async () => {
        if (running) {
            console.warn("[InteractionRetention] Previous run still active; skipping this cycle.");
            return;
        }

        running = true;
        try {
            const result = await enforceInteractionRetention(ENV.interactionRetentionDays, false);
            console.info(
                `[InteractionRetention] Completed. Deleted ${result.deletedLogs} logs older than ${result.retentionDays} days.`
            );
        } catch (error) {
            console.warn("[InteractionRetention] Scheduler run failed:", error);
        } finally {
            running = false;
        }
    };

    void run();
    const timer = setInterval(() => {
        void run();
    }, intervalMs);

    console.info(
        `[InteractionRetention] Scheduler started. Every ${ENV.interactionRetentionIntervalHours}h, retention=${ENV.interactionRetentionDays}d.`
    );

    return () => {
        clearInterval(timer);
    };
}
