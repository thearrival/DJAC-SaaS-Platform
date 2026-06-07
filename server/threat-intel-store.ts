/**
 * Threat Intel Store — DB operations for threat-intel-router.ts
 */

import { and, desc, eq, isNull, or } from "drizzle-orm";
import { threatIntelItems } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Types ────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
    "malware", "ransomware", "phishing", "apt", "zero_day", "ddos",
    "supply_chain", "data_breach", "vulnerability", "social_engineering",
    "insider_threat", "other",
] as const;

export const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;
export const TLP_LEVELS = ["white", "green", "amber", "red"] as const;

type TICategory = typeof CATEGORIES[number];
type TISeverity = typeof SEVERITIES[number];
type TITLP = typeof TLP_LEVELS[number];

export type ThreatIntelRow = {
    id: number;
    organizationId: number | null;
    title: string;
    summary: string;
    threatActor: string | null;
    category: TICategory;
    severity: TISeverity;
    tlp: TITLP;
    affectedSectors: string | null;
    indicators: string | null;
    referenceUrl: string | null;
    cveId: string | null;
    cvssScore: string | null;
    isActive: number;
    createdByUserId: number | null;
    publishedAt: Date;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback (seeded) ─────────────────────────────────────────────

const MEM_ITEMS: ThreatIntelRow[] = [
    {
        id: 1, organizationId: null,
        title: "Active Exploitation of Ivanti Connect Secure VPN (CVE-2025-0282)",
        summary: "State-sponsored threat actors are actively exploiting a stack-based buffer overflow in Ivanti Connect Secure VPN appliances. The vulnerability allows unauthenticated remote code execution and has been used to deploy custom malware implants. Immediate patching and factory reset of affected appliances is recommended.",
        threatActor: "UNC5337 (China-nexus)", category: "zero_day", severity: "critical", tlp: "white",
        affectedSectors: "government,finance,healthcare,energy",
        indicators: "23.95.82.4,185.220.101.47,hxxps://update-ivanti[.]com,/api/v1/license/key-status/..",
        referenceUrl: "https://nvd.nist.gov/vuln/detail/CVE-2025-0282",
        cveId: "CVE-2025-0282", cvssScore: "9.0", isActive: 1, createdByUserId: null,
        publishedAt: new Date("2026-01-14"), createdAt: new Date("2026-01-14"), updatedAt: new Date("2026-01-14"),
    },
    {
        id: 2, organizationId: null,
        title: "Black Basta Ransomware Targeting Gulf Region Financial Institutions",
        summary: "Black Basta affiliates have been observed conducting targeted ransomware campaigns against banking and financial services organizations in the Gulf Cooperation Council.",
        threatActor: "Black Basta", category: "ransomware", severity: "high", tlp: "amber",
        affectedSectors: "finance,banking", indicators: "cobalt-strike-beacon,ISO file attachments,QakBot dropper",
        referenceUrl: null, cveId: null, cvssScore: null, isActive: 1, createdByUserId: null,
        publishedAt: new Date("2026-02-03"), createdAt: new Date("2026-02-03"), updatedAt: new Date("2026-02-03"),
    },
    {
        id: 3, organizationId: null,
        title: "Critical RCE in Palo Alto PAN-OS GlobalProtect (CVE-2024-3400)",
        summary: "A command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS software allows an unauthenticated attacker to execute arbitrary code on the firewall with root privileges.",
        threatActor: "UTA0218", category: "vulnerability", severity: "critical", tlp: "white",
        affectedSectors: "all", indicators: "PAN-OS < 10.2.9-h1,/var/log/pan/sslvpn_ngx_error.log anomalies",
        referenceUrl: "https://security.paloaltonetworks.com/CVE-2024-3400",
        cveId: "CVE-2024-3400", cvssScore: "10.0", isActive: 1, createdByUserId: null,
        publishedAt: new Date("2026-03-11"), createdAt: new Date("2026-03-11"), updatedAt: new Date("2026-03-11"),
    },
];

let memSeq = MEM_ITEMS.length + 1;

// ─── Input types ──────────────────────────────────────────────────────────────

export type CreateThreatIntelInput = {
    title: string;
    summary: string;
    category: TICategory;
    severity: TISeverity;
    tlp: TITLP;
    organizationId?: number | null;
    threatActor?: string;
    affectedSectors?: string;
    indicators?: string;
    referenceUrl?: string;
    cveId?: string;
    cvssScore?: string;
    publishedAt?: string;
};

// ─── Store functions ──────────────────────────────────────────────────────────

export async function getThreatFeed(
    orgId: number,
    filters: { severity?: TISeverity; category?: TICategory; limit: number },
): Promise<ThreatIntelRow[]> {
    const db = await getDb();
    let items: ThreatIntelRow[];
    if (!db || orgId < 0) {
        items = MEM_ITEMS.filter(i => i.isActive === 1);
    } else {
        items = (await db
            .select()
            .from(threatIntelItems)
            .where(
                and(
                    eq(threatIntelItems.isActive, 1),
                    or(isNull(threatIntelItems.organizationId), eq(threatIntelItems.organizationId, orgId)),
                ),
            )
            .orderBy(desc(threatIntelItems.publishedAt))
            .limit(filters.limit)) as ThreatIntelRow[];
    }
    if (filters.severity) items = items.filter(i => i.severity === filters.severity);
    if (filters.category) items = items.filter(i => i.category === filters.category);
    return items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getThreatItem(orgId: number, id: number): Promise<ThreatIntelRow | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_ITEMS.find(i => i.id === id) ?? null;
    }
    const [row] = await db
        .select()
        .from(threatIntelItems)
        .where(
            and(
                eq(threatIntelItems.id, id),
                or(isNull(threatIntelItems.organizationId), eq(threatIntelItems.organizationId, orgId)),
            ),
        )
        .limit(1);
    return (row as ThreatIntelRow) ?? null;
}

export async function adminCreateThreatItem(
    input: CreateThreatIntelInput,
    localUserId: number | null,
): Promise<ThreatIntelRow> {
    const db = await getDb();
    const now = new Date();
    const publishedAt = input.publishedAt ? new Date(input.publishedAt) : now;

    if (!db) {
        const item: ThreatIntelRow = {
            id: memSeq++,
            organizationId: input.organizationId ?? null,
            title: input.title,
            summary: input.summary,
            threatActor: input.threatActor ?? null,
            category: input.category,
            severity: input.severity,
            tlp: input.tlp,
            affectedSectors: input.affectedSectors ?? null,
            indicators: input.indicators ?? null,
            referenceUrl: input.referenceUrl || null,
            cveId: input.cveId ?? null,
            cvssScore: input.cvssScore ?? null,
            isActive: 1,
            createdByUserId: localUserId,
            publishedAt,
            createdAt: now,
            updatedAt: now,
        };
        MEM_ITEMS.push(item);
        return item;
    }

    const [result] = await db.insert(threatIntelItems).values({
        organizationId: input.organizationId ?? null,
        title: input.title,
        summary: input.summary,
        threatActor: input.threatActor ?? null,
        category: input.category,
        severity: input.severity,
        tlp: input.tlp,
        affectedSectors: input.affectedSectors ?? null,
        indicators: input.indicators ?? null,
        referenceUrl: input.referenceUrl || null,
        cveId: input.cveId ?? null,
        cvssScore: input.cvssScore ?? null,
        createdByUserId: localUserId,
        publishedAt,
    });
    const insertId = (result as { insertId: number }).insertId;
    const [created] = await db
        .select()
        .from(threatIntelItems)
        .where(eq(threatIntelItems.id, insertId))
        .limit(1);
    return created as ThreatIntelRow;
}

export async function adminUpdateThreatItem(
    id: number,
    updateValues: Record<string, unknown>,
): Promise<ThreatIntelRow | null> {
    const db = await getDb();
    if (!db) {
        const item = MEM_ITEMS.find(i => i.id === id);
        if (!item) return null;
        Object.assign(item, updateValues);
        return item;
    }
    await db
        .update(threatIntelItems)
        .set(updateValues as any)
        .where(eq(threatIntelItems.id, id));
    const [updated] = await db
        .select()
        .from(threatIntelItems)
        .where(eq(threatIntelItems.id, id))
        .limit(1);
    return (updated as ThreatIntelRow) ?? null;
}

export async function adminRemoveThreatItem(id: number): Promise<boolean> {
    const db = await getDb();
    if (!db) {
        const item = MEM_ITEMS.find(i => i.id === id);
        if (!item) return false;
        item.isActive = 0;
        item.updatedAt = new Date();
        return true;
    }
    await db
        .update(threatIntelItems)
        .set({ isActive: 0, updatedAt: new Date() })
        .where(eq(threatIntelItems.id, id));
    return true;
}
