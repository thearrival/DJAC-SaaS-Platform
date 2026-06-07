export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const APP_TITLE = import.meta.env.VITE_APP_TITLE || "App";

export const APP_LOGO = "/yalla-hack-logo-mark.png";

// Returns true only when an external (non-same-origin) OAuth portal is configured.
// Use this to conditionally show SSO buttons/UI that would otherwise loop back.
export const isExternalOAuth = (): boolean => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;
  if (!oauthPortalUrl || oauthPortalUrl.trim() === "") return false;
  if (typeof window === "undefined") return true;
  return oauthPortalUrl.replace(/\/$/, "") !== window.location.origin.replace(/\/$/, "");
};

// Generate login URL at runtime so redirect URI reflects the current origin.
// When VITE_OAUTH_PORTAL_URL is absent or points to the same origin as this app
// (local-dev mode), return the built-in /login route to avoid a redirect loop.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL as string | undefined;

  const isSameOrigin =
    !oauthPortalUrl ||
    oauthPortalUrl.trim() === "" ||
    (typeof window !== "undefined" &&
      oauthPortalUrl.replace(/\/$/, "") === window.location.origin.replace(/\/$/, ""));

  if (isSameOrigin) {
    return "/login";
  }

  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
