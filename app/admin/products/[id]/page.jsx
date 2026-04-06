"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { safeFetch } from "../../api";

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
function parseObj(raw) {
  try { return typeof raw === "string" ? JSON.parse(raw) : (raw && typeof raw === "object" ? raw : {}); } catch { return {}; }
}

function Spec({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 11, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, width: 130 }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: mono ? "'DM Mono', monospace" : undefined, textAlign: "right", flex: 1 }}>{value}</span>
    </div>
  );
}

export default function AdminProductDetail() {
  const router = useRouter();
  const params = useParams();

  const [product, setProduct] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [confirmDeact, setConfirmDeact] = useState(false);
  const [freshPublished, setFreshPublished] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const flag = sessionStorage.getItem("freshPublish");
      if (flag === params.id) { setFreshPublished(true); sessionStorage.removeItem("freshPublish"); }
    }
  }, [params.id]);

  // Load the product
  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    safeFetch(`/api/products/${params.id}`)
      .then((p) => {
        setProduct(p);
        setSelectedColor(p.color || parseJ(p.colors, [])[0] || null);
        setError(null);
      })
      .catch(() => setError("Product not found or not accessible"))
      .finally(() => setLoading(false));
  }, [params.id]);

  // Load siblings (same variant group)
  useEffect(() => {
    if (!product?.variant_group_id) return;
    safeFetch(`/api/products/group/${product.variant_group_id}`)
      .then((data) => { setSiblings(Array.isArray(data) ? data : (data ? [data] : [])); })
      .catch(() => {});
  }, [product?.variant_group_id]);

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      if (product.is_active) {
        await safeFetch(`/api/products/${product.id}`, { method: "DELETE", body: JSON.stringify({ confirm: "DELETE" }) });
      } else {
        await safeFetch(`/api/products/${product.id}/restore`, { method: "PUT" });
      }
      setProduct((p) => ({ ...p, is_active: !p.is_active }));
      setConfirmDeact(false);
    } catch { alert("Failed to update status"); }
    finally { setDeactivating(false); }
  };

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>
      <div style={{ fontSize: 28, animation: "spin 1s linear infinite", display: "inline-block" }}>◌</div>
      <div style={{ fontSize: 13, marginTop: 10 }}>Loading product…</div>
    </div>
  );
  if (error) return (
    <div style={{ padding: 40, textAlign: "center", color: "var(--text3)" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{error}</div>
      <button className="btn btn-sm" onClick={() => router.back()}>← Go back</button>
    </div>
  );
  if (!product) return null;

  // Parse all data from the main product row
  const allColors = parseJ(product.colors);
  const allSizes = parseJ(product.sizes);
  const colorImages = parseObj(product.color_images);
  const skuByColor = parseObj(product.sku_by_color);
  const skuBySizeGroup = parseObj(product.sku_by_size_group);
  const allVariants = parseJ(product.variants);
  const careInstructions = parseJ(product.care_instructions);
  const isLive = product.is_active && !product.is_draft;
  const discount = product.mrp && product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;

  // Build a combined color list: merge sibling data with colorImages
  const colorList = (() => {
    // Use siblings if available (more reliable after group query)
    if (siblings.length > 0) {
      return siblings.map((s) => ({
        name: s.color,
        id: s.id,
        images: parseJ(s.image_urls),
        sku: s.sku,
        isActive: s.is_active,
      }));
    }
    // Fallback: build from colorImages + allColors
    return allColors.map((c) => ({
      name: c,
      id: product.id,
      images: colorImages[c] || [],
      sku: skuByColor[c] || product.sku,
      isActive: true,
    }));
  })();

  const activeColorData = colorList.find((c) => c.name === selectedColor) || colorList[0];
  const activeImages = activeColorData?.images || parseJ(product.image_urls);

  // Variant grid: filter by selected color
  const activeVariants = allVariants.filter((v) => !selectedColor || v.color === selectedColor);
  // Full stock grid (all colors x sizes)
  const variantMap = {};
  allVariants.forEach((v) => {
    if (!variantMap[v.color]) variantMap[v.color] = {};
    variantMap[v.color][v.size] = v;
  });

  const baseTitle = (product.title || "Untitled").replace(/ - [A-Za-z]+$/, "").trim();

  return (
    <div className="page-anim" style={{ padding: 24 }}>

      {/* Fresh publish banner */}
      {freshPublished && (
        <div className="alert alert-accent" style={{ marginBottom: 20 }}>
          <span>🎉</span>
          <div className="alert-msg">
            <strong>Product published successfully!</strong> Review all the details below before sharing.
          </div>
        </div>
      )}

      {/* Top nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <button className="btn btn-sm" onClick={() => router.push("/admin/products")}>
          ← All Products
        </button>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {product.is_draft
            ? <span className="tag tag-amber"><span className="tag-dot" />Draft</span>
            : isLive
              ? <span className="tag tag-green"><span className="tag-dot" />Live</span>
              : <span className="tag tag-gray"><span className="tag-dot" />Inactive</span>
          }
          <button className="btn btn-sm" onClick={() => router.push(`/admin/list-product?edit=${product.id}`)}>
            ✏ Edit Product
          </button>
          {confirmDeact ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-danger btn-sm" onClick={handleDeactivate} disabled={deactivating}>
                {deactivating ? "…" : isLive ? "Confirm Deactivate" : "Confirm Restore"}
              </button>
              <button className="btn btn-sm" onClick={() => setConfirmDeact(false)}>✕</button>
            </div>
          ) : (
            <button className="btn btn-sm" style={{ color: isLive ? "var(--red)" : "var(--green)" }} onClick={() => setConfirmDeact(true)}>
              {isLive ? "Deactivate" : "Restore"}
            </button>
          )}
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>

        {/* LEFT — Images */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Main image */}
          <div style={{ background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", aspectRatio: "4/5", position: "relative" }}>
            {activeImages.length > 0 ? (
              <img src={activeImages[activeImg] || activeImages[0]} alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8, color: "var(--text3)" }}>
                <span style={{ fontSize: 40 }}>📷</span>
                <span style={{ fontSize: 12 }}>No image for this colour</span>
              </div>
            )}
            {/* Arrows */}
            {activeImages.length > 1 && (
              <>
                <button onClick={() => setActiveImg((i) => Math.max(0, i - 1))}
                  style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                <button onClick={() => setActiveImg((i) => Math.min(activeImages.length - 1, i + 1))}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                <div style={{ position: "absolute", bottom: 10, right: 12, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 20 }}>{activeImg + 1}/{activeImages.length}</div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {activeImages.length > 1 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {activeImages.map((img, i) => (
                <div key={i} onClick={() => setActiveImg(i)}
                  style={{ width: 60, height: 72, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: `2px solid ${i === activeImg ? "var(--accent)" : "var(--border)"}`, transition: "border 0.15s", flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Core info */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Title + Pricing */}
          <div className="card card-pad">
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>{baseTitle}</div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14 }}>
              {product.main_category}
              {product.sub_category && product.sub_category !== product.main_category ? ` › ${product.sub_category}` : ""}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 22, fontWeight: 700 }}>₹{product.price}</span>
              <span style={{ fontSize: 14, color: "var(--text3)", textDecoration: "line-through" }}>₹{product.mrp}</span>
              {discount > 0 && <span className="tag tag-green" style={{ fontSize: 11 }}>{discount}% off</span>}
            </div>
            {product.description && (
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6, paddingTop: 12, borderTop: "1px solid var(--border)" }}>{product.description}</div>
            )}
          </div>

          {/* Colour tabs */}
          <div className="card card-pad">
            <div className="card-title">Colour Variants</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: colorList.length > 0 ? 14 : 0 }}>
              {colorList.map((col) => {
                const isSelected = selectedColor === col.name;
                return (
                  <button key={col.name}
                    onClick={() => { setSelectedColor(col.name); setActiveImg(0); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 7, padding: "6px 12px",
                      borderRadius: 8, border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)",
                      background: isSelected ? "var(--accent2)" : "var(--bg3)",
                      cursor: "pointer", transition: "all 0.12s",
                      opacity: col.isActive === false ? 0.5 : 1,
                    }}>
                    <span style={{ width: 12, height: 12, borderRadius: "50%", background: getColorHex(col.name), border: "1px solid var(--border2)", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: isSelected ? 500 : 400, color: isSelected ? "var(--accent)" : "var(--text)" }}>{col.name}</span>
                    <span style={{ fontSize: 9, color: "var(--text3)" }}>{col.images.length}📷</span>
                    {col.isActive === false && <span style={{ fontSize: 9, color: "var(--red)" }}>off</span>}
                  </button>
                );
              })}
              {colorList.length === 0 && <span style={{ fontSize: 12, color: "var(--text3)" }}>No colour variants found</span>}
            </div>

            {/* Selected color SKU */}
            {activeColorData && (
              <div style={{ padding: "10px 12px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>SKU for {activeColorData.name}</div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 500, marginTop: 3 }}>{activeColorData.sku || product.sku || "—"}</div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>{activeImages.length} image{activeImages.length !== 1 ? "s" : ""}</div>
                </div>
              </div>
            )}
          </div>

          {/* Sizes */}
          {allSizes.length > 0 && (
            <div className="card card-pad">
              <div className="card-title">Available Sizes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allSizes.map((s, i) => (
                  <div key={i} style={{ padding: "7px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, fontWeight: 500 }}>
                    <div>{s}</div>
                    {skuBySizeGroup[s] && <div className="mono" style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>{skuBySizeGroup[s]}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VARIANT STOCK GRID */}
      {allVariants.length > 0 && (
        <div className="card card-pad" style={{ marginBottom: 24 }}>
          <div className="card-title" style={{ marginBottom: 16 }}>Variant Stock Grid ({allVariants.length} combinations)</div>
          <div style={{ overflowX: "auto" }}>
            {(() => {
              const gridColors = [...new Set(allVariants.map((v) => v.color))];
              const gridSizes = [...new Set(allVariants.map((v) => v.size))];
              return (
                <table style={{ borderCollapse: "collapse", minWidth: Math.max(500, gridSizes.length * 120) }}>
                  <thead>
                    <tr style={{ background: "var(--bg3)" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 500, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)", minWidth: 120 }}>Color</th>
                      {gridSizes.map((s) => (
                        <th key={s} style={{ padding: "10px 14px", textAlign: "center", fontSize: 10, fontWeight: 500, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap", borderBottom: "1px solid var(--border)", minWidth: 90 }}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gridColors.map((color, ci) => (
                      <tr key={ci} style={{ borderBottom: "1px solid var(--border)", background: selectedColor === color ? "var(--accent3)" : "" }}>
                        <td style={{ padding: "10px 14px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: getColorHex(color), border: "1px solid var(--border2)", flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{color}</span>
                          </div>
                        </td>
                        {gridSizes.map((size) => {
                          const v = variantMap[color]?.[size];
                          const stock = v ? v.stock : null;
                          const stockColor = stock === null ? "var(--text3)" : stock === 0 ? "var(--red)" : stock < 5 ? "var(--amber)" : "var(--green)";
                          return (
                            <td key={size} style={{ padding: "10px 14px", textAlign: "center", verticalAlign: "middle" }}>
                              {v ? (
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: stockColor }}>{stock ?? "—"}</div>
                                  {v.sku && <div className="mono" style={{ fontSize: 9, color: "var(--text3)", marginTop: 2 }}>{v.sku}</div>}
                                </div>
                              ) : (
                                <span style={{ fontSize: 11, color: "var(--border2)" }}>—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 10, color: "var(--text3)" }}>
            <span><span style={{ color: "var(--green)" }}>■</span> In stock (5+)</span>
            <span><span style={{ color: "var(--amber)" }}>■</span> Low stock (1–4)</span>
            <span><span style={{ color: "var(--red)" }}>■</span> Out of stock</span>
          </div>
        </div>
      )}

      {/* Bottom: Specs + SKU + Settings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Specifications */}
        <div className="card card-pad">
          <div className="card-title">Specifications</div>
          <Spec label="Fabric" value={product.fabric} />
          <Spec label="Pattern" value={product.pattern} />
          <Spec label="Neck Type" value={product.neck_type} />
          <Spec label="HSN Code" value={product.hsn_code} mono />
          <Spec label="Origin" value={product.origin_country} />
          <Spec label="Manufacturer" value={product.manufacturer_details} />
          {careInstructions.length > 0 && (
            <div style={{ paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Care Instructions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {careInstructions.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>•</span>{c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SKU Breakdown + Settings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card card-pad">
            <div className="card-title">SKU Breakdown</div>
            <Spec label="Base SKU" value={product.sku} mono />
            {Object.entries(skuByColor).length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Per-Colour SKUs</div>
                {Object.entries(skuByColor).map(([col, sku]) => (
                  <div key={col} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: getColorHex(col), border: "1px solid var(--border2)" }} />
                      <span style={{ fontSize: 11 }}>{col}</span>
                    </div>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text2)" }}>{sku}</span>
                  </div>
                ))}
              </div>
            )}
            {Object.entries(skuBySizeGroup).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Per-Size SKUs</div>
                {Object.entries(skuBySizeGroup).map(([size, sku]) => (
                  <div key={size} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 11 }}>{size}</span>
                    <span className="mono" style={{ fontSize: 11, color: "var(--text2)" }}>{sku}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card card-pad">
            <div className="card-title">Product Settings</div>
            {[
              ["New Arrival", product.is_new_arrival],
              ["Featured", product.is_featured],
              ["COD Eligible", product.is_cod_eligible],
              ["Show on Homepage", product.show_on_homepage],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 12 }}>{label}</span>
                <span className={`tag ${val ? "tag-green" : "tag-gray"}`}>{val ? "Yes" : "No"}</span>
              </div>
            ))}
            {product.show_on_homepage && product.homepage_section && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <span style={{ fontSize: 12 }}>Homepage Section</span>
                <span style={{ fontSize: 12, color: "var(--text2)" }}>{(product.homepage_section || "").replace(/_/g, " ")}</span>
              </div>
            )}
          </div>

          <div className="card card-pad">
            <div className="card-title">Identifiers</div>
            <Spec label="Product ID" value={`#${product.id}`} mono />
            <Spec label="Group ID" value={product.variant_group_id ? product.variant_group_id.split("-")[0] + "…" : "—"} mono />
            <Spec label="Created" value={product.created_at ? new Date(product.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
          </div>
        </div>
      </div>

      {/* Sticky bottom actions */}
      <div style={{ marginTop: 20, padding: "14px 20px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "var(--text2)" }}>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>{baseTitle}</span>
          {" "}· {colorList.length} colour{colorList.length !== 1 ? "s" : ""} · {allSizes.length} size{allSizes.length !== 1 ? "s" : ""}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-sm" onClick={() => router.push("/admin/products")}>← All Products</button>
          <button className="btn btn-accent btn-sm" onClick={() => router.push(`/admin/list-product?edit=${product.id}`)}>✏ Edit Product</button>
        </div>
      </div>
    </div>
  );
}
