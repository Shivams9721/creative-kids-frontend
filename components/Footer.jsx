import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-black/10 py-16 md:py-24 mt-auto">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        
        <div className="flex flex-col md:flex-row justify-between items-start gap-16 md:gap-8">
          
          {/* LEFT: Newsletter Sign Up */}
          <div className="w-full md:w-1/2 lg:w-1/3">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black mb-6">Be the First to Know</h3>
            <p className="text-[11px] tracking-wider text-black/60 uppercase mb-8 leading-loose max-w-sm">
              Discover new arrivals, exclusive offers, and the latest from Creative Kids.
            </p>
            <form className="flex items-center justify-between border-b border-black pb-2 group">
              <input type="email" placeholder="EMAIL ADDRESS" className="w-full bg-transparent text-[11px] tracking-widest uppercase outline-none text-black placeholder:text-black/40" />
              <button type="button" className="pl-4 hover:opacity-50 transition-opacity">
                <ArrowRight strokeWidth={1} size={18} className="text-black group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* MIDDLE: Legal Links */}
          <div className="w-full md:w-auto flex flex-col gap-4">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black mb-2">Legal</h3>
            {[
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

          {/* RIGHT: Corporate Details */}
          <div className="w-full md:w-1/2 lg:w-1/3 flex flex-col md:items-end md:text-right">
            <h3 className="text-[12px] font-bold tracking-widest uppercase text-black mb-6">Creative Impression</h3>
            <p className="text-[11px] tracking-wider text-black/60 uppercase leading-loose mb-6">
              Plot NO.-550A, Sector-37<br />
              Pace City-II, Gurugram<br />
              Haryana 122001
            </p>
            <a href="tel:+911244130381" className="text-[12px] font-bold tracking-widest uppercase text-black hover:opacity-50 transition-opacity">
              Call: +911244130381
            </a>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] tracking-widest uppercase text-black/30">© {new Date().getFullYear()} Creative Kids. All rights reserved.</p>
          <p className="text-[10px] tracking-widest uppercase text-black/30">Made in India 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}