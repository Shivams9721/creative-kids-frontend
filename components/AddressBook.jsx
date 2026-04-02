"use client";
import { useState, useEffect } from "react";
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, Loader2 } from "lucide-react";
import { safeFetch } from "@/lib/safeFetch";
import { csrfHeaders } from "@/lib/csrf";

const EMPTY = { fullName: "", phone: "", houseNo: "", roadName: "", city: "", state: "", pincode: "", landmark: "" };

function AddressForm({ initial = EMPTY, onSave, onCancel, saving }) {
    const [form, setForm] = useState(initial);
    const [isDefault, setIsDefault] = useState(initial.is_default || false);
    const [fetchingPin, setFetchingPin] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    useEffect(() => {
        if (form.pincode?.length === 6) {
            setFetchingPin(true);
            fetch(`https://api.postalpincode.in/pincode/${form.pincode}`)
                .then(r => r.json())
                .then(d => {
                    if (d[0]?.Status === "Success") {
                        const p = d[0].PostOffice[0];
                        setForm(f => ({ ...f, city: p.District, state: p.State }));
                    }
                })
                .catch(() => {})
                .finally(() => setFetchingPin(false));
        }
    }, [form.pincode]);

    const inp = "border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black w-full";

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Full Name *</label><input className={inp} value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="Jane Doe" /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Phone *</label><input className={inp} value={form.phone} onChange={e => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit number" /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">House No., Building *</label><input className={inp} value={form.houseNo} onChange={e => set("houseNo", e.target.value)} placeholder="Flat/House No." /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Road Name, Area *</label><input className={inp} value={form.roadName} onChange={e => set("roadName", e.target.value)} placeholder="Street, Sector, Area" /></div>
                <div>
                    <label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Pincode *</label>
                    <div className="relative">
                        <input className={inp} value={form.pincode} onChange={e => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit pincode" />
                        {fetchingPin && <Loader2 size={14} className="absolute right-3 top-3.5 animate-spin text-black/40" />}
                    </div>
                </div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">City *</label><input className={inp} value={form.city} onChange={e => set("city", e.target.value)} placeholder="City" /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">State *</label><input className={inp} value={form.state} onChange={e => set("state", e.target.value)} placeholder="State" /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-black/60 block mb-1">Landmark (Optional)</label><input className={inp} value={form.landmark} onChange={e => set("landmark", e.target.value)} placeholder="Near Apollo Hospital" /></div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="accent-black" />
                <span className="text-[12px] text-black/70">Set as default address</span>
            </label>
            <div className="flex gap-3 pt-2">
                <button onClick={() => onSave({ ...form, is_default: isDefault })} disabled={saving} className="bg-black text-white px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 disabled:opacity-50">
                    {saving ? "Saving..." : "Save Address"}
                </button>
                <button onClick={onCancel} className="border border-black/20 px-6 py-2.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-gray-50">Cancel</button>
            </div>
        </div>
    );
}

export default function AddressBook({ selectable = false, onSelect = null }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const token = () => localStorage.getItem("token");

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

    const toCheckoutFormat = (a) => ({
        fullName: a.full_name, phone: a.phone, houseNo: a.house_no,
        roadName: a.road_name, city: a.city, state: a.state,
        pincode: a.pincode, landmark: a.landmark || "", altPhone: ""
    });

    const handleSave = async (form) => {
        setSaving(true);
        try {
            const headers = await csrfHeaders({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });
            let res;
            if (editingId) {
                res = await safeFetch(`/api/user/address/${editingId}`, { method: "PUT", headers, credentials: "include", body: JSON.stringify(form) });
            } else {
                res = await safeFetch("/api/user/address", { method: "POST", headers, credentials: "include", body: JSON.stringify(form) });
            }
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
            {/* Address Cards */}
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
                                {a.landmark && <p className="text-[13px] text-black/70">Near {a.landmark}</p>}
                                <p className="text-[13px] text-black/70">{a.city}, {a.state} — {a.pincode}</p>
                                <p className="text-[12px] text-black/50 mt-1">📞 {a.phone}</p>
                            </div>
                        </div>
                        {!selectable && (
                            <div className="flex gap-2 flex-shrink-0">
                                {!a.is_default && (
                                    <button onClick={() => handleSetDefault(a.id)} className="text-[10px] font-bold tracking-widest uppercase text-black/50 hover:text-black border-b border-black/20 pb-0.5">Set Default</button>
                                )}
                                <button onClick={() => { setEditingId(a.id); setShowForm(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"><Edit2 size={15} className="text-black/50" /></button>
                                <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} className="text-red-400" /></button>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Add New */}
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
                        initial={editingId ? (() => { const a = addresses.find(x => x.id === editingId); return a ? { fullName: a.full_name, phone: a.phone, houseNo: a.house_no, roadName: a.road_name, city: a.city, state: a.state, pincode: a.pincode, landmark: a.landmark, is_default: a.is_default } : EMPTY; })() : EMPTY}
                        onSave={handleSave}
                        onCancel={() => { setShowForm(false); setEditingId(null); }}
                        saving={saving}
                    />
                </div>
            )}
        </div>
    );
}
