import type { Vendor } from "../../drizzle/schema";
import { executeAssessmentPipeline } from "./pipeline";
import type { AiJobStage, AiAssessmentReport } from "./schemas";

export type AgentType =
  | "gatekeeper"
  | "intake"
  | "extractor"
  | "rag_context"
  | "judge"
  | "synthesizer"
  | "validator"
  | "reporter";

export type AgentStatus = "idle" | "busy" | "error";

export type AgentCapability = {
  type: AgentType;
  label: string;
  description: string;
  maxConcurrency: number;
};

export type AgentInstance = {
  id: string;
  type: AgentType;
  status: AgentStatus;
  currentJobId: string | null;
  startedAt: number | null;
  errorCount: number;
};

export type AgentDispatchInput = {
  source: "vendor_profile" | "document_upload";
  vendor: Vendor;
  rawDocumentText?: string;
  engine?: string;
};

export type AgentDispatchResult = {
  report: AiAssessmentReport;
  agentRoute: AgentType[];
  timing: Record<string, number>;
};

const AGENT_CAPABILITIES: AgentCapability[] = [
  {
    type: "gatekeeper",
    label: "Security Gatekeeper",
    description: "Scans payload for prompt injection and malicious patterns",
    maxConcurrency: 10,
  },
  {
    type: "intake",
    label: "Intake Clerk",
    description: "Classifies submission type and normalizes text",
    maxConcurrency: 8,
  },
  {
    type: "extractor",
    label: "Extraction Agent",
    description: "Maps vendor data to extracted facts",
    maxConcurrency: 6,
  },
  {
    type: "rag_context",
    label: "RAG Context Assembler",
    description: "Retrieves relevant compliance controls from vector store",
    maxConcurrency: 4,
  },
  {
    type: "judge",
    label: "Compliance Reviewer",
    description: "Evaluates mapped facts against frameworks",
    maxConcurrency: 4,
  },
  {
    type: "synthesizer",
    label: "Strategic Synthesizer",
    description: "Drafts remediation plans from gaps",
    maxConcurrency: 5,
  },
  {
    type: "validator",
    label: "Output Validator",
    description: "Validates report quality and completeness",
    maxConcurrency: 5,
  },
  {
    type: "reporter",
    label: "Report Formatter",
    description: "Formats final JSON output and DB payload",
    maxConcurrency: 10,
  },
];

let nextAgentId = 1;
const agentPool: Map<string, AgentInstance> = new Map();

for (const cap of AGENT_CAPABILITIES) {
  for (let i = 0; i < cap.maxConcurrency; i++) {
    const id = `${cap.type}-${nextAgentId++}`;
    agentPool.set(id, {
      id,
      type: cap.type,
      status: "idle",
      currentJobId: null,
      startedAt: null,
      errorCount: 0,
    });
  }
}

export function getAgentPool(): AgentInstance[] {
  return Array.from(agentPool.values());
}

export function getAgentPoolByType(type: AgentType): AgentInstance[] {
  return Array.from(agentPool.values()).filter(a => a.type === type);
}

export function getAgentPoolStats() {
  const stats: Record<
    string,
    { total: number; idle: number; busy: number; error: number }
  > = {};
  for (const agent of agentPool.values()) {
    if (!stats[agent.type])
      stats[agent.type] = { total: 0, idle: 0, busy: 0, error: 0 };
    stats[agent.type].total++;
    stats[agent.type][agent.status]++;
  }
  return stats;
}

function acquireAgent(type: AgentType, jobId: string): AgentInstance | null {
  const available = Array.from(agentPool.values()).find(
    a => a.type === type && a.status === "idle"
  );
  if (!available) return null;
  available.status = "busy";
  available.currentJobId = jobId;
  available.startedAt = Date.now();
  return available;
}

function releaseAgent(agentId: string) {
  const agent = agentPool.get(agentId);
  if (!agent) return;
  agent.status = "idle";
  agent.currentJobId = null;
  agent.startedAt = null;
}

function markAgentError(agentId: string) {
  const agent = agentPool.get(agentId);
  if (!agent) return;
  agent.status = "error";
  agent.errorCount++;
  agent.currentJobId = null;
  agent.startedAt = null;
}

export async function dispatchPipeline(
  input: AgentDispatchInput,
  onProgress: (stage: AiJobStage, message: string) => void
): Promise<AgentDispatchResult> {
  const route: AgentType[] = [
    "gatekeeper",
    "intake",
    "extractor",
    "rag_context",
    "judge",
    "synthesizer",
    "validator",
    "reporter",
  ];
  const timing: Record<string, number> = {};
  const jobId = `dispatch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const acquired: string[] = [];

  try {
    for (const stageType of route) {
      const agent = acquireAgent(stageType, jobId);
      if (agent) {
        acquired.push(agent.id);
      }
    }

    const startTotal = Date.now();

    const report = await executeAssessmentPipeline(
      {
        source: input.source,
        engine: input.engine as any,
        vendor: input.vendor,
        rawDocumentText: input.rawDocumentText,
      },
      (stage, message) => {
        onProgress(stage, message);
        const elapsed = Date.now() - startTotal;
        timing[stage] = elapsed;
      }
    );

    timing["total"] = Date.now() - startTotal;

    for (const id of acquired) releaseAgent(id);

    return { report, agentRoute: route, timing };
  } catch (err) {
    for (const id of acquired) markAgentError(id);
    throw err;
  }
}

export function resetAgentPool() {
  for (const agent of agentPool.values()) {
    agent.status = "idle";
    agent.currentJobId = null;
    agent.startedAt = null;
  }
}

export function getAgentCapabilities(): AgentCapability[] {
  return AGENT_CAPABILITIES;
}
