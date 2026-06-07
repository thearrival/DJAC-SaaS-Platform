import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

interface OverviewStats {
    totalUsers: number;
    totalOrgs: number;
    activeSessions: number;
    todayLogins: number;
    openServiceRequests: number;
    totalAssets: number;
    todaySignups: number;
    newOrgsToday: number;
    paidOrgs: number;
}

interface SignupRow {
    id: number;
    username: string;
    email: string;
    role: string;
    isEmailVerified: number;
    isMfaEnabled: number;
    createdAt: string;
    lastLoginAt: string | null;
    organizationName: string | null;
    organizationPlan: string | null;
}

interface OrgRow {
    id: number;
    name: string;
    plan: string;
    isActive: number;
    trialEndsAt: string | null;
    createdAt: string;
    updatedAt: string;
    memberCount: number;
    activeSessions: number;
}

interface RealtimeStats {
    activeSessions: number;
    recentActions: number;
    newUsersLastHour: number;
    sseClients: number;
    dbStatus: string;
    ts: string;
}

interface SystemInfo {
    uptime: number;
    uptimeFormatted: string;
    memory: { rss: number; heapUsed: number; heapTotal: number; external: number };
    db: { status: string; version: string; tableCount: number };
    env: { nodeEnv: string; aiQueueMode: string; redisConfigured: boolean; databasePoolSize: number };
    sseClients: number;
}

interface UserRow {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string;
    isEmailVerified: number;
    isMfaEnabled: number;
    createdAt: string;
    lastLoginAt: string | null;
    activeSessions: number;
}

interface AdminAuditRow {
    id: number;
    adminUsername: string;
    action: string;
    target: string | null;
    ipAddress: string;
    createdAt: string;
}

interface PlatformAuditRow {
    id: number;
    category: string;
    action: string;
    entityType: string | null;
    entityId: number | null;
    targetEntity: string | null;
    actorRole: string | null;
    outcome: string;
    payload: string | null;
    createdAt: string;
}

interface InteractionRow {
    id: number;
    context: string;
    action: string;
    entityType: string | null;
    entityId: number | null;
    inputSnapshot: string | null;
    outputRef: string | null;
    durationMs: number | null;
    createdAt: string;
    organizationId: number | null;
    actorName: string;
    actorEmail: string;
    organizationName: string | null;
}

interface AccessRequestRow {
    id: number;
    fullName: string;
    email: string;
    organizationName: string;
    status: string;
    preferredLocale?: string | null;
    createdAt: string;
}

interface ConsultationRequestRow {
    id: number;
    contactName: string;
    contactEmail: string;
    organizationName: string;
    topic: string;
    status: string;
    createdAt: string;
}

interface ServiceRequestRow {
    id: number;
    serviceType: string;
    title: string;
    priority: string;
    status: string;
    requestedByUserId: number | null;
    createdAt: string;
    updatedAt: string;
    requestedByUsername: string | null;
    requestedByEmail: string | null;
    organizationName: string | null;
}

interface IntakeData {
    counts: {
        accessRequests: number;
        consultationRequests: number;
        serviceRequests: number;
    };
    accessRequests: AccessRequestRow[];
    consultationRequests: ConsultationRequestRow[];
    serviceRequests: ServiceRequestRow[];
}

interface OnboardingCountRow {
    stage: string;
    total: number;
}

interface OnboardingRecentRow {
    id: number;
    stage: string;
    accountIntent: string | null;
    selectedLocale: string;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
    userLabel: string;
    userEmail: string;
}

interface OnboardingData {
    counts: OnboardingCountRow[];
    recent: OnboardingRecentRow[];
}

interface ValidationRow {
    id: number;
    category: string;
    action: string;
    entityType: string | null;
    entityId: number | null;
    targetEntity: string | null;
    actorRole: string | null;
    outcome: string;
    payload: string | null;
    createdAt: string;
}

interface SubscriptionRow {
    id: number;
    plan: string;
    status: string;
    billingInterval: string;
    amountCents: number;
    currency: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: number;
    canceledAt: string | null;
    stripeSubscriptionId: string | null;
    createdAt: string;
    updatedAt: string;
    organizationName: string;
    organizationSlug: string;
    billingEmail: string;
}

interface BillingEventRow {
    id: number;
    eventType: string;
    status: string;
    amountCents: number | null;
    currency: string;
    stripeEventId: string | null;
    createdAt: string;
    organizationName: string;
}

interface SubscriptionSummaryRow {
    plan: string;
    status: string;
    currency: string;
    count: number;
    totalAmountCents: number;
}

interface SubscriptionsData {
    subscriptions: SubscriptionRow[];
    billingEvents: BillingEventRow[];
    summary: SubscriptionSummaryRow[];
}

interface LiveEvent {
    id: string;
    event: string;
    data: unknown;
    ts: string;
}

interface UserDetailData {
    user: {
        id: number;
        username: string;
        email: string;
        role: string;
        status: string;
        isEmailVerified: number;
        isMfaEnabled: number;
        createdAt: string;
        lastLoginAt: string | null;
        organizationName: string | null;
        organizationPlan: string | null;
    };
    sessions: { id: string; ipAddress: string; userAgent: string | null; createdAt: string; expiresAt: string }[];
    auditTrail: { category: string; action: string; outcome: string; createdAt: string }[];
    interactions: { context: string; action: string; entityType: string | null; createdAt: string; durationMs: number | null }[];
}

interface OrgDetailData {
    org: {
        id: number;
        name: string;
        plan: string;
        status: string;
        isActive: number;
        trialEndsAt: string | null;
        createdAt: string;
        updatedAt: string;
        contactEmail: string | null;
        billingEmail: string | null;
    };
    members: {
        role: string;
        userId: number;
        username: string;
        email: string;
        userStatus: string;
        lastLoginAt: string | null;
        joinedAt: string;
    }[];
    subscription: {
        id: number;
        plan: string;
        status: string;
        currentPeriodStart: string;
        currentPeriodEnd: string;
        cancelAtPeriodEnd: number;
        createdAt: string;
        updatedAt: string;
    } | null;
    auditTrail: { category: string; action: string; outcome: string; createdAt: string }[];
}

interface OwnerAccessLinkResponse {
    ok: boolean;
    url: string;
    relativeUrl: string;
    redirectTo: string;
    expiresAt: number;
    expiresAtIso: string;
    oneTime: boolean;
}

type Tab = "overview" | "users" | "signups" | "orgs" | "subscriptions" | "intake" | "onboarding" | "interactions" | "platformAudit" | "validation" | "system" | "audit" | "realtime";

async function apiFetch<T = void>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api/yalla-admin${path}`, { credentials: "include", ...init });
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
            <p className="text-3xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
            {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
    );
}

function Badge({ value }: { value: string }) {
    const colors: Record<string, string> = {
        admin: "bg-red-500/20 text-red-400 border-red-500/30",
        super_admin: "bg-orange-500/20 text-orange-400 border-orange-500/30",
        platform_admin: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        yalla_hack_employee: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        company_admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        professional_user: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        healthy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        error: "bg-red-500/20 text-red-400 border-red-500/30",
        failure: "bg-red-500/20 text-red-400 border-red-500/30",
        blocked: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        unavailable: "bg-slate-600/40 text-slate-400 border-slate-600/40",
        completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        submitted: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        under_review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        draft: "bg-slate-600/40 text-slate-400 border-slate-600/40",
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colors[value] ?? "bg-slate-700/50 text-slate-300 border-slate-600/40"}`}>{value}</span>;
}

function JsonPreview({ value, title }: { value: string | null; title: string }) {
    if (!value) return <span className="text-slate-600 text-xs">No {title.toLowerCase()}</span>;
    let formatted = value;
    try {
        formatted = JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        formatted = value;
    }
    return (
        <details className="bg-slate-900/50 border border-slate-700/40 rounded-lg">
            <summary className="cursor-pointer list-none px-3 py-2 text-xs text-cyan-400">{title}</summary>
            <pre className="px-3 pb-3 text-[11px] leading-5 text-slate-300 whitespace-pre-wrap break-words overflow-x-auto">{formatted}</pre>
        </details>
    );
}

function UserDetailModal({ userId, onClose }: { userId: number; onClose: () => void }) {
    const [detail, setDetail] = useState<UserDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    const loadDetail = () => {
        setLoading(true);
        setError(null);
        apiFetch<UserDetailData>(`/stats/users/${userId}`)
            .then((d) => { setDetail(d); setLoading(false); })
            .catch((e: unknown) => { setError(e instanceof Error ? e.message : "Failed to load"); setLoading(false); });
    };

    useEffect(() => { loadDetail(); }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSuspend = async (suspend: boolean) => {
        setActionLoading(suspend ? "suspend" : "unsuspend");
        setActionMsg(null);
        try {
            await apiFetch(`/users/${userId}/suspend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suspend }) });
            setActionMsg(suspend ? "User suspended." : "User unsuspended.");
            loadDetail();
        } catch (e: unknown) {
            setActionMsg(e instanceof Error ? e.message : "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevokeSessions = async () => {
        setActionLoading("revoke");
        setActionMsg(null);
        try {
            await apiFetch(`/users/${userId}/revoke-sessions`, { method: "POST" });
            setActionMsg("All sessions revoked.");
            loadDetail();
        } catch (e: unknown) {
            setActionMsg(e instanceof Error ? e.message : "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative h-full w-full max-w-xl bg-[#0d1526] border-l border-slate-700/60 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-[#0d1526] border-b border-slate-800/60 px-6 py-4 flex items-center justify-between z-10">
                    <h3 className="text-sm font-semibold text-white">User Detail</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="p-6 space-y-6">
                    {loading && <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>}
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {detail && (
                        <>
                            <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">{detail.user.username.charAt(0).toUpperCase()}</div>
                                    <div>
                                        <p className="text-white font-semibold">{detail.user.username}</p>
                                        <p className="text-slate-500 text-xs">{detail.user.email}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <Badge value={detail.user.role} />
                                        {detail.user.status === "suspended" && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">SUSPENDED</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                                    <span className="text-slate-500">Organization:</span><span className="text-white">{detail.user.organizationName ?? "—"}</span>
                                    <span className="text-slate-500">Plan:</span><span className="text-white">{detail.user.organizationPlan ?? "—"}</span>
                                    <span className="text-slate-500">Registered:</span><span className="text-white">{new Date(detail.user.createdAt).toLocaleString()}</span>
                                    <span className="text-slate-500">Last Login:</span><span className="text-white">{detail.user.lastLoginAt ? new Date(detail.user.lastLoginAt).toLocaleString() : "Never"}</span>
                                    <span className="text-slate-500">Email Verified:</span><span className={Boolean(detail.user.isEmailVerified) ? "text-emerald-400" : "text-red-400"}>{Boolean(detail.user.isEmailVerified) ? "Yes" : "No"}</span>
                                    <span className="text-slate-500">MFA:</span><span className={Boolean(detail.user.isMfaEnabled) ? "text-emerald-400" : "text-slate-500"}>{Boolean(detail.user.isMfaEnabled) ? "Enabled" : "Disabled"}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-700/40">
                                    {detail.user.status === "suspended" ? (
                                        <button
                                            disabled={!!actionLoading}
                                            onClick={() => void handleSuspend(false)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition"
                                        >{actionLoading === "unsuspend" ? "Unsuspending…" : "Unsuspend User"}</button>
                                    ) : (
                                        <button
                                            disabled={!!actionLoading}
                                            onClick={() => void handleSuspend(true)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-50 transition"
                                        >{actionLoading === "suspend" ? "Suspending…" : "Suspend User"}</button>
                                    )}
                                    <button
                                        disabled={!!actionLoading}
                                        onClick={() => void handleRevokeSessions()}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 disabled:opacity-50 transition"
                                    >{actionLoading === "revoke" ? "Revoking…" : "Revoke All Sessions"}</button>
                                    {actionMsg && <span className="text-xs text-slate-400 ml-1">{actionMsg}</span>}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sessions ({detail.sessions.length})</p>
                                <div className="space-y-2">
                                    {detail.sessions.length === 0 && <p className="text-slate-600 text-xs">No sessions recorded.</p>}
                                    {detail.sessions.map((s) => (
                                        <div key={s.id} className="bg-slate-900/60 border border-slate-800/60 rounded-lg px-3 py-2 text-xs">
                                            <p className="text-white font-mono truncate">{s.ipAddress}</p>
                                            <p className="text-slate-500 mt-0.5 truncate">{s.userAgent ?? "Unknown UA"}</p>
                                            <p className="text-slate-600 mt-0.5">{new Date(s.createdAt).toLocaleString()} → {new Date(s.expiresAt).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Audit Trail ({detail.auditTrail.length})</p>
                                <div className="space-y-1">
                                    {detail.auditTrail.length === 0 && <p className="text-slate-600 text-xs">No audit events.</p>}
                                    {detail.auditTrail.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-slate-800/40">
                                            <Badge value={a.outcome} /><span className="text-slate-300 flex-1 truncate">{a.action}</span><span className="text-slate-600 flex-shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Interactions ({detail.interactions.length})</p>
                                <div className="space-y-1">
                                    {detail.interactions.length === 0 && <p className="text-slate-600 text-xs">No interactions recorded.</p>}
                                    {detail.interactions.map((ia, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-slate-800/40">
                                            <span className="text-cyan-400">{ia.context}</span><span className="text-slate-500">/</span><span className="text-slate-300 flex-1 truncate">{ia.action}</span>{ia.durationMs != null && <span className="text-slate-600">{ia.durationMs}ms</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function OrganizationDetailModal({ orgId, onClose }: { orgId: number; onClose: () => void }) {
    const [detail, setDetail] = useState<OrgDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [actionMsg, setActionMsg] = useState<string | null>(null);

    const loadDetail = () => {
        setLoading(true);
        setError(null);
        apiFetch<OrgDetailData>(`/stats/orgs/${orgId}`)
            .then((d) => { setDetail(d); setLoading(false); })
            .catch((e: unknown) => { setError(e instanceof Error ? e.message : "Failed to load"); setLoading(false); });
    };

    useEffect(() => { loadDetail(); }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSuspend = async (suspend: boolean) => {
        setActionLoading(suspend ? "suspend" : "unsuspend");
        setActionMsg(null);
        try {
            await apiFetch(`/orgs/${orgId}/suspend`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ suspend }) });
            setActionMsg(suspend ? "Organization suspended." : "Organization unsuspended.");
            loadDetail();
        } catch (e: unknown) {
            setActionMsg(e instanceof Error ? e.message : "Action failed");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="relative h-full w-full max-w-2xl bg-[#0d1526] border-l border-slate-700/60 overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-[#0d1526] border-b border-slate-800/60 px-6 py-4 flex items-center justify-between z-10">
                    <h3 className="text-sm font-semibold text-white">Organization Detail</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
                <div className="p-6 space-y-6">
                    {loading && <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>}
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    {detail && (
                        <>
                            <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">{detail.org.name.charAt(0).toUpperCase()}</div>
                                    <div className="flex-1">
                                        <p className="text-white font-semibold">{detail.org.name}</p>
                                        <p className="text-slate-500 text-xs">{detail.org.contactEmail ?? "No contact email"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge value={detail.org.plan} />
                                        {detail.org.status === "suspended" && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400 border border-red-500/30">SUSPENDED</span>}
                                        {!detail.org.isActive && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">INACTIVE</span>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                                    <span className="text-slate-500">Created:</span><span className="text-white">{new Date(detail.org.createdAt).toLocaleString()}</span>
                                    <span className="text-slate-500">Updated:</span><span className="text-white">{new Date(detail.org.updatedAt).toLocaleString()}</span>
                                    <span className="text-slate-500">Trial Ends:</span><span className="text-white">{detail.org.trialEndsAt ? new Date(detail.org.trialEndsAt).toLocaleDateString() : "—"}</span>
                                    <span className="text-slate-500">Billing Email:</span><span className="text-white truncate">{detail.org.billingEmail ?? "—"}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-3 border-t border-slate-700/40">
                                    {detail.org.status === "suspended" ? (
                                        <button
                                            disabled={!!actionLoading}
                                            onClick={() => void handleSuspend(false)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50 transition"
                                        >{actionLoading === "unsuspend" ? "Unsuspending…" : "Unsuspend Organization"}</button>
                                    ) : (
                                        <button
                                            disabled={!!actionLoading}
                                            onClick={() => void handleSuspend(true)}
                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 disabled:opacity-50 transition"
                                        >{actionLoading === "suspend" ? "Suspending…" : "Suspend Organization"}</button>
                                    )}
                                    {actionMsg && <span className="text-xs text-slate-400 ml-1">{actionMsg}</span>}
                                </div>
                            </div>
                            {detail.subscription && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Subscription</p>
                                    <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-3 space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between"><span className="text-slate-400">Plan:</span><Badge value={detail.subscription.plan} /></div>
                                        <div className="flex items-center justify-between"><span className="text-slate-400">Status:</span><Badge value={detail.subscription.status} /></div>
                                        <div className="flex items-center justify-between"><span className="text-slate-400">Period:</span><span className="text-white">{new Date(detail.subscription.currentPeriodStart).toLocaleDateString()} – {new Date(detail.subscription.currentPeriodEnd).toLocaleDateString()}</span></div>
                                        {Boolean(detail.subscription.cancelAtPeriodEnd) && <p className="text-amber-400 text-xs">⚠ Will cancel at period end</p>}
                                    </div>
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Members ({detail.members.length})</p>
                                <div className="space-y-2">
                                    {detail.members.length === 0 && <p className="text-slate-600 text-xs">No members.</p>}
                                    {detail.members.map((m) => (
                                        <div key={m.userId} className="bg-slate-900/60 border border-slate-800/60 rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{m.username}</p>
                                                <p className="text-slate-500 truncate">{m.email}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Badge value={m.role} />
                                                {m.userStatus === "suspended" && <span className="px-1 py-0.5 rounded text-[9px] bg-red-500/15 text-red-400">Suspended</span>}
                                            </div>
                                            <span className="text-slate-600 text-[10px]">{new Date(m.joinedAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Audit Trail ({detail.auditTrail.length})</p>
                                <div className="space-y-1">
                                    {detail.auditTrail.length === 0 && <p className="text-slate-600 text-xs">No audit events.</p>}
                                    {detail.auditTrail.map((a, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-slate-800/40">
                                            <Badge value={a.outcome} /><span className="text-slate-300 flex-1 truncate">{a.action}</span><span className="text-slate-600 flex-shrink-0">{new Date(a.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function OwnerAccessLinkPanel() {
    const [expiresInMinutes, setExpiresInMinutes] = useState(30);
    const [oneTime, setOneTime] = useState(true);
    const [redirectTarget, setRedirectTarget] = useState("/yalla-hack-owners-console/login");
    const [generatedUrl, setGeneratedUrl] = useState("");
    const [expiresAtIso, setExpiresAtIso] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const generateLink = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const result = await apiFetch<OwnerAccessLinkResponse>("/access-links/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    expiresInMinutes,
                    oneTime,
                    redirect: redirectTarget,
                }),
            });
            setGeneratedUrl(result.url);
            setExpiresAtIso(result.expiresAtIso);
            setMessage("Signed owner access link generated.");
        } catch (e: unknown) {
            setMessage(e instanceof Error ? e.message : "Failed to generate link");
        } finally {
            setLoading(false);
        }
    };

    const copyLink = async () => {
        if (!generatedUrl) return;
        try {
            await navigator.clipboard.writeText(generatedUrl);
            setMessage("Link copied to clipboard.");
        } catch {
            setMessage("Copy failed. Please copy the link manually.");
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-white">Generate Owner Access Link</h3>
                <p className="text-xs text-slate-500 mt-1">Create expiring signed links for isolated owner-console entry.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-3">
                <label className="text-xs text-slate-400 space-y-1">
                    <span>Expires in minutes</span>
                    <input
                        type="number"
                        min={1}
                        max={1440}
                        value={expiresInMinutes}
                        onChange={(e) => setExpiresInMinutes(Math.max(1, Math.min(1440, Number(e.target.value) || 1)))}
                        className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                </label>
                <label className="text-xs text-slate-400 space-y-1 lg:col-span-2">
                    <span>Redirect path after gate</span>
                    <input
                        type="text"
                        value={redirectTarget}
                        onChange={(e) => setRedirectTarget(e.target.value)}
                        className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                </label>
            </div>

            <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-400">
                    <input
                        type="checkbox"
                        checked={oneTime}
                        onChange={(e) => setOneTime(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-900"
                    />
                    One-time link
                </label>
                <button
                    onClick={() => void generateLink()}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 disabled:opacity-50 transition"
                >
                    {loading ? "Generating..." : "Generate Link"}
                </button>
                {message && <span className="text-xs text-slate-400">{message}</span>}
            </div>

            {generatedUrl && (
                <div className="space-y-2">
                    <label className="block text-xs text-slate-500">Generated URL</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={generatedUrl}
                            className="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-cyan-300"
                        />
                        <button
                            onClick={() => void copyLink()}
                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
                        >
                            Copy
                        </button>
                    </div>
                    {expiresAtIso && <p className="text-xs text-slate-500">Expires: {new Date(expiresAtIso).toLocaleString()}</p>}
                </div>
            )}
        </div>
    );
}

function OverviewTab({ stats, intake, validationCount }: { stats: OverviewStats | null; intake: IntakeData | null; validationCount: number }) {
    if (!stats) return <div className="text-slate-500 text-sm p-8 text-center">Loading overview...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={stats.totalUsers} />
                <StatCard label="Signups Today" value={stats.todaySignups ?? 0} sub="new registrations" />
                <StatCard label="Active Sessions" value={stats.activeSessions} />
                <StatCard label="Logins Today" value={stats.todayLogins} />
                <StatCard label="Organizations" value={stats.totalOrgs} />
                <StatCard label="New Orgs Today" value={stats.newOrgsToday ?? 0} />
                <StatCard label="Paid Plans" value={stats.paidOrgs ?? 0} sub="non-free orgs" />
                <StatCard label="Assets Tracked" value={stats.totalAssets} />
                <StatCard label="Open Requests" value={stats.openServiceRequests} sub="service requests" />
                <StatCard label="Inbound Intake" value={(intake?.counts.accessRequests ?? 0) + (intake?.counts.consultationRequests ?? 0)} sub="access + consultations" />
                <StatCard label="Blocked Events" value={validationCount} sub="validation failures" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Owner focus for this console</h3>
                    <div className="space-y-2 text-sm text-slate-400">
                        <p>Monitor platform-wide user activity and what inputs are being submitted.</p>
                        <p>Review validation failures and blocked requests without digging through server logs.</p>
                        <p>Track inbound requests across public portal and authenticated service-request flows.</p>
                        <p>Follow onboarding progression to spot support or activation bottlenecks.</p>
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Current intake snapshot</h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="rounded-lg bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{intake?.counts.serviceRequests ?? 0}</div><div className="text-xs text-slate-500 mt-1">Service requests</div></div>
                        <div className="rounded-lg bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{intake?.counts.accessRequests ?? 0}</div><div className="text-xs text-slate-500 mt-1">Access requests</div></div>
                        <div className="rounded-lg bg-slate-900/60 p-4"><div className="text-2xl font-bold text-white">{intake?.counts.consultationRequests ?? 0}</div><div className="text-xs text-slate-500 mt-1">Consultations</div></div>
                    </div>
                </div>
            </div>
            <OwnerAccessLinkPanel />
        </div>
    );
}

function UsersTab({ users, onSelect }: { users: UserRow[]; onSelect: (id: number) => void }) {
    const [filter, setFilter] = useState("");
    const filtered = users.filter((u) => !filter || u.username.toLowerCase().includes(filter.toLowerCase()) || u.email.toLowerCase().includes(filter.toLowerCase()) || u.role.includes(filter));
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Filter by username, email, or role..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-xs text-slate-500">{filtered.length} users</span>
                <button
                    onClick={() => {
                        fetch("/api/yalla-admin/export/csv?type=users", { credentials: "include" })
                            .then(async (r) => {
                                const blob = await r.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                            })
                            .catch(() => {/* silently ignore */ });
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                >
                    Export CSV
                </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-700/40">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700/40">
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Login</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Sessions</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Flags</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {filtered.map((u) => (
                            <tr key={u.id} onClick={() => onSelect(Number(u.id))} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                                <td className="px-4 py-3"><div className="font-medium text-white">{u.username}</div><div className="text-slate-500 text-xs">{u.email}</div></td>
                                <td className="px-4 py-3"><Badge value={u.role} /></td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</td>
                                <td className="px-4 py-3 text-sm font-medium text-white">{u.activeSessions}</td>
                                <td className="px-4 py-3 flex gap-1.5">
                                    {u.status === "suspended" && <span className="px-1.5 py-0.5 text-xs rounded bg-red-500/15 text-red-400 border border-red-500/20">Suspended</span>}
                                    {Boolean(u.isMfaEnabled) && <span className="px-1.5 py-0.5 text-xs rounded bg-green-500/15 text-green-400 border border-green-500/20">MFA</span>}
                                    {Boolean(u.isEmailVerified) && <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">Verified</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function IntakeTab({ intake }: { intake: IntakeData | null }) {
    if (!intake) return <div className="text-slate-500 text-sm p-8 text-center">Loading intake data...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Service Requests" value={intake.counts.serviceRequests} />
                <StatCard label="Access Requests" value={intake.counts.accessRequests} />
                <StatCard label="Consultations" value={intake.counts.consultationRequests} />
            </div>
            <div className="grid xl:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-white">Service requests</h3>
                    {intake.serviceRequests.length === 0 ? <p className="text-slate-600 text-sm">No service requests yet.</p> : intake.serviceRequests.map((row) => (
                        <div key={row.id} className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-white">{row.title}</p>
                                    <p className="text-xs text-slate-500 mt-1">{row.organizationName ?? "Unknown org"} · {row.requestedByUsername ?? row.requestedByEmail ?? "Unknown user"}</p>
                                </div>
                                <Badge value={row.status} />
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><span>{row.serviceType}</span><span>•</span><span>{row.priority}</span></div>
                        </div>
                    ))}
                </div>
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-white">Access requests</h3>
                    {intake.accessRequests.length === 0 ? <p className="text-slate-600 text-sm">No access requests yet.</p> : intake.accessRequests.map((row) => (
                        <div key={row.id} className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-white">{row.fullName}</p>
                                    <p className="text-xs text-slate-500 mt-1">{row.organizationName} · {row.email}</p>
                                </div>
                                <Badge value={row.status} />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">Locale: {row.preferredLocale ?? "-"}</p>
                        </div>
                    ))}
                </div>
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-white">Consultation requests</h3>
                    {intake.consultationRequests.length === 0 ? <p className="text-slate-600 text-sm">No consultation requests yet.</p> : intake.consultationRequests.map((row) => (
                        <div key={row.id} className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-white">{row.topic}</p>
                                    <p className="text-xs text-slate-500 mt-1">{row.contactName} · {row.organizationName}</p>
                                </div>
                                <Badge value={row.status} />
                            </div>
                            <p className="text-xs text-slate-400 mt-2">{row.contactEmail}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function OnboardingTab({ onboarding }: { onboarding: OnboardingData | null }) {
    if (!onboarding) return <div className="text-slate-500 text-sm p-8 text-center">Loading onboarding data...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {onboarding.counts.map((row) => <StatCard key={row.stage} label={row.stage.replace(/_/g, " ")} value={row.total} />)}
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-700/40">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700/40">
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Stage</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Intent</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Locale</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {onboarding.recent.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3"><div className="font-medium text-white">{row.userLabel}</div><div className="text-slate-500 text-xs">{row.userEmail}</div></td>
                                <td className="px-4 py-3"><Badge value={row.stage} /></td>
                                <td className="px-4 py-3 text-slate-300 text-xs">{row.accountIntent ?? "-"}</td>
                                <td className="px-4 py-3 text-slate-300 text-xs">{row.selectedLocale}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(row.updatedAt).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function InteractionsTab({ rows }: { rows: InteractionRow[] }) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-400">{rows.length} recent interaction records with sanitized user input snapshots.</p>
            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={row.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-3">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-white font-medium">{row.context}</span>
                                    <span className="text-slate-500">/</span>
                                    <span className="text-cyan-400 text-sm">{row.action}</span>
                                    {row.entityType && <span className="text-slate-500 text-xs">{row.entityType}{row.entityId ? `#${row.entityId}` : ""}</span>}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{row.actorName} · {row.actorEmail || "no email"} · {row.organizationName ?? "No org"}</p>
                            </div>
                            <div className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}{row.durationMs ? ` · ${row.durationMs}ms` : ""}</div>
                        </div>
                        <div className="grid lg:grid-cols-2 gap-3">
                            <JsonPreview value={row.inputSnapshot} title="Input Snapshot" />
                            <JsonPreview value={row.outputRef} title="Output Reference" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PlatformAuditTab({ logs }: { logs: PlatformAuditRow[] }) {
    return (
        <div className="space-y-3">
            {logs.map((log) => (
                <div key={log.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-medium">{log.action}</span>
                                <Badge value={log.outcome} />
                                <span className="text-xs text-slate-500">{log.category}</span>
                                {log.actorRole && <Badge value={log.actorRole} />}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{log.targetEntity ?? log.entityType ?? "platform"}</p>
                        </div>
                        <div className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</div>
                    </div>
                    <JsonPreview value={log.payload} title="Payload" />
                </div>
            ))}
        </div>
    );
}

function ValidationTab({ rows }: { rows: ValidationRow[] }) {
    return (
        <div className="space-y-3">
            <p className="text-sm text-slate-400">Recent blocked requests, validation failures, and request errors recorded at the platform boundary.</p>
            {rows.map((row) => (
                <div key={row.id} className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-medium">{row.action}</span>
                                <Badge value={row.outcome} />
                                {row.actorRole && <Badge value={row.actorRole} />}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{row.targetEntity ?? row.entityType ?? "unknown target"}</p>
                        </div>
                        <div className="text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</div>
                    </div>
                    <JsonPreview value={row.payload} title="Failure Detail" />
                </div>
            ))}
        </div>
    );
}

function SubscriptionsTab({ data }: { data: SubscriptionsData | null }) {
    if (!data) return <div className="text-slate-500 text-sm p-8 text-center">Loading subscription data...</div>;

    const PLAN_COLORS: Record<string, string> = {
        free_trial: "bg-slate-600/40 text-slate-300 border-slate-600/40",
        starter: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        professional: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        enterprise: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    const STATUS_COLORS: Record<string, string> = {
        active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        trialing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        past_due: "bg-red-500/20 text-red-400 border-red-500/30",
        canceled: "bg-slate-600/40 text-slate-400 border-slate-600/40",
        paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
        incomplete: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    };
    const BILLING_COLORS: Record<string, string> = {
        success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        failed: "bg-red-500/20 text-red-400 border-red-500/30",
        pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        refunded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };

    const totalMrr = data.summary
        .filter((s) => s.status === "active" || s.status === "trialing")
        .reduce((acc, s) => acc + (s.totalAmountCents ?? 0), 0);
    const activeCount = data.subscriptions.filter((s) => s.status === "active").length;
    const trialingCount = data.subscriptions.filter((s) => s.status === "trialing").length;
    const canceledCount = data.subscriptions.filter((s) => s.status === "canceled").length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-end">
                <button
                    onClick={() => {
                        fetch("/api/yalla-admin/export/csv?type=subscriptions", { credentials: "include" })
                            .then(async (r) => {
                                const blob = await r.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `subscriptions-${new Date().toISOString().slice(0, 10)}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                            })
                            .catch(() => {/* silently ignore */ });
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                >
                    Export CSV
                </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Revenue Pool" value={`$${(totalMrr / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} sub="active + trialing" />
                <StatCard label="Active" value={activeCount} sub="live paying subscriptions" />
                <StatCard label="Trialing" value={trialingCount} sub="free trial accounts" />
                <StatCard label="Canceled" value={canceledCount} sub="churn" />
            </div>

            {data.summary.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Plan × Status Breakdown</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-700/40">
                                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                                    <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Count</th>
                                    <th className="text-right px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Total Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {data.summary.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-3 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${PLAN_COLORS[row.plan] ?? "bg-slate-700/50 text-slate-300 border-slate-600/40"}`}>{row.plan}</span></td>
                                        <td className="px-3 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[row.status] ?? "bg-slate-700/50 text-slate-300 border-slate-600/40"}`}>{row.status}</span></td>
                                        <td className="px-3 py-2 text-right text-white font-semibold tabular-nums">{row.count}</td>
                                        <td className="px-3 py-2 text-right text-white font-semibold tabular-nums">${((row.totalAmountCents ?? 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} {row.currency}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">All Subscriptions ({data.subscriptions.length})</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-700/40">
                                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Organization</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Interval</th>
                                <th className="text-right px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Period End</th>
                                <th className="text-left px-3 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {data.subscriptions.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-3 py-2">
                                        <div className="font-medium text-white">{s.organizationName}</div>
                                        <div className="text-slate-500 text-xs">{s.billingEmail}</div>
                                    </td>
                                    <td className="px-3 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${PLAN_COLORS[s.plan] ?? "bg-slate-700/50 text-slate-300 border-slate-600/40"}`}>{s.plan}</span></td>
                                    <td className="px-3 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[s.status] ?? "bg-slate-700/50 text-slate-300 border-slate-600/40"}`}>{s.status}{s.cancelAtPeriodEnd ? " (cancel @ end)" : ""}</span></td>
                                    <td className="px-3 py-2 text-slate-300 text-xs">{s.billingInterval}</td>
                                    <td className="px-3 py-2 text-right text-white font-semibold tabular-nums">${(s.amountCents / 100).toFixed(2)} {s.currency}</td>
                                    <td className="px-3 py-2 text-slate-400 text-xs">{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}</td>
                                    <td className="px-3 py-2 text-slate-400 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {data.billingEvents.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Recent Billing Events ({data.billingEvents.length})</h3>
                    <div className="space-y-1">
                        {data.billingEvents.slice(0, 50).map((ev) => (
                            <div key={ev.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-slate-800/40">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium border ${BILLING_COLORS[ev.status] ?? "bg-slate-700/50 text-slate-300 border-slate-600/40"}`}>{ev.status}</span>
                                <span className="text-slate-300 flex-1 truncate">{ev.eventType}</span>
                                <span className="text-slate-500 flex-shrink-0">{ev.organizationName}</span>
                                {ev.amountCents != null && <span className="text-white font-semibold tabular-nums flex-shrink-0">${(ev.amountCents / 100).toFixed(2)} {ev.currency}</span>}
                                <span className="text-slate-600 flex-shrink-0">{new Date(ev.createdAt).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function SystemTab({ system }: { system: SystemInfo | null }) {
    if (!system) return <div className="text-slate-500 text-sm p-8 text-center">Loading system info...</div>;
    const heapPct = Math.round((system.memory.heapUsed / system.memory.heapTotal) * 100);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5"><p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Process</p><p className="text-2xl font-bold text-white mb-1">{system.uptimeFormatted}</p><p className="text-xs text-slate-500">Uptime</p></div>
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5"><p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Database</p><Badge value={system.db.status} /><p className="text-xs text-slate-500 mt-2">{system.db.version} · {system.db.tableCount} tables</p></div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Memory Usage</p>
                <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Heap {system.memory.heapUsed} MB / {system.memory.heapTotal} MB</span><span>{heapPct}%</span></div>
                    <div className="w-full bg-slate-700/50 rounded-full h-1.5"><div className={`h-1.5 rounded-full transition-all ${heapPct > 80 ? "bg-red-500" : heapPct > 60 ? "bg-yellow-500" : "bg-cyan-500"}`} style={{ width: `${heapPct}%` }} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-xs text-slate-400"><span>RSS: {system.memory.rss} MB</span><span>External: {system.memory.external} MB</span><span>SSE clients: {system.sseClients}</span></div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Environment</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-slate-400">Node Env:</span><span className="text-white font-medium">{system.env.nodeEnv}</span>
                    <span className="text-slate-400">AI Queue:</span><span className="text-white font-medium">{system.env.aiQueueMode}</span>
                    <span className="text-slate-400">Redis:</span><span className={system.env.redisConfigured ? "text-emerald-400" : "text-red-400"}>{system.env.redisConfigured ? "Configured" : "Not configured"}</span>
                    <span className="text-slate-400">DB Pool:</span><span className="text-white font-medium">{system.env.databasePoolSize} connections</span>
                </div>
            </div>
        </div>
    );
}

function SignupsTab({ rows, onSelect }: { rows: SignupRow[]; onSelect: (id: number) => void }) {
    const [filter, setFilter] = useState("");
    const filtered = rows.filter((r) => !filter || r.email.includes(filter) || r.username.includes(filter));
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Filter by email or username..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-xs text-slate-500">{filtered.length} users</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-700/40">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700/40">
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Organization</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Registered</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Last Login</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Flags</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {filtered.map((u) => (
                            <tr key={u.id} onClick={() => onSelect(u.id)} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                                <td className="px-4 py-3"><div className="font-medium text-white">{u.username}</div><div className="text-slate-500 text-xs">{u.email}</div></td>
                                <td className="px-4 py-3"><Badge value={u.role} /></td>
                                <td className="px-4 py-3 text-slate-300 text-xs">{u.organizationName ?? <span className="text-slate-600">—</span>}</td>
                                <td className="px-4 py-3">{u.organizationPlan ? <Badge value={u.organizationPlan} /> : <span className="text-slate-600 text-xs">—</span>}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleString()}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</td>
                                <td className="px-4 py-3 flex gap-1.5 flex-wrap">
                                    {Boolean(u.isMfaEnabled) && <span className="px-1.5 py-0.5 text-xs rounded bg-green-500/15 text-green-400 border border-green-500/20">MFA</span>}
                                    {Boolean(u.isEmailVerified) && <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">Verified</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function OrgsTab({ rows, onSelect }: { rows: OrgRow[]; onSelect: (id: number) => void }) {
    const [filter, setFilter] = useState("");
    const filtered = rows.filter((r) => !filter || r.name.toLowerCase().includes(filter.toLowerCase()) || r.plan.includes(filter));
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Filter by name or plan..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <span className="text-xs text-slate-500">{filtered.length} orgs</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-700/40">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-700/40">
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Organization</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Members</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Active Sessions</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Trial Ends</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Created</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {filtered.map((o) => (
                            <tr key={o.id} onClick={() => onSelect(o.id)} className="hover:bg-slate-800/30 transition-colors cursor-pointer">
                                <td className="px-4 py-3"><div className="font-medium text-white">{o.name}</div><div className="text-slate-500 text-xs">#{o.id}</div></td>
                                <td className="px-4 py-3"><Badge value={o.plan} /></td>
                                <td className="px-4 py-3 text-white font-medium">{o.memberCount}</td>
                                <td className="px-4 py-3 text-white font-medium">{o.activeSessions}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{o.trialEndsAt ? new Date(o.trialEndsAt).toLocaleDateString() : "—"}</td>
                                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-3"><Badge value={o.isActive ? "active" : "inactive"} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AdminAuditTab({ logs }: { logs: AdminAuditRow[] }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-end">
                <button
                    onClick={() => {
                        fetch("/api/yalla-admin/export/csv?type=audit", { credentials: "include" })
                            .then(async (r) => {
                                const blob = await r.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
                                a.click();
                                URL.revokeObjectURL(url);
                            })
                            .catch(() => {/* silently ignore */ });
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                >
                    Export CSV
                </button>
            </div>
            <div className="space-y-3">
                {logs.map((log) => (
                    <div key={log.id} className="bg-slate-800/50 border border-slate-700/40 rounded-lg px-4 py-3 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-cyan-500/60" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap"><span className="text-white text-sm font-medium">{log.action}</span>{log.target && <span className="text-slate-500 text-xs">→ {log.target}</span>}</div>
                            <p className="text-xs text-slate-500 mt-0.5">{log.adminUsername} · {log.ipAddress} · {new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function RealtimeBar({ realtime, sseConnected }: { realtime: RealtimeStats | null; sseConnected: boolean }) {
    if (!realtime) return null;
    return (
        <div className="mb-5 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs overflow-x-auto">
            <span className={`flex items-center gap-1.5 flex-shrink-0 font-medium ${sseConnected ? "text-emerald-400" : "text-amber-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sseConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {sseConnected ? "Live" : "Reconnecting"}
            </span>
            <span className="text-slate-700 flex-shrink-0">|</span>
            <span className="flex-shrink-0 text-slate-400"><span className="text-white font-semibold tabular-nums">{realtime.activeSessions}</span> sessions</span>
            <span className="flex-shrink-0 text-slate-400"><span className="text-white font-semibold tabular-nums">{realtime.recentActions}</span> actions /5min</span>
            <span className="flex-shrink-0 text-slate-400"><span className="text-white font-semibold tabular-nums">{realtime.newUsersLastHour}</span> new users /hr</span>
            <span className="flex-shrink-0 text-slate-400"><span className="text-white font-semibold tabular-nums">{realtime.sseClients}</span> SSE</span>
            <span className={`flex-shrink-0 ml-auto px-2 py-0.5 rounded text-[10px] font-medium border ${realtime.dbStatus === "healthy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>DB {realtime.dbStatus}</span>
            <span className="flex-shrink-0 text-slate-700">{new Date(realtime.ts).toLocaleTimeString()}</span>
        </div>
    );
}

function RealtimeTab({
    realtime,
    system,
    sseConnected,
    liveEvents,
    onRefresh,
}: {
    realtime: RealtimeStats | null;
    system: SystemInfo | null;
    sseConnected: boolean;
    liveEvents: LiveEvent[];
    onRefresh: () => void;
}) {
    const eventColors: Record<string, string> = {
        interaction_logged: "text-cyan-400",
        platform_event: "text-purple-400",
        intake_created: "text-orange-400",
        validation_event: "text-red-400",
        admin_login: "text-emerald-400",
        owner_gate_accepted: "text-yellow-400",
        user_registered: "text-emerald-300",
        user_login: "text-sky-400",
        user_profile_updated: "text-indigo-400",
        user_password_changed: "text-amber-400",
        user_status_changed: "text-orange-500",
        user_sessions_revoked: "text-red-500",
        org_status_changed: "text-pink-500",
        owner_link_generated: "text-lime-400",
    };
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 text-center">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Active Sessions</p>
                    <p className="text-4xl font-bold text-white tabular-nums">{realtime?.activeSessions ?? "\u2014"}</p>
                    <p className="text-xs text-slate-600 mt-1">users online now</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 text-center">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Recent Actions</p>
                    <p className="text-4xl font-bold text-cyan-400 tabular-nums">{realtime?.recentActions ?? "\u2014"}</p>
                    <p className="text-xs text-slate-600 mt-1">last 5 minutes</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 text-center">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">New Users</p>
                    <p className="text-4xl font-bold text-emerald-400 tabular-nums">{realtime?.newUsersLastHour ?? "\u2014"}</p>
                    <p className="text-xs text-slate-600 mt-1">last hour</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 text-center">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">SSE Clients</p>
                    <p className="text-4xl font-bold text-purple-400 tabular-nums">{realtime?.sseClients ?? "\u2014"}</p>
                    <p className="text-xs text-slate-600 mt-1">open streams</p>
                </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-white">Infrastructure Status</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">SSE stream</span>
                            <span className={`flex items-center gap-1.5 font-medium ${sseConnected ? "text-emerald-400" : "text-amber-400"}`}>
                                <span className={`w-2 h-2 rounded-full ${sseConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                                {sseConnected ? "Connected" : "Reconnecting"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Database</span>
                            <span className={`font-medium ${realtime?.dbStatus === "healthy" ? "text-emerald-400" : "text-red-400"}`}>{realtime?.dbStatus ?? "unknown"}</span>
                        </div>
                        {system && (<>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Server uptime</span>
                                <span className="text-white font-medium">{system.uptimeFormatted}</span>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                    <span className="text-slate-400">Heap usage</span>
                                    <span className="text-white font-medium text-xs">{system.memory.heapUsed} / {system.memory.heapTotal} MB ({Math.round(system.memory.heapUsed / system.memory.heapTotal * 100)}%)</span>
                                </div>
                                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${Math.round(system.memory.heapUsed / system.memory.heapTotal * 100) > 80 ? "bg-red-500" : Math.round(system.memory.heapUsed / system.memory.heapTotal * 100) > 60 ? "bg-yellow-500" : "bg-cyan-500"}`}
                                        style={{ width: `${Math.round(system.memory.heapUsed / system.memory.heapTotal * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Redis</span>
                                <span className={system.env.redisConfigured ? "text-emerald-400 font-medium" : "text-red-400 font-medium"}>{system.env.redisConfigured ? "Configured" : "Not configured"}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">DB pool</span>
                                <span className="text-white font-medium">{system.env.databasePoolSize} connections</span>
                            </div>
                        </>)}
                    </div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white">Live Event Stream</h3>
                        <span className="text-xs text-slate-600">{liveEvents.length} captured</span>
                    </div>
                    <div className="flex-1 space-y-0 overflow-y-auto max-h-72 pr-1">
                        {liveEvents.length === 0
                            ? <p className="text-xs text-slate-600 py-6 text-center">Waiting for platform activity…</p>
                            : liveEvents.map((ev) => (
                                <div key={ev.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-slate-800/40">
                                    <span className={`flex-shrink-0 mt-0.5 ${eventColors[ev.event] ?? "text-slate-500"}`}>&#9679;</span>
                                    <span className="flex-1 min-w-0 text-slate-300 truncate">{ev.event.replace(/_/g, " ")}</span>
                                    <span className="text-slate-600 flex-shrink-0">{new Date(ev.ts).toLocaleTimeString()}</span>
                                </div>
                            ))
                        }
                    </div>
                    <button
                        onClick={onRefresh}
                        className="mt-3 flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-xs text-slate-500 border border-slate-800/60 hover:border-cyan-500/30 hover:text-cyan-400 transition"
                    >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        Refresh data
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function YallaAdminPortal() {
    const [, navigate] = useLocation();
    const loginPath = "/yalla-hack-owners-console/login";
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [system, setSystem] = useState<SystemInfo | null>(null);
    const [adminAudit, setAdminAudit] = useState<AdminAuditRow[]>([]);
    const [platformAudit, setPlatformAudit] = useState<PlatformAuditRow[]>([]);
    const [interactions, setInteractions] = useState<InteractionRow[]>([]);
    const [intake, setIntake] = useState<IntakeData | null>(null);
    const [onboarding, setOnboarding] = useState<OnboardingData | null>(null);
    const [validations, setValidations] = useState<ValidationRow[]>([]);
    const [signups, setSignups] = useState<SignupRow[]>([]);
    const [orgs, setOrgs] = useState<OrgRow[]>([]);
    const [subscriptionsData, setSubscriptionsData] = useState<SubscriptionsData | null>(null);
    const [realtime, setRealtime] = useState<RealtimeStats | null>(null);
    const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
    const [sseConnected, setSseConnected] = useState(false);
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [adminUsername, setAdminUsername] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const sseRef = useRef<EventSource | null>(null);
    const sseRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const connectSSERef = useRef<(() => void) | null>(null);

    useEffect(() => {
        fetch("/api/yalla-admin/me", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
                if (!d.authenticated) navigate(loginPath);
                else {
                    setAuthenticated(true);
                    setAdminUsername(d.username as string);
                }
            })
            .catch(() => navigate(loginPath));
    }, [loginPath, navigate]);

    const loadAllData = useCallback(async () => {
        try {
            const results = await Promise.allSettled([
                apiFetch<OverviewStats>("/stats/overview"),
                apiFetch<UserRow[]>("/stats/users?limit=100"),
                apiFetch<SystemInfo>("/stats/system"),
                apiFetch<AdminAuditRow[]>("/stats/audit?limit=50"),
                apiFetch<PlatformAuditRow[]>("/stats/platform-audit?limit=50"),
                apiFetch<InteractionRow[]>("/stats/interactions?limit=50"),
                apiFetch<IntakeData>("/stats/intake?limit=20"),
                apiFetch<OnboardingData>("/stats/onboarding?limit=50"),
                apiFetch<ValidationRow[]>("/stats/validations?limit=50"),
                apiFetch<SignupRow[]>("/stats/signups?limit=100"),
                apiFetch<OrgRow[]>("/stats/orgs?limit=200"),
                apiFetch<RealtimeStats>("/stats/realtime"),
                apiFetch<SubscriptionsData>("/stats/subscriptions?limit=200"),
            ]);
            const [ov, userRows, sys, adminAuditRows, platformAuditRows, interactionRows, intakeRows, onboardingRows, validationRows, signupRows, orgRows, rt, subsData] = results;
            const failedCount = results.filter((r) => r.status === "rejected").length;
            if (failedCount > 0) {
                setLoadError(`${failedCount} metric source${failedCount > 1 ? "s" : ""} unavailable`);
            } else {
                setLoadError(null);
            }
            if (ov.status === "fulfilled") setOverview(ov.value);
            if (userRows.status === "fulfilled") setUsers(userRows.value);
            if (sys.status === "fulfilled") setSystem(sys.value);
            if (adminAuditRows.status === "fulfilled") setAdminAudit(adminAuditRows.value);
            if (platformAuditRows.status === "fulfilled") setPlatformAudit(platformAuditRows.value);
            if (interactionRows.status === "fulfilled") setInteractions(interactionRows.value);
            if (intakeRows.status === "fulfilled") setIntake(intakeRows.value);
            if (onboardingRows.status === "fulfilled") setOnboarding(onboardingRows.value);
            if (validationRows.status === "fulfilled") setValidations(validationRows.value);
            if (signupRows.status === "fulfilled") setSignups(signupRows.value);
            if (orgRows.status === "fulfilled") setOrgs(orgRows.value);
            if (rt.status === "fulfilled") setRealtime(rt.value);
            if (subsData.status === "fulfilled") setSubscriptionsData(subsData.value);
        } catch {
            setLoadError("Failed to reach the API");
        }
    }, []);

    const connectSSE = useCallback(() => {
        if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
        const es = new EventSource("/api/yalla-admin/stream", { withCredentials: true });
        sseRef.current = es;
        es.onopen = () => setSseConnected(true);
        es.onerror = () => {
            setSseConnected(false);
            es.close();
            sseRef.current = null;
            if (sseRetryRef.current) clearTimeout(sseRetryRef.current);
            sseRetryRef.current = setTimeout(() => { connectSSERef.current?.(); }, 5000);
        };
        const pushEvent = (eventName: string) => (e: MessageEvent) => {
            try {
                const parsed = JSON.parse(e.data as string) as unknown;
                setLiveEvents((prev) => [
                    { id: crypto.randomUUID(), event: eventName, data: parsed, ts: new Date().toISOString() },
                    ...prev.slice(0, 99),
                ]);
            } catch { /* ignore malformed SSE data */ }
            void loadAllData();
        };
        for (const ev of ["admin_login", "intake_created", "validation_event", "interaction_logged", "platform_event", "owner_gate_accepted", "user_registered", "user_login", "user_profile_updated", "user_password_changed", "user_status_changed", "user_sessions_revoked", "org_status_changed", "owner_link_generated"]) {
            es.addEventListener(ev, pushEvent(ev));
        }
    }, [loadAllData]);

    connectSSERef.current = connectSSE;

    useEffect(() => {
        if (!authenticated) return;
        connectSSE();
        return () => {
            sseRef.current?.close();
            if (sseRetryRef.current) clearTimeout(sseRetryRef.current);
        };
    }, [authenticated, connectSSE]);

    useEffect(() => {
        if (!authenticated) return;
        void loadAllData();
        const interval = setInterval(() => void loadAllData(), 30_000);
        return () => clearInterval(interval);
    }, [authenticated, loadAllData]);

    async function handleLogout() {
        await fetch("/api/yalla-admin/logout", { method: "POST", credentials: "include" });
        navigate(loginPath);
    }

    if (authenticated === null) {
        return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center"><div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;
    }

    const tabs: { id: Tab; label: string; group?: string }[] = [
        { id: "overview", label: "Overview" },
        { id: "signups", label: "Signups", group: "Users" },
        { id: "users", label: "Active Users", group: "Users" },
        { id: "orgs", label: "Organizations", group: "Users" },
        { id: "subscriptions", label: "Subscriptions", group: "Billing" },
        { id: "intake", label: "Intake", group: "Activity" },
        { id: "onboarding", label: "Onboarding", group: "Activity" },
        { id: "interactions", label: "Interactions", group: "Activity" },
        { id: "platformAudit", label: "Platform Audit", group: "Logs" },
        { id: "validation", label: "Validations", group: "Logs" },
        { id: "system", label: "System", group: "Logs" },
        { id: "audit", label: "Admin Audit", group: "Logs" },
        { id: "realtime", label: "Live Monitor", group: "Logs" },
    ];

    return (
        <div className="min-h-screen bg-[#0a0f1e] text-white">
            {selectedUserId !== null && <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
            {selectedOrgId !== null && <OrganizationDetailModal orgId={selectedOrgId} onClose={() => setSelectedOrgId(null)} />}
            <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div className="relative flex h-screen overflow-hidden">
                <aside className="w-64 flex-shrink-0 border-r border-slate-800/60 flex flex-col">
                    <div className="px-5 py-5 border-b border-slate-800/60">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">Yalla-Admin</p>
                                <p className="text-slate-600 text-xs">Owner Operations Console</p>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${sseConnected ? "bg-emerald-400" : "bg-red-500"}`} title={sseConnected ? "Live stream connected" : "Reconnecting..."} />
                                {realtime && <Badge value={realtime.dbStatus} />}
                            </div>
                        </div>
                    </div>
                    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                        {tabs.map((tab, i) => {
                            const prevGroup = tabs[i - 1]?.group;
                            const showGroupLabel = tab.group && tab.group !== prevGroup;
                            return (
                                <div key={tab.id}>
                                    {showGroupLabel && <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-wider">{tab.group}</p>}
                                    <button onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === tab.id ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>{tab.label}</button>
                                </div>
                            );
                        })}
                    </nav>
                    <div className="border-t border-slate-800/60 p-3">
                        <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Live Feed</p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {liveEvents.length === 0
                                ? <p className="text-xs text-slate-700">Waiting for events...</p>
                                : liveEvents.slice(0, 8).map((ev) => {
                                    const dot: Record<string, string> = {
                                        interaction_logged: "text-cyan-500",
                                        platform_event: "text-purple-400",
                                        intake_created: "text-orange-400",
                                        validation_event: "text-red-400",
                                        admin_login: "text-emerald-400",
                                        owner_gate_accepted: "text-yellow-400",
                                        user_registered: "text-emerald-300",
                                        user_login: "text-sky-400",
                                        user_profile_updated: "text-indigo-400",
                                        user_password_changed: "text-amber-400",
                                        user_status_changed: "text-orange-500",
                                        user_sessions_revoked: "text-red-500",
                                        org_status_changed: "text-pink-500",
                                        owner_link_generated: "text-lime-400",
                                    };
                                    const color = dot[ev.event] ?? "text-slate-500";
                                    const label = ev.event.replace(/_/g, " ");
                                    return <div key={ev.id} className="text-xs text-slate-400 truncate"><span className={color}>●</span> {label}</div>;
                                })}
                        </div>
                    </div>
                    <div className="border-t border-slate-800/60 px-4 py-3 flex items-center justify-between">
                        <div><p className="text-xs font-medium text-white">{adminUsername}</p><p className="text-xs text-slate-600">owner console</p></div>
                        <button onClick={() => void handleLogout()} className="text-xs text-slate-500 hover:text-red-400 transition" title="Sign out"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3" /></svg></button>
                    </div>
                </aside>
                <main className="flex-1 overflow-y-auto">
                    <div className="p-8 max-w-7xl mx-auto">
                        {loadError && (
                            <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                <span>{loadError} — data shown may be stale</span>
                                <button onClick={() => setLoadError(null)} className="ml-auto text-amber-500 hover:text-amber-300 transition">✕</button>
                            </div>
                        )}
                        <div className="mb-6 flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {{
                                        overview: "Overview",
                                        signups: "Signups",
                                        users: "Active Users",
                                        orgs: "Organizations",
                                        subscriptions: "Subscriptions & Billing",
                                        intake: "Intake",
                                        onboarding: "Onboarding",
                                        interactions: "Interactions",
                                        platformAudit: "Platform Audit",
                                        validation: "Validations",
                                        system: "System",
                                        audit: "Admin Audit",
                                        realtime: "Live Monitor",
                                    }[activeTab]}
                                </h2>
                                <p className="text-slate-500 text-sm mt-0.5">
                                    {activeTab === "overview" && "Platform-wide owner visibility across users, requests, validation, and infrastructure."}
                                    {activeTab === "signups" && "Every user registration with role, organization, and email-verification status."}
                                    {activeTab === "users" && "All registered users and their current session posture."}
                                    {activeTab === "orgs" && "All organizations with member count, plan, and active session breakdown."}
                                    {activeTab === "intake" && "Inbound commercial and access requests across public and authenticated surfaces."}
                                    {activeTab === "onboarding" && "Track user progression through onboarding stages and drop-off points."}
                                    {activeTab === "subscriptions" && "Full billing lifecycle: plan breakdown, subscription status, churn, revenue pool, and Stripe webhook event log."}
                                    {activeTab === "interactions" && "Sanitized user input snapshots and output references recorded by the platform."}
                                    {activeTab === "platformAudit" && "Immutable platform audit events across auth, writes, billing, system, and failures."}
                                    {activeTab === "validation" && "Recent blocked or failed requests, including central validation telemetry."}
                                    {activeTab === "system" && "Runtime health, memory profile, and environment-level readiness."}
                                    {activeTab === "audit" && "Actions taken inside the isolated owner portal itself."}
                                    {activeTab === "realtime" && "Live platform metrics: active sessions, recent actions, new users, and the real-time event stream."}
                                </p>
                            </div>
                            <button
                                onClick={() => void loadAllData()}
                                title="Refresh all data"
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 border border-slate-700/50 hover:border-cyan-500/40 hover:text-cyan-400 transition"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                Refresh
                            </button>
                        </div>
                        <RealtimeBar realtime={realtime} sseConnected={sseConnected} />
                        {activeTab === "overview" && <OverviewTab stats={overview} intake={intake} validationCount={validations.length} />}
                        {activeTab === "signups" && <SignupsTab rows={signups} onSelect={setSelectedUserId} />}
                        {activeTab === "users" && <UsersTab users={users} onSelect={setSelectedUserId} />}
                        {activeTab === "orgs" && <OrgsTab rows={orgs} onSelect={setSelectedOrgId} />}
                        {activeTab === "subscriptions" && <SubscriptionsTab data={subscriptionsData} />}
                        {activeTab === "intake" && <IntakeTab intake={intake} />}
                        {activeTab === "onboarding" && <OnboardingTab onboarding={onboarding} />}
                        {activeTab === "interactions" && <InteractionsTab rows={interactions} />}
                        {activeTab === "platformAudit" && <PlatformAuditTab logs={platformAudit} />}
                        {activeTab === "validation" && <ValidationTab rows={validations} />}
                        {activeTab === "system" && <SystemTab system={system} />}
                        {activeTab === "audit" && <AdminAuditTab logs={adminAudit} />}
                        {activeTab === "realtime" && <RealtimeTab realtime={realtime} system={system} sseConnected={sseConnected} liveEvents={liveEvents} onRefresh={() => void loadAllData()} />}
                    </div>
                </main>
            </div>
        </div>
    );
}
