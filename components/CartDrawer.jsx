"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link"; // Added missing Link import

export default function CartDrawer() {
  // Extracting cartTotal instead of getCartTotal
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, cartTotal } = useCart();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* 1. The Dark Background Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
          />

          {/* 2. The Sliding White Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-black/10">
              <h2 className="text-sm font-medium tracking-widest uppercase text-black">
                Your Cart ({cart.length})
              </h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:opacity-50 transition-opacity"
              >
                <X strokeWidth={1.5} size={20} className="text-black" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-xs tracking-widest uppercase text-black/50 mb-4">Your cart is empty</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="border border-black px-6 py-3 text-xs tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartId} className="flex gap-4 items-center">
                    {/* Item Image */}
                    <div className="w-24 aspect-[3/4] bg-gray-50 flex-shrink-0 relative overflow-hidden">
                      <img
                        src={item.image || (item.image_urls && item.image_urls[0]) || 'https://via.placeholder.com/150'}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-sm text-black font-medium">{item.title}</h3>
                      <p className="text-xs text-black/50 tracking-widest uppercase mt-1">
                        Size: {item.selectedSize || item.size}
                      </p>
                      <p className="text-sm text-black mt-2">${item.price}</p>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.cartId)}
                      className="p-2 hover:text-red-500 transition-colors text-black/40"
                    >
                      <Trash2 strokeWidth={1.5} size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-black/10 bg-gray-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm tracking-widest uppercase text-black">Subtotal</span>
                  {/* Fixed: Using cartTotal directly instead of calling it as a function */}
                  <span className="text-lg text-black font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <p className="text-[10px] tracking-widest uppercase text-black/40 text-center mb-4">
                  Taxes and shipping calculated at checkout
                </p>
                
                {/* Fixed: Replaced the mangled button/div structure with a clean Next.js Link */}
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-[#333] hover:bg-black text-white px-8 py-4 text-[12px] font-bold tracking-widest uppercase flex justify-center transition-colors"
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