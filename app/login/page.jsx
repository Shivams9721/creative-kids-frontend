"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User as UserIcon, ArrowLeft, CheckCircle2, Eye, EyeOff, Sparkles, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { csrfHeaders } from "@/lib/csrf";
import { safeFetch } from "@/lib/safeFetch";
import Turnstile from "@/components/Turnstile";

// Modes: otp_email | otp_verify | otp_reset_password | login | register | forgot | reset | reset_done | forgot_sent

function LoginContent() {
  const [mode, setMode] = useState("otp_email");
  const [otpPurpose, setOtpPurpose] = useState("login"); // login | reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [showPwField, setShowPwField] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const otpRefs = useRef([]);
  const captchaRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = (() => {
    const r = searchParams.get("redirect");
    return r && r.startsWith("/") && !r.startsWith("//") ? r : "/profile";
  })();

  // Support ?token=xxx for old reset links
  useEffect(() => {
    const t = searchParams.get("token");
    if (t) { setResetToken(t); setMode("reset"); }
  }, [searchParams]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-focus next OTP box
  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // Send OTP
  const sendOtp = async (purposeOverride) => {
    const p = purposeOverride || otpPurpose;
    if (captchaRequired && !captchaToken) { setError("Please complete the captcha."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await safeFetch(`/api/auth/send-otp`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ email, purpose: p, turnstileToken: captchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setMode("otp_verify");
        setOtpPurpose(p);
        setOtp(["", "", "", "", "", ""]);
        setCountdown(60);
        setCaptchaToken("");
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setCaptchaToken("");
        setError(data.error || "Failed to send OTP.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the complete 6-digit OTP."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await safeFetch(`/api/auth/verify-otp`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ email, otp: code, purpose: otpPurpose }),
      });
      const data = await res.json();
      if (res.ok) {
        if (otpPurpose === "login") {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push(redirectTo);
        } else {
          setResetToken(data.resetToken);
          setMode("otp_reset_password");
        }
      } else {
        setError(data.error || "Invalid OTP.");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Reset password after OTP
  const handleOtpResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await safeFetch(`/api/auth/reset-password`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) setMode("reset_done");
      else setError(data.error || "Reset failed.");
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Password login / register
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (captchaRequired && !captchaToken) { setError("Please complete the captcha."); return; }
    setLoading(true);
    setError("");
    setTouched({ email: true, password: true, name: true, confirmPassword: true });
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await safeFetch(`${endpoint}`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ ...formData, turnstileToken: captchaToken }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push(redirectTo);
      } else {
        setError(data.message || "Something went wrong.");
        setCaptchaToken("");
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || formData.email);

  const perks = [
    { icon: <Truck size={15} />, text: "Free shipping on orders above ₹499" },
    { icon: <ShieldCheck size={15} />, text: "Easy 7-day returns" },
    { icon: <Sparkles size={15} />, text: "Exclusive member-only offers" },
  ];

  return (
    <main className="min-h-screen bg-[#f6f5f3] pt-[64px] md:pt-[72px] flex items-stretch">

      {/* LEFT BRAND PANEL — desktop only */}
      <div className="hidden lg:flex lg:w-[42%] bg-black flex-col justify-between p-14 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-[0.04]">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{ width: `${(i+1)*130}px`, height: `${(i+1)*130}px`, top:"50%", left:"50%", transform:"translate(-50%,-50%)" }} />
          ))}
        </div>
        <div className="relative z-10">
          <Link href="/" className="text-white text-2xl font-bold tracking-[0.2em] uppercase">Creative Kid's</Link>
          <p className="text-white/30 text-[11px] tracking-widest uppercase mt-1">Premium Children's Clothing</p>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-white text-4xl font-light leading-snug">Dress them<br />in their best<br />story.</h2>
          <div className="space-y-4 pt-2">
            {perks.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-white/50">
                <span className="text-white/30">{p.icon}</span>
                <span className="text-[12px] tracking-wide">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-white/15 text-[11px] tracking-widest uppercase">creativekids.co.in</p>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-4 py-6 md:p-10">
        <div className="w-full max-w-md">

          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-4">
            <Link href="/" className="text-black text-[13px] font-bold tracking-[0.2em] uppercase">Creative Kid's</Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-black/5 p-5 md:p-10">
            <AnimatePresence mode="wait">

              {/* ── OTP: ENTER EMAIL ── */}
              {mode === "otp_email" && (
                <motion.div key="otp_email" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
                  <div className="mb-7">
                    <h1 className="text-2xl font-light text-black mb-1.5">Sign in / Register</h1>
                    <p className="text-[12px] text-black/50">Enter your email to receive a one-time password.</p>
                  </div>
                  {error && <div className="mb-5 p-3 bg-red-50 text-red-600 text-[12px] rounded-lg border border-red-100">{error}</div>}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && emailValid && sendOtp("login")}
                          placeholder="you@example.com"
                          className="w-full border border-black/20 pl-11 pr-4 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
                      </div>
                    </div>
                    <Turnstile onToken={setCaptchaToken} />
                    <button disabled={loading || !emailValid || (captchaRequired && !captchaToken)} onClick={() => sendOtp("login")}
                      className="w-full bg-black text-white rounded-full py-4 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 group disabled:opacity-40">
                      {loading ? "Sending OTP..." : "Send OTP"}
                      {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                    <div className="relative flex items-center gap-3 my-1">
                      <div className="flex-1 h-px bg-black/10" />
                      <span className="text-[10px] text-black/30 tracking-widest uppercase">or</span>
                      <div className="flex-1 h-px bg-black/10" />
                    </div>
                    <button onClick={() => { setMode("login"); setFormData(f => ({ ...f, email })); setError(""); }}
                      className="w-full border border-black/20 text-black rounded-full py-3.5 text-[12px] font-bold tracking-widest uppercase hover:bg-gray-50 transition-colors">
                      Sign in with Password
                    </button>
                    <p className="text-center text-[11px] text-black/40">
                      New here?{" "}
                      <button onClick={() => { setMode("register"); setFormData(f => ({ ...f, email })); setError(""); }}
                        className="text-black font-bold hover:underline">Create account</button>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── OTP: VERIFY ── */}
              {mode === "otp_verify" && (
                <motion.div key="otp_verify" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
                  <button onClick={() => { setMode("otp_email"); setError(""); }}
                    className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-black/40 hover:text-black mb-6 transition-colors">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div className="mb-7">
                    <h1 className="text-2xl font-light text-black mb-1.5">Enter OTP</h1>
                    <p className="text-[12px] text-black/50">
                      We sent a 6-digit code to <span className="font-bold text-black">{email}</span>
                    </p>
                  </div>
                  {error && <div className="mb-5 p-3 bg-red-50 text-red-600 text-[12px] rounded-lg border border-red-100">{error}</div>}

                  {/* 6-digit OTP boxes */}
                  <div className="flex gap-2 justify-between mb-6" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input key={i} ref={el => otpRefs.current[i] = el}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                          digit ? "border-black bg-black/5" : "border-black/20 focus:border-black"
                        }`} />
                    ))}
                  </div>

                  <button disabled={loading || otp.join("").length < 6} onClick={verifyOtp}
                    className="w-full bg-black text-white rounded-full py-4 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 mb-4">
                    {loading ? "Verifying..." : (otpPurpose === "login" ? "Sign In" : "Verify & Continue")}
                    {!loading && <ArrowRight size={16} />}
                  </button>

                  {/* Resend */}
                  <div className="text-center">
                    {countdown > 0 ? (
                      <p className="text-[12px] text-black/40">Resend OTP in <span className="font-bold text-black">{countdown}s</span></p>
                    ) : (
                      <>
                        <Turnstile onToken={setCaptchaToken} />
                        <button onClick={() => sendOtp(otpPurpose)} disabled={loading || (captchaRequired && !captchaToken)}
                          className="flex items-center gap-1.5 text-[12px] font-bold text-black hover:underline mx-auto disabled:opacity-40">
                          <RefreshCw size={13} /> Resend OTP
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── OTP: SET NEW PASSWORD ── */}
              {mode === "otp_reset_password" && (
                <motion.div key="otp_reset_password" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
                  <div className="mb-7">
                    <h1 className="text-2xl font-light text-black mb-1.5">Set New Password</h1>
                    <p className="text-[12px] text-black/50">OTP verified. Choose a strong new password.</p>
                  </div>
                  {error && <div className="mb-5 p-3 bg-red-50 text-red-600 text-[12px] rounded-lg border border-red-100">{error}</div>}
                  <form onSubmit={handleOtpResetPassword} className="flex flex-col gap-4">
                    {[
                      { label: "New Password", val: newPassword, set: setNewPassword, show: showPassword, toggle: () => setShowPassword(v => !v) },
                      { label: "Confirm Password", val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
                    ].map(f => (
                      <div key={f.label} className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">{f.label}</label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                          <input required type={f.show ? "text" : "password"} minLength={6} value={f.val}
                            onChange={e => f.set(e.target.value)} placeholder="Min. 6 characters"
                            className="w-full border border-black/20 pl-11 pr-10 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
                          <button type="button" onClick={f.toggle}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors">
                            {f.show ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <button disabled={loading} type="submit"
                      className="w-full mt-2 bg-black text-white rounded-full py-4 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                      {loading ? "Updating..." : "Update Password"}
                      {!loading && <ArrowRight size={16} />}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── PASSWORD LOGIN / REGISTER ── */}
              {(mode === "login" || mode === "register") && (
                <motion.div key={mode} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}>
                  <button onClick={() => { setMode("otp_email"); setError(""); setTouched({}); }}
                    className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-black/40 hover:text-black mb-6 transition-colors">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div className="flex gap-6 mb-7 border-b border-black/10">
                    {["login","register"].map(m => (
                      <button key={m} onClick={() => { setMode(m); setError(""); setTouched({}); }}
                        className={`pb-3 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${mode===m?"text-black":"text-black/40"}`}>
                        {m === "login" ? "Sign In" : "Register"}
                        {mode === m && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
                      </button>
                    ))}
                  </div>
                  {error && <div className="mb-5 p-3 bg-red-50 text-red-600 text-[12px] rounded-lg border border-red-100">{error}</div>}
                  <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                    <AnimatePresence>
                      {mode === "register" && (
                        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">Full Name</label>
                          <div className="relative">
                            <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                            <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name"
                              className="w-full border border-black/20 pl-11 pr-4 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">Email Address</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                        <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com"
                          className="w-full border border-black/20 pl-11 pr-4 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-black/60">Password</label>
                        {mode === "login" && (
                          <button type="button" onClick={() => { setEmail(formData.email); setOtpPurpose("reset"); setMode("otp_email"); setError(""); }}
                            className="text-[10px] text-black/50 hover:text-black hover:underline">Forgot?</button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
                        <input required type={showPassword ? "text" : "password"} name="password" minLength={6}
                          value={formData.password} onChange={handleChange} placeholder="Min. 6 characters"
                          className="w-full border border-black/20 pl-11 pr-10 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black transition-colors">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <Turnstile onToken={setCaptchaToken} />
                    <button disabled={loading || (captchaRequired && !captchaToken)} type="submit"
                      className="w-full mt-2 bg-black text-white rounded-full py-4 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50">
                      {loading ? "Processing..." : (mode === "login" ? "Sign In" : "Create Account")}
                      {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ── SUCCESS / RESET DONE ── */}
              {mode === "reset_done" && (
                <motion.div key="reset_done" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                  className="flex flex-col items-center text-center py-6 gap-4">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={36} className="text-green-500" />
                  </div>
                  <h2 className="text-xl font-light text-black">Password Updated!</h2>
                  <p className="text-[12px] text-black/50">Your password has been changed. You can now sign in.</p>
                  <button onClick={() => { setMode("otp_email"); setError(""); setOtp(["","","","","",""]); }}
                    className="mt-2 bg-black text-white rounded-full px-8 py-3 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">
                    Back to Sign In
                  </button>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Forgot password via OTP link — shown on otp_email mode */}
            {mode === "otp_email" && (
              <p className="text-center text-[11px] text-black/40 mt-5">
                Forgot password?{" "}
                <button onClick={() => { setOtpPurpose("reset"); setError(""); }}
                  className="text-black font-bold hover:underline"
                  disabled={!emailValid}
                  title={!emailValid ? "Enter your email first" : ""}
                  onMouseDown={e => { e.preventDefault(); if (emailValid) sendOtp("reset"); }}>
                  Reset via OTP
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
