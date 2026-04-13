"use client";
import { useState, useEffect } from "react";
import { X, Baby } from "lucide-react";

const STORAGE_KEY = "ck_child_dob";

// Returns the recommended size range based on age in months
function getSizeForAge(months) {
  if (months < 3)   return "0M–3M";
  if (months < 6)   return "3M–6M";
  if (months < 9)   return "6M–9M";
  if (months < 12)  return "9M–12M";
  if (months < 18)  return "12M–18M";
  if (months < 24)  return "18M–24M";
  const years = months / 12;
  if (years < 3)    return "2Y–3Y";
  if (years < 4)    return "3Y–4Y";
  if (years < 5)    return "4Y–5Y";
  if (years < 6)    return "5Y–6Y";
  if (years < 7)    return "6Y–7Y";
  if (years < 8)    return "7Y–8Y";
  if (years < 9)    return "8Y–9Y";
  if (years < 10)   return "9Y–10Y";
  if (years < 11)   return "10Y–11Y";
  if (years < 12)   return "11Y–12Y";
  if (years < 13)   return "12Y–13Y";
  return "13Y–14Y";
}

function getNextSize(currentSize) {
  const order = [
    "0M–3M","3M–6M","6M–9M","9M–12M","12M–18M","18M–24M",
    "2Y–3Y","3Y–4Y","4Y–5Y","5Y–6Y","6Y–7Y","7Y–8Y","8Y–9Y",
    "9Y–10Y","10Y–11Y","11Y–12Y","12Y–13Y","13Y–14Y",
  ];
  const idx = order.indexOf(currentSize);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
}

function getAgeLabel(months) {
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}y ${m}m` : `${y} year${y === 1 ? "" : "s"}`;
}

// Hook — use this anywhere to get the current child's recommended size
export function useChildSize() {
  const [size, setSize] = useState(null);
  const [name, setName] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved) return;
      const dob = new Date(saved.dob);
      const months = Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      setSize(getSizeForAge(months));
      setName(saved.name || null);
    } catch {}
  }, []);

  return { size, name };
}

// Banner shown at top of shop/homepage
export function AgeNavigatorBanner() {
  const { size, name } = useChildSize();
  const [dismissed, setDismissed] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  if (dismissed || !size) return (
    <>
      {!dismissed && (
        <button
          onClick={() => setShowSetup(true)}
          className="w-full bg-[#f6f5f3] border-b border-black/5 py-2 px-4 text-[10px] font-bold tracking-widest uppercase text-black/50 hover:text-black transition-colors flex items-center justify-center gap-2"
        >
          <Baby size={12} /> Set your child's age for personalised sizes
        </button>
      )}
      {showSetup && <AgeSetupModal onClose={() => setShowSetup(false)} onSave={() => { setShowSetup(false); window.location.reload(); }} />}
    </>
  );

  const nextSize = getNextSize(size);

  return (
    <div className="w-full bg-black text-white py-2 px-3 sm:px-4 flex items-center justify-center gap-2 sm:gap-3 text-[9px] sm:text-[11px]">
      <Baby size={13} className="text-white/60 flex-shrink-0 hidden sm:block" />
      <span className="text-center leading-relaxed">
        {name ? `Personalised for ${name}` : "Personalised for your child"} —{" "}
        <span className="font-bold">{size}</span> fits now
        {nextSize && <span className="text-white/50"> · {nextSize} coming up</span>}
      </span>
      <button onClick={() => setShowSetup(true)} className="text-white/50 hover:text-white underline text-[9px] sm:text-[10px] ml-1 flex-shrink-0">Edit</button>
      <button onClick={() => setDismissed(true)} className="text-white/30 hover:text-white ml-0.5 sm:ml-1 flex-shrink-0"><X size={14} /></button>
      {showSetup && <AgeSetupModal onClose={() => setShowSetup(false)} onSave={() => { setShowSetup(false); window.location.reload(); }} />}
    </div>
  );
}

// Modal to set child's name + DOB
function AgeSetupModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) { setName(saved.name || ""); setDob(saved.dob || ""); }
    } catch {}
  }, []);

  const handleSave = () => {
    if (!dob) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: name.trim(), dob }));
    onSave();
  };

  // Preview
  let preview = null;
  if (dob) {
    try {
      const months = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
      if (months >= 0) {
        const size = getSizeForAge(months);
        const next = getNextSize(size);
        preview = { months, size, next };
      }
    } catch {}
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-[16px] font-medium text-black">Smart Age Navigator</h3>
              <p className="text-[12px] text-black/50 mt-1">We'll show only sizes that fit your child right now.</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1.5">Child's Name (optional)</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Aryan"
                className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1.5">Date of Birth *</label>
              <input
                type="date" value={dob} onChange={e => setDob(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full border border-black/20 rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-black"
              />
            </div>

            {preview && (
              <div className="bg-black/5 rounded-xl p-4 text-center">
                <p className="text-[11px] text-black/50 mb-1">{getAgeLabel(preview.months)} old</p>
                <p className="text-[18px] font-bold text-black">{preview.size}</p>
                <p className="text-[11px] text-black/40 mt-0.5">fits now</p>
                {preview.next && <p className="text-[11px] text-black/40 mt-1">{preview.next} coming up</p>}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 border border-black/20 rounded-full py-3 text-[11px] font-bold tracking-widest uppercase hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={!dob} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 disabled:opacity-40">Save</button>
          </div>

          <button
            onClick={() => { localStorage.removeItem(STORAGE_KEY); onClose(); }}
            className="w-full mt-3 text-[10px] text-black/30 hover:text-black/60 transition-colors"
          >
            Clear saved child profile
          </button>
        </div>
      </div>
    </>
  );
}
