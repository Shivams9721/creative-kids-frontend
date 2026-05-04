import React from 'react';
import { Package, Lock, RotateCcw, Headset } from 'lucide-react';
import {
  WavyDivider,
  Butterfly,
  AnimatedFlower,
  AnimatedSparkle,
  Floating,
} from '@/components/decorations';

export default function TrustBadges() {
  return (
    <section className="w-full bg-white py-12 px-4 relative overflow-hidden">
      {/* Subtle decorative graphics */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute top-6 left-[14%]"><AnimatedSparkle size={12} color="#E2889D" /></div>
        <div className="absolute top-8 right-[16%]"><AnimatedSparkle size={10} color="#BDD9E8" /></div>

        <div className="absolute top-[30%] left-[8%]">
          <Floating duration={3.8} amplitude={8}><Butterfly size={24} color="#E2889D" /></Floating>
        </div>
        <div className="hidden md:block absolute top-[35%] right-[10%]">
          <Floating duration={4.2} amplitude={7} delay={0.6}><Butterfly size={22} color="#BDD9E8" /></Floating>
        </div>

        <div className="absolute bottom-2 left-0 right-0 h-8">
          {[20, 48, 76].map((l, i) => (
            <div key={`f-${i}`} className="absolute bottom-0" style={{ left: `${l}%` }}>
              <AnimatedFlower size={14} petal={['#E2889D', '#F0B95B', '#BDD9E8'][i % 3]} />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-4 text-center relative z-10">

        {/* Item 1: Free Delivery */}
        <div className="flex flex-col items-center justify-start">
          <Package strokeWidth={1.5} size={36} className="text-black mb-4" />
          <h3 className="text-[14px] font-bold tracking-widest text-black uppercase mb-2">Free Delivery</h3>
          <p className="text-[12px] text-black/60 font-medium">On Orders Over ₹499</p>
        </div>

        {/* Item 2: Secure Payment */}
        <div className="flex flex-col items-center justify-start">
          <Lock strokeWidth={1.5} size={36} className="text-black mb-4" />
          <h3 className="text-[14px] font-bold tracking-widest text-black uppercase mb-2">Secure Payment</h3>
          <p className="text-[12px] text-black/60 font-medium mb-3">Pay safely</p>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {/* Visa */}
            <div className="h-[26px] w-[42px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm">
              <span className="font-bold italic text-[11px] tracking-tight" style={{ color: "#1A1F71", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>VISA</span>
            </div>
            {/* Mastercard */}
            <div className="h-[26px] w-[42px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 36 22" className="h-[18px] w-auto" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="11" r="9" fill="#EB001B" />
                <circle cx="22" cy="11" r="9" fill="#F79E1B" />
                <path d="M18 4.6 a9 9 0 0 1 0 12.8 a9 9 0 0 1 0 -12.8 z" fill="#FF5F00" />
              </svg>
            </div>
            {/* RuPay */}
            <div className="h-[26px] w-[48px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm gap-[1px]">
              <span className="font-extrabold text-[10px] tracking-tight" style={{ color: "#097C3C", fontFamily: "Arial, sans-serif" }}>Ru</span>
              <span className="font-extrabold italic text-[10px] tracking-tight" style={{ color: "#F04E23", fontFamily: "Arial, sans-serif" }}>Pay</span>
            </div>
            {/* UPI */}
            <div className="h-[26px] w-[42px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm gap-[1px]">
              <span className="font-extrabold text-[10px]" style={{ color: "#097C3C", fontFamily: "Arial, sans-serif" }}>U</span>
              <span className="font-extrabold text-[10px]" style={{ color: "#F04E23", fontFamily: "Arial, sans-serif" }}>P</span>
              <span className="font-extrabold text-[10px]" style={{ color: "#0A5C99", fontFamily: "Arial, sans-serif" }}>I</span>
            </div>
          </div>
        </div>

        {/* Item 3: Easy Returns */}
        <div className="flex flex-col items-center justify-start">
          <RotateCcw strokeWidth={1.5} size={36} className="text-black mb-4" />
          <h3 className="text-[14px] font-bold tracking-widest text-black uppercase mb-2">Easy Returns</h3>
          <p className="text-[12px] text-black/60 font-medium">Within 14 business days</p>
        </div>

        {/* Item 4: Customer Service */}
        <div className="flex flex-col items-center justify-start">
          <Headset strokeWidth={1.5} size={36} className="text-black mb-4" />
          <h3 className="text-[14px] font-bold tracking-widest text-black uppercase mb-2">Customer Service</h3>
          <p className="text-[12px] text-black/60 font-medium">Need help? Contact us!</p>
        </div>

      </div>
      <WavyDivider className="absolute bottom-0 left-0" />
    </section>
  );
}
