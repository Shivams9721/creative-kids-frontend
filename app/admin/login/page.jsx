"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";
import { safeFetch } from "@/lib/safeFetch";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await safeFetch(`/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("adminToken", data.token);
        // Also set a cookie so the edge middleware can protect /admin routes
        document.cookie = `adminToken=${data.token}; path=/; max-age=43200; SameSite=Strict`;
        window.location.href = "/admin/dashboard";
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    // The fixed inset-0 z-[100] completely covers the customer Navbar and Footer!
    <div className="fixed inset-0 z-[100] bg-[#0f172a] flex items-center justify-center p-4">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-3xl shadow-2xl w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <LockKeyhole size={28} className="text-white" />
          </div>
        </div>
        
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-white mb-2 tracking-wide">Admin Portal</h1>
          <p className="text-white/60 text-[13px]">Authorized personnel only.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-[12px] p-3 rounded-lg mb-6 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase text-white/70 block mb-2">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl p-4 text-[14px] outline-none focus:border-blue-500 transition-colors placeholder:text-white/30"
              placeholder="admin@creativekids.com"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase text-white/70 block mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white rounded-xl p-4 text-[14px] outline-none focus:border-blue-500 transition-colors placeholder:text-white/30"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-widest uppercase text-[12px] py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 mt-4"
          >
            {loading ? "Authenticating..." : "Access Dashboard"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
