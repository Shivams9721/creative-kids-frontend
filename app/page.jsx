"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const [girlsProducts, setGirlsProducts] = useState([null, null, null, null]);
  const [bestsellerProducts, setBestsellerProducts] = useState([null, null, null, null]);
  const [featuredProducts, setFeaturedProducts] = useState([]); 
  const [loading, setLoading] = useState(true);

  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("https://creative-kids-api.onrender.com/api/products");
        const data = await response.json();
        
        // 1. INTELLIGENT SLOT SORTER FOR THE 4-CARD GRIDS
        const getCardsForSection = (sectionName) => {
          const slots = [null, null, null, null]; // 4 empty slots
          const sectionProducts = data.filter(p => p.homepage_section === sectionName);
          
          // Sort so newest items overwrite older ones if assigned to same slot
          sectionProducts.sort((a, b) => b.id - a.id); 
          
          sectionProducts.forEach(p => {
            const slotIndex = parseInt(p.homepage_card_slot) - 1;
            if (slotIndex >= 0 && slotIndex < 4 && slots[slotIndex] === null) {
              slots[slotIndex] = p;
            }
          });
          return slots;
        };

        setGirlsProducts(getCardsForSection("New Arrivals"));
        setBestsellerProducts(getCardsForSection("Season Bestsellers"));
        
        // 2. FEATURED CAROUSEL (Shows all tagged, not limited to 4)
        const featured = data.filter(p => p.homepage_section === "Featured Collection");
        setFeaturedProducts(featured);
        
        setLoading(false);
      } catch (error) {
        console.error("Database connection failed:", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const scrollLeft = () => {
    if (carouselRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? window.innerWidth * 0.22 : window.innerWidth * 0.5;
      carouselRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      const scrollAmount = window.innerWidth > 1024 ? window.innerWidth * 0.22 : window.innerWidth * 0.5;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Reusable component for the 4-card grids to handle empty slots gracefully
  const GridCard = ({ product, type }) => {
    if (!product) {
      return (
        <div className="flex-none w-[75vw] sm:w-[45vw] md:w-auto snap-start flex flex-col group">
          <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] border border-dashed border-black/10 flex flex-col items-center justify-center text-center p-4 mb-4">
             <span className="text-[10px] font-bold tracking-widest uppercase text-black/30">Empty Slot</span>
             <span className="text-[9px] tracking-widest uppercase text-black/20 mt-1">Assign in Admin</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-none w-[75vw] sm:w-[45vw] md:w-auto snap-start flex flex-col group">
        <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-4">
          <button className="absolute top-4 right-4 z-10 p-1 hover:scale-110 transition-transform">
            <Heart strokeWidth={1} size={20} className="text-black hover:fill-black/10 transition-colors" />
          </button>
          <Link href={`/product/${product.id}`} className="absolute inset-0 w-full h-full">
            <img 
              src={product.image_urls?.[0] || 'https://via.placeholder.com/400x500'} 
              alt={product.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          </Link>
        </div>
        <Link href={`/product/${product.id}`} className="flex flex-col px-1">
          <h3 className="text-[13px] text-black mb-1">{product.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[12px] text-black font-medium">
              ₹{product.price ? parseFloat(product.price).toFixed(2) : '0.00'}
            </p>
            {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
              <>
                <p className="text-[10px] text-black/40 line-through">
                  ₹{parseFloat(product.mrp).toFixed(2)}
                </p>
                <span className="text-[9px] font-bold text-[#D32F2F]">
                  ({Math.round(((parseFloat(product.mrp) - parseFloat(product.price)) / parseFloat(product.mrp)) * 100)}% OFF)
                </span>
              </>
            )}
          </div>
        </Link>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-white">
      {/* 1. THE HERO BANNER (TEXT AT BOTTOM, TIGHTER SPACING) */}
      <section className="relative w-full h-[85vh] md:h-screen flex items-end justify-center overflow-hidden pb-16 md:pb-24">
        <img 
          src="/images/321.png" 
          alt="Spring Collection Campaign"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Slightly darker overlay to make the pure white text pop like a magazine */}
        <div className="absolute inset-0 bg-black/30"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 flex flex-col items-center text-center px-4 text-white"
        >
          {/* Super-tracked pre-title - reduced gap (mb-2) */}
          <span className="text-[9px] md:text-[10px] tracking-[0.3em] font-medium uppercase text-white/90 mb-2">
            Baby & Kids
          </span>
          
          {/* Main Title: reduced gap (mb-4) */}
          <h1 
            className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-[0.15em] uppercase mb-4 max-w-4xl leading-[1.1]"
            style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}
          >
            The Spring Collection
          </h1>
          
          {/* Links */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center">
            <Link 
              href="/shop" 
              className="text-[11px] md:text-[12px] font-bold tracking-[0.2em] uppercase hover:text-white/70 transition-colors"
            >
              Explore Collection
            </Link>
          </div>
        </motion.div>
      </section>

      {/* 2. SHOP BY CATEGORY */}
      <section className="pt-20 pb-12 md:pt-12 md:pb-16 bg-white border-b border-black/5">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col items-center mb-10 md:mb-8 px-4 md:px-8">
            <span className="text-[10px] tracking-widest uppercase text-black/60 mb-3">
              Discover
            </span>
            <h2 
              className="text-xl md:text-2xl font-medium text-black tracking-[0.15em] uppercase"
              style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}
            >
              Shop by Category
            </h2>
          </div>

          <div 
            className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-8 md:pb-0 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
           <Link href="/shop/kids-girl/dresses" className="flex-none w-[75vw] sm:w-[45vw] md:w-auto snap-start block group relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img src="/images/Dress.png" alt="Girls Dresses" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-8 inset-x-0 text-center">
                <h3 className="text-white text-[15px] tracking-[0.15em] uppercase font-medium">Dress</h3>
              </div>
            </Link>

            <Link href="/shop/kids-girl/bottomwear" className="flex-none w-[75vw] sm:w-[45vw] md:w-auto snap-start block group relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img src="/images/shorts.jpg" alt="Bottom Wears" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-8 inset-x-0 text-center">
                <h3 className="text-white text-[15px] tracking-[0.15em] uppercase font-medium">Bottom Wears</h3>
              </div>
            </Link>

            <Link href="/shop/baby-boy/onesies-rompers" className="flex-none w-[75vw] sm:w-[45vw] md:w-auto snap-start block group relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img src="/images/infant.png" alt="Infants" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-8 inset-x-0 text-center">
                <h3 className="text-white text-[15px] tracking-[0.15em] uppercase font-medium">Infants</h3>
              </div>
            </Link>

            <Link href="/shop/baby-girl/clothing-sets" className="flex-none w-[75vw] sm:w-[45vw] md:w-auto snap-start block group relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img src="/images/clothing set.png" alt="Clothing Sets" className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute bottom-8 inset-x-0 text-center">
                <h3 className="text-white text-[15px] tracking-[0.15em] uppercase font-medium">Clothing Sets</h3>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="w-full h-64 flex justify-center items-center">
          <span className="text-[11px] tracking-widest uppercase text-black animate-pulse">Curating...</span>
        </div>
      ) : (
        <>
          {/* 3. GIRLS NEW ARRIVALS GRID */}
          <section className="pt-20 pb-12 md:pt-12 md:pb-16 bg-white border-b border-black/5">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col items-center mb-10 md:mb-8 px-4 md:px-8">
                <span className="text-[10px] tracking-widest uppercase text-[#E2889D] mb-3">Girls</span>
                <h2 
                  className="text-xl md:text-2xl font-medium text-black tracking-[0.15em] uppercase text-center"
                  style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}
                >
                  Girl's New Arrivals
                </h2>
              </div>
              <div 
                className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-8 md:pb-0 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {girlsProducts.map((product, index) => (
                  <GridCard key={`girl-${index}`} product={product} />
                ))}
              </div>
              <div className="flex justify-center mt-4 md:mt-12 px-4">
                <Link href="/shop/girls" className="border border-black px-10 py-4 text-[11px] font-bold tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors">
                  Discover the Collection
                </Link>
              </div>
            </div>
          </section>

          {/* 4. SEASON BESTSELLERS GRID */}
          <section className="pt-20 pb-12 md:pt-12 md:pb-16 bg-white border-b border-black/5">
            <div className="max-w-[1600px] mx-auto">
              <div className="flex flex-col items-center mb-10 md:mb-8 px-4 md:px-8">
                <span className="text-[10px] tracking-widest uppercase text-black/60 mb-3">Favorites</span>
                <h2 
                  className="text-xl md:text-2xl font-medium text-black tracking-[0.15em] uppercase text-center"
                  style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}
                >
                  Season Bestsellers
                </h2>
              </div>
              <div 
                className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4 md:px-8 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory pb-8 md:pb-0 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {bestsellerProducts.map((product, index) => (
                  <GridCard key={`best-${index}`} product={product} />
                ))}
              </div>
              <div className="flex justify-center mt-4 md:mt-12 px-4">
                <Link href="/shop" className="border border-black px-10 py-4 text-[11px] font-bold tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors">
                  Discover the Collection
                </Link>
              </div>
            </div>
          </section>

          {/* 5. FEATURED COLLECTION (SWIPEABLE ALWAYS) */}
          <section className="pt-12 pb-16 md:pt-12 md:pb-24 bg-white border-b border-black/5">
            <div className="w-full relative">
              <div className="flex flex-col items-center mb-10 md:mb-8 px-4 md:px-8">
                <span className="text-[10px] tracking-widest uppercase text-black/60 mb-3">Trending Now</span>
                <h2 
                  className="text-xl md:text-2xl font-medium text-black tracking-[0.15em] uppercase text-center"
                  style={{ fontFamily: "'Futura', 'Helvetica Neue', sans-serif" }}
                >
                  Featured Collection
                </h2>
              </div>

              {featuredProducts.length === 0 ? (
                 <div className="w-full p-12 flex justify-center items-center">
                   <p className="text-[11px] tracking-widest uppercase text-black/40">No items tagged for Featured Collection yet.</p>
                 </div>
              ) : (
                <div className="relative max-w-[1600px] mx-auto group">
                  <button onClick={scrollLeft} className="hidden md:flex absolute left-8 lg:left-12 top-[40%] -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full items-center justify-center text-black hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl">
                    <ChevronLeft size={24} strokeWidth={1} />
                  </button>
                  <button onClick={scrollRight} className="hidden md:flex absolute right-8 lg:right-12 top-[40%] -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-sm border border-black/10 rounded-full items-center justify-center text-black hover:bg-black hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-xl">
                    <ChevronRight size={24} strokeWidth={1} />
                  </button>

                  <div ref={carouselRef} className="flex gap-4 md:gap-6 px-4 md:px-8 overflow-x-auto snap-x snap-mandatory pb-8 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {featuredProducts.map((product, index) => (
                      <div key={`feat-${product.id}-${index}`} className="flex-none w-[75vw] sm:w-[45vw] md:w-[30vw] lg:w-[22vw] snap-start flex flex-col group/card">
                        <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-4">
                          <button className="absolute top-4 right-4 z-10 p-1 hover:scale-110 transition-transform">
                            <Heart strokeWidth={1} size={20} className="text-black hover:fill-black/10 transition-colors" />
                          </button>
                          <Link href={`/product/${product.id}`} className="absolute inset-0 w-full h-full">
                            <img src={product.image_urls?.[0]} alt={product.title} className="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-700 ease-out" />
                          </Link>
                        </div>
                        <Link href={`/product/${product.id}`} className="flex flex-col px-1">
                          <h3 className="text-[13px] text-black mb-1 truncate">{product.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[12px] text-black font-medium">₹{product.price ? parseFloat(product.price).toFixed(2) : '0.00'}</p>
                            {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                              <>
                                <p className="text-[10px] text-black/40 line-through">₹{parseFloat(product.mrp).toFixed(2)}</p>
                                <span className="text-[9px] font-bold text-[#D32F2F]">({Math.round(((parseFloat(product.mrp) - parseFloat(product.price)) / parseFloat(product.mrp)) * 100)}% OFF)</span>
                              </>
                            )}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-2 md:mt-4 px-4">
                <Link href="/shop" className="border border-black px-10 py-4 text-[11px] font-bold tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors">
                  Discover All
                </Link>
              </div>
            </div>
          </section>
          
        </>
      )}
    </main>
  );
}