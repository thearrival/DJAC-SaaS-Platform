import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function YallaAdminLogin() {
    const [username, setUsername] = useState("yalla_admin");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [, navigate] = useLocation();
    const portalPath = "/yalla-hack-owners-console";
    const ownerEntryPath = "/yalla-hack-owners-console/enter";

    // Check if already authenticated
    useEffect(() => {
        fetch("/api/yalla-admin/me", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
                if (d.authenticated) navigate(portalPath);
                else setChecking(false);
            })
            .catch(() => setChecking(false));
    }, [navigate, portalPath]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await fetch("/api/yalla-admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Login failed");
                return;
            }
            navigate(portalPath);
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
            {/* Background grid */}
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative w-full max-w-sm mx-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
                        <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Internal Operations
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Yalla-Admin Control Panel</p>
                    <p className="text-slate-700 text-xs mt-3">Private entry: {ownerEntryPath}</p>
                </div>

                {/* Card */}
                <div className="bg-slate-900/80 border border-slate-800/60 rounded-2xl p-8 backdrop-blur-sm">
                    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
                                placeholder="admin username"
                                autoComplete="username"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition"
                                placeholder="••••••••••••"
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                                </svg>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-700 text-xs mt-6">
                    Authorized personnel only. All access is logged and monitored.
                </p>
            </div>
        </div>
    );
}
