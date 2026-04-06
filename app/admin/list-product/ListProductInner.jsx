"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeFetch } from "../api";
import { PRODUCT_ATTRIBUTES } from "@/lib/constants";

const BABY_SIZES = ["0M–3M","3M–6M","6M–9M","9M–12M","12M–18M","18M–24M"];
const KIDS_SIZES = ["2Y–3Y","3Y–4Y","4Y–5Y","5Y–6Y","6Y–7Y","7Y–8Y","8Y–9Y","9Y–10Y","10Y–11Y","11Y–12Y","12Y–13Y","13Y–14Y","14Y–15Y","15Y–16Y","16Y–17Y","17Y–18Y"];
const COLORS = PRODUCT_ATTRIBUTES.COLORS;
const FABRICS = PRODUCT_ATTRIBUTES.FABRICS;
const PATTERNS = PRODUCT_ATTRIBUTES.PATTERNS;
const NECK_TYPES = PRODUCT_ATTRIBUTES.NECK_TYPES;
const CARE_INSTRUCTIONS = PRODUCT_ATTRIBUTES.CARE_INSTRUCTIONS;
const MAIN_CATS = ["Baby boys","Baby girls","Boys clothing","Girls clothing"];
const ITEM_TYPES = {
  "Baby boys": ["Onesies & Rompers","T-Shirts & Sweatshirts","Shirts","Bottomwear","Clothing Sets"],
  "Baby girls": ["Onesies & Rompers","Tops & Tees","Dresses","Bottomwear","Clothing Sets"],
  "Boys clothing": ["T-Shirts","Shirts","Jeans","Trousers & Joggers","Shorts","Co-ord Sets","Sweatshirts"],
  "Girls clothing": ["Tops & Tees","Dresses","Co-ords & Jumpsuits","Jeans Joggers & Trousers","Shorts, Skirts & Skorts"],
};
const STEPS = ["Basic info","Category","Sizes","Colors","Attributes","Publish"];

export default function ListProductInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({
    title: "", price: "", mrp: "", sku: "", hsn_code: "",
    main_category: "Baby girls", sub_category: "", item_type: "",
    description: "", fabric: "", pattern: "", neck_type: "", care_instructions: [],
    sizes: [], colors: [], color_images: {},
    is_featured: false, is_new_arrival: false, is_draft: false, is_cod_eligible: true,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!editId) return;
    safeFetch(`/api/products/${editId}`)
      .then(p => {
        const parse = (v, fallback) => { try { return typeof v === "string" ? JSON.parse(v) : (v || fallback); } catch { return fallback; } };
        setForm(f => ({ ...f, ...p, sizes: parse(p.sizes, []), colors: parse(p.colors, []), color_images: parse(p.color_images, {}), care_instructions: parse(p.care_instructions, []) }));
      }).catch(() => {});
  }, [editId]);

  const toggleSize = (s) => set("sizes", form.sizes.includes(s) ? form.sizes.filter(x => x !== s) : [...form.sizes, s]);
  const toggleColor = (c) => set("colors", form.colors.includes(c) ? form.colors.filter(x => x !== c) : [...form.colors, c]);

  const uploadImage = async (files, color) => {
    if (!files || files.length === 0) return;
    setUploadingImg(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        const token = localStorage.getItem("adminToken");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://vbaumdstnz.ap-south-1.awsapprunner.com"}/api/upload`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        const data = await res.json();
        if (data.imageUrl) uploadedUrls.push(data.imageUrl);
      }
      if (uploadedUrls.length > 0) {
        set("color_images", { ...form.color_images, [color]: [...(form.color_images[color] || []), ...uploadedUrls] });
      }
    } catch { alert("Image upload failed"); }
    finally { setUploadingImg(false); }
  };

  const removeImage = (color, url) => set("color_images", { ...form.color_images, [color]: (form.color_images[color] || []).filter(u => u !== url) });

  const buildVariants = () => {
    const variants = [];
    form.colors.forEach(color => {
      form.sizes.forEach(size => {
        variants.push({ color, size, stock: 10, sku: `${form.sku}-${color.slice(0,3).toUpperCase()}-${size.replace(/[^a-zA-Z0-9]/g,"")}` });
      });
    });
    return variants;
  };

  const handleSubmit = async (isDraft = false) => {
    setSaving(true);
    try {
      const payload = { ...form, is_draft: isDraft, variants: buildVariants(), image_urls: Object.values(form.color_images).flat(), primary_category: form.main_category, cross_listed_categories: [] };
      if (editId) await safeFetch(`/api/products/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
      else await safeFetch("/api/products", { method: "POST", body: JSON.stringify(payload) });
      router.push("/admin/products");
    } catch (e) { alert(e.message || "Failed to save product"); }
    finally { setSaving(false); }
  };

  const canNext = () => {
    if (step === 0) return form.title && form.price && form.mrp;
    if (step === 1) return form.main_category && form.item_type;
    if (step === 2) return form.sizes.length > 0;
    if (step === 3) return form.colors.length > 0;
    if (step === 4) return form.fabric && form.pattern && form.neck_type;
    return true;
  };

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="step-nav">
        {STEPS.map((s, i) => (
          <div key={s} className={`step-pill${i < step ? " done" : i === step ? " current" : ""}`} onClick={() => i < step && setStep(i)}>
            {i < step ? `✓ ${s}` : `${i + 1} · ${s}`}
          </div>
        ))}
      </div>

      <div className="g2">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {step === 0 && (
            <div className="card card-pad">
              <div className="card-title">Basic info</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div><div className="field-label">Product title *</div><input className="field-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Floral Romper Set" /></div>
                <div className="g2" style={{ gap: 12 }}>
                  <div><div className="field-label">Selling price (₹) *</div><input className="field-input" type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="699" /></div>
                  <div><div className="field-label">MRP (₹) *</div><input className="field-input" type="number" value={form.mrp} onChange={e => set("mrp", e.target.value)} placeholder="999" /></div>
                </div>
                {form.price && form.mrp && parseFloat(form.mrp) > parseFloat(form.price) && (
                  <div style={{ fontSize: 11, color: "var(--green)" }}>✓ {Math.round(((form.mrp - form.price) / form.mrp) * 100)}% discount</div>
                )}
                <div className="g2" style={{ gap: 12 }}>
                  <div><div className="field-label">Base SKU</div><input className="field-input" value={form.sku} onChange={e => set("sku", e.target.value.toUpperCase())} placeholder="CK-ROM-FLR" /></div>
                  <div><div className="field-label">HSN code</div><input className="field-input" value={form.hsn_code} onChange={e => set("hsn_code", e.target.value)} placeholder="6111" /></div>
                </div>
                <div><div className="field-label">Description</div><textarea className="field-input" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Product description…" /></div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="card card-pad">
              <div className="card-title">Category</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div className="field-label">Main category *</div>
                  <select className="field-input" value={form.main_category} onChange={e => { set("main_category", e.target.value); set("item_type", ""); }}>
                    {MAIN_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div className="field-label">Item type *</div>
                  <select className="field-input" value={form.item_type} onChange={e => { set("item_type", e.target.value); set("sub_category", e.target.value); }}>
                    <option value="">Select item type</option>
                    {(ITEM_TYPES[form.main_category] || []).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  {[["is_new_arrival","New arrival"],["is_featured","Featured"],["is_cod_eligible","COD eligible"]].map(([k, label]) => (
                    <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                      <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} />{label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card card-pad">
              <div className="card-title">Size selection</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--purple)", marginBottom: 8 }}>Infant & baby <span className="tag tag-purple" style={{ marginLeft: 6, fontSize: 10 }}>0M – 24M</span></div>
                <div className="chip-grid">{BABY_SIZES.map(s => <div key={s} className={`chip baby${form.sizes.includes(s) ? " on" : ""}`} onClick={() => toggleSize(s)}>{s}</div>)}</div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)", marginBottom: 8 }}>Toddler & kids <span className="tag tag-blue" style={{ marginLeft: 6, fontSize: 10 }}>2Y – 14Y</span></div>
                <div className="chip-grid">{KIDS_SIZES.map(s => <div key={s} className={`chip kids${form.sizes.includes(s) ? " on" : ""}`} onClick={() => toggleSize(s)}>{s}</div>)}</div>
              </div>
              {form.sizes.length > 0 && <div style={{ marginTop: 12, fontSize: 11, color: "var(--accent)" }}>✓ {form.sizes.length} sizes: {form.sizes.join(", ")}</div>}
            </div>
          )}

          {step === 3 && (
            <div className="card card-pad">
              <div className="card-title">Colours & images</div>
              <div className="swatch-grid" style={{ marginBottom: 20 }}>
                {COLORS.map(c => (
                  <div key={c.name} className={`swatch-item${form.colors.includes(c.name) ? " on" : ""}`} onClick={() => toggleColor(c.name)}>
                    <div className="swatch-circle" style={{ background: c.hex, border: c.name === "White" ? "1px solid #555" : undefined }}><div className="swatch-check" style={c.name === "White" ? { background: "rgba(0,0,0,0.3)" } : {}} /></div>
                    <div className="swatch-name">{c.name}</div>
                  </div>
                ))}
              </div>
              {form.colors.map(color => (
                <div key={color} style={{ marginBottom: 16, padding: 12, background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{color} — images (upload multiple at once)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {(form.color_images[color] || []).map((url, i) => (
                      <div key={i} style={{ position: "relative", width: 60, height: 72 }}>
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                        <button onClick={() => removeImage(color, url)} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: "var(--red)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer" }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => { fileRef.current._color = color; fileRef.current.click(); }}
                      style={{ width: 60, height: 72, border: "1px dashed var(--border2)", borderRadius: 6, background: "var(--bg4)", color: "var(--text3)", fontSize: 20, cursor: "pointer" }}>
                      {uploadingImg ? "…" : "+"}
                    </button>
                  </div>
                </div>
              ))}
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={e => { if (e.target.files && e.target.files.length > 0) uploadImage(Array.from(e.target.files), fileRef.current._color); e.target.value = ""; }} />
            </div>
          )}

          {step === 4 && (
            <div className="card card-pad">
              <div className="card-title">Fabric & attributes</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <div className="field-label">Fabric *</div>
                  <select className="field-input" value={form.fabric || ""} onChange={e => set("fabric", e.target.value)} required>
                    <option value="">Select fabric</option>
                    {FABRICS.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <div className="field-label">Pattern *</div>
                  <select className="field-input" value={form.pattern || ""} onChange={e => set("pattern", e.target.value)} required>
                    <option value="">Select pattern</option>
                    {PATTERNS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <div className="field-label">Neck type *</div>
                  <select className="field-input" value={form.neck_type || ""} onChange={e => set("neck_type", e.target.value)} required>
                    <option value="">Select neck type</option>
                    {NECK_TYPES.map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <div className="field-label">Care instructions</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {CARE_INSTRUCTIONS.map(care => (
                      <label key={care} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                        <input type="checkbox" checked={(form.care_instructions || []).includes(care)} onChange={e => {
                          const current = form.care_instructions || [];
                          set("care_instructions", e.target.checked ? [...current, care] : current.filter(c => c !== care));
                        }} />
                        {care}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="card card-pad">
              <div className="card-title">Ready to publish</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20 }}>Review your product before publishing. You can save as draft and publish later.</div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-sm" style={{ flex: 1 }} disabled={saving} onClick={() => handleSubmit(true)}>{saving ? "Saving…" : "Save as draft"}</button>
                <button className="btn btn-accent btn-sm" style={{ flex: 1 }} disabled={saving} onClick={() => handleSubmit(false)}>{saving ? "Publishing…" : editId ? "Update product" : "Publish product"}</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {step > 0 && <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>← Back</button>}
            {step < 5 && <button className="btn btn-accent btn-sm" style={{ flex: 1 }} disabled={!canNext()} onClick={() => setStep(s => s + 1)}>Next: {STEPS[step + 1]} →</button>}
          </div>
        </div>

        {/* SUMMARY */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card card-pad">
            <div className="card-title">Summary</div>
            {[["Title",form.title||"—"],["MRP",form.mrp?`₹${form.mrp}`:"—"],["Price",form.price?`₹${form.price}`:"—"],["SKU",form.sku||"—"],["Category",form.main_category||"—"],["Item type",form.item_type||"—"],["Sizes",form.sizes.length?`${form.sizes.length} selected`:"None"],["Colors",form.colors.length?form.colors.join(", "):"None"]].map(([k,v]) => (
              <div key={k} className="stat-row"><div className="stat-key">{k}</div><div className="stat-val">{v}</div></div>
            ))}
          </div>
          <div className="card card-pad">
            <div className="card-title">Progress</div>
            {STEPS.map((s, i) => (
              <div key={s} className="flex-center gap8" style={{ marginBottom: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: i < step ? "var(--green)" : i === step ? "var(--accent)" : "var(--border2)", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: i <= step ? "var(--text)" : "var(--text3)" }}>{s}</span>
                {i < step && <span className="tag tag-green" style={{ marginLeft: "auto", fontSize: 10 }}>Done</span>}
                {i === step && <span className="tag tag-accent" style={{ marginLeft: "auto", fontSize: 10 }}>In progress</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
