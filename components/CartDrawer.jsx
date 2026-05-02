"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { Mascot, Heart, Sparkle } from "@/components/decorations";

const FREE_SHIPPING_THRESHOLD = 499;
const SHIPPING_FEE = 99;

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const progress = Math.min(100, (cartTotal / FREE_SHIPPING_THRESHOLD) * 100);
  const unlocked = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingFee = unlocked || cart.length === 0 ? 0 : SHIPPING_FEE;
  const grandTotal = cartTotal + shippingFee;

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-black/10">
              <h2 className="text-sm font-medium tracking-widest uppercase text-black">
                Your Cart ({cart.length})
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:opacity-50 transition-opacity">
                <X strokeWidth={1.5} size={20} />
              </button>
            </div>

            {/* Free shipping progress bar */}
            <div className="px-6 py-3 bg-[#fafafa] border-b border-black/5">
              {unlocked ? (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-bold tracking-widest uppercase text-green-600 text-center"
                >
                  🎉 Free shipping unlocked!
                </motion.p>
              ) : (
                <p className="text-[11px] tracking-widest uppercase text-black/50 mb-2">
                  Add <span className="font-bold text-black">₹{remaining.toFixed(0)}</span> more for free shipping
                </p>
              )}
              <div className="h-1 bg-black/10 rounded-full overflow-hidden mt-1">
                <motion.div
                  className="h-full rounded-full bg-black"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ background: unlocked ? '#16a34a' : '#000' }}
                />
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-3">
                    <Mascot pose="read" size={140} />
                    <Sparkle className="absolute top-2 -right-1" size={14} color="#F0B95B" />
                    <Heart className="absolute top-6 -left-3" size={14} color="#E2889D" />
                  </div>
                  <p className="text-xs tracking-widest uppercase text-black/50 mb-4">Your cart is empty</p>
                  <button onClick={() => setIsCartOpen(false)} className="border border-black px-6 py-3 text-xs tracking-widest uppercase hover:bg-black hover:text-white transition-colors rounded-full">
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex gap-4 items-start">
                    <div className="w-20 aspect-[3/4] bg-gray-50 flex-shrink-0 relative overflow-hidden rounded-md">
                      <img
                        src={item.image || (item.image_urls && item.image_urls[0]) || '/images/logo.png'}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <h3 className="text-[13px] text-black font-medium leading-tight truncate">{item.title}</h3>
                      <div className="flex gap-3 text-[11px] text-black/50 tracking-widest uppercase">
                        {item.selectedSize && item.selectedSize !== 'Default' && <span>Size: {item.selectedSize}</span>}
                        {item.selectedColor && item.selectedColor !== 'Default' && <span>Color: {item.selectedColor}</span>}
                      </div>
                      <p className="text-[13px] font-bold text-black mt-1">₹{(parseFloat(item.price) * (item.quantity || 1)).toFixed(2)}</p>
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-black/20 rounded-full overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.cartId, (item.quantity || 1) - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                          >
                            <Minus size={12} strokeWidth={2} />
                          </button>
                          <span className="w-8 text-center text-[13px] font-bold">{item.quantity || 1}</span>
                          <button
                            onClick={() => updateQuantity(item.cartId, (item.quantity || 1) + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                          >
                            <Plus size={12} strokeWidth={2} />
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.cartId)} className="p-1 hover:text-red-500 transition-colors text-black/30">
                          <Trash2 strokeWidth={1.5} size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-black/10 bg-gray-50">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm tracking-widest uppercase text-black/70">Subtotal</span>
                  <span className="text-sm text-black">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm tracking-widest uppercase text-black/70">Delivery</span>
                  <span className="text-sm text-black">
                    {shippingFee === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      <>₹{shippingFee.toFixed(2)}</>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2 pt-2 border-t border-black/10">
                  <span className="text-sm tracking-widest uppercase text-black font-bold">Total</span>
                  <span className="text-lg text-black font-bold">₹{grandTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] tracking-widest uppercase text-black/40 text-center mb-4">
                   Free shipping above ₹499
                </p>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-black hover:bg-black/80 text-white px-8 py-4 text-[12px] font-bold tracking-widest uppercase flex justify-center transition-colors rounded-full"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
