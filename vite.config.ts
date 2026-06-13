import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

const workspaceRoot = process.cwd();

export default defineConfig(({ mode }) => {
  const isProductionBuild = mode === "production";

  const enableManusRuntime = !isProductionBuild && (
    process.env.ENABLE_MANUS_RUNTIME === "true" ||
    process.env.VITE_ENABLE_MANUS_RUNTIME === "true"
  );

  const enableJsxLoc = !isProductionBuild && (
    process.env.ENABLE_JSX_LOC === "true" ||
    process.env.VITE_ENABLE_JSX_LOC === "true"
  );

  const plugins = [
    react(),
    tailwindcss(),
    ...(enableJsxLoc ? [jsxLocPlugin()] : []),
    ...(enableManusRuntime ? [vitePluginManusRuntime()] : []),
  ];

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(workspaceRoot, "client", "src"),
        "@shared": path.resolve(workspaceRoot, "shared"),
      },
    },
    envDir: workspaceRoot,
    root: path.resolve(workspaceRoot, "client"),
    publicDir: path.resolve(workspaceRoot, "client", "public"),
    build: {
      outDir: path.resolve(workspaceRoot, "dist/public"),
      emptyOutDir: true,
      sourcemap: false,
      // Use a broadly compatible baseline for public/mobile browsers and in-app webviews.
      // This avoids silent blank screens caused by shipping esnext-only syntax.
      target: "es2020",
      // Skip the gzip/brotli size report during build — saves ~5-10s in CI.
      reportCompressedSize: false,
      // Marketing/public chunks are separate from the SPA bundle and don't
      // meaningfully benefit from warning at 500 kB.
      chunkSizeWarningLimit: 600,
      // Ensure React is always resolved to a single copy so that Radix UI,
      // framer-motion and any other packages calling React.forwardRef at
      // module-init time never receive `undefined`.
      dedupe: ["react", "react-dom"],
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("recharts")) {
              return "charts";
            }

            // React core + ALL React-dependent libraries MUST load in order.
            // Any library calling React.createContext/useState/etc at module-init
            // time will crash if React isn't loaded first. Merge them all here.
            if (
              id.includes("react") ||
              id.includes("react-dom") ||
              id.includes("scheduler") ||
              id.includes("@radix-ui") ||
              id.includes("framer-motion") ||
              id.includes("sonner") ||
              id.includes("wouter") ||
              id.includes("cmdk") ||
              id.includes("vaul") ||
              id.includes("next-themes") ||
              id.includes("input-otp") ||
              id.includes("react-resizable-panels") ||
              id.includes("embla-carousel") ||
              id.includes("react-day-picker") ||
              id.includes("react-markdown") ||
              id.includes("react-hook-form") ||
              id.includes("@hookform")
            ) {
              return "react-vendor";
            }

            if (
              id.includes("@tanstack/react-query") ||
              id.includes("@trpc") ||
              id.includes("superjson")
            ) {
              return "data-client";
            }

            if (id.includes("lucide-react")) {
              return "icons";
            }

            // Form validation — loaded only on forms (signup, settings, etc.)
            if (id.includes("zod") && !id.includes("react")) {
              return "form-libs";
            }

            // Date handling — loaded only on pages with date pickers
            if (id.includes("date-fns") || id.includes("dayjs")) {
              return "date-libs";
            }

            // Stripe SDK is large and only needed on billing pages.
            if (id.includes("stripe")) {
              return "stripe-sdk";
            }

            // PDF/report generation is rarely executed — keep separate.
            if (id.includes("pdf-lib") || id.includes("fontkit") || id.includes("pizzip")) {
              return "pdf-vendor";
            }

            // jose (JWT) — crypto lib, only needed for auth
            if (id.includes("jose")) {
              return "crypto-libs";
            }

            return "vendor";
          },
        },
      },
    },
    // Drop console.* and debugger statements from production bundles.
    esbuild: {
      drop: isProductionBuild ? ["console", "debugger"] : [],
    },
    server: {
      host: true,
      allowedHosts: [
        ".manuspre.computer",
        ".manus.computer",
        ".manus-asia.computer",
        ".manuscomputer.ai",
        ".manusvm.computer",
        "localhost",
        "127.0.0.1",
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
