import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
// Build: v3 — cache-bust redeploy
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";

const injectAnalyticsScript = () => {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as
    | string
    | undefined;

  if (!endpoint || !websiteId || typeof document === "undefined") {
    return;
  }

  const base = endpoint.replace(/\/$/, "");
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${base}/umami`;
  script.setAttribute("data-website-id", websiteId);
  document.head.appendChild(script);
};

const queryClient = new QueryClient();
const APP_ROOT_ID = "djac-app-root";

const renderStartupFallback = (message?: string) => {
  if (typeof document === "undefined") return;

  const root = getAppRoot();
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f3f4f6;color:#111827;font-family:Inter,Arial,sans-serif;">
      <div style="max-width:560px;background:#ffffff;border:1px solid #d1d5db;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.08);text-align:center;">
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;">DJAC is loading safely</h1>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">The app hit a browser compatibility or startup issue.</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;">${message ?? "Please refresh the page or open it in a current browser."}</p>
      </div>
    </div>
  `;
};

const getAppRoot = () => {
  const existingRoot = document.getElementById(APP_ROOT_ID);
  if (existingRoot) return existingRoot;

  const createdRoot = document.createElement("div");
  createdRoot.id = APP_ROOT_ID;
  document.body.appendChild(createdRoot);
  return createdRoot;
};

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  // Already on the login page — don't redirect again (prevents reload loops).
  const { pathname } = window.location;
  if (pathname === "/login" || pathname === "/signup" || pathname === "/") return;

  // Use SPA navigation (History pushState) instead of a hard reload so the
  // React tree stays alive and the sidebar/layout doesn't flash.
  window.history.pushState({}, "", "/login");
  window.dispatchEvent(new PopStateEvent("popstate"));
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

injectAnalyticsScript();

if (typeof window !== "undefined") {
  window.addEventListener("error", () => {
    const root = document.getElementById(APP_ROOT_ID);
    if (root && root.childElementCount === 0) {
      renderStartupFallback("A startup error prevented the dashboard from rendering.");
    }
  });

  window.addEventListener("unhandledrejection", () => {
    const root = document.getElementById(APP_ROOT_ID);
    if (root && root.childElementCount === 0) {
      renderStartupFallback("A browser compatibility issue interrupted startup.");
    }
  });
}

try {
  createRoot(getAppRoot()).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
} catch {
  renderStartupFallback("Please refresh the page or update your browser and try again.");
}
