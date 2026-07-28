import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  seedKnowledgeGraph,
  queryKnowledgeGraph,
  getKnowledgeGraphStats,
  getAllKnowledgeGraphNodes,
  deleteKnowledgeGraphNode,
  createCustomNode,
  createCustomEdge,
  type GraphQuery,
} from "./knowledge-graph-store";
import { buildGlobalGraphSeed } from "./global-compliance-registry";
import { recordUserInteraction } from "./interaction-logger";
import { requireModulePermission } from "./_core/permission-guard";

const nodeKindEnum = z.enum([
  "region",
  "framework",
  "standard",
  "edition",
  "agent",
  "regulator",
  "country",
  "control",
  "threat",
  "vendor",
  "certification",
  "policy",
  "technology",
  "data_type",
  "industry",
  "risk_scenario",
]);

const edgeRelationEnum = z.enum([
  "contains",
  "activates",
  "supports",
  "maps_to",
  "requires",
  "conflicts",
  "depends_on",
  "governs",
  "references",
  "impacts",
  "mitigates",
  "translates_to",
  "equivalent_to",
  "cross_border_to",
]);

export const knowledgeGraphRouter = router({
  stats: protectedProcedure.query(async () => {
    return getKnowledgeGraphStats();
  }),

  allNodes: protectedProcedure.query(async () => {
    return getAllKnowledgeGraphNodes();
  }),

  query: protectedProcedure
    .input(
      z.object({
        kinds: z.array(nodeKindEnum).optional(),
        region: z.string().optional(),
        jurisdiction: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return queryKnowledgeGraph(input as GraphQuery);
    }),

  seed: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "admin_control_center", "canEdit");
      const graph = buildGlobalGraphSeed();
      const result = await seedKnowledgeGraph(graph, input.organizationId);

      void recordUserInteraction(ctx, {
        context: "knowledge_graph",
        action: "graph_seeded",
        entityType: "knowledge_graph",
        outputRef: result,
      });

      return result;
    }),

  deleteNode: protectedProcedure
    .input(z.object({ nodeId: z.string().min(1).max(120) }))
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "admin_control_center", "canEdit");
      await deleteKnowledgeGraphNode(input.nodeId);
      return { deleted: true };
    }),

  createNode: protectedProcedure
    .input(
      z.object({
        nodeId: z.string().min(1).max(120),
        label: z.string().min(1).max(255),
        kind: nodeKindEnum,
        region: z.string().max(120).optional(),
        jurisdiction: z.string().max(120).optional(),
        description: z.string().max(2000).optional(),
        organizationId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "admin_control_center", "canEdit");
      const node = await createCustomNode(input);
      return node;
    }),

  createEdge: protectedProcedure
    .input(
      z.object({
        sourceNodeId: z.string().min(1).max(120),
        targetNodeId: z.string().min(1).max(120),
        relation: edgeRelationEnum,
        organizationId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireModulePermission(ctx, "admin_control_center", "canEdit");
      const edge = await createCustomEdge(input);
      return edge;
    }),
});
