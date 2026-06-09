import { Queue, Worker, type JobsOptions } from "bullmq";
import type {
    AiAssessmentReport,
    AiJobEvent,
    AiJobSnapshot,
    AiJobStage,
    AiJobStatus,
} from "./schemas";
import type {
    AssessmentHistoryClearResult,
    AssessmentHistoryDiagnostics,
    AssessmentJobInput,
    AssessmentQueue,
    JobWorker,
    JobWorkerResult,
    QueueSnapshotListener,
} from "./queue";

type InternalJobRecord = {
    id: string;
    userId: number;
    status: AiJobStatus;
    stage: AiJobStage;
    input: AssessmentJobInput;
    createdAt: string;
    updatedAt: string;
    events: AiJobEvent[];
    result?: AiAssessmentReport;
    error?: string;
    persistence?: {
        savedAssessments: number;
        savedGaps: number;
        skipped: boolean;
    };
};

const QUEUE_NAME = "djac-ai-assessment";
const JOB_NAME = "assessment";
const EVENT_RETENTION = 300;
const JOB_WAIT_POLL_MS = 120;

function nowIso() {
    return new Date().toISOString();
}

function toSnapshot(job: InternalJobRecord): AiJobSnapshot {
    return {
        id: job.id,
        userId: job.userId,
        status: job.status,
        stage: job.stage,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        events: job.events,
        ...(job.error ? { error: job.error } : {}),
        ...(job.result ? { result: job.result } : {}),
        ...(job.persistence ? { persistence: job.persistence } : {}),
    };
}

function stateToStatus(state: string): AiJobStatus {
    if (state === "completed") return "completed";
    if (state === "failed") return "failed";
    if (state === "active") return "running";
    return "queued";
}

type BullProgressShape = {
    stage?: AiJobStage;
    message?: string;
    timestamp?: string;
};

function parseBullProgress(value: unknown): BullProgressShape {
    if (!value || typeof value !== "object") {
        return {};
    }

    const progress = value as Record<string, unknown>;
    const stage =
        typeof progress.stage === "string"
            ? (progress.stage as AiJobStage)
            : undefined;
    const message =
        typeof progress.message === "string" ? progress.message : undefined;
    const timestamp =
        typeof progress.timestamp === "string" ? progress.timestamp : undefined;

    return {
        stage,
        message,
        timestamp,
    };
}

export class RedisAssessmentQueue implements AssessmentQueue {
    private readonly queue: Queue;
    private readonly records = new Map<string, InternalJobRecord>();
    private readonly listeners = new Set<QueueSnapshotListener>();
    private workerFn: JobWorker | null = null;
    private worker: Worker | null = null;

    constructor(redisUrl: string) {
        this.queue = new Queue(QUEUE_NAME, {
            connection: {
                url: redisUrl,
            },
            defaultJobOptions: {
                removeOnComplete: false,
                removeOnFail: false,
            } satisfies JobsOptions,
        });
    }

    setWorker(worker: JobWorker): void {
        this.workerFn = worker;
        if (this.worker) return;

        this.worker = new Worker(
            QUEUE_NAME,
            async job => {
                if (!this.workerFn) {
                    throw new Error("No worker callback registered for Redis queue.");
                }

                const id = String(job.id ?? "");
                if (!id) {
                    throw new Error("Redis queue job is missing id.");
                }

                const jobData = job.data as AssessmentJobInput;
                const record =
                    this.records.get(id) ||
                    this.createRecordFromData(id, jobData, "queued", "queued");

                record.status = "running";
                this.pushEvent(record, "gatekeeper", "Worker started processing job.");

                const result = await this.workerFn(jobData, progress => {
                    this.pushEvent(record, progress.stage, progress.message);
                    void job.updateProgress({
                        stage: progress.stage,
                        message: progress.message,
                        timestamp: nowIso(),
                    });
                });

                record.status = "completed";
                record.result = result.report;
                record.persistence = result.persistence;
                this.pushEvent(record, "completed", "Assessment orchestration completed.");

                return result;
            },
            {
                connection: {
                    url: this.queue.opts.connection && typeof this.queue.opts.connection === "object" && "url" in this.queue.opts.connection
                        ? (this.queue.opts.connection as { url: string }).url
                        : undefined,
                },
                concurrency: 1,
            }
        );

        this.worker.on("failed", (job, error) => {
            if (!job) return;
            const id = String(job.id ?? "");
            if (!id) return;

            const record =
                this.records.get(id) ||
                this.createRecordFromData(id, job.data as AssessmentJobInput, "failed", "failed");
            record.status = "failed";
            record.error = error?.message || job.failedReason || "Unknown queue failure.";
            this.pushEvent(record, "failed", "Assessment orchestration failed.");
        });
    }

    async enqueue(input: AssessmentJobInput): Promise<AiJobSnapshot> {
        const job = await this.queue.add(JOB_NAME, input as unknown as Record<string, unknown>);
        const id = String(job.id ?? "");
        if (!id) {
            throw new Error("Redis queue did not return a job id.");
        }

        const record = this.createRecordFromData(id, input, "queued", "queued");
        this.pushEvent(record, "queued", "Job queued for orchestration.");
        return toSnapshot(record);
    }

    async get(jobId: string): Promise<AiJobSnapshot | null> {
        const existing = this.records.get(jobId);
        if (existing) {
            return toSnapshot(existing);
        }

        const job = await this.queue.getJob(jobId);
        if (!job) return null;

        const state = await job.getState();
        const status = stateToStatus(state);
        const progress = parseBullProgress(job.progress);
        const stage = progress.stage || (status === "completed" ? "completed" : status === "failed" ? "failed" : "queued");

        const record = this.createRecordFromData(
            jobId,
            job.data as AssessmentJobInput,
            status,
            stage
        );

        if (progress.message) {
            record.events.push({
                stage,
                message: progress.message,
                timestamp: progress.timestamp || nowIso(),
            });
        }

        if (status === "failed") {
            record.error = job.failedReason || "Assessment orchestration failed.";
        }

        if (status === "completed" && job.returnvalue) {
            const result = job.returnvalue as Partial<JobWorkerResult>;
            if (result.report) {
                record.result = result.report;
            }
            if (result.persistence) {
                record.persistence = result.persistence;
            }
        }

        this.records.set(jobId, record);
        return toSnapshot(record);
    }

    async listByUser(userId: number, limit = 20): Promise<AiJobSnapshot[]> {
        const inMemory = Array.from(this.records.values())
            .filter(record => record.userId === userId)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .slice(0, limit)
            .map(toSnapshot);

        if (inMemory.length > 0) {
            return inMemory;
        }

        const jobs = await this.queue.getJobs(
            ["wait", "active", "completed", "failed", "delayed"],
            0,
            Math.max(limit * 5, 50)
        );

        const snapshots: AiJobSnapshot[] = [];
        for (const job of jobs) {
            const id = String(job.id ?? "");
            if (!id) continue;
            const data = job.data as AssessmentJobInput;
            if (data.userId !== userId) continue;

            const snapshot = await this.get(id);
            if (snapshot) snapshots.push(snapshot);
            if (snapshots.length >= limit) break;
        }

        return snapshots
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .slice(0, limit);
    }

    async waitForCompletion(
        jobId: string,
        timeoutMs: number
    ): Promise<AiJobSnapshot | null> {
        const started = Date.now();

        while (Date.now() - started < timeoutMs) {
            const snapshot = await this.get(jobId);
            if (!snapshot) return null;
            if (snapshot.status === "completed" || snapshot.status === "failed") {
                return snapshot;
            }

            await new Promise(resolve => setTimeout(resolve, JOB_WAIT_POLL_MS));
        }

        return this.get(jobId);
    }

    async getHistoryDiagnostics(userId: number): Promise<AssessmentHistoryDiagnostics> {
        const snapshots = await this.listByUser(userId, 100);
        const queuedJobCount = snapshots.filter(
            snapshot => snapshot.status === "queued"
        ).length;
        const activeJobCount = snapshots.filter(
            snapshot => snapshot.status === "queued" || snapshot.status === "running"
        ).length;

        return {
            queueMode: "redis",
            storageType: "redis",
            storageEnabled: true,
            supportsClear: false,
            historyEntryCount: snapshots.length,
            activeJobCount,
            queuedJobCount,
            ...(snapshots[0]?.updatedAt ? { lastUpdatedAt: snapshots[0].updatedAt } : {}),
            details:
                "Redis-backed queue history is available from BullMQ storage. Diagnostics are sampled from recent jobs and clear history is disabled to avoid deleting shared queue records.",
        };
    }

    async clearHistory(userId: number): Promise<AssessmentHistoryClearResult> {
        const snapshots = await this.listByUser(userId, 100);

        return {
            queueMode: "redis",
            storageType: "redis",
            supportsClear: false,
            clearedCount: 0,
            remainingCount: snapshots.length,
            details:
                "Clear history is not supported in Redis queue mode because queue records may be shared with active workers.",
        };
    }

    subscribe(listener: QueueSnapshotListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private createRecordFromData(
        id: string,
        input: AssessmentJobInput,
        status: AiJobStatus,
        stage: AiJobStage
    ) {
        const createdAt = nowIso();
        const record: InternalJobRecord = {
            id,
            userId: input.userId,
            status,
            stage,
            input,
            createdAt,
            updatedAt: createdAt,
            events: [],
        };

        this.records.set(id, record);
        return record;
    }

    private pushEvent(record: InternalJobRecord, stage: AiJobStage, message: string) {
        const timestamp = nowIso();
        record.stage = stage;
        record.updatedAt = timestamp;
        record.events.push({ stage, message, timestamp });

        if (record.events.length > EVENT_RETENTION) {
            record.events.splice(0, record.events.length - EVENT_RETENTION);
        }

        this.emitSnapshot(record);
    }

    private emitSnapshot(record: InternalJobRecord) {
        const snapshot = toSnapshot(record);
        for (const listener of Array.from(this.listeners)) {
            try {
                listener(snapshot);
            } catch {
                // Listener failures should not interrupt queue processing.
            }
        }
    }

    async close(): Promise<void> {
        if (this.worker) {
            await this.worker.close();
        }
        await this.queue.close();
        this.records.clear();
        this.listeners.clear();
    }
}
