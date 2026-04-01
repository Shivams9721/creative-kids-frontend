"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProductGrid() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch only new arrivals with a limit — no need to load the full catalogue
        const response = await fetch(`${API}/api/products?new_arrival=true`);
        const rawData = await response.json();
        const data = rawData.map(p => ({
          ...p,
          image_urls: (() => { try { return typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (p.image_urls || []); } catch { return []; } })()
        }));
        setProducts(data);
      } catch (error) {
        console.error("Database connection failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-32 flex justify-center items-center bg-white">
        <span className="text-sm tracking-widest uppercase text-black animate-pulse">
          Curating Collection...
        </span>
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div className="flex justify-between items-end mb-12">
        <h2 className="text-2xl md:text-3xl font-light tracking-tight text-black">
          New Arrivals
        </h2>
        <Link href="/shop" className="text-xs font-medium tracking-widest uppercase text-black hover:underline underline-offset-4 mb-1">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
        {products.map((product, index) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group cursor-pointer flex flex-col"
          >
            {/* WRAP THE CONTENT IN A LINK */}
            <Link href={`/product/${product.id}`} className="flex flex-col w-full h-full">
              
              <div className="relative w-full aspect-[3/4] overflow-hidden mb-4 bg-gray-50">
                <img 
                  src={product.image_urls[0] || ''} 
                  alt={product.title}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const variants = (() => { try { return typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []); } catch { return []; } })();
                      const first = variants.find(v => (parseInt(v.stock) || 0) > 0) || variants[0];
                      addToCart({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        mrp: product.mrp,
                        image: product.image_urls[0] || '',
                        selectedColor: first?.color || 'Default',
                        selectedSize: first?.size || 'Default',
                        sku: first?.sku || null,
                        baseSku: product.sku || null,
                        quantity: 1
                      });
                    }}
                    className="w-full bg-black text-white text-xs tracking-widest uppercase py-3 hover:bg-black/80 transition-colors shadow-lg"
                  >
                    Quick Add
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-medium text-black">
                    {product.title}
                  </h3>
                  <p className="text-xs text-black/50 mt-1 uppercase tracking-wider">
                    {product.category}
                  </p>
                </div>
                <p className="text-sm text-black">
                  ₹{product.price}
                </p>
              </div>

            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
