"use client";
import { useState, useEffect } from "react";
import { safeFetch } from "../api";

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { productId, variantIdx, stock }
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    safeFetch("/api/admin/products")
      .then(products => {
        if (!Array.isArray(products)) return;
        const rows = [];
        products.forEach(p => {
          const childVariants = p.child_variants || [];
          childVariants.forEach(v => {
            // Parse variants JSON string from DB
            let parsedVariants = [];
            try {
              const raw = v.variants;
              parsedVariants = typeof raw === "string" ? JSON.parse(raw) : (Array.isArray(raw) ? raw : []);
            } catch { parsedVariants = []; }

            // If no variants array, create a single row from the product itself
            if (parsedVariants.length === 0) {
              rows.push({
                productId: v.id,
                productTitle: (p.title || "").replace(/ - .+$/, ""),
                color: v.color || "—",
                size: "All sizes",
                sku: v.sku || "—",
                stock: 0,
                variantIdx: 0,
                allVariants: [],
              });
              return;
            }

            parsedVariants.forEach((variant, idx) => {
              rows.push({
                productId: v.id,
                productTitle: (p.title || "").replace(/ - .+$/, ""),
                color: v.color || variant.color || "—",
                size: variant.size || "—",
                sku: variant.sku || v.sku || "—",
                stock: parseInt(variant.stock) || 0,
                variantIdx: idx,
                allVariants: parsedVariants,
              });
            });
          });
        });
        setItems(rows);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveStock = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const item = items.find(i => i.productId === editing.productId && i.variantIdx === editing.variantIdx);
      if (!item) return;
      const updated = item.allVariants.map((v, i) => i === editing.variantIdx ? { ...v, stock: parseInt(editing.stock) || 0 } : v);
      await safeFetch(`/api/products/${editing.productId}/stock`, {
        method: "PATCH",
        body: JSON.stringify({ variants: updated }),
      });
      setItems(prev => prev.map(i =>
        i.productId === editing.productId && i.variantIdx === editing.variantIdx
          ? { ...i, stock: parseInt(editing.stock) || 0 }
          : i
      ));
      setEditing(null);
    } catch { alert("Failed to update stock"); }
    finally { setSaving(false); }
  };

  const critical = items.filter(i => i.stock <= 2).length;
  const low = items.filter(i => i.stock > 2 && i.stock <= 10).length;
  const oos = items.filter(i => i.stock === 0).length;

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      <div className="g3 mb16">
        <div className="kpi"><div className="kpi-label">Total SKUs</div><div className="kpi-val">{loading ? "…" : items.length}</div></div>
        <div className="kpi"><div className="kpi-label">Low stock (≤10)</div><div className="kpi-val" style={{ color: "var(--red)" }}>{loading ? "…" : low + critical}</div><div className="kpi-sub">Needs restocking</div></div>
        <div className="kpi"><div className="kpi-label">Out of stock</div><div className="kpi-val" style={{ color: "var(--amber)" }}>{loading ? "…" : oos}</div></div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        {loading ? <div style={{ padding: 24, color: "var(--text3)" }}>Loading inventory…</div> : (
          <table className="tbl">
            <thead><tr><th>SKU</th><th>Product</th><th>Colour</th><th>Size</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text3)", padding: 32 }}>No inventory data</td></tr>
              ) : items.map((item, i) => {
                const isEditing = editing?.productId === item.productId && editing?.variantIdx === item.variantIdx;
                const maxStock = 50;
                const pct = Math.min(100, (item.stock / maxStock) * 100);
                const statusColor = item.stock === 0 ? "var(--red)" : item.stock <= 5 ? "var(--red)" : item.stock <= 10 ? "var(--amber)" : "var(--accent)";
                const statusLabel = item.stock === 0 ? "Out of stock" : item.stock <= 5 ? "Critical" : item.stock <= 10 ? "Low" : "OK";
                const statusTag = item.stock === 0 ? "tag-gray" : item.stock <= 5 ? "tag-red" : item.stock <= 10 ? "tag-amber" : "tag-green";
                return (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 11 }}>{item.sku}</td>
                    <td>{item.productTitle}</td>
                    <td>{item.color}</td>
                    <td>{item.size}</td>
                    <td>
                      {isEditing ? (
                        <input type="number" min={0} value={editing.stock} onChange={e => setEditing(ed => ({ ...ed, stock: e.target.value }))}
                          style={{ width: 70, background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 6, padding: "4px 8px", color: "var(--text)", fontSize: 13 }} />
                      ) : (
                        <div>
                          <span style={{ color: statusColor, fontWeight: 600 }}>{item.stock}</span>
                          <div className="stock-bar"><div className="stock-fill" style={{ width: `${pct}%`, background: statusColor }} /></div>
                        </div>
                      )}
                    </td>
                    <td><span className={`tag ${statusTag}`}><span className="tag-dot" />{statusLabel}</span></td>
                    <td>
                      <div className="flex-center gap6">
                        {isEditing ? (
                          <>
                            <button className="btn btn-sm btn-accent" disabled={saving} onClick={saveStock}>{saving ? "…" : "Save"}</button>
                            <button className="btn btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                          </>
                        ) : (
                          <button className="btn btn-sm" onClick={() => setEditing({ productId: item.productId, variantIdx: item.variantIdx, stock: item.stock })}>Update</button>
                        )}
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
