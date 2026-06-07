import { useState } from "react";
import type React from "react";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { formatDate } from "@/lib/intl";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock,
    Globe2,
    LoaderCircle,
    Plus,
    ShieldAlert,
    Flag,
} from "lucide-react";

type Priority = "low" | "medium" | "high" | "critical";
type Status = "upcoming" | "overdue" | "completed" | "waived";
type Jurisdiction = "China" | "Saudi Arabia" | "Both";

type Translate = (key: string, fallback: string) => string;

const PRIORITY_CONFIG: Record<Priority, { class: string; icon: React.ReactNode }> = {
    critical: {
        class: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300",
        icon: <ShieldAlert className="h-3.5 w-3.5" />,
    },
    high: {
        class: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    medium: {
        class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300",
        icon: <Clock className="h-3.5 w-3.5" />,
    },
    low: {
        class: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300",
        icon: <Flag className="h-3.5 w-3.5" />,
    },
};

const STATUS_CONFIG: Record<Status, { class: string }> = {
    upcoming: { class: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
    overdue: { class: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
    completed: { class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
    waived: { class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const FRAMEWORK_COLORS: Record<string, string> = {
    PIPL: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    CSL: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
    DSL: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    PDPL: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    NCA: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
};

const JURISDICTION_FLAG: Record<Jurisdiction, string> = {
    China: "🇨🇳",
    "Saudi Arabia": "🇸🇦",
    Both: "🌐",
};

function daysUntil(date: string | Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

function DeadlineCard({
    deadline,
    onComplete,
    completing,
    t,
    locale,
}: {
    deadline: {
        id: number;
        frameworkCode: string;
        title: string;
        description: string | null;
        deadlineDate: string | Date;
        jurisdiction: Jurisdiction;
        priority: Priority;
        status: Status;
    };
    onComplete: (id: number) => void;
    completing: boolean;
    t: Translate;
    locale: string;
}) {
    const days = daysUntil(deadline.deadlineDate);
    const isOverdue = days < 0;
    const isCompleted = deadline.status === "completed";
    const priority = PRIORITY_CONFIG[deadline.priority];
    const status = STATUS_CONFIG[deadline.status];
    const frameworkColor = FRAMEWORK_COLORS[deadline.frameworkCode] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";

    return (
        <Card className={`transition-opacity ${isCompleted ? "opacity-60" : ""} border-l-4 ${isOverdue && !isCompleted
            ? "border-l-red-500"
            : days <= 7 && !isCompleted
                ? "border-l-orange-500"
                : days <= 30 && !isCompleted
                    ? "border-l-yellow-500"
                    : isCompleted
                        ? "border-l-emerald-500"
                        : "border-l-blue-500"
            }`}>
            <CardContent className="pt-4 pb-3 px-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${frameworkColor}`}>
                            {deadline.frameworkCode}
                        </span>
                        <span className="text-sm" title={deadline.jurisdiction}>
                            {JURISDICTION_FLAG[deadline.jurisdiction]}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${priority.class}`}>
                            {priority.icon}
                            {deadline.priority === "critical"
                                ? t("calendar.priorityCritical", "Critical")
                                : deadline.priority === "high"
                                    ? t("calendar.priorityHigh", "High")
                                    : deadline.priority === "medium"
                                        ? t("calendar.priorityMedium", "Medium")
                                        : t("calendar.priorityLow", "Low")}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.class}`}>
                            {deadline.status === "upcoming"
                                ? t("calendar.statusUpcoming", "Upcoming")
                                : deadline.status === "overdue"
                                    ? t("calendar.statusOverdue", "Overdue")
                                    : deadline.status === "completed"
                                        ? t("calendar.statusCompleted", "Completed")
                                        : t("calendar.statusWaived", "Waived")}
                        </span>
                    </div>

                    {/* Days counter */}
                    {!isCompleted && (
                        <div className={`shrink-0 text-right text-xs font-bold tabular-nums ${isOverdue ? "text-red-500" : days <= 7 ? "text-orange-500" : "text-muted-foreground"
                            }`}>
                            {isOverdue
                                ? t("calendar.daysOverdue", `${Math.abs(days)}d overdue`).replace("{days}", String(Math.abs(days)))
                                : days === 0
                                    ? t("calendar.today", "Today!")
                                    : t("calendar.daysLeft", `${days}d left`).replace("{days}", String(days))}
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-sm leading-snug mb-1">{deadline.title}</h3>

                {/* Description */}
                {deadline.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-2">
                        {deadline.description}
                    </p>
                )}

                {/* Footer row */}
                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(deadline.deadlineDate, locale)}
                    </div>

                    {!isCompleted && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => onComplete(deadline.id)}
                            disabled={completing}
                        >
                            {completing ? (
                                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {t("calendar.markComplete", "Mark Complete")}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

const FRAMEWORKS = ["PIPL", "CSL", "DSL", "PDPL", "NCA", "OTHER"];

export default function ComplianceCalendar() {
    usePageTitle("Compliance Calendar");
    const { t, locale } = useLocale();
    const utils = trpc.useUtils();

    const [activeTab, setActiveTab] = useState<"all" | "upcoming" | "overdue" | "completed">("all");
    const [addOpen, setAddOpen] = useState(false);
    const [completingId, setCompletingId] = useState<number | null>(null);

    // Form state
    const [form, setForm] = useState({
        frameworkCode: "",
        title: "",
        description: "",
        deadlineDate: "",
        jurisdiction: "" as Jurisdiction | "",
        priority: "medium" as Priority,
        assignedToUserId: null as number | null,
    });

    const orgMembersQuery = trpc.deadlines.orgMembers.useQuery(undefined, { refetchOnWindowFocus: false });

    const listQuery = trpc.deadlines.list.useQuery(
        activeTab === "all" ? {} : { status: activeTab },
        { refetchOnWindowFocus: false }
    );
    const summaryQuery = trpc.deadlines.summary.useQuery(undefined, { refetchOnWindowFocus: false });

    const createMutation = trpc.deadlines.create.useMutation({
        onSuccess: () => {
            void utils.deadlines.list.invalidate();
            void utils.deadlines.summary.invalidate();
            setAddOpen(false);
            setForm({ frameworkCode: "", title: "", description: "", deadlineDate: "", jurisdiction: "", priority: "medium", assignedToUserId: null });
        },
    });

    const completeMutation = trpc.deadlines.complete.useMutation({
        onSuccess: () => {
            void utils.deadlines.list.invalidate();
            void utils.deadlines.summary.invalidate();
            setCompletingId(null);
        },
        onError: () => {
            setCompletingId(null);
            toast.error(t("calendar.completeError", "Failed to mark deadline complete. Please try again."));
        },
    });

    const handleComplete = (id: number) => {
        setCompletingId(id);
        completeMutation.mutate(id);
    };

    const handleCreate = () => {
        if (!form.frameworkCode || !form.title || !form.deadlineDate || !form.jurisdiction) return;
        createMutation.mutate({
            frameworkCode: form.frameworkCode,
            title: form.title,
            description: form.description || undefined,
            deadlineDate: new Date(form.deadlineDate).toISOString(),
            jurisdiction: form.jurisdiction as Jurisdiction,
            priority: form.priority,
            assignedToUserId: form.assignedToUserId ?? undefined,
        });
    };

    const handleFormKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleCreate();
        }
    };

    const deadlines = listQuery.data ?? [];
    const summary = summaryQuery.data;
    const isCalendarBusy = listQuery.isLoading || summaryQuery.isLoading || createMutation.isPending || completeMutation.isPending;

    return (
        <div className="djac-page">
            <div className="sr-only" role="status" aria-live="polite">
                {isCalendarBusy
                    ? t("calendar.loadingStatus", "Calendar data is loading.")
                    : t("calendar.readyStatus", "Calendar data is ready.")}
            </div>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-primary" />
                        {t("calendar.title", "Compliance Calendar")}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {t("calendar.subtitle", "Track regulatory deadlines across PIPL, CSL, DSL, PDPL and NCA frameworks")}
                    </p>
                </div>

                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            {t("calendar.addDeadline", "Add Deadline")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>{t("calendar.newDeadline", "New Compliance Deadline")}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 py-2">
                            <p className="text-xs text-muted-foreground">
                                {t("calendar.requiredHint", "Framework, jurisdiction, title, and due date are required.")}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>{t("calendar.framework", "Framework")}</Label>
                                    <Select value={form.frameworkCode} onValueChange={v => setForm(f => ({ ...f, frameworkCode: v }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("calendar.select", "Select...")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FRAMEWORKS.map(fw => (
                                                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>{t("calendar.jurisdiction", "Jurisdiction")}</Label>
                                    <Select value={form.jurisdiction} onValueChange={v => setForm(f => ({ ...f, jurisdiction: v as Jurisdiction }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder={t("calendar.select", "Select...")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="China">🇨🇳 {t("calendar.countryChina", "China")}</SelectItem>
                                            <SelectItem value="Saudi Arabia">🇸🇦 {t("calendar.countrySaudiArabia", "Saudi Arabia")}</SelectItem>
                                            <SelectItem value="Both">🌐 {t("calendar.countryBoth", "Both")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>{t("calendar.title_field", "Title")}</Label>
                                <Input
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    onKeyDown={handleFormKeyDown}
                                    placeholder={t("calendar.titlePlaceholder", "e.g. PIPL Annual Assessment Submission")}
                                    maxLength={255}
                                    aria-label={t("calendar.title_field", "Title")}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>{t("calendar.description", "Description")} <span className="text-muted-foreground text-xs">({t("calendar.optional", "optional")})</span></Label>
                                <Input
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    onKeyDown={handleFormKeyDown}
                                    placeholder={t("calendar.descriptionPlaceholder", "Brief description of the obligation")}
                                    maxLength={500}
                                    aria-label={t("calendar.description", "Description")}
                                />
                            </div>

                            {/* Assign To — only shown when there are org members to pick */}
                            {(orgMembersQuery.data?.length ?? 0) > 0 && (
                                <div className="space-y-1">
                                    <Label>{t("calendar.assignTo", "Assign To")} <span className="text-muted-foreground text-xs">({t("calendar.optional", "optional")})</span></Label>
                                    <Select
                                        value={form.assignedToUserId !== null ? String(form.assignedToUserId) : "__none__"}
                                        onValueChange={v => setForm(f => ({ ...f, assignedToUserId: v === "__none__" ? null : Number(v) }))}
                                    >
                                        <SelectTrigger aria-label={t("calendar.assignTo", "Assign To")}>
                                            <SelectValue placeholder={t("calendar.assignToPlaceholder", "Unassigned")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__none__">{t("calendar.unassigned", "— Unassigned —")}</SelectItem>
                                            {orgMembersQuery.data?.map(member => (
                                                <SelectItem key={member.id} value={String(member.id)}>
                                                    {member.name || member.email}
                                                    <span className="ml-1.5 text-xs text-muted-foreground capitalize">{member.role.replace("_", " ")}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label>{t("calendar.dueDate", "Due Date")}</Label>
                                    <Input
                                        type="date"
                                        value={form.deadlineDate}
                                        onChange={e => setForm(f => ({ ...f, deadlineDate: e.target.value }))}
                                        onKeyDown={handleFormKeyDown}
                                        aria-label={t("calendar.dueDate", "Due Date")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label>{t("calendar.priority", "Priority")}</Label>
                                    <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">{t("calendar.priorityLow", "Low")}</SelectItem>
                                            <SelectItem value="medium">{t("calendar.priorityMedium", "Medium")}</SelectItem>
                                            <SelectItem value="high">{t("calendar.priorityHigh", "High")}</SelectItem>
                                            <SelectItem value="critical">{t("calendar.priorityCritical", "Critical")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("calendar.shortcutHint", "Press Ctrl+Enter to save this deadline.")}
                        </p>
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button variant="outline" size="sm">{t("calendar.cancel", "Cancel")}</Button>
                            </DialogClose>
                            <Button
                                size="sm"
                                onClick={handleCreate}
                                disabled={
                                    createMutation.isPending ||
                                    !form.frameworkCode || !form.title || !form.deadlineDate || !form.jurisdiction
                                }
                            >
                                {createMutation.isPending ? (
                                    <><LoaderCircle className="h-3.5 w-3.5 animate-spin mr-1.5" />{t("calendar.saving", "Saving...")}</>
                                ) : t("calendar.saveDeadline", "Save Deadline")}
                            </Button>
                        </DialogFooter>
                        {createMutation.isPending ? (
                            <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                                {t("calendar.savingHint", "Saving your deadline...")}
                            </p>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </div>

            {(summaryQuery.isError || listQuery.isError) && (
                <Card className="mb-4 border-destructive/30">
                    <CardContent className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-medium text-foreground">{t("calendar.loadError", "Failed to load compliance calendar data.")}</p>
                            <p className="text-muted-foreground">{t("calendar.retryHint", "Retry to refresh deadlines and summary statistics.")}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { void listQuery.refetch(); void summaryQuery.refetch(); }}>
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: t("calendar.statsTotal", "Total"), value: summary?.total, icon: <CalendarDays className="h-4 w-4" />, color: "text-primary" },
                    { label: t("calendar.statsOverdue", "Overdue"), value: summary?.overdue, icon: <AlertTriangle className="h-4 w-4" />, color: "text-red-500" },
                    { label: t("calendar.statsUpcoming", "Upcoming"), value: summary?.upcoming, icon: <Clock className="h-4 w-4" />, color: "text-blue-500" },
                    { label: t("calendar.statsCritical", "Critical"), value: summary?.critical, icon: <ShieldAlert className="h-4 w-4" />, color: "text-orange-500" },
                ].map(stat => (
                    <Card key={stat.label}>
                        <CardContent className="p-4">
                            <div className={`flex items-center gap-2 ${stat.color} mb-1`}>
                                {stat.icon}
                                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-bold">
                                {summaryQuery.isLoading ? "—" : (stat.value ?? 0)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs + list */}
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
                <TabsList>
                    <TabsTrigger value="all">{t("calendar.tabAll", "All")}</TabsTrigger>
                    <TabsTrigger value="upcoming">
                        {t("calendar.tabUpcoming", "Upcoming")}
                        {summary?.upcoming ? (
                            <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">{summary.upcoming}</Badge>
                        ) : null}
                    </TabsTrigger>
                    <TabsTrigger value="overdue">
                        {t("calendar.tabOverdue", "Overdue")}
                        {summary?.overdue ? (
                            <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-red-500 hover:bg-red-500">{summary.overdue}</Badge>
                        ) : null}
                    </TabsTrigger>
                    <TabsTrigger value="completed">{t("calendar.tabCompleted", "Completed")}</TabsTrigger>
                </TabsList>

                {(["all", "upcoming", "overdue", "completed"] as const).map(tab => (
                    <TabsContent key={tab} value={tab} className="mt-4">
                        {listQuery.isError ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                <Globe2 className="h-8 w-8 opacity-30" />
                                <p className="text-sm font-medium text-foreground">{t("calendar.loadError", "Failed to load compliance calendar data.")}</p>
                                <Button variant="outline" size="sm" onClick={() => { void listQuery.refetch(); }}>
                                    {t("common.retry", "Retry")}
                                </Button>
                            </div>
                        ) : listQuery.isLoading ? (
                            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2" role="status" aria-live="polite">
                                <LoaderCircle className="h-5 w-5 animate-spin" />
                                {t("calendar.loadingDeadlines", "Loading deadlines...")}
                            </div>
                        ) : deadlines.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                <Globe2 className="h-8 w-8 opacity-30" />
                                <p className="text-sm font-medium text-foreground">{t("calendar.emptyTitle", "No deadlines yet")}</p>
                                <p className="text-sm">{t("calendar.noDeadlines", "No deadlines found.")}</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {deadlines.map(deadline => (
                                    <DeadlineCard
                                        key={deadline.id}
                                        deadline={deadline as Parameters<typeof DeadlineCard>[0]["deadline"]}
                                        onComplete={handleComplete}
                                        completing={completingId === deadline.id && completeMutation.isPending}
                                        t={t}
                                        locale={locale}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
