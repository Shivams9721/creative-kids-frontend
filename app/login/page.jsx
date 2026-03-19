"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User as UserIcon, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { csrfHeaders } from "@/lib/csrf";

const API = process.env.NEXT_PUBLIC_API_URL;

function LoginContent() {
  const [mode, setMode] = useState("login"); // login | register | forgot | reset | reset_done
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support ?token=xxx in URL for reset link
  useState(() => {
    const t = searchParams.get("token");
    if (t) { setResetToken(t); setMode("reset"); }
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login" || mode === "register") {
        const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
        const res = await fetch(`${API}${endpoint}`, {
          method: "POST",
          headers: await csrfHeaders({ "Content-Type": "application/json" }),
          credentials: 'include',
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push("/profile");
        } else {
          setError(data.message || "Something went wrong.");
        }
      }

      if (mode === "forgot") {
        const res = await fetch(`${API}/api/auth/forgot-password`, {
          method: "POST",
          headers: await csrfHeaders({ "Content-Type": "application/json" }),
          credentials: 'include',
          body: JSON.stringify({ email: formData.email }),
        });
        const data = await res.json();
        if (res.ok) {
          setMode("forgot_sent");
        } else {
          setError(data.error || "Something went wrong.");
        }
      }

      if (mode === "reset") {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }
        const res = await fetch(`${API}/api/auth/reset-password`, {
          method: "POST",
          headers: await csrfHeaders({ "Content-Type": "application/json" }),
          credentials: 'include',
          body: JSON.stringify({ token: resetToken, password: formData.password }),
        });
        const data = await res.json();
        if (res.ok) {
          setMode("reset_done");
        } else {
          setError(data.error || "Reset failed.");
        }
      }
    } catch {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-black/20 pl-11 pr-4 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors";

  return (
    <main className="min-h-screen bg-[#f6f5f3] pt-[80px] md:pt-[100px] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-2xl shadow-xl border border-black/5 overflow-hidden relative">

        {/* TABS — only for login/register */}
        {(mode === "login" || mode === "register") && (
          <div className="flex gap-6 mb-8 border-b border-black/10">
            {["login", "register"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`pb-3 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${mode === m ? "text-black" : "text-black/40"}`}>
                {m === "login" ? "Sign In" : "Register"}
                {mode === m && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
              </button>
            ))}
          </div>
        )}

        {/* BACK BUTTON — for forgot/reset */}
        {(mode === "forgot" || mode === "reset") && (
          <button onClick={() => { setMode("login"); setError(""); }} className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-black/50 hover:text-black mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        )}

        <AnimatePresence mode="wait">

          {/* LOGIN / REGISTER */}
          {(mode === "login" || mode === "register") && (
            <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="mb-8">
                <h1 className="text-2xl font-light text-black mb-2">{mode === "login" ? "Welcome Back" : "Create an Account"}</h1>
                <p className="text-[12px] text-black/50">{mode === "login" ? "Enter your details to access your account." : "Join us to check out faster and track your orders."}</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[11px] font-medium rounded-lg border border-red-100">{error}</div>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <AnimatePresence>
                  {mode === "register" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Full Name</label>
                      <div className="relative">
                        <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" className={inputClass} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Password</label>
                    {mode === "login" && (
                      <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="text-[10px] text-black/50 hover:text-black hover:underline">Forgot?</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                    <input required type="password" name="password" minLength={6} value={formData.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
                  </div>
                </div>
                <button disabled={loading} type="submit" className="w-full mt-4 bg-black text-white rounded-full py-4 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50">
                  {loading ? "Processing..." : (mode === "login" ? "Sign In" : "Create Account")}
                  {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </form>
            </motion.div>
          )}

          {/* FORGOT PASSWORD */}
          {mode === "forgot" && (
            <motion.div key="forgot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="mb-8">
                <h1 className="text-2xl font-light text-black mb-2">Reset Password</h1>
                <p className="text-[12px] text-black/50">Enter your email and we'll send you a reset link.</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[11px] font-medium rounded-lg border border-red-100">{error}</div>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Email Address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>
                <button disabled={loading} type="submit" className="w-full mt-2 bg-black text-white rounded-full py-4 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? "Sending..." : "Send Reset Link"}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </motion.div>
          )}

          {/* RESET PASSWORD FORM */}
          {mode === "reset" && (
            <motion.div key="reset" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="mb-8">
                <h1 className="text-2xl font-light text-black mb-2">Set New Password</h1>
                <p className="text-[12px] text-black/50">Choose a strong password for your account.</p>
              </div>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-[11px] font-medium rounded-lg border border-red-100">{error}</div>}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">New Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                    <input required type="password" name="password" minLength={6} value={formData.password} onChange={handleChange} placeholder="••••••••" className={inputClass} />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                    <input required type="password" name="confirmPassword" minLength={6} value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputClass} />
                  </div>
                </div>
                <button disabled={loading} type="submit" className="w-full mt-2 bg-black text-white rounded-full py-4 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? "Updating..." : "Update Password"}
                  {!loading && <ArrowRight size={16} />}
                </button>
              </form>
            </motion.div>
          )}

          {/* SUCCESS STATES */}
          {(mode === "forgot_sent" || mode === "reset_done") && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-6 gap-4">
              <CheckCircle2 size={48} className="text-green-500" />
              <h2 className="text-xl font-light text-black">
                {mode === "reset_done" ? "Password Updated!" : "Check Your Email"}
              </h2>
              <p className="text-[12px] text-black/50">
                {mode === "reset_done" ? "Your password has been changed. You can now sign in." : "If an account exists for that email, a reset link has been sent."}
              </p>
              <button onClick={() => { setMode("login"); setFormData({ name: "", email: "", password: "", confirmPassword: "" }); }}
                className="mt-2 bg-black text-white rounded-full px-8 py-3 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">
                Back to Sign In
              </button>
            </motion.div>
          )}

        </AnimatePresence>
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
