import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

type AnswerValue = string | string[];

function humanize(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Progressive onboarding questionnaire. One question per screen; each answer is
 * persisted server-side (idempotently) before advancing. Resumes from the
 * server state so refresh/return is lossless.
 */
export default function OnboardingQuestionnaire() {
  usePageTitle("Get started");
  const { t } = useLocale();
  const [, navigate] = useLocation();

  const questionnaire = trpc.onboarding.getQuestionnaire.useQuery(undefined, {
    staleTime: 300_000,
  });
  const stateQuery = trpc.onboarding.getState.useQuery(undefined, {
    staleTime: 15_000,
  });
  const utils = trpc.useUtils();
  const submit = trpc.onboarding.submitAnswer.useMutation();
  const complete = trpc.onboarding.complete.useMutation();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const questions = questionnaire.data?.questions ?? [];

  useEffect(() => {
    if (hydrated || !stateQuery.data) return;
    const next: Record<string, AnswerValue> = {};
    for (const [k, v] of Object.entries(stateQuery.data.answers ?? {})) {
      if (typeof v === "string") next[k] = v;
      else if (Array.isArray(v)) next[k] = v.filter(x => typeof x === "string");
    }
    setAnswers(next);
    setHydrated(true);
  }, [stateQuery.data, hydrated]);

  const current = questions[index];
  const progress = useMemo(
    () =>
      questions.length === 0 ? 0 : Math.round((index / questions.length) * 100),
    [index, questions.length]
  );

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  function onSelect(value: string) {
    if (!current) return;
    if (current.multi) {
      const existing = Array.isArray(answers[current.id])
        ? (answers[current.id] as string[])
        : [];
      const next = existing.includes(value)
        ? existing.filter(v => v !== value)
        : [...existing, value];
      setAnswer(current.id, next);
    } else {
      setAnswer(current.id, value);
      // Fast path: single-choice advances immediately after persisting.
      void saveAndAdvance(value);
    }
  }

  async function persist(questionId: string, value: AnswerValue) {
    await submit.mutateAsync({
      questionId,
      value,
      stepNumber: questions.findIndex(q => q.id === questionId),
    });
  }

  async function saveAndAdvance(value?: AnswerValue) {
    if (!current) return;
    const answer = value ?? answers[current.id];
    setError(null);
    if (current.required && (answer === undefined || answer === "")) {
      setError(t("onboarding.error.required", "Please choose an option."));
      return;
    }
    setSaving(true);
    try {
      if (answer !== undefined) await persist(current.id, answer);
      if (index + 1 >= questions.length) {
        await finish();
      } else {
        setIndex(i => i + 1);
      }
    } catch {
      setError(
        t(
          "onboarding.error.save",
          "We couldn't save that answer. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  function skip() {
    setError(null);
    if (index + 1 >= questions.length) void finish();
    else setIndex(i => i + 1);
  }

  async function finish() {
    setSaving(true);
    try {
      await complete.mutateAsync(undefined);
      await utils.onboarding.getRecommendations.invalidate();
      setDone(true);
    } catch {
      setError(
        t(
          "onboarding.error.finish",
          "We couldn't finish setup. Please try again."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="djac-page flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold">
            {t("onboarding.ready.title", "Your workspace is ready.")}
          </h1>
          <p className="text-muted-foreground">
            {t(
              "onboarding.ready.body",
              "We've configured DJAC around your priorities."
            )}
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate("/")}>
              {t("onboarding.ready.cta", "Enter My Workspace")}
              <ArrowRight className="ms-2 h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/docs")}>
              {t("onboarding.ready.explore", "Explore DJAC")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (questionnaire.isLoading || !hydrated) {
    return (
      <div className="djac-page flex min-h-[60vh] items-center justify-center">
        <div className="djac-page-spinner" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="djac-page flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
          <p className="text-muted-foreground">
            {t("onboarding.empty", "Nothing to set up right now.")}
          </p>
          <Button onClick={() => navigate("/")}>
            {t("onboarding.ready.cta", "Enter My Workspace")}
          </Button>
        </div>
      </div>
    );
  }

  const selected = answers[current.id];
  const selectedValues = Array.isArray(selected)
    ? selected
    : selected
      ? [selected]
      : [];

  return (
    <div className="djac-page mx-auto max-w-xl py-10">
      <div className="mb-6 space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t("onboarding.step", "Step")} {index + 1} / {questions.length}
        </p>
        <Progress value={progress} className="h-1.5" />
      </div>

      <h1 className="text-xl font-semibold">
        {t(current.labelKey, humanize(current.id))}
      </h1>
      {current.helpKey && (
        <p className="mt-1 text-sm text-muted-foreground">
          {t(current.helpKey, "")}
        </p>
      )}

      <div className="mt-5 grid gap-2">
        {current.options.map(opt => {
          const active = selectedValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              aria-pressed={active}
              className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-accent"
              }`}
            >
              <span className="text-sm">
                {t(opt.labelKey, humanize(opt.value))}
              </span>
              {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={index === 0 || saving}
        >
          <ArrowLeft className="me-2 h-4 w-4" />
          {t("onboarding.back", "Back")}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={skip} disabled={saving}>
            {t("onboarding.skip", "Skip for now")}
          </Button>
          <Button onClick={() => void saveAndAdvance()} disabled={saving}>
            {t("onboarding.continue", "Continue")}
            <ArrowRight className="ms-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
