import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Edge-safe route guard.
 *
 * This used to call `auth.api.getSession()`, which imports `@/lib/auth` and so
 * pulls the whole `mongodb` driver into the middleware bundle. Vercel happened
 * to tolerate that, but Netlify compiles middleware to a Deno *edge function*
 * where mongodb's Node built-ins (net, tls, dns…) don't exist — hence
 * "Failed to load external module mongodb-…" at bundle time.
 *
 * `getSessionCookie` only parses the request's cookie header. No database, no
 * Node APIs, so it bundles cleanly on every host.
 *
 * NOTE: this is an *optimistic* check — it proves a session cookie is present,
 * not that it's valid. That's deliberate and is Better Auth's documented
 * middleware pattern: middleware is for cheap redirects, not authorization.
 * The real checks still happen where they always did:
 *   - dashboard/layout.jsx  → validates the session, role and suspended status
 *   - SessionGuard          → client-side route guard
 *   - the Express API       → verifies the JWT and enforces role + ownership
 * A forged cookie gets you a redirect-free page load and nothing else; every
 * piece of data on it still requires a valid token.
 */
export const proxy = (request) => {
    const sessionCookie = getSessionCookie(request);

    if (sessionCookie) {
        return NextResponse.next();
    }

    const loginUrl = new URL("/signin", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
};

export const config = {
    matcher: ["/dashboard/:path*", "/doctors/:path*"],
};
