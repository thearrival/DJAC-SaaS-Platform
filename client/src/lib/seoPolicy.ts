/**
 * Client-side SEO policy for the SPA.
 *
 * The served `index.html` is a single document shared by every route and it
 * declares `index, follow` for the public marketing/docs pages. Authenticated
 * app routes must not be indexed (mandate §37: prevent indexing of private
 * pages/internal areas), so this module classifies a pathname as public or
 * private and the shell overrides the `<meta name="robots">` tag accordingly.
 *
 * Keep `PUBLIC_PATHS` in sync with the `Allow` entries in
 * `client/public/robots.txt`.
 */
const PUBLIC_PATHS = [
  "/",
  "/pricing",
  "/login",
  "/signup",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/privacy",
  "/terms",
  "/docs",
  "/demo",
  "/hero",
  "/invite-accept",
  "/404",
] as const;

function normalize(pathname: string): string {
  const stripped = (pathname || "/").split("?")[0].split("#")[0];
  if (stripped.length > 1 && stripped.endsWith("/"))
    return stripped.slice(0, -1);
  return stripped || "/";
}

export function isPublicPath(pathname: string): boolean {
  const path = normalize(pathname);
  return PUBLIC_PATHS.some(pub => path === pub || path.startsWith(`${pub}/`));
}

export const ROBOTS_INDEX =
  "index, follow, max-snippet:-1, max-image-preview:large";
export const ROBOTS_NOINDEX = "noindex, nofollow, noarchive, nosnippet";

export function robotsDirectiveForPath(pathname: string): string {
  return isPublicPath(pathname) ? ROBOTS_INDEX : ROBOTS_NOINDEX;
}
