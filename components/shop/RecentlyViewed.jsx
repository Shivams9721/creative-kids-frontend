"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "ck_recently_viewed";
const MAX_ITEMS = 4;

// Call this from product pages to record a view
export function recordView(product) {
  if (typeof window === "undefined") return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = existing.filter(p => p.id !== product.id);
    const updated = [
      { id: product.id, title: product.title, price: product.price, image: product.image_urls?.[0] || "" },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

// Strip shown on browse pages (homepage, shop)
export default function RecentlyViewed() {
  const [items, setItems] = useState([]);
  const pathname = usePathname();

  // Hide on product, checkout, cart, admin pages
  const hidden = pathname?.startsWith("/product") ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/success");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setItems(saved);
    } catch {}
  }, [pathname]);

  if (hidden || items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-black/10 shadow-2xl">
      <div className="max-w-[1600px] mx-auto px-4 py-2 flex items-center gap-3">
        <span className="text-[9px] font-bold tracking-widest uppercase text-black/40 flex-shrink-0 hidden sm:block">
          Recently Viewed
        </span>
        <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden flex-1" style={{ scrollbarWidth: "none" }}>
          {items.map(item => (
            <Link
              key={item.id}
              href={`/product/${item.id}`}
              className="flex-shrink-0 flex items-center gap-2 border border-black/10 rounded-lg px-2 py-1.5 hover:border-black transition-colors bg-white"
            >
              {item.image && (
                <div className="w-8 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0 relative">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-black truncate max-w-[80px]">{item.title}</p>
                <p className="text-[10px] text-black/50">₹{parseFloat(item.price).toFixed(0)}</p>
              </div>
            </Link>
          ))}
        </div>
        <button
          onClick={() => { localStorage.removeItem(STORAGE_KEY); setItems([]); }}
          className="flex-shrink-0 text-black/20 hover:text-black transition-colors text-[18px] leading-none"
          aria-label="Clear recently viewed"
        >
          ×
        </button>
      </div>
    </div>
  );
}
