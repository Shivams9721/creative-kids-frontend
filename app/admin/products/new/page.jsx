"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, X, Plus, Trash2, Save, Eye, Package, Edit } from 'lucide-react';
import { safeFetch } from '@/lib/safeFetch';

const S3_PATTERN = /^https:\/\/[\w.-]+\.s3\.[\w.-]+\.amazonaws\.com\/.*$/;

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const CATEGORIES = {
  Baby: {
    'Baby Boy': ['Onesies & Rompers', 'T-Shirts & Sweatshirts', 'Shirts', 'Bottomwear', 'Clothing Sets'],
    'Baby Girl': ['Onesies & Rompers', 'Tops & Tees', 'Dresses', 'Bottomwear', 'Clothing Sets']
  },
  Kids: {
    'Boys Clothing': ['T-Shirts', 'Shirts', 'Jeans', 'Trousers & Joggers', 'Shorts', 'Co-ord Sets', 'Sweatshirts'],
    'Girls Clothing': ['Tops & Tees', 'Dresses', 'Co-ords & Jumpsuits', 'Jeans Joggers & Trousers', 'Shorts Skirts & Skorts']
  }
};

const SIZES = ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M', '1Y', '2Y', '3Y', '4Y', '5Y', '6Y', '7Y', '8Y', '9Y', '10Y', '11Y', '12Y', '13Y', '14Y', '15Y', '16Y', '17Y', '18Y'];

// i18n Dictionary Placeholder - Extracted to satisfy static analysis
const DICT = {
  editTitle: 'Edit Product',
  newTitle: 'Create New Product',
  basicInfo: 'Basic Information',
  loading: 'Loading product...'
};

export default function ProductFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = !!editId;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [variantDrawer, setVariantDrawer] = useState(false);
  const [currentVariant, setCurrentVariant] = useState(null);
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [editingVariantIndex, setEditingVariantIndex] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', price: '', mrp: '', sku: '', hsn_code: '',
    main_category: '', sub_category: '', item_type: '',
    fabric: '', pattern: '', neck_type: '', belt_included: false,
    closure_type: '', length_type: '',
    manufacturer_details: '', care_instructions: '', origin_country: 'India',
    image_urls: [], sizes: [], colors: [], variants: [],
    is_featured: false, is_new_arrival: false, is_draft: false,
    homepage_section: '', homepage_card_slot: null,
    extra_categories: [], color_images: {}
  });

  useEffect(() => {
    

    // Fetch CSRF token
    safeFetch('/api/csrf-token', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => setError('Failed to initialize security token'));

    // Load draft from localStorage
    try {
      const draft = localStorage.getItem('productFormDraft');
      if (draft && !isEdit) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            setForm(prev => ({ ...prev, ...parsed }));
          }
        } catch (e) {}
      }
    } catch (err) {
      console.warn("LocalStorage access denied", err);
    }

    if (isEdit) {
      const safeEditId = parseInt(editId, 10);
      if (isNaN(safeEditId) || safeEditId <= 0) { setError('Invalid product ID'); return; }
      setLoadingProduct(true);
      
      safeFetch(`/api/products/${safeEditId}`)
        .then(async r => {
          if (!r.ok) {
             const errData = await r.json().catch(() => ({}));
             throw new Error(errData.error || 'Product not found');
          }
          return r.json();
        })
        .then(p => {
          try {
            const parseArray = (val) => {
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') {
                try {
                  const parsed = JSON.parse(val);
                  return Array.isArray(parsed) ? parsed : [];
                } catch { return []; }
              }
              return [];
            };
            const parseObject = (val) => {
              if (val && typeof val === 'object' && !Array.isArray(val)) return val;
              if (typeof val === 'string') {
                try {
                  const parsed = JSON.parse(val);
                  return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
                } catch { return {}; }
              }
              return {};
            };

            setForm({
              ...p,
              image_urls: parseArray(p.image_urls),
              sizes: parseArray(p.sizes),
              colors: parseArray(p.colors),
              variants: parseArray(p.variants),
              extra_categories: parseArray(p.extra_categories),
              color_images: parseObject(p.color_images)
            });
          } catch (e) {
            setError('Error parsing product data from server.');
          }
        })
        .catch(err => setError('Failed to load product: ' + err.message))
        .finally(() => setLoadingProduct(false));
    }
  }, [editId, isEdit]);

  // Save draft to localStorage on form change (debounced)
  useEffect(() => {
    if (!isEdit && form.title) {
      setHasUnsavedChanges(true);
      const timer = setTimeout(() => {
        try {
          localStorage.setItem('productFormDraft', JSON.stringify(form));
        } catch (err) {
          console.warn("Could not save draft to localStorage");
        }
      }, 1000); // Debounce 1 second
      return () => clearTimeout(timer);
    }
  }, [form, isEdit]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !loading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, loading]);

  // Close variant drawer on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && variantDrawer) {
        setVariantDrawer(false);
        setCurrentVariant(null);
        setEditingVariantIndex(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [variantDrawer]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (!csrfToken) {
      setError('Security token missing. Please refresh the page.');
      return;
    }

    // Validate file size (8MB limit)
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        setError(`Image "${file.name}" exceeds 8MB limit`);
        return;
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError(`File "${file.name}" is not an image`);
        return;
      }
    }

    const token = localStorage.getItem('adminToken') || getCookie('adminToken');
    if (!token) {
      setError('Authentication token missing. Please log in again.');
      return;
    }

    setUploading(true);
    setError('');
    const uploaded = [];
    const failed = [];

    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('image', file);
        
        const res = await safeFetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
          body: fd,
          credentials: 'include'
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        if (data.imageUrl && S3_PATTERN.test(data.imageUrl)) {
          uploaded.push(data.imageUrl);
        } else {
          failed.push(file.name);
        }
      } catch (err) {
        failed.push(file.name);
      }
    }

    if (uploaded.length > 0) {
      setForm(f => ({ ...f, image_urls: [...f.image_urls, ...uploaded] }));
      setSuccess(`${uploaded.length} image(s) uploaded successfully`);
      setTimeout(() => setSuccess(''), 3000);
    }
    if (failed.length > 0) {
      setError(`Failed to upload: ${failed.join(', ')}`);
    }
    setUploading(false);
  };

  const removeImage = async (url) => {
    if (!csrfToken) { setError('Security token missing. Please refresh the page.'); return; }
    if (!S3_PATTERN.test(url)) { setError('Invalid image URL'); return; }
    const token = localStorage.getItem('adminToken') || getCookie('adminToken');
    if (!token) { setError('Authentication token missing.'); return; }
    try {
      
      const res = await safeFetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
        body: JSON.stringify({ imageUrl: url }),
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete image');
      setForm(f => ({ ...f, image_urls: f.image_urls.filter(u => u !== url) }));
      setSuccess('Image deleted');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to delete image: ' + err.message);
    }
  };

  const moveImage = (index, direction) => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= form.image_urls.length) return;
    const newUrls = [...form.image_urls];
    [newUrls[index], newUrls[newIndex]] = [newUrls[newIndex], newUrls[index]];
    setForm(f => ({ ...f, image_urls: newUrls }));
  };

  const addVariant = () => {
    if (form.colors.length === 0 || form.sizes.length === 0) {
      setError('Please add colors and sizes before creating variants');
      return;
    }
    setCurrentVariant({ color: '', size: '', stock: 0, sku: '' });
    setEditingVariantIndex(null);
    setVariantDrawer(true);
  };

  const editVariant = (index) => {
    setCurrentVariant({ ...form.variants[index] });
    setEditingVariantIndex(index);
    setVariantDrawer(true);
  };

  const saveVariant = () => {
    if (!currentVariant.color || !currentVariant.size) {
      setError('Color and size are required');
      return;
    }

    // Check for duplicate (only if not editing the same variant)
    const isDuplicate = form.variants.some((v, i) => 
      v.color === currentVariant.color && 
      v.size === currentVariant.size && 
      i !== editingVariantIndex
    );

    if (isDuplicate) {
      setError('Variant with this color and size already exists');
      return;
    }

    if (editingVariantIndex !== null) {
      // Update existing variant
      const newVariants = [...form.variants];
      newVariants[editingVariantIndex] = currentVariant;
      setForm(f => ({ ...f, variants: newVariants }));
    } else {
      // Add new variant
      setForm(f => ({ ...f, variants: [...f.variants, currentVariant] }));
    }

    setSuccess('Variant saved');
    setTimeout(() => setSuccess(''), 2000);
    setVariantDrawer(false);
    setCurrentVariant(null);
    setEditingVariantIndex(null);
  };

  const deleteVariant = (index) => {
    setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== index) }));
  };

  const validateForm = () => {
    if (!form.title.trim()) return 'Product title is required';
    const priceVal = parseFloat(form.price);
    const mrpVal = parseFloat(form.mrp);
    if (isNaN(priceVal) || priceVal <= 0) return 'Valid selling price is required';
    if (isNaN(mrpVal) || mrpVal <= 0) return 'Valid MRP is required';
    if (priceVal > mrpVal) return 'Selling price cannot be greater than MRP';
    if (!form.main_category) return 'Main category is required';
    if (!form.sub_category) return 'Sub category is required';
    if (!form.item_type) return 'Item type is required';
    if (form.image_urls.length === 0) return 'At least one product image is required';
    if (form.sizes.length === 0) return 'At least one size is required';
    if (form.colors.length === 0) return 'At least one color is required';
    return null;
  };

  const handleSubmit = async (isDraft) => {
    setError('');
    setSuccess('');

    if (!csrfToken) {
      setError('Security token missing. Please refresh the page.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Skip validation for drafts
    if (!isDraft) {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const token = localStorage.getItem('adminToken') || getCookie('adminToken');
    if (!token) {
      setError('Authentication token missing. Please log in again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        ...form, 
        price: parseFloat(form.price),
        mrp: parseFloat(form.mrp),
        is_draft: isDraft 
      };
      const safeEditId = parseInt(editId, 10);
      if (isEdit && (isNaN(safeEditId) || safeEditId <= 0)) throw new Error('Invalid product ID');
      const method = isEdit ? 'PUT' : 'POST';
      
      const endpoint = isEdit ? `/api/products/${safeEditId}` : `/api/products`;
      const res = await safeFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product');
      }

      // Clear draft on successful publish
      if (!isDraft && !isEdit) {
        try {
          localStorage.removeItem('productFormDraft');
        } catch (e) {
          // ignore
        }
      }

      setHasUnsavedChanges(false);
      setSuccess(isDraft ? 'Draft saved successfully' : 'Product published successfully');
      setTimeout(() => router.push('/admin/products'), 1500);
    } catch (err) {
      setError('Failed to save product: ' + err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const subCategories = form.main_category ? Object.keys(CATEGORIES[form.main_category] || {}) : [];
  const itemTypes = form.sub_category ? CATEGORIES[form.main_category]?.[form.sub_category] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-8">{isEdit ? DICT.editTitle : DICT.newTitle}</h1>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Loading State */}
        {loadingProduct ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">{DICT.loading}</p>
          </div>
        ) : (
        <>

        {/* Basic Info */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Package size={20} />{DICT.basicInfo}</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Product Title *" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="col-span-2 px-4 py-2 border rounded" />
            <input placeholder="SKU" value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="HSN Code" value={form.hsn_code} onChange={e => setForm({...form, hsn_code: e.target.value})} className="px-4 py-2 border rounded" />
            <input type="number" placeholder="Selling Price (₹) *" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="px-4 py-2 border rounded" min="0" step="0.01" />
            <input type="number" placeholder="MRP (₹) *" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} className="px-4 py-2 border rounded" min="0" step="0.01" />
          </div>
        </section>

        {/* Category */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Category</h2>
          <div className="grid grid-cols-3 gap-4">
            <select value={form.main_category} onChange={e => setForm({...form, main_category: e.target.value, sub_category: '', item_type: ''})} className="px-4 py-2 border rounded">
              <option value="">Main Category *</option>
              <option value="Baby">Baby</option>
              <option value="Kids">Kids</option>
            </select>
            <select value={form.sub_category} onChange={e => setForm({...form, sub_category: e.target.value, item_type: ''})} className="px-4 py-2 border rounded" disabled={!form.main_category}>
              <option value="">Sub Category *</option>
              {subCategories.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
            <select value={form.item_type} onChange={e => setForm({...form, item_type: e.target.value})} className="px-4 py-2 border rounded" disabled={!form.sub_category}>
              <option value="">Item Type *</option>
              {itemTypes.map(it => <option key={it} value={it}>{it}</option>)}
            </select>
          </div>
        </section>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Description</h2>
          <textarea placeholder="Product description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={4} className="w-full px-4 py-2 border rounded" />
        </section>

        {/* Attributes */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Attributes</h2>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Fabric" value={form.fabric} onChange={e => setForm({...form, fabric: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="Pattern" value={form.pattern} onChange={e => setForm({...form, pattern: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="Neck Type" value={form.neck_type} onChange={e => setForm({...form, neck_type: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="Closure Type" value={form.closure_type} onChange={e => setForm({...form, closure_type: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="Length Type" value={form.length_type} onChange={e => setForm({...form, length_type: e.target.value})} className="px-4 py-2 border rounded" />
            <label className="flex items-center gap-2 px-4 py-2">
              <input type="checkbox" checked={form.belt_included} onChange={e => setForm({...form, belt_included: e.target.checked})} />
              Belt Included
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <input placeholder="Manufacturer Details" value={form.manufacturer_details} onChange={e => setForm({...form, manufacturer_details: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="Origin Country" value={form.origin_country} onChange={e => setForm({...form, origin_country: e.target.value})} className="px-4 py-2 border rounded" />
            <input placeholder="Care Instructions" value={form.care_instructions} onChange={e => setForm({...form, care_instructions: e.target.value})} className="col-span-2 px-4 py-2 border rounded" />
          </div>
        </section>

        {/* Sizes & Colors */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Sizes & Colors</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {SIZES.map(s => (
                <button key={s} type="button" onClick={() => setForm(f => ({...f, sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s]}))} className={`px-3 py-1 rounded ${form.sizes.includes(s) ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Available Colors (comma-separated)</label>
            <input placeholder="e.g. Red, Blue, Green" value={form.colors.join(', ')} onChange={e => setForm({...form, colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)})} className="w-full px-4 py-2 border rounded" />
          </div>
        </section>

        {/* Variants */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
            Variants (Stock Management)
            <button type="button" onClick={addVariant} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm"><Plus size={16} />Add Variant</button>
          </h2>
          {form.variants.length === 0 ? (
            <div className="border rounded p-8 text-center text-gray-500 text-sm">
              No variants added yet. Add colors and sizes first, then create variants.
            </div>
          ) : (
            <div className="border rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr><th className="px-4 py-2 text-left">Color</th><th className="px-4 py-2 text-left">Size</th><th className="px-4 py-2 text-left">Stock</th><th className="px-4 py-2 text-left">SKU</th><th className="px-4 py-2"></th></tr>
                </thead>
                <tbody>
                  {form.variants.map((v, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{v.color}</td>
                      <td className="px-4 py-2">{v.size}</td>
                      <td className="px-4 py-2">{v.stock}</td>
                      <td className="px-4 py-2">{v.sku}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => editVariant(i)} className="text-blue-600 hover:text-blue-700">
                            <Edit size={16} />
                          </button>
                          <button type="button" onClick={() => deleteVariant(i)} className="text-red-600 hover:text-red-700">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Images */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Product Images</h2>
          <div className="grid grid-cols-4 gap-4">
            {form.image_urls.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-full h-32 object-cover rounded" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  {i > 0 && (
                    <button type="button" onClick={() => moveImage(i, 'left')} className="bg-white text-gray-700 p-1.5 rounded hover:bg-gray-100">
                      ←
                    </button>
                  )}
                  <button type="button" onClick={() => removeImage(url)} className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700"><X size={16} /></button>
                  {i < form.image_urls.length - 1 && (
                    <button type="button" onClick={() => moveImage(i, 'right')} className="bg-white text-gray-700 p-1.5 rounded hover:bg-gray-100">
                      →
                    </button>
                  )}
                </div>
                {i === 0 && <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">Primary</span>}
              </div>
            ))}
            <label className="border-2 border-dashed rounded h-32 flex items-center justify-center cursor-pointer hover:bg-gray-50">
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              {uploading ? <div className="text-sm text-gray-500">Uploading...</div> : <Upload size={24} className="text-gray-400" />}
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">First image will be the primary image. Max 8MB per image.</p>
        </section>

        {/* Publish Settings */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Publish Settings</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={e => setForm({...form, is_featured: e.target.checked})} />Featured Product</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_new_arrival} onChange={e => setForm({...form, is_new_arrival: e.target.checked})} />New Arrival</label>
            <div className="grid grid-cols-2 gap-4">
              <select value={form.homepage_section} onChange={e => setForm({...form, homepage_section: e.target.value})} className="px-4 py-2 border rounded">
                <option value="">Homepage Section</option>
                <option value="section1">Section 1</option>
                <option value="section2">Section 2</option>
                <option value="section3">Section 3</option>
              </select>
              <input type="number" placeholder="Card Slot (1-8)" value={form.homepage_card_slot || ''} onChange={e => setForm({...form, homepage_card_slot: e.target.value ? parseInt(e.target.value, 10) : null})} className="px-4 py-2 border rounded" min="1" max="8" />
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button type="button" onClick={() => handleSubmit(true)} disabled={loading} className="flex items-center gap-2 px-6 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><Save size={18} />Save as Draft</button>
          <button type="button" onClick={() => handleSubmit(false)} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Saving...' : <><Eye size={18} />Publish</>}
          </button>
        </div>
        </>
        )}
      </div>

      {/* Variant Drawer */}
      {variantDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">{editingVariantIndex !== null ? 'Edit Variant' : 'Add Variant'}</h3>
            <div className="space-y-4">
              <select value={currentVariant?.color || ''} onChange={e => setCurrentVariant({...currentVariant, color: e.target.value})} className="w-full px-4 py-2 border rounded">
                <option value="">Select Color *</option>
                {form.colors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={currentVariant?.size || ''} onChange={e => setCurrentVariant({...currentVariant, size: e.target.value})} className="w-full px-4 py-2 border rounded">
                <option value="">Select Size *</option>
                {form.sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="number" placeholder="Stock Quantity *" value={currentVariant?.stock || 0} onChange={e => setCurrentVariant({...currentVariant, stock: Math.max(0, parseInt(e.target.value, 10) || 0)})} className="w-full px-4 py-2 border rounded" min="0" />
              <input placeholder="Variant SKU (optional)" value={currentVariant?.sku || ''} onChange={e => setCurrentVariant({...currentVariant, sku: e.target.value})} className="w-full px-4 py-2 border rounded" />
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setVariantDrawer(false); setCurrentVariant(null); setEditingVariantIndex(null); }} className="flex-1 px-4 py-2 border rounded">Cancel</button>
              <button type="button" onClick={saveVariant} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded">Save Variant</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
