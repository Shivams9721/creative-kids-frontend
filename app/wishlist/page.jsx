"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import MediaRenderer, { isVideo } from "@/components/MediaRenderer";
import { Heart, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { safeFetch } from "@/lib/safeFetch";
import { csrfHeaders } from "@/lib/csrf";
import { useRouter } from "next/navigation";
import { Mascot, Heart as DecoHeart, AnimatedSparkle } from "@/components/decorations";

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }

    safeFetch("/api/wishlist", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const parsed = (Array.isArray(data) ? data : []).map(p => ({
          ...p,
          image_urls: (() => { try { return typeof p.image_urls === "string" ? JSON.parse(p.image_urls) : (p.image_urls || []); } catch { return []; } })(),
        }));
        setItems(parsed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const removeItem = async (productId) => {
    setRemoving(productId);
    const token = localStorage.getItem("token");
    try {
      await safeFetch("/api/wishlist/toggle", {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
        credentials: "include",
        body: JSON.stringify({ productId }),
      });
      setItems(prev => prev.filter(i => i.id !== productId));
    } catch {}
    setRemoving(null);
  };

  const moveToCart = (item) => {
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image_urls?.[0] || "",
      selectedColor: "Default",
      selectedSize: "Default",
      quantity: 1,
    });
    removeItem(item.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <Loader2 size={28} className="animate-spin text-black/30" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white pt-[80px] md:pt-[90px] pb-24 px-4 md:px-8">
      <div className="max-w-[1200px] mx-auto">

        <div className="flex items-center gap-3 mb-10">
          <Heart size={24} strokeWidth={1.5} className="text-red-400 fill-red-100" />
          <h1 className="text-2xl md:text-3xl font-light tracking-wide text-black">My Wishlist</h1>
          {items.length > 0 && <span className="text-[11px] tracking-widest uppercase text-black/40 ml-2">({items.length} items)</span>}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <Mascot pose="stand" size={150} />
              <div className="absolute -top-2 -right-6"><DecoHeart size={28} color="#E2889D" /></div>
              <div className="absolute top-4 -left-6"><AnimatedSparkle size={14} color="#F0B95B" /></div>
            </div>
            <h2 className="text-xl font-light text-black mb-2">Your wishlist is empty</h2>
            <p className="text-[13px] text-black/50 mb-8">Save items you love by tapping the heart icon on any product.</p>
            <Link href="/shop" className="bg-black text-white px-8 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">
              Explore Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map(item => (
              <div key={item.id} className="group relative flex flex-col">
                <Link href={`/product/${item.id}`} className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-3 rounded-lg">
                  <MediaRenderer
                    src={(item.hover_videos && Object.values(item.hover_videos).find(v => v)) || item.image_urls?.find(isVideo) || item.image_urls?.[0] || "/images/logo.png"}
                    poster={item.image_urls?.find(u => !isVideo(u))}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    hideVolume
                    hoverPlay
                  />
                </Link>

                {/* Remove button on hover */}
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={removing === item.id}
                  className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-red-50 transition-colors z-10 shadow-sm opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  style={{ opacity: removing === item.id ? 1 : undefined }}
                >
                  <Trash2 size={16} className={removing === item.id ? "text-black/30 animate-spin" : "text-red-400"} />
                </button>

                <Link href={`/product/${item.id}`}>
                  <p className="text-[12px] text-black truncate mb-1">{item.title}</p>
                </Link>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[13px] font-bold text-black">₹{parseFloat(item.price).toFixed(2)}</span>
                  {item.mrp && parseFloat(item.mrp) > parseFloat(item.price) && (
                    <>
                      <span className="text-[11px] text-black/40 line-through">₹{parseFloat(item.mrp).toFixed(2)}</span>
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                      </span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => moveToCart(item)}
                  className="w-full border border-black text-black py-2.5 rounded-full text-[10px] font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} /> Move to Cart
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
