/**
 * ComplianceChat.tsx
 *
 * Phase 49 — AI Compliance Chatbot
 *
 * Interactive Q&A page powered by the DJAC law knowledge base + LLM.
 * Users can ask free-form questions about PIPL, CSL, DSL, PDPL, and NCA
 * and receive grounded, citation-aware answers.
 */
import { useState } from "react";
import { MessageSquareText, RotateCcw, Globe } from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { toast as sonnerToast } from "sonner";

// ── Suggested starter prompts (EN) ──────────────────────────────────────────

const SUGGESTED_PROMPTS = [
    "What are the key obligations under China's PIPL for cross-border data transfers?",
    "How does Saudi Arabia's PDPL define 'personal data' and what does it protect?",
    "What is the difference between CSL and DSL in China?",
    "How do NCA Essential Cybersecurity Controls apply to financial institutions in Saudi Arabia?",
    "Can a company transfer employee data from China to Saudi Arabia? What steps are required?",
    "What are the penalties for PIPL non-compliance in China?",
    "What is a Standard Contract (SC) under PIPL Art. 38?",
    "Does Saudi Arabia's PDPL have an adequacy decision equivalent?",
];

type Jurisdiction = "all" | "China" | "Saudi Arabia";

export default function ComplianceChat() {
    const { t } = useLocale();
    usePageTitle(t("chat.title", "AI Compliance Assistant"));

    const [messages, setMessages] = useState<Message[]>([]);
    const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("all");

    const chatMutation = trpc.complianceChat.chat.useMutation({
        onSuccess: (response) => {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: response.content },
            ]);
            if (response.fallback) {
                sonnerToast.warning(
                    t("chat.fallbackWarning", "AI is not configured — showing placeholder response.")
                );
            }
        },
        onError: (err) => {
            sonnerToast.error(err.message || t("chat.error", "AI service error. Please try again."));
            // Remove the optimistically-added user message on error
            setMessages((prev) => prev.slice(0, -1));
        },
    });

    const handleSend = (content: string) => {
        const newMessages: Message[] = [
            ...messages,
            { role: "user", content },
        ];
        setMessages(newMessages);

        // Only send user/assistant messages to the server (no system role)
        chatMutation.mutate({
            messages: newMessages
                .filter((m) => m.role === "user" || m.role === "assistant")
                .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
            jurisdiction,
        });
    };

    const handleReset = () => {
        setMessages([]);
    };

    return (
        <div className="djac-page-enter flex flex-col gap-6 p-6 md:p-8 max-w-5xl mx-auto w-full">
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquareText size={22} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">
                            {t("chat.title", "AI Compliance Assistant")}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {t("chat.subtitle", "Ask anything about PIPL, CSL, DSL, PDPL, and NCA frameworks")}
                        </p>
                    </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Jurisdiction filter */}
                    <div className="flex items-center gap-1.5">
                        <Globe size={14} className="text-muted-foreground" />
                        <Select
                            value={jurisdiction}
                            onValueChange={(v) => setJurisdiction(v as Jurisdiction)}
                        >
                            <SelectTrigger className="h-8 w-40 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {t("chat.jurisdictionAll", "All Jurisdictions")}
                                </SelectItem>
                                <SelectItem value="China">
                                    {t("chat.jurisdictionChina", "China")}
                                </SelectItem>
                                <SelectItem value="Saudi Arabia">
                                    {t("chat.jurisdictionSaudi", "Saudi Arabia")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* New conversation */}
                    {messages.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="h-8 gap-1.5 text-xs"
                        >
                            <RotateCcw size={12} />
                            {t("chat.newConversation", "New Conversation")}
                        </Button>
                    )}
                </div>
            </div>

            {/* ── Notice banner ───────────────────────────────────────────── */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-600 dark:text-amber-400">
                {t(
                    "chat.disclaimer",
                    "This assistant provides general regulatory guidance based on the DJAC knowledge base. It is not legal advice. Consult a qualified legal professional for specific compliance decisions."
                )}
            </div>

            {/* ── Chat box ────────────────────────────────────────────────── */}
            <AIChatBox
                messages={messages}
                onSendMessage={handleSend}
                isLoading={chatMutation.isPending}
                placeholder={t("chat.inputPlaceholder", "Ask about PIPL, PDPL, NCA, cross-border transfers…")}
                emptyStateMessage={t("chat.emptyState", "Ask a compliance question to get started")}
                suggestedPrompts={SUGGESTED_PROMPTS}
                height="calc(100vh - 380px)"
            />

            {/* ── Footer note ─────────────────────────────────────────────── */}
            <p className="text-center text-xs text-muted-foreground/60">
                {t(
                    "chat.footerNote",
                    "Powered by DJAC law knowledge base · China (PIPL, CSL, DSL) · Saudi Arabia (PDPL, NCA)"
                )}
            </p>
        </div>
    );
}
