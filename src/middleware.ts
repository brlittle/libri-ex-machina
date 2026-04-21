import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

// Routes that require an authenticated session
const PROTECTED_PATHS = ["/api/library"];

// Mutating methods that must pass the CSRF check
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * CSRF protection via Origin + custom header double-check.
 *
 * For every state-changing API request we verify:
 *   1. The Origin header matches the server's own host (blocks cross-site requests).
 *   2. The request carries the X-CSRF-Token: fetch header (browsers never add this
 *      automatically, so a forged form/image/redirect request will never have it).
 *
 * Read-only requests (GET, HEAD, OPTIONS) are exempt — they must not mutate state.
 */
function csrfCheck(request: NextRequest): boolean {
  if (!MUTATING_METHODS.has(request.method)) return true;

  // 1. Origin check — must match the server's own origin.
  //    Browsers always send Origin on cross-origin requests; same-origin fetch
  //    requests also send it in modern browsers.
  const origin = request.headers.get("origin");
  if (origin) {
    const serverOrigin = request.nextUrl.origin;
    if (origin !== serverOrigin) return false;
  }

  // 2. Custom header sentinel — a plain HTML form or <img> redirect can never
  //    set arbitrary headers, so requiring this header stops those vectors.
  const sentinel = request.headers.get("x-csrf-token");
  if (sentinel !== "fetch") return false;

  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");

  // CSRF check — applies to all mutating API requests
  if (isApiRoute && !csrfCheck(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Auth check — applies to explicitly protected API routes
  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtectedPath) {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static assets)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public-folder image files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
