// Verifies the frontend's adminToken cookie by calling the backend with it as a Bearer token.
// Used by the admin login page to check "already logged in" state.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminToken")?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });
  if (!API_BASE) return NextResponse.json({ ok: false }, { status: 500 });

  const upstream = await fetch(`${API_BASE}/api/admin/verify`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Token invalid/expired upstream — clear the local cookie.
    cookieStore.delete("adminToken");
    return NextResponse.json({ ok: false }, { status: upstream.status });
  }

  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json({ ok: true, admin: data?.admin || null });
}
