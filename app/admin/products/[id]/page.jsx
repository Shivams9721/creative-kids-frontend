"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { safeFetch } from "../../api";

const ALL_COLORS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Blue', hex: '#4A90E2' }, { name: 'Pink', hex: '#E2889D' }, { name: 'Red', hex: '#D32F2F' },
  { name: 'Green', hex: '#2E7D32' }, { name: 'Yellow', hex: '#FBC02D' }, { name: 'Grey', hex: '#9E9E9E' },
  { name: 'Orange', hex: '#FF6B35' }, { name: 'Purple', hex: '#7B2D8B' }, { name: 'Brown', hex: '#795548' },
];

const getColorHex = (colorName) => ALL_COLORS.find(c => c.name === colorName)?.hex || '#94a3b8';

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    if (!params.id) return;
    safeFetch(`/api/products/${params.id}`)
      .then(p => {
        setProduct(p);
        setSelectedColor(p.color);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  // Fetch all variants in the same group
  useEffect(() => {
    if (!product?.variant_group_id) return;
    safeFetch(`/api/products/group/${product.variant_group_id}`)
      .then(data => {
        const list = Array.isArray(data) ? data : (data ? [data] : []);
        setVariants(list);
      })
      .catch(() => {});
  }, [product?.variant_group_id]);

  const parseJson = (raw) => { try { return typeof raw === "string" ? JSON.parse(raw) : (raw || []); } catch { return []; } };

  if (loading) return <div style={{ padding: 24, color: "var(--text3)" }}>Loading…</div>;
  if (!product) return <div style={{ padding: 24, color: "var(--text3)" }}>Product not found</div>;

  const colors = parseJson(product.colors);
  const sizes = parseJson(product.sizes);
  const images = parseJson(product.image_urls);
  const variantList = parseJson(product.variants);
  const careInstructions = parseJson(product.care_instructions);
  const skuByColor = parseJson(product.sku_by_color);
  const skuBySize = parseJson(product.sku_by_size_group);

  const isLive = product.is_active && !product.is_draft;

  return (
    <div className="page-anim" style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="btn btn-sm" onClick={() => router.back()}>← Back</button>
        <div>
          {product.is_draft ? <span className="tag tag-amber"><span className="tag-dot" />Draft</span>
            : product.is_active ? <span className="tag tag-green"><span className="tag-dot" />Live</span>
            : <span className="tag tag-gray"><span className="tag-dot" />Inactive</span>}
        </div>
      </div>

      <div className="g2" style={{ gap: 24 }}>
        {/* Left: Images */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ width: "100%", paddingBottom: "100%", position: "relative", background: "var(--bg2)" }}>
            {images[0] ? (
              <img src={images[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)" }}>No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div style={{ padding: 12, display: "flex", gap: 8, overflowX: "auto", borderTop: "1px solid var(--border)" }}>
              {images.map((img, i) => (
                <div key={i} style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 6, overflow: "hidden", border: "1px solid var(--border)", cursor: "pointer" }}>
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Basic Info */}
          <div className="card card-pad">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>{(product.title || "").replace(/ - \w+$/, "")}</div>
            
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>CATEGORY</div>
              <div style={{ fontSize: 12 }}>{product.sub_category || product.main_category || "—"}</div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>SKU</div>
              <div className="mono" style={{ fontSize: 12 }}>{product.sku || "—"}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 4 }}>DESCRIPTION</div>
              <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{product.description || "—"}</div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Pricing</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>Selling Price</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>₹{product.price}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)" }}>MRP</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>₹{product.mrp}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--green)" }}>
              {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% discount
            </div>
          </div>

          {/* Colors & Sizes */}
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Attributes</div>
            
            {colors.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>COLORS</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {colors.map((col, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--bg3)", borderRadius: 6 }}>
                      <span style={{ width: 12, height: 12, borderRadius: "50%", border: "1px solid var(--border)", backgroundColor: getColorHex(col) }} />
                      <span style={{ fontSize: 12 }}>{col}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 8 }}>SIZES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {sizes.map((s, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "6px 12px", background: "var(--bg3)", borderRadius: 6 }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Specifications */}
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Specifications</div>
            <div style={{ display: "grid", gap: 10, fontSize: 12 }}>
              {product.fabric && <div><span style={{ color: "var(--text3)" }}>Fabric:</span> {product.fabric}</div>}
              {product.pattern && <div><span style={{ color: "var(--text3)" }}>Pattern:</span> {product.pattern}</div>}
              {product.neck_type && <div><span style={{ color: "var(--text3)" }}>Neck Type:</span> {product.neck_type}</div>}
              {careInstructions.length > 0 && (
                <div>
                  <span style={{ color: "var(--text3)" }}>Care Instructions:</span>
                  <div style={{ marginTop: 6, fontSize: 11 }}>
                    {careInstructions.map((care, i) => <div key={i}>• {care}</div>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Variants Summary */}
          {variantList.length > 0 && (
            <div className="card card-pad">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Variants ({variantList.length})</div>
              <div style={{ fontSize: 11, display: "grid", gap: 8 }}>
                {variantList.slice(0, 5).map((v, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", background: "var(--bg3)", borderRadius: 4 }}>
                    <span>{v.color} / {v.size}</span>
                    <span className="mono" style={{ fontSize: 10, color: "var(--text3)" }}>{v.sku}</span>
                  </div>
                ))}
                {variantList.length > 5 && (
                  <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 10 }}>+{variantList.length - 5} more variants</div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-accent btn-sm" style={{ flex: 1 }} onClick={() => router.push(`/admin/list-product?edit=${product.id}`)}>
              Edit Product
            </button>
            <button className="btn btn-sm" style={{ flex: 1 }} onClick={() => router.push("/admin/products")}>
              Back to List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
