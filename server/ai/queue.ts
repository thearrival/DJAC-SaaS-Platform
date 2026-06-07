import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import type { Vendor } from "../../drizzle/schema";
import {
    aiJobSnapshotSchema,
    type AiAssessmentReport,
    type AiJobEvent,
    type AiJobSnapshot,
    type AiJobStage,
    type AiJobStatus,
} from "./schemas";

export type AssessmentJobSource = "vendor_profile" | "document_upload";
export type AssessmentJobEngine = "native";

export type AssessmentJobInput = {
    userId: number;
    source: AssessmentJobSource;
    engine?: AssessmentJobEngine;
    vendor: Vendor;
    rawDocumentText?: string;
    persistResult?: boolean;
};

export type AssessmentJobProgress = {
    stage: AiJobStage;
    message: string;
};

type InMemoryAssessmentQueueOptions = {
    historyFilePath?: string;
};

type PersistedHistoryPayload = {
    version: number;
    snapshots: AiJobSnapshot[];
};

type PersistedHistoryRaw =
    | PersistedHistoryPayload
    | {
        snapshots?: unknown;
    }
    | unknown[];

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

export type JobWorkerResult = {
    report: AiAssessmentReport;
    persistence: {
        savedAssessments: number;
        savedGaps: number;
        skipped: boolean;
    };
};

export type JobWorker = (
    job: AssessmentJobInput,
    onProgress: (progress: AssessmentJobProgress) => void
) => Promise<JobWorkerResult>;

export type QueueSnapshotListener = (snapshot: AiJobSnapshot) => void;

export type AssessmentHistoryDiagnostics = {
    queueMode: "in_memory" | "redis";
    storageType: "file" | "redis" | "memory_only";
    storageEnabled: boolean;
    supportsClear: boolean;
    historyEntryCount: number;
    activeJobCount: number;
    queuedJobCount: number;
    historyRetentionLimit?: number;
    storagePath?: string;
    lastUpdatedAt?: string;
    details: string;
};

export type AssessmentHistoryClearResult = {
    queueMode: "in_memory" | "redis";
    storageType: "file" | "redis" | "memory_only";
    supportsClear: boolean;
    clearedCount: number;
    remainingCount: number;
    storagePath?: string;
    details: string;
};

export interface AssessmentQueue {
    setWorker(worker: JobWorker): void;
    enqueue(input: AssessmentJobInput): Promise<AiJobSnapshot>;
    get(jobId: string): Promise<AiJobSnapshot | null>;
    listByUser(userId: number, limit?: number): Promise<AiJobSnapshot[]>;
    waitForCompletion(jobId: string, timeoutMs: number): Promise<AiJobSnapshot | null>;
    getHistoryDiagnostics(userId: number): Promise<AssessmentHistoryDiagnostics>;
    clearHistory(userId: number): Promise<AssessmentHistoryClearResult>;
    subscribe(listener: QueueSnapshotListener): () => void;
}

const QUEUE_IDLE_DELAY_MS = 20;
const JOB_WAIT_POLL_MS = 120;
const EVENT_RETENTION = 300;
const HISTORY_RETENTION = 500;

function nowIso() {
    return new Date().toISOString();
}

function sortByCreatedDesc(a: { createdAt: string }, b: { createdAt: string }) {
    return a.createdAt < b.createdAt ? 1 : -1;
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

export class InMemoryAssessmentQueue implements AssessmentQueue {
    private readonly jobs = new Map<string, InternalJobRecord>();
    private readonly persistedSnapshots = new Map<string, AiJobSnapshot>();
    private readonly queue: string[] = [];
    private readonly listeners = new Set<QueueSnapshotListener>();
    private readonly historyFilePath: string;
    private readonly historyReady: Promise<void>;
    private worker: JobWorker | null = null;
    private running = false;
    private historyWriteTask: Promise<void> = Promise.resolve();
    private historyLastSavedAt?: string;

    constructor(options: InMemoryAssessmentQueueOptions = {}) {
        this.historyFilePath = options.historyFilePath?.trim() ?? "";
        this.historyReady = this.loadHistory();
    }

    setWorker(worker: JobWorker) {
        this.worker = worker;
    }

    async enqueue(input: AssessmentJobInput): Promise<AiJobSnapshot> {
        await this.historyReady;

        const createdAt = nowIso();
        const id = randomUUID();

        const record: InternalJobRecord = {
            id,
            userId: input.userId,
            status: "queued",
            stage: "queued",
            input,
            createdAt,
            updatedAt: createdAt,
            events: [
                {
                    stage: "queued",
                    message: "Job queued for orchestration.",
                    timestamp: createdAt,
                },
            ],
        };

        this.jobs.set(id, record);
        this.queue.push(id);
        this.schedule();
        this.emitSnapshot(record);
        return toSnapshot(record);
    }

    async get(jobId: string): Promise<AiJobSnapshot | null> {
        await this.historyReady;

        const job = this.jobs.get(jobId);
        if (job) {
            return toSnapshot(job);
        }

        return this.persistedSnapshots.get(jobId) || null;
    }

    async listByUser(userId: number, limit = 20): Promise<AiJobSnapshot[]> {
        await this.historyReady;

        const latestById = new Map<string, AiJobSnapshot>();

        Array.from(this.jobs.values())
            .filter(job => job.userId === userId)
            .map(toSnapshot)
            .forEach(snapshot => {
                latestById.set(snapshot.id, snapshot);
            });

        Array.from(this.persistedSnapshots.values())
            .filter(snapshot => snapshot.userId === userId)
            .forEach(snapshot => {
                if (!latestById.has(snapshot.id)) {
                    latestById.set(snapshot.id, snapshot);
                }
            });

        return Array.from(latestById.values())
            .sort(sortByCreatedDesc)
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
                await this.historyWriteTask;
                return snapshot;
            }
            await new Promise(resolve => setTimeout(resolve, JOB_WAIT_POLL_MS));
        }

        const snapshot = await this.get(jobId);
        if (snapshot?.status === "completed" || snapshot?.status === "failed") {
            await this.historyWriteTask;
        }
        return snapshot;
    }

    async getHistoryDiagnostics(userId: number): Promise<AssessmentHistoryDiagnostics> {
        await this.historyReady;

        const historyPath = this.resolveHistoryPath();
        const persistedSnapshots = Array.from(this.persistedSnapshots.values()).filter(
            snapshot => snapshot.userId === userId
        );
        const queuedJobCount = Array.from(this.jobs.values()).filter(
            job => job.userId === userId && job.status === "queued"
        ).length;
        const activeJobCount = Array.from(this.jobs.values()).filter(
            job =>
                job.userId === userId &&
                (job.status === "queued" || job.status === "running")
        ).length;

        return {
            queueMode: "in_memory",
            storageType: historyPath ? "file" : "memory_only",
            storageEnabled: Boolean(historyPath),
            supportsClear: Boolean(historyPath),
            historyEntryCount: persistedSnapshots.length,
            activeJobCount,
            queuedJobCount,
            historyRetentionLimit: HISTORY_RETENTION,
            ...(historyPath ? { storagePath: historyPath } : {}),
            ...(this.historyLastSavedAt ? { lastUpdatedAt: this.historyLastSavedAt } : {}),
            details: historyPath
                ? "File-backed history is enabled for in-memory queue mode."
                : "In-memory queue history is ephemeral because AI_JOB_HISTORY_FILE is not configured.",
        };
    }

    async clearHistory(userId: number): Promise<AssessmentHistoryClearResult> {
        await this.historyReady;

        const historyPath = this.resolveHistoryPath();

        if (!historyPath) {
            const currentUserEntries = Array.from(this.persistedSnapshots.values()).filter(
                snapshot => snapshot.userId === userId
            );

            return {
                queueMode: "in_memory",
                storageType: "memory_only",
                supportsClear: false,
                clearedCount: 0,
                remainingCount: currentUserEntries.length,
                details:
                    "Clear history is unavailable because AI_JOB_HISTORY_FILE is not configured.",
            };
        }

        await this.historyWriteTask;

        const currentUserEntries = Array.from(this.persistedSnapshots.values()).filter(
            snapshot => snapshot.userId === userId
        );

        let clearedCount = 0;
        for (const snapshot of currentUserEntries) {
            if (this.persistedSnapshots.delete(snapshot.id)) {
                clearedCount += 1;
            }
        }

        await this.persistHistory(historyPath);

        const remainingCount = Array.from(this.persistedSnapshots.values()).filter(
            snapshot => snapshot.userId === userId
        ).length;

        return {
            queueMode: "in_memory",
            storageType: "file",
            supportsClear: true,
            clearedCount,
            remainingCount,
            storagePath: historyPath,
            details:
                clearedCount > 0
                    ? "Persisted history cleared for the current user. Active jobs were not interrupted."
                    : "No persisted history entries were found for the current user.",
        };
    }

    subscribe(listener: QueueSnapshotListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private schedule() {
        if (this.running) return;
        this.running = true;
        setTimeout(() => {
            void this.runLoop().finally(() => {
                this.running = false;
                if (this.queue.length > 0) {
                    this.schedule();
                }
            });
        }, QUEUE_IDLE_DELAY_MS);
    }

    private pushEvent(job: InternalJobRecord, stage: AiJobStage, message: string) {
        const timestamp = nowIso();
        job.stage = stage;
        job.updatedAt = timestamp;
        job.events.push({ stage, message, timestamp });
        if (job.events.length > EVENT_RETENTION) {
            job.events.splice(0, job.events.length - EVENT_RETENTION);
        }
        this.emitSnapshot(job);
    }

    private emitSnapshot(job: InternalJobRecord) {
        const snapshot = toSnapshot(job);
        this.upsertPersistedSnapshot(snapshot);
        this.queueHistoryWrite();

        for (const listener of Array.from(this.listeners)) {
            try {
                listener(snapshot);
            } catch {
                // Listener failures should not interrupt queue processing.
            }
        }
    }

    private resolveHistoryPath() {
        if (!this.historyFilePath) {
            return "";
        }

        return path.isAbsolute(this.historyFilePath)
            ? this.historyFilePath
            : path.resolve(process.cwd(), this.historyFilePath);
    }

    private async loadHistory() {
        const historyPath = this.resolveHistoryPath();
        if (!historyPath) {
            return;
        }

        try {
            const raw = await readFile(historyPath, "utf-8");
            const parsed = JSON.parse(raw) as PersistedHistoryRaw;

            const snapshots =
                Array.isArray(parsed)
                    ? parsed
                    : parsed &&
                        typeof parsed === "object" &&
                        Array.isArray((parsed as { snapshots?: unknown }).snapshots)
                        ? (parsed as { snapshots: unknown[] }).snapshots
                        : [];

            for (const candidate of snapshots) {
                const validated = aiJobSnapshotSchema.safeParse(candidate);
                if (!validated.success) {
                    continue;
                }

                this.upsertPersistedSnapshot(validated.data);
            }

            const latestSnapshot = Array.from(this.persistedSnapshots.values()).sort((a, b) =>
                a.updatedAt < b.updatedAt ? 1 : -1
            )[0];
            this.historyLastSavedAt = latestSnapshot?.updatedAt;
        } catch (error) {
            const maybeCode =
                typeof error === "object" && error && "code" in error
                    ? String((error as { code?: string }).code)
                    : "";

            if (maybeCode !== "ENOENT") {
                console.warn(
                    "[AI Orchestrator] Failed to load in-memory queue history:",
                    error
                );
            }
        }
    }

    private upsertPersistedSnapshot(snapshot: AiJobSnapshot) {
        const current = this.persistedSnapshots.get(snapshot.id);
        if (!current || current.updatedAt <= snapshot.updatedAt) {
            this.persistedSnapshots.set(snapshot.id, snapshot);
        }

        this.trimPersistedSnapshots();
    }

    private trimPersistedSnapshots() {
        if (this.persistedSnapshots.size <= HISTORY_RETENTION) {
            return;
        }

        const ordered = Array.from(this.persistedSnapshots.values()).sort((a, b) =>
            a.updatedAt < b.updatedAt ? -1 : 1
        );

        const overflow = ordered.length - HISTORY_RETENTION;
        for (let index = 0; index < overflow; index += 1) {
            this.persistedSnapshots.delete(ordered[index].id);
        }
    }

    private queueHistoryWrite() {
        const historyPath = this.resolveHistoryPath();
        if (!historyPath) {
            return;
        }

        this.historyWriteTask = this.historyWriteTask
            .then(() => this.persistHistory(historyPath))
            .catch(error => {
                console.warn(
                    "[AI Orchestrator] Failed to persist in-memory queue history:",
                    error
                );
            });
    }

    private async persistHistory(historyPath: string) {
        const snapshots = Array.from(this.persistedSnapshots.values())
            .sort(sortByCreatedDesc)
            .slice(0, HISTORY_RETENTION);

        if (snapshots.length === 0) {
            await rm(historyPath, { force: true });
            this.historyLastSavedAt = undefined;
            return;
        }

        const payload: PersistedHistoryPayload = {
            version: 1,
            snapshots,
        };

        await mkdir(path.dirname(historyPath), { recursive: true });
        await writeFile(historyPath, JSON.stringify(payload, null, 2), "utf-8");
        this.historyLastSavedAt = nowIso();
    }

    private async runLoop() {
        if (!this.worker) return;

        while (this.queue.length > 0) {
            const jobId = this.queue.shift();
            if (!jobId) continue;

            const job = this.jobs.get(jobId);
            if (!job) continue;

            job.status = "running";
            this.pushEvent(job, "gatekeeper", "Worker started processing job.");

            try {
                const workerResult = await this.worker(job.input, progress => {
                    this.pushEvent(job, progress.stage, progress.message);
                });

                job.status = "completed";
                job.result = workerResult.report;
                job.persistence = workerResult.persistence;
                this.pushEvent(job, "completed", "Assessment orchestration completed.");
            } catch (error) {
                job.status = "failed";
                job.error = error instanceof Error ? error.message : String(error);
                this.pushEvent(
                    job,
                    "failed",
                    "Assessment orchestration failed."
                );
            }
        }
    }
}
