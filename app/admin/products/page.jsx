"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeFetch } from "../api";

const ALL_COLORS = [
  { name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" }, { name: "Beige", hex: "#F5F5DC" },
  { name: "Blue", hex: "#4A90E2" }, { name: "Pink", hex: "#E2889D" }, { name: "Red", hex: "#D32F2F" },
  { name: "Green", hex: "#2E7D32" }, { name: "Yellow", hex: "#FBC02D" }, { name: "Grey", hex: "#9E9E9E" },
  { name: "Orange", hex: "#FF6B35" }, { name: "Purple", hex: "#7B2D8B" }, { name: "Brown", hex: "#795548" },
  { name: "Navy", hex: "#1a237e" }, { name: "Teal", hex: "#00695c" }, { name: "Maroon", hex: "#880e4f" },
  { name: "Lavender", hex: "#9575cd" }, { name: "Mint", hex: "#80cbc4" }, { name: "Peach", hex: "#ffb74d" },
  { name: "Mustard", hex: "#f9a825" }, { name: "Olive", hex: "#827717" }, { name: "Coral", hex: "#ff7043" },
  { name: "Cream", hex: "#fff8e1" }, { name: "Charcoal", hex: "#37474f" },
];
const getColorHex = (n) => ALL_COLORS.find((c) => c.name === n)?.hex || "#94a3b8";

function parseJ(raw, fallback = []) {
  try { return typeof raw === "string" ? JSON.parse(raw) : (raw ?? fallback); } catch { return fallback; }
}

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchProducts = () => {
    setLoading(true);
    safeFetch("/api/admin/products")
      .then((d) => {
        const list = Array.isArray(d) ? d : [];
        setProducts(list);
        setFiltered(list);
        setError(null);
      })
      .catch((e) => setError(e.message || "Failed to load products"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    let list = products;
    if (catFilter !== "All") list = list.filter((p) => p.main_category === catFilter || p.sub_category === catFilter);
    if (statusFilter === "Live") list = list.filter((p) => p.is_active && !p.is_draft);
    else if (statusFilter === "Draft") list = list.filter((p) => p.is_draft);
    else if (statusFilter === "Inactive") list = list.filter((p) => !p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => (p.title || "").toLowerCase().includes(q) || (p.base_sku || "").toLowerCase().includes(q));
    }
    setFiltered(list);
  }, [search, catFilter, statusFilter, products]);

  const toggleActive = async (row) => {
    const id = row.id;
    const current = row.is_active;
    try {
      if (current) {
        await safeFetch(`/api/products/${id}`, { method: "DELETE", body: JSON.stringify({ confirm: "DELETE" }) });
      } else {
        await safeFetch(`/api/products/${id}/restore`, { method: "PUT" });
      }
      fetchProducts();
    } catch { alert("Failed to update product"); }
    finally { setConfirmDelete(null); }
  };

  const getFirstImage = (row) => {
    // Try child_variants images first, then row images
    const children = parseJ(row.child_variants);
    for (const child of (Array.isArray(children) ? children : [])) {
      const imgs = parseJ(child.image_urls);
      if (imgs.length > 0) return imgs[0];
    }
    const imgs = parseJ(row.image_urls);
    return imgs[0] || null;
  };

  const getColors = (row) => {
    const children = parseJ(row.child_variants);
    if (Array.isArray(children) && children.length > 0) {
      return children
        .filter((c) => c.is_active !== false)
        .map((c) => ({ name: c.color, id: c.id }))
        .filter((c) => c.name);
    }
    const parsed = parseJ(row.colors);
    return Array.isArray(parsed) ? parsed.map((n) => ({ name: n, id: row.id })) : [];
  };

  const getSizes = (row) => {
    const parsed = parseJ(row.sizes);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    const children = parseJ(row.child_variants);
    if (!Array.isArray(children) || children.length === 0) return [];
    const firstChild = children[0];
    const variants = parseJ(firstChild?.variants);
    return [...new Set(variants.map((v) => v?.size).filter(Boolean))];
  };

  const cats = ["All", "Baby boys", "Baby girls", "Boys clothing", "Girls clothing"];
  const STATS = [
    { label: "Total", count: products.length, color: "var(--text)" },
    { label: "Live", count: products.filter((p) => p.is_active && !p.is_draft).length, color: "var(--green)" },
    { label: "Draft", count: products.filter((p) => p.is_draft).length, color: "var(--amber)" },
    { label: "Inactive", count: products.filter((p) => !p.is_active).length, color: "var(--text3)" },
  ];

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>All Products</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 3 }}>Manage your product catalogue</div>
        </div>
        <button className="btn btn-accent" onClick={() => router.push("/admin/list-product")}>
          + List product
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ flex: 1, padding: "12px 16px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <input className="filter-input" placeholder="Search by title, SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All status</option>
          <option>Live</option><option>Draft</option><option>Inactive</option>
        </select>
        <button className="btn btn-sm" onClick={fetchProducts} style={{ flexShrink: 0 }}>↻ Refresh</button>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-red" style={{ marginBottom: 16 }}>
          <span>⚠</span>
          <span className="alert-msg">{error}</span>
          <button className="btn btn-sm" onClick={fetchProducts}>Retry</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--text3)" }}>
          <div style={{ fontSize: 24, marginBottom: 8, animation: "spin 1s linear infinite", display: "inline-block" }}>◌</div>
          <div style={{ fontSize: 13 }}>Loading products…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", color: "var(--text3)", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No products found</div>
          <div style={{ fontSize: 12, marginBottom: 20 }}>Try changing your filters or list a new product</div>
          <button className="btn btn-accent btn-sm" onClick={() => router.push("/admin/list-product")}>+ List first product</button>
        </div>
      ) : (
        <div style={{ overflowX: "auto", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: "var(--bg3)", borderBottom: "1px solid var(--border)" }}>
                {["Product", "SKU", "Category", "Pricing", "Colours", "Sizes", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontWeight: 500, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => {
                const firstImg = getFirstImage(row);
                const colors = getColors(row);
                const sizes = getSizes(row);
                const isLive = row.is_active && !row.is_draft;
                const baseTitle = (row.title || "Untitled").replace(/ - \w+$/, "").replace(/ - [A-Za-z]+$/, "");

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg3)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = ""}
                  >
                    {/* Product */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle", maxWidth: 280 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 56, height: 68, background: "var(--bg3)", borderRadius: 8, overflow: "hidden", flexShrink: 0, border: "1px solid var(--border)" }}>
                          {firstImg
                            ? <img src={firstImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📷</div>
                          }
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{baseTitle}</div>
                          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3, fontFamily: "'DM Mono', monospace" }}>ID #{row.id}</div>
                          {row.is_new_arrival && <span className="tag tag-accent" style={{ fontSize: 9, padding: "2px 6px", marginTop: 4, display: "inline-flex" }}>New</span>}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <span className="mono" style={{ fontSize: 11, color: "var(--text2)" }}>{row.base_sku || "—"}</span>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 11 }}>{row.main_category || "—"}</div>
                      {row.sub_category && row.sub_category !== row.main_category && (
                        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{row.sub_category}</div>
                      )}
                    </td>

                    {/* Pricing */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>₹{row.price || "—"}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)", textDecoration: "line-through", marginTop: 2 }}>₹{row.mrp || "—"}</div>
                      {row.price && row.mrp && parseFloat(row.mrp) > parseFloat(row.price) && (
                        <div style={{ fontSize: 9, color: "var(--green)", marginTop: 2 }}>{Math.round(((row.mrp - row.price) / row.mrp) * 100)}% off</div>
                      )}
                    </td>

                    {/* Colours */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {colors.slice(0, 5).map((col, i) => (
                          <div key={i} title={col.name} style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 20 }}>
                            <span style={{ width: 9, height: 9, borderRadius: "50%", background: getColorHex(col.name), border: "1px solid var(--border2)", flexShrink: 0 }} />
                            <span style={{ fontSize: 10 }}>{col.name}</span>
                          </div>
                        ))}
                        {colors.length > 5 && <span style={{ fontSize: 10, color: "var(--text3)", padding: "3px 0" }}>+{colors.length - 5} more</span>}
                        {colors.length === 0 && <span style={{ fontSize: 10, color: "var(--text3)" }}>—</span>}
                      </div>
                    </td>

                    {/* Sizes */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {sizes.slice(0, 4).map((s, i) => (
                          <span key={i} style={{ fontSize: 9, padding: "3px 7px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 4 }}>{s}</span>
                        ))}
                        {sizes.length > 4 && <span style={{ fontSize: 10, color: "var(--text3)" }}>+{sizes.length - 4}</span>}
                        {sizes.length === 0 && <span style={{ fontSize: 10, color: "var(--text3)" }}>—</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      {row.is_draft
                        ? <span className="tag tag-amber"><span className="tag-dot" />Draft</span>
                        : isLive
                          ? <span className="tag tag-green"><span className="tag-dot" />Live</span>
                          : <span className="tag tag-gray"><span className="tag-dot" />Inactive</span>
                      }
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button className="btn btn-accent btn-sm" style={{ whiteSpace: "nowrap" }}
                          onClick={() => router.push(`/admin/products/${row.id}`)}>
                          View details
                        </button>
                        <button className="btn btn-sm" style={{ whiteSpace: "nowrap" }}
                          onClick={() => router.push(`/admin/list-product?edit=${row.id}`)}>
                          Edit
                        </button>
                        {confirmDelete === row.id ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => toggleActive(row)}>
                              {isLive ? "Confirm" : "Restore"}
                            </button>
                            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>✕</button>
                          </div>
                        ) : (
                          <button className="btn btn-sm" style={{ whiteSpace: "nowrap", color: isLive ? "var(--red)" : "var(--green)" }}
                            onClick={() => setConfirmDelete(row.id)}>
                            {isLive ? "Deactivate" : "Restore"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text3)", display: "flex", justifyContent: "space-between" }}>
            <span>Showing {filtered.length} of {products.length} product groups</span>
            <span>Each row = one product (all colours grouped)</span>
          </div>
        </div>
      )}
    </div>
  );
}
