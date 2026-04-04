"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => { console.error("App error:", error?.message); }, [error]);
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-xl font-light tracking-widest uppercase text-black mb-4">Something went wrong</h2>
      <p className="text-[12px] text-black/50 mb-6">An unexpected error occurred. Please try again.</p>
      <button onClick={reset} className="bg-black text-white px-8 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">
        Try Again
      </button>
    </div>
  );
}
