"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { safeFetch } from "@/lib/safeFetch";

export default function QuickViewModal({ productId, onClose }) {
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // Fetch product data when modal opens
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setAdded(false);
    setSelectedColor(null);
    setSelectedSize(null);
    setActiveImg(0);

    safeFetch(`/api/products/${productId}`)
      .then(r => r.json())
      .then(data => {
        const parsed = {
          ...data,
          image_urls: (() => {
            try { return typeof data.image_urls === "string" ? JSON.parse(data.image_urls) : (data.image_urls || []); } catch { return []; }
          })(),
          variants: (() => {
            try { return typeof data.variants === "string" ? JSON.parse(data.variants) : (data.variants || []); } catch { return []; }
          })(),
        };
        setProduct(parsed);
        // Default selections
        if (parsed.color) setSelectedColor(parsed.color);
        const firstSize = parsed.variants?.[0]?.size;
        if (firstSize && firstSize !== "Default") setSelectedSize(firstSize);

        // Fetch siblings for color swatches
        if (data.variant_group_id) {
          safeFetch(`/api/products/group/${data.variant_group_id}`)
            .then(r => r.json())
            .then(sibs => Array.isArray(sibs) ? setSiblings(sibs) : setSiblings([]))
            .catch(() => setSiblings([]));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [productId]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    const variant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize)
      || product.variants.find(v => v.color === selectedColor)
      || product.variants[0]
      || {};
    setAdding(true);
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      mrp: product.mrp,
      image: product.image_urls?.[0] || "/images/logo.png",
      selectedColor: selectedColor || variant.color || "Default",
      selectedSize: selectedSize || variant.size || "Default",
      sku: variant.sku || product.sku || null,
      baseSku: product.sku || null,
      quantity: 1,
    });
    setTimeout(() => { setAdding(false); setAdded(true); }, 400);
    setTimeout(() => setAdded(false), 2500);
  };

  // Unique sizes for selected color
  const sizesForColor = product
    ? [...new Set(product.variants.filter(v => !selectedColor || v.color === selectedColor || v.color === "Default").map(v => v.size).filter(s => s && s !== "Default"))]
    : [];

  const currentImages = product?.image_urls || [];

  return (
    <AnimatePresence>
      {productId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
          />

          {/* Modal Panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 z-[90] bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col md:top-1/2 md:bottom-auto md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:w-[860px] md:max-h-[90vh]"
          >
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 md:hidden">
              <div className="w-10 h-1 bg-black/15 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={16} strokeWidth={2} />
            </button>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              </div>
            ) : !product ? (
              <div className="flex-1 flex items-center justify-center py-20">
                <p className="text-[12px] text-black/40 tracking-widest uppercase">Product not found</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Image Panel */}
                <div className="relative md:w-[380px] flex-shrink-0 bg-[#f6f5f3] rounded-t-3xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
                  <div className="relative aspect-[3/4] md:h-full md:aspect-auto overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeImg}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        src={currentImages[activeImg] || "/images/logo.png"}
                        alt={product.title}
                        className="w-full h-full object-cover object-center"
                      />
                    </AnimatePresence>

                    {/* Image nav arrows */}
                    {currentImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImg(i => (i === 0 ? currentImages.length - 1 : i - 1))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
                        >
                          <ChevronLeft size={15} />
                        </button>
                        <button
                          onClick={() => setActiveImg(i => (i === currentImages.length - 1 ? 0 : i + 1))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
                        >
                          <ChevronRight size={15} />
                        </button>
                      </>
                    )}

                    {/* Image dots */}
                    {currentImages.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                        {currentImages.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImg ? "bg-black w-3" : "bg-black/30"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Panel */}
                <div className="flex-1 flex flex-col overflow-y-auto p-5 md:p-8">
                  {/* Title + Price */}
                  <div className="mb-5">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-1">
                      {product.main_category} · {product.item_type || product.sub_category}
                    </p>
                    <h2 className="text-[18px] md:text-[20px] font-medium text-black leading-snug mb-3">{product.title}</h2>
                    <div className="flex items-center gap-3">
                      <span className="text-[20px] font-bold text-black">₹{parseFloat(product.price).toFixed(0)}</span>
                      {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                        <>
                          <span className="text-[14px] text-black/40 line-through">₹{parseFloat(product.mrp).toFixed(0)}</span>
                          <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            {Math.round(((parseFloat(product.mrp) - parseFloat(product.price)) / parseFloat(product.mrp)) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Color Swatches (show siblings if available) */}
                  {(siblings.length > 1 || product.color) && (
                    <div className="mb-5">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">
                        Color: <span className="text-black">{selectedColor || product.color}</span>
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {siblings.length > 1
                          ? siblings.map(sib => {
                            const sibImgs = (() => { try { return typeof sib.image_urls === "string" ? JSON.parse(sib.image_urls) : (sib.image_urls || []); } catch { return []; } })();
                            return (
                              <button
                                key={sib.id}
                                onClick={() => setSelectedColor(sib.color)}
                                className={`w-8 h-8 rounded-full border-2 overflow-hidden transition-all ${selectedColor === sib.color ? "border-black scale-110" : "border-transparent hover:border-black/30"}`}
                                title={sib.color}
                              >
                                {sibImgs[0]
                                  ? <img src={sibImgs[0]} alt={sib.color} className="w-full h-full object-cover" />
                                  : <span className="w-full h-full bg-gray-200 flex items-center justify-center text-[8px] font-bold">{sib.color?.slice(0, 2)}</span>
                                }
                              </button>
                            );
                          })
                          : product.color && (
                            <span className="text-[12px] text-black/60 border border-black/20 px-3 py-1 rounded-full">{product.color}</span>
                          )
                        }
                      </div>
                    </div>
                  )}

                  {/* Size Selector */}
                  {sizesForColor.length > 0 && (
                    <div className="mb-6">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">Select Size</p>
                      <div className="flex gap-2 flex-wrap">
                        {sizesForColor.map(size => {
                          const variant = product.variants.find(v => v.size === size && (!selectedColor || v.color === selectedColor));
                          const outOfStock = variant && parseInt(variant.stock) === 0;
                          return (
                            <button
                              key={size}
                              onClick={() => !outOfStock && setSelectedSize(size)}
                              disabled={outOfStock}
                              className={`px-3 py-2 text-[11px] font-bold border rounded-lg transition-all relative
                                ${selectedSize === size ? "bg-black text-white border-black" : "bg-white text-black border-black/20 hover:border-black"}
                                ${outOfStock ? "opacity-40 cursor-not-allowed line-through" : ""}
                              `}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Description snippet */}
                  {product.description && (
                    <p className="text-[12px] text-black/50 leading-relaxed mb-6 line-clamp-3">{product.description}</p>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 mt-auto pt-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={adding || (sizesForColor.length > 0 && !selectedSize)}
                      className={`w-full py-4 flex items-center justify-center gap-2 text-[12px] font-bold tracking-widest uppercase rounded-full transition-all
                        ${added
                          ? "bg-green-600 text-white"
                          : "bg-black hover:bg-black/80 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        }`}
                    >
                      <ShoppingBag size={16} />
                      {added ? "Added to Cart!" : adding ? "Adding..." : sizesForColor.length > 0 && !selectedSize ? "Select a Size" : "Add to Cart"}
                    </button>

                    <Link
                      href={`/product/${product.id}`}
                      onClick={onClose}
                      className="w-full py-3 text-center text-[11px] font-bold tracking-widest uppercase border border-black/20 rounded-full hover:border-black transition-colors text-black/60 hover:text-black"
                    >
                      View Full Details →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
