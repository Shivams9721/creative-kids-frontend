"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Instagram, Facebook } from "lucide-react";
import { FooterScene, AnimatedSparkle, SquiggleUnderline } from "@/components/decorations";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [msg, setMsg] = useState("");

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { setStatus("error"); setMsg("Please enter a valid email"); return; }
    setStatus("loading");
    try {
      const res = await fetch(`${API}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMsg(data.message || "You're subscribed!");
        setEmail("");
        setTimeout(() => { setStatus(null); setMsg(""); }, 5000);
      } else {
        setStatus("error");
        setMsg(data.error || "Something went wrong");
      }
    } catch {
      setStatus("error");
      setMsg("Connection error. Try again.");
    }
  };
  return (
    <footer className="w-full bg-white border-t border-black/10 py-10 md:py-24 mt-auto">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-12">
        
        <div className="flex flex-col md:flex-row items-start gap-10 md:gap-10">
          
          {/* LEFT: Newsletter Sign Up */}
          <div className="w-full md:flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-[12px] font-bold tracking-widest uppercase text-black">Be the First to Know</h3>
              <AnimatedSparkle size={12} color="#E2889D" />
            </div>
            <SquiggleUnderline color="#E2889D" className="mb-5" />
            <p className="text-[11px] tracking-wider text-black/60 uppercase mb-8 leading-loose max-w-sm">
              Discover new arrivals, exclusive offers, and the latest from Creative Kid's.
            </p>
            <form onSubmit={subscribe} className="flex items-center justify-between border-b border-black pb-2 group">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="EMAIL ADDRESS" required className="w-full bg-transparent text-[11px] tracking-widest uppercase outline-none text-black placeholder:text-black/40" />
              <button type="submit" disabled={status === "loading"} className="pl-4 hover:opacity-50 transition-opacity">
                {status === "loading"
                  ? <span className="text-[10px] tracking-widest text-black/40">...</span>
                  : <ArrowRight strokeWidth={1} size={18} className="text-black group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
            {msg && (
              <p className={`text-[10px] tracking-widest uppercase mt-3 ${status === "success" ? "text-green-600" : "text-red-500"}`}>
                {msg}
              </p>
            )}
          </div>

          {/* MIDDLE: Legal Links */}
          <div className="w-full md:flex-1 flex flex-col gap-4">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black mb-2">About Us</h3>
            {[
              { label: "Track My Order", href: "/track-order" },
              { label: "My Wishlist", href: "/wishlist" },
              { label: "Terms & Conditions", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Shipping Policy", href: "/shipping-policy" },
              { label: "Cancellation & Refunds", href: "/refund-policy" },
              { label: "Contact Us", href: "/contact" },
            ].map(link => (
              <Link key={link.href} href={link.href} className="text-[11px] tracking-widest uppercase text-black/60 hover:text-black transition-colors">
                {link.label}
              </Link>
            ))}
          </div>

          {/* MIDDLE-RIGHT: Shop Girls */}
          <div className="w-full md:flex-1 flex flex-col">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black mb-4">Explores</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex flex-col gap-4">
                <p className="text-[10px] tracking-widest uppercase text-black/40">Baby</p>
                {[
                  { label: "Onesies & Rompers", slug: "onesies-rompers" },
                  { label: "Tops & Tees", slug: "tops-tees" },
                  { label: "Dresses", slug: "dresses" },
                  { label: "Co-ords & Jumpsuits", slug: "co-ords-jumpsuits" },
                ].map(c => (
                  <Link key={`baby-${c.slug}`} href={`/shop/baby-girl/${c.slug}`} className="text-[11px] tracking-widest uppercase text-black/60 hover:text-black transition-colors">
                    {c.label}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-4">
                <p className="text-[10px] tracking-widest uppercase text-black/40">Kids</p>
                {[
                  { label: "Onesies & Rompers", slug: "onesies-rompers" },
                  { label: "Tops & Tees", slug: "tops-tees" },
                  { label: "Dresses", slug: "dresses" },
                  { label: "Co-ords & Jumpsuits", slug: "co-ords-jumpsuits" },
                ].map(c => (
                  <Link key={`kids-${c.slug}`} href={`/shop/kids-girl/${c.slug}`} className="text-[11px] tracking-widest uppercase text-black/60 hover:text-black transition-colors">
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Corporate Details */}
          <div className="w-full md:flex-1 flex flex-col md:items-end md:text-right">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black mb-6">Creative Impression</h3>
            <p className="text-[11px] tracking-wider text-black/60 uppercase leading-loose mb-6">
              Plot NO.-550A, Sector-37<br />
              Pace City-II, Gurugram<br />
              Haryana 122001
            </p>
            <a href="tel:+911244130381" className="text-[12px] font-bold tracking-widest uppercase text-black hover:opacity-50 transition-opacity">
              Call: +911244130381
            </a>
            <div className="flex gap-4 mt-6 md:justify-end">
              <a href="https://www.instagram.com/creativekids.co.in?igsh=MW4yOXZ3MXF6ZTUzNQ==" target="_blank" rel="noopener noreferrer" className="hover:opacity-50 transition-opacity text-black">
                <Instagram strokeWidth={1.5} size={20} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61564971024317&mibextid=rS40aB7S9Ucbxw6v" target="_blank" rel="noopener noreferrer" className="hover:opacity-50 transition-opacity text-black">
                <Facebook strokeWidth={1.5} size={20} />
              </a>
            </div>
          </div>

        </div>

        <FooterScene className="mt-10 md:mt-12" />

        <div className="pt-6 md:pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-black/30">© {new Date().getFullYear()} Creative Kid's. All rights reserved.</p>
          <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-black/30">Made in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
