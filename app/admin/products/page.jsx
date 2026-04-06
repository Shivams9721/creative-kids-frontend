"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeFetch } from "../api";

const ALL_COLORS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Blue', hex: '#4A90E2' }, { name: 'Pink', hex: '#E2889D' }, { name: 'Red', hex: '#D32F2F' },
  { name: 'Green', hex: '#2E7D32' }, { name: 'Yellow', hex: '#FBC02D' }, { name: 'Grey', hex: '#9E9E9E' },
  { name: 'Orange', hex: '#FF6B35' }, { name: 'Purple', hex: '#7B2D8B' }, { name: 'Brown', hex: '#795548' },
];

const getColorHex = (colorName) => ALL_COLORS.find(c => c.name === colorName)?.hex || '#94a3b8';

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  useEffect(() => {
    safeFetch("/api/admin/products")
      .then(d => { const list = Array.isArray(d) ? d : []; setProducts(list); setFiltered(list); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = products;
    if (catFilter !== "All") list = list.filter(p => p.main_category === catFilter || p.sub_category === catFilter);
    if (statusFilter === "Live") list = list.filter(p => p.is_active && !p.is_draft);
    else if (statusFilter === "Draft") list = list.filter(p => p.is_draft);
    else if (statusFilter === "Inactive") list = list.filter(p => !p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => (p.title || "").toLowerCase().includes(q) || (p.base_sku || "").toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [search, catFilter, statusFilter, products]);

  const toggleActive = async (id, current) => {
    try {
      if (current) {
        await safeFetch(`/api/products/${id}`, { method: "DELETE", body: JSON.stringify({ confirm: "DELETE" }) });
      } else {
        await safeFetch(`/api/products/${id}/restore`, { method: "PUT" });
      }
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
    } catch { alert("Failed to update product"); }
  };

  const parseJson = (raw) => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || []); } catch { return []; } };
  const parseImages = (raw, childVariants) => {
    const parsed = parseJson(raw);
    if (parsed.length > 0) return parsed;
    return Array.isArray(childVariants) ? parseJson(childVariants[0]?.image_urls) : [];
  };
  const parseSizes = (raw, childVariants) => {
    const parsed = parseJson(raw);
    if (parsed.length > 0) return parsed;
    if (!Array.isArray(childVariants) || childVariants.length === 0) return [];
    return parseJson(childVariants[0]?.variants).map(v => v?.size).filter(Boolean);
  };
  const parseColors = (raw, childVariants) => {
    const parsed = parseJson(raw);
    if (parsed.length > 0) return parsed;
    return Array.isArray(childVariants) ? [...new Set(childVariants.map(v => v.color).filter(Boolean))] : [];
  };

  // Group products by variant_group_id to show color variants together
  const groupedProducts = {};
  filtered.forEach(p => {
    const gid = p.variant_group_id || p.id;
    if (!groupedProducts[gid]) groupedProducts[gid] = [];
    groupedProducts[gid].push(p);
  });

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>All Products</div>
          <button className="btn btn-accent btn-sm" onClick={() => router.push("/admin/list-product")}>+ List product</button>
        </div>
        
        <div className="filter-bar">
          <input className="filter-input" placeholder="Search title, SKU…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="All">All categories</option>
            {["Baby boys","Baby girls","Boys clothing","Girls clothing"].map(c => <option key={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All status</option>
            <option>Live</option><option>Draft</option><option>Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 24, color: "var(--text3)", textAlign: "center" }}>Loading products…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>No products found</div>
          <button className="btn btn-accent btn-sm" onClick={() => router.push("/admin/list-product")}>Create your first product</button>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
                <th style={{ padding: "12px 16px" }}>Product</th>
                <th style={{ padding: "12px 16px" }}>SKU</th>
                <th style={{ padding: "12px 16px" }}>Category</th>
                <th style={{ padding: "12px 16px" }}>Price</th>
                <th style={{ padding: "12px 16px" }}>Colors</th>
                <th style={{ padding: "12px 16px" }}>Sizes</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(groupedProducts).map((colorGroup, idx) => {
                const mainProduct = colorGroup[0];
                const colors = parseColors(mainProduct.colors, mainProduct.child_variants);
                const sizes = parseSizes(mainProduct.sizes, mainProduct.child_variants);
                const images = parseImages(mainProduct.image_urls, mainProduct.child_variants);
                const isLive = mainProduct.is_active && !mainProduct.is_draft;
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "16px", verticalAlign: "top", maxWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 72, height: 72, background: "var(--bg2)", overflow: "hidden", borderRadius: 8, flexShrink: 0 }}>
                          {images[0] ? <img src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>No image</div>}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{mainProduct.title || "Untitled product"}</div>
                          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>ID: {mainProduct.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top", fontSize: 12 }}>{mainProduct.base_sku || "—"}</td>
                    <td style={{ padding: "16px", verticalAlign: "top", fontSize: 12 }}>{mainProduct.sub_category || mainProduct.main_category || "—"}</td>
                    <td style={{ padding: "16px", verticalAlign: "top", fontSize: 12 }}>₹{mainProduct.price || "0"} <span style={{ display: "block", fontSize: 11, color: "var(--text3)", textDecoration: "line-through" }}>₹{mainProduct.mrp || "0"}</span></td>
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {colors.slice(0, 4).map((col, i) => (
                          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", fontSize: 11, background: "var(--bg3)", borderRadius: 999 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: getColorHex(col), border: "1px solid var(--border)" }} />{col}
                          </span>
                        ))}
                        {colors.length > 4 && <span style={{ fontSize: 11, color: "var(--text3)" }}>+{colors.length - 4}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {sizes.slice(0, 5).map((size, i) => (
                          <span key={i} style={{ fontSize: 11, padding: "4px 8px", background: "var(--bg3)", borderRadius: 999 }}>{size}</span>
                        ))}
                        {sizes.length > 5 && <span style={{ fontSize: 11, color: "var(--text3)" }}>+{sizes.length - 5}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      {mainProduct.is_draft ? <span className="tag tag-amber"><span className="tag-dot" />Draft</span>
                        : isLive ? <span className="tag tag-green"><span className="tag-dot" />Live</span>
                        : <span className="tag tag-gray"><span className="tag-dot" />Inactive</span>}
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button className="btn btn-sm" style={{ width: "100%" }} onClick={() => router.push(`/product/${mainProduct.id}`)}>View more</button>
                        <button className="btn btn-sm" style={{ width: "100%" }} onClick={() => router.push(`/admin/list-product?edit=${mainProduct.id}`)}>Edit</button>
                        <button className="btn btn-sm" style={{ width: "100%" }} onClick={() => toggleActive(mainProduct.id, mainProduct.is_active)}>
                          {mainProduct.is_active ? "Deactivate" : "Restore"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
