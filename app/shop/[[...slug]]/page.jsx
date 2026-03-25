"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ChevronDown, SlidersHorizontal, Heart, X } from "lucide-react";

// Filter Constants
const SIZE_GROUPS = {
  'BABY': ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'],
  'TODDLER': ['1-2Y', '2-3Y', '3-4Y', '4-5Y'],
  'KIDS': ['5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-11Y', '11-12Y', '12-13Y'],
  'TEEN': ['13-14Y', '14-15Y', '15-16Y', '16-17Y', '17-18Y']
};

export const ALL_SIZES = Object.values(SIZE_GROUPS).flat();

export const COLORS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Blue', hex: '#4A90E2' }, { name: 'Pink', hex: '#E2889D' }, { name: 'Red', hex: '#D32F2F' },
  { name: 'Green', hex: '#2E7D32' }, { name: 'Yellow', hex: '#FBC02D' }, { name: 'Grey', hex: '#9E9E9E' },
  { name: 'Orange', hex: '#FF6B35' }, { name: 'Purple', hex: '#7B2D8B' }, { name: 'Brown', hex: '#795548' },
  { name: 'Navy', hex: '#1A237E' }, { name: 'Maroon', hex: '#880E4F' }
];

const PRICE_RANGES = [
  { label: 'Under ₹299', min: 0, max: 299 },
  { label: '₹299 - ₹599', min: 299, max: 599 },
  { label: '₹599 - ₹999', min: 599, max: 999 },
  { label: 'Over ₹999', min: 999, max: 999999 }
];

const FABRICS = [
  'Cotton','Linen','Rayon','Viscose','Polyester','Denim','Chambray',
  'Chiffon','Georgette','Crepe','Satin','Organza',
  'Dobby','Jacquard','Seersucker','Twill','Poplin',
  'Cotton Blend','Poly Cotton','Rayon Blend','Viscose Blend',
  'Cotton Poplin','Viscose Rayon','Poly Chiffon','Denim Cotton'
];

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Shop() {
  const { addToCart } = useCart();
  const params = useParams();
  const router = useRouter();

  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [wishlist, setWishlist] = useState(new Set());
  
  // Filtering States
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeItem, setActiveItem] = useState(null); 
  const [sortBy, setSortBy] = useState("newest");
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedFabrics, setSelectedFabrics] = useState([]);
  const [activeSizeTab, setActiveSizeTab] = useState("BABY");

  // Routing Data
  const slugArray = Array.isArray(params?.slug) ? params.slug : (params?.slug ? [params.slug] : []);
  const slug0 = slugArray[0] || ""; 
  const slug1 = slugArray[1] || ""; 

  // Determine Category from URL
  useEffect(() => {
    if (slug0.includes('baby') && slug0.includes('boy')) setActiveCategory('Baby Boy');
    else if (slug0.includes('baby') && slug0.includes('girl')) setActiveCategory('Baby Girl');
    else if (slug0.includes('boy')) setActiveCategory('Boys');
    else if (slug0.includes('girl')) setActiveCategory('Girls');
    else setActiveCategory("All");

    // Auto-set size tab based on category
    if (slug0.includes('baby')) setActiveSizeTab('BABY');
    else if (slug0.includes('boy') || slug0.includes('girl')) setActiveSizeTab('KIDS');

    if (slug1) setActiveItem(slug1.replace(/-/g, " "));
    else setActiveItem(null);
  }, [params, slug0, slug1]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/api/wishlist`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setWishlist(new Set(data.map(p => p.id))); })
      .catch(() => {});
  }, []);

  const toggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    try {
      await fetch(`${API}/api/wishlist/toggle`, {
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

  // Fetch Database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API}/api/products`);
        const rawData = await response.json();
        const data = rawData.map(p => ({
          ...p,
          image_urls: typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (p.image_urls || [])
        }));
        setProducts(data);
        setLoading(false);
      } catch (error) {
        console.error("Database connection failed:", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Filter Toggles
  const toggleSize = (size) => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  const toggleColor = (color) => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  const toggleFabric = (fabric) => setSelectedFabrics(prev => prev.includes(fabric) ? prev.filter(f => f !== fabric) : [...prev, fabric]);
  const clearFilters = () => { setSelectedPrice(null); setSelectedSizes([]); setSelectedColors([]); setSelectedFabrics([]); };

  // --- FILTERING LOGIC ---
  let displayedProducts = products;

  if (slug0 === "offers") {
    displayedProducts = displayedProducts.filter(p => {
      if (!p.mrp || parseFloat(p.mrp) <= parseFloat(p.price)) return false;
      return (((parseFloat(p.mrp) - parseFloat(p.price)) / parseFloat(p.mrp)) * 100) >= 30; 
    });
  }

  if (slug0 === "new") displayedProducts = displayedProducts.filter(p => p.is_new_arrival === true);

  if (activeCategory !== "All") {
    displayedProducts = displayedProducts.filter((p) => {
      const extra = (() => { try { return typeof p.extra_categories === 'string' ? JSON.parse(p.extra_categories) : (p.extra_categories || []); } catch { return []; } })();
      const allSubs = [p.sub_category, ...extra.map(e => e.sub_category)].map(s => (s || '').toLowerCase());
      const allMains = [p.main_category, ...extra.map(e => e.main_category)].map(m => (m || '').toLowerCase());
      if (activeCategory === 'Baby Boy') return allSubs.some(s => s.includes('baby') && s.includes('boy')) || (allMains.some(m => m === 'baby') && allSubs.some(s => s.includes('boy')));
      if (activeCategory === 'Baby Girl') return allSubs.some(s => s.includes('baby') && s.includes('girl')) || (allMains.some(m => m === 'baby') && allSubs.some(s => s.includes('girl')));
      if (activeCategory === 'Boys') return allSubs.some(s => s.includes('boy') && !s.includes('baby'));
      if (activeCategory === 'Girls') return allSubs.some(s => s.includes('girl') && !s.includes('baby'));
      return true;
    });
  }

  if (activeItem) {
    displayedProducts = displayedProducts.filter((p) => {
      const itemType = (p.item_type || '').toLowerCase();
      const searchItem = activeItem.toLowerCase();
      return (
        itemType === searchItem ||
        itemType.replace(/[^a-z0-9]/g, '-') === searchItem.replace(/[^a-z0-9]/g, '-') ||
        itemType.replace(/[^a-z0-9]/g, '') === searchItem.replace(/[^a-z0-9]/g, '')
      );
    });
  }

  if (selectedPrice) {
    displayedProducts = displayedProducts.filter(p => parseFloat(p.price) >= selectedPrice.min && parseFloat(p.price) <= selectedPrice.max);
  }

  if (selectedSizes.length > 0) {
    displayedProducts = displayedProducts.filter(p => {
      try {
        const variants = typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []);
        return selectedSizes.some(size => variants.some(v => v.size === size));
      } catch { return false; }
    });
  }

  if (selectedColors.length > 0) {
    displayedProducts = displayedProducts.filter(p => {
      try {
        const variants = typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []);
        return selectedColors.some(color => variants.some(v => v.color.toLowerCase() === color.toLowerCase()));
      } catch { return false; }
    });
  }

  if (selectedFabrics.length > 0) {
    displayedProducts = displayedProducts.filter(p =>
      selectedFabrics.some(f => (p.fabric || '').toLowerCase() === f.toLowerCase())
    );
  }

  if (sortBy === "newest") displayedProducts.sort((a, b) => b.id - a.id);
  else if (sortBy === "price-low") displayedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  else if (sortBy === "price-high") displayedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

  const hasActiveFilters = selectedPrice !== null || selectedSizes.length > 0 || selectedColors.length > 0 || selectedFabrics.length > 0;

  // Header Data
  const getPageTitle = () => {
    if (activeItem) return activeItem;
    if (slug0 === "offers") return "Special Offers";
    if (slug0 === "new") return "New Arrivals";
    if (activeCategory !== "All") return activeCategory;
    return "The Collection";
  };

  const generateBreadcrumbs = () => {
    const paths = [{ name: 'Home', href: '/' }, { name: 'Shop', href: '/shop' }];
    if (slugArray.length > 0) {
      let catName = activeCategory !== "All" ? activeCategory : slugArray[0].replace(/-/g, ' ');
      if (slug0 === "offers") catName = "Offers";
      if (slug0 === "new") catName = "New Arrivals";
      paths.push({ name: catName, href: `/shop/${slugArray[0]}` });
    }
    if (slugArray.length > 1) {
      paths.push({ name: activeItem || slugArray[1].replace(/-/g, ' '), href: `/shop/${slugArray[0]}/${slugArray[1]}` });
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
      <div className="w-full px-4 md:px-12 py-4 md:py-6 border-b border-black/10">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
          
          <div className="flex items-center flex-wrap gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-black/40">
            {generateBreadcrumbs().map((crumb, index, arr) => (
              <div key={crumb.name} className="flex items-center gap-2">
                <Link href={crumb.href} className={`transition-colors ${index === arr.length - 1 ? 'text-black' : 'hover:text-black'}`}>
                  {crumb.name}
                </Link>
                {index < arr.length - 1 && <span>/</span>}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl md:text-3xl font-light tracking-[0.1em] uppercase text-black flex items-center gap-3">
                {getPageTitle()} 
                {slug0 !== "offers" && slug0 !== "new" && <ChevronDown size={20} strokeWidth={1} />}
              </h1>
              <p className="text-[10px] tracking-widest uppercase text-black/50 mt-2">{displayedProducts.length} Results</p>
            </div>

            <div className="relative group hidden md:block">
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

            <button onClick={() => setIsMobileFilterOpen(true)} className="md:hidden flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase border border-black/20 px-4 py-2">
              <SlidersHorizontal size={14} /> Filters {hasActiveFilters && <span className="w-2 h-2 bg-black rounded-full"></span>}
            </button>
            {/* Mobile Sort */}
            <div className="md:hidden">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-[11px] font-bold tracking-widest uppercase border border-black/20 px-3 py-2 outline-none bg-white">
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
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
          {displayedProducts.length === 0 ? (
            <div className="w-full py-32 flex flex-col items-center justify-center text-center px-4 bg-[#fcfcfc] border-b border-black/10">
              <h2 className="text-xl md:text-2xl font-light tracking-widest uppercase text-black mb-4">No Results Found</h2>
              <p className="text-[11px] tracking-widest uppercase text-black/50 mb-10 max-w-md">Try adjusting your filters or browse another category.</p>
              <button onClick={clearFilters} className="border border-black rounded-full px-8 py-3.5 text-[11px] font-medium tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors">Clear All Filters</button>
            </div>
          ) : (
            // GAP-0 creates the seamless luxury layout. Grid borders ensure items don't bleed.
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 border-b border-black/10">
              
              {displayedProducts.map((product) => {
                const variants = (() => { try { return typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []); } catch { return []; } })();
                const totalStock = variants.reduce((s, v) => s + (parseInt(v.stock) || 0), 0);
                const soldOut = variants.length > 0 && totalStock === 0;
                return (
                  <Link
                    href={`/product/${product.id}`}
                    key={product.id}
                    className="group flex flex-col relative border-r border-b border-black/10 hover:bg-[#fcfcfc] transition-colors pb-8"
                  >
                    <div className="w-full aspect-[3/4] bg-[#f6f5f3] relative overflow-hidden mb-5">
                      <button onClick={(e) => toggleWishlist(e, product.id)} className="absolute top-4 right-4 z-10 hover:scale-110 transition-transform">
                        <Heart size={18} strokeWidth={1} className={wishlist.has(product.id) ? "fill-red-500 text-red-500" : "text-black/50 hover:fill-black/10 transition-colors"} />
                      </button>
                      <Image
                        src={product.image_urls?.[0] || 'https://via.placeholder.com/400x500'}
                        alt={product.title}
                        fill
                        className={`object-cover transition-transform duration-1000 group-hover:scale-105 ${soldOut ? 'opacity-50' : ''}`}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {soldOut && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-white/90 text-black text-[9px] font-bold tracking-widest uppercase px-3 py-1.5 border border-black/20">Sold Out</span>
                        </div>
                      )}
                    </div>
                    <div className="px-5 flex flex-col">
                      <h4 className="text-[12px] font-medium text-black mb-1.5 capitalize truncate">{product.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-bold ${product.mrp && parseFloat(product.mrp) > parseFloat(product.price) ? 'text-[#D32F2F]' : 'text-black'}`}>
                          ₹{parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                          <span className="text-[10px] text-black/30 line-through">₹{parseFloat(product.mrp).toFixed(2)}</span>
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
    </div>
  );
}