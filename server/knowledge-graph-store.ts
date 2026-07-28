import { and, eq, or, like, sql, asc } from "drizzle-orm";
import { getDb } from "./db";
import {
  knowledgeGraphNodes,
  knowledgeGraphEdges,
  type InsertKnowledgeGraphNode,
  type InsertKnowledgeGraphEdge,
} from "../drizzle/schema";

export type GraphQuery = {
  kinds?: string[];
  region?: string;
  jurisdiction?: string;
  search?: string;
  organizationId?: number;
  limit?: number;
  offset?: number;
};

export type GraphSeedInput = {
  nodes: { id: string; label: string; kind: string; region?: string }[];
  edges: { source: string; target: string; relation: string }[];
};

export async function seedKnowledgeGraph(
  input: GraphSeedInput,
  organizationId?: number
) {
  const db = await getDb();
  if (!db)
    return { nodesSeeded: 0, edgesSeeded: 0, error: "Database unavailable" };

  for (const n of input.nodes) {
    const existing = await db
      .select()
      .from(knowledgeGraphNodes)
      .where(eq(knowledgeGraphNodes.nodeId, n.id))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(knowledgeGraphNodes).values({
        nodeId: n.id,
        label: n.label,
        kind: n.kind as any,
        region: n.region,
        isCustom: organizationId ? 1 : 0,
        organizationId: organizationId ?? null,
      });
    }
  }

  for (const e of input.edges) {
    const existing = await db
      .select()
      .from(knowledgeGraphEdges)
      .where(
        and(
          eq(knowledgeGraphEdges.sourceNodeId, e.source),
          eq(knowledgeGraphEdges.targetNodeId, e.target),
          eq(knowledgeGraphEdges.relation, e.relation as any)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(knowledgeGraphEdges).values({
        sourceNodeId: e.source,
        targetNodeId: e.target,
        relation: e.relation as any,
        organizationId: organizationId ?? null,
      });
    }
  }

  return { nodesSeeded: input.nodes.length, edgesSeeded: input.edges.length };
}

export async function queryKnowledgeGraph(query: GraphQuery) {
  const db = await getDb();
  if (!db) return { nodes: [], edges: [] };

  const conditions: ReturnType<typeof eq>[] = [];

  if (query.kinds && query.kinds.length > 0) {
    conditions.push(
      sql`${knowledgeGraphNodes.kind} = ANY(${query.kinds}::text[])` as any
    );
  }

  if (query.region) {
    conditions.push(eq(knowledgeGraphNodes.region, query.region));
  }

  if (query.jurisdiction) {
    conditions.push(eq(knowledgeGraphNodes.jurisdiction, query.jurisdiction));
  }

  if (query.search) {
    const q = `%${query.search.toLowerCase()}%`;
    const searchCond = or(
      like(sql`LOWER(${knowledgeGraphNodes.label})`, q),
      like(sql`LOWER(${knowledgeGraphNodes.description})`, q)
    );
    if (searchCond) conditions.push(searchCond as any);
  }

  const limit = query.limit ?? 50;
  const offset = query.offset ?? 0;

  const nodes = await db
    .select()
    .from(knowledgeGraphNodes)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(limit)
    .offset(offset)
    .orderBy(asc(knowledgeGraphNodes.label));

  const nodeIds = nodes.map(n => n.nodeId);

  const edges =
    nodeIds.length > 0
      ? await db
          .select()
          .from(knowledgeGraphEdges)
          .where(
            or(
              sql`${knowledgeGraphEdges.sourceNodeId} = ANY(${nodeIds}::text[])`,
              sql`${knowledgeGraphEdges.targetNodeId} = ANY(${nodeIds}::text[])`
            )!
          )
          .limit(500)
      : [];

  return { nodes, edges };
}

export async function getAllKnowledgeGraphNodes() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(knowledgeGraphNodes)
    .orderBy(asc(knowledgeGraphNodes.kind), asc(knowledgeGraphNodes.label));
}

export async function getKnowledgeGraphStats() {
  const db = await getDb();
  if (!db) return { nodes: 0, edges: 0, byKind: [] };

  const nodeCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeGraphNodes);

  const edgeCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeGraphEdges);

  const kindCounts = await db
    .select({
      kind: knowledgeGraphNodes.kind,
      count: sql<number>`count(*)::int`,
    })
    .from(knowledgeGraphNodes)
    .groupBy(knowledgeGraphNodes.kind);

  return {
    nodes: Number(nodeCount[0]?.count ?? 0),
    edges: Number(edgeCount[0]?.count ?? 0),
    byKind: kindCounts.map(k => ({
      kind: k.kind,
      count: Number(k.count),
    })),
  };
}

export async function deleteKnowledgeGraphNode(nodeId: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(knowledgeGraphEdges)
    .where(
      or(
        eq(knowledgeGraphEdges.sourceNodeId, nodeId),
        eq(knowledgeGraphEdges.targetNodeId, nodeId)
      )
    );
  await db
    .delete(knowledgeGraphNodes)
    .where(eq(knowledgeGraphNodes.nodeId, nodeId));
}

export async function createCustomNode(input: InsertKnowledgeGraphNode) {
  const db = await getDb();
  if (!db) return null;
  const [node] = await db
    .insert(knowledgeGraphNodes)
    .values({ ...input, isCustom: 1 })
    .returning();
  return node;
}

export async function createCustomEdge(input: InsertKnowledgeGraphEdge) {
  const db = await getDb();
  if (!db) return null;
  const [edge] = await db.insert(knowledgeGraphEdges).values(input).returning();
  return edge;
}
