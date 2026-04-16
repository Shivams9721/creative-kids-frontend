"use client";

import { useEffect, useMemo, useState } from "react";
import { safeFetch } from "../api";

const PRODUCT_SECTION_KEYS = ["girls_new_arrivals", "season_bestsellers", "featured_collection"];

export default function HomepageAdminPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [publishAt, setPublishAt] = useState("");
  const [validationErrors, setValidationErrors] = useState([]);

  const groupedProducts = useMemo(() => {
    return (Array.isArray(products) ? products : []).map((p) => ({
      id: p.id,
      title: p.title || `Product #${p.id}`,
      sku: p.base_sku || "",
    }));
  }, [products]);

  const bySectionKey = useMemo(() => {
    const map = {};
    for (const s of sections) map[s.section_key] = s;
    return map;
  }, [sections]);

  const getItems = (sectionId) => items.filter((i) => i.section_id === sectionId).sort((a, b) => a.display_order - b.display_order);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [cfg, prod] = await Promise.all([
        safeFetch("/api/admin/homepage-config/current"),
        safeFetch("/api/admin/products"),
      ]);
      const h = await safeFetch("/api/admin/homepage-config/history");
      setConfig(cfg.config);
      setSections(cfg.sections || []);
      setItems(cfg.items || []);
      setProducts(prod || []);
      setHistory(h || []);
      setPublishAt(cfg.config?.publish_at ? new Date(cfg.config.publish_at).toISOString().slice(0, 16) : "");
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createDraft = async () => {
    try {
      await safeFetch("/api/admin/homepage-config/draft", { method: "POST", body: JSON.stringify({ title: "Homepage Draft" }) });
      await load();
    } catch (e) {
      alert(e.message || "Failed to create draft");
    }
  };

  const setSectionField = (id, key, value) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));
  };

  const shiftSection = (index, direction) => {
    const next = [...sections].sort((a, b) => a.display_order - b.display_order);
    const to = index + direction;
    if (to < 0 || to >= next.length) return;
    const left = next[index];
    const right = next[to];
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === left.id) return { ...s, display_order: right.display_order };
        if (s.id === right.id) return { ...s, display_order: left.display_order };
        return s;
      })
    );
  };

  const shiftItem = (sectionId, index, direction) => {
    const sectionItems = getItems(sectionId);
    const to = index + direction;
    if (to < 0 || to >= sectionItems.length) return;
    const left = sectionItems[index];
    const right = sectionItems[to];
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === left.id) return { ...it, display_order: right.display_order };
        if (it.id === right.id) return { ...it, display_order: left.display_order };
        return it;
      })
    );
  };

  const addProductItem = (sectionId, productId) => {
    const sectionItems = getItems(sectionId);
    setItems((prev) => [
      ...prev,
      {
        section_id: sectionId,
        item_type: "product",
        display_order: sectionItems.length + 1,
        product_id: parseInt(productId, 10),
        label: "",
        target_url: "",
        image_url: "",
        settings_json: {},
      },
    ]);
  };

  const addCategoryItem = (sectionId) => {
    if (!sectionId) return;
    const sectionItems = getItems(sectionId);
    setItems((prev) => [
      ...prev,
      {
        section_id: sectionId,
        item_type: "category",
        display_order: sectionItems.length + 1,
        label: "New Category",
        target_url: "/shop",
        image_url: "",
        settings_json: {},
      },
    ]);
  };

  const populateDefaultCategories = (sectionId) => {
    if (!sectionId) return;
    const defaultCats = [
      { label: "Dress", targetUrl: "/shop/kids-girl/dresses", imageUrl: "/images/Dress.png" },
      { label: "Shorts", targetUrl: "/shop/kids-girl/shorts-skirts-skorts", imageUrl: "/images/shorts.jpg" },
      { label: "Infants", targetUrl: "/shop/baby-boy/onesies-rompers", imageUrl: "/images/infant.png" },
      { label: "Clothing Sets", targetUrl: "/shop/baby-girl/clothing-sets", imageUrl: "/images/clothing set.png" }
    ];
    let offset = getItems(sectionId).length;
    const newItems = defaultCats.map((c, i) => ({
      section_id: sectionId,
      item_type: "category",
      display_order: offset + i + 1,
      label: c.label,
      target_url: c.targetUrl,
      image_url: c.imageUrl,
      settings_json: {},
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (target) => {
    const sectionItems = getItems(target.section_id);
    const filtered = items.filter((it) => !(it.id && target.id ? it.id === target.id : it.section_id === target.section_id && it.display_order === target.display_order));
    const remapped = filtered.map((it) => {
      if (it.section_id !== target.section_id) return it;
      const order = sectionItems
        .filter((x) => !(x.id && target.id ? x.id === target.id : x.display_order === target.display_order))
        .findIndex((x) => (x.id && it.id ? x.id === it.id : x.display_order === it.display_order));
      return { ...it, display_order: order + 1 };
    });
    setItems(remapped);
  };

  const validateBeforePublish = () => {
    const errs = [];
    const sectionMap = {};
    sections.forEach((s) => { sectionMap[s.section_key] = s; });
    const hero = sectionMap.hero_banner;
    const heroSettings = typeof hero?.settings_json === "string" ? JSON.parse(hero.settings_json || "{}") : (hero?.settings_json || {});
    if (hero?.is_enabled !== false) {
      if (!hero?.title) errs.push("Hero title is required.");
      if (!heroSettings?.imageUrl) errs.push("Hero image is required.");
      if (!heroSettings?.ctaHref) errs.push("Hero CTA link is required.");
    }
    const cat = sectionMap.shop_by_category;
    if (cat?.is_enabled !== false) {
      const catItems = getItems(cat.id);
      if (catItems.length === 0) errs.push("Shop by Category requires at least one card.");
      catItems.forEach((item, idx) => {
        if (!item.label) errs.push(`Category card #${idx + 1} needs label.`);
        if (!item.target_url) errs.push(`Category card #${idx + 1} needs target URL.`);
        if (!item.image_url) errs.push(`Category card #${idx + 1} needs image.`);
      });
    }
    PRODUCT_SECTION_KEYS.forEach((key) => {
      const sec = sectionMap[key];
      if (!sec || sec.is_enabled === false) return;
      const secItems = getItems(sec.id);
      if (secItems.length === 0) errs.push(`${sec.title || key} needs at least one product.`);
      secItems.forEach((it, idx) => {
        if (!it.product_id) errs.push(`${sec.title || key} item #${idx + 1} needs a product.`);
      });
    });
    setValidationErrors(errs);
    return errs.length === 0;
  };

  const updateItemField = (target, key, value) => {
    setItems((prev) =>
      prev.map((it) =>
        (target.id && it.id === target.id) || (!target.id && it.section_id === target.section_id && it.display_order === target.display_order)
          ? { ...it, [key]: value }
          : it
      )
    );
  };

  const uploadImage = async (onDone) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/mp4,video/webm";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("image", file);
      const token = localStorage.getItem("adminToken");
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://vbaumdstnz.ap-south-1.awsapprunner.com";
        const res = await fetch(`${apiBase}/api/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        onDone(data.imageUrl);
      } catch (e) {
        alert(e.message || "Upload failed");
      }
    };
    input.click();
  };

  const saveDraft = async () => {
    if (!config?.id) return;
    setSaving(true);
    try {
      const normalizedSections = sections.map((s) => ({
        ...s,
        settings_json: typeof s.settings_json === "string" ? JSON.parse(s.settings_json || "{}") : (s.settings_json || {}),
      }));
      const normalizedItems = items.map((i) => ({
        ...i,
        settings_json: typeof i.settings_json === "string" ? JSON.parse(i.settings_json || "{}") : (i.settings_json || {}),
      }));
      await safeFetch(`/api/admin/homepage-config/draft/${config.id}`, {
        method: "PUT",
        body: JSON.stringify({ sections: normalizedSections, items: normalizedItems }),
      });
      await load();
      alert("Draft saved");
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!config?.id) return;
    if (!validateBeforePublish()) {
      alert("Please fix validation errors before publishing.");
      return;
    }
    setPublishing(true);
    try {
      await saveDraft();
      await safeFetch(`/api/admin/homepage-config/draft/${config.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ publish_at: publishAt ? new Date(publishAt).toISOString() : null }),
      });
      await load();
      alert("Homepage published");
    } catch (e) {
      alert(e.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const rollback = async (id) => {
    try {
      await safeFetch(`/api/admin/homepage-config/rollback/${id}`, { method: "POST", body: JSON.stringify({}) });
      await load();
      alert("Rollback draft created");
    } catch (e) {
      alert(e.message || "Rollback failed");
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading homepage editor...</div>;

  if (!config) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Homepage Editor</h2>
        <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>No draft found yet.</p>
        <button className="btn btn-accent" onClick={createDraft}>Create Homepage Draft</button>
        {error ? <div style={{ marginTop: 10, color: "var(--red)" }}>{error}</div> : null}
      </div>
    );
  }

  const hero = bySectionKey.hero_banner;
  const rawHeroSettings = typeof hero?.settings_json === "string" ? JSON.parse(hero.settings_json || "{}") : (hero?.settings_json || {});
  
  // Migrate old flat structure to slides array
  let heroSlidesData = rawHeroSettings.slides || [];
  if (heroSlidesData.length === 0 && (rawHeroSettings.imageUrl || rawHeroSettings.ctaLabel)) {
    heroSlidesData = [{
      imageUrl: rawHeroSettings.imageUrl || "",
      mobileImageUrl: rawHeroSettings.mobileImageUrl || "",
      ctaLabel: rawHeroSettings.ctaLabel || "",
      ctaHref: rawHeroSettings.ctaHref || "",
    }];
  }

  const updateHeroSlide = (index, key, value) => {
    const newSlides = [...heroSlidesData];
    newSlides[index] = { ...newSlides[index], [key]: value };
    setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides: newSlides });
  };

  const addHeroSlide = () => {
    const newSlides = [...heroSlidesData, { imageUrl: "", mobileImageUrl: "", ctaLabel: "", ctaHref: "" }];
    setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides: newSlides });
  };

  const removeHeroSlide = (index) => {
    const newSlides = heroSlidesData.filter((_, i) => i !== index);
    setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides: newSlides });
  };
  
  const moveHeroSlide = (index, direction) => {
    const newSlides = [...heroSlidesData];
    const to = index + direction;
    if (to < 0 || to >= newSlides.length) return;
    const temp = newSlides[index];
    newSlides[index] = newSlides[to];
    newSlides[to] = temp;
    setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides: newSlides });
  };
  const categorySection = bySectionKey.shop_by_category;
  const categoryItems = getItems(categorySection?.id || -1);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Homepage Editor</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>Draft v{config.version} ({config.status})</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm" onClick={saveDraft} disabled={saving}>{saving ? "Saving..." : "Save Draft"}</button>
          <button className="btn btn-accent btn-sm" onClick={publish} disabled={publishing}>{publishing ? "Publishing..." : "Publish"}</button>
        </div>
      </div>
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="card-title">Publish Options</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, minWidth: 130 }}>Schedule publish:</label>
          <input
            className="field-input"
            type="datetime-local"
            value={publishAt}
            onChange={(e) => setPublishAt(e.target.value)}
          />
          <button className="btn btn-sm" onClick={() => setPublishAt("")}>Clear</button>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="card-title">Section Arrangement</div>
        {[...sections].sort((a, b) => a.display_order - b.display_order).map((s, idx) => (
          <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <div style={{ flex: 1, fontSize: 12 }}>{s.title || s.section_key}</div>
            <button className="btn btn-sm" onClick={() => shiftSection(idx, -1)}>↑</button>
            <button className="btn btn-sm" onClick={() => shiftSection(idx, 1)}>↓</button>
            <span style={{ width: 24, textAlign: "center", fontSize: 11, color: "var(--text3)" }}>{s.display_order}</span>
          </div>
        ))}
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>Hero Banner</div>
          <button className="btn btn-sm btn-accent" onClick={addHeroSlide}>+ Add Slide</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingBottom: 16, borderBottom: "1px dashed var(--border)", marginBottom: 12 }}>
          <input className="field-input" value={hero?.title || ""} onChange={(e) => setSectionField(hero.id, "title", e.target.value)} placeholder="Main Title (Legacy fallback)" />
          <input className="field-input" value={hero?.subtitle || ""} onChange={(e) => setSectionField(hero.id, "subtitle", e.target.value)} placeholder="Main Tag (Legacy fallback)" />
        </div>
        
        {heroSlidesData.map((slide, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 16, padding: 12, border: "1px solid var(--border)", borderRadius: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 12, fontWeight: 600 }}>
              Slide #{sIdx + 1}
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-sm" onClick={() => moveHeroSlide(sIdx, -1)}>↑</button>
                <button className="btn btn-sm" onClick={() => moveHeroSlide(sIdx, 1)}>↓</button>
                <button className="btn btn-sm" onClick={() => removeHeroSlide(sIdx)}>Remove</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input className="field-input" value={slide.ctaLabel || ""} onChange={(e) => updateHeroSlide(sIdx, "ctaLabel", e.target.value)} placeholder="CTA label" />
              <input className="field-input" value={slide.ctaHref || ""} onChange={(e) => updateHeroSlide(sIdx, "ctaHref", e.target.value)} placeholder="CTA link (/shop)" />
              
              <input className="field-input" value={slide.imageUrl || ""} onChange={(e) => updateHeroSlide(sIdx, "imageUrl", e.target.value)} placeholder="Desktop Image/Video URL" />
              <button className="btn btn-sm" onClick={() => uploadImage((url) => updateHeroSlide(sIdx, "imageUrl", url))}>Upload Desktop Media</button>
              
              <input className="field-input" value={slide.mobileImageUrl || ""} onChange={(e) => updateHeroSlide(sIdx, "mobileImageUrl", e.target.value)} placeholder="Mobile Image/Video URL (optional)" />
              <button className="btn btn-sm" onClick={() => uploadImage((url) => updateHeroSlide(sIdx, "mobileImageUrl", url))}>Upload Mobile Media</button>
              
              <input className="field-input" value={slide.title || ""} onChange={(e) => updateHeroSlide(sIdx, "title", e.target.value)} placeholder="Slide Title (optional custom title)" />
              <input className="field-input" value={slide.tag || ""} onChange={(e) => updateHeroSlide(sIdx, "tag", e.target.value)} placeholder="Slide Tag (optional custom tag)" />
            </div>
          </div>
        ))}

        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>💡 Tip: You can upload images OR videos (.mp4/.webm). Videos play instantly without controls and will loop.</div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>Shop by Category</div>
          <div style={{ display: "flex", gap: 8 }}>
            <label style={{ fontSize: 12, marginRight: 8 }}>
              <input type="checkbox" checked={categorySection?.is_enabled !== false} onChange={(e) => setSectionField(categorySection?.id, "is_enabled", e.target.checked)} /> Enabled
            </label>
            <button className="btn btn-sm" onClick={() => populateDefaultCategories(categorySection?.id)}>+ Load Default Categories</button>
            <button className="btn btn-sm btn-accent" onClick={() => addCategoryItem(categorySection?.id)}>+ Add Category Slot</button>
          </div>
        </div>
        {categoryItems.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8, padding: 8, background: "var(--bg)", borderRadius: 6 }}>
            No categories defined. The storefront will display the hardcoded default categories. Click "Load Default Categories" above to edit their images.
          </div>
        )}
        {categoryItems.map((item, idx) => (
          <div key={`${item.id || "new"}-${idx}`} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 2fr auto auto auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input className="field-input" value={item.label || ""} onChange={(e) => updateItemField(item, "label", e.target.value)} placeholder="Category Name (e.g. Shirts)" />
            <input className="field-input" value={item.target_url || ""} onChange={(e) => updateItemField(item, "target_url", e.target.value)} placeholder="Target URL (/shop/kids-girl/shirts)" />
            <input className="field-input" value={item.image_url || ""} onChange={(e) => updateItemField(item, "image_url", e.target.value)} placeholder="Image URL (Upload ->)" />
            <button className="btn btn-sm" onClick={() => uploadImage((url) => updateItemField(item, "image_url", url))}>Upload Photo</button>
            <button className="btn btn-sm" onClick={() => removeItem(item)}>Remove</button>
            <span style={{ fontSize: 11, color: "var(--text3)", alignSelf: "center", width: 24, textAlign: "center" }}>#{item.display_order}</span>
          </div>
        ))}
      </div>

      {PRODUCT_SECTION_KEYS.map((key) => {
        const section = bySectionKey[key];
        if (!section) return null;
        const sectionItems = getItems(section.id);
        return (
          <div className="card card-pad" key={key} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="card-title">{section.title || key}</div>
              <label style={{ fontSize: 12 }}>
                <input type="checkbox" checked={section.is_enabled !== false} onChange={(e) => setSectionField(section.id, "is_enabled", e.target.checked)} /> Enabled
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select className="field-input" defaultValue="">
                <option value="" disabled>Select product</option>
                {groupedProducts.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.id})</option>)}
              </select>
              <button
                className="btn btn-sm"
                onClick={(e) => {
                  const sel = e.currentTarget.previousSibling;
                  if (sel && sel.value) addProductItem(section.id, sel.value);
                }}
              >
                Add Product
              </button>
            </div>
            {sectionItems.map((item, idx) => (
              <div key={`${item.id || "new"}-${idx}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <select className="field-input" value={item.product_id || ""} onChange={(e) => updateItemField(item, "product_id", parseInt(e.target.value, 10))}>
                  <option value="">Select product</option>
                  {groupedProducts.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.id})</option>)}
                </select>
                <button className="btn btn-sm" onClick={() => shiftItem(section.id, idx, -1)}>↑</button>
                <button className="btn btn-sm" onClick={() => shiftItem(section.id, idx, 1)}>↓</button>
                <button className="btn btn-sm" onClick={() => removeItem(item)}>Remove</button>
                <span style={{ width: 24, textAlign: "center", fontSize: 11, color: "var(--text3)" }}>{item.display_order}</span>
              </div>
            ))}
          </div>
        );
      })}

      {validationErrors.length > 0 && (
        <div className="alert alert-red" style={{ marginBottom: 16 }}>
          <div className="alert-msg">
            {validationErrors.map((err, i) => (
              <div key={i} style={{ fontSize: 12 }}>{err}</div>
            ))}
          </div>
        </div>
      )}

      <div className="card card-pad">
        <div className="card-title">Version History</div>
        {(history || []).map((h) => (
          <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12 }}>
              v{h.version} · {h.title} · {h.status}
              {h.published_at ? ` · Published ${new Date(h.published_at).toLocaleString()}` : ""}
            </div>
            <button className="btn btn-sm" onClick={() => rollback(h.id)}>Rollback as Draft</button>
          </div>
        ))}
      </div>
    </div>
  );
}

