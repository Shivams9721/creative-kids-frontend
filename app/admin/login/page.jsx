"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Turnstile from "@/components/widgets/Turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function AdminLoginPage() {
  const router = useRouter();

  // Tab between password and email-OTP login.
  const [tab, setTab] = useState("password"); // "password" | "otp"

  // Password flow state.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP flow state.
  const [otpEmail, setOtpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpStep, setOtpStep] = useState("email"); // "email" | "code"
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRequired = !!TURNSTILE_SITE_KEY;

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/verify`)
      .then((res) => {
        if (res.ok) router.replace("/admin");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  // Countdown for OTP resend cooldown.
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#999", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading…</div>
      </div>
    );
  }

  // ── Password login ───────────────────────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (captchaRequired && !captchaToken) { setError("Please complete the captcha."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken: captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Invalid credentials"); return; }
      router.replace("/admin");
    } catch {
      setError("Failed to connect. Please try again.");
    } finally { setLoading(false); }
  };

  // ── OTP login ────────────────────────────────────────────────────────────────
  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (captchaRequired && !captchaToken) { setError("Please complete the captcha."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/login-otp-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, turnstileToken: captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.error || "Could not send code"); return; }
      // Move to code-entry step. We always show this even if backend silently
      // dropped the request for non-admin emails (anti-enumeration).
      setOtpStep("code");
      setOtp("");
      setOtpCountdown(60);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/login-otp-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || data.error || "Invalid OTP"); return; }
      router.replace("/admin");
    } catch {
      setError("Failed to connect. Please try again.");
    } finally { setLoading(false); }
  };

  const switchTab = (next) => {
    setTab(next);
    setError("");
    setOtpStep("email");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="bg-white border border-black/10 rounded-2xl shadow-sm p-10 w-full max-w-sm">
        <h1 className="text-[11px] font-bold tracking-widest uppercase text-black/50 mb-1">Creative Kid's</h1>
        <h2 className="text-2xl font-light text-black mb-6">Admin Login</h2>

        {/* Tab bar */}
        <div className="flex gap-6 mb-6 border-b border-black/10">
          {[
            { k: "password", label: "Password" },
            { k: "otp", label: "Email OTP" },
          ].map((t) => (
            <button
              key={t.k}
              type="button"
              onClick={() => switchTab(t.k)}
              className={`pb-3 text-[11px] font-bold tracking-widest uppercase transition-colors relative ${tab === t.k ? "text-black" : "text-black/40 hover:text-black/70"}`}
            >
              {t.label}
              {tab === t.k && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
            </button>
          ))}
        </div>

        {tab === "password" && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username"
                className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-black"
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-black"
                placeholder="••••••••" />
            </div>
            <Turnstile onToken={setCaptchaToken} />
            {error && <p className="text-[12px] text-red-500">{error}</p>}
            <button type="submit" disabled={loading || (captchaRequired && !captchaToken)}
              className="w-full bg-black text-white py-3 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {tab === "otp" && otpStep === "email" && (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1">Email</label>
              <input type="email" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} required autoComplete="username"
                className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-black"
                placeholder="admin@example.com" />
            </div>
            <p className="text-[11px] text-black/50">We'll email a 6-digit code to this address.</p>
            <Turnstile onToken={setCaptchaToken} />
            {error && <p className="text-[12px] text-red-500">{error}</p>}
            <button type="submit" disabled={loading || (captchaRequired && !captchaToken)}
              className="w-full bg-black text-white py-3 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors disabled:opacity-50">
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        )}

        {tab === "otp" && otpStep === "code" && (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-[12px] text-black/60">
              Code sent to <b>{otpEmail}</b>. Check your inbox (and spam folder).
            </p>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1">6-digit code</label>
              <input type="text" inputMode="numeric" maxLength={6} autoFocus
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[18px] tracking-[0.3em] font-mono outline-none focus:border-black text-center"
                placeholder="123456" required />
            </div>
            {error && <p className="text-[12px] text-red-500">{error}</p>}
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full bg-black text-white py-3 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors disabled:opacity-50">
              {loading ? "Verifying..." : "Verify"}
            </button>
            <div className="flex justify-between items-center text-[11px]">
              <button type="button" onClick={() => { setOtpStep("email"); setOtp(""); setError(""); }}
                className="text-black/50 hover:text-black tracking-widest uppercase">
                ← Use different email
              </button>
              <button type="button" disabled={otpCountdown > 0 || loading}
                onClick={(ev) => sendOtp(ev)}
                className="text-black/70 hover:text-black tracking-widest uppercase disabled:opacity-40">
                {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
