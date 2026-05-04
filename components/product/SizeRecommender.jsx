"use client";
// U5: height/weight based size suggestion. Static lookup; designed for kidswear age sizing.
import { useState } from "react";

const SIZE_TABLE = [
  { size: "0-3M",  hMin: 50, hMax: 60,  wMin: 3,  wMax: 5  },
  { size: "3-6M",  hMin: 60, hMax: 67,  wMin: 5,  wMax: 7  },
  { size: "6-12M", hMin: 67, hMax: 76,  wMin: 7,  wMax: 10 },
  { size: "12-18M",hMin: 76, hMax: 83,  wMin: 10, wMax: 12 },
  { size: "18-24M",hMin: 83, hMax: 90,  wMin: 12, wMax: 14 },
  { size: "2-3Y",  hMin: 90, hMax: 98,  wMin: 12, wMax: 15 },
  { size: "3-4Y",  hMin: 98, hMax: 105, wMin: 14, wMax: 17 },
  { size: "4-5Y",  hMin: 105,hMax: 112, wMin: 16, wMax: 19 },
  { size: "5-6Y",  hMin: 112,hMax: 120, wMin: 18, wMax: 22 },
  { size: "6-7Y",  hMin: 120,hMax: 128, wMin: 20, wMax: 25 },
  { size: "7-8Y",  hMin: 128,hMax: 134, wMin: 23, wMax: 28 },
];

function recommend(h, w) {
  const hits = SIZE_TABLE.filter((s) =>
    (h >= s.hMin && h <= s.hMax) || (w >= s.wMin && w <= s.wMax)
  );
  if (hits.length === 0) return null;
  // Prefer rows that match both
  const both = hits.find((s) => h >= s.hMin && h <= s.hMax && w >= s.wMin && w <= s.wMax);
  return both || hits[0];
}

export default function SizeRecommender({ availableSizes = [], onPick }) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState("");
  const [w, setW] = useState("");
  const [pick, setPick] = useState(null);

  const calc = () => {
    const hh = parseFloat(h);
    const ww = parseFloat(w);
    if (!hh && !ww) { setPick(null); return; }
    setPick(recommend(hh || 0, ww || 0));
  };

  const isAvailable = pick && availableSizes.some((s) => s === pick.size);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        type="button"
        className="text-[10px] tracking-widest uppercase text-black/50 hover:text-black border-b border-black/20 pb-0.5"
      >
        Find My Size
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] font-bold tracking-widest uppercase">Find My Size</h3>
              <button onClick={() => setOpen(false)} className="text-black/40 hover:text-black text-xl">×</button>
            </div>
            <p className="text-[12px] text-black/60 mb-4">Enter your child's height and/or weight for a size suggestion.</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label className="text-[11px] text-black/70">
                Height (cm)
                <input type="number" value={h} onChange={(e) => setH(e.target.value)} className="mt-1 w-full border border-black/20 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-black" />
              </label>
              <label className="text-[11px] text-black/70">
                Weight (kg)
                <input type="number" value={w} onChange={(e) => setW(e.target.value)} className="mt-1 w-full border border-black/20 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-black" />
              </label>
            </div>
            <button onClick={calc} className="w-full bg-black text-white py-3 rounded-full text-[11px] font-bold tracking-widest uppercase">Get Recommendation</button>
            {pick && (
              <div className="mt-4 p-4 bg-[#fafafa] rounded-lg">
                <p className="text-[12px] text-black/60">Recommended size</p>
                <p className="text-2xl font-bold mt-1">{pick.size}</p>
                {!isAvailable && availableSizes.length > 0 && (
                  <p className="text-[11px] text-orange-600 mt-2">Not available for this product. Closest available sizes shown above.</p>
                )}
                {isAvailable && onPick && (
                  <button onClick={() => { onPick(pick.size); setOpen(false); }} className="mt-3 text-[11px] font-bold tracking-widest uppercase border-b border-black pb-0.5">
                    Use this size →
                  </button>
                )}
              </div>
            )}
            {pick === null && (h || w) && <p className="mt-3 text-[12px] text-black/50">No match found — try a different value.</p>}
          </div>
        </div>
      )}
    </>
  );
}
