"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Heart } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

// Module-level cache — fetched once per session, not on every search open
let cachedProducts = null;

export default function SmartSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  // Fetch products once and cache at module level
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "unset";
      setQuery("");
      setResults([]);
      return;
    }
    document.body.style.overflow = "hidden";
    setTimeout(() => inputRef.current?.focus(), 100);
    if (cachedProducts) { setProducts(cachedProducts); return; }
    fetch(`${API}/api/products`)
      .then(res => res.json())
      .then(data => { cachedProducts = data; setProducts(data); })
      .catch(err => console.error("Search fetch error:", err));
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Autocomplete suggestions (product titles matching query prefix)
  const suggestions = query.trim().length >= 2
    ? [...new Set(
        products
          .filter(p => p.title?.toLowerCase().includes(query.toLowerCase()))
          .map(p => p.title)
      )].slice(0, 6)
    : [];

  // The Smart "Fuzzy" Search Algorithm
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate a tiny delay for that premium "processing" feel
    const timer = setTimeout(() => {
      const searchTerms = query.toLowerCase().split(" ");
      
      const filtered = products.filter(p => {
        const searchableText = `
          ${p.title} ${p.main_category} ${p.sub_category} 
          ${p.item_type} ${p.fabric} ${p.pattern} ${p.neck_type} ${p.description}
        `.toLowerCase();
        return searchTerms.every(term => searchableText.includes(term));
      });

      // Increased from 10 to 16 results to fill the much smaller grid!
      setResults(filtered.slice(0, 16)); 
      setIsSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, products]);

  // Allow closing with the 'Escape' key
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Overlay covering the rest of the page */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 top-[64px] md:top-[72px] z-[45] bg-black/20 backdrop-blur-sm"
          />

          {/* Slide-down Panel */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="fixed top-[64px] md:top-[72px] left-0 w-full bg-white z-[50] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          >
            <div className="w-full flex flex-col overflow-y-auto custom-scrollbar relative">
              
              {/* Top Right Close Button */}
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 md:top-8 md:right-10 flex items-center gap-2 text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-black/60 hover:text-black transition-colors z-10"
              >
                Close <X size={18} strokeWidth={1.5} />
              </button>

              {/* SEARCH INPUT AREA */}
              <div className="w-full flex flex-col items-center justify-center pt-20 md:pt-28 pb-6 px-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="WHAT ARE YOU LOOKING FOR?"
                  className="w-full max-w-lg text-center text-[12px] md:text-[13px] font-light text-black placeholder:text-black/40 outline-none bg-transparent uppercase tracking-[0.15em] transition-colors"
                />
              </div>

              {/* AUTOCOMPLETE SUGGESTIONS */}
              {suggestions.length > 0 && (
                <div className="w-full flex flex-wrap justify-center gap-2 px-4 pb-8">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => setQuery(s)}
                      className="px-4 py-1.5 border border-black/15 rounded-full text-[11px] tracking-wide text-black/60 hover:border-black hover:text-black transition-colors capitalize"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* TRENDING CHIPS (shown when no query) */}
              {!query.trim() && (
                <div className="w-full flex flex-col items-center pb-10 px-4">
                  <p className="text-[10px] tracking-widest uppercase text-black/30 mb-3">Trending</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Onesies', 'Dresses', 'T-Shirts', 'Co-ord Sets', 'Jeans', 'Rompers', 'Sweatshirts', 'Shorts'].map(term => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-4 py-1.5 border border-black/15 rounded-full text-[11px] tracking-wide text-black/60 hover:border-black hover:text-black transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STATE 1: LOADING INDICATOR */}
              {isSearching && (
                <div className="w-full flex justify-center pb-16 pt-4">
                  <Loader2 size={24} className="animate-spin text-black/20" />
                </div>
              )}

              {/* STATE 2: NO RESULTS */}
              {!isSearching && query.trim() && results.length === 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full text-center pb-16 pt-4">
                  <p className="text-[13px] font-light text-black uppercase tracking-widest">No results found</p>
                </motion.div>
              )}

              {/* STATE 3: TOP RESULTS GRID */}
              {!isSearching && results.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-[1600px] mx-auto px-8 md:px-24 lg:px-40 pb-16 pt-4"
                >
                  {/* DOUBLED COLUMNS: 4 on mobile, 6 on tablet, 8 or 10 on desktop */}
                  <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-2 md:gap-3">
                    {results.map((product) => (
                      <Link 
                        href={`/product/${product.id}`} 
                        onClick={onClose} 
                        key={product.id} 
                        className="group flex flex-col cursor-pointer"
                      >
                        {/* Premium Image Card */}
                        <div className="w-full aspect-[3/4] bg-[#f6f5f3] mb-2 relative overflow-hidden">
                          {/* Heart Icon (Shrunk to fit tiny card) */}
                          <button className="absolute top-1.5 right-1.5 md:top-2 md:right-2 z-10 hover:scale-110 transition-transform">
                            <Heart size={14} strokeWidth={1} className="text-black/60 hover:fill-black/10 transition-colors" />
                          </button>
                          
                          <img 
                            src={product.image_urls?.[0] || ''} 
                            alt={product.title} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                          />
                        </div>
                        
                        {/* Typography (Shrunk to fit tiny card) */}
                        <h4 className="text-[10px] md:text-[11px] font-medium text-black mb-1 capitalize truncate leading-tight">
                          {product.title}
                        </h4>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] md:text-[11px] text-black font-bold">
                            ₹{parseFloat(product.price).toFixed(2)}
                          </span>
                          {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                            <span className="text-[9px] md:text-[10px] text-black/40 line-through">
                              ₹{parseFloat(product.mrp).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                </motion.div>
              )}

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
