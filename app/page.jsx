"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { safeFetch } from "@/lib/safeFetch";
import { cleanTitle } from "@/lib/cleanTitle";

const DEFAULT_HERO = { imageUrl: "/images/321.png", tag: "Baby & Kids", title: "The Spring Collection", ctaHref: "/shop", ctaLabel: "Explore Collection" };
const DEFAULT_CATEGORIES = [
  { label: "Dress", targetUrl: "/shop/kids-girl/dresses", imageUrl: "/images/Dress.png" },
  { label: "Shorts", targetUrl: "/shop/kids-girl/shorts-skirts-skorts", imageUrl: "/images/shorts.jpg" },
  { label: "Infants", targetUrl: "/shop/baby-boy/onesies-rompers", imageUrl: "/images/infant.png" },
  { label: "Clothing Sets", targetUrl: "/shop/baby-girl/clothing-sets", imageUrl: "/images/clothing set.png" },
];

// Defined outside Home so React never remounts cards on wishlist state changes
function GridCard({ product, wishlist, toggleWishlist }) {
  if (!product) {
    return (
      <div className="flex-none w-[65vw] sm:w-[45vw] md:w-auto snap-start flex flex-col group">
        <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] border border-dashed border-black/10 flex flex-col items-center justify-center text-center p-4 mb-3 sm:mb-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-black/30">Empty Slot</span>
          <span className="text-[9px] tracking-widest uppercase text-black/20 mt-1">Assign in Admin</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-none w-[65vw] sm:w-[45vw] md:w-auto snap-start flex flex-col group">
      <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-3 sm:mb-4">
        <button onClick={(e) => toggleWishlist(e, product.id)} className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 p-1 hover:scale-110 transition-transform">
          <Heart strokeWidth={1} size={18} className={wishlist.has(product.id) ? "fill-red-500 text-red-500" : "text-black hover:fill-black/10 transition-colors"} />
        </button>
        <Link href={`/product/${product.id}`} className="absolute inset-0 w-full h-full">
          <Image src={product.image_urls?.[0] || "/images/logo.png"} alt={product.title} fill className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 768px) 65vw, 25vw" />
        </Link>
      </div>
      <Link href={`/product/${product.id}`} className="flex flex-col px-0.5 sm:px-1">
        <h3 className="text-[11px] sm:text-[13px] text-black mb-0.5 sm:mb-1 truncate">{cleanTitle(product.title)}</h3>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
          <p className="text-[11px] sm:text-[12px] text-black font-medium">₹{product.price ? parseFloat(product.price).toFixed(2) : "0.00"}</p>
          {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
            <>
              <p className="text-[9px] sm:text-[10px] text-black/40 line-through">₹{parseFloat(product.mrp).toFixed(2)}</p>
              <span className="text-[8px] sm:text-[9px] font-bold text-[#D32F2F]">({Math.round(((parseFloat(product.mrp) - parseFloat(product.price)) / parseFloat(product.mrp)) * 100)}% OFF)</span>
            </>
          )}
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const [girlsProducts, setGirlsProducts] = useState([null, null, null, null]);
  const [bestsellerProducts, setBestsellerProducts] = useState([null, null, null, null]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [heroSlide, setHeroSlide] = useState(DEFAULT_HERO);
  const [categoryItems, setCategoryItems] = useState(DEFAULT_CATEGORIES);
  const [sectionMeta, setSectionMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(new Set());

  const carouselRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    safeFetch(`/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setWishlist(new Set(data.map(p => p.id))); })
      .catch(() => {});
  }, []);

  const toggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    try {
      await safeFetch(`/api/wishlist/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
      setWishlist(prev => {
        const next = new Set(prev);
        next.has(productId) ? next.delete(productId) : next.add(productId);
        return next;
      });
    } catch {}
  };

  useEffect(() => {
    safeFetch(`/api/homepage-v2`)
      .then(r => r.json())
      .then(data => {
        const parse = (arr) => (arr || []).map(p => ({
          ...p,
          image_urls: (() => { try { return typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (p.image_urls || []); } catch { return []; } })()
        }));
        const productMap = data.products || {};
        setGirlsProducts(parse(productMap.girls_new_arrivals || data.newArrivals) || [null, null, null, null]);
        setBestsellerProducts(parse(productMap.season_bestsellers || data.bestsellers) || [null, null, null, null]);
        setFeaturedProducts(parse(productMap.featured_collection || data.featured) || []);
        if (data.hero) {
          setHeroSlide({
            imageUrl: data.hero.imageUrl || DEFAULT_HERO.imageUrl,
            mobileImageUrl: data.hero.mobileImageUrl || null,
            tag: data.hero.tag || DEFAULT_HERO.tag,
            title: data.hero.title || DEFAULT_HERO.title,
            ctaHref: data.hero.ctaHref || DEFAULT_HERO.ctaHref,
            ctaLabel: data.hero.ctaLabel || DEFAULT_HERO.ctaLabel,
          });
        }
        if (Array.isArray(data.categoryItems) && data.categoryItems.length > 0) {
          setCategoryItems(data.categoryItems);
        }
        if (Array.isArray(data.sections)) {
          const map = {};
          data.sections.forEach((s) => { map[s.key] = s; });
          setSectionMeta(map);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -(window.innerWidth > 1024 ? window.innerWidth * 0.22 : window.innerWidth * 0.5), behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: (window.innerWidth > 1024 ? window.innerWidth * 0.22 : window.innerWidth * 0.5), behavior: "smooth" });
    }
  };

  const isEnabled = (key) => sectionMeta[key]?.enabled !== false;

  return (
    <main className="min-h-screen bg-white">
      {/* 1. HERO BANNER — single static */}
      {isEnabled("hero_banner") && (
      <section className="relative w-full h-[70vh] sm:h-[85vh] md:h-screen flex items-end justify-center overflow-hidden pb-12 sm:pb-16 md:pb-24">
        {/* Mobile hero image (if uploaded) — shown only on small screens */}
        {heroSlide.mobileImageUrl && (
          <Image src={heroSlide.mobileImageUrl} alt={heroSlide.title} fill unoptimized className="object-cover object-center block md:hidden" sizes="100vw" />
        )}
        {/* Desktop hero image — hidden on mobile if mobile image exists, always shown on md+ */}
        <Image src={heroSlide.imageUrl} alt={heroSlide.title} fill priority unoptimized className={`object-cover object-center ${heroSlide.mobileImageUrl ? 'hidden md:block' : ''}`} sizes="100vw" />
        <div className="absolute inset-0 bg-black/30" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative z-10 flex flex-col items-center text-center px-4 text-white">
          <span className="text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase text-white/80 mb-1.5 sm:mb-2">{heroSlide.tag}</span>
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium tracking-wide uppercase mb-3 sm:mb-4 max-w-4xl leading-tight" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>
            {heroSlide.title}
          </h1>
          <Link href={heroSlide.ctaHref} className="text-[10px] sm:text-[11px] font-bold tracking-[0.1em] sm:tracking-[0.15em] uppercase hover:text-white/70 transition-colors">{heroSlide.ctaLabel}</Link>
        </motion.div>
      </section>
      )}

      {/* 2. SHOP BY CATEGORY */}
      {isEnabled("shop_by_category") && (
      <section className="py-8 sm:py-10 md:py-12 bg-white border-b border-black/5">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
            <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">{sectionMeta.shop_by_category?.subtitle || "Discover"}</span>
            <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.shop_by_category?.title || "Shop by Category"}</h2>
          </div>
          <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-0 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-3 sm:pb-4 md:pb-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {categoryItems.map((item, index) => {
              let finalUrl = item.targetUrl || "/shop";
              if (finalUrl.startsWith("/shop/")) {
                const parts = finalUrl.split("/");
                // Convert /shop/[category]/[item_type] to /shop/all/[item_type]
                if (parts.length === 4) {
                  finalUrl = `/shop/all/${parts[3]}`;
                }
              }
              return (
                <Link key={`${item.targetUrl}-${index}`} href={finalUrl} className="flex-none w-[60vw] sm:w-[40vw] md:w-auto snap-start block group relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <Image src={item.imageUrl || "/images/logo.png"} alt={item.label || "Category"} fill className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" sizes="(max-width: 768px) 60vw, 25vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 sm:bottom-6 inset-x-0 text-center"><h3 className="text-white text-[11px] sm:text-[13px] tracking-wide uppercase font-medium">{item.label || "Category"}</h3></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {loading ? (
        <div className="w-full h-40 flex justify-center items-center">
          <span className="text-[11px] tracking-widest uppercase text-black animate-pulse">Curating...</span>
        </div>
      ) : (
        <>
          {/* 3. GIRLS NEW ARRIVALS */}
          {isEnabled("girls_new_arrivals") && (
          <section className="py-8 sm:py-10 md:py-12 bg-white border-b border-black/5">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
                <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-[#E2889D] mb-1">{sectionMeta.girls_new_arrivals?.subtitle || "Girls"}</span>
                <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.girls_new_arrivals?.title || "New Arrivals"}</h2>
              </div>
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-0 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-3 sm:pb-4 md:pb-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                {girlsProducts.map((product, index) => (<GridCard key={`girl-${index}`} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} />))}
              </div>
              <div className="flex justify-center mt-5 sm:mt-6 px-4">
                <Link href="/shop/kids-girl" className="border border-black px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-black hover:bg-black hover:text-white transition-colors">View Collection</Link>
              </div>
            </div>
          </section>
          )}

          {/* 4. SEASON BESTSELLERS */}
          {isEnabled("season_bestsellers") && (
          <section className="py-8 sm:py-10 md:py-12 bg-white border-b border-black/5">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
                <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">{sectionMeta.season_bestsellers?.subtitle || "Favorites"}</span>
                <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.season_bestsellers?.title || "Season Bestsellers"}</h2>
              </div>
              <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-0 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-3 sm:pb-4 md:pb-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                {bestsellerProducts.map((product, index) => (<GridCard key={`best-${index}`} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} />))}
              </div>
              <div className="flex justify-center mt-5 sm:mt-6 px-4">
                <Link href="/shop" className="border border-black px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-black hover:bg-black hover:text-white transition-colors">View All</Link>
              </div>
            </div>
          </section>
          )}

          {/* 5. FEATURED COLLECTION */}
          {isEnabled("featured_collection") && (
          <section className="py-8 sm:py-10 md:py-12 bg-white border-b border-black/5">
            <div className="w-full relative">
              <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
                <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">{sectionMeta.featured_collection?.subtitle || "Trending Now"}</span>
                <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.featured_collection?.title || "Featured Collection"}</h2>
              </div>
              {featuredProducts.length === 0 ? (
                <div className="w-full p-6 sm:p-8 flex justify-center items-center">
                  <p className="text-[10px] sm:text-[11px] tracking-widest uppercase text-black/40">No items tagged for Featured Collection yet.</p>
                </div>
              ) : (
                <div className="relative max-w-[1600px] mx-auto group">
                  <button onClick={scrollLeft} className="hidden md:flex absolute left-8 lg:left-12 top-[40%] -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full items-center justify-center text-black hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl">
                    <ChevronLeft size={20} strokeWidth={1} />
                  </button>
                  <button onClick={scrollRight} className="hidden md:flex absolute right-8 lg:right-12 top-[40%] -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full items-center justify-center text-black hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl">
                    <ChevronRight size={20} strokeWidth={1} />
                  </button>
                  <div ref={carouselRef} className="flex gap-0 overflow-x-auto snap-x snap-mandatory pb-3 sm:pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                    {featuredProducts.map((product, index) => (
                      <div key={`feat-${product.id}-${index}`} className="flex-none w-[60vw] sm:w-[40vw] md:w-[28vw] lg:w-[20vw] snap-start flex flex-col group/card">
                        <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-2 sm:mb-3">
                          <button onClick={(e) => toggleWishlist(e, product.id)} className="absolute top-3 right-3 z-10 p-1 hover:scale-110 transition-transform">
                            <Heart strokeWidth={1} size={16} className={wishlist.has(product.id) ? "fill-red-500 text-red-500" : "text-black hover:fill-black/10 transition-colors"} />
                          </button>
                          <Link href={`/product/${product.id}`} className="absolute inset-0 w-full h-full">
                            <Image src={product.image_urls?.[0] || "/images/logo.png"} alt={product.title} fill className="object-cover object-center group-hover/card:scale-105 transition-transform duration-700 ease-out" sizes="(max-width: 768px) 60vw, 25vw" />
                          </Link>
                        </div>
                        <Link href={`/product/${product.id}`} className="flex flex-col px-0.5 sm:px-1">
                          <h3 className="text-[11px] sm:text-[12px] text-black mb-0.5 truncate">{cleanTitle(product.title)}</h3>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <p className="text-[11px] sm:text-[12px] text-black font-medium">₹{product.price ? parseFloat(product.price).toFixed(2) : "0.00"}</p>
                            {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                              <span className="text-[8px] sm:text-[9px] font-bold text-[#D32F2F]">{Math.round(((parseFloat(product.mrp) - parseFloat(product.price)) / parseFloat(product.mrp)) * 100)}% OFF</span>
                            )}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-center mt-5 sm:mt-6 px-4">
                <Link href="/shop" className="border border-black px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-black hover:bg-black hover:text-white transition-colors">Discover All</Link>
              </div>
            </div>
          </section>
          )}
        </>
      )}
    </main>
  );
}
