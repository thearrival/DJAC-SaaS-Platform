import { COOKIE_NAME, hasMinRole } from "../../shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { IncomingMessage, Server as HttpServer } from "http";
import { WebSocketServer, type RawData, type WebSocket } from "ws";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId } from "../db";
import { ENV } from "../_core/env";
import { sdk } from "../_core/sdk";
import {
    getAssessmentJob,
    subscribeAssessmentJobSnapshots,
} from "./orchestrator";
import type { AiJobSnapshot } from "./schemas";

type ClientSubscription = {
    userId: number;
    isAdmin: boolean;
    jobIds: Set<string>;
};

type ClientMessage =
    | { type: "subscribe"; jobId: string }
    | { type: "unsubscribe"; jobId: string }
    | { type: "ping" };

const WS_PATH_DEFAULT = "/ws/ai-jobs";

function sendJson(ws: WebSocket, payload: unknown) {
    if (ws.readyState !== 1) return;
    ws.send(JSON.stringify(payload));
}

function parseMessage(raw: unknown): ClientMessage | null {
    try {
        const value = JSON.parse(String(raw));
        if (!value || typeof value !== "object") return null;

        const candidate = value as Record<string, unknown>;
        const type = candidate.type;
        if (type === "ping") {
            return { type: "ping" };
        }

        if ((type === "subscribe" || type === "unsubscribe") && typeof candidate.jobId === "string") {
            return {
                type,
                jobId: candidate.jobId.trim(),
            } as ClientMessage;
        }

        return null;
    } catch {
        return null;
    }
}

async function resolveSocketUser(req: IncomingMessage): Promise<User | null> {
    if (ENV.devAuthBypass) {
        const now = new Date();
        return {
            id: -1,
            openId: ENV.devAuthOpenId,
            name: ENV.devAuthName,
            email: ENV.devAuthEmail || null,
            loginMethod: "dev-bypass",
            organizationName: null,
            organizationType: null,
            jobTitle: null,
            preferredLocale: "en",
            role: ENV.devAuthRole,
            status: "active",
            createdAt: now,
            updatedAt: now,
            lastSignedIn: now,
            lastActivityAt: now,
        };
    }

    const cookies = parseCookieHeader(req.headers.cookie || "");
    const sessionCookie = cookies[COOKIE_NAME];
    const session = await sdk.verifySession(sessionCookie);
    if (!session) {
        return null;
    }

    return (await getUserByOpenId(session.openId)) ?? null;
}

function shouldPushSnapshot(
    snapshot: AiJobSnapshot,
    subscription: ClientSubscription
) {
    if (!subscription.isAdmin && snapshot.userId !== subscription.userId) return false;
    if (subscription.jobIds.size === 0) return true;
    return subscription.jobIds.has(snapshot.id);
}

export function registerAssessmentWebSocketServer(server: HttpServer) {
    const wsPath = ENV.aiWebsocketPath || WS_PATH_DEFAULT;
    const wsServer = new WebSocketServer({ noServer: true });
    const sockets = new Map<WebSocket, ClientSubscription>();

    const unsubscribe = subscribeAssessmentJobSnapshots(snapshot => {
        for (const [ws, subscription] of Array.from(sockets.entries())) {
            if (!shouldPushSnapshot(snapshot, subscription)) continue;
            sendJson(ws, {
                type: "job_snapshot",
                snapshot,
            });
        }
    });

    server.on("upgrade", async (request, socket, head) => {
        const url = new URL(request.url || wsPath, "http://localhost");
        if (url.pathname !== wsPath) {
            return;
        }

        const user = await resolveSocketUser(request);
        if (!user) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }

        wsServer.handleUpgrade(request, socket, head, (ws: WebSocket) => {
            const initialJobId = url.searchParams.get("jobId")?.trim();
            const subscription: ClientSubscription = {
                userId: user.id,
                isAdmin: hasMinRole(user.role, "admin"),
                jobIds: new Set(initialJobId ? [initialJobId] : []),
            };

            sockets.set(ws, subscription);
            sendJson(ws, {
                type: "connected",
                path: wsPath,
                userId: user.id,
                role: user.role,
                subscribedJobIds: Array.from(subscription.jobIds),
                timestamp: new Date().toISOString(),
            });

            if (initialJobId) {
                void getAssessmentJob(initialJobId).then(snapshot => {
                    if (!snapshot || (!subscription.isAdmin && snapshot.userId !== user.id)) return;
                    sendJson(ws, {
                        type: "job_snapshot",
                        snapshot,
                    });
                });
            }

            ws.on("message", (raw: RawData) => {
                const msg = parseMessage(raw.toString());
                if (!msg) {
                    sendJson(ws, {
                        type: "error",
                        message: "Invalid websocket message payload.",
                    });
                    return;
                }

                if (msg.type === "ping") {
                    sendJson(ws, {
                        type: "pong",
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }

                if (msg.type === "subscribe") {
                    if (!msg.jobId) return;
                    subscription.jobIds.add(msg.jobId);
                    void getAssessmentJob(msg.jobId).then(snapshot => {
                        if (!snapshot || (!subscription.isAdmin && snapshot.userId !== user.id)) return;
                        sendJson(ws, {
                            type: "job_snapshot",
                            snapshot,
                        });
                    });

                    sendJson(ws, {
                        type: "subscribed",
                        jobId: msg.jobId,
                        subscribedJobIds: Array.from(subscription.jobIds),
                    });
                    return;
                }

                if (msg.type === "unsubscribe") {
                    if (!msg.jobId) return;
                    subscription.jobIds.delete(msg.jobId);
                    sendJson(ws, {
                        type: "unsubscribed",
                        jobId: msg.jobId,
                        subscribedJobIds: Array.from(subscription.jobIds),
                    });
                }
            });

            ws.on("close", () => {
                sockets.delete(ws);
            });

            ws.on("error", () => {
                sockets.delete(ws);
            });
        });
    });

    console.log(`[AI Orchestrator] WebSocket streaming enabled at ${wsPath}`);

    return () => {
        unsubscribe();
        wsServer.close();
    };
}
