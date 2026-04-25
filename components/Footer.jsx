"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Instagram, Facebook } from "lucide-react";
import { FooterScene, AnimatedSparkle } from "@/components/decorations";

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
      <div className="max-w-[1600px] mx-auto px-5 sm:px-6 md:px-12">

        {/* Top: 4-column grid — Brand | Shop | Help | Newsletter */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr] gap-x-6 gap-y-9 md:gap-12 lg:gap-16 mb-10 md:mb-16">

          {/* Col 1: Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-[20px] font-bold tracking-[0.18em] uppercase text-black mb-4">Creative Kid's</h2>
            <p className="text-[11px] leading-[1.8] text-black/60 mb-6 max-w-xs">
              Premium children's clothing crafted with love. Every piece a little adventure, every detail intentional.
            </p>
            <div className="flex gap-3 mb-6">
              <a href="https://www.instagram.com/creativekids.co.in?igsh=MW4yOXZ3MXF6ZTUzNQ==" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 border border-black/20 rounded-full flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors">
                <Instagram strokeWidth={1.5} size={16} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61564971024317&mibextid=rS40aB7S9Ucbxw6v" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 border border-black/20 rounded-full flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors">
                <Facebook strokeWidth={1.5} size={16} />
              </a>
            </div>
            <div className="text-[11px] leading-[1.9] text-black/60">
              <a href="tel:+911244130381" className="block text-black font-medium hover:opacity-60 transition-opacity">+91 124 4130381</a>
              <a href="mailto:info@creativeimpression.in" className="block hover:text-black transition-colors">info@creativeimpression.in</a>
              <span className="block">Mon – Sat · 10:00 AM – 7:00 PM IST</span>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-black mb-5">Shop</h3>
            <ul className="flex flex-col gap-3">
              {[
                { label: "New Arrivals", href: "/shop" },
                { label: "Baby Girl", href: "/shop/baby-girl" },
                { label: "Baby Boy", href: "/shop/baby-boy" },
                { label: "Kids Girl", href: "/shop/kids-girl" },
                { label: "Dresses", href: "/shop/all/dresses" },
                { label: "Tops & Tees", href: "/shop/all/tops-tees" },
                { label: "Co-ords & Jumpsuits", href: "/shop/all/co-ords-jumpsuits" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[11px] tracking-wider uppercase text-black/60 hover:text-black transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Help */}
          <div>
            <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-black mb-5">Help</h3>
            <ul className="flex flex-col gap-3">
              {[
                { label: "Track My Order", href: "/track-order" },
                { label: "Shipping Policy", href: "/shipping-policy" },
                { label: "Returns & Exchange", href: "/refund-policy" },
                { label: "My Wishlist", href: "/wishlist" },
                { label: "Terms & Conditions", href: "/terms" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Contact Us", href: "/contact" },
              ].map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[11px] tracking-wider uppercase text-black/60 hover:text-black transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Newsletter */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-[11px] font-bold tracking-[0.2em] uppercase text-black mb-5 flex items-center gap-2">
              Stay in the Edit
              <AnimatedSparkle size={12} color="#E2889D" />
            </h3>
            <p className="text-[11px] leading-[1.8] text-black/60 mb-4">
              New arrivals, exclusive offers, and parenting notes — delivered to your inbox.
            </p>
            <form onSubmit={subscribe} className="flex items-stretch border border-black/20 rounded overflow-hidden">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" required className="flex-1 bg-transparent px-3 py-2.5 text-[11px] tracking-wider outline-none text-black placeholder:text-black/40" />
              <button type="submit" disabled={status === "loading"} className="px-4 bg-black text-white text-[10px] font-bold tracking-[0.15em] uppercase hover:bg-black/80 transition-colors flex items-center gap-1">
                {status === "loading" ? "..." : <>Join <ArrowRight strokeWidth={1.5} size={12} /></>}
              </button>
            </form>
            {msg && (
              <p className={`text-[10px] tracking-wider uppercase mt-2 ${status === "success" ? "text-green-600" : "text-red-500"}`}>{msg}</p>
            )}
            <p className="text-[9.5px] tracking-wider text-black/30 mt-2">No spam. Unsubscribe at any time.</p>
            <div className="inline-flex items-center gap-1.5 mt-4 px-2.5 py-1 border border-black/15 rounded-full text-[9.5px] tracking-wider text-black/50">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 1l1.2 2.4L9 4.2 7 6.1l.5 2.9L5 7.8 2.5 9 3 6.1 1 4.2l2.8-.8z" /></svg>
              GST: 06AAJPM1384L1ZE
            </div>
          </div>
        </div>

        <FooterScene className="mt-2 md:mt-4" />

        {/* Bottom: copyright + legal */}
        <div className="pt-6 md:pt-8 border-t border-black/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
          <p className="text-[10px] tracking-wider text-black/40">© {new Date().getFullYear()} Creative Kid's · Creative Impression · Gurugram, India</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy" className="text-[10px] tracking-wider text-black/40 hover:text-black transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-[10px] tracking-wider text-black/40 hover:text-black transition-colors">Terms of Service</Link>
            <Link href="/shipping-policy" className="text-[10px] tracking-wider text-black/40 hover:text-black transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
