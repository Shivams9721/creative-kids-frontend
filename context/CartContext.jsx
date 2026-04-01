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
    const compositeId = `${product.id}-${product.selectedColor || 'Default'}-${product.selectedSize || 'Default'}`;
    
    setCart(prev => {
      const existingItemIndex = prev.findIndex(i => i.cartId === compositeId);

      // Store only minimal fields to avoid localStorage quota issues
      const slimProduct = {
        id: product.id,
        title: product.title,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        selectedColor: product.selectedColor || 'Default',
        selectedSize: product.selectedSize || 'Default',
        sku: product.sku,
        baseSku: product.baseSku,
        quantity: product.quantity || 1,
        cartId: compositeId,
      };

      if (existingItemIndex >= 0) {
        // Item exists, just increment quantity
        const nextCart = [...prev];
        nextCart[existingItemIndex].quantity += 1;
        return nextCart;
      } else {
        // Item does not exist, add it
        return [...prev, slimProduct];
      }
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId, quantity) => {
    if (quantity < 1) {
      removeFromCart(cartId);
      return;
    }
    setCart(prev => prev.map(item => item.cartId === cartId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
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
