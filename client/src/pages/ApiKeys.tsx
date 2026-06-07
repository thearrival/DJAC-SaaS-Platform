/**
 * API Keys  —  /api-keys  (org admin only)
 *
 * Manage programmatic access tokens for CI/CD pipelines and integrations.
 * Raw key shown ONCE on creation; only prefix stored afterwards.
 */
import { useEffect, useState } from "react";
import type React from "react";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useLocale } from "@/contexts/useLocale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Key,
    Plus,
    Trash2,
    Copy,
    Check,
    AlertTriangle,
    Loader2,
    ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
type Scope =
    | "vendor:read"
    | "vendor:write"
    | "report:read"
    | "report:write"
    | "assessment:read"
    | "assessment:write"
    | "compliance:read"
    | "admin:read";

const ALL_SCOPES: { value: Scope; label: string; desc: string }[] = [
    { value: "vendor:read", label: "vendor:read", desc: "Read vendor profiles and assessments" },
    { value: "vendor:write", label: "vendor:write", desc: "Create and update vendors" },
    { value: "report:read", label: "report:read", desc: "Read compliance reports" },
    { value: "report:write", label: "report:write", desc: "Generate and export reports" },
    { value: "assessment:read", label: "assessment:read", desc: "Read assessment jobs and results" },
    { value: "assessment:write", label: "assessment:write", desc: "Trigger assessments" },
    { value: "compliance:read", label: "compliance:read", desc: "Read frameworks and controls" },
    { value: "admin:read", label: "admin:read", desc: "Read admin/org stats (read-only)" },
];

const EXPIRY_OPTIONS = [
    { label: "30 days", days: 30 },
    { label: "90 days", days: 90 },
    { label: "180 days", days: 180 },
    { label: "1 year", days: 365 },
    { label: "No expiry", days: undefined },
];

function fmtDate(d: Date | string | null | undefined): string {
    if (!d) return "—";
    try {
        return new Date(d).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch {
        return String(d);
    }
}

function isExpired(d: Date | string | null | undefined): boolean {
    if (!d) return false;
    return new Date(d) < new Date();
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    function handleCopy() {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {/* clipboard unavailable — silently ignore */ });
    }
    return (
        <Button variant="ghost" size="sm" onClick={handleCopy} style={{ padding: "2px 8px" }}>
            {copied ? (
                <Check style={{ width: 14, height: 14, color: "var(--djac-green)" }} />
            ) : (
                <Copy style={{ width: 14, height: 14 }} />
            )}
        </Button>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ApiKeys() {
    const { t } = useLocale();
    usePageTitle(t("apiKeys.title", "API Keys"));

    const utils = trpc.useUtils();
    const listQuery = trpc.apiKeys.list.useQuery(undefined, { refetchInterval: 30_000 });

    useEffect(() => {
        if (listQuery.error) toast.error(t("apiKeys.loadError", "Failed to load API keys."));
    }, [listQuery.error]);

    const createMut = trpc.apiKeys.create.useMutation({
        onSuccess: () => {
            void utils.apiKeys.list.invalidate();
        },
        onError: (e) => toast.error(e.message),
    });

    const revokeMut = trpc.apiKeys.revoke.useMutation({
        onSuccess: () => {
            void utils.apiKeys.list.invalidate();
            toast.success(t("apiKeys.revokeSuccess", "API key revoked."));
        },
        onError: (e) => toast.error(e.message),
    });

    // Create dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [keyName, setKeyName] = useState("");
    const [selectedScopes, setSelectedScopes] = useState<Set<Scope>>(
        new Set(["vendor:read", "report:read"]),
    );
    const [expiryDays, setExpiryDays] = useState<number | undefined>(90);

    // Shown-once raw key
    const [newRawKey, setNewRawKey] = useState<{ rawKey: string; name: string } | null>(null);

    // Revoke confirm
    const [revokeId, setRevokeId] = useState<number | null>(null);

    function handleCreate() {
        if (!keyName.trim() || selectedScopes.size === 0) return;
        createMut.mutate(
            {
                name: keyName.trim(),
                scopes: Array.from(selectedScopes),
                expiresInDays: expiryDays,
            },
            {
                onSuccess: (data) => {
                    setNewRawKey({ rawKey: data.rawKey, name: data.name });
                    setCreateOpen(false);
                    setKeyName("");
                    setSelectedScopes(new Set(["vendor:read", "report:read"]));
                    setExpiryDays(90);
                },
            },
        );
    }

    function toggleScope(scope: Scope) {
        setSelectedScopes((prev) => {
            const next = new Set(prev);
            if (next.has(scope)) next.delete(scope);
            else next.add(scope);
            return next;
        });
    }

    const keys = listQuery.data ?? [];

    return (
        <div className="djac-page">
            {/* ── Header ── */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 24,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--djac-fg)" }}>
                        {t("apiKeys.title", "API Keys")}
                    </h1>
                    <p style={{ fontSize: 13, color: "var(--djac-muted)", margin: "4px 0 0" }}>
                        {t(
                            "apiKeys.subtitle",
                            "Create tokens for CI/CD pipelines and external integrations.",
                        )}
                    </p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                    <Plus style={{ width: 14, height: 14 }} />
                    {t("apiKeys.create", "New API Key")}
                </Button>
            </div>

            {/* ── Info banner ── */}
            <Card style={{ marginBottom: 20, borderColor: "var(--djac-accent)" }}>
                <CardContent
                    style={{
                        padding: "12px 16px",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                    }}
                >
                    <ShieldCheck
                        style={{
                            width: 16,
                            height: 16,
                            color: "var(--djac-accent)",
                            marginTop: 2,
                            flexShrink: 0,
                        }}
                    />
                    <span style={{ fontSize: 12, color: "var(--djac-muted)", lineHeight: 1.5 }}>
                        {t(
                            "apiKeys.securityNote",
                            "API keys are shown only once at creation. We store a hash — if you lose a key, revoke it and create a new one. Use keys via the Authorization: Bearer <key> header.",
                        )}
                    </span>
                </CardContent>
            </Card>

            {/* ── Keys Table ── */}
            <Card>
                <CardHeader style={{ padding: "16px 20px 8px" }}>
                    <CardTitle style={{ fontSize: 14, fontWeight: 600, display: "flex", gap: 8, alignItems: "center" }}>
                        <Key style={{ width: 14, height: 14 }} />
                        {t("apiKeys.activeKeys", "Active Keys")}
                        <Badge variant="secondary" style={{ marginLeft: 4 }}>
                            {keys.length}
                        </Badge>
                    </CardTitle>
                    <CardDescription style={{ fontSize: 12 }}>
                        {t("apiKeys.tableDesc", "Manage keys for your organization")}
                    </CardDescription>
                </CardHeader>
                <CardContent style={{ padding: 0 }}>
                    {listQuery.isError ? (
                        <div
                            style={{
                                padding: "40px 20px",
                                textAlign: "center",
                                color: "var(--djac-muted)",
                            }}
                        >
                            <Key
                                style={{
                                    width: 32,
                                    height: 32,
                                    margin: "0 auto 10px",
                                    opacity: 0.4,
                                }}
                            />
                            <p style={{ fontSize: 14, margin: "0 0 8px" }}>
                                {t("apiKeys.loadError", "Failed to load API keys.")}
                            </p>
                            <Button variant="outline" size="sm" onClick={() => { void listQuery.refetch(); }}>
                                {t("common.retry", "Retry")}
                            </Button>
                        </div>
                    ) : listQuery.isLoading ? (
                        <div
                            style={{
                                padding: 32,
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <Loader2
                                className="animate-spin"
                                style={{ width: 20, height: 20, color: "var(--djac-muted)" }}
                            />
                        </div>
                    ) : keys.length === 0 ? (
                        <div
                            style={{
                                padding: "40px 20px",
                                textAlign: "center",
                                color: "var(--djac-muted)",
                            }}
                        >
                            <Key
                                style={{
                                    width: 32,
                                    height: 32,
                                    margin: "0 auto 10px",
                                    opacity: 0.4,
                                }}
                            />
                            <p style={{ fontSize: 14, margin: "0 0 4px" }}>
                                {t("apiKeys.noKeys", "No API keys yet.")}
                            </p>
                            <p style={{ fontSize: 12 }}>
                                {t("apiKeys.noKeysHint", "Create a key to enable CI/CD integrations.")}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead style={{ fontSize: 11, paddingLeft: 20 }}>
                                        {t("apiKeys.colName", "Name")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11 }}>
                                        {t("apiKeys.colPrefix", "Key Prefix")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11 }}>
                                        {t("apiKeys.colScopes", "Scopes")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11 }}>
                                        {t("apiKeys.colExpiry", "Expires")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11 }}>
                                        {t("apiKeys.colLastUsed", "Last Used")}
                                    </TableHead>
                                    <TableHead style={{ fontSize: 11, paddingRight: 20 }} />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {keys.map((k) => {
                                    const expired = isExpired(k.expiresAt);
                                    const scopes: string[] = k.scopes
                                        ? (JSON.parse(k.scopes) as string[])
                                        : [];
                                    return (
                                        <TableRow key={k.id} style={{ opacity: expired ? 0.55 : 1 }}>
                                            <TableCell
                                                style={{
                                                    fontWeight: 500,
                                                    fontSize: 13,
                                                    paddingLeft: 20,
                                                }}
                                            >
                                                {k.name}
                                                {expired && (
                                                    <Badge
                                                        variant="destructive"
                                                        style={{ marginLeft: 8, fontSize: 10 }}
                                                    >
                                                        {t("apiKeys.expired", "Expired")}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <code
                                                    style={{
                                                        fontSize: 12,
                                                        background: "var(--djac-surface)",
                                                        padding: "2px 6px",
                                                        borderRadius: 4,
                                                        fontFamily: "monospace",
                                                    }}
                                                >
                                                    {k.keyPrefix}…
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 4,
                                                        maxWidth: 260,
                                                    }}
                                                >
                                                    {scopes.map((s) => (
                                                        <Badge
                                                            key={s}
                                                            variant="outline"
                                                            style={{ fontSize: 10 }}
                                                        >
                                                            {s}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    fontSize: 12,
                                                    color: expired
                                                        ? "var(--djac-red)"
                                                        : "var(--djac-muted)",
                                                }}
                                            >
                                                {fmtDate(k.expiresAt)}
                                            </TableCell>
                                            <TableCell
                                                style={{
                                                    fontSize: 12,
                                                    color: "var(--djac-muted)",
                                                }}
                                            >
                                                {fmtDate(k.lastUsedAt)}
                                            </TableCell>
                                            <TableCell style={{ paddingRight: 20 }}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setRevokeId(k.id)}
                                                    disabled={revokeMut.isPending}
                                                    style={{ color: "var(--djac-red)" }}
                                                >
                                                    <Trash2 style={{ width: 14, height: 14 }} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Create Dialog ── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent style={{ maxWidth: 520 }}>
                    <DialogHeader>
                        <DialogTitle>{t("apiKeys.createTitle", "Create API Key")}</DialogTitle>
                        <DialogDescription>
                            {t(
                                "apiKeys.createDesc",
                                "The full key is shown only once. Store it securely.",
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "8px 0" }}>
                        {/* Name */}
                        <div>
                            <Label style={{ fontSize: 12, marginBottom: 6, display: "block" }}>
                                {t("apiKeys.nameLabel", "Key Name")}
                            </Label>
                            <Input
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                placeholder={t("apiKeys.namePlaceholder", "e.g. GitHub Actions")}
                                maxLength={120}
                            />
                        </div>

                        {/* Scopes */}
                        <div>
                            <Label style={{ fontSize: 12, marginBottom: 8, display: "block" }}>
                                {t("apiKeys.scopesLabel", "Permissions")}
                            </Label>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {ALL_SCOPES.map((s) => (
                                    <label
                                        key={s.value}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 10,
                                            cursor: "pointer",
                                            padding: "6px 10px",
                                            borderRadius: 6,
                                            background: selectedScopes.has(s.value)
                                                ? "var(--djac-accent-muted)"
                                                : "transparent",
                                            border: `1px solid ${selectedScopes.has(s.value) ? "var(--djac-accent)" : "var(--djac-border)"}`,
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedScopes.has(s.value)}
                                            onChange={() => toggleScope(s.value)}
                                            style={{ accentColor: "var(--djac-accent)" }}
                                        />
                                        <div>
                                            <code
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    color: "var(--djac-fg)",
                                                }}
                                            >
                                                {s.label}
                                            </code>
                                            <p style={{ fontSize: 11, color: "var(--djac-muted)", margin: 0 }}>
                                                {s.desc}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Expiry */}
                        <div>
                            <Label style={{ fontSize: 12, marginBottom: 6, display: "block" }}>
                                {t("apiKeys.expiryLabel", "Expiry")}
                            </Label>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {EXPIRY_OPTIONS.map((o) => (
                                    <Button
                                        key={o.label}
                                        type="button"
                                        variant={expiryDays === o.days ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setExpiryDays(o.days)}
                                    >
                                        {o.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                            {t("apiKeys.cancel", "Cancel")}
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={
                                !keyName.trim() ||
                                selectedScopes.size === 0 ||
                                createMut.isPending
                            }
                        >
                            {createMut.isPending ? (
                                <Loader2 className="animate-spin" style={{ width: 14, height: 14, marginRight: 6 }} />
                            ) : null}
                            {t("apiKeys.createBtn", "Create Key")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── New Key Reveal Dialog ── */}
            <Dialog open={newRawKey !== null} onOpenChange={() => setNewRawKey(null)}>
                <DialogContent style={{ maxWidth: 500 }}>
                    <DialogHeader>
                        <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Check
                                style={{ width: 16, height: 16, color: "var(--djac-green)" }}
                            />
                            {t("apiKeys.keyCreated", "Key Created!")}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                "apiKeys.keyCreatedDesc",
                                "Copy this key now — it will not be shown again.",
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div style={{ margin: "8px 0" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                background: "var(--djac-surface)",
                                borderRadius: 8,
                                padding: "10px 14px",
                                border: "1px solid var(--djac-border)",
                            }}
                        >
                            <code
                                style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontFamily: "monospace",
                                    wordBreak: "break-all",
                                    color: "var(--djac-accent)",
                                }}
                            >
                                {newRawKey?.rawKey}
                            </code>
                            {newRawKey && <CopyButton text={newRawKey.rawKey} />}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginTop: 10,
                                padding: "8px 12px",
                                background: "var(--djac-orange-muted)",
                                borderRadius: 6,
                            }}
                        >
                            <AlertTriangle
                                style={{
                                    width: 14,
                                    height: 14,
                                    color: "var(--djac-orange)",
                                    flexShrink: 0,
                                }}
                            />
                            <span style={{ fontSize: 12, color: "var(--djac-orange)" }}>
                                {t(
                                    "apiKeys.keyWarning",
                                    "This key will not be displayed again. Save it to a secure secrets manager.",
                                )}
                            </span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setNewRawKey(null)}>
                            {t("apiKeys.done", "Done, I've saved it")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Revoke Confirm Dialog ── */}
            <Dialog open={revokeId !== null} onOpenChange={() => setRevokeId(null)}>
                <DialogContent style={{ maxWidth: 400 }}>
                    <DialogHeader>
                        <DialogTitle style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <AlertTriangle
                                style={{ width: 16, height: 16, color: "var(--djac-red)" }}
                            />
                            {t("apiKeys.revokeTitle", "Revoke API Key?")}
                        </DialogTitle>
                        <DialogDescription>
                            {t(
                                "apiKeys.revokeDesc",
                                "This will immediately invalidate the key. Any integrations using it will stop working.",
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRevokeId(null)}>
                            {t("apiKeys.cancel", "Cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={revokeMut.isPending}
                            onClick={() => {
                                if (revokeId !== null) {
                                    revokeMut.mutate(revokeId, {
                                        onSuccess: () => setRevokeId(null),
                                    });
                                }
                            }}
                        >
                            {revokeMut.isPending ? (
                                <Loader2 className="animate-spin" style={{ width: 14, height: 14, marginRight: 6 }} />
                            ) : null}
                            {t("apiKeys.revokeConfirm", "Yes, Revoke Key")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
