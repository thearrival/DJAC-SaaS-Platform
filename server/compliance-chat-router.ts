/**
 * compliance-chat-router.ts
 *
 * Phase 49 — AI Compliance Chatbot
 *
 * Provides a conversational interface to the DJAC compliance knowledge base.
 * Each request:
 *   1. Searches the law knowledge base for relevant context using the latest
 *      user message as the query.
 *   2. Builds a RAG-style system prompt grounding the LLM in actual regulatory
 *      text from China (PIPL/CSL/DSL) and Saudi Arabia (PDPL/NCA).
 *   3. Calls the configured LLM and returns the assistant reply.
 *
 * Guardrails:
 *   - Max 30 messages per request (history cap).
 *   - Max 1 000 characters per user message.
 *   - activeOrgProcedure: requires authenticated user with an active org.
 *   - In-memory fallback when LLM is unconfigured (returns a canned disclaimer).
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { parsedEnv } from "./services/config-schema";
import { activeOrgProcedure, router } from "./_core/trpc";
import { requireModulePermission } from "./_core/permission-guard";
import { searchLawKnowledge } from "./legal-knowledge";
import { recordUserInteraction } from "./interaction-logger";

// ── Schemas ────────────────────────────────────────────────────────────────

const chatMessageSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
});

const chatInputSchema = z.object({
    /** Full conversation history including the latest user message at the end */
    messages: z.array(chatMessageSchema).min(1).max(30),
    /**
     * Optional jurisdiction to bias the knowledge-base search.
     * Omit or pass "all" to search across all jurisdictions.
     */
    jurisdiction: z.enum(["all", "China", "Saudi Arabia"]).optional().default("all"),
});

// ── Helpers ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_PREFIX = `You are the DJAC Compliance Assistant — an expert on cross-border data-protection and cybersecurity regulations between China and Saudi Arabia.

Your knowledge covers:
• China: PIPL (Personal Information Protection Law), CSL (Cybersecurity Law), DSL (Data Security Law)
• Saudi Arabia: PDPL (Personal Data Protection Law), NCA Essential Cybersecurity Controls (ECC)
• Cross-border data transfer frameworks, adequacy assessments, and dual-compliance strategies

Guidelines:
1. Answer concisely and accurately, citing the relevant framework/article where possible.
2. If a question is outside your knowledge (e.g. unrelated to DJAC, compliance, or cybersecurity), politely redirect.
3. Distinguish between legal requirements (MUST) and best-practice recommendations (SHOULD).
4. Do not speculate about facts — if uncertain, say so and recommend consulting a qualified legal professional.
5. For cross-border questions, address both jurisdictions and highlight conflicts or gaps.
6. Respond in the same language the user wrote in (English, Arabic, or Chinese).
`;

function buildSystemPrompt(query: string, jurisdiction: string): string {
    // Search the law knowledge base for up to 4 relevant entries
    const results = searchLawKnowledge(query, 4);

    if (results.length === 0) {
        return SYSTEM_PROMPT_PREFIX + "\n\nNo specific regulatory references matched this query — answer from general knowledge.";
    }

    const contextBlocks = results.map((r) => {
        const highlights = r.highlights
            .slice(0, 2)
            .map((h) => `  [${h.title}]: ${h.excerpt}`)
            .join("\n");
        return `## ${r.title} (${r.jurisdiction}, ${r.frameworkCodes.join(", ")})\n${r.summary}\n${highlights}`;
    });

    const jurisdictionNote =
        jurisdiction === "all"
            ? ""
            : `\n\nFocus your answer on regulations applicable in ${jurisdiction}.`;

    return (
        SYSTEM_PROMPT_PREFIX +
        "\n\n--- Relevant regulatory context ---\n\n" +
        contextBlocks.join("\n\n") +
        jurisdictionNote
    );
}

// ── Router ─────────────────────────────────────────────────────────────────

export const complianceChatRouter = router({
    /**
     * chat — Send a message and receive an AI compliance response.
     *
     * The client should maintain the full message history and pass it on each
     * request so the LLM has conversational context.
     */
    chat: activeOrgProcedure
        .input(chatInputSchema)
        .mutation(async ({ ctx, input }) => {
            await requireModulePermission(ctx, "pro_intelligence", "canView");
            const { messages, jurisdiction } = input;

            // The last message should always be from the user
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role !== "user") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "The last message must be from the user.",
                });
            }

            // Build RAG system prompt from law knowledge base
            const systemPrompt = buildSystemPrompt(lastMessage.content, jurisdiction);

            // LLM not configured — return a graceful fallback
            if (!ENV.forgeApiKey && !parsedEnv.OPENAI_API_KEY) {
                void recordUserInteraction(ctx, {
                    context: "complianceChat.chat",
                    action: "compliance_chat_fallback",
                    entityType: "ai_response",
                    outputRef: { reason: "llm_not_configured" },
                });
                return {
                    role: "assistant" as const,
                    content:
                        "The AI compliance assistant is not yet configured on this deployment. " +
                        "Please contact your administrator to set up the OpenAI API key (OPENAI_API_KEY environment variable).",
                    citations: [] as string[],
                    fallback: true,
                };
            }

            try {
                const result = await invokeLLM({
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...messages.map((m) => ({ role: m.role, content: m.content })),
                    ],
                    maxTokens: 1024,
                });

                const reply = result.choices[0]?.message?.content;
                const replyText =
                    typeof reply === "string"
                        ? reply
                        : Array.isArray(reply)
                            ? reply
                                .map((p) => (p.type === "text" ? p.text : ""))
                                .join("")
                            : "Sorry, I could not generate a response. Please try again.";

                // Record usage for analytics
                void recordUserInteraction(ctx, {
                    context: "complianceChat.chat",
                    action: "compliance_chat_response",
                    entityType: "ai_response",
                    outputRef: {
                        jurisdiction,
                        tokens: result.usage?.total_tokens ?? 0,
                    },
                });

                return {
                    role: "assistant" as const,
                    content: replyText,
                    citations: [] as string[],
                    fallback: false,
                };
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Unknown LLM error";
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `AI service error: ${message}`,
                });
            }
        }),
});
