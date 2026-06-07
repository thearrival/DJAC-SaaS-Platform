import { ENV } from "../_core/env";
import { executeAssessmentPipeline } from "./pipeline";
import { persistAssessmentReport } from "./persistence";
import type {
    AssessmentHistoryClearResult,
    AssessmentHistoryDiagnostics,
    AssessmentJobInput,
    QueueSnapshotListener,
} from "./queue";
import { getAssessmentQueue } from "./queueFactory";

const queue = getAssessmentQueue();

queue.setWorker(async (job, onProgress) => {
    const report = await executeAssessmentPipeline(
        {
            source: job.source,
            engine: job.engine,
            vendor: job.vendor,
            rawDocumentText: job.rawDocumentText,
        },
        (stage, message) => {
            onProgress({ stage, message });
        }
    );

    onProgress({
        stage: "persistence",
        message: "Persisting report payload to compliance tables.",
    });

    const persistence = await persistAssessmentReport(
        report,
        Boolean(job.persistResult)
    );

    return {
        report,
        persistence,
    };
});

export function enqueueAssessmentJob(input: AssessmentJobInput) {
    return queue.enqueue(input);
}

export function getAssessmentJob(jobId: string) {
    return queue.get(jobId);
}

export function listAssessmentJobsForUser(userId: number, limit = 20) {
    return queue.listByUser(userId, limit);
}

export function getAssessmentHistoryDiagnostics(
    userId: number
): Promise<AssessmentHistoryDiagnostics> {
    return queue.getHistoryDiagnostics(userId);
}

export function clearAssessmentHistory(
    userId: number
): Promise<AssessmentHistoryClearResult> {
    return queue.clearHistory(userId);
}

export async function waitForAssessmentJob(jobId: string, timeoutMs?: number) {
    return queue.waitForCompletion(jobId, timeoutMs ?? ENV.aiJobTimeoutMs);
}

export function subscribeAssessmentJobSnapshots(listener: QueueSnapshotListener) {
    return queue.subscribe(listener);
}

export async function runAssessmentSync(input: AssessmentJobInput) {
    const queued = await enqueueAssessmentJob(input);
    const finished = await waitForAssessmentJob(queued.id, ENV.aiJobTimeoutMs);

    if (!finished) {
        throw new Error("Assessment job could not be retrieved after enqueue.");
    }

    if (finished.status === "failed") {
        throw new Error(
            finished.error || "Assessment orchestration failed without details."
        );
    }

    if (finished.status !== "completed" || !finished.result) {
        throw new Error("Assessment orchestration timed out before completion.");
    }

    return {
        job: finished,
        report: finished.result,
    };
}
