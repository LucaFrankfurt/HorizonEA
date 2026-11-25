import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional HTTP Basic Auth for the whole app (UI and API).
 *
 * Enabled when BASIC_AUTH_PASSWORD is set (user: BASIC_AUTH_USER, default "admin").
 * The Coolify compose file sets the password from a generated secret, so a
 * public deployment is protected by default. /api/health stays open for
 * container health checks.
 */
const digest = (value: string) => createHash("sha256").update(value).digest();

/** Constant-time comparison (hashing first makes both buffers the same length). */
function safeEqual(a: string, b: string) {
  return timingSafeEqual(digest(a), digest(b));
}

export function proxy(request: NextRequest) {
  const password = process.env.BASIC_AUTH_PASSWORD;
  if (!password) return NextResponse.next();
  const user = process.env.BASIC_AUTH_USER || "admin";

  const header = request.headers.get("authorization") ?? "";
  if (header.toLowerCase().startsWith("basic ")) {
    const decoded = Buffer.from(header.slice(6).trim(), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator >= 0) {
      const userOk = safeEqual(decoded.slice(0, separator), user);
      const passwordOk = safeEqual(decoded.slice(separator + 1), password);
      if (userOk && passwordOk) return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="HorizonEA", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}

export const config = {
  // Everything except the health probe and static build assets.
  matcher: ["/((?!api/health|_next/static|_next/image|robots\\.txt).*)"],
};
