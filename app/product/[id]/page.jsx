"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, ChevronDown, ChevronUp, Heart, Share2, Truck, ShieldCheck } from "lucide-react";
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

  // 2. FETCH PRODUCT DATA (Now Crash-Proof)
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        // Prevent JSON crash if server sends a plain text error
        if (!response.ok) throw new Error("Product fetch failed or server error");
        
        const data = await response.json();
        
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
    const token = localStorage.getItem("token");
    if (token && product) {
      fetch(`http://localhost:5000/api/wishlist/check/${product.id}`, {
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
      alert("Please sign in to save items to your wishlist!");
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/wishlist/toggle", {
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
    
    const cartItem = {
      id: product.id,
      title: product.title,
      price: product.price,
      image: mainImage,
      selectedColor: selectedColor || "Default",
      selectedSize: selectedSize || "Default",
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
                  ${parseFloat(product.price).toFixed(2)}
                </p>
                {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                  <>
                    <p className="text-[14px] text-black/40 line-through">
                      ${parseFloat(product.mrp).toFixed(2)}
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
                      className={`px-6 py-3 border text-[11px] font-bold tracking-widest uppercase transition-all ${selectedColor === color ? 'border-black bg-black text-white' : 'border-black/20 text-black/70 hover:border-black/50'}`}
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
                  <button className="text-[10px] tracking-widest uppercase text-black/50 hover:text-black border-b border-black/20 pb-0.5">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {availableSizes.map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-[45px] flex items-center justify-center border text-[11px] font-bold tracking-widest uppercase transition-all ${selectedSize === size ? 'border-black bg-black text-white' : 'border-black/20 text-black/70 hover:border-black/50'}`}
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
                className="w-full bg-black text-white h-[54px] flex items-center justify-center gap-3 text-[12px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-xl"
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

          </div>
        </div>
      </div>
    </main>
  );
}