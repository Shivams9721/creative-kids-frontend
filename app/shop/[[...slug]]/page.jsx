"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ChevronDown, SlidersHorizontal, Heart, X } from "lucide-react";

// Filter Constants
const SIZE_GROUPS = {
  'BABY': ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'],
  'TODDLER': ['2Y', '3Y', '4Y'],
  'KIDS': ['5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '11Y', '12Y'],
  'TEEN': ['13Y', '14Y', '15Y', '16Y', '17Y', '18Y']
};

const COLORS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Blue', hex: '#4A90E2' }, { name: 'Pink', hex: '#E2889D' }, { name: 'Red', hex: '#D32F2F' },
  { name: 'Green', hex: '#2E7D32' }, { name: 'Yellow', hex: '#FBC02D' }, { name: 'Grey', hex: '#9E9E9E' }
];

const PRICE_RANGES = [
  { label: 'Under ₹50', min: 0, max: 50 },
  { label: '₹50 - ₹100', min: 50, max: 100 },
  { label: '₹100 - ₹200', min: 100, max: 200 },
  { label: 'Over ₹200', min: 200, max: 999999 }
];

export default function Shop() {
  const { addToCart } = useCart();
  const params = useParams();
  const router = useRouter();
  
  // States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Filtering States
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeItem, setActiveItem] = useState(null); 
  const [sortBy, setSortBy] = useState("newest");
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
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

    if (slug1) setActiveItem(slug1.replace(/-/g, " ")); 
    else setActiveItem(null);
  }, [params, slug0, slug1]);

  // Fetch Database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/products");
        const data = await response.json();
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
  const clearFilters = () => { setSelectedPrice(null); setSelectedSizes([]); setSelectedColors([]); };

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
      const dbCat = `${p.category || ''} ${p.sub_category || ''} ${p.main_category || ''}`.toLowerCase();
      if (activeCategory === 'Baby Boy') return dbCat.includes('baby') && dbCat.includes('boy');
      if (activeCategory === 'Baby Girl') return dbCat.includes('baby') && dbCat.includes('girl');
      if (activeCategory === 'Boys') return dbCat.includes('boy') && !dbCat.includes('baby');
      if (activeCategory === 'Girls') return dbCat.includes('girl') && !dbCat.includes('baby');
      return true;
    });
  }

  if (activeItem) {
    displayedProducts = displayedProducts.filter((p) => {
      const searchStr = `${p.title} ${p.category} ${p.sub_category} ${p.item_type} ${p.description || ''}`.toLowerCase();
      const searchWords = activeItem.split(" ");
      return searchWords.some(word => word.length > 2 && (searchStr.includes(word) || searchStr.includes(word.replace(/s$/, ''))));
    });
  }

  if (selectedPrice) {
    displayedProducts = displayedProducts.filter(p => parseFloat(p.price) >= selectedPrice.min && parseFloat(p.price) <= selectedPrice.max);
  }

  if (selectedSizes.length > 0) {
    displayedProducts = displayedProducts.filter(p => selectedSizes.some(size => JSON.stringify(p).toLowerCase().includes(size.toLowerCase())));
  }

  if (selectedColors.length > 0) {
    displayedProducts = displayedProducts.filter(p => selectedColors.some(color => JSON.stringify(p).toLowerCase().includes(color.toLowerCase())));
  }

  if (sortBy === "newest") displayedProducts.sort((a, b) => b.id - a.id);
  else if (sortBy === "price-low") displayedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  else if (sortBy === "price-high") displayedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

  const hasActiveFilters = selectedPrice !== null || selectedSizes.length > 0 || selectedColors.length > 0;

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
    <div className="min-h-screen bg-white pt-[64px] md:pt-[72px] pb-24 font-sans text-black">
      
      {/* ========================================== */}
      {/* TOP HEADER SECTION (BREADCRUMBS & SORT)    */}
      {/* ========================================== */}
      <div className="w-full px-4 md:px-12 py-8 md:py-12 border-b border-black/10">
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
              <SlidersHorizontal size={14} /> Filters
            </button>
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

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={clearFilters} className="text-[10px] font-bold tracking-widest uppercase text-black/50 hover:text-black flex items-center gap-2 transition-all">
                <X size={12} strokeWidth={2} /> Clear Filters
              </motion.button>
            )}
          </AnimatePresence>
        </aside>

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
              
              {displayedProducts.map((product) => (
                <Link 
                  href={`/product/${product.id}`} 
                  key={product.id} 
                  className="group flex flex-col relative border-r border-b border-black/10 hover:bg-[#fcfcfc] transition-colors pb-8"
                >
                  {/* Image Container */}
                  <div className="w-full aspect-[3/4] bg-[#f6f5f3] relative overflow-hidden mb-5">
                    <button className="absolute top-4 right-4 z-10 hover:scale-110 transition-transform">
                      <Heart size={18} strokeWidth={1} className="text-black/50 hover:fill-black/10 transition-colors" />
                    </button>
                    <img 
                      src={product.image_urls?.[0] || 'https://via.placeholder.com/400x500'} 
                      alt={product.title} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Text Container */}
                  <div className="px-5 flex flex-col">
                    <h4 className="text-[12px] font-medium text-black mb-1.5 capitalize truncate">
                      {product.title}
                    </h4>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[12px] font-bold ${product.mrp && parseFloat(product.mrp) > parseFloat(product.price) ? 'text-[#D32F2F]' : 'text-black'}`}>
                        ₹{parseFloat(product.price).toFixed(2)}
                      </span>
                      {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                        <span className="text-[10px] text-black/30 line-through">
                          ₹{parseFloat(product.mrp).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}

            </div>
          )}
        </main>

      </div>
    </div>
  );
}