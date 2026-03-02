"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { motion } from "framer-motion";

export default function OrderSuccess() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="flex flex-col items-center justify-center h-[75vh] px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md"
        >
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-black mb-6">
            Order Confirmed
          </h1>
          
          <p className="text-xs text-black/60 tracking-widest uppercase mb-8 leading-relaxed">
            Thank you for your purchase. Your items are currently being curated and prepared for shipment. A confirmation email will be sent shortly.
          </p>
          
          {/* Minimalist Divider Line */}
          <div className="w-12 h-[1px] bg-black/20 mx-auto mb-10"></div>
          
          <Link 
            href="/"
            className="inline-block border border-black px-10 py-4 text-xs tracking-widest uppercase text-black hover:bg-black hover:text-white transition-colors"
          >
            Return to Boutique
          </Link>
        </motion.div>
      </div>
    </main>
  );
}