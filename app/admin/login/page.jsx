"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Turnstile from "@/components/widgets/Turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("creds"); // "creds" | "mfa"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [code, setCode] = useState("");
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
      // 2FA required → switch to MFA step.
      if (data.requires_totp && data.mfa_token) {
        setMfaToken(data.mfa_token);
        setStep("mfa");
        setCode("");
        return;
      }
      router.replace("/admin");
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/login-mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfa_token: mfaToken, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid code");
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
        <h2 className="text-2xl font-light text-black mb-8">{step === "mfa" ? "Two-Factor Code" : "Admin Login"}</h2>

        {step === "creds" && (
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
        )}

        {step === "mfa" && (
          <form onSubmit={handleMfa} className="space-y-4">
            <p className="text-[12px] text-black/60 -mt-4 mb-2">
              Enter the 6-digit code from your authenticator app, or one of your backup codes.
            </p>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1">Code</label>
              <input
                type="text"
                inputMode="text"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, "").slice(0, 12))}
                placeholder="123456"
                className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[18px] tracking-[0.3em] font-mono outline-none focus:border-black text-center"
                required
              />
            </div>
            {error && <p className="text-[12px] text-red-500">{error}</p>}
            <button
              type="submit" disabled={loading || !code}
              className="w-full bg-black text-white py-3 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("creds"); setError(""); setCode(""); setMfaToken(""); }}
              className="w-full text-[11px] tracking-widest uppercase text-black/50 hover:text-black"
            >
              ← Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
