"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { Zap } from "lucide-react";
import { ShoppingBag, ChevronDown, ChevronUp, Heart, Share2, Truck, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { csrfHeaders } from "@/lib/csrf";

import { safeFetch } from "@/lib/safeFetch";
import { recordView } from "@/components/RecentlyViewed";
import { cleanTitle } from "@/lib/cleanTitle";
import { useSettings } from "@/context/SettingsContext";



export default function ProductClient({ product, relatedProducts }) {
  const { addToCart, buyNow } = useCart();
  const { reviews_enabled } = useSettings();
  const router = useRouter();
  
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImage, setMainImage] = useState(product?.image_urls?.[0] || "");
  const [colorImageMap, setColorImageMap] = useState({});
  const [openSection, setOpenSection] = useState("description");
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showGuestWishlistModal, setShowGuestWishlistModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyDone, setNotifyDone] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  
    useEffect(() => {
    if (!product) return;

    // Set initial selections and image maps
    const parsedVariants = product.parsedVariants || [];
    const colors = [...new Set(parsedVariants.map(v => v.color))].filter(c => c !== "Default");
    const sizes = [...new Set(parsedVariants.map(v => v.size))].filter(s => s !== "Default");
    if (colors.length > 0) setSelectedColor(colors[0]);
    if (sizes.length > 0) setSelectedSize(sizes[0]);
    setMainImage(product.image_urls?.[0] || "");

    // Record this product as recently viewed
    recordView(product);

    const imgMap = {};
    parsedVariants.forEach(v => {
      if (v.color && v.color !== 'Default' && v.image && !imgMap[v.color]) {
        imgMap[v.color] = v.image;
      }
    });
    setColorImageMap(imgMap);
    
    // Fetch reviews
    safeFetch(`/api/reviews/${product.id}`)
      .then(r => r.json()).then(setReviews).catch(() => {});

    // Check if logged-in user can review
    const token = localStorage.getItem('token');
    if (token) {
      safeFetch(`/api/reviews/check/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        setCanReview(d.canReview);
        setAlreadyReviewed(d.alreadyReviewed);
      }).catch(() => {});
      
      safeFetch(`/api/wishlist/check/${product.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(async res => res.ok ? res.json() : null)
      .then(data => {
         if (data) setIsWishlisted(data.isWishlisted);
      })
      .catch(err => console.error("Wishlist check error:", err));
    }
  }, [product]);

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmittingReview(true);
    try {
      const res = await safeFetch(`/api/reviews`, {
        method: 'POST',
        headers: await csrfHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
        credentials: 'include',
        body: JSON.stringify({ productId: product.id, ...reviewForm })
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => [data, ...prev]);
        setCanReview(false);
        setAlreadyReviewed(true);
        setReviewForm({ rating: 5, comment: '' });
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleWishlistToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowGuestWishlistModal(true);
      return;
    }
    try {
      const response = await safeFetch(`/api/wishlist/toggle`, {
        method: "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json", "Authorization": `Bearer ${token}` }),
        credentials: 'include',
        body: JSON.stringify({ productId: product.id })
      });
      if (!response.ok) return;
      const data = await response.json();
      setIsWishlisted(data.isWishlisted); 
    } catch (error) {}
  };

  const buildCartItem = () => {
    const matchedVariant = (product.parsedVariants || []).find(v =>
      v.color === (selectedColor || "Default") && v.size === (selectedSize || "Default")
    );
    return {
      id: product.id,
      title: product.title,
      price: product.price,
      mrp: product.mrp,
      image: mainImage,
      selectedColor: selectedColor || "Default",
      selectedSize: selectedSize || "Default",
      sku: matchedVariant?.sku || null,
      baseSku: product.sku || null,
      quantity: 1
    };
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(buildCartItem());
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) return;
    buyNow(buildCartItem());
    router.push('/checkout');
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out ${product.title} on Creative Kids!`;
    if (navigator.share) {
      try { await navigator.share({ title: product.title, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const gallery = product.color_images?.[color];
    if (gallery && gallery.length > 0) {
      setMainImage(gallery[0]);
    } else if (colorImageMap[color]) {
      setMainImage(colorImageMap[color]);
    }
  };

  const displayThumbnails = (() => {
    if (selectedColor && product?.color_images?.[selectedColor]?.length > 0) {
      return product.color_images[selectedColor];
    }
    return product?.image_urls || [];
  })();

  const getVariantStock = (color, size) => {
    if (!product) return 0;
    const v = product.parsedVariants.find(
      v => v.color === (color || 'Default') && v.size === (size || 'Default')
    );
    return v ? (parseInt(v.stock) || 0) : 0;
  };

  const isSizeAvailableForColor = (size) => {
    if (!product || !selectedColor) return true;
    const v = product.parsedVariants.find(v => v.color === selectedColor && v.size === size);
    return v ? (parseInt(v.stock) || 0) > 0 : false;
  };

  const isColorAvailable = (color) => {
    if (!product) return true;
    return product.parsedVariants.some(v => v.color === color && (parseInt(v.stock) || 0) > 0);
  };

  const currentStock = getVariantStock(selectedColor, selectedSize);
  const isOutOfStock = product && product.parsedVariants.length > 0 && currentStock === 0;

  const checkPincode = async () => {
    if (pincode.length !== 6) return;
    setPincodeStatus('checking');
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
      setPincodeStatus(data[0]?.Status === 'Success' ? 'available' : 'unavailable');
    } catch {
      setPincodeStatus('unavailable');
    }
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const availableColors = [...new Set(product.parsedVariants.map(v => v.color))].filter(c => c !== "Default");
  const availableSizes = [...new Set(product.parsedVariants.map(v => v.size))].filter(s => s !== "Default");

  return (
    <>
     <main className="min-h-screen bg-white pt-[64px] md:pt-[72px]">

      {/* ZOOM MODAL */}
      <AnimatePresence>
        {zoomOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setZoomOpen(false)}
              className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            >
              <button onClick={() => setZoomOpen(false)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors z-10">
                <X size={24} className="text-white" />
              </button>
              <img src={mainImage} alt={product.title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={e => e.stopPropagation()} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SIZE GUIDE MODAL */}
      <AnimatePresence>
        {showSizeGuide && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSizeGuide(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[12px] font-bold tracking-widest uppercase">Size Guide</h3>
                  <button onClick={() => setShowSizeGuide(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>
                <Image src="https://i.postimg.cc/nrj3wLGL/image.png" alt="Size Guide" width={800} height={600} className="w-full rounded-lg" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* GUEST WISHLIST MODAL */}
      <AnimatePresence>
        {showGuestWishlistModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowGuestWishlistModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm w-full bg-white rounded-t-3xl md:rounded-2xl p-8 z-50 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <Heart size={32} className="text-red-400 fill-red-100" />
                <button onClick={() => setShowGuestWishlistModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              </div>
              <h3 className="text-xl font-light text-black mb-2">Love this item?</h3>
              <p className="text-[13px] text-black/60 mb-6">Create a free account to save it to your wishlist and never lose track of your favourites.</p>
              <div className="flex flex-col gap-3">
                <Link href="/login" className="w-full bg-black text-white text-center py-3.5 rounded-full text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">
                  Sign In
                </Link>
                <Link href="/login" className="w-full border border-black text-black text-center py-3.5 rounded-full text-[12px] font-bold tracking-widest uppercase hover:bg-gray-50 transition-colors">
                  Create Account
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* BREADCRUMBS */}
      <div className="w-full px-4 md:px-8 py-4 border-b border-black/5 bg-[#fafafa]">
        <div className="max-w-[1600px] mx-auto text-[10px] tracking-widest uppercase text-black/50 flex items-center gap-2">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/shop/${product.main_category?.toLowerCase()}`} className="hover:text-black transition-colors">{product.main_category || "Shop"}</Link>
          <span>/</span>
          <span className="text-black">{product.title}</span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* LEFT: IMAGE GALLERY */}
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-[100px] lg:self-start">
            {displayThumbnails.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-20 flex-shrink-0 [&::-webkit-scrollbar]:hidden">
                {displayThumbnails.map((url, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setMainImage(url)}
                    className={`w-16 h-20 md:w-full md:h-24 flex-shrink-0 bg-gray-100 overflow-hidden border transition-all relative ${mainImage === url ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <Image src={url} alt={`Thumbnail ${idx}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="w-full flex-1 relative">
              <Image src={mainImage} alt={product.title} width={800} height={1000} priority className="w-full h-auto block cursor-zoom-in" sizes="(max-width: 1024px) 100vw, 50vw" onClick={() => setZoomOpen(true)} />
              
              {/* WISHLIST BUTTON */}
              <button 
                onClick={handleWishlistToggle}
                className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:scale-110 transition-transform z-10 shadow-sm"
              >
                <Heart 
                  size={20} 
                  strokeWidth={1.5} 
                  className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-black hover:text-red-500'}`} 
                />
              </button>
            </div>
          </div>

          {/* RIGHT: PRODUCT DETAILS */}
          <div className="w-full lg:w-1/2 flex flex-col max-w-2xl">
            
            <div className="mb-8">
              <p className="text-[10px] tracking-widest uppercase text-black/50 mb-3">{product.sub_category || product.category}</p>
              <h1 className="text-3xl md:text-4xl font-light text-black mb-4">{cleanTitle(product.title)}</h1>
              
              {/* PRICE & DISCOUNT LOGIC */}
              <div className="flex items-center gap-4">
                <p className="text-xl text-black font-medium">
                  ₹{parseFloat(product.price).toFixed(2)}
                </p>
                {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                  <>
                    <p className="text-[14px] text-black/40 line-through">
                      ₹{parseFloat(product.mrp).toFixed(2)}
                    </p>
                    <span className="bg-red-50 text-[#D32F2F] border border-red-100 px-2 py-1 text-[10px] font-bold tracking-widest uppercase rounded-sm">
                      {Math.round(((parseFloat(product.mrp) - parseFloat(product.price)) / parseFloat(product.mrp)) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-black/40 tracking-wider mt-1 uppercase">Inclusive of all taxes</p>
            </div>

            {/* COLOR SELECTION */}
            {availableColors.length > 0 && (
              <div className="mb-6">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-black">
                    Color: <span className="text-black/60 font-medium normal-case tracking-normal">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map(color => {
                    const available = isColorAvailable(color);
                    const colorImg =
                      product.color_images?.[color]?.[0] ||
                      colorImageMap[color] ||
                      product.image_urls?.[0] ||
                      null;
                    return (
                      <button
                        key={color}
                        onClick={() => available && handleColorSelect(color)}
                        disabled={!available}
                        className={`flex flex-col items-center gap-1.5 transition-all group ${
                          !available ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <div className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition-all relative ${
                          selectedColor === color
                            ? 'border-black shadow-md'
                            : available
                            ? 'border-transparent hover:border-black/40'
                            : 'border-transparent'
                        }`}>
                          {colorImg ? (
                            <Image
                              src={colorImg}
                              alt={color}
                              fill
                              className={`object-contain transition-transform duration-500 ${
                                available ? 'group-hover:scale-105' : ''
                              } ${!available ? 'grayscale' : ''}`}
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <span className="text-[8px] text-black/30 uppercase tracking-wider">No img</span>
                            </div>
                          )}
                          {!available && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-full h-[1px] bg-black/30 rotate-45" />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium tracking-wide transition-colors ${
                          selectedColor === color ? 'text-black font-bold' : 'text-black/50'
                        }`}>
                          {color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SIZE SELECTION */}
            {availableSizes.length > 0 && (
              <div className="mb-8">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[11px] font-bold tracking-widest uppercase text-black">Size</span>
                  <button onClick={() => setShowSizeGuide(true)} className="text-[10px] tracking-widest uppercase text-black/50 hover:text-black border-b border-black/20 pb-0.5">Size Guide</button>
                </div>
                {/* Age → Size Recommender */}
                <div className="mb-4 p-3 bg-[#fafafa] border border-black/10 rounded-xl">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">What's my size? — Select age</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '0–3M',  size: '0M–3M'   },
                      { label: '3–6M',  size: '3M–6M'   },
                      { label: '6–9M',  size: '6M–9M'   },
                      { label: '9–12M', size: '9M–12M'  },
                      { label: '12–18M',size: '12M–18M' },
                      { label: '18–24M',size: '18M–24M' },
                      { label: '2–3Y',  size: '2Y–3Y'   },
                      { label: '3–4Y',  size: '3Y–4Y'   },
                      { label: '4–5Y',  size: '4Y–5Y'   },
                      { label: '5–6Y',  size: '5Y–6Y'   },
                      { label: '7–8Y',  size: '7Y–8Y'   },
                      { label: '9–10Y', size: '9Y–10Y'  },
                      { label: '11–12Y',size: '11Y–12Y' },
                    ].filter(a => availableSizes.some(s => s === a.size)).map(a => (
                      <button key={a.label} onClick={() => setSelectedSize(a.size)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider border transition-colors ${
                          selectedSize === a.size ? 'bg-black text-white border-black' : 'border-black/20 text-black/60 hover:border-black'
                        }`}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map(size => {
                    const available = isSizeAvailableForColor(size);
                    return (
                      <button
                        key={size}
                        onClick={() => available && setSelectedSize(size)}
                        disabled={!available}
                        className={`min-w-[60px] h-[45px] flex items-center justify-center border rounded-full text-[11px] font-bold tracking-widest uppercase transition-all ${
                          selectedSize === size
                            ? 'border-black bg-black text-white'
                            : available
                            ? 'border-black/20 text-black/70 hover:border-black/50'
                            : 'border-black/10 text-black/25 line-through cursor-not-allowed'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PINCODE CHECKER */}
            <div className="mb-6">
              <p className="text-[11px] font-bold tracking-widest uppercase text-black mb-3">Check Delivery</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pincode}
                  onChange={e => { if (/^\d*$/.test(e.target.value) && e.target.value.length <= 6) { setPincode(e.target.value); setPincodeStatus(null); } }}
                  placeholder="Enter 6-digit pincode"
                  className="flex-1 border border-black/20 rounded-full px-4 py-2.5 text-[13px] outline-none focus:border-black"
                />
                <button
                  onClick={checkPincode}
                  disabled={pincode.length !== 6 || pincodeStatus === 'checking'}
                  className="px-5 py-2.5 bg-black text-white rounded-full text-[11px] font-bold tracking-widest uppercase disabled:opacity-40 transition-colors hover:bg-black/80"
                >
                  {pincodeStatus === 'checking' ? '...' : 'Check'}
                </button>
              </div>
              {pincodeStatus === 'available' && (
                <p className="text-[12px] text-green-600 font-medium mt-2">✓ Delivery available to {pincode}</p>
              )}
              {pincodeStatus === 'unavailable' && (
                <p className="text-[12px] text-red-500 font-medium mt-2">✗ Delivery not available for this pincode</p>
              )}
            </div>

            {/* NOTIFY ME */}
            {isOutOfStock && (
              <div className="mb-6 p-4 bg-[#fafafa] border border-black/10 rounded-xl">
                <p className="text-[11px] font-bold tracking-widest uppercase text-black mb-3">Notify Me When Available</p>
                {notifyDone ? (
                  <p className="text-[12px] text-green-600 font-medium">✓ We'll notify you when this is back in stock!</p>
                ) : (
                  <div className="flex gap-2">
                    <input type="email" value={notifyEmail} onChange={e => setNotifyEmail(e.target.value)} placeholder="Enter your email" className="flex-1 border border-black/20 rounded-full px-4 py-2.5 text-[13px] outline-none focus:border-black" />
                    <button onClick={async () => {
                      if (!notifyEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) return;
                      try {
                        await safeFetch(`/api/notify-me`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: notifyEmail, product_id: product.id })
                        });
                      } catch {}
                      setNotifyDone(true);
                    }} className="px-5 py-2.5 bg-black text-white rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors">Notify</button>
                  </div>
                )}
              </div>
            )}

            {/* BUY NOW + ADD TO CART BUTTONS */}
            <div className="flex flex-col gap-3 mb-10">
              {isOutOfStock && (
                <div className="w-full py-3 text-center bg-red-50 border border-red-100 rounded-full text-[11px] font-bold tracking-widest uppercase text-red-500">
                  Out of Stock
                </div>
              )}
              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full bg-black text-white h-[54px] flex items-center justify-center gap-3 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-xl rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap size={18} strokeWidth={1.5} />
                {isOutOfStock ? 'Sold Out' : 'Buy Now'}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="w-full border-2 border-black text-black h-[54px] flex items-center justify-center gap-3 text-[12px] font-bold tracking-widest uppercase hover:bg-black/5 transition-colors rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                Add to Cart
              </button>
              <div className="flex items-center justify-center gap-6 py-4 border border-black/5 rounded-lg bg-[#fafafa]">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-black/70">
                  <Truck size={16} strokeWidth={1.5} /> Free Shipping
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-black/70">
                  <ShieldCheck size={16} strokeWidth={1.5} /> Easy Returns
                </div>
                <button onClick={handleShare} className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-black/70 hover:text-black transition-colors">
                  <Share2 size={16} strokeWidth={1.5} /> Share
                </button>
              </div>
            </div>

            {/* ACCORDION DETAILS (INCLUDES HSN, FABRIC, ETC) */}
            <div className="border-t border-black/10">
              
              <div className="border-b border-black/10">
                <button 
                  onClick={() => toggleSection('description')}
                  className="w-full py-6 flex justify-between items-center text-left"
                >
                  <span className="text-[12px] font-bold tracking-widest uppercase text-black">Product Details</span>
                  {openSection === 'description' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <AnimatePresence>
                  {openSection === 'description' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 text-[13px] text-black/70 leading-relaxed whitespace-pre-line">
                        {product.description}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-b border-black/10">
                <button 
                  onClick={() => toggleSection('specs')}
                  className="w-full py-6 flex justify-between items-center text-left"
                >
                  <span className="text-[12px] font-bold tracking-widest uppercase text-black">Specifications</span>
                  {openSection === 'specs' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <AnimatePresence>
                  {openSection === 'specs' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6">
                        <table className="w-full text-left text-[12px]">
                          <tbody>
                            {product.fabric && (
                              <tr className="border-b border-black/5">
                                <th className="py-3 font-medium text-black/50 w-1/3">Fabric</th>
                                <td className="py-3 text-black font-medium">{product.fabric}</td>
                              </tr>
                            )}
                            {product.pattern && (
                              <tr className="border-b border-black/5">
                                <th className="py-3 font-medium text-black/50 w-1/3">Pattern</th>
                                <td className="py-3 text-black font-medium">{product.pattern}</td>
                              </tr>
                            )}
                            {product.neck_type && (
                              <tr className="border-b border-black/5">
                                <th className="py-3 font-medium text-black/50 w-1/3">Neck Type</th>
                                <td className="py-3 text-black font-medium">{product.neck_type}</td>
                              </tr>
                            )}
                            {product.closure_type && (
                              <tr className="border-b border-black/5">
                                <th className="py-3 font-medium text-black/50 w-1/3">Closure Type</th>
                                <td className="py-3 text-black font-medium">{product.closure_type}</td>
                              </tr>
                            )}
                            {product.length_type && (
                              <tr className="border-b border-black/5">
                                <th className="py-3 font-medium text-black/50 w-1/3">Length</th>
                                <td className="py-3 text-black font-medium">{product.length_type}</td>
                              </tr>
                            )}
                            <tr className="border-b border-black/5">
                              <th className="py-3 font-medium text-black/50 w-1/3">Belt Included</th>
                              <td className="py-3 text-black font-medium">{product.belt_included ? "Yes" : "No"}</td>
                            </tr>
                            {product.hsn_code && (
                              <tr className="border-b border-black/5 bg-gray-50">
                                <th className="py-3 px-2 font-medium text-black/50 w-1/3">HSN Code</th>
                                <td className="py-3 px-2 text-black font-medium">{product.hsn_code}</td>
                              </tr>
                            )}
                            {product.origin_country && (
                              <tr className="border-b border-black/5">
                                <th className="py-3 font-medium text-black/50 w-1/3">Country of Origin</th>
                                <td className="py-3 text-black font-medium">{product.origin_country}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="border-b border-black/10">
                <button 
                  onClick={() => toggleSection('care')}
                  className="w-full py-6 flex justify-between items-center text-left"
                >
                  <span className="text-[12px] font-bold tracking-widest uppercase text-black">Care & Manufacturer</span>
                  {openSection === 'care' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <AnimatePresence>
                  {openSection === 'care' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: 'auto', opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 space-y-6">
                        {product.care_instructions && (
                          <div>
                            <h4 className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">Wash Care</h4>
                            {typeof product.care_instructions === 'string' ? (
                              <p className="text-[12px] text-black leading-relaxed">{product.care_instructions}</p>
                            ) : Array.isArray(product.care_instructions) ? (
                              <ul className="text-[12px] text-black leading-relaxed space-y-1 list-disc list-inside">
                                {product.care_instructions.map((instr, i) => <li key={i}>{instr}</li>)}
                              </ul>
                            ) : null}
                          </div>
                        )}
                        {product.manufacturer_details && (
                          <div>
                            <h4 className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">Manufacturer Details</h4>
                            <p className="text-[12px] text-black leading-relaxed whitespace-pre-line">{product.manufacturer_details}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* REVIEWS SECTION */}
            {reviews_enabled && (
            <div className="mt-12 border-t border-black/10 pt-10">
              <h2 className="text-[12px] font-bold tracking-widest uppercase mb-6">
                Customer Reviews
                {reviews.length > 0 && (
                  <span className="ml-3 text-black/40 font-medium">
                    ({reviews.length}) · {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} ★
                  </span>
                )}
              </h2>

              {/* WRITE REVIEW FORM */}
              {canReview && (
                <div className="bg-[#fafafa] border border-black/10 rounded-xl p-6 mb-8">
                  <p className="text-[11px] font-bold tracking-widest uppercase mb-4">Write a Review</p>
                  <div className="flex gap-2 mb-4">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setReviewForm(f => ({ ...f, rating: s }))}
                        className={`text-2xl transition-transform hover:scale-110 ${s <= reviewForm.rating ? 'text-yellow-400' : 'text-black/20'}`}
                      >★</button>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={3}
                    className="w-full border border-black/10 rounded-lg p-3 text-[13px] resize-none focus:outline-none focus:border-black/30 mb-4"
                  />
                  <button onClick={handleSubmitReview} disabled={submittingReview || !reviewForm.comment.trim()}
                    className="bg-black text-white px-8 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 disabled:opacity-40 transition-colors"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
              {alreadyReviewed && (
                <p className="text-[12px] text-green-600 mb-6">✓ You have reviewed this product</p>
              )}

              {/* REVIEWS LIST */}
              {reviews.length === 0 ? (
                <p className="text-[13px] text-black/40">No reviews yet. Be the first verified buyer to review!</p>
              ) : (
                <div className="space-y-6">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-black/5 pb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[12px] font-bold">{r.user_name}</span>
                        <span className="text-[11px] text-black/40">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="text-yellow-400 text-sm mb-2">{"★".repeat(r.rating)}<span className="text-black/20">{"★".repeat(5 - r.rating)}</span></div>
                      <p className="text-[13px] text-black/70 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

          </div>
        </div>
      </div>
      {/* YOU MAY ALSO LIKE */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-black/10 py-12 px-4 md:px-8">
          <div className="max-w-[1600px] mx-auto">
            <h2 className="text-[12px] font-bold tracking-widest uppercase text-black mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedProducts.map(p => (
                <Link key={p.id} href={`/product/${p.id}`} className="group flex flex-col">
                  <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-3">
                    <Image src={p.image_urls?.[0] || '/images/logo.png'} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width: 768px) 50vw, 16vw" />
                  </div>
                  <p className="text-[12px] text-black truncate">{p.title}</p>
                  <p className="text-[12px] font-bold text-black mt-0.5">₹{parseFloat(p.price).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>

      {/* ── STICKY MOBILE CTA BAR ── */}
      {/* Only visible on mobile, hidden on md+ where the full CTA is already visible */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-black/10 px-4 py-3 flex items-center gap-3 shadow-2xl">
        {/* Colour dot */}
        {selectedColor && selectedColor !== 'Default' && (
          <div className="w-8 h-8 rounded-full border border-black/20 flex-shrink-0 overflow-hidden relative">
            {product.color_images?.[selectedColor]?.[0] ? (
              <Image src={product.color_images[selectedColor][0]} alt={selectedColor} fill className="object-cover" sizes="32px" />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-[7px] text-black/40 uppercase">{selectedColor.slice(0,3)}</span>
              </div>
            )}
          </div>
        )}
        {/* Size selector */}
        <div className="flex-1 overflow-x-auto flex gap-1.5 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {availableSizes.map(size => (
            <button
              key={size}
              onClick={() => isSizeAvailableForColor(size) && setSelectedSize(size)}
              disabled={!isSizeAvailableForColor(size)}
              className={`flex-shrink-0 px-3 py-1.5 border rounded-full text-[10px] font-bold tracking-wider transition-all ${
                selectedSize === size
                  ? 'border-black bg-black text-white'
                  : isSizeAvailableForColor(size)
                  ? 'border-black/20 text-black/70'
                  : 'border-black/10 text-black/20 line-through'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {/* Buy Now + Add to cart */}
        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="flex-shrink-0 bg-black text-white px-5 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase disabled:opacity-40"
        >
          {isOutOfStock ? 'Sold Out' : 'Buy Now'}
        </button>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="flex-shrink-0 border-2 border-black text-black px-4 py-2 rounded-full text-[10px] font-bold tracking-widest uppercase disabled:opacity-40"
        >
          <ShoppingBag size={16} strokeWidth={1.5} />
        </button>
      </div>
      {/* Spacer so content isn't hidden behind sticky bar on mobile */}
      <div className="h-20 md:hidden" />
    </>
  );
}
