/**
 * sse-bus.ts — Server-Sent Events broadcast bus
 *
 * Single in-process registry for SSE clients and the broadcastSSE helper.
 * Previously embedded inside yalla-admin-router.ts; extracted here so that
 * any server module can emit platform events without importing the entire
 * admin router (which would create circular dependencies).
 *
 * CONTRACT: No tRPC, Express router, or database imports live here. The only
 * dependency is the Express Response type for the client set.
 */

import type { Response } from "express";

// In-memory SSE client registry
const sseClients = new Set<Response>();

// ─── Client lifecycle ─────────────────────────────────────────────────────────

export function addSSEClient(res: Response): void {
    sseClients.add(res);
}

export function removeSSEClient(res: Response): void {
    sseClients.delete(res);
}

export function getSSEClientCount(): number {
    return sseClients.size;
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export function broadcastSSE(event: string, data: unknown): void {
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of sseClients) {
        try {
            client.write(msg);
        } catch {
            sseClients.delete(client);
        }
    }
}
