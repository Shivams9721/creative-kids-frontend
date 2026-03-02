"use client";

import { createContext, useContext, useState } from "react";

// 1. Create the Context
const CartContext = createContext();

// 2. Create the Provider (The Wrapper)
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Function to add an item
  const addToCart = (product, size) => {
    // We add a unique cartId in case they buy two of the same dress in different sizes
    setCart((prevCart) => [
      ...prevCart, 
      { ...product, cartId: Math.random().toString(), selectedSize: size }
    ]);
    setIsCartOpen(true); // Automatically open the cart drawer when an item is added
  };

  // Function to remove an item
  const removeFromCart = (cartId) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartId !== cartId));
  };

  const cartCount = cart.length;
  const cartTotal = cart.reduce((total, item) => total + parseFloat(item.price), 0);

  return (
    <CartContext.Provider value={{ cart,setCart, addToCart, removeFromCart, cartCount, cartTotal, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
}

// 3. Create a custom hook for easy access
export const useCart = () => useContext(CartContext);