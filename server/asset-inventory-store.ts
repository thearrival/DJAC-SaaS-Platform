/**
 * Asset Inventory Store — DB operations for asset-inventory-router.ts
 */

import { and, desc, eq } from "drizzle-orm";
import { assetInventory } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ASSET_TYPES = [
    "server", "workstation", "network_device", "cloud_service", "saas_application",
    "database", "api_endpoint", "iot_device", "mobile_device", "industrial_ot",
    "web_application", "source_code_repo", "third_party_service",
] as const;

export const CRITICALITY_LEVELS = ["low", "medium", "high", "critical"] as const;
export const EXPOSURE_LEVELS = ["internal", "vpn_only", "partner_only", "internet_facing"] as const;
export const ASSET_STATUSES = ["active", "decommissioned", "under_review", "unknown"] as const;

type AssetType = typeof ASSET_TYPES[number];
type CriticalityLevel = typeof CRITICALITY_LEVELS[number];
type ExposureLevel = typeof EXPOSURE_LEVELS[number];
type AssetStatus = typeof ASSET_STATUSES[number];

export type AssetRow = {
    id: number;
    organizationId: number;
    name: string;
    assetType: AssetType;
    identifier: string | null;
    owner: string | null;
    location: string | null;
    criticality: CriticalityLevel;
    exposure: ExposureLevel;
    status: AssetStatus;
    riskScore: number;
    platform: string | null;
    version: string | null;
    lastScannedAt: Date | null;
    openVulnCount: number;
    tags: string | null;
    notes: string | null;
    addedByUserId: number | null;
    createdAt: Date;
    updatedAt: Date;
};

// ─── In-memory fallback ───────────────────────────────────────────────────────

const MEM_ASSETS: AssetRow[] = [];
let memSeq = 1;

// ─── Risk score formula ───────────────────────────────────────────────────────

const CRITICALITY_WEIGHT: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 5 };
const EXPOSURE_WEIGHT: Record<string, number> = { internal: 1, vpn_only: 2, partner_only: 3, internet_facing: 5 };

export function calcRiskScore(criticality: string, exposure: string, openVulnCount: number): number {
    const c = CRITICALITY_WEIGHT[criticality] ?? 1;
    const e = EXPOSURE_WEIGHT[exposure] ?? 1;
    const raw = c * e * (1 + Math.min(openVulnCount, 10) * 0.15);
    return Math.min(100, Math.round((raw / 25) * 100));
}

// ─── Input type ───────────────────────────────────────────────────────────────

export type CreateAssetInput = {
    name: string;
    assetType: AssetType;
    identifier?: string;
    owner?: string;
    location?: string;
    criticality: CriticalityLevel;
    exposure: ExposureLevel;
    status: AssetStatus;
    platform?: string;
    version?: string;
    tags?: string;
    notes?: string;
};

// ─── Store functions ──────────────────────────────────────────────────────────

export async function listAssets(orgId: number): Promise<AssetRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return [...MEM_ASSETS.filter(a => a.organizationId === orgId)]
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return db
        .select()
        .from(assetInventory)
        .where(eq(assetInventory.organizationId, orgId))
        .orderBy(desc(assetInventory.createdAt)) as unknown as Promise<AssetRow[]>;
}

export async function getAsset(orgId: number, id: number): Promise<AssetRow | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_ASSETS.find(a => a.id === id && a.organizationId === orgId) ?? null;
    }
    const [row] = await db
        .select()
        .from(assetInventory)
        .where(and(eq(assetInventory.id, id), eq(assetInventory.organizationId, orgId)))
        .limit(1);
    return (row as AssetRow) ?? null;
}

export async function createAsset(
    orgId: number,
    input: CreateAssetInput,
    localUserId: number | null,
): Promise<AssetRow> {
    const db = await getDb();
    const now = new Date();
    const riskScore = calcRiskScore(input.criticality, input.exposure, 0);

    if (!db || orgId < 0) {
        const asset: AssetRow = {
            id: memSeq++,
            organizationId: orgId,
            name: input.name,
            assetType: input.assetType,
            identifier: input.identifier ?? null,
            owner: input.owner ?? null,
            location: input.location ?? null,
            criticality: input.criticality,
            exposure: input.exposure,
            status: input.status,
            riskScore,
            platform: input.platform ?? null,
            version: input.version ?? null,
            lastScannedAt: null,
            openVulnCount: 0,
            tags: input.tags ?? null,
            notes: input.notes ?? null,
            addedByUserId: localUserId,
            createdAt: now,
            updatedAt: now,
        };
        MEM_ASSETS.push(asset);
        return asset;
    }

    const [inserted] = await db.insert(assetInventory).values({
        organizationId: orgId,
        name: input.name,
        assetType: input.assetType,
        identifier: input.identifier ?? null,
        owner: input.owner ?? null,
        location: input.location ?? null,
        criticality: input.criticality,
        exposure: input.exposure,
        status: input.status,
        riskScore,
        platform: input.platform ?? null,
        version: input.version ?? null,
        tags: input.tags ?? null,
        notes: input.notes ?? null,
        addedByUserId: localUserId,
    }).returning({ id: assetInventory.id });
    const insertId = inserted.id;
    const [created] = await db
        .select()
        .from(assetInventory)
        .where(eq(assetInventory.id, insertId))
        .limit(1);
    return created as AssetRow;
}

export async function getAssetForPatch(orgId: number, id: number): Promise<AssetRow | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_ASSETS.find(a => a.id === id && a.organizationId === orgId) ?? null;
    }
    const [row] = await db
        .select()
        .from(assetInventory)
        .where(and(eq(assetInventory.id, id), eq(assetInventory.organizationId, orgId)))
        .limit(1);
    return (row as AssetRow) ?? null;
}

export async function patchAssetRow(
    orgId: number,
    id: number,
    updateValues: Record<string, unknown>,
): Promise<AssetRow | null> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const asset = MEM_ASSETS.find(a => a.id === id && a.organizationId === orgId);
        if (!asset) return null;
        Object.assign(asset, updateValues);
        return asset;
    }
    await db
        .update(assetInventory)
        .set(updateValues as any)
        .where(eq(assetInventory.id, id));
    const [updated] = await db
        .select()
        .from(assetInventory)
        .where(eq(assetInventory.id, id))
        .limit(1);
    return (updated as AssetRow) ?? null;
}

export async function deleteAsset(
    orgId: number,
    id: number,
): Promise<{ found: boolean; name?: string }> {
    const db = await getDb();
    if (!db || orgId < 0) {
        const idx = MEM_ASSETS.findIndex(a => a.id === id && a.organizationId === orgId);
        if (idx === -1) return { found: false };
        MEM_ASSETS.splice(idx, 1);
        return { found: true };
    }
    const [existing] = await db
        .select({ id: assetInventory.id, name: assetInventory.name })
        .from(assetInventory)
        .where(and(eq(assetInventory.id, id), eq(assetInventory.organizationId, orgId)))
        .limit(1);
    if (!existing) return { found: false };
    await db.delete(assetInventory).where(eq(assetInventory.id, id));
    return { found: true, name: existing.name };
}

export async function getAllOrgAssets(orgId: number): Promise<AssetRow[]> {
    const db = await getDb();
    if (!db || orgId < 0) {
        return MEM_ASSETS.filter(a => a.organizationId === orgId);
    }
    return db
        .select()
        .from(assetInventory)
        .where(eq(assetInventory.organizationId, orgId)) as unknown as Promise<AssetRow[]>;
}
