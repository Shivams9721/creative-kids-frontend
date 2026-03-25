"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, PackagePlus, ListOrdered, CheckCircle2, Package, TrendingUp,
  Wand2, Trash2, Edit, Tag, LogOut, ShieldAlert, RefreshCcw, Search, X,
  Image as ImageIcon, Menu, UploadCloud, MessageCircle, AlertTriangle, Barcode,
  ShoppingBag, Printer, Command, LayoutGrid, List, Filter, Sun, Moon, Layers, BarChart2, Ticket
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import VariantDrawer from "@/components/VariantDrawer";
import { csrfHeaders } from "@/lib/csrf";

const API = process.env.NEXT_PUBLIC_API_URL;

const COLOR_HEX_MAP = {
  Black:'#000000', White:'#FFFFFF', Beige:'#F5F5DC', Blue:'#4A90E2', Pink:'#E2889D',
  Red:'#D32F2F', Green:'#2E7D32', Yellow:'#FBC02D', Grey:'#9E9E9E', Orange:'#FF6B35',
  Purple:'#7B2D8B', Brown:'#795548', Navy:'#1A237E', Maroon:'#880E4F'
};

const CATEGORY_TREE = {
  "Baby": {
    "Baby Boy": ["Onesies & Rompers", "T-Shirts & Sweatshirts", "Shirts", "Bottomwear", "Clothing Sets"],
    "Baby Girl": ["Onesies & Rompers", "Tops & Tees", "Dresses", "Bottomwear", "Clothing Sets"]
  },
  "Kids": {
    "Boys Clothing": ["T-Shirts", "Shirts", "Jeans", "Trousers & Joggers", "Shorts", "Co-ord Sets", "Sweatshirts"],
    "Girls Clothing": ["Tops & Tees", "Dresses", "Co-ords & Jumpsuits", "Jeans Joggers & Trousers", "Shorts, Skirts & Skorts"]
  }
};

const DEFAULT_FORM_STATE = {
  title: "", price: "", mrp: "", sku: "", hsn_code: "",
  main_category: "Baby", sub_category: "Baby Boy", item_type: "Onesies & Rompers",
  fabric: "", pattern: "", neck_type: "", belt_included: false,
  closure_type: "", length_type: "",
  image_urls: [], sizes: [], colors: [],
  description: "", manufacturer_details: "", care_instructions: "Machine Wash", origin_country: "India",
  variants: [],
  is_featured: false, is_new_arrival: false, homepage_section: "None", homepage_card_slot: "1", is_draft: false,
  extra_categories: [],
  color_images: {},
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('adminDarkMode') === 'true';
    return false;
  });

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('adminActiveTab') || 'dashboard';
    return 'dashboard';
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [stats, setStats] = useState({ totalRevenue: 0, activeOrders: 0, totalProducts: 0, todayOrders: 0, todayRevenue: 0, lowStockProducts: 0 });
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderView, setOrderView] = useState("table");
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  const [shippingForm, setShippingForm] = useState(null);

  const [allProducts, setAllProducts] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [editingId, setEditingId] = useState(() => {
    if (typeof window !== 'undefined') { const id = localStorage.getItem('adminEditingId'); return id ? parseInt(id) : null; }
    return null;
  });

  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      try { const saved = localStorage.getItem('adminFormDraft'); return saved ? JSON.parse(saved) : DEFAULT_FORM_STATE; } catch (e) {}
    }
    return DEFAULT_FORM_STATE;
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragSrcIndex = React.useRef(null);
  const [isVariantDrawerOpen, setIsVariantDrawerOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [analyticsData, setAnalyticsData] = useState({ revenue: [], topProducts: [], funnel: [] });
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });

  // Persist
  useEffect(() => { localStorage.setItem('adminFormDraft', JSON.stringify(formData)); }, [formData]);
  useEffect(() => { localStorage.setItem('adminActiveTab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('adminDarkMode', darkMode); }, [darkMode]);
  useEffect(() => {
    if (editingId) localStorage.setItem('adminEditingId', editingId);
    else localStorage.removeItem('adminEditingId');
  }, [editingId]);

  // Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setIsCommandOpen(true); }
      if (e.key === 'Escape') setIsCommandOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auth
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) { window.location.href = "/admin/login"; }
    else { setIsAuthenticated(true); setAuthChecking(false); }
  }, []);

  const fetchAdminOrders = useCallback(async () => {
    setIsRefreshingOrders(true);
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/api/admin/orders`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setIsRefreshingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("adminToken");
    if (activeTab === "dashboard") {
      fetch(`${API}/api/admin/stats/full`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setStats).catch(console.error);
    } else if (activeTab === "orders") {
      fetchAdminOrders();
    } else if (activeTab === "products") {
      fetch(`${API}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setAllProducts(data.map(p => ({
          ...p,
          image_urls: (() => { try { return typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (p.image_urls || []); } catch (e) { return []; } })()
        }))))
        .catch(console.error);
    } else if (activeTab === "analytics") {
      Promise.all([
        fetch(`${API}/api/admin/analytics/revenue`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API}/api/admin/analytics/top-products`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch(`${API}/api/admin/analytics/order-funnel`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      ]).then(([revenue, topProducts, funnel]) => {
        setAnalyticsData({ revenue: Array.isArray(revenue) ? revenue : [], topProducts: Array.isArray(topProducts) ? topProducts : [], funnel: Array.isArray(funnel) ? funnel : [] });
      }).catch(console.error);
    } else if (activeTab === "coupons") {
      fetch(`${API}/api/admin/coupons`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(data => setCoupons(Array.isArray(data) ? data : [])).catch(console.error);
    }
  }, [activeTab, isAuthenticated, fetchAdminOrders]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  }, []);

  const handleNavClick = useCallback((tabId) => {
    setActiveTab(tabId);
    setEditingId(null);
    if (tabId !== "add_product") {
      setFormData(DEFAULT_FORM_STATE);
      localStorage.removeItem('adminFormDraft');
      localStorage.removeItem('adminEditingId');
    }
    setIsMobileMenuOpen(false);
  }, []);

  const submitShippingUpdate = useCallback(async () => {
    if (!shippingForm) return;
    const { orderId, newStatus, courier, awb } = shippingForm;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, courier_name: courier, awb_number: awb })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, courier_name: courier, awb_number: awb } : o));
        setShippingForm(null);
      } else { alert("Failed to update status."); }
    } catch (err) { console.error(err); }
  }, [shippingForm]);

  const updateOrderStatus = useCallback(async (orderId, newStatus, courierName, awbNumber) => {
    if (newStatus === 'Shipped') {
      setShippingForm({ orderId, newStatus, courier: courierName || '', awb: awbNumber || '' });
      return;
    }
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: await csrfHeaders({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, courier_name: courierName, awb_number: awbNumber })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, courier_name: courierName, awb_number: awbNumber } : o));
      } else { alert("Failed to update status on server."); }
    } catch (err) { console.error(err); }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === "checkbox" ? checked : value };
      if (name === "main_category") {
        const firstSub = Object.keys(CATEGORY_TREE[value])[0];
        newData.sub_category = firstSub;
        newData.item_type = CATEGORY_TREE[value][firstSub][0];
      }
      if (name === "sub_category") {
        newData.item_type = CATEGORY_TREE[prev.main_category][value][0];
      }
      return newData;
    });
  }, []);

  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingImage(true);
    setUploadProgress({ done: 0, total: files.length });
    const token = localStorage.getItem("adminToken");
    const uploadOne = async (file) => {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        headers: await csrfHeaders({ Authorization: `Bearer ${token}` }),
        credentials: 'include',
        body: fd
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadProgress(p => ({ ...p, done: p.done + 1 }));
        return data.imageUrl;
      }
      return null;
    };
    try {
      const urls = await Promise.all(files.map(uploadOne));
      const valid = urls.filter(Boolean);
      if (valid.length) setFormData(prev => ({ ...prev, image_urls: [...prev.image_urls, ...valid] }));
      if (valid.length < files.length) alert(`${files.length - valid.length} image(s) failed to upload.`);
    } catch (err) { alert("An error occurred while uploading."); }
    finally { setUploadingImage(false); setUploadProgress({ done: 0, total: 0 }); e.target.value = ""; }
  }, []);

  const removeImageUrl = useCallback(async (indexToRemove) => {
    const urlToDelete = formData.image_urls[indexToRemove];
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`${API}/api/upload`, {
        method: "DELETE",
        headers: await csrfHeaders({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
        credentials: 'include',
        body: JSON.stringify({ imageUrl: urlToDelete })
      });
    } catch (err) { console.error("Failed to delete image from S3:", err); }
    setFormData(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, idx) => idx !== indexToRemove) }));
  }, [formData.image_urls]);

  // variant summary helper — groups variants by color for the summary table
  const getVariantSummary = useCallback(() => {
    const map = {};
    formData.variants.forEach(v => {
      const key = v.color || 'Default';
      if (!map[key]) map[key] = { sizes: new Set(), stock: 0 };
      if (v.size && v.size !== 'Default') map[key].sizes.add(v.size);
      map[key].stock += parseInt(v.stock) || 0;
    });
    return Object.entries(map).map(([color, data]) => ({ color, sizeCount: data.sizes.size, stock: data.stock }));
  }, [formData.variants]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.variants.length === 0) { alert("Please generate at least one item in the Inventory Matrix!"); return; }
    if (formData.image_urls.length === 0) { alert("Please upload at least one Product Image!"); return; }
    setLoading(true);
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      mrp: formData.mrp ? parseFloat(formData.mrp) : parseFloat(formData.price),
      sizes: [...new Set(formData.variants.map(v => v.size))].filter(s => s !== "Default"),
      colors: [...new Set(formData.variants.map(v => v.color))].filter(c => c !== "Default"),
      homepage_section: formData.is_featured ? formData.homepage_section : "None",
      homepage_card_slot: formData.is_featured ? parseInt(formData.homepage_card_slot) : null,
    };
    try {
      const url = editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`;
      const token = localStorage.getItem("adminToken");
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: await csrfHeaders({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess(true);
        setFormData(DEFAULT_FORM_STATE);
        setEditingId(null);
        localStorage.removeItem('adminFormDraft');
        localStorage.removeItem('adminEditingId');
        window.scrollTo(0, 0);
        setTimeout(() => { setSuccess(false); setActiveTab("products"); }, 2000);
      } else { alert("Failed to save product."); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleEdit = useCallback((product) => {
    let parsedVariants = [], parsedImages = [];
    try { parsedVariants = typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []); } catch (e) {}
    try { parsedImages = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : (product.image_urls || []); } catch (e) {}
    setFormData({
      title: product.title || "", price: product.price || "", mrp: product.mrp || "",
      sku: product.sku || "", hsn_code: product.hsn_code || "",
      main_category: product.main_category || "Baby", sub_category: product.sub_category || "Baby Boy",
      item_type: product.item_type || "Onesies & Rompers",
      fabric: product.fabric || "", pattern: product.pattern || "", neck_type: product.neck_type || "",
      belt_included: product.belt_included || false,
      closure_type: product.closure_type || "", length_type: product.length_type || "",
      image_urls: parsedImages, sizes: [], colors: [],
      description: product.description || "", manufacturer_details: product.manufacturer_details || "",
      care_instructions: product.care_instructions || "", origin_country: product.origin_country || "India",
      variants: parsedVariants,
      is_featured: product.is_featured || false, is_new_arrival: product.is_new_arrival || false,
      homepage_section: product.homepage_section || "None",
      homepage_card_slot: product.homepage_card_slot ? String(product.homepage_card_slot) : "1",
      is_draft: product.is_draft || false,
      extra_categories: (() => { try { return typeof product.extra_categories === 'string' ? JSON.parse(product.extra_categories) : (product.extra_categories || []); } catch(e) { return []; } })(),
      color_images: (() => { try { return typeof product.color_images === 'string' ? JSON.parse(product.color_images) : (product.color_images || {}); } catch(e) { return {}; } })()
    });
    setEditingId(product.id);
    setActiveTab("add_product");
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/api/products/${id}`, {
        method: "DELETE",
        credentials: 'include',
        headers: await csrfHeaders({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
        body: JSON.stringify({ confirm: "DELETE" })
      });
      if (res.ok) setAllProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
      else alert("Failed to delete product.");
    } catch (err) { console.error(err); }
  }, []);

  const handleRestore = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await fetch(`${API}/api/products/${id}/restore`, {
        method: "PUT",
        credentials: 'include',
        headers: await csrfHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) setAllProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: true } : p));
      else alert("Failed to restore product.");
    } catch (err) { console.error(err); }
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData(DEFAULT_FORM_STATE);
    localStorage.removeItem('adminFormDraft');
    localStorage.removeItem('adminEditingId');
    setActiveTab("products");
  }, []);

  // Helpers
  const getStatusColor = (status) => {
    const dm = darkMode;
    switch (status) {
      case "Processing": return dm ? "bg-blue-900/60 text-blue-300 border-blue-700" : "bg-blue-50 text-blue-700 border-blue-200";
      case "Shipped": return dm ? "bg-purple-900/60 text-purple-300 border-purple-700" : "bg-purple-50 text-purple-700 border-purple-200";
      case "Delivered": return dm ? "bg-emerald-900/60 text-emerald-300 border-emerald-700" : "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Cancelled": return dm ? "bg-red-900/60 text-red-300 border-red-700" : "bg-red-50 text-red-700 border-red-200";
      default: return dm ? "bg-slate-800 text-slate-300 border-slate-600" : "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const calculateTotalStock = (variants) => {
    try {
      const parsed = typeof variants === 'string' ? JSON.parse(variants) : (variants || []);
      return parsed.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    } catch (e) { return 0; }
  };

  const getColorHex = (colorName) => COLOR_HEX_MAP[colorName] || '#94a3b8';

  const getVariantSku = (item) => {
    if (item.sku) return item.sku;
    const color = item.color || item.selectedColor;
    const size = item.size || item.selectedSize;
    const parts = [item.baseSku || ''].filter(Boolean);
    if (color && color !== 'Default') parts.push(color.toUpperCase().replace(/\s+/g, ''));
    if (size && size !== 'Default') parts.push(size.toUpperCase().replace(/\s+/g, ''));
    return parts.join('-') || 'N/A';
  };

  // Filtered lists
  const filteredOrders = orders.filter(o => {
    const q = orderSearch.toLowerCase();
    const matchesSearch = !orderSearch ||
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.phone || '').toLowerCase().includes(q);
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProducts = allProducts.filter(product => {
    const q = inventorySearch.toLowerCase();
    if (!q) return true;
    if (product.title?.toLowerCase().includes(q)) return true;
    if (product.sku?.toLowerCase().includes(q)) return true;
    try {
      const variants = typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []);
      return variants.some(v => v.sku?.toLowerCase().includes(q));
    } catch (e) { return false; }
  });

  const commandResults = [];
  if (commandSearch.length > 1) {
    const q = commandSearch.toLowerCase();
    orders.forEach(o => {
      if (o.order_number?.toLowerCase().includes(q) || o.customer_name?.toLowerCase().includes(q) || o.phone?.includes(q))
        commandResults.push({ type: 'order', data: o });
    });
    allProducts.forEach(p => {
      if (p.title?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
        commandResults.push({ type: 'product', data: p });
    });
  }

  const orderCounts = { All: orders.length, Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0 };
  orders.forEach(o => { if (orderCounts[o.status] !== undefined) orderCounts[o.status]++; });

  // Shared input class
  const inp = `border p-3.5 rounded-xl text-[14px] outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-400' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'}`;
  const card = `rounded-2xl border shadow-sm ${darkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`;
  const label = `text-[11px] font-bold tracking-widest uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`;

  if (authChecking) return (
    <div className="fixed inset-0 z-[100] bg-[#0a0f1e] flex items-center justify-center">
      <span className="text-white/50 animate-pulse tracking-widest text-sm">Verifying Access...</span>
    </div>
  );

  return (
    <div className={darkMode ? 'dark' : ''}>
    <div className={`fixed inset-0 z-[100] min-h-screen flex flex-col md:flex-row overflow-hidden font-sans print:bg-white print:z-0 print:static print:h-auto print:overflow-visible transition-colors duration-300 ${darkMode ? 'bg-[#0a0f1e]' : 'bg-slate-100'}`}>

      {/* MOBILE HEADER */}
      <div className={`md:hidden text-white p-4 flex justify-between items-center z-30 shadow-md print:hidden ${darkMode ? 'bg-[#0d1424]' : 'bg-[#0f172a]'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><ShieldAlert size={16} /></div>
          <h2 className="text-sm font-bold tracking-widest uppercase">Workspace</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(d => !d)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden" />
        )}
      </AnimatePresence>

      {/* SIDEBAR — glassmorphism in dark, solid in light */}
      <motion.aside
        initial={false}
        animate={{ x: isMobileMenuOpen ? 0 : undefined }}
        className={`absolute md:relative top-0 left-0 h-full w-72 flex-shrink-0 flex flex-col overflow-y-auto border-r shadow-2xl z-40 print:hidden max-md:transition-transform max-md:duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${darkMode ? 'bg-white/5 backdrop-blur-2xl border-white/10 text-slate-300' : 'bg-[#0f172a] border-slate-800 text-slate-300'}`}>
        <div className="p-8 pb-4">
          <div className="hidden md:flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><ShieldAlert size={16} className="text-white" /></div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-white">Workspace</h2>
            </div>
            <button onClick={() => setDarkMode(d => !d)}
              className={`p-2 rounded-xl transition-colors ${darkMode ? 'bg-white/10 text-yellow-300 hover:bg-white/20' : 'bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white'}`}
              title="Toggle dark mode">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <nav className="flex flex-col gap-2 mt-4 md:mt-0">
            {[
              { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview' },
              { id: 'orders', icon: <ListOrdered size={18} />, label: 'Orders' },
              { id: 'products', icon: <Tag size={18} />, label: 'Inventory' },
              { id: 'add_product', icon: <PackagePlus size={18} />, label: 'List Product' },
              { id: 'analytics', icon: <BarChart2 size={18} />, label: 'Analytics' },
              { id: 'coupons', icon: <Ticket size={18} />, label: 'Coupons' },
            ].map(item => (
              <motion.button key={item.id} onClick={() => handleNavClick(item.id)}
                whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`flex items-center gap-3 px-4 py-3.5 text-[12px] font-semibold tracking-wider transition-all rounded-xl ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'hover:text-white hover:bg-white/10'}`}>
                {item.icon} {item.label}
              </motion.button>
            ))}
            <div className="mt-6 mb-2">
              <p className={`px-4 text-[10px] font-bold tracking-widest uppercase mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Shortcuts</p>
              <button onClick={() => setIsCommandOpen(true)} className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-semibold tracking-wider transition-all rounded-xl text-slate-400 hover:text-white hover:bg-white/10 w-full text-left">
                <Command size={18} /> Cmd Center <kbd className={`ml-auto px-2 py-0.5 rounded text-[9px] border ${darkMode ? 'bg-white/10 border-white/20 text-slate-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Ctrl+K</kbd>
              </button>
            </div>
          </nav>
        </div>
        <div className={`mt-auto p-8 border-t ${darkMode ? 'border-white/10' : 'border-slate-800'}`}>
          <motion.button whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }} onClick={handleLogout} className="flex items-center gap-3 text-[12px] font-semibold tracking-wider text-slate-400 hover:text-white transition-colors w-full">
            <LogOut size={18} /> Secure Logout
          </motion.button>
        </div>
      </motion.aside>

      {/* COMMAND CENTER */}
      <AnimatePresence>
        {isCommandOpen && (
          <div className="fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-md flex items-start justify-center pt-[10vh] print:hidden" onClick={() => setIsCommandOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
              onClick={e => e.stopPropagation()}
              className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden mx-4 border ${darkMode ? 'bg-[#0d1424]/90 backdrop-blur-2xl border-white/10' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center gap-3 p-4 border-b ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                <Search className={darkMode ? 'text-slate-400' : 'text-slate-400'} />
                <input autoFocus type="text" placeholder="Search orders, products, SKUs..." value={commandSearch}
                  onChange={e => setCommandSearch(e.target.value)}
                  className={`w-full outline-none text-[15px] bg-transparent ${darkMode ? 'text-white placeholder-white/30' : 'text-slate-800 placeholder-slate-400'}`} />
                <div className={`text-[10px] font-bold px-2 py-1 rounded ${darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>ESC</div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {commandSearch.length < 2 ? (
                  <div className={`p-8 text-center text-[13px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Type at least 2 characters to search.</div>
                ) : commandResults.length === 0 ? (
                  <div className={`p-8 text-center text-[13px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No results for "{commandSearch}"</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {commandResults.map((res, i) => (
                      <div key={i} onClick={() => {
                        setIsCommandOpen(false);
                        if (res.type === 'order') { setActiveTab('orders'); setOrderSearch(res.data.order_number); setExpandedOrder(res.data.id); setOrderView('table'); }
                        else { setActiveTab('products'); setInventorySearch(res.data.sku || res.data.title); }
                      }} className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-colors border border-transparent ${darkMode ? 'hover:bg-white/5 hover:border-white/10' : 'hover:bg-slate-50 hover:border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${res.type === 'order' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                            {res.type === 'order' ? <Package size={16} /> : <Tag size={16} />}
                          </div>
                          <div>
                            <p className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{res.type === 'order' ? res.data.order_number : res.data.title}</p>
                            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{res.type === 'order' ? `Customer: ${res.data.customer_name}` : `SKU: ${res.data.sku || 'N/A'}`}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{res.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-y-auto print:p-0">

        {/* DASHBOARD TAB */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <h1 className={`text-2xl font-bold mb-8 tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Business Overview</h1>
            {stats.lowStockProducts > 0 && (
              <div className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-xl border ${darkMode ? 'bg-amber-900/20 border-amber-700/40 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <AlertTriangle size={18} className="flex-shrink-0 animate-pulse" />
                <p className="text-[13px] font-bold">{stats.lowStockProducts} product{stats.lowStockProducts > 1 ? 's are' : ' is'} running low on stock.{' '}
                  <button onClick={() => handleNavClick('products')} className="underline">View Inventory →</button>
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {/* Glass stat cards */}
              <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className={`p-6 rounded-2xl border col-span-2 md:col-span-1 shadow-lg cursor-default ${darkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={label}>Total Revenue</span>
                  <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}><TrendingUp size={20} className="text-emerald-500" /></div>
                </div>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>₹{(stats.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                <p className="text-[11px] text-emerald-500 font-bold mt-2">Today: ₹{(stats.todayRevenue || 0).toLocaleString()}</p>
              </motion.div>
              <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className={`p-6 rounded-2xl border shadow-lg cursor-default ${darkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={label}>Active Orders</span>
                  <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}><Package size={20} className="text-blue-500" /></div>
                </div>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.activeOrders}</h3>
                <p className="text-[11px] text-blue-500 font-bold mt-2">Today: {stats.todayOrders || 0} new</p>
              </motion.div>
              <motion.div whileHover={{ y: -4, scale: 1.01 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className={`p-6 rounded-2xl border shadow-lg cursor-default ${darkMode ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={label}>Total Products</span>
                  <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-50'}`}><ShoppingBag size={20} className="text-purple-500" /></div>
                </div>
                <h3 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{stats.totalProducts}</h3>
                {stats.lowStockProducts > 0 && <p className="text-[11px] text-amber-500 font-bold mt-2">{stats.lowStockProducts} low stock</p>}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto print:max-w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
              <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Order Management</h1>
              <div className="flex items-center gap-3 print:hidden">
                <div className={`flex p-1 rounded-xl border shadow-sm ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <button onClick={() => setOrderView('table')} className={`p-1.5 rounded-lg transition-colors ${orderView === 'table' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}><List size={16} /></button>
                  <button onClick={() => setOrderView('kanban')} className={`p-1.5 rounded-lg transition-colors ${orderView === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16} /></button>
                </div>
                <button onClick={fetchAdminOrders} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-colors shadow-sm border ${darkMode ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <RefreshCcw size={14} className={isRefreshingOrders ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4 print:hidden">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search by order #, customer name, or phone..." value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className={`w-full text-[13px] rounded-xl pl-11 pr-4 py-3.5 outline-none border shadow-sm ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-400' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'}`} />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 print:hidden">
              {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                <button key={status} onClick={() => setOrderStatusFilter(status)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold tracking-wider whitespace-nowrap transition-all border ${orderStatusFilter === status
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                    : darkMode ? 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20 hover:text-white' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                  <Filter size={11} />
                  {status}
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${orderStatusFilter === status ? 'bg-white/20 text-white' : darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {orderCounts[status]}
                  </span>
                </button>
              ))}
            </div>

            {/* Inline Shipping Modal */}
            <AnimatePresence>
              {shippingForm && (
                <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-2xl shadow-2xl p-6 w-full max-w-md border ${darkMode ? 'bg-[#0d1424]/95 backdrop-blur-2xl border-white/10' : 'bg-white border-slate-200'}`}>
                    <h3 className={`text-[14px] font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Mark as Shipped</h3>
                    <p className={`text-[12px] mb-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enter courier details for this order.</p>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className={`${label} block mb-1.5`}>Courier Name</label>
                        <input type="text" placeholder="e.g. Delhivery, BlueDart" value={shippingForm.courier}
                          onChange={e => setShippingForm(prev => ({ ...prev, courier: e.target.value }))}
                          className={inp} />
                      </div>
                      <div>
                        <label className={`${label} block mb-1.5`}>AWB / Tracking Number</label>
                        <input type="text" placeholder="e.g. 1234567890" value={shippingForm.awb}
                          onChange={e => setShippingForm(prev => ({ ...prev, awb: e.target.value }))}
                          className={inp} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setShippingForm(null)} className={`flex-1 py-3 rounded-xl border text-[12px] font-bold transition-colors ${darkMode ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
                      <button onClick={submitShippingUpdate} className="flex-1 py-3 rounded-xl bg-purple-600 text-white text-[12px] font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20">Confirm Shipped</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {orderView === "table" ? (
              <div className={`${card} print:border-none`}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        {['Order ID','Date','Customer','Amount','Status','Details'].map((h, i) => (
                          <th key={h} className={`p-5 text-[11px] font-bold tracking-widest uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${i === 5 ? 'text-right print:hidden' : ''} ${i >= 4 ? 'print:hidden' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.length === 0 ? (
                        <tr><td colSpan="6" className={`p-12 text-center text-[13px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No orders match your search.</td></tr>
                      ) : filteredOrders.map(order => (
                        <React.Fragment key={order.id}>
                          <tr className={`border-b transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <td className={`p-5 text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{order.order_number}</td>
                            <td className={`p-5 text-[13px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className={`p-5 text-[13px] font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {order.customer_name}
                              <span className={`block text-[11px] font-normal mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{order.phone}</span>
                            </td>
                            <td className={`p-5 text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                              ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                              <span className={`text-[11px] font-normal ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>({order.items_count} items)</span>
                            </td>
                            <td className="p-5 print:hidden">
                              <div className="flex flex-col gap-2">
                                <select value={order.status}
                                  onChange={e => updateOrderStatus(order.id, e.target.value, order.courier_name, order.awb_number)}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border outline-none cursor-pointer appearance-none transition-colors ${getStatusColor(order.status)}`}>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                {order.awb_number && <span className={`text-[9px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>AWB: {order.awb_number}</span>}
                                {order.courier_name && <span className={`text-[9px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{order.courier_name}</span>}
                              </div>
                            </td>
                            <td className="p-5 text-right print:hidden">
                              <button onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                className="text-[11px] font-bold tracking-widest uppercase text-blue-500 hover:text-blue-400 transition-colors">
                                {expandedOrder === order.id ? "Close" : "View"}
                              </button>
                            </td>
                          </tr>

                          <AnimatePresence>
                            {expandedOrder === order.id && (
                              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className={`border-b print:border-none ${darkMode ? 'border-white/5 bg-white/3' : 'border-slate-200 bg-slate-50'}`}>
                                <td colSpan="6" className="p-0">
                                  <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">

                                    {/* Shipping Address */}
                                    <div className={`p-5 rounded-xl border shadow-sm ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                                      <h4 className={`text-[10px] font-bold tracking-widest uppercase mb-3 border-b pb-2 ${darkMode ? 'text-slate-400 border-white/10' : 'text-slate-400 border-slate-100'}`}>Shipping Address</h4>
                                      {(() => {
                                        const addr = order.shipping_address ? (typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address) : null;
                                        return addr ? (
                                          <div className={`text-[13px] leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                            <p className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{addr.fullName || order.customer_name}</p>
                                            <p>{addr.houseNo}, {addr.roadName}</p>
                                            {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                                            <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                                            <p className={`mt-2 pt-2 border-t text-[12px] font-medium ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                                              Payment: <span className="uppercase text-blue-500 font-bold">{order.payment_method || 'N/A'}</span>
                                            </p>
                                          </div>
                                        ) : <p className={`text-[12px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No address data.</p>;
                                      })()}
                                    </div>

                                    {/* SKU Packing List */}
                                    <div className={`p-5 rounded-xl border shadow-sm ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                                      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b pb-2 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                                        <h4 className={`text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                                          <CheckCircle2 size={12} className="text-emerald-500" /> Packing List — SKU Verified
                                        </h4>
                                        <div className="flex items-center gap-2 print:hidden">
                                          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-lg transition-colors">
                                            <Printer size={13} /> Print Slip
                                          </button>
                                          <a href={`https://wa.me/91${order.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${order.customer_name}, your Creative Kids order ${order.order_number} is packed and ready to ship! 🎉`)}`}
                                            target="_blank" rel="noreferrer"
                                            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-lg transition-colors">
                                            <MessageCircle size={13} /> WhatsApp
                                          </a>
                                        </div>
                                      </div>
                                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 print:max-h-full">
                                        {order.items && (typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => {
                                          const itemColor = item.color || item.selectedColor;
                                          const itemSize = item.size || item.selectedSize;
                                          const variantSku = getVariantSku(item);
                                          return (
                                            <div key={idx} className={`flex gap-3 items-start p-3 rounded-xl border print:bg-white ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                                              <div className="w-14 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 border border-slate-300" style={{ minHeight: '72px' }}>
                                                <img src={item.image || (item.image_urls && item.image_urls[0])} alt="item" className="w-full h-full object-cover" />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p className={`text-[13px] font-bold leading-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.title}</p>
                                                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                  {itemSize && itemSize !== 'Default' && (
                                                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider">{itemSize}</span>
                                                  )}
                                                  {itemColor && itemColor !== 'Default' && (
                                                    <span className={`flex items-center gap-1 border text-[10px] font-bold px-2 py-0.5 rounded tracking-wider ${darkMode ? 'bg-white/10 border-white/20 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                                                      <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: getColorHex(itemColor) }} />
                                                      {itemColor}
                                                    </span>
                                                  )}
                                                  <span className="flex items-center gap-1 bg-yellow-100 border border-yellow-300 text-yellow-900 text-[11px] font-bold px-2 py-0.5 rounded tracking-wider shadow-sm">
                                                    <Barcode size={12} /> {variantSku}
                                                  </span>
                                                </div>
                                                <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Qty: <span className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{item.quantity || 1}</span></p>
                                              </div>
                                              <div className="text-right flex-shrink-0">
                                                <p className={`text-[14px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>₹{item.price}</p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* KANBAN VIEW */
              <div className="flex gap-4 overflow-x-auto pb-6 snap-x">
                {['Processing', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
                  <div key={status} className={`flex-1 min-w-[300px] w-[300px] rounded-2xl p-4 flex flex-col gap-4 snap-center border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100/80 border-slate-200'}`}>
                    <div className={`flex items-center justify-between border-b pb-2 ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                      <h3 className={`font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${status === 'Processing' ? 'bg-blue-500' : status === 'Shipped' ? 'bg-purple-500' : status === 'Delivered' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {status}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${darkMode ? 'bg-white/10 text-slate-400 border-white/10' : 'bg-white text-slate-500 border-slate-200'}`}>{filteredOrders.filter(o => o.status === status).length}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {filteredOrders.filter(o => o.status === status).map(order => (
                        <motion.div key={order.id}
                          whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          onClick={() => { setOrderView('table'); setOrderSearch(order.order_number); setExpandedOrder(order.id); }}
                          className={`p-4 rounded-xl border shadow-sm cursor-pointer transition-colors ${darkMode ? 'bg-white/5 border-white/10 hover:border-blue-500/50' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-bold text-blue-500">{order.order_number}</span>
                            <span className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{order.customer_name}</p>
                          <p className={`text-[12px] mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{order.items_count} items • ₹{parseFloat(order.total_amount).toFixed(2)}</p>
                          <div onClick={e => e.stopPropagation()}>
                            <select value={order.status}
                              onChange={e => updateOrderStatus(order.id, e.target.value, order.courier_name, order.awb_number)}
                              className={`w-full px-2 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border outline-none cursor-pointer appearance-none transition-colors ${getStatusColor(order.status)}`}>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === "products" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
              <div>
                <h1 className={`text-2xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Inventory Management</h1>
                <p className={`text-[13px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Search by product title, base SKU, or variant SKU.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search title or any SKU..." value={inventorySearch}
                    onChange={e => setInventorySearch(e.target.value)}
                    className={`w-full text-[12px] rounded-xl pl-9 pr-4 py-3 outline-none border shadow-sm ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-blue-400' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'}`} />
                </div>
                <button onClick={() => { setActiveTab("add_product"); setEditingId(null); setFormData(DEFAULT_FORM_STATE); }}
                  className="w-full sm:w-auto flex-shrink-0 bg-blue-600 text-white px-6 py-3 rounded-xl text-[12px] font-bold tracking-wider hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                  + Add New Product
                </button>
              </div>
            </div>

            <div className={`${card} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left border-collapse">
                  <thead>
                    <tr className={`border-b ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      {['Preview','Product Details','Pricing','Stock','Category','Actions'].map((h, i) => (
                        <th key={h} className={`p-5 text-[11px] font-bold tracking-widest uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${i === 0 ? 'w-20' : ''} ${i === 5 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-16 text-center">
                          <Package className={`mx-auto mb-4 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} size={32} />
                          <p className={`text-[14px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>No products match your search.</p>
                        </td>
                      </tr>
                    ) : filteredProducts.map(product => {
                      const totalStock = calculateTotalStock(product.variants);
                      const isOutOfStock = totalStock === 0;
                      const isLowStock = totalStock > 0 && totalStock < 10;
                      const statusColor = isOutOfStock
                        ? darkMode ? "bg-red-900/40 text-red-400 border-red-700/50" : "bg-red-50 text-red-700 border-red-200"
                        : isLowStock
                        ? darkMode ? "bg-amber-900/40 text-amber-400 border-amber-700/50" : "bg-amber-50 text-amber-700 border-amber-200"
                        : darkMode ? "bg-emerald-900/40 text-emerald-400 border-emerald-700/50" : "bg-emerald-50 text-emerald-700 border-emerald-200";
                      const statusText = isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock";
                      return (
                        <tr key={product.id} className={`border-b transition-colors ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'} ${(isLowStock || isOutOfStock) && !darkMode ? 'bg-amber-50/30' : ''}`}>
                          <td className="p-5">
                            <div className={`w-14 h-16 rounded-lg overflow-hidden border shadow-sm relative ${darkMode ? 'bg-white/10 border-white/10' : 'bg-slate-100 border-slate-200'}`}>
                              {product.image_urls?.[0] && <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover" />}
                              {product.image_urls?.length > 1 && (
                                <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[8px] px-1 rounded-tl">+{product.image_urls.length - 1}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-5">
                            <p className={`text-[14px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{product.title}</p>
                            <p className={`text-[11px] mt-1 font-medium tracking-wider uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Base SKU: {product.sku || 'N/A'}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {product.is_draft && <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${darkMode ? 'bg-white/10 text-slate-400 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>Draft</span>}
                              {product.is_active === false && <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${darkMode ? 'bg-red-900/40 text-red-400 border-red-700/50' : 'bg-red-50 text-red-600 border-red-200'}`}>Delisted</span>}
                              {product.is_featured && <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${darkMode ? 'bg-blue-900/40 text-blue-400 border-blue-700/50' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>Homepage</span>}
                              {product.is_new_arrival && <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded border ${darkMode ? 'bg-purple-900/40 text-purple-400 border-purple-700/50' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>New</span>}
                              {(isLowStock || isOutOfStock) && (
                                <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded bg-red-900/40 text-red-400 border border-red-700/50">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Alert
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-5">
                            <span className={`text-[15px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>₹{parseFloat(product.price).toFixed(2)}</span>
                            {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                              <span className={`block text-[12px] line-through ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>₹{parseFloat(product.mrp).toFixed(2)}</span>
                            )}
                          </td>
                          <td className="p-5">
                            <span className={`px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase border rounded-md ${statusColor}`}>{statusText}</span>
                            <p className={`text-[11px] mt-2 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{totalStock} units</p>
                          </td>
                          <td className="p-5">
                            <p className={`text-[13px] font-medium ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{product.main_category}</p>
                            <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{product.sub_category}</p>
                          </td>
                          <td className="p-5 text-right">
                            <div className="flex justify-end gap-3">
                              {product.is_active === false ? (
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }} onClick={() => handleRestore(product.id)} className={`p-2.5 rounded-lg transition-colors border border-transparent text-[10px] font-bold tracking-widest uppercase px-3 ${darkMode ? 'text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 border-emerald-700/40 bg-emerald-900/20' : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-emerald-50'}`} title="Restore">Restore</motion.button>
                              ) : (
                                <>
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }} onClick={() => handleEdit(product)} className={`p-2.5 rounded-lg transition-colors border border-transparent ${darkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/20' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100'}`} title="Edit"><Edit size={18} /></motion.button>
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.93 }} onClick={() => handleDelete(product.id)} className={`p-2.5 rounded-lg transition-colors border border-transparent ${darkMode ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100'}`} title="Delete"><Trash2 size={18} /></motion.button>
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
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-8">
            <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Analytics</h1>

            {/* Revenue Chart */}
            <div className={`${card} p-6`}>
              <h3 className={`text-[13px] font-bold tracking-wider uppercase mb-6 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Revenue — Last 30 Days</h3>
              {analyticsData.revenue.length === 0 ? (
                <p className={`text-[13px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analyticsData.revenue}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} stroke={darkMode ? '#475569' : '#cbd5e1'} />
                    <YAxis tick={{ fontSize: 10 }} stroke={darkMode ? '#475569' : '#cbd5e1'} tickFormatter={v => `₹${v}`} />
                    <Tooltip formatter={(v) => [`₹${parseFloat(v).toFixed(2)}`, 'Revenue']} contentStyle={{ background: darkMode ? '#0d1424' : '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Funnel */}
              <div className={`${card} p-6`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase mb-6 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Order Status Breakdown</h3>
                {analyticsData.funnel.length === 0 ? <p className={`text-[13px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No data yet.</p> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={analyticsData.funnel}>
                      <XAxis dataKey="status" tick={{ fontSize: 10 }} stroke={darkMode ? '#475569' : '#cbd5e1'} />
                      <YAxis tick={{ fontSize: 10 }} stroke={darkMode ? '#475569' : '#cbd5e1'} />
                      <Tooltip contentStyle={{ background: darkMode ? '#0d1424' : '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Top Products */}
              <div className={`${card} p-6`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase mb-4 ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>Top Selling Products</h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {analyticsData.topProducts.length === 0 ? <p className={`text-[13px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No data yet.</p> :
                    analyticsData.topProducts.map((p, i) => (
                      <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <span className={`text-[11px] font-bold w-5 text-center ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold truncate ${darkMode ? 'text-white' : 'text-slate-800'}`}>{p.title}</p>
                          <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{p.order_count} orders · ₹{parseFloat(p.total_revenue || 0).toFixed(0)}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* COUPONS TAB */}
        {activeTab === "coupons" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
            <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>Coupon Management</h1>

            {/* Create Coupon Form */}
            <div className={`${card} p-6 space-y-4`}>
              <h3 className={`text-[13px] font-bold tracking-wider uppercase border-b pb-3 ${darkMode ? 'text-slate-200 border-white/10' : 'text-slate-800 border-slate-100'}`}>Create New Coupon</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <label className={label}>Code</label>
                  <input type="text" placeholder="e.g. SAVE20" value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} className={inp} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={label}>Type</label>
                  <select value={couponForm.discount_type} onChange={e => setCouponForm(p => ({ ...p, discount_type: e.target.value }))} className={`${inp} cursor-pointer`}>
                    <option value="percent">Percent (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={label}>Value</label>
                  <input type="number" placeholder={couponForm.discount_type === 'percent' ? '20' : '100'} value={couponForm.discount_value} onChange={e => setCouponForm(p => ({ ...p, discount_value: e.target.value }))} className={inp} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={label}>Min Order (₹)</label>
                  <input type="number" placeholder="0" value={couponForm.min_order_amount} onChange={e => setCouponForm(p => ({ ...p, min_order_amount: e.target.value }))} className={inp} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={label}>Max Uses</label>
                  <input type="number" placeholder="Unlimited" value={couponForm.max_uses} onChange={e => setCouponForm(p => ({ ...p, max_uses: e.target.value }))} className={inp} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={label}>Expires At</label>
                  <input type="date" value={couponForm.expires_at} onChange={e => setCouponForm(p => ({ ...p, expires_at: e.target.value }))} className={inp} />
                </div>
              </div>
              <button onClick={async () => {
                if (!couponForm.code || !couponForm.discount_value) return alert('Code and value required.');
                const token = localStorage.getItem('adminToken');
                const res = await fetch(`${API}/api/admin/coupons`, {
                  method: 'POST',
                  headers: await csrfHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }),
                  credentials: 'include',
                  body: JSON.stringify(couponForm)
                });
                if (res.ok) {
                  const data = await res.json();
                  setCoupons(prev => [data, ...prev]);
                  setCouponForm({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_uses: '', expires_at: '' });
                } else alert('Failed to create coupon.');
              }} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-[12px] font-bold tracking-widest uppercase hover:bg-blue-700 transition-colors">
                Create Coupon
              </button>
            </div>

            {/* Coupons List */}
            <div className={`${card} overflow-hidden`}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Status'].map(h => (
                      <th key={h} className={`p-4 text-[11px] font-bold tracking-widest uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr><td colSpan="7" className={`p-8 text-center text-[13px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>No coupons yet.</td></tr>
                  ) : coupons.map(c => (
                    <tr key={c.id} className={`border-b ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <td className={`p-4 text-[13px] font-bold font-mono ${darkMode ? 'text-white' : 'text-slate-800'}`}>{c.code}</td>
                      <td className={`p-4 text-[12px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{c.discount_type}</td>
                      <td className={`p-4 text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{c.discount_type === 'percent' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                      <td className={`p-4 text-[12px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>₹{c.min_order_amount}</td>
                      <td className={`p-4 text-[12px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.uses}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                      <td className={`p-4 text-[12px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : '—'}</td>
                      <td className="p-4">
                        <button onClick={async () => {
                          const token = localStorage.getItem('adminToken');
                          const res = await fetch(`${API}/api/admin/coupons/${c.id}`, { method: 'PUT', credentials: 'include', headers: await csrfHeaders({ Authorization: `Bearer ${token}` }) });
                          if (res.ok) { const data = await res.json(); setCoupons(prev => prev.map(x => x.id === c.id ? data : x)); }
                        }} className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase border transition-colors ${
                          c.is_active
                            ? darkMode ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50 hover:bg-red-900/40 hover:text-red-400 hover:border-red-700/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                            : darkMode ? 'bg-red-900/40 text-red-400 border-red-700/50 hover:bg-emerald-900/40 hover:text-emerald-400 hover:border-emerald-700/50' : 'bg-red-50 text-red-700 border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                        }`}>
                          {c.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* VARIANT DRAWER */}
        <VariantDrawer
          isOpen={isVariantDrawerOpen}
          onClose={() => setIsVariantDrawerOpen(false)}
          formData={formData}
          setFormData={setFormData}
          darkMode={darkMode}
        />

        {/* ADD / EDIT PRODUCT TAB */}
        {activeTab === "add_product" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
              <div>
                <h1 className={`text-2xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>{editingId ? "Edit Product" : "List New Product"}</h1>
                <p className={`text-[13px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{editingId ? "Update product details and variations." : "Complete item details, variations, and storefront routing."}</p>
              </div>
              {editingId && (
                <button onClick={cancelEdit} className="w-full sm:w-auto text-[12px] font-bold tracking-wider uppercase text-red-400 border border-red-500/30 bg-red-500/10 px-6 py-3 rounded-xl hover:bg-red-500/20 transition-colors">
                  Cancel Edit
                </button>
              )}
            </div>

            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[12px] font-bold tracking-wider uppercase flex items-center gap-2 rounded-xl">
                    <CheckCircle2 size={18} /> {editingId ? "Product Updated!" : "Product Published!"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">

              {/* 1. Core Details */}
              <div className={`${card} p-6 md:p-8 space-y-6`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase border-b pb-3 ${darkMode ? 'text-slate-200 border-white/10' : 'text-slate-800 border-slate-100'}`}>1. Core Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className={label}>Product Title *</label>
                    <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Noir Velvet Dress" className={inp} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={label}> MRP (₹)</label>
                    <input type="number" step="0.01" name="mrp" value={formData.mrp} onChange={handleChange} placeholder="150.00" className={inp} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={label}>Selling Price (₹) *</label>
                    <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} placeholder="120.00" className={inp} />
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className={label}>Parent SKU ID *</label>
                    <input required type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. BBY-GRL-DRS" className={inp} />
                    <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Variant SKUs auto-generated as: <span className={`font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{formData.sku || 'BBY-GRL-DRS'}-RED-3M</span></p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={label}>HSN Code</label>
                    <input type="text" name="hsn_code" value={formData.hsn_code} onChange={handleChange} placeholder="e.g. 6111" className={inp} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={label}>Country of Origin</label>
                    <input type="text" name="origin_country" value={formData.origin_country} onChange={handleChange} placeholder="e.g. India" className={inp} />
                  </div>
                </div>
              </div>

              {/* 2. Store Routing */}
              <div className={`${card} p-6 md:p-8 space-y-6`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase border-b pb-3 ${darkMode ? 'text-slate-200 border-white/10' : 'text-slate-800 border-slate-100'}`}>2. Store Routing Path</h3>

                {/* Primary selectors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: 'main_category', label: 'Primary Main Category', options: Object.keys(CATEGORY_TREE) },
                    { name: 'sub_category', label: 'Primary Sub Category', options: Object.keys(CATEGORY_TREE[formData.main_category]) },
                    { name: 'item_type', label: 'Item Type', options: CATEGORY_TREE[formData.main_category][formData.sub_category] },
                  ].map(sel => (
                    <div key={sel.name} className="flex flex-col gap-2">
                      <label className={label}>{sel.label}</label>
                      <select name={sel.name} value={formData[sel.name]} onChange={handleChange} className={`${inp} cursor-pointer`}>
                        {sel.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Also List In */}
                <div className={`p-5 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <p className={`text-[11px] font-bold tracking-widest uppercase mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Also List In <span className={`font-normal normal-case tracking-normal ml-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>— for unisex or multi-age products</span>
                  </p>
                  <p className={`text-[11px] mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Product will appear in all checked sections automatically.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(CATEGORY_TREE).flatMap(([main, subs]) =>
                      Object.keys(subs).map(sub => ({ main, sub }))
                    ).filter(({ sub }) => sub !== formData.sub_category).map(({ main, sub }) => {
                      const isChecked = (formData.extra_categories || []).some(e => e.main_category === main && e.sub_category === sub);
                      return (
                        <label key={`${main}||${sub}`} className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isChecked
                            ? darkMode ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700'
                            : darkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                          <input type="checkbox" checked={isChecked} className="accent-blue-600 w-3.5 h-3.5"
                            onChange={() => setFormData(prev => {
                              const current = prev.extra_categories || [];
                              const exists = current.some(e => e.main_category === main && e.sub_category === sub);
                              return {
                                ...prev,
                                extra_categories: exists
                                  ? current.filter(e => !(e.main_category === main && e.sub_category === sub))
                                  : [...current, { main_category: main, sub_category: sub }]
                              };
                            })}
                          />
                          <span className="text-[11px] font-medium leading-tight">
                            {sub}
                            <span className={`block text-[9px] font-normal ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{main}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Attributes */}
              <div className={`${card} p-6 md:p-8 space-y-6`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase border-b pb-3 ${darkMode ? 'text-slate-200 border-white/10' : 'text-slate-800 border-slate-100'}`}>3. Product Attributes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className={label}>Fabric</label>
                    <select name="fabric" value={formData.fabric} onChange={handleChange} className={`${inp} cursor-pointer`}>
                      <option value="">-- Select Fabric --</option>
                      <optgroup label="Basic Woven">
                        <option>Cotton</option><option>Linen</option><option>Rayon</option>
                        <option>Viscose</option><option>Polyester</option><option>Denim</option><option>Chambray</option>
                      </optgroup>
                      <optgroup label="Lightweight / Fashion Woven">
                        <option>Chiffon</option><option>Georgette</option><option>Crepe</option>
                        <option>Satin</option><option>Organza</option>
                      </optgroup>
                      <optgroup label="Textured / Premium Woven">
                        <option>Dobby</option><option>Jacquard</option><option>Seersucker</option>
                        <option>Twill</option><option>Poplin</option>
                      </optgroup>
                      <optgroup label="Blended Woven">
                        <option>Cotton Blend</option><option>Poly Cotton</option><option>Rayon Blend</option>
                        <option>Viscose Blend</option><option>Cotton Poplin</option>
                        <option>Viscose Rayon</option><option>Poly Chiffon</option><option>Denim Cotton</option>
                      </optgroup>
                    </select>
                  </div>
                  {[
                    { name: 'pattern', placeholder: 'e.g. Floral Print' },
                    { name: 'neck_type', placeholder: 'e.g. Round Neck' },
                  ].map(f => (
                    <div key={f.name} className="flex flex-col gap-2">
                      <label className={label}>{f.name.replace('_', ' ')}</label>
                      <input type="text" name={f.name} value={formData[f.name]} onChange={handleChange} placeholder={f.placeholder} className={inp} />
                    </div>
                  ))}
                  <div className="flex flex-col gap-2">
                    <label className={label}>Closure Type</label>
                    <select name="closure_type" value={formData.closure_type} onChange={handleChange} className={`${inp} cursor-pointer`}>
                      <option value="">-- Select --</option>
                      <option value="Pull On">Pull On</option>
                      <option value="Elastic">Elastic</option>
                      <option value="Button">Button</option>
                      <option value="Snap Button">Snap Button</option>
                      <option value="Zip">Zip</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={label}>Length Type</label>
                    <select name="length_type" value={formData.length_type} onChange={handleChange} className={`${inp} cursor-pointer`}>
                      <option value="">-- Select --</option>
                      <option value="Mini">Mini</option>
                      <option value="Mid Thigh">Mid Thigh</option>
                      <option value="Knee Length">Knee Length</option>
                      <option value="Midi">Midi</option>
                      <option value="Ankle Length">Ankle Length</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-2 md:pt-8">
                    <input type="checkbox" name="belt_included" checked={formData.belt_included} onChange={handleChange} className="w-5 h-5 accent-blue-600 cursor-pointer rounded" id="beltCheck" />
                    <label htmlFor="beltCheck" className={`text-[12px] font-bold tracking-widest uppercase cursor-pointer ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Belt Included?</label>
                  </div>
                </div>
              </div>

              {/* 4. Inventory Matrix */}
              <div className={`${card} p-6 md:p-8 space-y-4`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase border-b pb-3 ${darkMode ? 'text-slate-200 border-white/10' : 'text-slate-800 border-slate-100'}`}>4. Inventory Variations Matrix</h3>

                {formData.variants.length > 0 ? (
                  <>
                    {/* Summary table grouped by color */}
                    <div className={`border rounded-xl overflow-hidden ${darkMode ? 'border-white/10' : 'border-slate-200'}`}>
                      <table className={`w-full text-left ${darkMode ? 'bg-transparent' : 'bg-white'}`}>
                        <thead>
                          <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                            {['Color', 'Sizes', 'Total Stock'].map(h => (
                              <th key={h} className={`p-4 text-[11px] font-bold tracking-widest uppercase ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {getVariantSummary().map(({ color, sizeCount, stock }) => (
                            <tr key={color} className={`border-b last:border-0 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {color !== 'Default' && <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: getColorHex(color) }} />}
                                  <span className={`text-[13px] font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>{color}</span>
                                </div>
                              </td>
                              <td className={`p-4 text-[13px] ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {sizeCount > 0 ? `${sizeCount} size${sizeCount !== 1 ? 's' : ''}` : '—'}
                              </td>
                              <td className="p-4">
                                <span className={`text-[13px] font-bold ${stock < 10 ? 'text-amber-500' : darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{stock} units</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" onClick={() => setIsVariantDrawerOpen(true)}
                      className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-colors w-full shadow-md ${darkMode ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'}`}>
                      <Layers size={16} /> Edit Variations ({formData.variants.length} variants)
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setIsVariantDrawerOpen(true)}
                    className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-colors w-full shadow-md ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                    <Wand2 size={16} /> Open Variation Studio
                  </button>
                )}
              </div>

              {/* 5. Media Gallery */}
              <div className={`${card} p-6 md:p-8 space-y-6`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase border-b pb-3 flex items-center gap-2 ${darkMode ? 'text-slate-200 border-white/10' : 'text-slate-800 border-slate-100'}`}>
                  <ImageIcon size={18} /> 5. Product Media Gallery (AWS S3) *
                </h3>

                {/* Upload zone — accepts multiple */}
                <label className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                  uploadingImage
                    ? darkMode ? 'border-blue-500/40 bg-blue-500/5' : 'border-blue-300 bg-blue-50'
                    : darkMode ? 'border-white/10 hover:border-blue-500/40 hover:bg-white/5' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50/30'
                }`}>
                  <UploadCloud size={28} className={uploadingImage ? 'text-blue-400 animate-pulse' : darkMode ? 'text-slate-500' : 'text-slate-400'} />
                  <div className="text-center">
                    <p className={`text-[13px] font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {uploadingImage
                        ? `Uploading ${uploadProgress.done} / ${uploadProgress.total}...`
                        : 'Click or drag images here'}
                    </p>
                    <p className={`text-[11px] mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {uploadingImage ? 'Please wait' : 'Select multiple images at once — all upload in parallel'}
                    </p>
                  </div>
                  {uploadingImage && (
                    <div className={`w-full max-w-xs h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: uploadProgress.total ? `${(uploadProgress.done / uploadProgress.total) * 100}%` : '0%' }}
                      />
                    </div>
                  )}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>

                {/* Thumbnails — draggable to reorder */}
                {formData.image_urls.length > 0 && (
                  <div>
                    <p className={`text-[11px] font-bold tracking-widest uppercase mb-3 flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Drag thumbnails to reorder — leftmost = main cover photo
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <AnimatePresence>
                        {formData.image_urls.map((url, idx) => (
                          <motion.div
                            key={url}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            draggable
                            onDragStart={() => { dragSrcIndex.current = idx; }}
                            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              const from = dragSrcIndex.current;
                              const to = idx;
                              if (from === null || from === to) { setDragOverIndex(null); return; }
                              setFormData(prev => {
                                const arr = [...prev.image_urls];
                                const [moved] = arr.splice(from, 1);
                                arr.splice(to, 0, moved);
                                return { ...prev, image_urls: arr };
                              });
                              dragSrcIndex.current = null;
                              setDragOverIndex(null);
                            }}
                            onDragEnd={() => { dragSrcIndex.current = null; setDragOverIndex(null); }}
                            className={`relative aspect-[3/4] rounded-xl overflow-hidden border shadow-sm group cursor-grab active:cursor-grabbing transition-all ${
                              dragOverIndex === idx
                                ? darkMode ? 'border-blue-400 scale-105 ring-2 ring-blue-500/40' : 'border-blue-400 scale-105 ring-2 ring-blue-300'
                                : darkMode ? 'bg-white/10 border-white/10' : 'bg-slate-100 border-slate-200'
                            }`}>
                            <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover pointer-events-none" />
                            <button type="button" onClick={() => removeImageUrl(idx)}
                              className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-md z-10">
                              <X size={14} strokeWidth={2.5} />
                            </button>
                            <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-[9px] font-bold tracking-widest shadow-sm backdrop-blur-md ${
                              idx === 0 ? 'bg-blue-600/90 text-white' : 'bg-black/60 text-white'
                            }`}>
                              {idx === 0 ? 'MAIN' : `GAL ${idx}`}
                            </div>
                            {/* drag handle indicator */}
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className={`p-1 rounded backdrop-blur-md ${darkMode ? 'bg-white/20' : 'bg-black/30'}`}>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="white">
                                  <circle cx="3" cy="3" r="1"/><circle cx="7" cy="3" r="1"/>
                                  <circle cx="3" cy="7" r="1"/><circle cx="7" cy="7" r="1"/>
                                </svg>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Description */}
              <div className={`${card} p-6 md:p-8 space-y-6`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase border-b pb-3 ${darkMode ? 'text-slate-200 border-white/10' : 'text-slate-800 border-slate-100'}`}>6. Description & Manufacturing</h3>
                <div className="flex flex-col gap-2">
                  <label className={label}>Main Description *</label>
                  <textarea required name="description" value={formData.description} onChange={handleChange} rows="4"
                    placeholder="Enter engaging product description..."
                    className={`${inp} resize-none`} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className={label}>Manufacturer Details</label>
                    <textarea name="manufacturer_details" value={formData.manufacturer_details} onChange={handleChange} rows="2"
                      placeholder="Creative Impression..." className={`${inp} resize-none`} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={label}>Care Instructions</label>
                    <select name="care_instructions" value={formData.care_instructions} onChange={handleChange} className={`${inp} cursor-pointer`}>
                      <option value="Machine Wash">Machine Wash</option>
                      <option value="Hand Wash">Hand Wash</option>
                      <option value="Dry Clean">Dry Clean</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 7. Storefront Controls */}
              <div className={`p-6 md:p-8 rounded-2xl border space-y-4 ${darkMode ? 'bg-white/3 border-white/10' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
                <h3 className={`text-[13px] font-bold tracking-wider uppercase border-b pb-3 ${darkMode ? 'text-slate-200 border-white/10' : 'text-slate-800 border-slate-200'}`}>7. Storefront & Homepage Controls</h3>

                {[
                  { key: 'is_draft', label: 'Save as Draft', desc: 'Keep hidden from customers until ready to publish.' },
                  { key: 'is_new_arrival', label: 'Tag as New Arrival', desc: 'Show inside the "New Arrivals" shop category.' },
                ].map(toggle => (
                  <div key={toggle.key} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border rounded-xl shadow-sm ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                    <div>
                      <h3 className={`text-[13px] font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-800'}`}>{toggle.label}</h3>
                      <p className={`text-[12px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{toggle.desc}</p>
                    </div>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
                      className={`w-14 h-7 rounded-full transition-colors relative shadow-inner flex-shrink-0 ${formData[toggle.key] ? 'bg-blue-600' : darkMode ? 'bg-white/20' : 'bg-slate-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${formData[toggle.key] ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                ))}

                <div className={`flex flex-col p-6 border rounded-xl shadow-sm ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className={`text-[13px] font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-800'}`}>Display on Homepage</h3>
                      <p className={`text-[12px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Select which grid and card position this product appears in.</p>
                    </div>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                      className={`w-14 h-7 rounded-full transition-colors relative shadow-inner flex-shrink-0 ${formData.is_featured ? 'bg-blue-600' : darkMode ? 'bg-white/20' : 'bg-slate-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${formData.is_featured ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {formData.is_featured && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className={`pt-6 mt-6 border-t flex flex-col md:flex-row gap-6 ${darkMode ? 'border-white/10' : 'border-slate-100'}`}>
                          <div className="flex-1 flex flex-col gap-2">
                            <label className={label}>Select Section</label>
                            <select name="homepage_section" value={formData.homepage_section} onChange={handleChange} className={`${inp} cursor-pointer`}>
                              <option value="None">-- Select Section --</option>
                              <option value="New Arrivals">Girl's New Arrivals</option>
                              <option value="Season Bestsellers">Season Bestsellers Grid</option>
                              <option value="Featured Collection">Featured Collection</option>
                            </select>
                          </div>
                          <div className="w-full md:w-56 flex flex-col gap-2">
                            <label className={label}>Card Position</label>
                            <select name="homepage_card_slot" value={formData.homepage_card_slot} onChange={handleChange} className={`${inp} cursor-pointer`}>
                              <option value="1">Card 1 (Far Left)</option>
                              <option value="2">Card 2 (Middle Left)</option>
                              <option value="3">Card 3 (Middle Right)</option>
                              <option value="4">Card 4 (Far Right)</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="pt-6 pb-12 flex justify-end">
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  type="submit" disabled={loading}
                  className="w-full md:w-auto px-16 bg-blue-600 text-white rounded-xl py-4 text-[13px] font-bold tracking-widest uppercase hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50">
                  {loading ? "Saving..." : editingId ? "Update Product" : formData.is_draft ? "Save Draft" : "Publish to Storefront"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

      </main>
    </div>
    </div>
  );
}
