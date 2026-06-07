import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { usePersistFn } from "@/hooks/usePersistFn";

export type AiAssessmentJobSnapshot = {
    id: string;
    status: "queued" | "running" | "completed" | "failed";
    stage: string;
    createdAt?: string;
    updatedAt?: string;
    events: Array<{
        stage: string;
        message: string;
        timestamp: string;
    }>;
    error?: string;
    result?: {
        assessment?: {
            generatedAt: string;
            overallScore: number;
            jurisdictionScores: {
                china: number;
                saudiArabia: number;
            };
            status: "compliant" | "partial" | "non_compliant";
            riskLevel: "low" | "medium" | "high" | "critical";
            gaps: Array<{
                code: string;
                jurisdiction: "china" | "saudi" | "cross_border";
                frameworks: string[];
                severity: "critical" | "high" | "medium" | "low";
                title: string;
                description: string;
                mitigation: string;
                penaltyContext: string;
            }>;
            recommendations: string[];
        };
    };
    persistence?: {
        savedAssessments: number;
        savedGaps: number;
        skipped: boolean;
    };
};

type JobSnapshotListener = (snapshot: AiAssessmentJobSnapshot) => void;
type ConnectionState = "idle" | "connecting" | "open" | "closed" | "error";

function isFinalStatus(status: AiAssessmentJobSnapshot["status"]) {
    return status === "completed" || status === "failed";
}

export function useAiAssessmentJobs() {
    const utils = trpc.useUtils();
    const { data: streamConfig } = trpc.ai.streamConfig.useQuery(undefined, {
        staleTime: Number.POSITIVE_INFINITY,
    });
    const [snapshots, setSnapshots] = useState<Record<string, AiAssessmentJobSnapshot>>({});
    const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
    const callbacksRef = useRef(new Map<string, Set<JobSnapshotListener>>());
    const jobIdsRef = useRef(new Set<string>());
    const websocketRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<number | null>(null);

    const upsertSnapshot = usePersistFn((snapshot: AiAssessmentJobSnapshot) => {
        setSnapshots(prev => ({
            ...prev,
            [snapshot.id]: snapshot,
        }));

        const listeners = callbacksRef.current.get(snapshot.id);
        if (!listeners) return;

        Array.from(listeners).forEach(listener => {
            try {
                listener(snapshot);
            } catch {
                // Listener errors should not interrupt delivery.
            }
        });
    });

    const subscribeToJob = usePersistFn((jobId: string, listener?: JobSnapshotListener) => {
        const normalizedJobId = jobId.trim();
        if (!normalizedJobId) {
            return () => undefined;
        }

        jobIdsRef.current.add(normalizedJobId);

        if (listener) {
            const existing = callbacksRef.current.get(normalizedJobId) || new Set<JobSnapshotListener>();
            existing.add(listener);
            callbacksRef.current.set(normalizedJobId, existing);

            const current = snapshots[normalizedJobId];
            if (current) {
                listener(current);
            }
        }

        if (websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(
                JSON.stringify({
                    type: "subscribe",
                    jobId: normalizedJobId,
                })
            );
        }

        return () => {
            const listeners = callbacksRef.current.get(normalizedJobId);
            if (listeners && listener) {
                listeners.delete(listener);
                if (listeners.size === 0) {
                    callbacksRef.current.delete(normalizedJobId);
                }
            }

            const latest = snapshots[normalizedJobId];
            if (latest && isFinalStatus(latest.status)) {
                jobIdsRef.current.delete(normalizedJobId);
                if (websocketRef.current?.readyState === WebSocket.OPEN) {
                    websocketRef.current.send(
                        JSON.stringify({
                            type: "unsubscribe",
                            jobId: normalizedJobId,
                        })
                    );
                }
            }
        };
    });

    useEffect(() => {
        if (typeof window === "undefined" || !streamConfig?.websocketPath) {
            return;
        }

        let disposed = false;

        const clearReconnect = () => {
            if (reconnectTimerRef.current !== null) {
                window.clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
        };

        const connect = () => {
            clearReconnect();
            setConnectionState("connecting");

            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const ws = new WebSocket(
                `${protocol}//${window.location.host}${streamConfig.websocketPath}`
            );
            websocketRef.current = ws;

            ws.onopen = () => {
                if (disposed) {
                    ws.close();
                    return;
                }

                setConnectionState("open");
                Array.from(jobIdsRef.current).forEach(jobId => {
                    ws.send(JSON.stringify({ type: "subscribe", jobId }));
                });
            };

            ws.onmessage = event => {
                try {
                    const payload = JSON.parse(String(event.data)) as Record<string, unknown>;
                    if (payload.type === "job_snapshot" && payload.snapshot) {
                        upsertSnapshot(payload.snapshot as AiAssessmentJobSnapshot);
                    }
                } catch {
                    // Ignore malformed websocket payloads.
                }
            };

            ws.onerror = () => {
                setConnectionState("error");
            };

            ws.onclose = () => {
                if (disposed) return;
                setConnectionState("closed");

                if (jobIdsRef.current.size > 0) {
                    reconnectTimerRef.current = window.setTimeout(connect, 1500);
                }
            };
        };

        connect();

        return () => {
            disposed = true;
            clearReconnect();
            websocketRef.current?.close();
            websocketRef.current = null;
        };
    }, [streamConfig?.websocketPath, upsertSnapshot]);

    useEffect(() => {
        if (jobIdsRef.current.size === 0) {
            return;
        }

        let cancelled = false;

        const poll = async () => {
            const jobIds = Array.from(jobIdsRef.current);
            for (const jobId of jobIds) {
                try {
                    const snapshot = await utils.ai.getAssessmentJob.fetch({ jobId });
                    if (cancelled || !snapshot) continue;
                    upsertSnapshot(snapshot as AiAssessmentJobSnapshot);
                } catch {
                    // Ignore polling errors; websocket may still deliver updates.
                }
            }
        };

        void poll();
        const intervalId = window.setInterval(poll, 2500);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [utils, upsertSnapshot]);

    return useMemo(
        () => ({
            connectionState,
            snapshots,
            subscribeToJob,
            seedSnapshot: upsertSnapshot,
        }),
        [connectionState, snapshots, subscribeToJob, upsertSnapshot]
    );
}
