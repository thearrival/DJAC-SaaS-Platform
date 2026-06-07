import express, { type Express, type Request } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { ENV } from "./env";

const projectRoot = path.resolve(import.meta.dirname, "../..");
const clientRoot = path.resolve(projectRoot, "client");
// Use realpathSync only when the paths exist (dev mode). In the production
// container the client source directory is absent (only dist/public is copied),
// so we fall back to the pre-resolved paths gracefully.
function safeRealpathSync(p: string): string {
  try {
    return fs.realpathSync.native(p);
  } catch {
    return p;
  }
}
const realProjectRoot = safeRealpathSync(projectRoot);
const realClientRoot = safeRealpathSync(clientRoot);
const moduleRequestPattern = /\.(?:[cm]?[jt]sx?)(?:$|\?)/i;

function getRequestPathname(url: string) {
  return url.split("?")[0] || url;
}

function isModuleRequest(url: string) {
  return moduleRequestPattern.test(getRequestPathname(url));
}

function isHtmlNavigationRequest(req: Request) {
  const acceptHeader = req.headers.accept;
  return typeof acceptHeader === "string" && acceptHeader.includes("text/html");
}

function normalizeModuleUrl(url: string) {
  const [pathname, query] = url.split("?");
  const suffix = query ? `?${query}` : "";

  if (!pathname.startsWith("/@fs/")) {
    return `${pathname}${suffix}`;
  }

  const decodedPath = decodeURIComponent(pathname.slice(5));
  const resolvedPath = path.resolve(decodedPath);

  let realResolvedPath = resolvedPath;
  try {
    realResolvedPath = fs.realpathSync.native(resolvedPath);
  } catch {
    // Fall back to the resolved path if the file is transient during HMR.
  }

  const relativeToClient = path.relative(realClientRoot, realResolvedPath);
  if (!relativeToClient.startsWith("..") && !path.isAbsolute(relativeToClient)) {
    return `/${relativeToClient.replace(/\\/g, "/")}${suffix}`;
  }

  return `/@fs/${realResolvedPath.replace(/\\/g, "/")}${suffix}`;
}

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
    fs: {
      allow: [projectRoot, realProjectRoot],
    },
  };

  const vite = await createViteServer({
    configFile: path.resolve(projectRoot, "vite.config.ts"),
    server: serverOptions,
    appType: "custom",
  });

  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    if (!isModuleRequest(url)) {
      next();
      return;
    }

    try {
      const transformed = await vite.transformRequest(normalizeModuleUrl(url));

      if (!transformed) {
        next();
        return;
      }

      if (transformed.etag) {
        res.setHeader("Etag", transformed.etag);
      }

      res
        .status(200)
        .set({
          "Content-Type": "text/javascript",
          "Cache-Control": "no-cache",
        })
        .end(transformed.code);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    if (!isHtmlNavigationRequest(req)) {
      next();
      return;
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    ENV.isDevelopment
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Vite outputs assets with content hashes in their filenames (e.g. main-BLqxe3cJ.js).
  // Those can be cached indefinitely by browsers and CDNs.
  // index.html itself must always be re-validated (no-cache) so clients pick
  // up new asset filenames after a deploy.
  app.use(
    express.static(distPath, {
      setHeaders(res, filePath) {
        const base = path.basename(filePath);
        // Match Vite's hash pattern: 8+ hex chars between dots, e.g. "main-A1b2C3d4.js"
        const isHashedAsset = /\.[0-9a-f]{8,}\.[^.]+$/i.test(base);
        if (isHashedAsset) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          // index.html, manifest.json, robots.txt, etc. — always revalidate.
          res.setHeader("Cache-Control", "public, no-cache");
        }
      },
    })
  );

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "public, no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
