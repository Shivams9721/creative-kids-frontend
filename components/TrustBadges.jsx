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
            <div className="h-[24px] w-[38px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm overflow-hidden p-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="w-full h-full object-contain" />
            </div>
            {/* Mastercard */}
            <div className="h-[24px] w-[38px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm overflow-hidden p-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="w-full h-full object-contain" />
            </div>
            {/* PayPal */}
            <div className="h-[24px] w-[38px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm overflow-hidden p-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png" alt="PayPal" className="w-full h-full object-contain" />
            </div>
            {/* UPI */}
            <div className="h-[24px] w-[38px] bg-white border border-gray-200 rounded flex items-center justify-center shadow-sm overflow-hidden p-1">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/200px-UPI-Logo-vector.svg.png" alt="UPI" className="w-full h-full object-contain" />
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
