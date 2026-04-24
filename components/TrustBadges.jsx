import React from 'react';
import { Package, Lock, RotateCcw, Headset } from 'lucide-react';

export default function TrustBadges() {
  return (
    <section className="w-full bg-white border-y border-black/10 py-12 px-4">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-4 text-center">
        
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
          <div className="flex items-center gap-2 justify-center">
            {/* Visa */}
            <div className="h-[24px] w-[38px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm p-1">
              <svg viewBox="0 0 38 12" className="h-2.5 w-auto" fill="#1434CB" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.717 0l-2.317 11.666H9.414l1.472-7.442c.038-.19.066-.388.24-.543.167-.15.42-.236.7-.236h3.407L14.717 0zM22.84 0l-2.32 11.666h-2.986L19.854 0h2.986zM37.943 0l-1.077 11.666h-3.13l.492-2.348h-3.666l-.508 2.348h-3.136L29.356 0h3.044l-1.637 7.556h3.666L35.917 0h2.026zM8.337 0H4.72c-.676 0-1.22.42-1.463 1.056L.014 11.666h3.135l.626-1.722h3.816l.36 1.722h2.984L8.337 0zm-3.082 7.742l1.658-4.57.865 4.57H5.255z"/>
              </svg>
            </div>
            {/* Mastercard */}
            <div className="h-[24px] w-[38px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm p-1">
              <svg viewBox="0 0 38 24" className="h-3 w-auto" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="12" fill="#EB001B"/>
                <circle cx="26" cy="12" r="12" fill="#F79E1B"/>
                <path d="M19 12a11.95 11.95 0 014.54-9.42A11.95 11.95 0 0014 12a11.95 11.95 0 009.54 9.42A11.95 11.95 0 0119 12z" fill="#FF5F00"/>
              </svg>
            </div>
            {/* PayPal */}
            <div className="h-[24px] w-[38px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm p-1">
              <svg viewBox="0 0 24 24" className="h-3.5 w-auto" fill="#003087" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.819 1.137 4.608-.415 4.415-3.328 7.373-7.514 7.373H9.845a.64.64 0 00-.632.535l-1.393 6.84a.643.643 0 01-.633.513v-.341z"/>
                <path d="M21.285 6.422a5.558 5.558 0 00-.547-1.462c-.93-1.41-2.905-1.92-5.46-1.92H7.818a.642.642 0 00-.633.535L4.07 19.123c-.053.308.196.58.508.58h3.805a.642.642 0 00.633-.535l.89-4.373a.641.641 0 01.632-.535h2.17c3.606 0 6.113-1.666 6.702-5.32.222-1.38.016-2.518-.125-2.518z" fill="#0079C1"/>
              </svg>
            </div>
            {/* UPI */}
            <div className="h-[24px] w-[38px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm p-1">
              <span className="font-bold text-[11px] tracking-tight" style={{ color: "#0F7A59" }}>UPI</span>
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
    </section>
  );
}
