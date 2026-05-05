"use client";
// U2 + U3: pincode serviceability check + delivery date estimate.
import { useState } from "react";
import { safeFetch } from "@/lib/safeFetch";

function formatEtaDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  } catch { return ""; }
}

export default function PincodeServiceability() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setError("");
    setResult(null);
    if (!/^\d{6}$/.test(pin)) { setError("Enter a valid 6-digit pincode"); return; }
    setLoading(true);
    try {
      const r = await safeFetch(`/api/serviceability/${pin}`);
      const data = await r.json();
      if (!r.ok || !data.serviceable) {
        setError(data.reason || data.error || "Sorry, we don't deliver to this pincode yet");
      } else {
        setResult(data);
      }
    } catch {
      setError("Could not check serviceability");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-black/10 rounded-lg p-3 sm:p-4 bg-[#fafafa]">
      <p className="text-[10px] font-bold tracking-widest uppercase text-black/60 mb-2">Check Delivery</p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter pincode"
          className="flex-1 border border-black/20 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-black"
        />
        <button
          onClick={check}
          disabled={loading || pin.length !== 6}
          className="bg-black text-white px-4 py-2 rounded-md text-[11px] font-bold tracking-widest uppercase disabled:opacity-40"
        >
          {loading ? "..." : "Check"}
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-red-600">{error}</p>}
      {result && (
        <div className="mt-2 text-[12px] text-black/70 leading-relaxed">
          <p>✓ Delivery available to <span className="font-bold">{result.pincode}</span></p>
          <p>Get it by <span className="font-bold">{formatEtaDate(result.eta_date)}</span> ({result.eta_min_days}–{result.eta_max_days} days)</p>
          {result.cod_available && <p className="text-black/50">COD available</p>}
        </div>
      )}
    </div>
  );
}
