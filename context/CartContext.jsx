"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCartState] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ck_cart");
      if (saved) setCartState(JSON.parse(saved));
    } catch {}
  }, []);

  // Persist to localStorage on every change
  const setCart = (updater) => {
    setCartState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try { localStorage.setItem("ck_cart", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const addToCart = (product) => {
    setCart(prev => {
      // If same product + color + size already in cart, increment quantity
      const existing = prev.findIndex(
        i => i.id === product.id &&
             i.selectedColor === product.selectedColor &&
             i.selectedSize === product.selectedSize
      );
      let next;
      if (existing >= 0) {
        next = prev.map((item, idx) =>
          idx === existing ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      } else {
        next = [...prev, { ...product, cartId: Math.random().toString(), quantity: product.quantity || 1 }];
      }
      try { localStorage.setItem("ck_cart", JSON.stringify(next)); } catch {}
      return next;
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity < 1) { removeFromCart(cartId); return; }
    setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
    try { localStorage.removeItem("ck_cart"); } catch {}
  };

  const cartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartTotal = cart.reduce((total, item) => total + parseFloat(item.price) * (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
