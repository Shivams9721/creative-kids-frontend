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

const STEPS = ["Category & Setup", "Attributes", "Color Variants", "Publish"];

export default function ListProductInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingImgHash, setUploadingImgHash] = useState(null);
  const [skuErrors, setSkuErrors] = useState({});
  const fileRef = useRef();

  const [form, setForm] = useState({
    main_category: "Baby girls", sub_category: "", item_type: "", hsn_code: "",
    is_featured: false, is_new_arrival: false, show_on_homepage: false, homepage_section: "none", homepage_card_slot: null,
    is_draft: false,
    fabric: "", pattern: "", neck_type: "", care_instructions: [],
    color_blocks: [
      {
        id: Date.now(),
        color: "",
        title: "",
        description: "",
        price: "",
        mrp: "",
        base_sku: "",
        sizes: [],
        images: [],
      }
    ]
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!editId) return;
    safeFetch(`/api/products/${editId}`)
      .then(p => {
        const parse = (v, fallback) => { try { return typeof v === "string" ? JSON.parse(v) : (v || fallback); } catch { return fallback; } };
        
        let blocks = parse(p.color_blocks, null);
        if (!blocks) {
             const oldColors = parse(p.colors, []);
             const oldSizes = parse(p.sizes, []);
             const oldImagesMap = parse(p.color_images, {});
             const oldColorSkus = parse(p.sku_by_color, {});
             // Fallback mapping for legacy data
             blocks = [{
                 id: Date.now(),
                 color: p.color || (oldColors[0] || ""),
                 title: p.title ? p.title.replace(` - ${p.color}`, '') : "",
                 description: p.description || "",
                 price: p.price || "",
                 mrp: p.mrp || "",
                 base_sku: oldColorSkus[p.color] || p.sku || "",
                 sizes: oldSizes,
                 images: oldImagesMap[p.color] || parse(p.image_urls, [])
             }];
        }

        setForm(f => ({
          ...f,
          ...p,
          care_instructions: parse(p.care_instructions, []),
          color_blocks: blocks,
          show_on_homepage: p.show_on_homepage || false,
          homepage_section: p.homepage_section || "none",
          homepage_card_slot: p.homepage_card_slot || null,
          variant_group_id: p.variant_group_id || null,
        }));
      }).catch(() => {});
  }, [editId]);

  const checkSku = async (skuVal, colorId) => {
    if (!skuVal) {
      setSkuErrors(prev => ({ ...prev, [colorId]: null }));
      return;
    }
    try {
      let query = `?sku=${encodeURIComponent(skuVal)}`;
      if (editId && form.variant_group_id) {
        query += `&ignoreGroupId=${form.variant_group_id}`;
      }
      const res = await safeFetch(`/api/admin/products/check-sku${query}`);
      if (res.exists) {
        setSkuErrors(prev => ({ ...prev, [colorId]: 'This base SKU is used by another product group!' }));
      } else {
        setSkuErrors(prev => ({ ...prev, [colorId]: null }));
      }
    } catch (err) { console.error("SKU check error", err) }
  };

  const addColorBlock = () => {
    setForm(f => ({
       ...f,
       color_blocks: [...f.color_blocks, {
         id: Date.now() + Math.random(),
         color: "", title: "", description: "", price: "", mrp: "", base_sku: "", sizes: [], images: []
       }]
    }));
  };

  const removeColorBlock = (id) => {
    setForm(f => ({
       ...f,
       color_blocks: f.color_blocks.filter(b => b.id !== id)
    }));
  };

  const updateBlock = (id, key, val) => {
    setForm(f => ({
       ...f,
       color_blocks: f.color_blocks.map(b => b.id === id ? { ...b, [key]: val } : b)
    }));
  };

  const toggleSizeForBlock = (blockId, size) => {
    setForm(f => ({
      ...f,
      color_blocks: f.color_blocks.map(b => {
        if (b.id !== blockId) return b;
        return {
          ...b,
          sizes: b.sizes.includes(size) ? b.sizes.filter(x => x !== size) : [...b.sizes, size]
        };
      })
    }));
  };

  const uploadImageToBlock = async (files, blockId) => {
    if (!files || files.length === 0) return;
    setUploadingImgHash(blockId);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        const data = await safeFetch("/api/upload", { method: "POST", body: fd });
        if (data.imageUrl) uploadedUrls.push(data.imageUrl);
      }
      if (uploadedUrls.length > 0) {
        setForm(f => ({
          ...f,
          color_blocks: f.color_blocks.map(b => b.id === blockId ? { ...b, images: [...b.images, ...uploadedUrls] } : b)
        }));
      }
    } catch { alert("Image upload failed"); }
    finally { setUploadingImgHash(null); }
  };

  const removeImageFromBlock = (blockId, url) => {
     setForm(f => ({
       ...f,
       color_blocks: f.color_blocks.map(b => b.id === blockId ? { ...b, images: b.images.filter(u => u !== url) } : b)
     }));
  }

  // Reorder a specific image within a colour block by ±1. First image = cover/front.
  const moveImageInBlock = (blockId, index, delta) => {
    setForm(f => ({
      ...f,
      color_blocks: f.color_blocks.map(b => {
        if (b.id !== blockId) return b;
        const imgs = [...b.images];
        const newIndex = index + delta;
        if (newIndex < 0 || newIndex >= imgs.length) return b;
        [imgs[index], imgs[newIndex]] = [imgs[newIndex], imgs[index]];
        return { ...b, images: imgs };
      })
    }));
  }

  // Promote a specific image to position 0 (cover / front image).
  const setFrontImageInBlock = (blockId, index) => {
    setForm(f => ({
      ...f,
      color_blocks: f.color_blocks.map(b => {
        if (b.id !== blockId) return b;
        if (index <= 0 || index >= b.images.length) return b;
        const imgs = [...b.images];
        const [picked] = imgs.splice(index, 1);
        imgs.unshift(picked);
        return { ...b, images: imgs };
      })
    }));
  }

  const handleSubmit = async (isDraft = false) => {
    setSaving(true);
    try {
      const allSelectedSizes = Array.from(new Set(form.color_blocks.flatMap(b => b.sizes)));
      const hasBabySize = allSelectedSizes.some(s => BABY_SIZES.includes(s));
      const hasKidsSize = allSelectedSizes.some(s => KIDS_SIZES.includes(s));
      
      const crossListed = [];
      if (form.main_category === "Baby girls" && hasKidsSize) crossListed.push("Girls clothing");
      if (form.main_category === "Girls clothing" && hasBabySize) crossListed.push("Baby girls");
      if (form.main_category === "Baby boys" && hasKidsSize) crossListed.push("Boys clothing");
      if (form.main_category === "Boys clothing" && hasBabySize) crossListed.push("Baby boys");

      const payload = { 
         ...form, 
         is_draft: isDraft, 
         primary_category: form.main_category, 
         cross_listed_categories: crossListed 
      };
      
      let result;
      if (editId) {
        result = await safeFetch(`/api/products/${editId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      } else {
        result = await safeFetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      }

      const targetId = result?.id || editId;
      if (targetId && typeof window !== "undefined") {
        sessionStorage.setItem("freshPublish", String(targetId));
      }
      router.push(targetId ? `/admin/products/${targetId}` : "/admin/products");
    } catch (e) { alert(e.message || "Failed to save product"); }
    finally { setSaving(false); }
  };

  const canNext = () => {
    if (step === 0) return form.main_category && form.item_type;
    if (step === 1) return form.fabric && form.pattern && form.neck_type;
    if (step === 2) {
       if (form.color_blocks.length === 0) return false;
       for (const b of form.color_blocks) {
          if (!b.color || !b.title || !b.price || !b.mrp || b.sizes.length === 0) return false;
       }
       return true;
    }
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
              <div className="card-title">Category & Setup</div>
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
                <div>
                  <div className="field-label">HSN code</div>
                  <input className="field-input" value={form.hsn_code} onChange={e => set("hsn_code", e.target.value)} placeholder="6111" />
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
                  {[["is_new_arrival","New arrival"],["is_featured","Featured"]].map(([k, label]) => (
                    <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                      <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} />{label}
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={form.show_on_homepage} onChange={e => set("show_on_homepage", e.target.checked)} /> Show on homepage
                  </label>
                  {form.show_on_homepage && (
                    <div>
                      <div className="field-label">Homepage section</div>
                      <select className="field-input" value={form.homepage_section} onChange={e => set("homepage_section", e.target.value)}>
                        <option value="none">Select section</option>
                        <option value="season_bestsellers">Season bestsellers</option>
                        <option value="new_arrivals">New arrivals</option>
                        <option value="featured_collection">Featured collection</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="card card-pad">
              <div className="card-title">Attributes (Shared across colours)</div>
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

          {step === 2 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div className="card-title" style={{ margin: 0 }}>Color Variations</div>
                <button className="btn btn-sm btn-accent" onClick={addColorBlock}>+ Add variation</button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {form.color_blocks.map((block, index) => (
                  <div key={block.id} className="card card-pad" style={{ position: "relative", border: "1px solid var(--border)", background: "var(--bg3)" }}>
                    {form.color_blocks.length > 1 && (
                      <button onClick={() => removeColorBlock(block.id)} style={{ position: "absolute", top: 16, right: 16, background: "var(--red)", color: "#fff", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Remove</button>
                    )}
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      {/* Left Column: Form Details */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <div className="field-label">Color *</div>
                          <select className="field-input" value={block.color} onChange={e => updateBlock(block.id, "color", e.target.value)}>
                            <option value="">Select colour</option>
                            {COLORS.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                        </div>
                        
                        <div>
                          <div className="field-label">Specific Title *</div>
                          <input className="field-input" value={block.title} onChange={e => updateBlock(block.id, "title", e.target.value)} placeholder="e.g. Ocean Blue Floral Dress" />
                        </div>
                        
                        <div className="g2" style={{ gap: 12 }}>
                          <div><div className="field-label">Selling price (₹) *</div><input className="field-input" type="number" value={block.price} onChange={e => updateBlock(block.id, "price", e.target.value)} placeholder="699" /></div>
                          <div><div className="field-label">MRP (₹) *</div><input className="field-input" type="number" value={block.mrp} onChange={e => updateBlock(block.id, "mrp", e.target.value)} placeholder="999" /></div>
                        </div>

                        <div>
                          <div className="field-label">Base SKU</div>
                          <input className="field-input" value={block.base_sku} 
                            onChange={e => { updateBlock(block.id, "base_sku", e.target.value.toUpperCase()); }}
                            onBlur={() => checkSku(block.base_sku, block.id)}
                            placeholder="e.g. CKGD-045A-BLU" />
                          {skuErrors[block.id] && <div style={{color: 'var(--red)', fontSize: 11, marginTop: 4}}>⚠️ {skuErrors[block.id]}</div>}
                          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>Sizes will automatically append: <b>{block.base_sku || "SKU"}-0-3M</b></div>
                        </div>

                        <div>
                          <div className="field-label">Specific Description</div>
                          <textarea className="field-input" value={block.description} onChange={e => updateBlock(block.id, "description", e.target.value)} placeholder="Describe this colour specifically..." rows={3} />
                        </div>
                      </div>

                      {/* Right Column: Sizes and Images */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
                           <div className="field-label" style={{ marginBottom: 12 }}>Available Sizes * <div style={{ fontWeight: 400, color: "var(--text3)", marginTop: 2 }}>Only select sizes you actually have for this colour</div></div>
                           
                           <div style={{ fontSize: 11, fontWeight: 600, color: "var(--purple)", marginBottom: 6 }}>Infant & baby</div>
                           <div className="chip-grid" style={{ marginBottom: 12 }}>{BABY_SIZES.map(s => <div key={s} className={`chip baby${block.sizes.includes(s) ? " on" : ""}`} onClick={() => toggleSizeForBlock(block.id, s)} style={{ padding: "4px 8px", fontSize: 10 }}>{s}</div>)}</div>
                           
                           <div style={{ fontSize: 11, fontWeight: 600, color: "var(--blue)", marginBottom: 6 }}>Toddler & kids</div>
                           <div className="chip-grid">{KIDS_SIZES.map(s => <div key={s} className={`chip kids${block.sizes.includes(s) ? " on" : ""}`} onClick={() => toggleSizeForBlock(block.id, s)} style={{ padding: "4px 8px", fontSize: 10 }}>{s}</div>)}</div>
                        </div>

                        <div style={{ background: "var(--bg)", padding: 12, borderRadius: 8, border: "1px solid var(--border)" }}>
                          <div className="field-label" style={{ marginBottom: 4 }}>Images</div>
                          <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 8 }}>First image is the <b>front</b> shown on product cards. Use ← → to reorder, or click ★ to set any image as the front.</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                            {block.images.map((url, i) => (
                              <div key={i} style={{ position: "relative", width: 72, display: "flex", flexDirection: "column", alignItems: "stretch", gap: 4 }}>
                                <div style={{ position: "relative", width: 72, height: 86, borderRadius: 6, overflow: "hidden", border: i === 0 ? "2px solid var(--accent, #4a90e2)" : "1px solid var(--border)" }}>
                                  <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                  {i === 0 && (
                                    <span style={{ position: "absolute", top: 2, left: 2, background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", padding: "2px 5px", borderRadius: 3 }}>FRONT</span>
                                  )}
                                  <button onClick={() => removeImageFromBlock(block.id, url)} title="Remove" style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "var(--red)", border: "none", color: "#fff", fontSize: 10, cursor: "pointer", lineHeight: 1 }}>✕</button>
                                </div>
                                <div style={{ display: "flex", gap: 2 }}>
                                  <button onClick={() => moveImageInBlock(block.id, i, -1)} disabled={i === 0} title="Move left" style={{ flex: 1, padding: "2px 0", fontSize: 11, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg4)", color: i === 0 ? "var(--text3)" : "var(--text2)", cursor: i === 0 ? "default" : "pointer" }}>←</button>
                                  <button onClick={() => setFrontImageInBlock(block.id, i)} disabled={i === 0} title="Make front" style={{ flex: 1, padding: "2px 0", fontSize: 11, border: "1px solid var(--border)", borderRadius: 4, background: i === 0 ? "var(--bg5)" : "var(--bg4)", color: i === 0 ? "var(--text3)" : "var(--amber, #d4a017)", cursor: i === 0 ? "default" : "pointer" }}>★</button>
                                  <button onClick={() => moveImageInBlock(block.id, i, 1)} disabled={i === block.images.length - 1} title="Move right" style={{ flex: 1, padding: "2px 0", fontSize: 11, border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg4)", color: i === block.images.length - 1 ? "var(--text3)" : "var(--text2)", cursor: i === block.images.length - 1 ? "default" : "pointer" }}>→</button>
                                </div>
                              </div>
                            ))}
                            <button onClick={() => { fileRef.current._blockId = block.id; fileRef.current.click(); }}
                              style={{ width: 72, height: 86, border: "1px dashed var(--border2)", borderRadius: 6, background: "var(--bg4)", color: "var(--text3)", fontSize: 20, cursor: "pointer", padding: 0, alignSelf: "flex-start" }}>
                              {uploadingImgHash === block.id ? "…" : "+"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={e => { if (e.target.files && e.target.files.length > 0) { uploadImageToBlock(Array.from(e.target.files), fileRef.current._blockId); } e.target.value = ""; }} />
            </div>
          )}

          {step === 3 && (
            <div className="card card-pad">
              <div className="card-title">Review before publishing</div>
              <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 16 }}>Check all details carefully. You have configured {form.color_blocks.length} colour variation(s).</div>

              <div style={{ display: "grid", gap: 0, marginBottom: 16 }}>
                {[
                  ["Category", `${form.main_category} › ${form.item_type || "—"}`],
                  ["Fabric / Pattern", `${form.fabric || "—"} / ${form.pattern || "—"}`],
                  ["Total Colours", form.color_blocks.map(c => c.color).join(", ") || "None"],
                  ["Homepage", form.show_on_homepage ? `Yes · ${(form.homepage_section || "").replace(/_/g, " ")}` : "No"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                    <span style={{ color: "var(--text3)" }}>{k}</span>
                    <span style={{ fontWeight: 500, textAlign: "right", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Show review summary for blocks */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                 {form.color_blocks.map((b, i) => (
                    <div key={b.id} style={{ padding: 12, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, display: "flex", gap: 12 }}>
                       <div style={{ width: 44, height: 56, borderRadius: 4, overflow: "hidden", background: "var(--bg4)", flexShrink: 0 }}>
                          {b.images[0] && <img src={b.images[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                       </div>
                       <div style={{ flex: 1, minWidth: 0 }}>
                           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                               <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.title || `Color ${i+1}`}</div>
                               <div style={{ fontSize: 12, fontWeight: 600 }}>₹{b.price}</div>
                           </div>
                           <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>{b.color} · SKU: {b.base_sku || "Missing"}</div>
                           <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{b.sizes.length} sizes: {b.sizes.join(", ")}</div>
                       </div>
                    </div>
                 ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {Object.values(skuErrors).some(v => v) && (
                  <div style={{ width: "100%", padding: 10, background: "var(--red)", color: "white", borderRadius: 8, fontSize: 12, textAlign: "center", marginBottom: 10 }}>
                    Please fix the duplicate base SKU errors before publishing.
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-sm" style={{ flex: 1 }} disabled={saving || Object.values(skuErrors).some(v => v)} onClick={() => handleSubmit(true)}>{saving ? "Saving…" : "Save as draft"}</button>
                <button className="btn btn-accent btn-sm" style={{ flex: 1 }} disabled={saving || Object.values(skuErrors).some(v => v)} onClick={() => handleSubmit(false)}>{saving ? "Publishing…" : editId ? "Update product" : "Publish product"}</button>
              </div>
            </div>
          )}


          <div style={{ display: "flex", gap: 10 }}>
            {step > 0 && <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>← Back</button>}
            {step < 3 && <button className="btn btn-accent btn-sm" style={{ flex: 1 }} disabled={!canNext()} onClick={() => setStep(s => s + 1)}>Next: {STEPS[step + 1]} →</button>}
          </div>
        </div>

        {/* SUMMARY SECTION - Minimal */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
