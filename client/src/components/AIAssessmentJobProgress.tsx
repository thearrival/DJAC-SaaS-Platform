import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocale } from "@/contexts/useLocale";
import { AlertCircle, CheckCircle2, LoaderCircle, Radio } from "lucide-react";
import type { AiAssessmentJobSnapshot } from "@/hooks/useAiAssessmentJobs";

const stageProgress: Record<string, number> = {
    queued: 8,
    gatekeeper: 18,
    intake: 30,
    extractor: 44,
    rag_context: 58,
    judge: 72,
    synthesizer: 82,
    validator: 90,
    reporter: 96,
    persistence: 99,
    completed: 100,
    failed: 100,
};

function getStatusBadge(
    snapshot: AiAssessmentJobSnapshot,
    t: (key: string, fallback: string) => string
) {
    if (snapshot.status === "completed") {
        return <Badge className="bg-green-100 text-green-800">{t("common.status.completed", "Completed")}</Badge>;
    }

    if (snapshot.status === "failed") {
        return <Badge className="bg-red-100 text-red-800">{t("common.status.failed", "Failed")}</Badge>;
    }

    if (snapshot.status === "running") {
        return <Badge className="bg-blue-100 text-blue-800">{t("common.status.running", "Running")}</Badge>;
    }

    return <Badge className="bg-muted text-muted-foreground">{t("common.status.queued", "Queued")}</Badge>;
}

function getStatusIcon(snapshot: AiAssessmentJobSnapshot) {
    if (snapshot.status === "completed") {
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }

    if (snapshot.status === "failed") {
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }

    if (snapshot.status === "running") {
        return <LoaderCircle className="w-4 h-4 text-blue-600 animate-spin" />;
    }

    return <Radio className="w-4 h-4 text-muted-foreground" />;
}

function formatStage(stage: string, t: (key: string, fallback: string) => string) {
    const fallback = stage
        .replace(/_/g, " ")
        .replace(/\b\w/g, char => char.toUpperCase());

    return t(`common.stage.${stage}`, fallback);
}

export function AIAssessmentJobProgress({ snapshot }: { snapshot: AiAssessmentJobSnapshot }) {
    const { t } = useLocale();
    const progress = stageProgress[snapshot.stage] ?? 12;
    const lastEvent = snapshot.events[snapshot.events.length - 1];

    return (
        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:bg-blue-950/20">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="flex items-center gap-2 text-foreground">
                    {getStatusIcon(snapshot)}
                    <span className="font-medium">{t("supplier.progressTitle", "AI Orchestrator Progress")}</span>
                </div>
                {getStatusBadge(snapshot, t)}
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                    <span>{t("supplier.progressStage", "Stage")}: {formatStage(snapshot.stage, t)}</span>
                    <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-blue-100" />
            </div>

            {lastEvent?.message ? (
                <p className="mt-3 text-sm text-muted-foreground">{lastEvent.message}</p>
            ) : null}

            {snapshot.status === "failed" && snapshot.error ? (
                <p className="mt-3 text-sm text-red-700">{snapshot.error}</p>
            ) : null}

            {snapshot.status === "completed" && snapshot.persistence ? (
                <p className="mt-3 text-sm text-muted-foreground">
                    {t("supplier.progressPersistence", "Persistence")}: {snapshot.persistence.skipped
                        ? t("supplier.progressSkipped", "Skipped")
                        : `${t("supplier.savedAssessments", "Saved assessments")}: ${snapshot.persistence.savedAssessments} · ${t("supplier.savedGaps", "Saved gaps")}: ${snapshot.persistence.savedGaps}`}
                </p>
            ) : null}
        </div>
    );
}
