import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "jobbot_auth";

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.svg"
  );
}

export function proxy(request: NextRequest) {
  const user = process.env.APP_BASIC_AUTH_USER;
  const pass = process.env.APP_BASIC_AUTH_PASSWORD;
  if (!user || !pass) return NextResponse.next();

  const expected = Buffer.from(`${user}:${pass}`).toString("base64");

  // Cookie-based session (login screen flow).
  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  if (cookie && safeEqual(cookie, expected)) {
    return NextResponse.next();
  }

  // Auth.js session (Phase 1).
  if (
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value
  ) {
    return NextResponse.next();
  }

  // Backward-compatible HTTP Basic Auth.
  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const idx = decoded.indexOf(":");
      if (idx !== -1) {
        const name = decoded.slice(0, idx);
        const password = decoded.slice(idx + 1);
        if (safeEqual(name, user) && safeEqual(password, pass)) {
          return NextResponse.next();
        }
      }
    } catch {
      // fall through
    }
  }

  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // API routes keep a 401 contract; pages redirect to the login screen.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Protected", charset="UTF-8"',
      },
    });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};