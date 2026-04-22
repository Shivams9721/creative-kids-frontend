"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useMemo } from "react";
import { Heart, ChevronLeft, ChevronRight, Volume2, VolumeX, Eye, Star } from "lucide-react";
import { safeFetch } from "@/lib/safeFetch";
import { cleanTitle } from "@/lib/cleanTitle";
import MediaRenderer, { isVideo } from "@/components/MediaRenderer";
import { useCart } from "@/context/CartContext";
import { memo } from "react";
import QuickViewModal from "@/components/QuickViewModal";

const OLD_BANNER = { imageUrl: "/images/321.png", tag: "Baby & Kids", title: "The Spring Collection", ctaHref: "/shop", ctaLabel: "Explore Collection" };
const DEFAULT_CATEGORIES = [
  { label: "Dress", targetUrl: "/shop/kids-girl/dresses", imageUrl: "/images/Dress.png" },
  { label: "Shorts", targetUrl: "/shop/kids-girl/shorts-skirts-skorts", imageUrl: "/images/shorts.jpg" },
  { label: "Infants", targetUrl: "/shop/baby-boy/onesies-rompers", imageUrl: "/images/infant.png" },
  { label: "Clothing Sets", targetUrl: "/shop/baby-girl/clothing-sets", imageUrl: "/images/clothing set.png" },
];

function GridCardSkeleton() {
  return (
    <div className="flex-none w-[75vw] sm:w-[45vw] md:w-[25vw] lg:w-[20vw] flex flex-col">
      <div className="w-full aspect-[3/4] bg-[#f0efed] animate-pulse mb-3 sm:mb-4" />
      <div className="px-0.5 sm:px-1">
        <div className="h-3 bg-[#f0efed] animate-pulse rounded w-3/4 mb-2" />
        <div className="h-3 bg-[#f0efed] animate-pulse rounded w-1/3" />
      </div>
    </div>
  );
}

const GridCard = memo(function GridCard({ product, wishlist, toggleWishlist, onQuickView }) {
  const { addToCart } = useCart();

  if (!product) {
    return (
      <div className="flex-none w-[75vw] sm:w-[45vw] md:w-[25vw] lg:w-[20vw] flex flex-col group/card">
        <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] border border-dashed border-black/10 flex flex-col items-center justify-center text-center p-4 mb-3 sm:mb-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-black/30">Empty Slot</span>
          <span className="text-[9px] tracking-widest uppercase text-black/20 mt-1">Assign in Admin</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex-none w-[75vw] sm:w-[45vw] md:w-[25vw] lg:w-[20vw] flex flex-col group/card">
      <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-2 sm:mb-3">
        <button onClick={(e) => toggleWishlist(e, product.id)} className="absolute top-3 right-3 z-10 p-1 hover:scale-110 transition-transform">
          <Heart strokeWidth={1} size={18} className={wishlist.has(product.id) ? "fill-red-500 text-red-500" : "text-black hover:fill-black/10 transition-colors"} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product.id); }}
          className="absolute top-3 left-3 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover/card:opacity-100 transition-all hover:scale-110 shadow-sm backdrop-blur-sm"
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
            className="object-cover object-center group-hover/card:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 768px) 65vw, 25vw"
            hideVolume
            hoverPlay
          />
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover/card:translate-y-0 transition-transform duration-300 ease-in-out pointer-events-none group-hover/card:pointer-events-auto">
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
              className="w-full bg-black text-white text-[9px] sm:text-[10px] font-bold tracking-widest uppercase py-2 sm:py-2.5 flex items-center justify-center hover:bg-black/80 transition-colors pointer-events-auto"
            >
              ADD TO CART
            </button>
          </div>
        </Link>
      </div>
      <Link href={`/product/${product.id}`} className="flex flex-col px-0.5 sm:px-1 mt-auto">
        <h3 className="text-[11px] sm:text-[12px] text-black mb-0.5 truncate">{cleanTitle(product.title)}</h3>
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
}, (prev, next) => {
  if (prev.product?.id !== next.product?.id) return false;
  const prevWishlisted = prev.wishlist.has(prev.product?.id);
  const nextWishlisted = next.wishlist.has(next.product?.id);
  return prevWishlisted === nextWishlisted;
});

// Swipeable horizontal product carousel (used for New Arrivals, Best Sellers, Featured Collection)
function ProductCarousel({ products, loading, wishlist, toggleWishlist, setQuickViewId, viewAllHref, skeletonCount = 5 }) {
  const ref = useRef(null);
  const scrollBy = (dir) => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir * (window.innerWidth > 1024 ? window.innerWidth * 0.22 : window.innerWidth * 0.5), behavior: "smooth" });
    }
  };
  if (loading) {
    return (
      <div className="flex gap-4 md:gap-0 px-4 md:px-0 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {Array.from({ length: skeletonCount }).map((_, i) => <GridCardSkeleton key={i} />)}
      </div>
    );
  }
  return (
    <div className="relative max-w-[1600px] mx-auto group">
      <button onClick={() => scrollBy(-1)} className="hidden md:flex absolute left-8 lg:left-12 top-[40%] -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full items-center justify-center text-black hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl">
        <ChevronLeft size={20} strokeWidth={1} />
      </button>
      <button onClick={() => scrollBy(1)} className="hidden md:flex absolute right-8 lg:right-12 top-[40%] -translate-y-1/2 z-20 w-10 h-10 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full items-center justify-center text-black hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl">
        <ChevronRight size={20} strokeWidth={1} />
      </button>
      <div ref={ref} className="flex gap-4 md:gap-0 px-4 md:px-0 overflow-x-auto snap-x snap-mandatory pb-3 sm:pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
        {products.map((product, index) => (
          <div key={product ? `prod-${product.id}-${index}` : `empty-${index}`} className="snap-start">
            <GridCard product={product} wishlist={wishlist} toggleWishlist={toggleWishlist} onQuickView={setQuickViewId} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [girlsProducts, setGirlsProducts] = useState([]);
  const [bestsellerProducts, setBestsellerProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [swipeStart, setSwipeStart] = useState(null);
  const [swipeEnd, setSwipeEnd] = useState(null);
  const checkIsVideo = (url) => url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
  const [categoryItems, setCategoryItems] = useState([]);
  const [sectionMeta, setSectionMeta] = useState({});
  const [aboutUsBanner, setAboutUsBanner] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState(new Set());
  const [quickViewId, setQuickViewId] = useState(null);

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
        setGirlsProducts(parse(productMap.girls_new_arrivals || data.newArrivals) || []);
        setBestsellerProducts(parse(productMap.season_bestsellers || data.bestsellers) || []);
        setFeaturedProducts(parse(productMap.featured_collection || data.featured) || []);

        if (data.hero && Array.isArray(data.hero.slides) && data.hero.slides.length > 0) {
          setHeroSlides(data.hero.slides);
        } else if (data.hero && data.hero.imageUrl) {
          setHeroSlides([{ imageUrl: data.hero.imageUrl || null, mobileImageUrl: data.hero.mobileImageUrl || null, tag: data.hero.tag || "", title: data.hero.title || "", ctaHref: data.hero.ctaHref || "", ctaLabel: data.hero.ctaLabel || "" }, OLD_BANNER]);
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

        if (data.aboutUsBanner) setAboutUsBanner(data.aboutUsBanner);
        if (Array.isArray(data.testimonials)) setTestimonials(data.testimonials);

        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Sorted section keys by display_order for dynamic rendering
  const sortedSectionKeys = useMemo(() => {
    return Object.values(sectionMeta)
      .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
      .map(s => s.key);
  }, [sectionMeta]);

  useEffect(() => {
    if (heroSlides.length > 1 && !isVideoPlaying) {
      const interval = setInterval(() => { setActiveSlide(prev => (prev + 1) % heroSlides.length); }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroSlides.length, isVideoPlaying]);

  const handleTouchStart = (e) => { setSwipeEnd(null); setSwipeStart(e.targetTouches[0].clientX); };
  const handleTouchMove = (e) => setSwipeEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (!swipeStart || !swipeEnd) return;
    const distance = swipeStart - swipeEnd;
    if (distance > 50) setActiveSlide(prev => (prev + 1) % heroSlides.length);
    else if (distance < -50) setActiveSlide(prev => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const isEnabled = (key) => sectionMeta[key]?.enabled !== false;

  // ── Section renderers ──────────────────────────────────────────────────────

  const renderHeroBanner = () => (
    isEnabled("hero_banner") && (
      <section
        key="hero_banner"
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
              const hasVideo = checkIsVideo(slide.imageUrl) || checkIsVideo(slide.mobileImageUrl);
              const handleVideoPlay = () => isActive && setIsVideoPlaying(true);
              const handleVideoEnded = () => { if (isActive) { setIsVideoPlaying(false); setActiveSlide(prev => (prev + 1) % heroSlides.length); } };
              return (
                <div key={index} className={`absolute inset-0 transition-opacity duration-1000 ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                  {slide.mobileImageUrl && (
                    <div className="absolute inset-0 block md:hidden">
                      {checkIsVideo(slide.mobileImageUrl)
                        ? <video src={slide.mobileImageUrl} autoPlay={isActive} muted={isMuted} playsInline onPlay={handleVideoPlay} onEnded={handleVideoEnded} className="object-cover object-center w-full h-full" />
                        : <Image src={slide.mobileImageUrl} alt={slide.title || "Banner"} fill priority={index === 0} unoptimized className="object-cover object-center" sizes="100vw" />
                      }
                    </div>
                  )}
                  {slide.imageUrl && (
                    <div className={`absolute inset-0 ${slide.mobileImageUrl ? 'hidden md:block' : 'block'}`}>
                      {checkIsVideo(slide.imageUrl)
                        ? <video src={slide.imageUrl} autoPlay={isActive} muted={isMuted} playsInline onPlay={handleVideoPlay} onEnded={handleVideoEnded} className="object-cover object-center w-full h-full" />
                        : <Image src={slide.imageUrl} alt={slide.title || "Banner"} fill priority={index === 0} unoptimized className="object-cover object-center" sizes="100vw" />
                      }
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30" />
                  {hasVideo && isActive && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMuted(!isMuted); }}
                      className="absolute bottom-6 sm:bottom-8 right-4 sm:right-8 z-30 p-2 sm:p-3 bg-black/40 backdrop-blur-md rounded-full hover:bg-black/60 transition-colors"
                    >
                      {isMuted ? <VolumeX className="text-white w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="text-white w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 sm:pb-16 md:pb-24 px-4 text-white text-center">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex flex-col items-center pointer-events-none">
                      <span className="text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em] font-medium uppercase text-white/80 mb-1.5 sm:mb-2">{slide.tag}</span>
                      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium tracking-wide uppercase mb-3 sm:mb-4 max-w-4xl leading-tight" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{slide.title}</h1>
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
                  <button key={dotIdx} onClick={() => { setIsVideoPlaying(false); setActiveSlide(dotIdx); }} className={`w-2 h-2 rounded-full transition-all duration-300 ${dotIdx === activeSlide ? "bg-white scale-110" : "bg-white/40 hover:bg-white/60"}`} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    )
  );

  const renderShopByCategory = () => (
    !loading && isEnabled("shop_by_category") && categoryItems.length > 0 && (
      <section key="shop_by_category" className="py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
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
                if (parts.length === 4) finalUrl = `/shop/all/${parts[3]}`;
              }
              const hasCatVideo = isVideo(item.videoUrl);
              return (
                <Link key={`${item.targetUrl}-${index}`} href={finalUrl} className="block w-full group relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <MediaRenderer src={item.videoUrl || item.imageUrl || "/images/logo.png"} poster={item.imageUrl} hoverPlay={true} alt={item.label || "Category"} fill className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" sizes="(max-width: 768px) 50vw, 25vw" hideVolume={!hasCatVideo} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 sm:bottom-6 inset-x-0 text-center pointer-events-none">
                    <h3 className="text-white text-[11px] sm:text-[13px] tracking-wide uppercase font-medium drop-shadow-md">{item.label || "Category"}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    )
  );

  const renderNewArrivals = () => (
    isEnabled("girls_new_arrivals") && (
      <section key="girls_new_arrivals" className="py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
        <div className="w-full relative">
          <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
            <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-[#E2889D] mb-1">{sectionMeta.girls_new_arrivals?.subtitle || "Discover"}</span>
            <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.girls_new_arrivals?.title || "New Arrivals"}</h2>
          </div>
          {loading ? (
            <div className="flex gap-4 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
              {[0,1,2,3,4].map(i => <GridCardSkeleton key={i} />)}
            </div>
          ) : girlsProducts.length === 0 ? (
            <div className="w-full p-6 sm:p-8 flex justify-center items-center">
              <p className="text-[10px] sm:text-[11px] tracking-widest uppercase text-black/40">No arrivals configured yet.</p>
            </div>
          ) : (
            <ProductCarousel products={girlsProducts} loading={false} wishlist={wishlist} toggleWishlist={toggleWishlist} setQuickViewId={setQuickViewId} />
          )}
          <div className="flex justify-center mt-5 sm:mt-6 px-4">
            <Link href="/shop/kids-girl" className="border border-black px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-black hover:bg-black hover:text-white transition-colors">View Collection</Link>
          </div>
        </div>
      </section>
    )
  );

  const renderBestsellers = () => (
    isEnabled("season_bestsellers") && (
      <section key="season_bestsellers" className="py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
        <div className="w-full relative">
          <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
            <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">{sectionMeta.season_bestsellers?.subtitle || "Favorites"}</span>
            <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.season_bestsellers?.title || "Season Bestsellers"}</h2>
          </div>
          {loading ? (
            <div className="flex gap-4 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
              {[0,1,2,3,4].map(i => <GridCardSkeleton key={i} />)}
            </div>
          ) : bestsellerProducts.length === 0 ? (
            <div className="w-full p-6 sm:p-8 flex justify-center items-center">
              <p className="text-[10px] sm:text-[11px] tracking-widest uppercase text-black/40">No bestsellers configured yet.</p>
            </div>
          ) : (
            <ProductCarousel products={bestsellerProducts} loading={false} wishlist={wishlist} toggleWishlist={toggleWishlist} setQuickViewId={setQuickViewId} />
          )}
          <div className="flex justify-center mt-5 sm:mt-6 px-4">
            <Link href="/shop" className="border border-black px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-black hover:bg-black hover:text-white transition-colors">View All</Link>
          </div>
        </div>
      </section>
    )
  );

  const renderFeaturedCollection = () => (
    isEnabled("featured_collection") && (
      <section key="featured_collection" className="py-5 sm:py-6 md:py-8 bg-white border-b border-black/5">
        <div className="w-full relative">
          <div className="flex flex-col items-center mb-4 sm:mb-6 px-3 sm:px-4 md:px-8">
            <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">{sectionMeta.featured_collection?.subtitle || "Trending Now"}</span>
            <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.featured_collection?.title || "Featured Collection"}</h2>
          </div>
          {loading ? (
            <div className="flex gap-4 px-4 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
              {[0,1,2,3,4].map(i => <GridCardSkeleton key={i} />)}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="w-full p-6 sm:p-8 flex justify-center items-center">
              <p className="text-[10px] sm:text-[11px] tracking-widest uppercase text-black/40">No items in Featured Collection yet.</p>
            </div>
          ) : (
            <ProductCarousel products={featuredProducts} loading={false} wishlist={wishlist} toggleWishlist={toggleWishlist} setQuickViewId={setQuickViewId} />
          )}
          <div className="flex justify-center mt-5 sm:mt-6 px-4">
            <Link href="/shop" className="border border-black px-6 sm:px-8 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold tracking-wide uppercase text-black hover:bg-black hover:text-white transition-colors">Discover All</Link>
          </div>
        </div>
      </section>
    )
  );

  const renderAboutUsBanner = () => {
    if (!isEnabled("about_us_banner") || !aboutUsBanner) return null;
    const { imageUrl, mobileImageUrl, title, subtitle, description, ctaLabel, ctaHref } = aboutUsBanner;
    if (!imageUrl && !mobileImageUrl) return null;
    return (
      <section key="about_us_banner" className="relative w-full overflow-hidden bg-[#f6f5f3]" style={{ minHeight: "40vh" }}>
        {mobileImageUrl && (
          <div className="absolute inset-0 block md:hidden">
            {checkIsVideo(mobileImageUrl)
              ? <video src={mobileImageUrl} autoPlay muted loop playsInline className="object-cover object-center w-full h-full" />
              : <Image src={mobileImageUrl} alt={title || "About Us"} fill unoptimized className="object-cover object-center" sizes="100vw" />
            }
          </div>
        )}
        <div className={`absolute inset-0 ${mobileImageUrl ? "hidden md:block" : "block"}`}>
          {imageUrl && (checkIsVideo(imageUrl)
            ? <video src={imageUrl} autoPlay muted loop playsInline className="object-cover object-center w-full h-full" />
            : <Image src={imageUrl} alt={title || "About Us"} fill unoptimized className="object-cover object-center" sizes="100vw" />
          )}
        </div>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20 md:py-28 text-white">
          {subtitle && <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-white/70 mb-2">{subtitle}</span>}
          {title && <h2 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-wide uppercase mb-4 max-w-2xl" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{title}</h2>}
          {description && <p className="text-[12px] sm:text-[13px] text-white/80 max-w-lg mb-6 leading-relaxed">{description}</p>}
          {ctaHref && ctaLabel && (
            <Link href={ctaHref} className="border border-white px-7 py-2.5 text-[10px] sm:text-[11px] font-bold tracking-widest uppercase text-white hover:bg-white hover:text-black transition-colors">
              {ctaLabel}
            </Link>
          )}
        </div>
      </section>
    );
  };

  const renderTestimonials = () => {
    if (!isEnabled("testimonials") || !testimonials || testimonials.length === 0) return null;
    return (
      <section key="testimonials" className="py-8 sm:py-10 md:py-14 bg-[#faf9f7] border-b border-black/5">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <span className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase text-black/40 mb-1">{sectionMeta.testimonials?.subtitle || "Reviews"}</span>
            <h2 className="text-base sm:text-lg md:text-xl font-medium text-black tracking-wide uppercase text-center" style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}>{sectionMeta.testimonials?.title || "What Parents Say"}</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
            {testimonials.map((t, i) => (
              <div key={i} className="flex-none w-[85vw] sm:w-[45vw] md:w-[30vw] lg:w-[22vw] snap-start bg-white border border-black/8 p-5 sm:p-6 flex flex-col">
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} size={13} strokeWidth={0} className={star <= (t.rating || 5) ? "fill-[#f59e0b]" : "fill-black/10"} />
                  ))}
                </div>
                {/* Review text */}
                {t.review && <p className="text-[12px] sm:text-[13px] text-black/70 leading-relaxed mb-4 flex-1">"{t.review}"</p>}
                {/* Reviewer */}
                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-black/6">
                  {t.imageUrl ? (
                    <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-[#f6f5f3]">
                      <Image src={t.imageUrl} alt={t.name || "Reviewer"} fill unoptimized className="object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#f0efed] flex-shrink-0 flex items-center justify-center">
                      <span className="text-[11px] font-bold text-black/40">{(t.name || "?")[0]?.toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-[11px] sm:text-[12px] font-medium text-black tracking-wide">{t.name || "Happy Customer"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const SECTION_RENDERERS = {
    hero_banner: renderHeroBanner,
    shop_by_category: renderShopByCategory,
    girls_new_arrivals: renderNewArrivals,
    season_bestsellers: renderBestsellers,
    featured_collection: renderFeaturedCollection,
    about_us_banner: renderAboutUsBanner,
    testimonials: renderTestimonials,
  };

  // Fallback order when API hasn't loaded yet or section meta is empty
  const FALLBACK_ORDER = ["hero_banner", "girls_new_arrivals", "shop_by_category", "about_us_banner", "season_bestsellers", "featured_collection", "testimonials"];
  const renderOrder = sortedSectionKeys.length > 0 ? sortedSectionKeys : FALLBACK_ORDER;

  return (
    <main className="min-h-screen bg-white">
      {renderOrder.map(key => {
        const renderer = SECTION_RENDERERS[key];
        return renderer ? renderer() : null;
      })}

      {quickViewId && <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />}
    </main>
  );
}
