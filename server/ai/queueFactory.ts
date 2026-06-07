import { ENV } from "../_core/env";
import { InMemoryAssessmentQueue, type AssessmentQueue } from "./queue";
import { RedisAssessmentQueue } from "./redisQueue";

let queueSingleton: AssessmentQueue | null = null;

export function getAssessmentQueue(): AssessmentQueue {
    if (queueSingleton) {
        return queueSingleton;
    }

    if (ENV.aiQueueMode === "redis") {
        const redisUrl = ENV.redisUrl.trim();
        if (!redisUrl) {
            console.warn(
                "[AI Orchestrator] AI_QUEUE_MODE=redis but REDIS_URL is empty. Falling back to in-memory queue."
            );
        } else {
            try {
                queueSingleton = new RedisAssessmentQueue(redisUrl);
                console.log("[AI Orchestrator] Redis queue mode enabled.");
                return queueSingleton;
            } catch (error) {
                console.warn(
                    "[AI Orchestrator] Failed to initialize Redis queue. Falling back to in-memory queue:",
                    error
                );
            }
        }
    }

    queueSingleton = new InMemoryAssessmentQueue({
        historyFilePath: ENV.aiJobHistoryFile,
    });
    console.log("[AI Orchestrator] In-memory queue mode enabled.");
    return queueSingleton;
}
