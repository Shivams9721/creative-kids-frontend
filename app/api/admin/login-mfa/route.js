// Step 2 of admin login when TOTP 2FA is enabled. Forwards mfa_token + code
// to the backend; on success sets the adminToken cookie on the frontend domain.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function POST(request) {
  if (!API_BASE) {
    return NextResponse.json({ message: "API not configured" }, { status: 500 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const upstream = await fetch(`${API_BASE}/api/admin/login-mfa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok || !data?.token) {
    return NextResponse.json(
      { message: data?.error || data?.message || "Invalid code" },
      { status: upstream.status || 401 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("adminToken", data.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 12 * 60 * 60,
  });

  return NextResponse.json({
    success: true,
    backup_codes_remaining: data.backup_codes_remaining,
  });
}
