"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, Edit, Trash2, RefreshCcw, Package } from "lucide-react";
import Link from "next/link";
import { safeFetch, safeId } from "@/lib/safeFetch";

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("adminToken") || getCookie('adminToken');
    try {
      const res = await safeFetch(`/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data.map(p => ({
        ...p,
        image_urls: (() => { try { return typeof p.image_urls === "string" ? JSON.parse(p.image_urls) : (p.image_urls || []); } catch { return []; } })()
      })));
    } catch (err) {
      setError('Failed to load products: ' + err.message);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // Fetch CSRF token once on mount
    safeFetch(`/api/csrf-token`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setCsrfToken(data.csrfToken))
      .catch(err => setError('Failed to initialize security'));

    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this product from the storefront?")) return;
    setError('');
    const token = localStorage.getItem("adminToken") || getCookie('adminToken');
    try {
      const res = await safeFetch(`/api/products/${safeId(id)}`, {
        method: "DELETE",
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json",
          'x-csrf-token': csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ confirm: "DELETE" })
      });
      if (!res.ok) throw new Error('Failed to delete product');
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
    } catch (err) {
      setError('Failed to delete product: ' + err.message);
    }
  };

  const handleRestore = async (id) => {
    setError('');
    const token = localStorage.getItem("adminToken") || getCookie('adminToken');
    try {
      const res = await safeFetch(`/api/products/${safeId(id)}/restore`, {
        method: "PUT",
        credentials: "include",
        headers: { 
          Authorization: `Bearer ${token}`,
          'x-csrf-token': csrfToken
        }
      });
      if (!res.ok) throw new Error('Failed to restore product');
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: true } : p));
    } catch (err) {
      setError('Failed to restore product: ' + err.message);
    }
  };

  const getTotalStock = (variants) => {
    try {
      const v = typeof variants === "string" ? JSON.parse(variants) : (variants || []);
      return v.reduce((s, vv) => s + (parseInt(vv.stock) || 0), 0);
    } catch { return 0; }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    if (!q) return true;
    if ((p.title || "").toLowerCase().includes(q)) return true;
    if ((p.sku || "").toLowerCase().includes(q)) return true;
    try {
      const v = typeof p.variants === "string" ? JSON.parse(p.variants) : (p.variants || []);
      return v.some(vv => (vv.sku || "").toLowerCase().includes(q));
    } catch { return false; }
  });

  return (
    <div className="max-w-7xl mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Inventory Management</h1>
          <p className="text-[13px] text-slate-500">Search by title, base SKU, or variant SKU.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 text-[12px] rounded-xl border border-slate-200 outline-none focus:border-blue-500 w-56" />
          </div>
          <button onClick={fetchProducts} className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50">
            <RefreshCcw size={16} className={loading ? "animate-spin text-slate-400" : "text-slate-500"} />
          </button>
          <Link href="/admin/products/new" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[12px] font-bold tracking-wider hover:bg-blue-700 transition-colors whitespace-nowrap">
            + Add Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 border-slate-200">
                {["Preview", "Product", "Price", "Stock", "Category", "Actions"].map((h, i) => (
                  <th key={h} className={`p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500 ${i === 5 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-12 text-center text-[13px] text-slate-400">Loading products...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-16 text-center">
                    <Package className="mx-auto mb-4 text-slate-300" size={32} />
                    <p className="text-[14px] text-slate-500">No products found.</p>
                  </td>
                </tr>
              ) : filtered.map(product => {
                const stock = getTotalStock(product.variants);
                const isOut = stock === 0;
                const isLow = stock > 0 && stock < 10;
                const stockColor = isOut ? "bg-red-50 text-red-700 border-red-200" : isLow ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200";
                return (
                  <tr key={product.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${!product.is_active ? "opacity-60" : ""}`}>
                    <td className="p-5">
                      <div className="w-14 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative">
                        {product.image_urls?.[0] && <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover" />}
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-[14px] font-bold text-slate-800">{product.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 uppercase tracking-wider">SKU: {product.sku || "N/A"}</p>
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {product.is_draft && <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border bg-slate-100 text-slate-600 border-slate-200">Draft</span>}
                        {!product.is_active && <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border bg-red-50 text-red-600 border-red-200">Delisted</span>}
                        {product.is_featured && <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border bg-blue-50 text-blue-600 border-blue-200">Homepage</span>}
                        {product.is_new_arrival && <span className="px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border bg-purple-50 text-purple-600 border-purple-200">New</span>}
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="text-[15px] font-bold text-slate-800">₹{parseFloat(product.price).toFixed(2)}</span>
                      {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                        <span className="block text-[12px] line-through text-slate-400">₹{parseFloat(product.mrp).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="p-5">
                      <span className={`px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase border rounded-md ${stockColor}`}>
                        {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1.5">{stock} units</p>
                    </td>
                    <td className="p-5">
                      <p className="text-[13px] font-medium text-slate-800">{product.main_category}</p>
                      <p className="text-[11px] text-slate-500">{product.sub_category}</p>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        {!product.is_active ? (
                          <button onClick={() => handleRestore(product.id)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
                            Restore
                          </button>
                        ) : (
                          <>
                            <Link href={`/admin/products/new?id=${product.id}`}
                              className="p-2.5 rounded-lg border border-transparent text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-colors">
                              <Edit size={17} />
                            </Link>
                            <button onClick={() => handleDelete(product.id)}
                              className="p-2.5 rounded-lg border border-transparent text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors">
                              <Trash2 size={17} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
