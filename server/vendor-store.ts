import { and, eq, inArray } from "drizzle-orm";
import {
    serializeVendorMultiValue,
    type EnterpriseTechStackComponentInput,
    type EnterpriseVendorProfileInput,
} from "@shared/vendorProfile";
import type { TechStackComponent, Vendor } from "../drizzle/schema";
import { techStackComponents, vendors } from "../drizzle/schema";
import { getDb } from "./db";

export type VendorProfileInput = EnterpriseVendorProfileInput;
export type VendorTechStackInput = EnterpriseTechStackComponentInput;

type InMemoryVendor = Vendor;
type InMemoryTechStackComponent = TechStackComponent;

const inMemoryVendors = new Map<number, InMemoryVendor>();
const inMemoryTechStackByVendor = new Map<number, InMemoryTechStackComponent[]>();
let inMemoryVendorId = 1;
let inMemoryTechStackId = 1;

function normalizeText(value: string | undefined): string | null {
    if (!value) return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

function normalizeEmail(value: string | undefined): string | null {
    const normalized = normalizeText(value);
    return normalized ? normalized.toLowerCase() : null;
}

function toTechStackInsertValues(
    vendorId: number,
    components: VendorTechStackInput[]
) {
    return components
        .map(component => ({
            vendorId,
            componentName: component.componentName.trim(),
            componentType: normalizeText(component.componentType) ?? "Unspecified",
            technology: normalizeText(component.technology),
            description: normalizeText(component.description),
            dataHandling: normalizeText(component.dataHandling),
        }))
        .filter(component => component.componentName.length > 0);
}

function setInMemoryTechStack(
    vendorId: number,
    components: VendorTechStackInput[]
): InMemoryTechStackComponent[] {
    const now = new Date();
    const rows = toTechStackInsertValues(vendorId, components).map(component => ({
        id: inMemoryTechStackId++,
        vendorId,
        componentName: component.componentName,
        componentType: component.componentType,
        technology: component.technology,
        description: component.description,
        dataHandling: component.dataHandling,
        createdAt: now,
        updatedAt: now,
    }));

    inMemoryTechStackByVendor.set(vendorId, rows);
    return rows;
}

function toInsertValues(userId: number, input: VendorProfileInput, organizationId?: number | null) {
    return {
        userId,
        organizationId: (organizationId != null && organizationId > 0) ? organizationId : null,
        vendorName: input.vendorName.trim(),
        vendorDescription: normalizeText(input.vendorDescription),
        industry: normalizeText(input.industry),
        businessRegistrationNumber: normalizeText(input.businessRegistrationNumber),
        headquartersLocation: normalizeText(input.headquartersLocation),
        primaryContactName: normalizeText(input.primaryContactName),
        primaryContactEmail: normalizeEmail(input.primaryContactEmail),
        primaryContactRole: normalizeText(input.primaryContactRole),
        primaryContactPhone: normalizeText(input.primaryContactPhone),
        serviceType: normalizeText(input.serviceType),
        serviceScope: normalizeText(input.serviceScope),
        hostingEnvironment: normalizeText(input.hostingEnvironment),
        operatingCountries: normalizeText(serializeVendorMultiValue(input.operatingCountries)),
        cloudProvider: normalizeText(serializeVendorMultiValue(input.cloudProviders)),
        dataLocations: normalizeText(serializeVendorMultiValue(input.dataLocations)),
        regulatoryJurisdictions: normalizeText(
            serializeVendorMultiValue(input.regulatoryJurisdictions)
        ),
        certifications: normalizeText(serializeVendorMultiValue(input.certifications)),
        dataProcessingActivities: normalizeText(
            serializeVendorMultiValue(input.dataProcessingActivities)
        ),
        criticalityLevel: normalizeText(input.criticalityLevel),
        riskTier: normalizeText(input.riskTier),
        thirdPartyDependencies: normalizeText(input.thirdPartyDependencies),
        fourthPartyDependencies: normalizeText(input.fourthPartyDependencies),
    };
}

function createInMemoryVendor(
    userId: number,
    input: VendorProfileInput,
    components: VendorTechStackInput[],
    organizationId?: number | null
): InMemoryVendor {
    const now = new Date();
    const id = inMemoryVendorId++;

    const vendor: InMemoryVendor = {
        id,
        ...toInsertValues(userId, input, organizationId),
        createdAt: now,
        updatedAt: now,
    };

    inMemoryVendors.set(id, vendor);
    if (components.length > 0) {
        setInMemoryTechStack(id, components);
    }
    return vendor;
}

export async function listVendorProfiles(userId: number, organizationId?: number | null): Promise<Vendor[]> {
    const useOrg = organizationId != null && organizationId > 0;
    const db = await getDb();
    if (!db) {
        return Array.from(inMemoryVendors.values()).filter(vendor =>
            useOrg ? vendor.organizationId === organizationId : vendor.userId === userId
        );
    }

    if (useOrg) {
        return db.select().from(vendors).where(eq(vendors.organizationId, organizationId!));
    }
    return db.select().from(vendors).where(eq(vendors.userId, userId));
}

export async function listAllVendorProfiles(limit = 200): Promise<Vendor[]> {
    const db = await getDb();
    if (!db) {
        return Array.from(inMemoryVendors.values())
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
            .slice(0, limit);
    }

    return db.select().from(vendors).limit(limit);
}

export async function getVendorProfileById(
    vendorId: number,
    userId: number,
    organizationId?: number | null
): Promise<Vendor | null> {
    const useOrg = organizationId != null && organizationId > 0;
    const db = await getDb();
    if (!db) {
        const vendor = inMemoryVendors.get(vendorId);
        if (!vendor) return null;
        if (useOrg ? vendor.organizationId !== organizationId : vendor.userId !== userId) return null;
        return vendor;
    }

    const rows = await db
        .select()
        .from(vendors)
        .where(
            useOrg
                ? and(eq(vendors.id, vendorId), eq(vendors.organizationId, organizationId!))
                : and(eq(vendors.id, vendorId), eq(vendors.userId, userId))
        )
        .limit(1);

    return rows.length > 0 ? rows[0] : null;
}

export async function createVendorProfile(
    userId: number,
    input: VendorProfileInput,
    organizationId?: number | null
): Promise<Vendor> {
    const db = await getDb();
    const components = input.techStackComponents ?? [];
    if (!db) {
        return createInMemoryVendor(userId, input, components, organizationId);
    }

    const insertValues = toInsertValues(userId, input, organizationId);
    const result = await db.insert(vendors).values(insertValues);
    const vendorId = Number(result[0]?.insertId ?? 0);

    if (!vendorId) {
        throw new Error("Failed to create vendor record");
    }

    const techStackValues = toTechStackInsertValues(vendorId, components);
    if (techStackValues.length > 0) {
        await db.insert(techStackComponents).values(techStackValues);
    }

    const created = await getVendorProfileById(vendorId, userId, organizationId);
    if (!created) {
        throw new Error("Vendor was created but could not be loaded");
    }

    return created;
}

export async function updateVendorProfile(
    vendorId: number,
    userId: number,
    input: VendorProfileInput,
    organizationId?: number | null
): Promise<Vendor> {
    const db = await getDb();
    const components = input.techStackComponents ?? [];

    if (!db) {
        const existing = inMemoryVendors.get(vendorId);
        if (!existing) throw new Error("Vendor not found");
        const useOrg = organizationId != null && organizationId > 0;
        if (useOrg ? existing.organizationId !== organizationId : existing.userId !== userId) {
            throw new Error("Vendor not found");
        }
        const updated: InMemoryVendor = {
            ...existing,
            ...toInsertValues(userId, input, organizationId),
            id: vendorId,
            updatedAt: new Date(),
        };
        inMemoryVendors.set(vendorId, updated);
        setInMemoryTechStack(vendorId, components);
        return updated;
    }

    const useOrg = organizationId != null && organizationId > 0;
    const whereClause = useOrg
        ? and(eq(vendors.id, vendorId), eq(vendors.organizationId, organizationId!))
        : and(eq(vendors.id, vendorId), eq(vendors.userId, userId));

    await db
        .update(vendors)
        .set({ ...toInsertValues(userId, input, organizationId), updatedAt: new Date() })
        .where(whereClause);

    // Replace tech stack components: delete old, insert new
    await db.delete(techStackComponents).where(eq(techStackComponents.vendorId, vendorId));
    const techStackValues = toTechStackInsertValues(vendorId, components);
    if (techStackValues.length > 0) {
        await db.insert(techStackComponents).values(techStackValues);
    }

    const updated = await getVendorProfileById(vendorId, userId, organizationId);
    if (!updated) throw new Error("Vendor was updated but could not be reloaded");
    return updated;
}

export async function deleteVendorProfile(
    vendorId: number,
    userId: number,
    organizationId?: number | null
): Promise<void> {
    const db = await getDb();

    if (!db) {
        const existing = inMemoryVendors.get(vendorId);
        if (!existing) throw new Error("Vendor not found");
        const useOrg = organizationId != null && organizationId > 0;
        if (useOrg ? existing.organizationId !== organizationId : existing.userId !== userId) {
            throw new Error("Vendor not found");
        }
        inMemoryVendors.delete(vendorId);
        inMemoryTechStackByVendor.delete(vendorId);
        return;
    }

    const useOrg = organizationId != null && organizationId > 0;
    const whereClause = useOrg
        ? and(eq(vendors.id, vendorId), eq(vendors.organizationId, organizationId!))
        : and(eq(vendors.id, vendorId), eq(vendors.userId, userId));

    // Delete tech stack first (FK constraint)
    await db.delete(techStackComponents).where(eq(techStackComponents.vendorId, vendorId));
    await db.delete(vendors).where(whereClause);
}

type VendorBasicPatch = {
    vendorName: string;
    vendorDescription: string;
    criticalityLevel: string;
    riskTier: string;
    primaryContactName: string;
    primaryContactEmail: string;
    primaryContactRole: string;
    primaryContactPhone?: string;
};

export async function patchVendorBasicFields(
    vendorId: number,
    userId: number,
    patch: VendorBasicPatch,
    organizationId?: number | null
): Promise<Vendor> {
    const db = await getDb();
    const useOrg = organizationId != null && organizationId > 0;

    if (!db) {
        const existing = inMemoryVendors.get(vendorId);
        if (!existing) throw new Error("Vendor not found");
        if (useOrg ? existing.organizationId !== organizationId : existing.userId !== userId) {
            throw new Error("Vendor not found");
        }
        const updated: InMemoryVendor = {
            ...existing,
            vendorName: patch.vendorName,
            vendorDescription: patch.vendorDescription,
            criticalityLevel: patch.criticalityLevel,
            riskTier: patch.riskTier,
            primaryContactName: patch.primaryContactName,
            primaryContactEmail: patch.primaryContactEmail,
            primaryContactRole: patch.primaryContactRole,
            primaryContactPhone: patch.primaryContactPhone ?? null,
            updatedAt: new Date(),
        };
        inMemoryVendors.set(vendorId, updated);
        return updated;
    }

    const whereClause = useOrg
        ? and(eq(vendors.id, vendorId), eq(vendors.organizationId, organizationId!))
        : and(eq(vendors.id, vendorId), eq(vendors.userId, userId));

    await db
        .update(vendors)
        .set({
            vendorName: patch.vendorName,
            vendorDescription: patch.vendorDescription,
            criticalityLevel: patch.criticalityLevel,
            riskTier: patch.riskTier,
            primaryContactName: patch.primaryContactName,
            primaryContactEmail: patch.primaryContactEmail,
            primaryContactRole: patch.primaryContactRole,
            primaryContactPhone: patch.primaryContactPhone ?? null,
            updatedAt: new Date(),
        })
        .where(whereClause);

    const updated = await getVendorProfileById(vendorId, userId, organizationId);
    if (!updated) throw new Error("Vendor was patched but could not be reloaded");
    return updated;
}

export async function listTechStackComponentsByVendorId(
    vendorId: number
): Promise<TechStackComponent[]> {
    const db = await getDb();
    if (!db) {
        return inMemoryTechStackByVendor.get(vendorId) ?? [];
    }

    return db.select().from(techStackComponents).where(eq(techStackComponents.vendorId, vendorId));
}

export async function listTechStackComponentsByVendorIds(
    vendorIds: number[]
): Promise<TechStackComponent[]> {
    if (vendorIds.length === 0) {
        return [];
    }

    const db = await getDb();
    if (!db) {
        return vendorIds.flatMap(vendorId => inMemoryTechStackByVendor.get(vendorId) ?? []);
    }

    return db.select().from(techStackComponents).where(inArray(techStackComponents.vendorId, vendorIds));
}
