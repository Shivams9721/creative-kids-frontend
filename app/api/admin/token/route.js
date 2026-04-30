// Returns the admin JWT to authed clients so they can call the backend directly with a
// Bearer header. The token comes from the httpOnly cookie — JS can never read the cookie
// itself, only the value handed back here. Token stays in memory on the client (not localStorage).
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("adminToken")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!API_BASE) return NextResponse.json({ error: "API not configured" }, { status: 500 });

  // Verify with backend before handing the token to the client.
  const verify = await fetch(`${API_BASE}/api/admin/verify`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!verify.ok) {
    cookieStore.delete("adminToken");
    return NextResponse.json({ error: "Invalid" }, { status: 401 });
  }

  return NextResponse.json({ token });
}
