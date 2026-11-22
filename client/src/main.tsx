import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
// Build: v3 — cache-bust redeploy
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { loadLocaleCatalog } from "./contexts/LocaleContext";
import { setPreloadedCatalog } from "./contexts/localeBoot";
import "./index.css";

// Google OAuth returns the authorization code to the redirect URI registered in
// Google Cloud, which for this client is the site root (`/`). Forward it to the
// server callback that exchanges it and establishes the session.
if (typeof window !== "undefined") {
  const params = new URLSearchParams(window.location.search);
  if (
    window.location.pathname === "/" &&
    params.has("code") &&
    params.has("state")
  ) {
    window.location.replace(`/api/auth/google/callback?${params.toString()}`);
  }
}

const injectAnalyticsScript = () => {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as
    string | undefined;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as
    string | undefined;

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
  const locale =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("djac-locale") || "en"
      : "en";
  const copy: Record<string, { title: string; body: string; hint: string }> = {
    en: {
      title: "DJAC is loading safely",
      body: "The app hit a browser compatibility or startup issue.",
      hint: "Please refresh the page or open it in a current browser.",
    },
    ar: {
      title: "يقوم DJAC بالتحميل بأمان",
      body: "واجه التطبيق مشكلة في توافق المتصفح أو بدء التشغيل.",
      hint: "يرجى تحديث الصفحة أو فتحها في متصفح حديث.",
    },
    zh: {
      title: "DJAC 正在安全加载",
      body: "应用遇到了浏览器兼容性或启动问题。",
      hint: "请刷新页面或在较新的浏览器中打开。",
    },
    fr: {
      title: "DJAC se charge en toute sécurité",
      body: "L'application a rencontré un problème de compatibilité ou de démarrage du navigateur.",
      hint: "Veuillez actualiser la page ou l'ouvrir dans un navigateur récent.",
    },
    es: {
      title: "DJAC se está cargando de forma segura",
      body: "La aplicación encontró un problema de compatibilidad o inicio del navegador.",
      hint: "Actualice la página o ábrala en un navegador actual.",
    },
    de: {
      title: "DJAC wird sicher geladen",
      body: "Bei der App ist ein Browserkompatibilitäts- oder Startproblem aufgetreten.",
      hint: "Bitte aktualisieren Sie die Seite oder öffnen Sie sie in einem aktuellen Browser.",
    },
    ja: {
      title: "DJAC を安全に読み込んでいます",
      body: "アプリでブラウザ互換性または起動の問題が発生しました。",
      hint: "ページを更新するか、最新のブラウザで開いてください。",
    },
    ko: {
      title: "DJAC를 안전하게 로드하는 중입니다",
      body: "앱에서 브라우저 호환성 또는 시작 문제가 발생했습니다.",
      hint: "페이지를 새로고침하거나 최신 브라우저에서 열어 주세요.",
    },
    pt: {
      title: "DJAC está carregando com segurança",
      body: "O aplicativo encontrou um problema de compatibilidade ou inicialização do navegador.",
      hint: "Atualize a página ou abra em um navegador atual.",
    },
  };
  const c = copy[locale] ?? copy.en;
  const root = getAppRoot();
  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#050508;color:#ffffff;font-family:Inter,Arial,sans-serif;">
      <div style="max-width:560px;background:rgba(30,30,45,0.4);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.08);text-align:center;">
        <h1 style="margin:0 0 12px;font-size:24px;font-weight:700;">${c.title}</h1>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;">${c.body}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#94a3b8;">${message ?? c.hint}</p>
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
  if (pathname === "/login" || pathname === "/signup" || pathname === "/")
    return;

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
      renderStartupFallback(
        "A startup error prevented the dashboard from rendering."
      );
    }
  });

  window.addEventListener("unhandledrejection", () => {
    const root = document.getElementById(APP_ROOT_ID);
    if (root && root.childElementCount === 0) {
      renderStartupFallback(
        "A browser compatibility issue interrupted startup."
      );
    }
  });
}

const renderApp = () => {
  createRoot(getAppRoot()).render(
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  );
};

// Preload the stored locale's catalog before the first paint so non-English
// users don't see a flash of English while the chunk downloads.
const bootLocale = (() => {
  try {
    return window.localStorage.getItem("djac-locale") ?? "en";
  } catch {
    return "en";
  }
})();

const boot = async () => {
  try {
    if (bootLocale && bootLocale !== "en") {
      setPreloadedCatalog(await loadLocaleCatalog(bootLocale));
    }
  } catch {
    /* fall back to the bundled English catalog */
  }
  renderApp();
};

try {
  void boot();
} catch {
  renderStartupFallback(
    "Please refresh the page or update your browser and try again."
  );
}
