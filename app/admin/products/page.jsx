"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { safeFetch } from "../api";

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

  const parseImages = (raw) => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || []); } catch { return []; } };

  return (
    <div className="page-anim" style={{ padding: 24 }}>
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
        <button className="btn btn-accent btn-sm" onClick={() => router.push("/admin/list-product")}>+ List product</button>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? <div style={{ padding: 24, color: "var(--text3)" }}>Loading products…</div> : (
          <table className="tbl">
            <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>No products found</td></tr>
              ) : filtered.map(p => {
                const imgs = parseImages(p.child_variants?.[0]?.image_urls || p.image_urls);
                const isLive = p.is_active && !p.is_draft;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex-center gap12">
                        <div className="prod-img">
                          {imgs[0] ? <img src={imgs[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "img"}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{(p.title || "").replace(/ - \w+$/, "")}</div>
                          <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{p.child_variants?.length || 1} variant(s)</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 11 }}>{p.base_sku || "—"}</td>
                    <td><span className="tag tag-gray">{p.sub_category || p.main_category || "—"}</span></td>
                    <td>₹{p.price} <span style={{ fontSize: 10, color: "var(--text3)" }}>/ ₹{p.mrp}</span></td>
                    <td>
                      {p.is_draft ? <span className="tag tag-amber"><span className="tag-dot" />Draft</span>
                        : p.is_active ? <span className="tag tag-green"><span className="tag-dot" />Live</span>
                        : <span className="tag tag-gray"><span className="tag-dot" />Inactive</span>}
                    </td>
                    <td>
                      <div className="flex-center gap6">
                        <button className="btn btn-sm" onClick={() => router.push(`/admin/list-product?edit=${p.id}`)}>Edit</button>
                        <button className="btn btn-sm" onClick={() => toggleActive(p.id, p.is_active)}>
                          {p.is_active ? "Deactivate" : "Restore"}
                        </button>
                      </div>
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
