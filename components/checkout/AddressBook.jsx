"use client";
import { useState, useEffect, useRef } from "react";
import { MapPin, Plus, Trash2, Edit2, Loader2, Navigation, Search, X } from "lucide-react";
import { State, City } from "country-state-city";
import { safeFetch } from "@/lib/safeFetch";
import { csrfHeaders } from "@/lib/csrf";

const EMPTY = { firstName: "", middleName: "", lastName: "", phone: "", houseNo: "", roadName: "", city: "", state: "", pincode: "", landmark: "", landmarkType: "", instructions: "", lat: null, lng: null };

// Common Indian landmark types — riders parse these faster than free text.
const LANDMARK_TYPES = ["Temple", "Gurudwara", "Mosque", "Church", "School", "College", "Hospital", "Clinic", "Mall", "Market", "Metro Station", "Bus Stop", "Railway Station", "Petrol Pump", "Park", "Bank", "ATM", "Police Station", "Post Office", "Other"];

// Static list of Indian states/UTs (loaded once)
const IN_STATES = State.getStatesOfCountry("IN").sort((a, b) => a.name.localeCompare(b.name));
const stateNameToIso = Object.fromEntries(IN_STATES.map(s => [s.name, s.isoCode]));

// Helpers — keep backend compatible: combine on save, split on load.
const combineName = (f, m, l) => [f, m, l].filter(Boolean).map(s => s.trim()).join(" ");
const splitFullName = (full) => {
  const parts = String(full || "").trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || "", middleName: "", lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], middleName: "", lastName: parts[1] };
  return { firstName: parts[0], middleName: parts.slice(1, -1).join(" "), lastName: parts[parts.length - 1] };
};

// ── Location Search Bar ──────────────────────────────────────────────────────
function LocationSearch({ onFill }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState("");
    const timerRef = useRef(null);

    // Debounced search via Nominatim
    useEffect(() => {
        if (query.length < 4) { setResults([]); return; }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=5`,
                    { headers: { "Accept-Language": "en" } }
                );
                const data = await res.json();
                setResults(data);
            } catch { setResults([]); }
            setSearching(false);
        }, 500);
        return () => clearTimeout(timerRef.current);
    }, [query]);

    // Parse Nominatim address into our form fields (optionally enriched with GPS coords)
    const parseNominatim = (item, coords = null) => {
        const a = item.address || {};
        return {
            roadName: [a.road, a.suburb, a.neighbourhood, a.quarter].filter(Boolean).join(", ") || "",
            city: a.city || a.town || a.village || a.county || "",
            state: a.state || "",
            pincode: a.postcode || "",
            landmark: a.amenity || a.tourism || a.historic || "",
            ...(coords ? { lat: coords.latitude, lng: coords.longitude } : {}),
        };
    };

    // GPS auto-detect — captures lat/lng so Delhivery's rider app can navigate to the door.
    const detectLocation = () => {
        if (!navigator.geolocation) { setError("Geolocation not supported by your browser."); return; }
        setDetecting(true); setError("");
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&addressdetails=1`,
                        { headers: { "Accept-Language": "en" } }
                    );
                    const data = await res.json();
                    onFill(parseNominatim(data, coords));
                    setQuery(data.display_name?.split(",").slice(0, 3).join(",") || "");
                    setResults([]);
                } catch { setError("Could not fetch address. Try searching manually."); }
                setDetecting(false);
            },
            (err) => {
                setDetecting(false);
                if (err.code === 1) setError("Location permission denied. Please allow access or search manually.");
                else setError("Could not detect location. Try searching manually.");
            },
            { timeout: 10000 }
        );
    };

    return (
        <div className="mb-5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-black/60 mb-2">Find Your Location</p>
            <div className="flex gap-2">
                {/* Search input */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-3.5 text-black/30" />
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search area, street, city..."
                        className="w-full border border-black/20 rounded-lg pl-9 pr-8 py-3 text-[13px] outline-none focus:border-black"
                    />
                    {query && <button onClick={() => { setQuery(""); setResults([]); }} className="absolute right-3 top-3.5"><X size={14} className="text-black/30" /></button>}
                    {searching && <Loader2 size={14} className="absolute right-3 top-3.5 animate-spin text-black/40" />}
                    {/* Dropdown */}
                    {results.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-black/10 rounded-xl shadow-xl z-50 mt-1 overflow-hidden">
                            {results.map((r, i) => (
                                <button key={i} onClick={() => { onFill(parseNominatim(r)); setQuery(r.display_name.split(",").slice(0, 3).join(",")); setResults([]); }}
                                    className="w-full text-left px-4 py-3 text-[12px] text-black/80 hover:bg-gray-50 border-b border-black/5 last:border-0 flex items-start gap-2">
                                    <MapPin size={13} className="text-black/30 mt-0.5 flex-shrink-0" />
                                    <span className="truncate">{r.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* GPS button */}
                <button onClick={detectLocation} disabled={detecting}
                    className="flex items-center gap-2 px-4 py-3 border border-black/20 rounded-lg text-[12px] font-bold tracking-widest uppercase hover:bg-black hover:text-white hover:border-black transition-all disabled:opacity-50 whitespace-nowrap">
                    {detecting ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                    {detecting ? "Detecting..." : "Use GPS"}
                </button>
            </div>
            {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
            <p className="text-[10px] text-black/40 mt-1.5">GPS fills area/city/state automatically. Add house number manually.</p>
        </div>
    );
}

// ── Address Form ─────────────────────────────────────────────────────────────
function AddressForm({ initial = EMPTY, onSave, onCancel, saving }) {
    const [form, setForm] = useState(initial);
    const [isDefault, setIsDefault] = useState(initial.is_default || false);
    const [fetchingPin, setFetchingPin] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    // Auto-fill state + district from pincode (India Post)
    useEffect(() => {
        if (form.pincode?.length === 6) {
            setFetchingPin(true);
            fetch(`https://api.postalpincode.in/pincode/${form.pincode}`)
                .then(r => r.json())
                .then(d => {
                    if (d[0]?.Status !== "Success") return;
                    const p = d[0]?.PostOffice?.[0];
                    if (!p) return;
                    // Match API state name to dropdown's canonical name (case-insensitive)
                    const matchedState = IN_STATES.find(s => s.name.toLowerCase() === String(p.State || "").toLowerCase());
                    setForm(f => ({
                        ...f,
                        state: matchedState ? matchedState.name : (p.State || ""),
                        city: p.District || "",
                    }));
                })
                .catch(() => {})
                .finally(() => setFetchingPin(false));
        }
    }, [form.pincode]);

    // Districts for the currently-selected state (memoized by state name)
    const districts = (() => {
        const iso = stateNameToIso[form.state];
        if (!iso) return [];
        return City.getCitiesOfState("IN", iso).map(c => c.name).sort((a, b) => a.localeCompare(b));
    })();

    const inp = "border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black w-full";

    return (
        <div className="space-y-4">
            {/* Location search / GPS */}
            <LocationSearch onFill={(filled) => setForm(f => ({ ...f, ...filled }))} />

            {/* Name row — first / middle (optional) / last */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">First Name *</label><input className={inp} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Jane" /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Middle Name</label><input className={inp} value={form.middleName} onChange={e => set("middleName", e.target.value)} placeholder="Optional" /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Last Name *</label><input className={inp} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Doe" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Phone *</label><input className={inp} value={form.phone} onChange={e => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" /></div>
                <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Pincode *</label>
                    <div className="relative">
                        <input className={inp} value={form.pincode} onChange={e => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit pincode" />
                        {fetchingPin && <Loader2 size={14} className="absolute right-3 top-3.5 animate-spin text-black/40" />}
                    </div>
                </div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">House No., Building *</label><input className={inp} value={form.houseNo} onChange={e => set("houseNo", e.target.value)} placeholder="Flat/House No." /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Road Name, Area *</label><input className={inp} value={form.roadName} onChange={e => set("roadName", e.target.value)} placeholder="Auto-filled or type manually" /></div>
                <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">State *</label>
                    <select className={inp} value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value, city: "" }))}>
                        <option value="">Select state</option>
                        {IN_STATES.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">District / City *</label>
                    <select className={inp} value={form.city} onChange={e => set("city", e.target.value)} disabled={!form.state}>
                        <option value="">{form.state ? "Select district" : "Select state first"}</option>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        {/* Allow pincode-derived district even if it's not in the curated city list */}
                        {form.city && !districts.includes(form.city) && <option value={form.city}>{form.city}</option>}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Landmark Type (Optional)</label>
                    <select className={inp} value={form.landmarkType} onChange={e => set("landmarkType", e.target.value)}>
                        <option value="">Select type</option>
                        {LANDMARK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Landmark Name (Optional)</label>
                    <input className={inp} value={form.landmark} onChange={e => set("landmark", e.target.value)} placeholder="e.g. Apollo, DPS School" />
                </div>
                <div className="md:col-span-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Delivery Instructions (Optional)</label>
                    <textarea
                        className={inp + " resize-none"}
                        rows={2}
                        maxLength={300}
                        value={form.instructions}
                        onChange={e => set("instructions", e.target.value)}
                        placeholder="e.g. Ring bell twice. Green gate, 2nd floor. Look for the building with the red board."
                    />
                    <p className="text-[10px] text-black/40 mt-1">Helps the delivery rider find you faster. {form.instructions.length}/300</p>
                </div>
                {(form.lat && form.lng) && (
                    <div className="md:col-span-2 flex items-center gap-2 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <Navigation size={12} />
                        <span>GPS location saved — delivery rider's app will navigate straight to your door.</span>
                    </div>
                )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="accent-black" />
                <span className="text-[12px] text-black/70">Set as default address</span>
            </label>
            <div className="flex gap-3 pt-2">
                <button onClick={() => onSave({ ...form, fullName: combineName(form.firstName, form.middleName, form.lastName), is_default: isDefault })} disabled={saving}
                    className="bg-black text-white px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Address"}
                </button>
                <button onClick={onCancel} className="border border-black/20 px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-gray-50">Cancel</button>
            </div>
        </div>
    );
}

// ── AddressBook ──────────────────────────────────────────────────────────────
export default function AddressBook({ selectable = false, onSelect = null }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const token = () => localStorage.getItem("token");

    const toCheckoutFormat = (a) => ({
        fullName: a.full_name, phone: a.phone, houseNo: a.house_no,
        roadName: a.road_name, city: a.city, state: a.state,
        pincode: a.pincode, landmark: a.landmark || "",
        landmarkType: a.landmark_type || "",
        instructions: a.instructions || "",
        lat: a.lat != null ? Number(a.lat) : null,
        lng: a.lng != null ? Number(a.lng) : null,
        altPhone: ""
    });

    useEffect(() => {
        safeFetch("/api/user/address", { headers: { Authorization: `Bearer ${token()}` } })
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setAddresses(list);
                const def = list.find(a => a.is_default) || list[0];
                if (def) { setSelectedId(def.id); if (onSelect) onSelect(toCheckoutFormat(def)); }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (form) => {
        setSaving(true);
        try {
            const headers = await csrfHeaders({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });
            const res = editingId
                ? await safeFetch(`/api/user/address/${editingId}`, { method: "PUT", headers, credentials: "include", body: JSON.stringify(form) })
                : await safeFetch("/api/user/address", { method: "POST", headers, credentials: "include", body: JSON.stringify(form) });
            const data = await res.json();
            if (editingId) {
                setAddresses(prev => prev.map(a => a.id === editingId ? data : (form.is_default ? { ...a, is_default: false } : a)));
            } else {
                setAddresses(prev => [...(form.is_default ? prev.map(a => ({ ...a, is_default: false })) : prev), data]);
            }
            setShowForm(false); setEditingId(null);
        } catch {}
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this address?")) return;
        const headers = await csrfHeaders({ Authorization: `Bearer ${token()}` });
        await safeFetch(`/api/user/address/${id}`, { method: "DELETE", headers, credentials: "include" });
        setAddresses(prev => prev.filter(a => a.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const handleSetDefault = async (id) => {
        const headers = await csrfHeaders({ Authorization: `Bearer ${token()}` });
        await safeFetch(`/api/user/address/${id}/default`, { method: "PATCH", headers, credentials: "include" });
        setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
    };

    const handleSelect = (a) => {
        setSelectedId(a.id);
        if (onSelect) onSelect(toCheckoutFormat(a));
    };

    if (loading) return <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-black/30" /></div>;

    return (
        <div className="space-y-4">
            {addresses.map(a => (
                <div key={a.id} onClick={() => selectable && handleSelect(a)}
                    className={`bg-white border rounded-xl p-5 transition-all ${selectable ? "cursor-pointer" : ""} ${selectable && selectedId === a.id ? "border-black shadow-md" : "border-black/10"}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            {selectable && (
                                <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${selectedId === a.id ? "border-black bg-black" : "border-black/30"}`}>
                                    {selectedId === a.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="text-[14px] font-bold text-black">{a.full_name}</p>
                                    {a.is_default && <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-black text-white rounded">Default</span>}
                                </div>
                                <p className="text-[13px] text-black/70">{a.house_no}, {a.road_name}</p>
                                {(a.landmark || a.landmark_type) && <p className="text-[13px] text-black/70">Near {[a.landmark_type, a.landmark].filter(Boolean).join(" ")}</p>}
                                <p className="text-[13px] text-black/70">{a.city}, {a.state} — {a.pincode}</p>
                                <p className="text-[12px] text-black/50 mt-1">📞 {a.phone}</p>
                                {a.instructions && <p className="text-[11px] text-black/50 italic mt-1">"{a.instructions}"</p>}
                                {(a.lat && a.lng) && <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5"><Navigation size={9} /> GPS pinned</span>}
                            </div>
                        </div>
                        {!selectable && (
                            <div className="flex gap-2 flex-shrink-0">
                                {!a.is_default && (
                                    <button onClick={() => handleSetDefault(a.id)} className="text-[10px] font-bold tracking-widest uppercase text-black/50 hover:text-black border-b border-black/20 pb-0.5">Set Default</button>
                                )}
                                <button onClick={() => { setEditingId(a.id); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 size={15} className="text-black/50" /></button>
                                <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 size={15} className="text-red-400" /></button>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {!showForm ? (
                <button onClick={() => { setShowForm(true); setEditingId(null); }}
                    className="w-full border-2 border-dashed border-black/20 rounded-xl p-4 flex items-center justify-center gap-2 text-[12px] font-bold tracking-widest uppercase text-black/50 hover:border-black hover:text-black transition-all">
                    <Plus size={16} /> Add New Address
                </button>
            ) : (
                <div className="bg-white border border-black/10 rounded-xl p-6">
                    <h3 className="text-[12px] font-bold tracking-widest uppercase text-black mb-5">
                        {editingId ? "Edit Address" : "Add New Address"}
                    </h3>
                    <AddressForm
                        initial={editingId ? (() => { const a = addresses.find(x => x.id === editingId); if (!a) return EMPTY; const n = splitFullName(a.full_name); return { firstName: n.firstName, middleName: n.middleName, lastName: n.lastName, phone: a.phone, houseNo: a.house_no, roadName: a.road_name, city: a.city, state: a.state, pincode: a.pincode, landmark: a.landmark || "", landmarkType: a.landmark_type || "", instructions: a.instructions || "", lat: a.lat != null ? Number(a.lat) : null, lng: a.lng != null ? Number(a.lng) : null, is_default: a.is_default }; })() : EMPTY}
                        onSave={handleSave}
                        onCancel={() => { setShowForm(false); setEditingId(null); }}
                        saving={saving}
                    />
                </div>
            )}
        </div>
    );
}
