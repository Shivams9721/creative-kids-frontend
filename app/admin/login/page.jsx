"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Turnstile from "@/components/widgets/Turnstile";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRequired = !!TURNSTILE_SITE_KEY;

  const [checking, setChecking] = useState(true);

  // If already logged in (cookie-based), redirect to admin.
  // Hit our own /api/admin/verify route — it checks the frontend-domain cookie.
  useEffect(() => {
    fetch(`/api/admin/verify`)
      .then((res) => {
        if (res.ok) router.replace("/admin");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#999", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading…</div>
    </div>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (captchaRequired && !captchaToken) {
      setError("Please complete the captcha.");
      return;
    }
    setLoading(true);
    try {
      // Posts to our own route handler so the cookie is set on the frontend's domain.
      const res = await fetch(`/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken: captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid credentials");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="bg-white border border-black/10 rounded-2xl shadow-sm p-10 w-full max-w-sm">
        <h1 className="text-[11px] font-bold tracking-widest uppercase text-black/50 mb-1">Creative Kid's</h1>
        <h2 className="text-2xl font-light text-black mb-8">Admin Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              autoComplete="username"
              className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-black"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              autoComplete="current-password"
              className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-black"
              placeholder="••••••••"
            />
          </div>
          <Turnstile onToken={setCaptchaToken} />
          {error && <p className="text-[12px] text-red-500">{error}</p>}
          <button
            type="submit" disabled={loading || (captchaRequired && !captchaToken)}
            className="w-full bg-black text-white py-3 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
