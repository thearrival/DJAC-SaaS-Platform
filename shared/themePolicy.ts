export type ThemePreference = "light" | "dark";

const LIGHT_DEFAULT_PATHS = new Set([
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/privacy",
    "/terms",
    "/pricing",
    "/hero",
]);

function normalizePath(pathname?: string | null): string {
    if (!pathname) return "/";
    const [withoutQuery] = pathname.split(/[?#]/, 1);
    const normalized = withoutQuery.trim().toLowerCase();
    return normalized || "/";
}

export function resolveDefaultThemeForPath(pathname?: string | null): ThemePreference {
    const normalized = normalizePath(pathname);
    return LIGHT_DEFAULT_PATHS.has(normalized) ? "light" : "dark";
}

export function isPublicLightRoute(pathname?: string | null): boolean {
    return resolveDefaultThemeForPath(pathname) === "light";
}
