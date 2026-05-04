"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import MediaRenderer, { isVideo } from "@/components/product/MediaRenderer";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal, Heart, X, Eye } from "lucide-react";
import { PRODUCT_ATTRIBUTES } from "@/lib/constants";
import { useCart } from "@/context/CartContext";
import QuickViewModal from "@/components/product/QuickViewModal";
import { Mascot, SquiggleUnderline, AnimatedSparkle, Star, Heart as DecoHeart, Flower, Floating } from "@/components/decorations";

// Filter Constants — sizes match exactly what's stored in DB (admin form format)
const SIZE_GROUPS = {
  'BABY':    ['0M–3M', '3M–6M', '6M–9M', '9M–12M', '12M–18M', '18M–24M'],
  'TODDLER': ['2Y–3Y', '3Y–4Y', '4Y–5Y'],
  'KIDS':    ['5Y–6Y', '6Y–7Y', '7Y–8Y', '8Y–9Y', '9Y–10Y', '10Y–11Y', '11Y–12Y', '12Y–13Y'],
  'TEEN':    ['13Y–14Y', '14Y–15Y', '15Y–16Y', '16Y–17Y', '17Y–18Y']
};

export const ALL_SIZES = Object.values(SIZE_GROUPS).flat();

// Use standardized colors from constants (27 colors with proper hex codes)
const COLORS = PRODUCT_ATTRIBUTES.COLORS;

const PRICE_RANGES = [
  { label: 'Under ₹299', min: 0, max: 299 },
  { label: '₹299 - ₹599', min: 299, max: 599 },
  { label: '₹599 - ₹999', min: 599, max: 999 },
  { label: 'Over ₹999', min: 999, max: 999999 }
];

const FABRICS = PRODUCT_ATTRIBUTES.FABRICS;
const PATTERNS = PRODUCT_ATTRIBUTES.PATTERNS;
const NECK_TYPES = PRODUCT_ATTRIBUTES.NECK_TYPES;

import { safeFetch } from "@/lib/safeFetch";
import { cleanTitle } from "@/lib/cleanTitle";



// Normalise string for robust slug matching
const normalise = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export default function ShopClient({ initialProducts }) {
  const { addToCart } = useCart();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [quickViewId, setQuickViewId] = useState(null);

  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(false); // No initial load, only on navigation
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [wishlist, setWishlist] = useState(new Set());
  const [activeSizeTab, setActiveSizeTab] = useState('BABY');

  // Routing
  const slugArray = Array.isArray(params?.slug) ? params.slug : (params?.slug ? [params.slug] : []);
  const slug0 = slugArray[0] || '';
  const slug1 = slugArray[1] || '';

  const SLUG_CATEGORY_MAP = {
    'baby-boy': 'Baby Boy', 'baby-girl': 'Baby Girl',
    'kids-boy': 'Boys', 'kids-girl': 'Girls', 'baby': 'Baby',
  };
  const activeCategory = SLUG_CATEGORY_MAP[slug0] || 'All';
  const activeItem = slug1 ? slug1.toLowerCase() : null;

  // --- URL-driven filter state ---
  const sp = searchParams;
  const sortBy = sp.get('sort') || 'newest';
  const selectedSizes = sp.get('sizes') ? sp.get('sizes').split(',') : [];
  const selectedColors = sp.get('colors') ? sp.get('colors').split(',') : [];
  const selectedFabrics = sp.get('fabrics') ? sp.get('fabrics').split(',') : [];
  const selectedPatterns = sp.get('patterns') ? sp.get('patterns').split(',') : [];
  const selectedNeckTypes = sp.get('necks') ? sp.get('necks').split(',') : [];
  const priceLabel = sp.get('price') || null;
  const selectedPrice = priceLabel ? PRICE_RANGES.find(r => r.label === priceLabel) || null : null;

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || (Array.isArray(value) && value.length === 0)) next.delete(key);
    else next.set(key, Array.isArray(value) ? value.join(',') : value);
    router.replace(`${window.location.pathname}?${next.toString()}`, { scroll: false });
  };

  const toggleSize = (size) => setParam('sizes', selectedSizes.includes(size) ? selectedSizes.filter(s => s !== size) : [...selectedSizes, size]);
  const toggleColor = (color) => setParam('colors', selectedColors.includes(color) ? selectedColors.filter(c => c !== color) : [...selectedColors, color]);
  const toggleFabric = (f) => setParam('fabrics', selectedFabrics.includes(f) ? selectedFabrics.filter(x => x !== f) : [...selectedFabrics, f]);
  const togglePattern = (p) => setParam('patterns', selectedPatterns.includes(p) ? selectedPatterns.filter(x => x !== p) : [...selectedPatterns, p]);
  const toggleNeckType = (n) => setParam('necks', selectedNeckTypes.includes(n) ? selectedNeckTypes.filter(x => x !== n) : [...selectedNeckTypes, n]);
  const setSortBy = (v) => setParam('sort', v);
  const setSelectedPrice = (range) => setParam('price', range ? range.label : null);
  const clearFilters = () => router.replace(window.location.pathname, { scroll: false });

  const hasActiveFilters = !!(priceLabel || selectedSizes.length || selectedColors.length || selectedFabrics.length || selectedPatterns.length || selectedNeckTypes.length);

  // Set size tab based on category
  useEffect(() => {
    if (slug0 === 'baby' || slug0 === 'baby-boy' || slug0 === 'baby-girl') setActiveSizeTab('BABY');
    else if (slug0 === 'kids-boy' || slug0 === 'kids-girl') setActiveSizeTab('KIDS');
  }, [slug0]);

  // Wishlist
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    safeFetch(`/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setWishlist(new Set(data.map(p => p.id))); })
      .catch(() => {});
  }, []);

  const toggleWishlist = async (e, productId) => {
    e.preventDefault(); e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      await safeFetch(`/api/wishlist/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId })
      });
      setWishlist(prev => { const next = new Set(prev); next.has(productId) ? next.delete(productId) : next.add(productId); return next; });
    } catch {}
  };
  
    // We receive products as a prop now, so we only need to update it on navigation
    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

  const getPageTitle = () => {
    if (activeItem) return activeItem.replace(/-/g, ' ');
    if (slug0 === 'offers') return 'Special Offers';
    if (slug0 === 'new') return 'New Arrivals';
    if (activeCategory !== 'All') return activeCategory;
    return 'The Collection';
  };

  const generateBreadcrumbs = () => {
    const paths = [{ name: 'Home', href: '/' }, { name: 'Shop', href: '/shop' }];
    if (slugArray.length > 0) {
      let catName = activeCategory !== 'All' ? activeCategory : slugArray[0].replace(/-/g, ' ');
      if (slug0 === 'offers') catName = 'Offers';
      if (slug0 === 'new') catName = 'New Arrivals';
      paths.push({ name: catName, href: `/shop/${slugArray[0]}` });
    }
    if (slugArray.length > 1) {
      paths.push({ name: activeItem ? activeItem.replace(/-/g, ' ') : slugArray[1].replace(/-/g, ' '), href: `/shop/${slugArray[0]}/${slugArray[1]}` });
    }
    return paths;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex justify-center items-center">
        <span className="text-xs tracking-widest uppercase text-black animate-pulse">Curating Collection...</span>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-black">
      
      {/* ========================================== */}
      {/* TOP HEADER SECTION (BREADCRUMBS & SORT)    */}
      {/* ========================================== */}
      <div className="w-full px-3 sm:px-4 md:px-12 py-3 md:py-6 border-b border-black/10">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-3 md:gap-6">
          
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-black/40">
            {generateBreadcrumbs().map((crumb, index, arr) => (
              <div key={crumb.name} className="flex items-center gap-1.5 sm:gap-2">
                <Link href={crumb.href} className={`transition-colors ${index === arr.length - 1 ? 'text-black' : 'hover:text-black'}`}>
                  {crumb.name}
                </Link>
                {index < arr.length - 1 && <span>/</span>}
              </div>
            ))}
            <div aria-hidden="true" className="ml-2 sm:ml-4 flex items-center gap-3 sm:gap-4">
              <Floating duration={3.2} amplitude={3}><AnimatedSparkle size={11} color="#E2889D" /></Floating>
              <Floating duration={3.6} delay={0.3} amplitude={4}><Star size={12} color="#F0B95B" stroke="rgba(0,0,0,0.25)" /></Floating>
              <Floating duration={3.4} delay={0.6} amplitude={3}><DecoHeart size={12} color="#BDD9E8" /></Floating>
              <Floating duration={3.8} delay={0.9} amplitude={4}><Flower size={14} petal="#B8C9A8" /></Floating>
            </div>
          </div>

          {/* Title + Results */}
          <div>
            <h1 className="text-lg sm:text-xl md:text-3xl font-light tracking-[0.05em] sm:tracking-[0.1em] uppercase text-black flex items-center gap-2 sm:gap-3">
              {getPageTitle()} 
              {slug0 !== "offers" && slug0 !== "new" && <ChevronDown size={16} className="sm:w-5 sm:h-5" strokeWidth={1} />}
            </h1>
            <p className="text-[9px] sm:text-[10px] tracking-widest uppercase text-black/50 mt-1 sm:mt-2">{products.length} Results</p>
          </div>

          {/* Filter & Sort Row */}
          <div className="flex items-center justify-between gap-2">
            {/* Mobile: Filter + Sort side by side */}
            <button onClick={() => setIsMobileFilterOpen(true)} className="md:hidden flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold tracking-wider sm:tracking-widest uppercase border border-black/20 px-3 sm:px-4 py-2 flex-1 max-w-[160px]">
              <SlidersHorizontal size={13} /> Filters {hasActiveFilters && <span className="w-1.5 h-1.5 bg-black rounded-full"></span>}
            </button>
            <div className="md:hidden flex-1 max-w-[160px]">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="w-full text-[10px] sm:text-[11px] font-bold tracking-wider sm:tracking-widest uppercase border border-black/20 px-2 sm:px-3 py-2 outline-none bg-white">
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low → High</option>
                <option value="price-high">Price: High → Low</option>
              </select>
            </div>

            {/* Desktop: Sort By hover dropdown */}
            <div className="relative group hidden md:block ml-auto">
              <button className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-black/70 group-hover:text-black transition-colors pb-1">
                Sort By <ChevronDown size={14} className="text-black/70 group-hover:text-black transition-colors" />
              </button>
              <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-20 w-48">
                <div className="bg-white border border-black/10 shadow-2xl flex flex-col">
                  <button onClick={() => setSortBy("newest")} className="text-left px-6 py-4 text-[11px] tracking-widest uppercase text-black hover:bg-gray-50 border-b border-black/5">Newest</button>
                  <button onClick={() => setSortBy("price-low")} className="text-left px-6 py-4 text-[11px] tracking-widest uppercase text-black hover:bg-gray-50 border-b border-black/5">Price: Low to High</button>
                  <button onClick={() => setSortBy("price-high")} className="text-left px-6 py-4 text-[11px] tracking-widest uppercase text-black hover:bg-gray-50">Price: High to Low</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MAIN CONTENT (SIDEBAR + GRID)              */}
      {/* ========================================== */}
      <div className="w-full max-w-[1600px] mx-auto flex flex-col md:flex-row">
        
        {/* SIDEBAR (SYMMETRIC) */}
        <aside className="hidden md:block w-64 flex-shrink-0 border-r border-black/10 pl-12 pr-10 py-10">
          
          <div className="pb-10 border-b border-black/10 mb-10">
            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-black mb-6">Categories</h3>
            <ul className="flex flex-col gap-4 text-[11px] font-medium tracking-widest uppercase text-black/50">
              {['All', 'Baby Boy', 'Baby Girl', 'Boys', 'Girls'].map((category) => (
                <li key={category}>
                  <Link 
                    href={category === 'All' ? '/shop' : `/shop/${category.toLowerCase().replace(" ", "-")}`}
                    className={`transition-colors ${activeCategory === category ? 'text-black font-bold' : 'hover:text-black'}`}
                  >
                    {category}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="pb-10 border-b border-black/10 mb-10">
            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-black mb-6">Price</h3>
            <ul className="flex flex-col gap-4 text-[11px] font-medium tracking-widest uppercase text-black/50">
              {PRICE_RANGES.map((range, idx) => (
                <li key={idx}>
                  <label className={`flex items-center gap-3 cursor-pointer transition-colors ${selectedPrice?.label === range.label ? 'text-black font-bold' : 'hover:text-black'}`}>
                    <input type="checkbox" checked={selectedPrice?.label === range.label} onChange={() => setSelectedPrice(selectedPrice?.label === range.label ? null : range)} className="accent-black w-3 h-3" /> 
                    {range.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="pb-10 border-b border-black/10 mb-10">
            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-black mb-6">Size</h3>
            <div className="flex gap-4 border-b border-black/10 pb-3 mb-6 text-[9px] font-bold tracking-widest uppercase text-black/40">
              {Object.keys(SIZE_GROUPS).map((group) => (
                <button key={group} onClick={() => setActiveSizeTab(group)} className={`relative pb-1 transition-colors ${activeSizeTab === group ? "text-black" : "hover:text-black/70"}`}>
                  {group}
                  {activeSizeTab === group && <span className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SIZE_GROUPS[activeSizeTab].map(size => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button key={size} onClick={() => toggleSize(size)} className={`border py-2.5 text-[9px] font-bold tracking-wider transition-colors text-center ${isSelected ? 'border-black bg-black text-white' : 'border-black/10 text-black/60 hover:border-black hover:text-black'}`}>
                    {size}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-black mb-6">Color</h3>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((color) => {
                const isSelected = selectedColors.includes(color.name);
                return (
                  <button key={color.name} onClick={() => toggleColor(color.name)} title={color.name} className={`w-5 h-5 rounded-full ring-1 transition-all ${isSelected ? 'ring-black ring-offset-1 scale-110' : 'ring-transparent border border-black/10 hover:ring-black/30'}`} style={{ backgroundColor: color.hex }}>
                    {color.name === 'White' && <div className="w-full h-full rounded-full border border-black/5"></div>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pb-10 border-b border-black/10 mb-10">
            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-black mb-6">Fabric</h3>
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {FABRICS.map(fabric => (
                <label key={fabric} className={`flex items-center gap-3 cursor-pointer text-[11px] font-medium tracking-widest uppercase transition-colors ${selectedFabrics.includes(fabric) ? 'text-black font-bold' : 'text-black/50 hover:text-black'}`}>
                  <input type="checkbox" checked={selectedFabrics.includes(fabric)} onChange={() => toggleFabric(fabric)} className="accent-black w-3 h-3" />
                  {fabric}
                </label>
              ))}
            </div>
          </div>

          <div className="pb-10 border-b border-black/10 mb-10">
            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-black mb-6">Pattern</h3>
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {PATTERNS.map(pattern => (
                <label key={pattern} className={`flex items-center gap-3 cursor-pointer text-[11px] font-medium tracking-widest uppercase transition-colors ${selectedPatterns.includes(pattern) ? 'text-black font-bold' : 'text-black/50 hover:text-black'}`}>
                  <input type="checkbox" checked={selectedPatterns.includes(pattern)} onChange={() => togglePattern(pattern)} className="accent-black w-3 h-3" />
                  {pattern}
                </label>
              ))}
            </div>
          </div>

          <div className="pb-10 border-b border-black/10 mb-10">
            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-black mb-6">Neck Type</h3>
            <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
              {NECK_TYPES.map(neck => (
                <label key={neck} className={`flex items-center gap-3 cursor-pointer text-[11px] font-medium tracking-widest uppercase transition-colors ${selectedNeckTypes.includes(neck) ? 'text-black font-bold' : 'text-black/50 hover:text-black'}`}>
                  <input type="checkbox" checked={selectedNeckTypes.includes(neck)} onChange={() => toggleNeckType(neck)} className="accent-black w-3 h-3" />
                  {neck}
                </label>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={clearFilters} className="text-[10px] font-bold tracking-widest uppercase text-black/50 hover:text-black flex items-center gap-2 transition-all">
                <X size={12} strokeWidth={2} /> Clear Filters
              </motion.button>
            )}
          </AnimatePresence>
        </aside>

        {/* MOBILE FILTER DRAWER */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsMobileFilterOpen(false)}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
              />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="fixed bottom-0 left-0 right-0 bg-white z-50 md:hidden rounded-t-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center p-5 border-b border-black/10 sticky top-0 bg-white">
                  <span className="text-[12px] font-bold tracking-widest uppercase">Filters</span>
                  <button onClick={() => setIsMobileFilterOpen(false)}><X size={20} /></button>
                </div>
                <div className="p-6 space-y-8">
                  <div>
                    <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-4">Price</h3>
                    <div className="flex flex-col gap-3">
                      {PRICE_RANGES.map((range, idx) => (
                        <label key={idx} className="flex items-center gap-3 text-[12px] cursor-pointer">
                          <input type="checkbox" checked={selectedPrice?.label === range.label} onChange={() => setSelectedPrice(selectedPrice?.label === range.label ? null : range)} className="accent-black w-4 h-4" />
                          {range.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-4">Size</h3>
                    <div className="flex gap-3 mb-4 flex-wrap">
                      {Object.keys(SIZE_GROUPS).map(g => (
                        <button key={g} onClick={() => setActiveSizeTab(g)} className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border transition-colors ${activeSizeTab === g ? 'bg-black text-white border-black' : 'border-black/20 text-black/60'}`}>{g}</button>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {SIZE_GROUPS[activeSizeTab].map(size => (
                        <button key={size} onClick={() => toggleSize(size)} className={`border py-2 text-[10px] font-bold tracking-wider transition-colors text-center rounded ${selectedSizes.includes(size) ? 'border-black bg-black text-white' : 'border-black/10 text-black/60'}`}>{size}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-4">Color</h3>
                    <div className="flex flex-wrap gap-3">
                      {COLORS.map(color => (
                        <button key={color.name} onClick={() => toggleColor(color.name)} title={color.name}
                          className={`w-7 h-7 rounded-full ring-2 transition-all ${selectedColors.includes(color.name) ? 'ring-black ring-offset-2 scale-110' : 'ring-transparent border border-black/10'}`}
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-4">Fabric</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {FABRICS.map(fabric => (
                        <label key={fabric} className="flex items-center gap-2 text-[11px] cursor-pointer">
                          <input type="checkbox" checked={selectedFabrics.includes(fabric)} onChange={() => toggleFabric(fabric)} className="accent-black w-3.5 h-3.5" />
                          {fabric}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-4">Pattern</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {PATTERNS.map(pattern => (
                        <label key={pattern} className="flex items-center gap-2 text-[11px] cursor-pointer">
                          <input type="checkbox" checked={selectedPatterns.includes(pattern)} onChange={() => togglePattern(pattern)} className="accent-black w-3.5 h-3.5" />
                          {pattern}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[11px] font-bold tracking-widest uppercase text-black mb-4">Neck Type</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {NECK_TYPES.map(neck => (
                        <label key={neck} className="flex items-center gap-2 text-[11px] cursor-pointer">
                          <input type="checkbox" checked={selectedNeckTypes.includes(neck)} onChange={() => toggleNeckType(neck)} className="accent-black w-3.5 h-3.5" />
                          {neck}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    {hasActiveFilters && <button onClick={() => { clearFilters(); }} className="flex-1 border border-black py-3 text-[11px] font-bold tracking-widest uppercase rounded-full">Clear All</button>}
                    <button onClick={() => setIsMobileFilterOpen(false)} className="flex-1 bg-black text-white py-3 text-[11px] font-bold tracking-widest uppercase rounded-full">Apply Filters</button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* PRODUCT GRID (GAPLESS, SYMMETRIC) */}
        <main className="flex-1">
          {products.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center text-center px-4 bg-[#fcfcfc] border-b border-black/10">
              <div className="relative mb-4">
                <Mascot pose="read" size={140} />
                <div className="absolute -top-2 right-0"><AnimatedSparkle size={14} color="#F0B95B" /></div>
              </div>
              <h2 className="text-xl md:text-2xl font-light tracking-widest uppercase text-black mb-2">No Results Found</h2>
              <SquiggleUnderline color="#E2889D" className="mb-4" />
              <p className="text-[11px] tracking-widest uppercase text-black/50 mb-10 max-w-md">Try adjusting your filters or browse another category.</p>
              <button onClick={clearFilters} className="border border-black rounded-full px-8 py-3.5 text-[11px] font-medium tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors">Clear All Filters</button>
            </div>
          ) : (
            // GAP-0 creates the seamless luxury layout. Grid borders ensure items don't bleed.
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-b border-black/10">
              
              {products.map((product) => {
                const variants = (() => { try { return typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []); } catch { return []; } })();
                const totalStock = variants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0);
                const soldOut = variants.length > 0 && totalStock === 0;
                return (
                  <Link
                    href={`/product/${product.id}`}
                    key={product.id}
                    className="group flex flex-col relative border-r border-b border-black/10 hover:bg-[#fcfcfc] transition-colors pb-8"
                  >
                    <div className="w-full aspect-[3/4] bg-[#f6f5f3] relative overflow-hidden mb-3 sm:mb-5">
                      <button onClick={(e) => toggleWishlist(e, product.id)} className="absolute top-4 right-4 z-10 hover:scale-110 transition-transform">
                        <Heart size={18} strokeWidth={1} className={wishlist.has(product.id) ? "fill-red-500 text-red-500" : "text-black/50 hover:fill-black/10 transition-colors"} />
                      </button>
                      {/* Quick View button */}
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewId(product.id); }}
                        className="absolute top-4 left-4 z-10 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-sm backdrop-blur-sm"
                        title="Quick View"
                      >
                        <Eye size={14} strokeWidth={1.5} className="text-black" />
                      </button>
                      <MediaRenderer
                        src={(product.hover_videos && Object.values(product.hover_videos).find(v => v)) || product.image_urls?.find(isVideo) || product.image_urls?.[0] || '/images/logo.png'}
                        poster={product.image_urls?.find(u => !isVideo(u))}
                        alt={product.title}
                        fill
                        className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${soldOut ? 'opacity-50' : ''}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        hideVolume
                        hoverPlay
                      />
                      {soldOut && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="bg-white/90 text-black text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 border border-black/20">Sold Out</span>
                        </div>
                      )}
                      {/* Add to Cart Overlay Button */}
                      {!soldOut && (
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
                      )}
                    </div>
                    <div className="px-2 sm:px-3 md:px-5 flex flex-col mt-auto">
                      <h4 className="text-[11px] sm:text-[12px] font-medium text-black mb-1 sm:mb-1.5 capitalize truncate">{cleanTitle(product.title)}</h4>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className={`text-[11px] sm:text-[12px] font-bold ${product.mrp && parseFloat(product.mrp) > parseFloat(product.price) ? 'text-[#D32F2F]' : 'text-black'}`}>
                          ₹{parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                          <span className="text-[9px] sm:text-[10px] text-black/30 line-through">₹{parseFloat(product.mrp).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}

            </div>
          )}
        </main>

      </div>

      {/* Quick View Modal */}
      {quickViewId && (
        <QuickViewModal productId={quickViewId} onClose={() => setQuickViewId(null)} />
      )}
    </div>
  );
}
