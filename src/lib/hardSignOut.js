import { authClient } from "./auth-client";

/**
 * A normal authClient.signOut() clears the current session cookie, but if
 * the browser is still holding an OLDER cookie from before a config change
 * (e.g. this app's cookieCache being disabled), that stale cookie can
 * survive and keep serving outdated role/status data. This does a full,
 * guaranteed-clean sign out: calls the real signOut, then manually expires
 * every cookie for this domain as a backstop, then hard-reloads the page
 * so no in-memory state survives either.
 */
export const hardSignOut = async (redirectTo = "/signin") => {
  try {
    await authClient.signOut();
  } catch {
    // even if this fails, still proceed to manually clear cookies below
  }

  // Manually expire every cookie visible to JS for this domain/path.
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (!name) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });

  // Hard navigation (not router.push) so no stale React/session state survives.
  window.location.href = redirectTo;
};
