import { useEffect, useState } from "react";
import { useLocation } from "wouter";

type BootstrapResponse = {
    ok: boolean;
    redirectTo: string;
    gateEnabled: boolean;
    error?: string;
};

export default function YallaAdminAccessBootstrap() {
    const [location, navigate] = useLocation();
    const [error, setError] = useState("");
    const [working, setWorking] = useState(true);

    useEffect(() => {
        const search = new URLSearchParams(window.location.search);
        const accessToken = search.get("access_token")?.trim() ?? "";
        const expires = search.get("expires")?.trim() ?? "";
        const sig = search.get("sig")?.trim() ?? "";
        const nonce = search.get("nonce")?.trim() ?? "";
        const redirectTo = "/yalla-hack-owners-console/login";

        if (!accessToken && (!expires || !sig)) {
            setError("Missing owner-link credentials. Use the private owner link exactly as provided.");
            setWorking(false);
            return;
        }

        const params = new URLSearchParams({ mode: "json", redirect: redirectTo });
        if (accessToken) params.set("access_token", accessToken);
        if (expires) params.set("expires", expires);
        if (sig) params.set("sig", sig);
        if (nonce) params.set("nonce", nonce);

        fetch(`/api/yalla-admin/bootstrap?${params.toString()}`, {
            credentials: "include",
        })
            .then(async (response) => {
                const data = await response.json() as BootstrapResponse;
                if (!response.ok || !data.ok) {
                    throw new Error(data.error ?? "Access bootstrap failed.");
                }
                window.history.replaceState({}, document.title, location.split("?")[0] ?? location);
                navigate(data.redirectTo);
            })
            .catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : "Access bootstrap failed.");
                setWorking(false);
            });
    }, [location, navigate]);

    return (
        <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                }}
            />

            <div className="relative w-full max-w-md rounded-2xl border border-slate-800/60 bg-slate-900/85 p-8 text-center backdrop-blur-sm">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10">
                    <svg className="h-7 w-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                </div>

                <h1 className="text-xl font-bold text-white">Owner Access Check</h1>
                <p className="mt-2 text-sm text-slate-500">
                    {working ? "Validating the private owner link and preparing the isolated console." : "The owner entry link could not be validated."}
                </p>

                {working ? (
                    <div className="mt-6 flex items-center justify-center gap-3 text-cyan-400">
                        <span className="h-5 w-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                        <span className="text-sm">Checking access token...</span>
                    </div>
                ) : (
                    <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
