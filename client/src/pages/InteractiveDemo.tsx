/**
 * Interactive Demo — Gamified DJAC product walkthrough.
 * Users earn achievements, track progress, and learn through
 * scenario-based challenges with real-time feedback.
 */
import { useState, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Sparkles,
  Zap,
  Shield,
  Globe,
  Trophy,
  Star,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  Brain,
  Timer,
  Award,
  PartyPopper,
  Target,
  BookOpen,
  Lightbulb,
} from "lucide-react";

type Achievement = {
  id: string;
  title: string;
  icon: string;
  earned: boolean;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

type Scenario = {
  title: string;
  description: string;
  options: { label: string; outcome: string; isCorrect: boolean }[];
};

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "How many jurisdictions does DJAC support?",
    options: ["12", "19", "29+", "5"],
    correct: 2,
    explanation:
      "DJAC covers 29+ jurisdictions across APAC, EMEA, North America, and Africa — including China (PIPL, CSL, DSL), Saudi Arabia (PDPL), UAE, EU (GDPR), and more.",
  },
  {
    question: "What AI model powers DJAC's compliance assessments?",
    options: ["Claude", "GPT-4o", "Gemini", "Llama"],
    correct: 1,
    explanation:
      "DJAC uses OpenAI's GPT-4o in an 8-stage assessment pipeline: Gatekeeper → Intake → Extractor → RAG Context → Judge → Synthesizer → Validator → Reporter.",
  },
  {
    question: "What is PIPL's maximum penalty for non-compliance?",
    options: [
      "¥1M RMB",
      "¥10M RMB",
      "¥50M RMB or 5% of annual revenue",
      "¥100M RMB",
    ],
    correct: 2,
    explanation:
      "Under PIPL, serious violations can result in fines up to ¥50 million RMB (~$7M USD) or 5% of the organization's annual revenue — whichever is higher.",
  },
  {
    question: "Which framework requires a 72-hour breach notification?",
    options: ["Only GDPR", "GDPR and PIPL", "Only PIPL", "None of the above"],
    correct: 1,
    explanation:
      "Both GDPR (Art. 33) and PIPL (Art. 57) require data breach notifications to authorities within 72 hours. DJAC automates breach notification timeline tracking.",
  },
  {
    question: "What's the first step in DJAC's vendor assessment workflow?",
    options: [
      "Run AI analysis",
      "Generate report",
      "Register vendor",
      "Export PDF",
    ],
    correct: 2,
    explanation:
      "First register your vendor with name, industry, jurisdiction, and tech stack. Then DJAC runs automated AI compliance checks across all your selected frameworks.",
  },
];

const SCENARIOS: Scenario[] = [
  {
    title: "Cross-Border Data Transfer",
    description:
      "Your company needs to transfer customer data from China to your EU headquarters for analysis. What should you do first?",
    options: [
      {
        label: "Just send the data — it's encrypted",
        outcome:
          "Incorrect! PIPL requires a CAC security assessment before any large-scale cross-border data transfer. Encryption alone is not sufficient.",
        isCorrect: false,
      },
      {
        label: "Run a CAC security assessment through DJAC",
        outcome:
          "Correct! DJAC's Transfer Checker automatically identifies required assessments, generates CAC documentation, and maps cross-border data flows against PIPL requirements.",
        isCorrect: true,
      },
      {
        label: "Get verbal approval from your manager",
        outcome:
          "Incorrect! Cross-border data transfers under PIPL require formal regulatory assessment, not just internal approval.",
        isCorrect: false,
      },
    ],
  },
  {
    title: "Vendor Risk Discovery",
    description:
      "You discover that one of your vendors stores customer PII on an unencrypted server in a jurisdiction you don't operate in. What's your first action?",
    options: [
      {
        label: "Ignore it — they're not your direct responsibility",
        outcome:
          "Incorrect! Under most data protection laws, the data controller (you) remains liable for processor (vendor) failures. You need to act quickly.",
        isCorrect: false,
      },
      {
        label: "Run a DJAC compliance assessment on that vendor immediately",
        outcome:
          "Correct! DJAC's Vendor Risk Dashboard lets you run an instant assessment. It'll flag the specific regulatory gaps, calculate risk scores, and generate a prioritized remediation plan.",
        isCorrect: true,
      },
      {
        label: "Send a strongly worded email and wait",
        outcome:
          "Partially correct but insufficient. While communication is important, you need documented evidence of assessment and remediation tracking — which DJAC provides automatically.",
        isCorrect: false,
      },
    ],
  },
];

const ACHIEVEMENTS: Achievement[] = [
  { id: "quiz_master", title: "Quiz Master", icon: "brain", earned: false },
  { id: "scenario_pro", title: "Scenario Pro", icon: "target", earned: false },
  { id: "fast_learner", title: "Fast Learner", icon: "zap", earned: false },
  {
    id: "compliance_guru",
    title: "Compliance Guru",
    icon: "shield",
    earned: false,
  },
  { id: "explorer", title: "Platform Explorer", icon: "globe", earned: false },
  { id: "all_star", title: "DJAC All-Star", icon: "trophy", earned: false },
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  target: Target,
  zap: Zap,
  shield: Shield,
  globe: Globe,
  trophy: Trophy,
};

export default function InteractiveDemo() {
  usePageTitle("Interactive Demo");
  const { t } = useLocale();
  const [, navigate] = useLocation();

  const [stage, setStage] = useState<
    "intro" | "quiz" | "scenario" | "complete"
  >("intro");
  const [quizStep, setQuizStep] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [scenarioStep, setScenarioStep] = useState(0);
  const [scenarioResolved, setScenarioResolved] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [startTime] = useState(Date.now());

  const totalQuizQuestions = QUIZ_QUESTIONS.length;
  const quizProgress = useMemo(
    () => Math.round((quizStep / totalQuizQuestions) * 100),
    [quizStep, totalQuizQuestions]
  );

  const totalAchievements = achievements.length;
  const earnedCount = achievements.filter(a => a.earned).length;
  const achievementProgress = Math.round(
    (earnedCount / totalAchievements) * 100
  );

  const earnAchievement = useCallback((id: string) => {
    setAchievements(prev =>
      prev.map(a => (a.id === id ? { ...a, earned: true } : a))
    );
  }, []);

  const handleQuizAnswer = useCallback(
    (idx: number) => {
      if (quizAnswered) return;
      setSelectedAnswer(idx);
      setQuizAnswered(true);
      if (idx === QUIZ_QUESTIONS[quizStep].correct) {
        setQuizScore(s => s + 1);
      }
    },
    [quizAnswered, quizStep]
  );

  const nextQuiz = useCallback(() => {
    if (quizStep + 1 >= totalQuizQuestions) {
      if (quizScore >= 3) earnAchievement("quiz_master");
      setStage("scenario");
    } else {
      setQuizStep(s => s + 1);
      setQuizAnswered(false);
      setSelectedAnswer(null);
    }
  }, [quizStep, totalQuizQuestions, quizScore, earnAchievement]);

  const handleScenarioChoice = useCallback(
    (idx: number) => {
      if (scenarioResolved) return;
      setSelectedOutcome(idx);
      setScenarioResolved(true);
      if (SCENARIOS[scenarioStep].options[idx].isCorrect) {
        earnAchievement("scenario_pro");
      }
    },
    [scenarioResolved, scenarioStep, earnAchievement]
  );

  const nextScenario = useCallback(() => {
    if (scenarioStep + 1 >= SCENARIOS.length) {
      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed < 300) earnAchievement("fast_learner");
      if (quizScore >= 4) earnAchievement("compliance_guru");
      if (earnedCount >= 2) earnAchievement("explorer");
      if (earnedCount >= 3) earnAchievement("all_star");
      setStage("complete");
    } else {
      setScenarioStep(s => s + 1);
      setScenarioResolved(false);
      setSelectedOutcome(null);
    }
  }, [scenarioStep, quizScore, earnedCount, earnAchievement, startTime]);

  const resetDemo = useCallback(() => {
    setStage("intro");
    setQuizStep(0);
    setQuizScore(0);
    setQuizAnswered(false);
    setSelectedAnswer(null);
    setScenarioStep(0);
    setScenarioResolved(false);
    setSelectedOutcome(null);
    setAchievements(ACHIEVEMENTS);
  }, []);

  const currentQuiz = QUIZ_QUESTIONS[quizStep];
  const currentScenario = SCENARIOS[scenarioStep];

  return (
    <div className="djac-page djac-demo-root">
      {/* ── Animated background ──────────────────────────────────────── */}
      <div className="djac-demo-bg" />

      {/* ── Intro Stage ──────────────────────────────────────────────── */}
      {stage === "intro" && (
        <div className="djac-demo-stage">
          <Card className="djac-demo-card border-primary/30 bg-gradient-to-br from-blue-50/60 via-background to-purple-50/60 dark:from-blue-950/30 dark:to-purple-950/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {t("demo.title", "Discover DJAC")}
              </CardTitle>
              <CardDescription className="text-base mt-2 max-w-lg mx-auto">
                {t(
                  "demo.intro_desc",
                  "An interactive, gamified walkthrough of the world's first AI-powered cross-jurisdiction compliance platform. Earn achievements as you learn!"
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: Brain,
                    label: t("demo.step_quiz", "Quiz Challenge"),
                    desc: t(
                      "demo.step_quiz_desc",
                      "Test your compliance knowledge"
                    ),
                  },
                  {
                    icon: Target,
                    label: t("demo.step_scenario", "Scenarios"),
                    desc: t(
                      "demo.step_scenario_desc",
                      "Real-world compliance decisions"
                    ),
                  },
                  {
                    icon: Trophy,
                    label: t("demo.step_achieve", "Achievements"),
                    desc: t(
                      "demo.step_achieve_desc",
                      "Earn badges as you progress"
                    ),
                  },
                ].map((step, i) => (
                  <div
                    key={i}
                    className="djac-glass-card p-4 text-center space-y-2"
                  >
                    <step.icon className="h-8 w-8 mx-auto text-primary" />
                    <div className="font-semibold text-sm">{step.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {step.desc}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  onClick={() => setStage("quiz")}
                  className="gap-2 px-8"
                >
                  <Play className="h-5 w-5" />
                  {t("demo.start", "Start the Demo")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Quiz Stage ───────────────────────────────────────────────── */}
      {stage === "quiz" && (
        <div className="djac-demo-stage">
          <Card className="djac-demo-card">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="gap-1">
                  <Brain className="h-3 w-3" />
                  {t("demo.quiz", "Quiz")} {quizStep + 1}/{totalQuizQuestions}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  {t("demo.score", "Score")}: {quizScore}
                </Badge>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-500"
                  style={{ width: `${quizProgress}%` }}
                />
              </div>
              <CardTitle className="text-lg mt-4">
                {currentQuiz.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentQuiz.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrect = i === currentQuiz.correct;
                let btnClass = "djac-demo-option";
                if (quizAnswered) {
                  if (isCorrect) btnClass += " djac-demo-option-correct";
                  else if (isSelected) btnClass += " djac-demo-option-wrong";
                  else btnClass += " opacity-50";
                } else if (isSelected) {
                  btnClass += " djac-demo-option-selected";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleQuizAnswer(i)}
                    disabled={quizAnswered}
                    className={btnClass}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-semibold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </span>
                    {quizAnswered && isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    {quizAnswered && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                  </button>
                );
              })}
              {quizAnswered && (
                <div className="djac-demo-explanation mt-4">
                  <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-sm">{currentQuiz.explanation}</p>
                </div>
              )}
              {quizAnswered && (
                <div className="flex justify-end pt-2">
                  <Button onClick={nextQuiz} className="gap-2">
                    {quizStep + 1 >= totalQuizQuestions
                      ? t("demo.continue_scenarios", "Continue to Scenarios")
                      : t("demo.next_question", "Next Question")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Scenario Stage ───────────────────────────────────────────── */}
      {stage === "scenario" && (
        <div className="djac-demo-stage">
          <Card className="djac-demo-card">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="gap-1">
                  <Target className="h-3 w-3" />
                  {t("demo.scenario", "Scenario")} {scenarioStep + 1}/
                  {SCENARIOS.length}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {t("demo.compliance_challenge", "Compliance Challenge")}
                </Badge>
              </div>
              <CardTitle className="text-lg">{currentScenario.title}</CardTitle>
              <CardDescription className="text-sm mt-2">
                {currentScenario.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentScenario.options.map((opt, i) => {
                const isSelected = selectedOutcome === i;
                let btnClass = "djac-demo-option";
                if (scenarioResolved) {
                  if (opt.isCorrect) btnClass += " djac-demo-option-correct";
                  else if (isSelected) btnClass += " djac-demo-option-wrong";
                  else btnClass += " opacity-50";
                } else if (isSelected) {
                  btnClass += " djac-demo-option-selected";
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleScenarioChoice(i)}
                    disabled={scenarioResolved}
                    className={btnClass}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-semibold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-sm text-left">{opt.label}</span>
                    </span>
                    {scenarioResolved && opt.isCorrect && (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    )}
                    {scenarioResolved && isSelected && !opt.isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                  </button>
                );
              })}
              {scenarioResolved && selectedOutcome !== null && (
                <div
                  className={`djac-demo-explanation mt-4 ${SCENARIOS[scenarioStep].options[selectedOutcome].isCorrect ? "" : "djac-demo-explanation-wrong"}`}
                >
                  <Lightbulb
                    className={`h-5 w-5 shrink-0 ${SCENARIOS[scenarioStep].options[selectedOutcome].isCorrect ? "text-amber-500" : "text-destructive"}`}
                  />
                  <p className="text-sm">
                    {SCENARIOS[scenarioStep].options[selectedOutcome].outcome}
                  </p>
                </div>
              )}
              {scenarioResolved && (
                <div className="flex justify-end pt-2">
                  <Button onClick={nextScenario} className="gap-2">
                    {scenarioStep + 1 >= SCENARIOS.length
                      ? t("demo.see_results", "See Results")
                      : t("demo.next_scenario", "Next Scenario")}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Complete Stage ───────────────────────────────────────────── */}
      {stage === "complete" && (
        <div className="djac-demo-stage">
          <Card className="djac-demo-card border-emerald-500/40 bg-gradient-to-br from-emerald-50/60 via-background to-blue-50/60 dark:from-emerald-950/30 dark:to-blue-950/30">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                <PartyPopper className="h-10 w-10 text-emerald-600" />
              </div>
              <CardTitle className="text-3xl font-bold">
                {t("demo.complete_title", "You're a DJAC Expert!")}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {t(
                  "demo.complete_desc",
                  "You've mastered the essentials. Here's your performance breakdown."
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="djac-glass-card p-4 text-center">
                  <Brain className="h-8 w-8 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">
                    {quizScore}/{totalQuizQuestions}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("demo.quiz_score", "Quiz Score")}
                  </div>
                </div>
                <div className="djac-glass-card p-4 text-center">
                  <Target className="h-8 w-8 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">
                    {
                      SCENARIOS.filter(_s => _s.options.find(o => o.isCorrect))
                        .length
                    }
                    /{SCENARIOS.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("demo.scenarios_completed", "Scenarios")}
                  </div>
                </div>
                <div className="djac-glass-card p-4 text-center">
                  <Timer className="h-8 w-8 mx-auto text-primary mb-2" />
                  <div className="text-2xl font-bold">
                    {Math.round((Date.now() - startTime) / 1000)}s
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("demo.completion_time", "Time")}
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold mb-3">
                  <Award className="h-5 w-5 text-amber-500" />
                  {t("demo.achievements", "Achievements")}
                  <Badge variant="secondary" className="ml-2">
                    {earnedCount}/{totalAchievements}
                  </Badge>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {achievements.map(a => {
                    const IconComp = ICONS[a.icon] || Star;
                    return (
                      <div
                        key={a.id}
                        className={`djac-demo-achievement ${a.earned ? "djac-demo-achievement-earned" : ""}`}
                      >
                        <IconComp
                          className={`h-5 w-5 ${a.earned ? "text-amber-500" : "text-muted-foreground/40"}`}
                        />
                        <span className="text-xs">{a.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("demo.overall_progress", "Overall Progress")}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {achievementProgress}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-primary transition-all duration-1000"
                    style={{ width: `${achievementProgress}%` }}
                  />
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button onClick={() => navigate("/docs")} className="gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t("demo.explore_docs", "Explore Full Docs")}
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  variant="outline"
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {t("demo.try_djac", "Try DJAC Free")}
                </Button>
                <Button
                  onClick={resetDemo}
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t("demo.retry", "Retry")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Sidebar achievement tracker ───────────────────────────────── */}
      {stage !== "intro" && stage !== "complete" && (
        <div className="djac-demo-sidebar">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Award className="h-3.5 w-3.5" />
              {t("demo.achievements", "Achievements")}
            </div>
            {achievements.slice(0, 4).map(a => {
              const IconComp = ICONS[a.icon] || Star;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md ${
                    a.earned
                      ? "bg-amber-500/10 text-amber-600"
                      : "text-muted-foreground/50"
                  }`}
                >
                  <IconComp className="h-3.5 w-3.5" />
                  <span>{a.title}</span>
                  {a.earned && <CheckCircle2 className="h-3 w-3 ml-auto" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
