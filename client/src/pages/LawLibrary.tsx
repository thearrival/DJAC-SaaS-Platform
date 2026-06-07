import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    BookmarkCheck, BookOpen, Calendar, Check, ChevronDown, ChevronUp,
    Copy, FileText, Globe, Layers, LoaderCircle, Search, Shield,
    BookmarkIcon, Tag, Link2, ChevronRight,
} from "lucide-react";

// ── Framework badge colour map ────────────────────────────────────────────────
const FW_STYLE: Record<string, string> = {
    PIPL: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    CSL: "bg-blue-100  text-blue-700  border-blue-200  dark:bg-blue-900/30  dark:text-blue-300",
    DSL: "bg-teal-100  text-teal-700  border-teal-200  dark:bg-teal-900/30  dark:text-teal-300",
    PDPL: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    NCA: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const JX_STYLE: Record<string, string> = {
    "China": "bg-red-50    text-red-700    border-red-200    dark:bg-red-900/20    dark:text-red-300",
    "Saudi Arabia": "bg-green-50  text-green-700  border-green-200  dark:bg-green-900/20  dark:text-green-300",
    "Cross-border": "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300",
};

const ALL_FRAMEWORKS = ["PIPL", "CSL", "DSL", "PDPL", "NCA"] as const;

// ── Bookmarks (localStorage) ──────────────────────────────────────────────────
function useBookmarks() {
    const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
        try { return new Set(JSON.parse(localStorage.getItem("ll-bookmarks") ?? "[]")); }
        catch { return new Set(); }
    });
    const toggle = useCallback((slug: string) => {
        setBookmarks(prev => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug); else next.add(slug);
            localStorage.setItem("ll-bookmarks", JSON.stringify([...next]));
            return next;
        });
    }, []);
    return { bookmarks, toggle };
}

// ── Copy-to-clipboard helper ──────────────────────────────────────────────────
function useCopyToClipboard() {
    const [copied, setCopied] = useState<string | null>(null);
    const copy = useCallback((text: string, key: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
        }).catch(() => { });
    }, []);
    return { copied, copy };
}

// ── Article detail panel (fetched on demand) ──────────────────────────────────
function ArticleDetailPanel({ slug, onJumpTo }: { slug: string; onJumpTo: (slug: string) => void }) {
    const q = trpc.compliance.lawBySlug.useQuery({ slug }, { refetchOnWindowFocus: false });
    const allQ = trpc.compliance.laws.useQuery(undefined, { staleTime: 60_000, refetchOnWindowFocus: false });

    const related = useMemo(() => {
        if (!q.data || !allQ.data) return [];
        const myFw = new Set(q.data.frameworkCodes);
        return allQ.data
            .filter(l => l.slug !== slug && l.frameworkCodes.some(fw => myFw.has(fw)))
            .slice(0, 5);
    }, [q.data, allQ.data, slug]);

    if (q.isLoading) {
        return (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                <span>Loading full article…</span>
            </div>
        );
    }

    if (q.isError && !q.data) {
        return (
            <div className="space-y-2 py-4 text-sm text-muted-foreground">
                <p>{q.error?.message ?? "Failed to load article details."}</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { void q.refetch(); }}>
                    Retry
                </Button>
            </div>
        );
    }

    const law = q.data;
    if (!law) return <p className="py-3 text-sm text-muted-foreground">No record found.</p>;

    return (
        <div className="mt-4 space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {law.sections.length} sections
                </span>
                <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Updated: {law.updatedAt}
                </span>
            </div>

            <div className="space-y-2">
                {law.sections.map((section, i) => (
                    <div key={`${slug}-s${i}`} className="rounded-md border bg-background p-3 shadow-sm">
                        <p className="text-sm font-semibold text-foreground">{section.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{section.excerpt}</p>
                        {section.keywords.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {section.keywords.map(kw => (
                                    <Badge key={kw} variant="outline" className="h-5 text-[10px] py-0">{kw}</Badge>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {law.sources.length > 0 && (
                <div className="border-t pt-3">
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Sources</p>
                    <ul className="space-y-0.5">
                        {law.sources.map(src => (
                            <li key={src} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3 flex-shrink-0" />{src}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Cross-references */}
            {related.length > 0 && (
                <div className="border-t pt-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                        <Link2 className="h-3 w-3" /> Related Articles
                    </p>
                    <div className="space-y-1">
                        {related.map(rel => (
                            <button
                                key={rel.slug}
                                onClick={() => onJumpTo(rel.slug)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
                            >
                                <div className="flex shrink-0 gap-1">
                                    {rel.frameworkCodes.map(fw => (
                                        <span
                                            key={fw}
                                            className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${FW_STYLE[fw] ?? "bg-muted text-muted-foreground"}`}
                                        >
                                            {fw}
                                        </span>
                                    ))}
                                </div>
                                <span className="flex-1 truncate text-muted-foreground">{rel.title}</span>
                                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LawLibrary() {
    usePageTitle("Law Library");
    const { t } = useLocale();

    const [query, setQuery] = useState("");
    const [fwFilter, setFwFilter] = useState<string>("All");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
    const { bookmarks, toggle: toggleBookmark } = useBookmarks();
    const { copied, copy } = useCopyToClipboard();

    const handleJumpTo = useCallback((slug: string) => {
        setQuery("");         // back to browse mode
        setFwFilter("All");   // show all articles
        setShowBookmarksOnly(false);
        setExpanded(slug);
        setTimeout(() => {
            document.getElementById(`ll-card-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
    }, []);

    const isSearching = query.trim().length > 0;

    // All laws (browse mode + KPI)
    const allLawsQuery = trpc.compliance.laws.useQuery(undefined, {
        refetchOnWindowFocus: false,
        staleTime: 60_000,
    });

    // Search mode
    const searchQuery = trpc.compliance.lawsSearch.useQuery(
        { query: query.trim(), limit: 50 },
        { enabled: isSearching, refetchOnWindowFocus: false },
    );

    // Error toasts
    useEffect(() => {
        if (allLawsQuery.error) toast.error(t("laws.loadError", "Failed to load law library."));
    }, [allLawsQuery.error]);
    useEffect(() => {
        if (searchQuery.error) toast.error(t("laws.searchError", "Search failed. Please try again."));
    }, [searchQuery.error]);

    // KPI from all laws
    const kpi = useMemo(() => {
        const laws = allLawsQuery.data ?? [];
        return {
            articles: laws.length,
            frameworks: new Set(laws.flatMap(l => l.frameworkCodes)).size,
            sections: laws.reduce((n, l) => n + l.sections.length, 0),
            jurisdictions: new Set(laws.map(l => l.jurisdiction)).size,
        };
    }, [allLawsQuery.data]);

    // Framework counts for pills
    const fwCounts = useMemo(() => {
        const laws = allLawsQuery.data ?? [];
        return ALL_FRAMEWORKS.reduce<Record<string, number>>((acc, fw) => {
            acc[fw] = laws.filter(l => l.frameworkCodes.includes(fw)).length;
            return acc;
        }, {});
    }, [allLawsQuery.data]);

    // Displayed items — search result or full list, then filtered
    const displayedItems = useMemo(() => {
        const base = isSearching ? (searchQuery.data ?? []) : (allLawsQuery.data ?? []);
        let out = fwFilter === "All" ? base : base.filter(it => it.frameworkCodes.includes(fwFilter));
        if (showBookmarksOnly) out = out.filter(it => bookmarks.has(it.slug));
        return out;
    }, [isSearching, searchQuery.data, allLawsQuery.data, fwFilter, showBookmarksOnly, bookmarks]);

    const isLoading = isSearching ? searchQuery.isLoading : allLawsQuery.isLoading;
    const hasLoadError = isSearching ? searchQuery.isError : allLawsQuery.isError;

    function citationFor(title: string, frameworkCodes: string[], jurisdiction: string) {
        return `${title} (${frameworkCodes.join(", ")}; ${jurisdiction}) — DJAC Legal Knowledge Library`;
    }

    return (
        <div className="djac-page space-y-6">

            {/* ── Header ── */}
            <div>
                <h1
                    className="text-3xl font-bold mb-1.5"
                    style={{ background: "linear-gradient(135deg,#FFD600,#FF6B2B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                >
                    {t("laws.title", "Legal Knowledge Library")}
                </h1>
                <p className="text-sm" style={{ color: "var(--djac-muted)" }}>
                    {t("laws.subtitle", "Search across China and Saudi cybersecurity laws in plain language — no legal degree required.")}
                </p>
            </div>

            {/* ── KPI bar ── */}
            {!allLawsQuery.isLoading && !allLawsQuery.isError && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                        { icon: BookOpen, label: "Articles", value: kpi.articles, color: "text-amber-500" },
                        { icon: Shield, label: "Frameworks", value: kpi.frameworks, color: "text-blue-500" },
                        { icon: Layers, label: "Sections", value: kpi.sections, color: "text-teal-500" },
                        { icon: Globe, label: "Jurisdictions", value: kpi.jurisdictions, color: "text-purple-500" },
                    ] as const).map(stat => (
                        <Card key={stat.label} className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                <div>
                                    <p className="text-2xl font-bold leading-none">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {hasLoadError && (
                <Card>
                    <CardContent className="flex items-center justify-between gap-3 py-4">
                        <p className="text-sm text-muted-foreground">
                            {(isSearching ? searchQuery.error?.message : allLawsQuery.error?.message) ?? t("laws.loadError", "Failed to load law library.")}
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                                if (isSearching) {
                                    void searchQuery.refetch();
                                    return;
                                }
                                void allLawsQuery.refetch();
                            }}
                        >
                            {t("common.retry", "Retry")}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* ── Search + filter bar ── */}
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={t("laws.searchPlaceholder", "Search laws, sections, obligations, penalties…")}
                        className="w-full rounded-md border border-input bg-background py-2.5 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm leading-none"
                            aria-label="Clear search"
                        >
                            âœ•
                        </button>
                    )}
                </div>

                {/* Framework filter pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground shrink-0">Filter:</span>
                    <Button
                        size="sm" variant={fwFilter === "All" ? "default" : "outline"}
                        className="h-7 text-xs gap-1"
                        onClick={() => setFwFilter("All")}
                    >
                        All
                        <Badge variant="secondary" className="ml-0.5 h-4 text-[10px] px-1.5">
                            {allLawsQuery.data?.length ?? "—"}
                        </Badge>
                    </Button>

                    {ALL_FRAMEWORKS.map(fw => (
                        <Button
                            key={fw}
                            size="sm"
                            variant={fwFilter === fw ? "default" : "outline"}
                            className="h-7 text-xs gap-1"
                            onClick={() => setFwFilter(prev => (prev === fw ? "All" : fw))}
                        >
                            {fw}
                            {fwCounts[fw] !== undefined && (
                                <Badge variant="secondary" className="ml-0.5 h-4 text-[10px] px-1.5">
                                    {fwCounts[fw]}
                                </Badge>
                            )}
                        </Button>
                    ))}

                    <Button
                        size="sm"
                        variant={showBookmarksOnly ? "default" : "outline"}
                        className="h-7 text-xs gap-1 ml-auto"
                        onClick={() => setShowBookmarksOnly(p => !p)}
                    >
                        <BookmarkIcon className="h-3 w-3" />
                        Saved ({bookmarks.size})
                    </Button>
                </div>
            </div>

            {/* ── Results ── */}
            {isLoading ? (
                <Card>
                    <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        <span>{t("laws.loading", "Loading legal references…")}</span>
                    </CardContent>
                </Card>
            ) : hasLoadError && displayedItems.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        {t("laws.loadError", "Failed to load law library.")}
                    </CardContent>
                </Card>
            ) : displayedItems.length === 0 ? (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        {showBookmarksOnly
                            ? "No bookmarked articles yet. Click the bookmark icon on any article to save it."
                            : t("laws.noResults", "No legal references matched your search.")}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {isSearching && (
                        <p className="text-xs text-muted-foreground">
                            {displayedItems.length} result{displayedItems.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                        </p>
                    )}

                    {displayedItems.map(item => {
                        const isOpen = expanded === item.slug;
                        const isBookmarked = bookmarks.has(item.slug);
                        const isCopied = copied === item.slug;
                        // Type-specific fields only present in LawKnowledgeSearchResult
                        const highlights = (item as { highlights?: { title: string; excerpt: string }[] }).highlights;
                        const matchedTopics = (item as { matchedTopics?: string[] }).matchedTopics;

                        return (
                            <Card
                                key={item.slug}
                                id={`ll-card-${item.slug}`}
                                className={`transition-all ${isOpen ? "shadow-md ring-1 ring-ring/20" : "hover:shadow-sm"}`}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1 min-w-0">
                                            {/* Jurisdiction + framework badges */}
                                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${JX_STYLE[item.jurisdiction] ?? ""}`}
                                                >
                                                    {item.jurisdiction}
                                                </Badge>
                                                {item.frameworkCodes.map(fw => (
                                                    <Badge
                                                        key={fw}
                                                        className={`text-xs border ${FW_STYLE[fw] ?? "bg-muted text-muted-foreground"}`}
                                                    >
                                                        {fw}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                                            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                {item.summary}
                                            </p>
                                        </div>

                                        {/* Action icons */}
                                        <div className="flex shrink-0 items-center gap-0.5">
                                            <Button
                                                size="icon" variant="ghost" className="h-8 w-8"
                                                title={isCopied ? "Copied!" : "Copy citation"}
                                                onClick={() => copy(
                                                    citationFor(item.title, item.frameworkCodes, item.jurisdiction),
                                                    item.slug,
                                                )}
                                            >
                                                {isCopied
                                                    ? <Check className="h-3.5 w-3.5 text-green-500" />
                                                    : <Copy className="h-3.5 w-3.5" />}
                                            </Button>
                                            <Button
                                                size="icon" variant="ghost"
                                                className={`h-8 w-8 ${isBookmarked ? "text-amber-500" : ""}`}
                                                title={isBookmarked ? "Remove bookmark" : "Bookmark article"}
                                                onClick={() => toggleBookmark(item.slug)}
                                            >
                                                {isBookmarked
                                                    ? <BookmarkCheck className="h-3.5 w-3.5" />
                                                    : <BookmarkIcon className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0 space-y-3">
                                    {/* Key topics */}
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        {item.keyTopics.slice(0, 5).map(topic => (
                                            <Badge key={topic} variant="secondary" className="h-5 text-xs">{topic}</Badge>
                                        ))}
                                        {item.keyTopics.length > 5 && (
                                            <span className="text-xs text-muted-foreground">
                                                +{item.keyTopics.length - 5} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Matched topics (search only) */}
                                    {matchedTopics && matchedTopics.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs font-medium text-muted-foreground">Matched:</span>
                                            {matchedTopics.map(topic => (
                                                <Badge key={topic} className="h-5 text-xs bg-primary/10 text-primary">
                                                    {topic}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}

                                    {/* Search highlights preview (collapsed only) */}
                                    {highlights && highlights.length > 0 && !isOpen && (
                                        <div className="space-y-1.5">
                                            {highlights.slice(0, 2).map((h, i) => (
                                                <div key={i} className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                                                    <span className="font-medium text-foreground">{h.title}: </span>
                                                    <span className="text-muted-foreground">{h.excerpt}</span>
                                                </div>
                                            ))}
                                            {highlights.length > 2 && !isOpen && (
                                                <p className="text-xs text-muted-foreground pl-1">
                                                    +{highlights.length - 2} more relevant sections…
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Expand / collapse button */}
                                    <Button
                                        size="sm" variant="ghost" className="-ml-1 h-7 gap-1 text-xs"
                                        onClick={() => setExpanded(prev => (prev === item.slug ? null : item.slug))}
                                    >
                                        {isOpen
                                            ? <><ChevronUp className="h-3.5 w-3.5" /> Hide full article</>
                                            : <><ChevronDown className="h-3.5 w-3.5" /> Read full article</>}
                                    </Button>

                                    {/* Full article panel */}
                                    {isOpen && <ArticleDetailPanel slug={item.slug} onJumpTo={handleJumpTo} />}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
