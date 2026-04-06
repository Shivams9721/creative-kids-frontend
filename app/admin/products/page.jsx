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
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "table"

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
      list = list.filter(p => (p.title || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q));
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
  const parseImages = (raw) => parseJson(raw);
  const parseSizes = (raw) => parseJson(raw);
  const parseColors = (raw) => parseJson(raw);

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
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))" }}>
          {Object.values(groupedProducts).map((colorGroup, idx) => {
            const mainProduct = colorGroup[0];
            const colors = parseColors(mainProduct.colors);
            const sizes = parseSizes(mainProduct.sizes);
            const images = parseImages(mainProduct.image_urls);
            const isLive = mainProduct.is_active && !mainProduct.is_draft;
            
            return (
              <div key={idx} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Image */}
                <div style={{ width: "100%", height: 180, background: "var(--bg2)", overflow: "hidden" }}>
                  {images[0] ? (
                    <img src={images[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>No image</div>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                  {/* Title & Status */}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{(mainProduct.title || "").replace(/ - \w+$/, "")}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>SKU: {mainProduct.sku || "—"}</div>
                  </div>

                  {/* Price */}
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text2)" }}>₹{mainProduct.price} <span style={{ fontSize: 10, textDecoration: "line-through", color: "var(--text3)" }}>₹{mainProduct.mrp}</span></div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{Math.round(((mainProduct.mrp - mainProduct.price) / mainProduct.mrp) * 100)}% off</div>
                  </div>

                  {/* Category */}
                  <div>
                    <span className="tag tag-gray" style={{ fontSize: 10 }}>{mainProduct.sub_category || mainProduct.main_category || "—"}</span>
                  </div>

                  {/* Colors */}
                  {colors.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Colors ({colors.length})</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {colors.map((col, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid var(--border)", backgroundColor: getColorHex(col) }} />
                            <span style={{ fontSize: 11 }}>{col}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {sizes.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Sizes ({sizes.length})</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {sizes.map((s, i) => (
                          <span key={i} style={{ fontSize: 10, padding: "3px 8px", background: "var(--bg3)", borderRadius: 4, color: "var(--text2)" }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div style={{ marginTop: 6 }}>
                    {mainProduct.is_draft ? <span className="tag tag-amber"><span className="tag-dot" />Draft</span>
                      : mainProduct.is_active ? <span className="tag tag-green"><span className="tag-dot" />Live</span>
                      : <span className="tag tag-gray"><span className="tag-dot" />Inactive</span>}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => router.push(`/admin/products/${mainProduct.variant_group_id || mainProduct.id}`)}>View Details</button>
                    <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => router.push(`/admin/list-product?edit=${mainProduct.id}`)}>Edit</button>
                    <button className="btn btn-sm" onClick={() => toggleActive(mainProduct.id, mainProduct.is_active)}>
                      {mainProduct.is_active ? "Deactivate" : "Restore"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
