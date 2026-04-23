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

function CtaLinkSelect({ value, onChange }) {
  const presetValues = CTA_OPTIONS.filter(o => o.value && o.value !== "__custom__").map(o => o.value);
  const [useCustom, setUseCustom] = useState(!!value && !presetValues.includes(value));
  const handleSelect = (v) => {
    if (v === "__custom__") { setUseCustom(true); }
    else { setUseCustom(false); onChange(v); }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <select className="field-input" value={useCustom ? "__custom__" : (value || "")} onChange={e => handleSelect(e.target.value)}>
        {CTA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {useCustom && (
        <input className="field-input" value={value || ""} onChange={e => onChange(e.target.value)} placeholder="e.g. /shop/sale" style={{ fontSize: 12, borderColor: "var(--blue)" }} />
      )}
    </div>
  );
}

function MediaSlot({ label, url, progressKey, uploadProgress, onUpload, onRemove, optional }) {
  const p = uploadProgress[progressKey];
  const filename = url ? url.split("/").pop() : null;
  const isVid = isVideoUrl(url);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div className="field-label">
        {label}
        {optional && <span style={{ fontWeight: 400, opacity: 0.5, marginLeft: 4 }}>(optional)</span>}
      </div>
      {filename && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", background: "var(--bg4)", borderRadius: 8, border: "1px solid var(--border)" }}>
          {!isVid
            ? <img src={url} alt="" style={{ width: 38, height: 38, objectFit: "cover", borderRadius: 6, flexShrink: 0, background: "var(--bg5)" }} onError={e => { e.target.style.display = "none"; }} />
            : <div style={{ width: 38, height: 38, borderRadius: 6, background: "var(--bg5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>▶</div>
          }
          <span style={{ flex: 1, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text2)" }}>{filename}</span>
          <button className="btn btn-sm btn-danger" onClick={onRemove} style={{ flexShrink: 0, padding: "3px 9px" }}>✕</button>
        </div>
      )}
      {p !== undefined ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
          <div style={{ flex: 1, height: 3, background: "var(--bg5)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${p}%`, height: "100%", background: "var(--blue)", borderRadius: 2, transition: "width 0.15s" }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--blue)", fontWeight: 700, minWidth: 34, textAlign: "right" }}>{p}%</span>
        </div>
      ) : (
        <button className="btn btn-sm" onClick={onUpload} style={{ alignSelf: "flex-start" }}>
          {filename ? "Replace" : "Upload"}
        </button>
      )}
    </div>
  );
}

function Panel({ label, badge, summary, section, isOpen, onToggle, onShiftUp, onShiftDown, canMoveUp, canMoveDown, setSectionField, children }) {
  const enabled = !section || section.is_enabled !== false;
  return (
    <div className={`hp-panel${isOpen ? " is-open" : ""}${section && !enabled ? " is-off" : ""}`}>
      <div className="hp-panel-header" onClick={onToggle}>
        <div className="hp-reorder" onClick={e => e.stopPropagation()}>
          <button className="hp-reorder-btn" disabled={!canMoveUp} onClick={onShiftUp} title="Move section up" aria-label="Move up">▲</button>
          <button className="hp-reorder-btn" disabled={!canMoveDown} onClick={onShiftDown} title="Move section down" aria-label="Move down">▼</button>
        </div>
        <div className="hp-panel-info">
          {badge && <span className="hp-panel-type">{badge}</span>}
          <span className="hp-panel-title">{label}</span>
          {summary && <span className="hp-panel-summary">{summary}</span>}
        </div>
        {section && (
          <label
            className="hp-live"
            onClick={e => e.stopPropagation()}
            title={enabled ? "Click to disable this section" : "Click to make this section live"}
          >
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setSectionField(section.id, "is_enabled", e.target.checked)}
            />
            <span className="hp-live-track" aria-hidden />
            <span className="hp-live-label">{enabled ? "Live" : "Off"}</span>
          </label>
        )}
        <span className={`hp-chev${isOpen ? " is-open" : ""}`}>▾</span>
      </div>
      {isOpen && <div className="hp-panel-body">{children}</div>}
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
  const [openSections, setOpenSections] = useState(new Set(["hero_banner"]));
  const [showHistory, setShowHistory] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [toasts, setToasts] = useState([]);

  const showToast = (msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const togglePanel = (key) => setOpenSections(prev => {
    const n = new Set(prev);
    n.has(key) ? n.delete(key) : n.add(key);
    return n;
  });

  const groupedProducts = useMemo(() => (Array.isArray(products) ? products : []).map(p => ({ id: p.id, title: p.title || `Product #${p.id}` })), [products]);

  const bySectionKey = useMemo(() => {
    const map = {};
    for (const s of sections) map[s.section_key] = s;
    return map;
  }, [sections]);

  const getItems = (sectionId) => items.filter(i => i.section_id === sectionId).sort((a, b) => a.display_order - b.display_order);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [cfg, prod] = await Promise.all([safeFetch("/api/admin/homepage-config/current"), safeFetch("/api/admin/products")]);
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

  const setSectionField = (id, key, value) => setSections(prev => prev.map(s => s.id === id ? { ...s, [key]: value } : s));

  const shiftSection = (index, direction) => {
    const sorted = [...sections].sort((a, b) => a.display_order - b.display_order);
    const to = index + direction;
    if (to < 0 || to >= sorted.length) return;
    const [left, right] = [sorted[index], sorted[to]];
    setSections(prev => prev.map(s => {
      if (s.id === left.id) return { ...s, display_order: right.display_order };
      if (s.id === right.id) return { ...s, display_order: left.display_order };
      return s;
    }));
  };

  const shiftItem = (sectionId, index, direction) => {
    const si = getItems(sectionId);
    const to = index + direction;
    if (to < 0 || to >= si.length) return;
    const [left, right] = [si[index], si[to]];
    setItems(prev => prev.map(it => {
      if (it.id === left.id) return { ...it, display_order: right.display_order };
      if (it.id === right.id) return { ...it, display_order: left.display_order };
      return it;
    }));
  };

  const addProductItem = (sectionId, productId) => {
    setItems(prev => [...prev, { section_id: sectionId, item_type: "product", display_order: getItems(sectionId).length + 1, product_id: parseInt(productId, 10), label: "", target_url: "", image_url: "", settings_json: {} }]);
  };

  const addCategoryItem = (sectionId) => {
    if (!sectionId) return;
    setItems(prev => [...prev, { section_id: sectionId, item_type: "category", display_order: getItems(sectionId).length + 1, label: "New Category", target_url: "/shop", image_url: "", video_url: "", settings_json: {} }]);
  };

  const populateDefaultCategories = (sectionId) => {
    if (!sectionId) return;
    const defaults = [
      { label: "Dress", target_url: "/shop/kids-girl/dresses", image_url: "/images/Dress.png" },
      { label: "Shorts", target_url: "/shop/kids-girl/shorts-skirts-skorts", image_url: "/images/shorts.jpg" },
      { label: "Infants", target_url: "/shop/baby-boy/onesies-rompers", image_url: "/images/infant.png" },
      { label: "Clothing Sets", target_url: "/shop/baby-girl/clothing-sets", image_url: "/images/clothing set.png" },
    ];
    const offset = getItems(sectionId).length;
    setItems(prev => [...prev, ...defaults.map((c, i) => ({ section_id: sectionId, item_type: "category", display_order: offset + i + 1, label: c.label, target_url: c.target_url, image_url: c.image_url, video_url: "", settings_json: {} }))]);
  };

  const removeItem = (target) => {
    const si = getItems(target.section_id);
    const filtered = items.filter(it => !(it.id && target.id ? it.id === target.id : it.section_id === target.section_id && it.display_order === target.display_order));
    const remapped = filtered.map(it => {
      if (it.section_id !== target.section_id) return it;
      const order = si.filter(x => !(x.id && target.id ? x.id === target.id : x.display_order === target.display_order)).findIndex(x => (x.id && it.id ? x.id === it.id : x.display_order === it.display_order));
      return { ...it, display_order: order + 1 };
    });
    setItems(remapped);
  };

  const updateItemField = (target, key, value) => setItems(prev => prev.map(it => (target.id && it.id === target.id) || (!target.id && it.section_id === target.section_id && it.display_order === target.display_order) ? { ...it, [key]: value } : it));

  const validateBeforePublish = () => {
    const errs = [];
    const sm = {};
    sections.forEach(s => { sm[s.section_key] = s; });
    const hero = sm.hero_banner;
    const hs = typeof hero?.settings_json === "string" ? JSON.parse(hero.settings_json || "{}") : (hero?.settings_json || {});
    if (hero?.is_enabled !== false) {
      const slides = hs?.slides || [];
      if (!slides.length) errs.push("Hero Banner: Add at least one slide.");
      slides.forEach((sl, i) => { if (!sl.imageUrl && !sl.mobileImageUrl) errs.push(`Hero Slide #${i + 1}: Upload an image or video.`); });
    }
    const cat = sm.shop_by_category;
    if (cat?.is_enabled !== false) {
      const ci = getItems(cat?.id || -1);
      if (!ci.length) errs.push("Shop by Category: Add at least one category.");
      ci.forEach((item, i) => {
        if (!item.label) errs.push(`Category #${i + 1}: Name required.`);
        if (!item.target_url) errs.push(`Category #${i + 1}: Link required.`);
        if (!item.image_url) errs.push(`Category #${i + 1}: Image required.`);
      });
    }
    PRODUCT_SECTION_KEYS.forEach(key => {
      const sec = sm[key];
      if (!sec || sec.is_enabled === false) return;
      const si = getItems(sec.id);
      if (!si.length) errs.push(`${sec.title || key}: Add at least one product.`);
      si.forEach((it, i) => { if (!it.product_id) errs.push(`${sec.title || key} #${i + 1}: Select a product.`); });
    });
    setValidationErrors(errs);
    return errs.length === 0;
  };

  const deleteFromS3 = (url) => {
    if (!url || !url.includes(".amazonaws.com/")) return;
    const token = localStorage.getItem("adminToken");
    if (!token) return;
    const base = process.env.NEXT_PUBLIC_API_URL || "https://vbaumdstnz.ap-south-1.awsapprunner.com";
    fetch(`${base}/api/upload`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ imageUrl: url }) }).catch(() => {});
  };

  const uploadFile = async (onDone, oldUrl, progressKey, accept = "image/*,video/mp4,video/webm", label = "File") => {
    if (oldUrl?.includes(".amazonaws.com/")) deleteFromS3(oldUrl);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (progressKey) setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
      const fd = new FormData();
      fd.append("image", file);
      const token = localStorage.getItem("adminToken");
      if (!token) { alert("Not logged in."); if (progressKey) setUploadProgress(prev => { const n = { ...prev }; delete n[progressKey]; return n; }); return; }
      const base = process.env.NEXT_PUBLIC_API_URL || "https://vbaumdstnz.ap-south-1.awsapprunner.com";
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${base}/api/upload`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = e => { if (e.lengthComputable && progressKey) setUploadProgress(prev => ({ ...prev, [progressKey]: Math.round(e.loaded * 100 / e.total) })); };
      xhr.onload = () => {
        if (xhr.status === 401 || xhr.status === 403) { localStorage.removeItem("adminToken"); alert("Session expired."); setTimeout(() => { window.location.href = "/admin/login"; }, 1200); return; }
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.imageUrl) {
            onDone(data.imageUrl);
            showToast(`${label} uploaded successfully`);
          } else {
            showToast(data.error || `Upload failed (${xhr.status})`, "error");
          }
        } catch { alert(`Upload failed (${xhr.status})`); }
        if (progressKey) setUploadProgress(prev => { const n = { ...prev }; delete n[progressKey]; return n; });
      };
      xhr.onerror = () => { showToast("Network error during upload", "error"); if (progressKey) setUploadProgress(prev => { const n = { ...prev }; delete n[progressKey]; return n; }); };
      xhr.send(fd);
    };
    input.click();
  };

  const saveDraft = async (silent = false) => {
    if (!config?.id) return;
    setSaving(true);
    if (!silent) setSaveMsg("");
    try {
      const ns = sections.map(s => ({ ...s, settings_json: typeof s.settings_json === "string" ? JSON.parse(s.settings_json || "{}") : (s.settings_json || {}) }));
      const ni = items.map(i => ({ ...i, settings_json: typeof i.settings_json === "string" ? JSON.parse(i.settings_json || "{}") : (i.settings_json || {}) }));
      await safeFetch(`/api/admin/homepage-config/draft/${config.id}`, { method: "PUT", body: JSON.stringify({ sections: ns, items: ni }) });
      await load();
      if (!silent) {
        setSaveMsg("Saved");
        setTimeout(() => setSaveMsg(""), 2500);
        showToast("Draft saved");
      }
    } catch (e) { showToast(e.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const publish = async () => {
    if (!config?.id || !validateBeforePublish()) return;
    setPublishing(true);
    try {
      await saveDraft(true);
      await safeFetch(`/api/admin/homepage-config/draft/${config.id}/publish`, { method: "POST", body: JSON.stringify({ publish_at: publishAt ? new Date(publishAt).toISOString() : null }) });
      await load();
      setSaveMsg("Published");
      setTimeout(() => setSaveMsg(""), 4000);
      showToast("Homepage published successfully!", "success");
    } catch (e) { showToast(e.message || "Publish failed", "error"); }
    finally { setPublishing(false); }
  };

  const rollback = async (id) => {
    if (!confirm("Create a rollback draft from this version?")) return;
    try {
      await safeFetch(`/api/admin/homepage-config/rollback/${id}`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch (e) { alert(e.message || "Rollback failed"); }
  };

  const createDraft = async () => {
    try {
      await safeFetch("/api/admin/homepage-config/draft", { method: "POST", body: JSON.stringify({ title: "Homepage Draft" }) });
      await load();
    } catch (e) { alert(e.message || "Failed to create draft"); }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, gap: 12 }}>
      <div style={{ width: 18, height: 18, border: "2px solid var(--border)", borderTopColor: "var(--text)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <span style={{ color: "var(--text3)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading editor…</span>
    </div>
  );

  if (!config) return (
    <div style={{ maxWidth: 460, margin: "80px auto", padding: 32, textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>📄</div>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Homepage Draft</div>
      <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 28, lineHeight: 1.6 }}>Create a draft to start editing your homepage content and sections.</div>
      <button className="btn btn-accent" onClick={createDraft} style={{ width: "100%", padding: "12px 0", fontSize: 14 }}>Create Homepage Draft</button>
      {error && <div style={{ marginTop: 14, color: "var(--red)", fontSize: 12 }}>{error}</div>}
    </div>
  );

  // ── Derived state ──────────────────────────────────────────────────────────
  const hero = bySectionKey.hero_banner;
  const rawHeroSettings = typeof hero?.settings_json === "string" ? JSON.parse(hero.settings_json || "{}") : (hero?.settings_json || {});
  let heroSlidesData = rawHeroSettings.slides || [];
  if (!heroSlidesData.length && (rawHeroSettings.imageUrl || rawHeroSettings.ctaLabel)) {
    heroSlidesData = [{ imageUrl: rawHeroSettings.imageUrl || "", mobileImageUrl: rawHeroSettings.mobileImageUrl || "", ctaLabel: rawHeroSettings.ctaLabel || "", ctaHref: rawHeroSettings.ctaHref || "" }];
  }

  const updateHeroSlide = (index, key, value) => {
    const slides = [...heroSlidesData];
    slides[index] = { ...slides[index], [key]: value };
    setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides });
  };

  const addHeroSlide = () => setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides: [...heroSlidesData, { imageUrl: "", mobileImageUrl: "", ctaLabel: "", ctaHref: "", title: "", tag: "", mediaType: "image" }] });

  const removeHeroSlide = (index) => setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides: heroSlidesData.filter((_, i) => i !== index) });

  const moveHeroSlide = (index, dir) => {
    const slides = [...heroSlidesData];
    const to = index + dir;
    if (to < 0 || to >= slides.length) return;
    [slides[index], slides[to]] = [slides[to], slides[index]];
    setSectionField(hero.id, "settings_json", { ...rawHeroSettings, slides });
  };

  const getSlideMediaType = (slide) => (isVideoUrl(slide?.imageUrl) || isVideoUrl(slide?.mobileImageUrl)) ? "video" : (slide?.mediaType || "image");

  const switchSlideMediaType = (index, newType) => {
    const slide = heroSlidesData[index];
    const cur = getSlideMediaType(slide);
    if (cur === newType) return;
    if ((slide.imageUrl || slide.mobileImageUrl) && !confirm(`Switch to ${newType}? Current media will be cleared.`)) return;
    updateHeroSlide(index, "imageUrl", "");
    updateHeroSlide(index, "mobileImageUrl", "");
    setTimeout(() => updateHeroSlide(index, "mediaType", newType), 0);
  };

  const categorySection = bySectionKey.shop_by_category;
  const categoryItems = getItems(categorySection?.id || -1);

  const aboutUsSection = bySectionKey.about_us_banner;
  const rawAbout = typeof aboutUsSection?.settings_json === "string" ? JSON.parse(aboutUsSection.settings_json || "{}") : (aboutUsSection?.settings_json || {});
  const updateAbout = (key, value) => { if (aboutUsSection?.id) setSectionField(aboutUsSection.id, "settings_json", { ...rawAbout, [key]: value }); };

  const testimonialsSection = bySectionKey.testimonials;
  const rawTestimonials = typeof testimonialsSection?.settings_json === "string" ? JSON.parse(testimonialsSection.settings_json || "{}") : (testimonialsSection?.settings_json || {});
  const updateTestimonials = (key, value) => { if (testimonialsSection?.id) setSectionField(testimonialsSection.id, "settings_json", { ...rawTestimonials, [key]: value }); };

  const isBusy = saving || publishing || Object.keys(uploadProgress).length > 0;
  const sortedSections = [...sections].sort((a, b) => a.display_order - b.display_order);

  // ── Shared banner editor (About Us / Testimonials) ─────────────────────────
  const renderPlainBannerEditor = (sec, rawSettings, updateField, idPrefix) => {
    if (!sec) return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
        Section loading… <button className="btn btn-sm" onClick={load} style={{ marginLeft: 8 }}>Reload</button>
      </div>
    );
    const mType = (isVideoUrl(rawSettings.imageUrl) || isVideoUrl(rawSettings.mobileImageUrl)) ? "video" : (rawSettings.mediaType || "image");
    const accept = mType === "video" ? "video/mp4,video/webm" : "image/*";
    const switchMedia = (newType) => {
      if (mType === newType) return;
      if ((rawSettings.imageUrl || rawSettings.mobileImageUrl) && !confirm(`Switch to ${newType}? Media will be cleared.`)) return;
      updateField("imageUrl", ""); updateField("mobileImageUrl", "");
      setTimeout(() => updateField("mediaType", newType), 0);
    };
    return (
      <div>
        <div style={{ padding: "10px 12px", background: "var(--bg3)", borderRadius: 8, marginBottom: 16, fontSize: 11, color: "var(--text3)", lineHeight: 1.5 }}>
          This is a plain banner — only the image/video is shown on the homepage. Title, subtitle, description, and CTA are not displayed.
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "8px 12px", background: "var(--bg3)", borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: "var(--text3)", flex: 1 }}>Media Type</span>
          <button className={`btn btn-sm${mType === "image" ? " btn-accent" : ""}`} onClick={() => switchMedia("image")}>Image</button>
          <button className={`btn btn-sm${mType === "video" ? " btn-accent" : ""}`} onClick={() => switchMedia("video")}>Video</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <MediaSlot label="Desktop Banner" url={rawSettings.imageUrl} progressKey={`${idPrefix}-d`} uploadProgress={uploadProgress}
            onUpload={() => uploadFile(url => updateField("imageUrl", url), rawSettings.imageUrl, `${idPrefix}-d`, accept, "Desktop banner")}
            onRemove={() => { deleteFromS3(rawSettings.imageUrl); updateField("imageUrl", ""); }} />
          <MediaSlot label="Mobile Banner" optional url={rawSettings.mobileImageUrl} progressKey={`${idPrefix}-m`} uploadProgress={uploadProgress}
            onUpload={() => uploadFile(url => updateField("mobileImageUrl", url), rawSettings.mobileImageUrl, `${idPrefix}-m`, accept, "Mobile banner")}
            onRemove={() => { deleteFromS3(rawSettings.mobileImageUrl); updateField("mobileImageUrl", ""); }} />
        </div>
      </div>
    );
  };

  const renderBannerEditor = (sec, rawSettings, updateField, idPrefix) => {
    if (!sec) return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>
        Section loading… <button className="btn btn-sm" onClick={load} style={{ marginLeft: 8 }}>Reload</button>
      </div>
    );
    const mType = (isVideoUrl(rawSettings.imageUrl) || isVideoUrl(rawSettings.mobileImageUrl)) ? "video" : (rawSettings.mediaType || "image");
    const accept = mType === "video" ? "video/mp4,video/webm" : "image/*";
    const switchMedia = (newType) => {
      if (mType === newType) return;
      if ((rawSettings.imageUrl || rawSettings.mobileImageUrl) && !confirm(`Switch to ${newType}? Media will be cleared.`)) return;
      updateField("imageUrl", ""); updateField("mobileImageUrl", "");
      setTimeout(() => updateField("mediaType", newType), 0);
    };
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          <div><div className="field-label">Title</div><input className="field-input" value={sec.title || ""} onChange={e => setSectionField(sec.id, "title", e.target.value)} placeholder="e.g. Our Story" /></div>
          <div><div className="field-label">Tag / Subtitle</div><input className="field-input" value={sec.subtitle || ""} onChange={e => setSectionField(sec.id, "subtitle", e.target.value)} placeholder="e.g. About Us" /></div>
          <div><div className="field-label">CTA Button Text</div><input className="field-input" value={rawSettings.ctaLabel || rawSettings.ctaText || ""} onChange={e => updateField("ctaLabel", e.target.value)} placeholder="e.g. Learn More" /></div>
          <div><div className="field-label">CTA Link</div><CtaLinkSelect value={rawSettings.ctaHref || ""} onChange={v => updateField("ctaHref", v)} /></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="field-label">Description</div>
          <textarea className="field-input" rows={2} value={rawSettings.description || ""} onChange={e => updateField("description", e.target.value)} placeholder="Short text shown over the banner (optional)" />
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "8px 12px", background: "var(--bg3)", borderRadius: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: "var(--text3)", flex: 1 }}>Media Type</span>
          <button className={`btn btn-sm${mType === "image" ? " btn-accent" : ""}`} onClick={() => switchMedia("image")}>Image</button>
          <button className={`btn btn-sm${mType === "video" ? " btn-accent" : ""}`} onClick={() => switchMedia("video")}>Video</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <MediaSlot label="Desktop Banner" url={rawSettings.imageUrl} progressKey={`${idPrefix}-d`} uploadProgress={uploadProgress}
            onUpload={() => uploadFile(url => updateField("imageUrl", url), rawSettings.imageUrl, `${idPrefix}-d`, accept, "Desktop banner")}
            onRemove={() => { deleteFromS3(rawSettings.imageUrl); updateField("imageUrl", ""); }} />
          <MediaSlot label="Mobile Banner" optional url={rawSettings.mobileImageUrl} progressKey={`${idPrefix}-m`} uploadProgress={uploadProgress}
            onUpload={() => uploadFile(url => updateField("mobileImageUrl", url), rawSettings.mobileImageUrl, `${idPrefix}-m`, accept, "Mobile banner")}
            onRemove={() => { deleteFromS3(rawSettings.mobileImageUrl); updateField("mobileImageUrl", ""); }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0 28px 48px" }}>

      {/* ── Toast Notifications ── */}
      <div className="admin-toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`admin-toast admin-toast-${t.type}`}>
            <span className="admin-toast-icon">{t.type === "error" ? "✕" : t.type === "info" ? "ℹ" : "✓"}</span>
            <span className="admin-toast-msg">{t.msg}</span>
            <button className="admin-toast-close" onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>

      {/* ── Sticky Action Bar ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 90, display: "flex", alignItems: "center", gap: 12, padding: "12px 0 12px", marginBottom: 20, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>Homepage Editor</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 1 }}>
            v{config.version} · <span style={{ color: config.status === "published" ? "var(--green)" : "var(--amber)", fontWeight: 500 }}>{config.status}</span>
          </div>
        </div>
        {saveMsg && <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 700, letterSpacing: "0.05em" }}>✓ {saveMsg}</span>}
        {validationErrors.length > 0 && <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 600 }}>{validationErrors.length} error{validationErrors.length > 1 ? "s" : ""}</span>}
        <input type="datetime-local" className="field-input" value={publishAt} onChange={e => setPublishAt(e.target.value)} title="Schedule publish (optional)" style={{ width: 186, fontSize: 11, padding: "6px 10px" }} />
        <button className="btn btn-sm" onClick={saveDraft} disabled={isBusy} style={{ minWidth: 90 }}>{saving ? "Saving…" : "Save Draft"}</button>
        <button className="btn btn-accent btn-sm" onClick={publish} disabled={isBusy} style={{ minWidth: 80 }}>{publishing ? "Publishing…" : "Publish"}</button>
      </div>

      {/* ── Validation Errors ── */}
      {validationErrors.length > 0 && (
        <div className="alert alert-red" style={{ marginBottom: 16 }}>
          <div className="alert-msg">
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Fix before publishing:</div>
            {validationErrors.map((e, i) => <div key={i} style={{ fontSize: 11 }}>• {e}</div>)}
          </div>
          <button onClick={() => setValidationErrors([])} className="alert-close">✕</button>
        </div>
      )}

      {/* ── Section Accordion Panels ── */}
      {sortedSections.map((sec, idx) => {
        const key = sec.section_key;
        const isOpen = openSections.has(key);
        const panelProps = { section: sec, isOpen, onToggle: () => togglePanel(key), onShiftUp: () => shiftSection(idx, -1), onShiftDown: () => shiftSection(idx, 1), canMoveUp: idx > 0, canMoveDown: idx < sortedSections.length - 1, setSectionField };

        // ── Hero Banner ──────────────────────────────────────────────────────
        if (key === "hero_banner") return (
          <Panel key={key} label="Hero Banner" badge="SLIDES" summary={heroSlidesData.length ? `${heroSlidesData.length} slide${heroSlidesData.length === 1 ? "" : "s"}` : "No slides yet"} {...panelProps}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
              <div><div className="field-label">Title</div><input className="field-input" value={sec.title || ""} onChange={e => setSectionField(sec.id, "title", e.target.value)} placeholder="Hero Banner" /></div>
              <div><div className="field-label">Tag</div><input className="field-input" value={sec.subtitle || ""} onChange={e => setSectionField(sec.id, "subtitle", e.target.value)} placeholder="Tag / subtitle" /></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>{heroSlidesData.length} slide{heroSlidesData.length !== 1 ? "s" : ""}</span>
              <button className="btn btn-sm btn-accent" onClick={addHeroSlide}>+ Add Slide</button>
            </div>
            {heroSlidesData.length === 0 && (
              <div style={{ padding: 16, background: "var(--bg3)", borderRadius: 10, textAlign: "center", color: "var(--text3)", fontSize: 12 }}>No slides yet — click "+ Add Slide" to get started.</div>
            )}
            {heroSlidesData.map((slide, sIdx) => {
              const mType = getSlideMediaType(slide);
              const accept = mType === "video" ? "video/mp4,video/webm" : "image/*";
              return (
                <div key={sIdx} style={{ marginBottom: 14, padding: 16, border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)" }}>Slide {sIdx + 1}</span>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-sm" onClick={() => moveHeroSlide(sIdx, -1)} disabled={sIdx === 0}>▲</button>
                    <button className="btn btn-sm" onClick={() => moveHeroSlide(sIdx, 1)} disabled={sIdx === heroSlidesData.length - 1}>▼</button>
                    <button className="btn btn-sm btn-danger" onClick={() => removeHeroSlide(sIdx)}>Remove</button>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "7px 12px", background: "var(--bg4)", borderRadius: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, color: "var(--text3)", flex: 1 }}>Media</span>
                    <button className={`btn btn-sm${mType === "image" ? " btn-accent" : ""}`} onClick={() => switchSlideMediaType(sIdx, "image")}>Image</button>
                    <button className={`btn btn-sm${mType === "video" ? " btn-accent" : ""}`} onClick={() => switchSlideMediaType(sIdx, "video")}>Video</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                    <MediaSlot label="Desktop" url={slide.imageUrl} progressKey={`hero-${sIdx}-d`} uploadProgress={uploadProgress}
                      onUpload={() => uploadFile(url => updateHeroSlide(sIdx, "imageUrl", url), slide.imageUrl, `hero-${sIdx}-d`, accept, `Slide ${sIdx+1} desktop`)}
                      onRemove={() => { deleteFromS3(slide.imageUrl); updateHeroSlide(sIdx, "imageUrl", ""); }} />
                    <MediaSlot label="Mobile" optional url={slide.mobileImageUrl} progressKey={`hero-${sIdx}-m`} uploadProgress={uploadProgress}
                      onUpload={() => uploadFile(url => updateHeroSlide(sIdx, "mobileImageUrl", url), slide.mobileImageUrl, `hero-${sIdx}-m`, accept, `Slide ${sIdx+1} mobile`)}
                      onRemove={() => { deleteFromS3(slide.mobileImageUrl); updateHeroSlide(sIdx, "mobileImageUrl", ""); }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><div className="field-label">Slide Title</div><input className="field-input" value={slide.title || ""} onChange={e => updateHeroSlide(sIdx, "title", e.target.value)} placeholder="e.g. Spring Collection" /></div>
                    <div><div className="field-label">Tag / Label</div><input className="field-input" value={slide.tag || ""} onChange={e => updateHeroSlide(sIdx, "tag", e.target.value)} placeholder="e.g. New Arrivals" /></div>
                    <div><div className="field-label">CTA Button Text</div><input className="field-input" value={slide.ctaLabel || ""} onChange={e => updateHeroSlide(sIdx, "ctaLabel", e.target.value)} placeholder="e.g. Shop Now" /></div>
                    <div><div className="field-label">CTA Link</div><CtaLinkSelect value={slide.ctaHref || ""} onChange={v => updateHeroSlide(sIdx, "ctaHref", v)} /></div>
                  </div>
                </div>
              );
            })}
          </Panel>
        );

        // ── Shop by Category ─────────────────────────────────────────────────
        if (key === "shop_by_category") return (
          <Panel key={key} label="Shop by Category" badge="CARDS" summary={categoryItems.length ? `${categoryItems.length} categor${categoryItems.length === 1 ? "y" : "ies"}` : "No categories yet"} {...panelProps}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
              <div><div className="field-label">Title</div><input className="field-input" value={sec.title || ""} onChange={e => setSectionField(sec.id, "title", e.target.value)} placeholder="Shop by Category" /></div>
              <div><div className="field-label">Subtitle</div><input className="field-input" value={sec.subtitle || ""} onChange={e => setSectionField(sec.id, "subtitle", e.target.value)} placeholder="Discover" /></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: "var(--text2)" }}>{categoryItems.length} categor{categoryItems.length !== 1 ? "ies" : "y"}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-sm" onClick={() => populateDefaultCategories(sec.id)}>Load Defaults</button>
                <button className="btn btn-sm btn-accent" onClick={() => addCategoryItem(sec.id)}>+ Add Category</button>
              </div>
            </div>
            {categoryItems.length === 0 && <div style={{ padding: 14, background: "var(--bg3)", borderRadius: 10, textAlign: "center", color: "var(--text3)", fontSize: 12, marginBottom: 10 }}>No categories yet.</div>}
            {categoryItems.map((item, idx) => (
              <div key={`${item.id || idx}`} style={{ marginBottom: 12, padding: 14, border: "1px solid var(--border)", borderRadius: 12, background: "var(--bg3)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div><div className="field-label">Name</div><input className="field-input" value={item.label || ""} onChange={e => updateItemField(item, "label", e.target.value)} placeholder="e.g. Dresses" /></div>
                  <div><div className="field-label">Target Page</div><CtaLinkSelect value={item.target_url || ""} onChange={v => updateItemField(item, "target_url", v)} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <MediaSlot label="Category Photo" url={item.image_url} progressKey={`cat-${item.id || idx}-i`} uploadProgress={uploadProgress}
                    onUpload={() => uploadFile(url => updateItemField(item, "image_url", url), item.image_url, `cat-${item.id || idx}-i`, "image/*", `${item.label || "Category"} photo`)}
                    onRemove={() => { deleteFromS3(item.image_url); updateItemField(item, "image_url", ""); }} />
                  <MediaSlot label="Hover Video" optional url={item.video_url} progressKey={`cat-${item.id || idx}-v`} uploadProgress={uploadProgress}
                    onUpload={() => uploadFile(url => updateItemField(item, "video_url", url), item.video_url, `cat-${item.id || idx}-v`, "video/mp4,video/webm", `${item.label || "Category"} hover video`)}
                    onRemove={() => { deleteFromS3(item.video_url); updateItemField(item, "video_url", ""); }} />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                  <button className="btn btn-sm" onClick={() => shiftItem(sec.id, idx, -1)} disabled={idx === 0}>▲</button>
                  <button className="btn btn-sm" onClick={() => shiftItem(sec.id, idx, 1)} disabled={idx === categoryItems.length - 1}>▼</button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeItem(item)}>Remove</button>
                </div>
              </div>
            ))}
          </Panel>
        );

        // ── Product Sections ─────────────────────────────────────────────────
        if (PRODUCT_SECTION_KEYS.includes(key)) {
          const sectionItems = getItems(sec.id);
          return (
            <Panel key={key} label={sec.title || key} badge="PRODUCTS" summary={sectionItems.length ? `${sectionItems.length} product${sectionItems.length === 1 ? "" : "s"}` : "No products yet"} {...panelProps}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
                <div><div className="field-label">Title</div><input className="field-input" value={sec.title || ""} onChange={e => setSectionField(sec.id, "title", e.target.value)} placeholder="Section title" /></div>
                <div><div className="field-label">Subtitle</div><input className="field-input" value={sec.subtitle || ""} onChange={e => setSectionField(sec.id, "subtitle", e.target.value)} placeholder="e.g. Discover" /></div>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <select className="field-input" defaultValue="" style={{ flex: 1 }}>
                  <option value="" disabled>Select a product to add…</option>
                  {groupedProducts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
                <button className="btn btn-sm btn-accent" onClick={e => {
                  const sel = e.currentTarget.previousSibling;
                  if (sel?.value) { addProductItem(sec.id, sel.value); sel.value = ""; }
                }}>Add</button>
              </div>
              {sectionItems.length === 0 && <div style={{ padding: 12, background: "var(--bg3)", borderRadius: 10, textAlign: "center", color: "var(--text3)", fontSize: 12, marginBottom: 8 }}>No products yet.</div>}
              {sectionItems.map((item, idx) => (
                <div key={`${item.id || idx}`} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <select className="field-input" value={item.product_id || ""} onChange={e => updateItemField(item, "product_id", parseInt(e.target.value, 10))} style={{ flex: 1 }}>
                    <option value="">— Select product —</option>
                    {groupedProducts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                  <button className="btn btn-sm" onClick={() => shiftItem(sec.id, idx, -1)} disabled={idx === 0}>▲</button>
                  <button className="btn btn-sm" onClick={() => shiftItem(sec.id, idx, 1)} disabled={idx === sectionItems.length - 1}>▼</button>
                  <button className="btn btn-sm btn-danger" onClick={() => removeItem(item)}>✕</button>
                </div>
              ))}
            </Panel>
          );
        }

        // ── About Us Banner ──────────────────────────────────────────────────
        if (key === "about_us_banner") return (
          <Panel key={key} label="About Us Banner" badge="BANNER" summary={rawAbout.imageUrl || rawAbout.mobileImageUrl ? "Banner media set" : "No media yet"} {...panelProps}>
            {renderPlainBannerEditor(aboutUsSection, rawAbout, updateAbout, "about")}
          </Panel>
        );

        // ── Testimonials Banner ──────────────────────────────────────────────
        if (key === "testimonials") return (
          <Panel key={key} label="Testimonials Banner" badge="BANNER" summary={rawTestimonials.imageUrl || rawTestimonials.mobileImageUrl ? "Banner media set" : "No media yet"} {...panelProps}>
            {renderPlainBannerEditor(testimonialsSection, rawTestimonials, updateTestimonials, "test")}
          </Panel>
        );

        // ── Unknown section fallback ─────────────────────────────────────────
        return (
          <Panel key={key} label={sec.title || key} {...panelProps}>
            <div style={{ color: "var(--text3)", fontSize: 12, padding: 8 }}>No editor available for section type: <code>{key}</code></div>
          </Panel>
        );
      })}

      {/* ── Version History ── */}
      <div style={{ marginTop: 24, borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden", background: "var(--bg2)" }}>
        <div onClick={() => setShowHistory(h => !h)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", cursor: "pointer", userSelect: "none" }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 13 }}>Version History</span>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>{history.length} version{history.length !== 1 ? "s" : ""}</span>
          <span style={{ fontSize: 11, color: "var(--text3)", transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </div>
        {showHistory && (
          <div style={{ borderTop: "1px solid var(--border)", padding: "8px 16px" }}>
            {history.length === 0 && <div style={{ padding: "12px 0", color: "var(--text3)", fontSize: 12 }}>No history yet.</div>}
            {history.map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>v{h.version}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 8 }}>{h.title}</span>
                  {h.published_at && <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 8 }}>{new Date(h.published_at).toLocaleDateString()}</span>}
                </div>
                <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, fontWeight: 700, letterSpacing: "0.05em", background: h.status === "published" ? "var(--green2)" : h.status === "draft" ? "var(--amber2)" : "var(--bg4)", color: h.status === "published" ? "var(--green)" : h.status === "draft" ? "var(--amber)" : "var(--text3)" }}>{h.status.toUpperCase()}</span>
                <button className="btn btn-sm" onClick={() => rollback(h.id)}>Rollback</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
