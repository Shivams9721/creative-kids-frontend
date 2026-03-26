"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2, Trash2, UploadCloud, CheckCircle2, Plus } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const ALL_SIZES = [
  '0-3M','3-6M','6-9M','9-12M','12-18M','18-24M',
  '1-2Y','2-3Y','3-4Y','4-5Y','5-6Y','6-7Y','7-8Y','8-9Y',
  '9-10Y','10-11Y','11-12Y','12-13Y','13-14Y','14-15Y','15-16Y','16-17Y','17-18Y'
];

const ALL_COLORS = [
  { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' }, { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Blue', hex: '#4A90E2' }, { name: 'Pink', hex: '#E2889D' }, { name: 'Red', hex: '#D32F2F' },
  { name: 'Green', hex: '#2E7D32' }, { name: 'Yellow', hex: '#FBC02D' }, { name: 'Grey', hex: '#9E9E9E' },
  { name: 'Orange', hex: '#FF6B35' }, { name: 'Purple', hex: '#7B2D8B' }, { name: 'Brown', hex: '#795548' },
  { name: 'Navy', hex: '#1A237E' }, { name: 'Maroon', hex: '#880E4F' }
];

const getColorHex = (colorName) => ALL_COLORS.find(c => c.name === colorName)?.hex || '#94a3b8';

export default function VariantDrawer({ isOpen, onClose, formData, setFormData, darkMode }) {
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [uploadingVariantImage, setUploadingVariantImage] = useState(null); // "variant-{index}" | "color-{color}-{imgIdx}"

  const inp = `border p-3 rounded-xl text-[13px] outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-400' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'}`;
  const label = `text-[11px] font-bold tracking-widest uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;

  const generateVariants = useCallback(() => {
    if (selectedSizes.length === 0 && selectedColors.length === 0) {
      alert("Please select at least one Size or Color first!");
      return;
    }
    const baseSku = formData.sku || "SKU";
    setFormData(prev => {
      let matrix = [...prev.variants];
      const addVariant = (color, size) => {
        if (matrix.some(v => v.color === color && v.size === size)) return;
        const skuColor = color !== "Default" ? `-${color.toUpperCase().replace(/\s+/g, '')}` : "";
        const skuSize = size !== "Default" ? `-${size.toUpperCase().replace(/\s+/g, '')}` : "";
        matrix.push({ color, size, stock: 10, sku: `${baseSku}${skuColor}${skuSize}`, cost_price: "" });
      };
      if (selectedSizes.length > 0 && selectedColors.length > 0)
        selectedColors.forEach(c => selectedSizes.forEach(s => addVariant(c, s)));
      else if (selectedSizes.length > 0) selectedSizes.forEach(s => addVariant("Default", s));
      else selectedColors.forEach(c => addVariant(c, "Default"));
      return { ...prev, variants: matrix };
    });
    setSelectedSizes([]);
    setSelectedColors([]);
  }, [selectedSizes, selectedColors, formData.sku, setFormData]);

  const handleVariantChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  }, [setFormData]);

  const removeVariant = useCallback((index) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
  }, [setFormData]);

  // Upload helper — used for color gallery images
  const uploadToS3 = useCallback(async (file) => {
    const fd = new FormData();
    fd.append("image", file);
    const token = localStorage.getItem("adminToken");
    const res = await fetch(`${API}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd
    });
    const data = await res.json();
    if (res.ok && data.success) return data.imageUrl;
    throw new Error(data.error || "Upload failed");
  }, []);

  // Color gallery — add multiple images per color, auto-sync first image of each color to image_urls
  const handleColorGalleryUpload = useCallback(async (e, color) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingVariantImage(`color-${color}`);
    try {
      const urls = await Promise.all(files.map(uploadToS3));
      const valid = urls.filter(Boolean);
      setFormData(prev => {
        const existing = (prev.color_images || {})[color] || [];
        const newColorImages = { ...(prev.color_images || {}), [color]: [...existing, ...valid] };
        // Sync: rebuild image_urls as first image from each color gallery
        const allColorKeys = Object.keys(newColorImages);
        const syncedImageUrls = allColorKeys
          .map(c => newColorImages[c][0])
          .filter(Boolean);
        return {
          ...prev,
          color_images: newColorImages,
          image_urls: syncedImageUrls.length > 0 ? syncedImageUrls : prev.image_urls
        };
      });
    } catch { alert("Upload error."); }
    finally { setUploadingVariantImage(null); e.target.value = ""; }
  }, [uploadToS3, setFormData]);

  const removeColorGalleryImage = useCallback((color, imgIndex) => {
    setFormData(prev => {
      const existing = [...((prev.color_images || {})[color] || [])];
      existing.splice(imgIndex, 1);
      const newColorImages = { ...(prev.color_images || {}), [color]: existing };
      // Re-sync image_urls
      const syncedImageUrls = Object.keys(newColorImages)
        .map(c => newColorImages[c][0])
        .filter(Boolean);
      return {
        ...prev,
        color_images: newColorImages,
        image_urls: syncedImageUrls.length > 0 ? syncedImageUrls : prev.image_urls
      };
    });
  }, [setFormData]);

  const totalStock = formData.variants.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);

  // Unique colors that have variants (excluding Default)
  const uniqueColors = [...new Set(formData.variants.map(v => v.color))].filter(c => c !== 'Default');

  const getMargin = (variant) => {
    const cost = parseFloat(variant.cost_price);
    const sell = parseFloat(formData.price);
    if (!cost || !sell || sell === 0) return null;
    return Math.round(((sell - cost) / sell) * 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed top-0 right-0 h-full z-[160] w-full max-w-4xl flex flex-col shadow-2xl border-l ${darkMode ? 'bg-[#0d1424] border-white/10' : 'bg-white border-slate-200'}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-5 border-b flex-shrink-0 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <div>
                <h2 className={`text-[15px] font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Variation Studio</h2>
                <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {formData.variants.length} variant{formData.variants.length !== 1 ? 's' : ''} · {totalStock} total units
                </p>
              </div>
              <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

              {/* Size + Color Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className={label}>Select Sizes to Add</label>
                  <div className={`border rounded-xl p-3 flex flex-wrap gap-2 min-h-[52px] ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                    {ALL_SIZES.map(size => {
                      const selected = selectedSizes.includes(size);
                      return (
                        <button type="button" key={size}
                          onClick={() => setSelectedSizes(prev => selected ? prev.filter(s => s !== size) : [...prev, size])}
                          className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-lg border transition-colors ${selected ? 'bg-blue-600 text-white border-blue-600' : darkMode ? 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {selectedSizes.length > 0 && <p className="text-[10px] text-blue-500 font-medium">{selectedSizes.length} size(s) selected</p>}
                </div>

                <div className="flex flex-col gap-2">
                  <label className={label}>Select Colors to Add</label>
                  <div className={`border rounded-xl p-3 flex flex-wrap gap-2 min-h-[52px] ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                    {ALL_COLORS.map(color => {
                      const selected = selectedColors.includes(color.name);
                      return (
                        <button type="button" key={color.name}
                          onClick={() => setSelectedColors(prev => selected ? prev.filter(c => c !== color.name) : [...prev, color.name])}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-lg border transition-all ${selected ? 'border-blue-600 bg-blue-600 text-white' : darkMode ? 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}>
                          <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10" style={{ backgroundColor: color.hex }} />
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedColors.length > 0 && <p className="text-[10px] text-blue-500 font-medium">{selectedColors.length} color(s) selected</p>}
                </div>
              </div>

              <button type="button" onClick={generateVariants}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-colors w-full shadow-md ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                <Wand2 size={16} /> Generate / Add to Grid
              </button>

              {/* Variants Table */}
              {formData.variants.length > 0 ? (
                <div className={`border rounded-xl overflow-x-auto ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <table className={`w-full min-w-[700px] text-left ${darkMode ? 'bg-transparent' : 'bg-white'}`}>
                    <thead>
                      <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                        {['Color', 'Size', 'Stock', 'Cost Price (₹)', 'Margin', 'Variant SKU', ''].map((h, i) => (
                          <th key={i} className={`p-4 text-[11px] font-bold tracking-widest uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${i === 6 ? 'text-center' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {formData.variants.map((variant, index) => {
                          const margin = getMargin(variant);
                          return (
                            <motion.tr key={`${variant.color}-${variant.size}-${index}`}
                              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className={`border-b ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {variant.color !== 'Default' && <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: getColorHex(variant.color) }} />}
                                  <span className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{variant.color}</span>
                                </div>
                              </td>
                              <td className={`p-4 text-[13px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{variant.size}</td>
                              <td className="p-4">
                                <input type="number" value={variant.stock}
                                  onChange={e => handleVariantChange(index, "stock", parseInt(e.target.value) || 0)}
                                  className={`border p-2.5 w-20 rounded-lg text-[13px] outline-none ${darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'}`} />
                              </td>
                              <td className="p-4">
                                <input type="number" step="0.01" placeholder="0.00"
                                  value={variant.cost_price || ""}
                                  onChange={e => handleVariantChange(index, "cost_price", e.target.value)}
                                  className={`border p-2.5 w-24 rounded-lg text-[13px] outline-none ${darkMode ? 'bg-white/5 border-white/10 text-white focus:border-blue-400' : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'}`} />
                              </td>
                              <td className="p-4">
                                {margin !== null ? (
                                  <span className={`text-[12px] font-bold px-2 py-1 rounded-lg ${margin >= 40 ? 'bg-emerald-500/20 text-emerald-500' : margin >= 20 ? 'bg-yellow-500/20 text-yellow-600' : 'bg-red-500/20 text-red-500'}`}>
                                    {margin}%
                                  </span>
                                ) : (
                                  <span className={`text-[11px] ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>—</span>
                                )}
                              </td>
                              <td className="p-4">
                                <input type="text" value={variant.sku}
                                  onChange={e => handleVariantChange(index, "sku", e.target.value)}
                                  className={`border p-2.5 w-full rounded-lg text-[12px] outline-none font-mono ${darkMode ? 'bg-white/5 border-white/10 text-slate-300 focus:border-blue-400' : 'bg-white border-slate-300 text-slate-600 focus:border-blue-500'}`} />
                              </td>
                              <td className="p-4 text-center">
                                <button type="button" onClick={() => removeVariant(index)}
                                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}>
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`rounded-xl border-2 border-dashed p-10 text-center ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <p className={`text-[13px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No variants yet. Select sizes/colors above and click Generate.</p>
                </div>
              )}

              {/* Color Image Gallery */}
              {uniqueColors.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <p className={`text-[13px] font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Color Image Galleries</p>
                    <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Upload images per color — these automatically become the product images on the storefront.
                      The first image of each color is used as the cover. No need to upload again on the main form.
                    </p>
                  </div>
                  {uniqueColors.map(color => {
                    const images = (formData.color_images || {})[color] || [];
                    const isUploading = uploadingVariantImage === `color-${color}`;
                    return (
                      <div key={color} className={`p-4 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: getColorHex(color) }} />
                          <span className={`text-[12px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{color}</span>
                          <span className={`text-[10px] ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{images.length} image{images.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {images.map((url, imgIdx) => (
                            <div key={imgIdx} className="relative w-16 h-20 rounded-lg overflow-hidden border group flex-shrink-0">
                              <img src={url} alt={`${color} ${imgIdx}`} className="w-full h-full object-cover" />
                              <button type="button" onClick={() => removeColorGalleryImage(color, imgIdx)}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <X size={14} className="text-white" />
                              </button>
                            </div>
                          ))}
                          {/* Add more button */}
                          <label className={`w-16 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${isUploading ? darkMode ? 'border-blue-400 bg-blue-500/10' : 'border-blue-400 bg-blue-50' : darkMode ? 'border-white/20 hover:border-blue-400' : 'border-slate-300 hover:border-blue-400'}`}>
                            {isUploading
                              ? <UploadCloud size={16} className="text-blue-400 animate-pulse" />
                              : <Plus size={16} className={darkMode ? 'text-slate-500' : 'text-slate-400'} />}
                            <span className={`text-[9px] mt-1 font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{isUploading ? '...' : 'Add'}</span>
                            <input type="file" accept="image/*" multiple className="hidden" disabled={uploadingVariantImage !== null} onChange={e => handleColorGalleryUpload(e, color)} />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t flex-shrink-0 ${darkMode ? 'border-white/10 bg-[#0d1424]' : 'border-slate-200 bg-white'}`}>
              <button type="button" onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold tracking-widest uppercase transition-colors shadow-lg shadow-blue-600/20">
                <CheckCircle2 size={16} /> Save Variations & Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
