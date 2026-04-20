"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Heart, ChevronLeft, ChevronRight, Volume2, VolumeX, Eye } from "lucide-react";
import { safeFetch } from "@/lib/safeFetch";
import { cleanTitle } from "@/lib/cleanTitle";
import MediaRenderer, { isVideo } from "@/components/MediaRenderer";
import { useCart } from "@/context/CartContext";
import { memo, useCallback } from "react";
import QuickViewModal from "@/components/QuickViewModal";

const OLD_BANNER = { imageUrl: "/images/321.png", tag: "Baby & Kids", title: "The Spring Collection", ctaHref: "/shop", ctaLabel: "Explore Collection" };
const DEFAULT_CATEGORIES = [
  { label: "Dress", targetUrl: "/shop/kids-girl/dresses", imageUrl: "/images/Dress.png" },
  { label: "Shorts", targetUrl: "/shop/kids-girl/shorts-skirts-skorts", imageUrl: "/images/shorts.jpg" },
  { label: "Infants", targetUrl: "/shop/baby-boy/onesies-rompers", imageUrl: "/images/infant.png" },
  { label: "Clothing Sets", targetUrl: "/shop/baby-girl/clothing-sets", imageUrl: "/images/clothing set.png" },
];

// Defined outside Home so React never remounts cards on wishlist state changes
// Skeleton card shown while products are loading
function GridCardSkeleton() {
  return (
    <div className="w-full flex flex-col">
      <div className="w-full aspect-[3/4] bg-[#f0efed] animate-pulse mb-3 sm:mb-4" />
      <div className="px-0.5 sm:px-1">
        <div className="h-3 bg-[#f0efed] animate-pulse rounded w-3/4 mb-2" />
        <div className="h-3 bg-[#f0efed] animate-pulse rounded w-1/3" />
      </div>
    </div>
  );
}

// Wrap in React.memo with fine-grained comparison — only re-render when this
// card's product data or its own wishlist status changes.
const GridCard = memo(function GridCard({ product, wishlist, toggleWishlist, onQuickView }) {
  const { addToCart } = useCart();

  if (!product) {
    return (
      <div className="w-full flex flex-col group">
        <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] border border-dashed border-black/10 flex flex-col items-center justify-center text-center p-4 mb-3 sm:mb-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-black/30">Empty Slot</span>
          <span className="text-[9px] tracking-widest uppercase text-black/20 mt-1">Assign in Admin</span>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full flex flex-col group">
      <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-3 sm:mb-4">
        {/* Wishlist button */}
        <button onClick={(e) => toggleWishlist(e, product.id)} className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 p-1 hover:scale-110 transition-transform">
          <Heart strokeWidth={1} size={18} className={wishlist.has(product.id) ? "fill-red-500 text-red-500" : "text-black hover:fill-black/10 transition-colors"} />
        </button>
        {/* Quick View button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product.id); }}
          className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-sm backdrop-blur-sm"
          title="Quick View"
        >
          <Eye size={14} strokeWidth={1.5} className="text-black" />
        </button>
        <Link href={`/product/${product.id}`} className="absolute inset-0 w-full h-full">
          <MediaRenderer 
            src={(product.hover_videos && Object.values(product.hover_videos).find(v => v)) || product.image_urls?.find(isVideo) || product.image_urls?.[0] || "/images/logo.png"} 
            poster={product.image_urls?.find(u => !isVideo(u))}
            alt={product.title} 
            fill 
            className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out" 
            sizes="(max-width: 768px) 65vw, 25vw" 
            hideVolume 
            hoverPlay
          />
          {/* Add to Cart Overlay Button */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none group-hover:pointer-events-auto">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const variants = (() => { try { return typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []); } catch { return []; } })();
                const availableVariant = variants.find(v => (parseInt(v.stock) || 0) > 0) || variants[0] || {};
                
                addToCart({
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  mrp: product.mrp,
                  image: product.image_urls?.[0] || "/images/logo.png",
                  selectedColor: availableVariant.color && availableVariant.color !== "null" ? availableVariant.color : "Default",
                  selectedSize: availableVariant.size && availableVariant.size !== "null" ? availableVariant.size : "Default",
                  sku: availableVariant.sku || product.sku || null,
                  baseSku: product.sku || null,
                  quantity: 1
                });
              }}
              className="w-full bg-black text-white text-[9px] sm:text-[10px] font-bold tracking-widest uppercase py-2 sm:py-2.5 flex items-center justify-center hover:bg-black/80 transition-colors pointer-events-auto">
              ADD TO CART
            </button>
          </div>
        </Link>
      </div>
      <Link href={`/product/${product.id}`} className="flex flex-col px-0.5 sm:px-1 mt-auto">
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
// Only re-render when this specific product's wishlist state changes
}, (prev, next) => {
  if (prev.product?.id !== next.product?.id) return false;
  const prevWishlisted = prev.wishlist.has(prev.product?.id);
  const nextWishlisted = next.wishlist.has(next.product?.id);
  return prevWishlisted === nextWishlisted;
});

export default function Home() {
  const [girlsProducts, setGirlsProducts] = useState([null, null, null, null]);
  const [bestsellerProducts, setBestsellerProducts] = useState([null, null, null, null]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [swipeStart, setSwipeStart] = useState(null);
  const [swipeEnd, setSwipeEnd] = useState(null);
  
  const isVideo = (url) => url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  const [categoryItems, setCategoryItems] = useState([]);
  const [sectionMeta, setSectionMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(new Set());
  const [quickViewId, setQuickViewId] = useState(null);

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
        if (data.hero && Array.isArray(data.hero.slides) && data.hero.slides.length > 0) {
          setHeroSlides(data.hero.slides);
        } else if (data.hero && data.hero.imageUrl) {
          setHeroSlides([{
            imageUrl: data.hero.imageUrl || null,
            mobileImageUrl: data.hero.mobileImageUrl || null,
            tag: data.hero.tag || "",
            title: data.hero.title || "",
            ctaHref: data.hero.ctaHref || "",
            ctaLabel: data.hero.ctaLabel || "",
          }, OLD_BANNER]);
        } else {
          setHeroSlides([OLD_BANNER]);
        }
        if (Array.isArray(data.categoryItems) && data.categoryItems.length > 0) {
          setCategoryItems(data.categoryItems);
        } else {
          setCategoryItems(DEFAULT_CATEGORIES);
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

  useEffect(() => {
    if (heroSlides.length > 1 && !isVideoPlaying) {
      const interval = setInterval(() => {
        setActiveSlide(prev => (prev + 1) % heroSlides.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroSlides.length, isVideoPlaying]);

  const handleTouchStart = (e) => {
    setSwipeEnd(null);
    setSwipeStart(e.targetTouches[0].clientX);
  };
  const handleTouchMove = (e) => setSwipeEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!swipeStart || !swipeEnd) return;
    const distance = swipeStart - swipeEnd;
    if (distance > 50) {
      setActiveSlide(prev => (prev + 1) % heroSlides.length);
    } else if (distance < -50) {
      setActiveSlide(prev => (prev === 0 ? heroSlides.length - 1 : prev - 1));
    }
  };

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
      {/* 1. HERO BANNER — slider */}
      {isEnabled("hero_banner") && (
      <section 
        className="relative w-full h-[70vh] sm:h-[85vh] md:h-screen flex items-end justify-center overflow-hidden bg-[#f6f5f3]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-[11px] tracking-widest uppercase text-black/40 animate-pulse">Loading Banner...</span>
          </div>
        ) : (
          <>
            {heroSlides.map((slide, index) => {
              const isActive = index === activeSlide;
              const hasVideo = isVideo(slide.imageUrl) || isVideo(slide.mobileImageUrl);
              
              const handleVideoPlay = () => isActive && setIsVideoPlaying(true);
              const handleVideoEnded = () => {
                if (isActive) {
                  setIsVideoPlaying(false);
                  setActiveSlide(prev => (prev + 1) % heroSlides.length);
                }
              };
              
              return (
                <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                  {/* Mobile Media */}
                  {slide.mobileImageUrl && (
                    <div className="absolute inset-0 block md:hidden">
                      {isVideo(slide.mobileImageUrl) ? (
                        <video id={`hero-mobile-video-${index}`} src={slide.mobileImageUrl} autoPlay={isActive} muted={isMuted} playsInline onPlay={handleVideoPlay} onEnded={handleVideoEnded} className="object-cover object-center w-full h-full" />
                      ) : (
                        <Image src={slide.mobileImageUrl} alt={slide.title || "Banner"} fill priority={index === 0} unoptimized className="object-cover object-center" sizes="100vw" />
                      )}
                    </div>
                  )}
                  {/* Desktop Media */}
                  {slide.imageUrl && (
                    <div className={`absolute inset-0 ${slide.mobileImageUrl ? 'hidden md:block' : 'block'}`}>
                      {isVideo(slide.imageUrl) ? (
                        <video id={`hero-desktop-video-${index}`} src={slide.imageUrl} autoPlay={isActive} muted={isMuted} playsInline onPlay={handleVideoPlay} onEnded={handleVideoEnded} className="object-cover object-center w-full h-full" />
                      ) : (
                        <Image src={slide.imageUrl} alt={slide.title || "Banner"} fill priority={index === 0} unoptimized className="object-cover object-center" sizes="100vw" />
                      )}
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/30" />
                  
                  {hasVideo && isActive && (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMuted(!isMuted); }}
                      className="absolute bottom-6 sm:bottom-8 right-4 sm:right-8 z-30 p-2 sm:p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors"
                      aria-label="Toggle Mute"
                    >
                      {isMuted ? <VolumeX className="text-white w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="text-white w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  )}

                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 sm:pb-16 md:pb-24 px-4 text-white text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex flex-col items-center pointer-events-none">
                      <span className="text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase text-white/80 mb-1.5 sm:mb-2">{slide.tag}</span>
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium tracking-wide uppercase mb-3 sm:mb-4 max-w-4xl leading-tight" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>
                        {slide.title}
                      </h1>
                      {slide.ctaHref && slide.ctaLabel && (
                        <Link href={slide.ctaHref} className="text-[10px] sm:text-[11px] font-bold tracking-[0.1em] sm:tracking-[0.15em] uppercase hover:text-white/70 transition-colors pointer-events-auto">{slide.ctaLabel}</Link>
                      )}
                    </motion.div>
                  </div>
                </div>
              );
            })}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
                {heroSlides.map((_, dotIdx) => (
                  <button key={dotIdx} onClick={() => { setIsVideoPlaying(false); setActiveSlide(dotIdx); }} className={`w-2 h-2 rounded-full transition-all duration-300 ${dotIdx === activeSlide ? "bg-white scale-110" : "bg-white/40 hover:bg-white/60"}`} aria-label={`Go to slide ${dotIdx + 1}`} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
      )}

      {/* 2. SHOP BY CATEGORY */}
      {!loading && isEnabled("shop_by_category") && categoryItems.length > 0 && (
      <section className="py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
            <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">{sectionMeta.shop_by_category?.subtitle || "Discover"}</span>
            <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.shop_by_category?.title || "Shop by Category"}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 lg:gap-0 pb-3 sm:pb-4 md:pb-0">
            {categoryItems.map((item, index) => {
              let finalUrl = item.targetUrl || "/shop";
              if (finalUrl.startsWith("/shop/")) {
                const parts = finalUrl.split("/");
                if (parts.length === 4) {
                  finalUrl = `/shop/all/${parts[3]}`;
                }
              }
              const hasCatVideo = isVideo(item.videoUrl);
              return (
                <Link key={`${item.targetUrl}-${index}`} href={finalUrl} className="block w-full group relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <MediaRenderer 
                    src={item.videoUrl || item.imageUrl || "/images/logo.png"} 
                    poster={item.imageUrl} 
                    hoverPlay={true} 
                    alt={item.label || "Category"} 
                    fill 
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" 
                    sizes="(max-width: 768px) 50vw, 25vw" 
                    hideVolume={!hasCatVideo} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 sm:bottom-6 inset-x-0 text-center pointer-events-none">
                    <h3 className="text-white text-[11px] sm:text-[13px] tracking-wide uppercase font-medium shadow-black drop-shadow-md">{item.label || "Category"}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {loading ? (
        <div className="w-full py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
              <div className="h-2.5 bg-[#f0efed] animate-pulse rounded w-20 mb-2" />
              <div className="h-4 bg-[#f0efed] animate-pulse rounded w-40" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[2px] lg:gap-0 pb-3 sm:pb-4">
              {[0,1,2,3].map(i => <GridCardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 3. GIRLS NEW ARRIVALS */}
          {isEnabled("girls_new_arrivals") && (
          <section className="py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
                <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-[#E2889D] mb-1">{sectionMeta.girls_new_arrivals?.subtitle || "Girls"}</span>
                <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.girls_new_arrivals?.title || "New Arrivals"}</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-[2px] lg:gap-0 pb-3 sm:pb-4 md:pb-0">
                {girlsProducts.map((product, index) => (<GridCard key={`girl-${index}`} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onQuickView={setQuickViewId} />))}
              </div>
              <div className="flex justify-center mt-5 sm:mt-6 px-4">
                <Link href="/shop/kids-girl" className="border border-black px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-black hover:bg-black hover:text-white transition-colors">View Collection</Link>
              </div>
            </div>
          </section>
          )}

          {/* 4. SEASON BESTSELLERS */}
          {isEnabled("season_bestsellers") && (
          <section className="py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
                <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">{sectionMeta.season_bestsellers?.subtitle || "Favorites"}</span>
                <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.season_bestsellers?.title || "Season Bestsellers"}</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-[2px] lg:gap-0 pb-3 sm:pb-4 md:pb-0">
                {bestsellerProducts.map((product, index) => (<GridCard key={`best-${index}`} product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onQuickView={setQuickViewId} />))}
              </div>
              <div className="flex justify-center mt-5 sm:mt-6 px-4">
                <Link href="/shop" className="border border-black px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-black hover:bg-black hover:text-white transition-colors">View All</Link>
              </div>
            </div>
          </section>
          )}

          {/* 5. FEATURED COLLECTION */}
          {isEnabled("featured_collection") && (
          <section className="py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
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
                  <div ref={carouselRef} className="flex gap-4 md:gap-0 px-4 md:px-0 overflow-x-auto snap-x snap-mandatory pb-3 sm:pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                    {featuredProducts.map((product, index) => (
                      <div key={`feat-${product.id}-${index}`} className="flex-none w-[75vw] sm:w-[45vw] md:w-[25vw] lg:w-[20vw] snap-start flex flex-col group/card">
                        <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-2 sm:mb-3">
                          <button onClick={(e) => toggleWishlist(e, product.id)} className="absolute top-3 right-3 z-10 p-1 hover:scale-110 transition-transform">
                            <Heart strokeWidth={1} size={16} className={wishlist.has(product.id) ? "fill-red-500 text-red-500" : "text-black hover:fill-black/10 transition-colors"} />
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewId(product.id); }}
                            className="absolute top-3 left-3 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover/card:opacity-100 transition-all shadow-sm backdrop-blur-sm"
                            title="Quick View"
                          >
                            <Eye size={13} strokeWidth={1.5} className="text-black" />
                          </button>
                          <Link href={`/product/${product.id}`} className="absolute inset-0 w-full h-full">
                            <MediaRenderer 
                              src={product.image_urls?.find(isVideo) || product.image_urls?.[0] || "/images/logo.png"} 
                              poster={product.image_urls?.find(u => !isVideo(u))}
                              alt={product.title} 
                              fill 
                              className="object-cover object-center group-hover/card:scale-105 transition-transform duration-700 ease-out" 
                              sizes="(max-width: 768px) 60vw, 25vw" 
                              hideVolume 
                              hoverPlay
                            />
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

      {/* Quick View Modal — rendered at page level so it overlays everything */}
      {quickViewId && (
        <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
      )}
    </main>
  );
}
