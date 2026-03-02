"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation"; // Added for routing

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // NEW: Connected to our live backend!
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    
    try {
      const response = await fetch(`https://creative-kids-api.onrender.com${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // SUCCESS! Save the token to localStorage to remember them
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirect them to their profile page
        router.push("/profile");
      } else {
        setError(data.message || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f5f3] pt-[80px] md:pt-[100px] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 md:p-10 rounded-2xl shadow-xl border border-black/5 overflow-hidden relative">
        
        <div className="flex gap-6 mb-8 border-b border-black/10">
          <button 
            onClick={() => { setIsLogin(true); setError(""); }}
            className={`pb-3 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${isLogin ? "text-black" : "text-black/40"}`}
          >
            Sign In
            {isLogin && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(""); }}
            className={`pb-3 text-[12px] font-bold tracking-widest uppercase transition-colors relative ${!isLogin ? "text-black" : "text-black/40"}`}
          >
            Register
            {!isLogin && <motion.div layoutId="underline" className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-light text-black mb-2">
            {isLogin ? "Welcome Back" : "Create an Account"}
          </h1>
          <p className="text-[12px] text-black/50">
            {isLogin ? "Enter your details to access your account and track orders." : "Join us to check out faster and track your orders."}
          </p>
        </div>

        {/* Display Errors Here */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-[11px] font-medium rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: "auto" }} 
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-2"
              >
                <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Full Name</label>
                <div className="relative">
                  <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
                  <input required={!isLogin} type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Sarah Jenkins" className="w-full border border-black/20 pl-11 pr-4 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
              <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="sarah@example.com" className="w-full border border-black/20 pl-11 pr-4 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Password</label>
              {isLogin && <Link href="#" className="text-[10px] text-black/50 hover:text-black hover:underline">Forgot?</Link>}
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" />
              <input required type="password" name="password" minLength={6} value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full border border-black/20 pl-11 pr-4 py-3.5 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full mt-4 bg-black text-white rounded-full py-4 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors flex items-center justify-center gap-2 group disabled:opacity-50">
            {loading ? "Processing..." : (isLogin ? "Sign In" : "Create Account")}
            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

      </div>
    </main>
  );
}