"use client";

import { useEffect, useMemo, useState } from "react";
import { safeFetch } from "../api";

const PRODUCT_SECTION_KEYS = ["girls_new_arrivals", "season_bestsellers", "featured_collection"];

const CTA_OPTIONS = [
  { label: "— Select a page —", value: "" },
  { label: "Shop All", value: "/shop" },
  { label: "Kids Girls", value: "/shop/kids-girl" },
  { label: "Kids Boys", value: "/shop/kids-boy" },
  { label: "Baby Girls", value: "/shop/baby-girl" },
  { label: "Baby Boys", value: "/shop/baby-boy" },
  { label: "Dresses", value: "/shop/kids-girl/dresses" },
  { label: "Shorts / Skirts", value: "/shop/kids-girl/shorts-skirts-skorts" },
  { label: "Infants / Rompers", value: "/shop/baby-boy/onesies-rompers" },
  { label: "Clothing Sets", value: "/shop/baby-girl/clothing-sets" },
  { label: "About Us", value: "/about" },
  { label: "Contact Us", value: "/contact" },
  { label: "Custom URL...", value: "__custom__" },
];

const isVideoUrl = (url) => url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

// Smart CTA link selector: dropdown of preset routes + optional custom input
function CtaLinkSelect({ value, onChange, placeholder }) {
  const presetValues = CTA_OPTIONS.filter(o => o.value && o.value !== "__custom__").map(o => o.value);
  const isPreset = presetValues.includes(value);
  const [useCustom, setUseCustom] = useState(!!value && !isPreset);

  const handleSelect = (v) => {
    if (v === "__custom__") { setUseCustom(true); }
    else { setUseCustom(false); onChange(v); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <select className="field-input" value={useCustom ? "__custom__" : (value || "")} onChange={(e) => handleSelect(e.target.value)}>
        {CTA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {useCustom && (
        <input
          className="field-input"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Custom URL (e.g. /shop/sale)"}
          style={{ borderColor: "var(--blue)", fontSize: 12 }}
        />
      )}
    </div>
  );
}


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
  const [uploadProgress, setUploadProgress] = useState({});

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

  const getItems = (sectionId) =>
    items.filter((i) => i.section_id === sectionId).sort((a, b) => a.display_order - b.display_order);

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

  useEffect(() => { load(); }, []);

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
    const sorted = [...sections].sort((a, b) => a.display_order - b.display_order);
    const to = index + direction;
    if (to < 0 || to >= sorted.length) return;
    const left = sorted[index];
    const right = sorted[to];
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
      { section_id: sectionId, item_type: "product", display_order: sectionItems.length + 1, product_id: parseInt(productId, 10), label: "", target_url: "", image_url: "", settings_json: {} },
    ]);
  };

  const addCategoryItem = (sectionId) => {
    if (!sectionId) return;
    const sectionItems = getItems(sectionId);
    setItems((prev) => [
      ...prev,
      { section_id: sectionId, item_type: "category", display_order: sectionItems.length + 1, label: "New Category", target_url: "/shop", image_url: "", settings_json: {} },
    ]);
  };


  const populateDefaultCategories = (sectionId) => {
    if (!sectionId) return;
    const defaultCats = [
      { label: "Dress", targetUrl: "/shop/kids-girl/dresses", imageUrl: "/images/Dress.png" },
      { label: "Shorts", targetUrl: "/shop/kids-girl/shorts-skirts-skorts", imageUrl: "/images/shorts.jpg" },
      { label: "Infants", targetUrl: "/shop/baby-boy/onesies-rompers", imageUrl: "/images/infant.png" },
      { label: "Clothing Sets", targetUrl: "/shop/baby-girl/clothing-sets", imageUrl: "/images/clothing set.png" },
    ];
    let offset = getItems(sectionId).length;
    const newItems = defaultCats.map((c, i) => ({
      section_id: sectionId, item_type: "category", display_order: offset + i + 1,
      label: c.label, target_url: c.targetUrl, image_url: c.imageUrl, settings_json: {},
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const removeItem = (target) => {
    const sectionItems = getItems(target.section_id);
    const filtered = items.filter((it) =>
      !(it.id && target.id ? it.id === target.id : it.section_id === target.section_id && it.display_order === target.display_order)
    );
    const remapped = filtered.map((it) => {
      if (it.section_id !== target.section_id) return it;
      const order = sectionItems
        .filter((x) => !(x.id && target.id ? x.id === target.id : x.display_order === target.display_order))
        .findIndex((x) => (x.id && it.id ? x.id === it.id : x.display_order === it.display_order));
      return { ...it, display_order: order + 1 };
    });
    setItems(remapped);
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


  const validateBeforePublish = () => {
    const errs = [];
    const sectionMap = {};
    sections.forEach((s) => { sectionMap[s.section_key] = s; });

    // Hero banner validation
    const hero = sectionMap.hero_banner;
    const heroSettings = typeof hero?.settings_json === "string" ? JSON.parse(hero.settings_json || "{}") : (hero?.settings_json || {});
    if (hero?.is_enabled !== false) {
      const slides = heroSettings?.slides || [];
      if (slides.length === 0) errs.push("Hero Banner: Add at least one slide.");
      slides.forEach((slide, i) => {
        if (!slide.imageUrl && !slide.mobileImageUrl) errs.push(`Hero Slide #${i + 1}: Upload an image or video.`);
      });
    }

    // Shop by category validation
    const cat = sectionMap.shop_by_category;
    if (cat?.is_enabled !== false) {
      const catItems = getItems(cat?.id || -1);
      if (catItems.length === 0) errs.push("Shop by Category: Add at least one category card.");
      catItems.forEach((item, idx) => {
        if (!item.label) errs.push(`Category card #${idx + 1}: Label is required.`);
        if (!item.target_url) errs.push(`Category card #${idx + 1}: Target URL is required.`);
        if (!item.image_url) errs.push(`Category card #${idx + 1}: Image is required.`);
      });
    }

    // Product sections validation
    PRODUCT_SECTION_KEYS.forEach((key) => {
      const sec = sectionMap[key];
      if (!sec || sec.is_enabled === false) return;
      const secItems = getItems(sec.id);
      if (secItems.length === 0) errs.push(`${sec.title || key}: Add at least one product.`);
      secItems.forEach((it, idx) => {
        if (!it.product_id) errs.push(`${sec.title || key} item #${idx + 1}: Select a product.`);
      });
    });

    // About Us Banner validation (only if enabled)
    const aboutUs = sectionMap.about_us_banner;
    if (aboutUs?.is_enabled === true) {
      const settings = typeof aboutUs.settings_json === "string" ? JSON.parse(aboutUs.settings_json || "{}") : (aboutUs.settings_json || {});
      if (!settings.imageUrl && !settings.mobileImageUrl) errs.push("About Us Banner: Upload a banner image or video.");
    }

    setValidationErrors(errs);
    return errs.length === 0;
  };

  // Fire-and-forget S3 cleanup
  const deleteFromS3 = (url) => {
    if (!url || !url.includes(".amazonaws.com/")) return;
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://vbaumdstnz.ap-south-1.awsapprunner.com";
    fetch(`${apiBase}/api/upload`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ imageUrl: url }),
    }).catch(() => {});
  };

  // Upload file with media type restriction. accept: "image/*" or "video/mp4,video/webm" or both
  const uploadFile = async (onDone, oldUrl, progressKey, accept = "image/*,video/mp4,video/webm") => {
    if (oldUrl) deleteFromS3(oldUrl);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (progressKey) setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }));
      const fd = new FormData();
      fd.append("image", file);
      const token = localStorage.getItem("adminToken");
      if (!token) {
        alert("Not logged in. Please login again.");
        if (progressKey) setUploadProgress((prev) => { const n = { ...prev }; delete n[progressKey]; return n; });
        return;
      }
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://vbaumdstnz.ap-south-1.awsapprunner.com";
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${apiBase}/api/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && progressKey)
          setUploadProgress((prev) => ({ ...prev, [progressKey]: Math.round((e.loaded * 100) / e.total) }));
      };
      xhr.onload = () => {
        if (xhr.status === 401 || xhr.status === 403) {
          localStorage.removeItem("adminToken");
          alert("Session expired. Redirecting to login...");
          if (progressKey) setUploadProgress((prev) => { const n = { ...prev }; delete n[progressKey]; return n; });
          setTimeout(() => { window.location.href = "/admin/login"; }, 1500);
          return;
        }
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.imageUrl) { onDone(data.imageUrl); }
          else { alert(data.error || data.message || `Upload failed (${xhr.status})`); }
        } catch { alert(`Upload failed with status ${xhr.status}`); }
        if (progressKey) setUploadProgress((prev) => { const n = { ...prev }; delete n[progressKey]; return n; });
      };
      xhr.onerror = () => { alert("Network error during upload"); if (progressKey) setUploadProgress((prev) => { const n = { ...prev }; delete n[progressKey]; return n; }); };
      xhr.onabort = () => { alert("Upload cancelled"); if (progressKey) setUploadProgress((prev) => { const n = { ...prev }; delete n[progressKey]; return n; }); };
      xhr.send(fd);
    };
    input.click();
  };

  const renderUploadBtn = (key, onClick, text) => {
    const p = uploadProgress[key];
    if (p !== undefined) {
      return (
        <button disabled className="btn btn-sm" style={{ position: "relative", overflow: "hidden", background: "var(--bg3)", borderColor: "var(--border2)" }}>
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${p}%`, background: "var(--blue)", opacity: 0.2, transition: "width 0.2s ease-out" }} />
          <span style={{ position: "relative", zIndex: 1, color: "var(--blue)", fontWeight: 600 }}>{p}%</span>
        </button>
      );
    }
    return <button className="btn btn-sm" onClick={onClick}>{text}</button>;
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
  let heroSlidesData = rawHeroSettings.slides || [];
  if (heroSlidesData.length === 0 && (rawHeroSettings.imageUrl || rawHeroSettings.ctaLabel)) {
    heroSlidesData = [{ imageUrl: rawHeroSettings.imageUrl || "", mobileImageUrl: rawHeroSettings.mobileImageUrl || "", ctaLabel: rawHeroSettings.ctaLabel || "", ctaHref: rawHeroSettings.ctaHref || "" }];
  }

  const updateHeroSlide = (index, key, value) => {
    const newSlides = [...heroSlidesData];
    newSlides[index] = { ...newSlides[index], [key]: value };
    setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides: newSlides });
  };

  const addHeroSlide = () => {
    const newSlides = [...heroSlidesData, { imageUrl: "", mobileImageUrl: "", ctaLabel: "", ctaHref: "", title: "", tag: "", mediaType: "image" }];
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
    [newSlides[index], newSlides[to]] = [newSlides[to], newSlides[index]];
    setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides: newSlides });
  };

  const getSlideMediaType = (slide) => {
    if (isVideoUrl(slide?.imageUrl) || isVideoUrl(slide?.mobileImageUrl)) return "video";
    return slide?.mediaType || "image";
  };

  const switchSlideMediaType = (index, newType) => {
    const slide = heroSlidesData[index];
    const currentType = getSlideMediaType(slide);
    if (currentType === newType) return;
    const hasMedia = slide.imageUrl || slide.mobileImageUrl;
    if (hasMedia && !confirm(`Switching media type will clear the current ${currentType} URLs. Continue?`)) return;
    updateHeroSlide(index, "imageUrl", "");
    updateHeroSlide(index, "mobileImageUrl", "");
    setTimeout(() => updateHeroSlide(index, "mediaType", newType), 0);
  };

  const categorySection = bySectionKey.shop_by_category;
  const categoryItems = getItems(categorySection?.id || -1);

  const aboutUsSection = bySectionKey.about_us_banner;
  const rawAboutSettings = typeof aboutUsSection?.settings_json === "string"
    ? JSON.parse(aboutUsSection.settings_json || "{}") : (aboutUsSection?.settings_json || {});

  const updateAboutField = (key, value) => {
    if (!aboutUsSection?.id) return;
    setSectionField(aboutUsSection.id, "settings_json", { ...rawAboutSettings, [key]: value });
  };

  const testimonialsSection = bySectionKey.testimonials;
  const rawTestimonialsSettings = typeof testimonialsSection?.settings_json === "string"
    ? JSON.parse(testimonialsSection.settings_json || "{}") : (testimonialsSection?.settings_json || {});
  const updateTestimonialsField = (key, value) => {
    if (!testimonialsSection?.id) return;
    setSectionField(testimonialsSection.id, "settings_json", { ...rawTestimonialsSettings, [key]: value });
  };

  const isBusy = saving || publishing || Object.keys(uploadProgress).length > 0;
  const busyLabel = Object.keys(uploadProgress).length > 0 ? "Uploading..." : saving ? "Saving..." : publishing ? "Publishing..." : null;

  return (
    <div style={{ padding: 24 }}>
      {/* ─── Header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>Homepage Editor</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>Draft v{config.version} ({config.status})</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-sm" onClick={saveDraft} disabled={isBusy}>{busyLabel || "Save Draft"}</button>
          <button className="btn btn-accent btn-sm" onClick={publish} disabled={isBusy}>{busyLabel || "Publish"}</button>
        </div>
      </div>

      {/* ─── Publish Options ─── */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="card-title">Publish Options</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ fontSize: 12, minWidth: 130 }}>Schedule publish:</label>
          <input className="field-input" type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
          <button className="btn btn-sm" onClick={() => setPublishAt("")}>Clear</button>
        </div>
      </div>

      {/* ─── Section Arrangement ─── */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="card-title">Section Arrangement</div>
        <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>
          Use ↑ ↓ to reorder sections. The storefront respects this order. Disabled sections are hidden on the storefront.
        </div>
        {[...sections].sort((a, b) => a.display_order - b.display_order).map((s, idx, arr) => (
          <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, padding: "6px 8px", background: s.is_enabled === false ? "var(--bg2)" : "var(--bg)", borderRadius: 4, border: "1px solid var(--border)" }}>
            <div style={{ flex: 1, fontSize: 12, color: s.is_enabled === false ? "var(--text3)" : "var(--text)" }}>
              {s.title || s.section_key}
              {s.is_enabled === false && <span style={{ marginLeft: 6, fontSize: 10, color: "var(--text3)", background: "var(--bg3)", padding: "1px 4px", borderRadius: 3 }}>DISABLED</span>}
            </div>
            <button className="btn btn-sm" onClick={() => shiftSection(idx, -1)} disabled={idx === 0}>↑</button>
            <button className="btn btn-sm" onClick={() => shiftSection(idx, 1)} disabled={idx === arr.length - 1}>↓</button>
            <span style={{ width: 24, textAlign: "center", fontSize: 11, color: "var(--text3)" }}>{s.display_order}</span>
          </div>
        ))}
      </div>

      {/* ─── Hero Banner ─── */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>Hero Banner</div>
          <button className="btn btn-sm btn-accent" onClick={addHeroSlide}>+ Add Slide</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, paddingBottom: 16, borderBottom: "1px dashed var(--border)", marginBottom: 12 }}>
          <input className="field-input" value={hero?.title || ""} onChange={(e) => setSectionField(hero.id, "title", e.target.value)} placeholder="Main Title (Legacy fallback)" />
          <input className="field-input" value={hero?.subtitle || ""} onChange={(e) => setSectionField(hero.id, "subtitle", e.target.value)} placeholder="Main Tag (Legacy fallback)" />
        </div>

        {heroSlidesData.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text3)", padding: 8, background: "var(--bg)", borderRadius: 6, marginBottom: 8 }}>
            No slides yet. Click "+ Add Slide" to add a banner.
          </div>
        )}

        {heroSlidesData.map((slide, sIdx) => {
          const mediaType = getSlideMediaType(slide);
          const acceptStr = mediaType === "video" ? "video/mp4,video/webm" : "image/*";
          const uploadLabel = mediaType === "video" ? "Upload Video" : "Upload Image";

          return (
            <div key={sIdx} style={{ marginBottom: 16, padding: 12, border: "1px solid var(--border)", borderRadius: 6 }}>
              {/* Slide header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: 12, fontWeight: 600 }}>
                <span>Slide #{sIdx + 1}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => moveHeroSlide(sIdx, -1)} disabled={sIdx === 0}>↑</button>
                  <button className="btn btn-sm" onClick={() => moveHeroSlide(sIdx, 1)} disabled={sIdx === heroSlidesData.length - 1}>↓</button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeHeroSlide(sIdx)}>Remove</button>
                </div>
              </div>

              {/* Media Type Toggle — Image or Video, not both */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "6px 10px", background: "var(--bg2)", borderRadius: 6 }}>
                <span style={{ fontSize: 11, color: "var(--text3)", marginRight: 4 }}>Media Type:</span>
                <button
                  className={`btn btn-sm${mediaType === "image" ? " btn-accent" : ""}`}
                  onClick={() => switchSlideMediaType(sIdx, "image")}
                  style={{ minWidth: 70 }}
                >
                  📷 Image
                </button>
                <button
                  className={`btn btn-sm${mediaType === "video" ? " btn-accent" : ""}`}
                  onClick={() => switchSlideMediaType(sIdx, "video")}
                  style={{ minWidth: 70 }}
                >
                  🎬 Video
                </button>
                <span style={{ fontSize: 10, color: "var(--text3)" }}>
                  {mediaType === "image" ? "Upload images only for this slide" : "Upload videos (.mp4/.webm) only"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* CTA */}
                <input className="field-input" value={slide.ctaLabel || ""} onChange={(e) => updateHeroSlide(sIdx, "ctaLabel", e.target.value)} placeholder="CTA Button Label (e.g. Shop Now)" />
                <CtaLinkSelect value={slide.ctaHref || ""} onChange={(v) => updateHeroSlide(sIdx, "ctaHref", v)} placeholder="Custom CTA URL" />

                {/* Desktop media */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>DESKTOP {mediaType.toUpperCase()}</label>
                  {slide.imageUrl ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text2)" }} title={slide.imageUrl}>{slide.imageUrl.split("/").pop()}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => { deleteFromS3(slide.imageUrl); updateHeroSlide(sIdx, "imageUrl", ""); }}>✕</button>
                    </div>
                  ) : null}
                  {renderUploadBtn(`hero-${sIdx}-desktop`, () => uploadFile((url) => updateHeroSlide(sIdx, "imageUrl", url), slide.imageUrl, `hero-${sIdx}-desktop`, acceptStr), slide.imageUrl ? `Replace ${mediaType}` : uploadLabel)}
                </div>

                {/* Mobile media */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>MOBILE {mediaType.toUpperCase()} (optional)</label>
                  {slide.mobileImageUrl ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text2)" }} title={slide.mobileImageUrl}>{slide.mobileImageUrl.split("/").pop()}</span>
                      <button className="btn btn-sm btn-danger" onClick={() => { deleteFromS3(slide.mobileImageUrl); updateHeroSlide(sIdx, "mobileImageUrl", ""); }}>✕</button>
                    </div>
                  ) : null}
                  {renderUploadBtn(`hero-${sIdx}-mobile`, () => uploadFile((url) => updateHeroSlide(sIdx, "mobileImageUrl", url), slide.mobileImageUrl, `hero-${sIdx}-mobile`, acceptStr), slide.mobileImageUrl ? `Replace Mobile` : `Upload Mobile`)}
                </div>

                {/* Optional title & tag */}
                <input className="field-input" value={slide.title || ""} onChange={(e) => updateHeroSlide(sIdx, "title", e.target.value)} placeholder="Slide Title (optional)" />
                <input className="field-input" value={slide.tag || ""} onChange={(e) => updateHeroSlide(sIdx, "tag", e.target.value)} placeholder="Slide Tag / Label (optional)" />
              </div>
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>
          💡 Each slide supports either an Image or a Video — not both. Toggle the media type per slide to switch.
        </div>
      </div>

      {/* ─── Shop by Category ─── */}
      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="card-title" style={{ margin: 0 }}>Shop by Category</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ fontSize: 12 }}>
              <input type="checkbox" checked={categorySection?.is_enabled !== false} onChange={(e) => setSectionField(categorySection?.id, "is_enabled", e.target.checked)} /> Enabled
            </label>
            <button className="btn btn-sm" onClick={() => populateDefaultCategories(categorySection?.id)}>+ Load Defaults</button>
            <button className="btn btn-sm btn-accent" onClick={() => addCategoryItem(categorySection?.id)}>+ Add Category</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <input className="field-input" value={categorySection?.title || ""} onChange={(e) => setSectionField(categorySection?.id, "title", e.target.value)} placeholder="Section Title (e.g. Shop by Category)" />
          <input className="field-input" value={categorySection?.subtitle || ""} onChange={(e) => setSectionField(categorySection?.id, "subtitle", e.target.value)} placeholder="Subtitle (e.g. Discover)" />
        </div>
        {categoryItems.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8, padding: 8, background: "var(--bg)", borderRadius: 6 }}>
            No categories yet. Click "Load Defaults" or "+ Add Category".
          </div>
        )}
        {categoryItems.map((item, idx) => (
          <div key={`${item.id || "new"}-${idx}`} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px dashed var(--border)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <input className="field-input" value={item.label || ""} onChange={(e) => updateItemField(item, "label", e.target.value)} placeholder="Category Name" />
              <div>
                <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, display: "block", marginBottom: 3 }}>TARGET PAGE</label>
                <CtaLinkSelect value={item.target_url || ""} onChange={(v) => updateItemField(item, "target_url", v)} placeholder="Custom URL (/shop/...)" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <input className="field-input" value={item.image_url || ""} onChange={(e) => updateItemField(item, "image_url", e.target.value)} placeholder="Poster Image URL" />
              {renderUploadBtn(`cat-${item.id}-img`, () => uploadFile((url) => updateItemField(item, "image_url", url), item.image_url, `cat-${item.id}-img`, "image/*"), "Upload Photo")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
              <input className="field-input" value={item.video_url || ""} onChange={(e) => updateItemField(item, "video_url", e.target.value)} placeholder="Hover Video URL (optional)" />
              {item.video_url && (
                <button className="btn btn-sm btn-danger" onClick={() => { deleteFromS3(item.video_url); updateItemField(item, "video_url", ""); }}>Remove Video</button>
              )}
              {renderUploadBtn(`cat-${item.id}-vid`, () => uploadFile((url) => updateItemField(item, "video_url", url), item.video_url, `cat-${item.id}-vid`, "video/mp4,video/webm"), "Upload Video")}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button className="btn btn-sm" onClick={() => shiftItem(categorySection.id, idx, -1)} disabled={idx === 0}>↑</button>
              <button className="btn btn-sm" onClick={() => shiftItem(categorySection.id, idx, 1)} disabled={idx === categoryItems.length - 1}>↓</button>
              <button className="btn btn-sm btn-danger" onClick={() => removeItem(item)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Product Sections (New Arrivals, Best Sellers, Featured) ─── */}
      {PRODUCT_SECTION_KEYS.map((key) => {
        const section = bySectionKey[key];
        if (!section) return null;
        const sectionItems = getItems(section.id);
        const isEnabled = section.is_enabled !== false;

        return (
          <div className="card card-pad" key={key} style={{ marginBottom: 16, opacity: isEnabled ? 1 : 0.7 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="card-title" style={{ margin: 0 }}>{section.title || key}</div>
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setSectionField(section.id, "is_enabled", e.target.checked)}
                />
                {isEnabled ? "Enabled" : "Disabled"}
              </label>
            </div>

            {!isEnabled && (
              <div style={{ fontSize: 11, color: "var(--text3)", padding: "6px 8px", background: "var(--bg2)", borderRadius: 4, marginBottom: 8 }}>
                This section is hidden on the storefront. Enable it to show it to customers.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, paddingBottom: 12, borderBottom: "1px dashed var(--border)" }}>
              <input className="field-input" value={section.title || ""} onChange={(e) => setSectionField(section.id, "title", e.target.value)} placeholder="Section Title" />
              <input className="field-input" value={section.subtitle || ""} onChange={(e) => setSectionField(section.id, "subtitle", e.target.value)} placeholder="Subtitle / Tag" />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8, marginTop: 4 }}>
              <select className="field-input" defaultValue="">
                <option value="" disabled>Select product to add</option>
                {groupedProducts.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.id})</option>)}
              </select>
              <button
                className="btn btn-sm"
                onClick={(e) => {
                  const sel = e.currentTarget.previousSibling;
                  if (sel && sel.value) { addProductItem(section.id, sel.value); sel.value = ""; }
                }}
              >
                Add Product
              </button>
            </div>

            {sectionItems.length === 0 && (
              <div style={{ fontSize: 11, color: "var(--text3)", padding: 6 }}>No products added yet.</div>
            )}

            {sectionItems.map((item, idx) => (
              <div key={`${item.id || "new"}-${idx}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <select className="field-input" value={item.product_id || ""} onChange={(e) => updateItemField(item, "product_id", parseInt(e.target.value, 10))}>
                  <option value="">— Select product —</option>
                  {groupedProducts.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.id})</option>)}
                </select>
                <button className="btn btn-sm" onClick={() => shiftItem(section.id, idx, -1)} disabled={idx === 0}>↑</button>
                <button className="btn btn-sm" onClick={() => shiftItem(section.id, idx, 1)} disabled={idx === sectionItems.length - 1}>↓</button>
                <button className="btn btn-sm btn-danger" onClick={() => removeItem(item)}>✕</button>
              </div>
            ))}
          </div>
        );
      })}

      {/* ─── About Us Banner ─── */}
      {!aboutUsSection ? (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="card-title">About Us Banner</div>
          <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>This section is being set up automatically.</p>
          <button className="btn btn-sm" onClick={load} style={{ fontSize: 11 }}>Reload to activate</button>
        </div>
      ) : (
        <div className="card card-pad" style={{ marginBottom: 16, opacity: aboutUsSection.is_enabled === false ? 0.7 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>About Us Banner</div>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={aboutUsSection.is_enabled !== false} onChange={(e) => setSectionField(aboutUsSection.id, "is_enabled", e.target.checked)} />
              {aboutUsSection.is_enabled !== false ? "Enabled" : "Disabled"}
            </label>
          </div>
          {aboutUsSection.is_enabled === false && (
            <div style={{ fontSize: 11, color: "var(--text3)", padding: "6px 8px", background: "var(--bg2)", borderRadius: 4, marginBottom: 8 }}>
              This banner is hidden on the storefront.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input className="field-input" value={aboutUsSection.title || ""} onChange={(e) => setSectionField(aboutUsSection.id, "title", e.target.value)} placeholder="Banner Title (e.g. Our Story)" />
            <input className="field-input" value={aboutUsSection.subtitle || ""} onChange={(e) => setSectionField(aboutUsSection.id, "subtitle", e.target.value)} placeholder="Subtitle / Tag" />
          </div>
          <textarea
            className="field-input"
            rows={2}
            value={rawAboutSettings.description || ""}
            onChange={(e) => updateAboutField("description", e.target.value)}
            placeholder="Short description shown on the banner (optional)"
            style={{ resize: "vertical", marginBottom: 12, width: "100%", boxSizing: "border-box" }}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input className="field-input" value={rawAboutSettings.ctaLabel || ""} onChange={(e) => updateAboutField("ctaLabel", e.target.value)} placeholder="CTA Button Label (e.g. Learn More)" />
            <div>
              <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, display: "block", marginBottom: 3 }}>CTA PAGE</label>
              <CtaLinkSelect value={rawAboutSettings.ctaHref || ""} onChange={(v) => updateAboutField("ctaHref", v)} placeholder="Custom CTA URL" />
            </div>
          </div>

          {/* ── Banner Design (color-based, no image needed) ── */}
          <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: "var(--text2)" }}>Banner Design — used when no image is uploaded</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, display: "block", marginBottom: 4 }}>BACKGROUND COLOR</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={rawAboutSettings.bgColor || "#f6f5f3"}
                    onChange={(e) => updateAboutField("bgColor", e.target.value)}
                    style={{ width: 44, height: 34, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", padding: 2 }}
                  />
                  <input
                    className="field-input"
                    value={rawAboutSettings.bgColor || "#f6f5f3"}
                    onChange={(e) => updateAboutField("bgColor", e.target.value)}
                    placeholder="#f6f5f3"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, display: "block", marginBottom: 4 }}>TEXT COLOR</label>
                <select className="field-input" value={rawAboutSettings.textTheme || "dark"} onChange={(e) => updateAboutField("textTheme", e.target.value)}>
                  <option value="dark">Dark text (black) — for light backgrounds</option>
                  <option value="light">Light text (white) — for dark backgrounds</option>
                </select>
              </div>
            </div>
            {/* Mini live preview */}
            <div style={{ marginTop: 10, borderRadius: 4, overflow: "hidden", height: 80, background: rawAboutSettings.bgColor || "#f6f5f3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              {aboutUsSection.subtitle && <span style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: rawAboutSettings.textTheme === "light" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)" }}>{aboutUsSection.subtitle}</span>}
              <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", color: rawAboutSettings.textTheme === "light" ? "#fff" : "#000" }}>{aboutUsSection.title || "Banner Title"}</span>
              {rawAboutSettings.description && <span style={{ fontSize: 9, color: rawAboutSettings.textTheme === "light" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)" }}>{rawAboutSettings.description.slice(0, 60)}{rawAboutSettings.description.length > 60 ? "…" : ""}</span>}
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6 }}>↑ Live preview · Upload an image below to use it instead of this color background</div>
          </div>

          {/* Desktop banner image (optional) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>DESKTOP IMAGE / VIDEO <span style={{ fontWeight: 400 }}>(optional — overrides color background)</span></label>
              {rawAboutSettings.imageUrl && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rawAboutSettings.imageUrl.split("/").pop()}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => { deleteFromS3(rawAboutSettings.imageUrl); updateAboutField("imageUrl", ""); }}>✕ Remove</button>
                </div>
              )}
            </div>
            {renderUploadBtn("about-desktop", () => uploadFile((url) => updateAboutField("imageUrl", url), rawAboutSettings.imageUrl, "about-desktop", "image/*,video/mp4,video/webm"), rawAboutSettings.imageUrl ? "Replace" : "Upload Image/Video")}
          </div>

          {/* Mobile banner image (optional) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>MOBILE IMAGE / VIDEO <span style={{ fontWeight: 400 }}>(optional)</span></label>
              {rawAboutSettings.mobileImageUrl && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rawAboutSettings.mobileImageUrl.split("/").pop()}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => { deleteFromS3(rawAboutSettings.mobileImageUrl); updateAboutField("mobileImageUrl", ""); }}>✕ Remove</button>
                </div>
              )}
            </div>
            {renderUploadBtn("about-mobile", () => uploadFile((url) => updateAboutField("mobileImageUrl", url), rawAboutSettings.mobileImageUrl, "about-mobile", "image/*,video/mp4,video/webm"), rawAboutSettings.mobileImageUrl ? "Replace Mobile" : "Upload Mobile")}
          </div>
        </div>
      )}

      {/* ─── Testimonials Banner ─── */}
      {!testimonialsSection ? (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <div className="card-title">Testimonials Banner</div>
          <p style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>This section is being set up automatically.</p>
          <button className="btn btn-sm" onClick={load} style={{ fontSize: 11 }}>Reload to activate</button>
        </div>
      ) : (
        <div className="card card-pad" style={{ marginBottom: 16, opacity: testimonialsSection.is_enabled === false ? 0.7 : 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>Testimonials Banner</div>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={testimonialsSection.is_enabled !== false} onChange={(e) => setSectionField(testimonialsSection.id, "is_enabled", e.target.checked)} />
              {testimonialsSection.is_enabled !== false ? "Enabled" : "Disabled"}
            </label>
          </div>
          {testimonialsSection.is_enabled === false && (
            <div style={{ fontSize: 11, color: "var(--text3)", padding: "6px 8px", background: "var(--bg2)", borderRadius: 4, marginBottom: 8 }}>
              This banner is hidden on the storefront.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input className="field-input" value={testimonialsSection.title || ""} onChange={(e) => setSectionField(testimonialsSection.id, "title", e.target.value)} placeholder="Section Title (e.g. What Parents Say)" />
            <input className="field-input" value={testimonialsSection.subtitle || ""} onChange={(e) => setSectionField(testimonialsSection.id, "subtitle", e.target.value)} placeholder="Subtitle (e.g. Reviews)" />
          </div>
          <textarea
            className="field-input"
            rows={2}
            value={rawTestimonialsSettings.description || ""}
            onChange={(e) => updateTestimonialsField("description", e.target.value)}
            placeholder="Optional text shown on the banner"
            style={{ resize: "vertical", marginBottom: 12, width: "100%", boxSizing: "border-box" }}
          />

          {/* ── Banner Design (color-based, no image needed) ── */}
          <div style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 10, color: "var(--text2)" }}>Banner Design — used when no image is uploaded</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, display: "block", marginBottom: 4 }}>BACKGROUND COLOR</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={rawTestimonialsSettings.bgColor || "#f6f5f3"}
                    onChange={(e) => updateTestimonialsField("bgColor", e.target.value)}
                    style={{ width: 44, height: 34, border: "1px solid var(--border)", borderRadius: 4, cursor: "pointer", padding: 2 }}
                  />
                  <input
                    className="field-input"
                    value={rawTestimonialsSettings.bgColor || "#f6f5f3"}
                    onChange={(e) => updateTestimonialsField("bgColor", e.target.value)}
                    placeholder="#f6f5f3"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600, display: "block", marginBottom: 4 }}>TEXT COLOR</label>
                <select className="field-input" value={rawTestimonialsSettings.textTheme || "dark"} onChange={(e) => updateTestimonialsField("textTheme", e.target.value)}>
                  <option value="dark">Dark text (black) — for light backgrounds</option>
                  <option value="light">Light text (white) — for dark backgrounds</option>
                </select>
              </div>
            </div>
            {/* Mini live preview */}
            <div style={{ marginTop: 10, borderRadius: 4, overflow: "hidden", height: 80, background: rawTestimonialsSettings.bgColor || "#f6f5f3", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 }}>
              {testimonialsSection.subtitle && <span style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: rawTestimonialsSettings.textTheme === "light" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)" }}>{testimonialsSection.subtitle}</span>}
              <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", color: rawTestimonialsSettings.textTheme === "light" ? "#fff" : "#000" }}>{testimonialsSection.title || "What Parents Say"}</span>
              {rawTestimonialsSettings.description && <span style={{ fontSize: 9, color: rawTestimonialsSettings.textTheme === "light" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.5)" }}>{rawTestimonialsSettings.description.slice(0, 60)}{rawTestimonialsSettings.description.length > 60 ? "…" : ""}</span>}
            </div>
            <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6 }}>↑ Live preview · Upload an image below to use it instead of this color background</div>
          </div>

          {/* Desktop banner image (optional) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>DESKTOP IMAGE / VIDEO <span style={{ fontWeight: 400 }}>(optional — overrides color background)</span></label>
              {rawTestimonialsSettings.imageUrl && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rawTestimonialsSettings.imageUrl.split("/").pop()}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => { deleteFromS3(rawTestimonialsSettings.imageUrl); updateTestimonialsField("imageUrl", ""); }}>✕ Remove</button>
                </div>
              )}
            </div>
            {renderUploadBtn("testimonials-desktop", () => uploadFile((url) => updateTestimonialsField("imageUrl", url), rawTestimonialsSettings.imageUrl, "testimonials-desktop", "image/*,video/mp4,video/webm"), rawTestimonialsSettings.imageUrl ? "Replace" : "Upload Image/Video")}
          </div>
          {/* Mobile banner image (optional) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>MOBILE IMAGE / VIDEO <span style={{ fontWeight: 400 }}>(optional)</span></label>
              {rawTestimonialsSettings.mobileImageUrl && (
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rawTestimonialsSettings.mobileImageUrl.split("/").pop()}</span>
                  <button className="btn btn-sm btn-danger" onClick={() => { deleteFromS3(rawTestimonialsSettings.mobileImageUrl); updateTestimonialsField("mobileImageUrl", ""); }}>✕ Remove</button>
                </div>
              )}
            </div>
            {renderUploadBtn("testimonials-mobile", () => uploadFile((url) => updateTestimonialsField("mobileImageUrl", url), rawTestimonialsSettings.mobileImageUrl, "testimonials-mobile", "image/*,video/mp4,video/webm"), rawTestimonialsSettings.mobileImageUrl ? "Replace Mobile" : "Upload Mobile")}
          </div>
        </div>
      )}

      {/* ─── Validation Errors ─── */}
      {validationErrors.length > 0 && (
        <div className="alert alert-red" style={{ marginBottom: 16 }}>
          <div className="alert-msg">
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>Fix before publishing:</div>
            {validationErrors.map((err, i) => (
              <div key={i} style={{ fontSize: 12 }}>• {err}</div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Version History ─── */}
      <div className="card card-pad">
        <div className="card-title">Version History</div>
        {(history || []).map((h) => (
          <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 12 }}>
              v{h.version} · {h.title} · <strong>{h.status}</strong>
              {h.published_at ? ` · ${new Date(h.published_at).toLocaleString()}` : ""}
            </div>
            <button className="btn btn-sm" onClick={() => rollback(h.id)}>Rollback as Draft</button>
          </div>
        ))}
      </div>
    </div>
  );
}
