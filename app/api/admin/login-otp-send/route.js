// Passthrough proxy for admin OTP send. No cookie work — the verify step does that.
import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export async function POST(request) {
  if (!API_BASE) return NextResponse.json({ message: "API not configured" }, { status: 500 });
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Invalid request" }, { status: 400 });

  const upstream = await fetch(`${API_BASE}/api/admin/login-otp-send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}
