"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, ChevronDown, ChevronUp, Heart, Share2, Truck, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  
  // 1. STATE INITIALIZATION
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [openSection, setOpenSection] = useState("description");
  
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showGuestWishlistModal, setShowGuestWishlistModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  // 2. FETCH PRODUCT DATA (Now Crash-Proof)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`https://vbaumdstnz.ap-south-1.awsapprunner.com/api/products/${id}`);
        // Prevent JSON crash if server sends a plain text error
        if (!response.ok) throw new Error("Product fetch failed or server error");
        
        const data = await response.json();
        
        let parsedImages = [];
        try { parsedImages = typeof data.image_urls === 'string' ? JSON.parse(data.image_urls) : (data.image_urls || []); } catch(e) {}
        data.image_urls = parsedImages;

        let parsedVariants = [];
        if (typeof data.variants === 'string') {
          parsedVariants = JSON.parse(data.variants);
        } else if (Array.isArray(data.variants)) {
          parsedVariants = data.variants;
        }
        data.parsedVariants = parsedVariants;

        setProduct(data);
        
        if (data.image_urls && data.image_urls.length > 0) {
          setMainImage(data.image_urls[0]);
        }
        
        if (parsedVariants.length > 0) {
          const colors = [...new Set(parsedVariants.map(v => v.color))].filter(c => c !== "Default");
          const sizes = [...new Set(parsedVariants.map(v => v.size))].filter(s => s !== "Default");
          if (colors.length > 0) setSelectedColor(colors[0]);
          if (sizes.length > 0) setSelectedSize(sizes[0]);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // 3. WISHLIST LOGIC (Now Crash-Proof)
  useEffect(() => {
    if (!product) return;
    // Fetch reviews
    fetch(`https://vbaumdstnz.ap-south-1.awsapprunner.com/api/reviews/${product.id}`)
      .then(r => r.json()).then(setReviews).catch(() => {});

    // Check if logged-in user can review
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`https://vbaumdstnz.ap-south-1.awsapprunner.com/api/reviews/check/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        setCanReview(d.canReview);
        setAlreadyReviewed(d.alreadyReviewed);
      }).catch(() => {});
    }
  }, [product]);

  const handleSubmitReview = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSubmittingReview(true);
    try {
      const res = await fetch('https://vbaumdstnz.ap-south-1.awsapprunner.com/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  // WISHLIST LOGIC (Now Crash-Proof)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && product) {
      fetch(`https://vbaumdstnz.ap-south-1.awsapprunner.com/api/wishlist/check/${product.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(async res => {
         // Safely abort if the backend throws an error
         if (!res.ok) return null; 
         return res.json();
      })
      .then(data => {
         if (data) setIsWishlisted(data.isWishlisted);
      })
      .catch(err => console.error("Wishlist check error:", err));
    }
  }, [product]);

  const handleWishlistToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowGuestWishlistModal(true);
      return;
    }

    try {
      const response = await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/wishlist/toggle", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id })
      });
      
      // If the database is missing the table, alert the user nicely instead of crashing!
      if (!response.ok) {
         alert("Database Error: Make sure you ran the 'CREATE TABLE wishlist' command in pgAdmin!");
         return;
      }

      const data = await response.json();
      setIsWishlisted(data.isWishlisted); 
    } catch (error) {
      console.error("Failed to update wishlist", error);
    }
  };

  // 4. CART LOGIC
  const handleAddToCart = () => {
    if (!product) return;
    
    const matchedVariant = product.parsedVariants.find(v =>
      v.color === (selectedColor || "Default") && v.size === (selectedSize || "Default")
    );
    const cartItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      image: mainImage,
      selectedColor: selectedColor || "Default",
      selectedSize: selectedSize || "Default",
      sku: matchedVariant?.sku || null,
      baseSku: product.sku || null,
      quantity: 1
    };
    
    addToCart(cartItem);
  };

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  // 5. LOADING & ERROR STATES
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <span className="text-[11px] tracking-widest uppercase text-black animate-pulse">Loading Product...</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
        <h1 className="text-2xl font-light">Product Not Found</h1>
        <Link href="/shop" className="text-[11px] font-bold tracking-widest uppercase border-b border-black">Return to Shop</Link>
      </div>
    );
  }

  const availableColors = [...new Set(product.parsedVariants.map(v => v.color))].filter(c => c !== "Default");
  const availableSizes = [...new Set(product.parsedVariants.map(v => v.size))].filter(s => s !== "Default");

  // 6. RENDER UI
  return (
    <main className="min-h-screen bg-white pt-[64px] md:pt-[72px]">

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
                <img src="https://i.postimg.cc/nrj3wLGL/image.png" alt="Size Guide" className="w-full rounded-lg" />
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
          <div className="w-full lg:w-1/2 flex flex-col-reverse md:flex-row gap-4 lg:sticky lg:top-[100px] lg:h-[calc(100vh-120px)]">
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:w-20 flex-shrink-0 [&::-webkit-scrollbar]:hidden">
                {product.image_urls.map((url, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setMainImage(url)}
                    className={`w-16 h-20 md:w-full md:h-24 flex-shrink-0 bg-gray-100 overflow-hidden border transition-all ${mainImage === url ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={url} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            
            <div className="w-full aspect-[3/4] bg-[#f6f5f3] relative overflow-hidden flex-1">
              <img src={mainImage} alt={product.title} className="w-full h-full object-cover object-center" />
              
              {/* WISHLIST BUTTON */}
              <button 
                onClick={handleWishlistToggle}
                className="absolute top-6 right-6 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:scale-110 transition-transform z-10 shadow-sm"
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
              <h1 className="text-3xl md:text-4xl font-light text-black mb-4">{product.title}</h1>
              
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
                  <span className="text-[11px] font-bold tracking-widest uppercase text-black">Color: <span className="text-black/60 font-medium">{selectedColor}</span></span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map(color => (
                    <button 
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-6 py-3 border rounded-full text-[11px] font-bold tracking-widest uppercase transition-all ${selectedColor === color ? 'border-black bg-black text-white' : 'border-black/20 text-black/70 hover:border-black/50'}`}
                    >
                      {color}
                    </button>
                  ))}
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
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-[45px] flex items-center justify-center border rounded-full text-[11px] font-bold tracking-widest uppercase transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-black/20 text-black/70 hover:border-black/50'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ADD TO CART BUTTON */}
            <div className="flex flex-col gap-4 mb-10">
              <button 
                onClick={handleAddToCart}
                className="w-full bg-black text-white h-[54px] flex items-center justify-center gap-3 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-xl rounded-full"
              >
                <ShoppingBag size={18} strokeWidth={1.5} />
                Add to Cart
              </button>
              <div className="flex items-center justify-center gap-8 py-4 border border-black/5 rounded-lg bg-[#fafafa]">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-black/70">
                  <Truck size={16} strokeWidth={1.5} /> Free Shipping
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-black/70">
                  <ShieldCheck size={16} strokeWidth={1.5} /> Easy Returns
                </div>
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
                            <p className="text-[12px] text-black leading-relaxed">{product.care_instructions}</p>
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

          </div>
        </div>
      </div>
    </main>
  );
}