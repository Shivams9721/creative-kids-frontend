import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Secret admin URL gate ─────────────────────────────────────────────────────
// Two env vars:
//   ADMIN_GATE_KEY     — the secret string a real admin types into the URL once,
//                        e.g. /admin/login?key=<this value>. Long, random, secret.
//   ADMIN_GATE_SECRET  — HMAC signing key for the unlock cookie. Different from
//                        ADMIN_GATE_KEY. If unset, gate is disabled (dev mode).
// Without a valid unlock cookie OR a matching ?key=..., every /admin* and
// /api/admin* request returns 404 — bots can't even see the login form.
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_GATE_KEY = process.env.ADMIN_GATE_KEY || "";
const ADMIN_GATE_SECRET = process.env.ADMIN_GATE_SECRET || "";
const UNLOCK_COOKIE = "admin_unlock";
const UNLOCK_TTL_DAYS = 30;

const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toHex(sig);
}

async function isUnlockCookieValid(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue || !ADMIN_GATE_SECRET) return false;
  const [payload, sig] = cookieValue.split(".");
  if (!payload || !sig) return false;
  // Payload format: <expiryUnixMs>
  const expiry = Number(payload);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;
  const expected = await hmac(ADMIN_GATE_SECRET, payload);
  return sig === expected;
}

async function buildUnlockCookie(): Promise<string> {
  const expiry = String(Date.now() + UNLOCK_TTL_DAYS * 86400000);
  const sig = await hmac(ADMIN_GATE_SECRET, expiry);
  return `${expiry}.${sig}`;
}

function isAdminPath(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  return false;
}

function notFoundResponse(pathname: string): NextResponse {
  // For API routes return JSON 404; for pages, rewrite to Next's not-found.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });
  }
  // Rewriting to a non-existent path triggers the global not-found page.
  return new NextResponse(null, { status: 404 });
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Routes outside the admin surface flow through untouched.
  if (!isAdminPath(pathname)) return NextResponse.next();

  // ── Admin gate ──────────────────────────────────────────────────────────────
  // Gate is active only when both env vars are set. In local dev with neither
  // set, the gate is bypassed so developers can work without the secret URL.
  const gateActive = !!ADMIN_GATE_KEY && !!ADMIN_GATE_SECRET;

  if (gateActive) {
    const supplied = searchParams.get("key");
    const cookie = request.cookies.get(UNLOCK_COOKIE)?.value;
    const cookieValid = await isUnlockCookieValid(cookie);

    if (!cookieValid) {
      if (supplied && supplied === ADMIN_GATE_KEY) {
        // Correct key — set signed cookie and redirect to the same path without ?key.
        const cleanUrl = request.nextUrl.clone();
        cleanUrl.searchParams.delete("key");
        const res = NextResponse.redirect(cleanUrl);
        res.cookies.set(UNLOCK_COOKIE, await buildUnlockCookie(), {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: UNLOCK_TTL_DAYS * 86400,
        });
        return res;
      }
      // No cookie + no key → admin panel does not exist for you.
      return notFoundResponse(pathname);
    }
  }

  // ── Existing token redirect ─────────────────────────────────────────────────
  // Once past the gate, the original behaviour kicks in: any /admin page other
  // than /admin/login requires an adminToken cookie.
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("adminToken")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
