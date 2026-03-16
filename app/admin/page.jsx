"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, PackagePlus, ListOrdered, CheckCircle2, Package, TrendingUp, CreditCard, Wand2, Trash2, Edit, Tag, LogOut, ShieldAlert, RefreshCcw, Search, X, Image as ImageIcon, Menu, UploadCloud, ChevronDown
} from "lucide-react";

// Shared size & color constants (must match shop filter exactly)
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
  image_urls: [], sizes: [], colors: [],
  description: "", manufacturer_details: "", care_instructions: "Dry clean or gentle hand wash", origin_country: "India",
  variants: [], 
  is_featured: false, is_new_arrival: false, homepage_section: "None", homepage_card_slot: "1",
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('adminActiveTab') || 'dashboard';
    return 'dashboard';
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [stats, setStats] = useState({ revenue: 0, activeOrders: 0, totalProducts: 0 });
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null); 
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);
  
  const [allProducts, setAllProducts] = useState([]);
  const [inventorySearch, setInventorySearch] = useState(""); 
  const [editingId, setEditingId] = useState(() => {
    if (typeof window !== 'undefined') { const id = localStorage.getItem('adminEditingId'); return id ? parseInt(id) : null; }
    return null;
  });

  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      try { const saved = localStorage.getItem('adminFormDraft'); return saved ? JSON.parse(saved) : DEFAULT_FORM_STATE; } catch(e) {}
    }
    return DEFAULT_FORM_STATE;
  });
  
  // NEW: State for tracking the AWS Upload progress
  const [uploadingImage, setUploadingImage] = useState(false);

  // Persist formData, activeTab, editingId to localStorage
  useEffect(() => { localStorage.setItem('adminFormDraft', JSON.stringify(formData)); }, [formData]);
  useEffect(() => { localStorage.setItem('adminActiveTab', activeTab); }, [activeTab]);
  useEffect(() => { 
    if (editingId) localStorage.setItem('adminEditingId', editingId);
    else localStorage.removeItem('adminEditingId');
  }, [editingId]);

  // --- 1. SECURITY CHECK ---
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      window.location.href = "/admin/login";
    } else {
      setIsAuthenticated(true);
      setAuthChecking(false);
    }
  }, []);

  // --- 2. DATA FETCHING ---
  const fetchAdminOrders = async () => {
    setIsRefreshingOrders(true);
    try {
      const response = await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/admin/orders");
      const data = await response.json();
      if (Array.isArray(data)) setOrders(data);
      else setOrders([]); 
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setIsRefreshingOrders(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === "dashboard") {
      fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/admin/stats").then(res => res.json()).then(data => setStats(data)).catch(err => console.error(err));
    } else if (activeTab === "orders") {
      fetchAdminOrders();
    } else if (activeTab === "products") {
      const token = localStorage.getItem("adminToken");
      fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/admin/products", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const unpackedProducts = data.map(product => {
            let unpackedImages = [];
            try { 
              unpackedImages = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : (product.image_urls || []); 
            } catch(e) {}
            return { ...product, image_urls: unpackedImages };
          });
          setAllProducts(unpackedProducts);
        })
        .catch(err => console.error(err));
    }
  }, [activeTab, isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setEditingId(null);
    if (tabId !== "add_product") {
      setFormData(DEFAULT_FORM_STATE);
      localStorage.removeItem('adminFormDraft');
      localStorage.removeItem('adminEditingId');
    }
    setIsMobileMenuOpen(false);
  };

  const updateOrderStatus = async (orderId, newStatus, courierName, awbNumber) => {
    try {
      const response = await fetch(`https://vbaumdstnz.ap-south-1.awsapprunner.com/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, courier_name: courierName, awb_number: awbNumber })
      });
      if (response.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus, courier_name: courierName, awb_number: awbNumber } : o));
      } else {
        alert("Failed to update status on server.");
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // --- 3. FORM LOGIC ---
  const handleChange = (e) => {
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
  };

  // NEW: Secure AWS S3 Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    
    // Package the file securely
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}` // Show the VIP wristband
        },
        body: uploadData
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Add the new AWS public URL to our gallery array
        setFormData(prev => ({
          ...prev,
          image_urls: [...prev.image_urls, data.imageUrl]
        }));
      } else {
        alert(data.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("An error occurred while uploading the image.");
    } finally {
      setUploadingImage(false);
      e.target.value = ""; // Reset the input so you can upload another one
    }
  };

  const removeImageUrl = async (indexToRemove) => {
    const urlToDelete = formData.image_urls[indexToRemove];
    try {
      const token = localStorage.getItem("adminToken");
      await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/upload", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: urlToDelete })
      });
    } catch (err) {
      console.error("Failed to delete image from S3:", err);
    }
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const generateVariants = () => {
    const sizeList = Array.isArray(formData.sizes) ? formData.sizes : formData.sizes.split(',').map(s => s.trim()).filter(Boolean);
    const colorList = Array.isArray(formData.colors) ? formData.colors : formData.colors.split(',').map(c => c.trim()).filter(Boolean);
    const baseSku = formData.sku || "SKU";
    
    if (sizeList.length === 0 && colorList.length === 0) {
      alert("Please select at least one Size or Color first!");
      return;
    }

    setFormData(prev => {
      let existingMatrix = [...prev.variants];
      const addVariant = (color, size) => {
        const exists = existingMatrix.some(v => v.color === color && v.size === size);
        if (!exists) {
          const skuColor = color !== "Default" ? `-${color}` : "";
          const skuSize = size !== "Default" ? `-${size}` : "";
          existingMatrix.push({ color: color || "Default", size: size || "Default", stock: 10, sku: `${baseSku}${skuColor}${skuSize}`.toUpperCase().replace(/\s+/g, '') });
        }
      };

      if (sizeList.length > 0 && colorList.length > 0) colorList.forEach(color => sizeList.forEach(size => addVariant(color, size)));
      else if (sizeList.length > 0) sizeList.forEach(size => addVariant("Default", size));
      else if (colorList.length > 0) colorList.forEach(color => addVariant(color, "Default"));

      return { ...prev, sizes: [], colors: [], variants: existingMatrix };
    });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    updatedVariants[index][field] = value;
    setFormData(prev => ({ ...prev, variants: updatedVariants }));
  };

  const removeVariant = (indexToRemove) => {
    setFormData(prev => ({ ...prev, variants: prev.variants.filter((_, index) => index !== indexToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    if (formData.variants.length === 0) {
      alert("Please generate at least one item in the Inventory Matrix before submitting!");
      setLoading(false);
      return;
    }

    if (formData.image_urls.length === 0) {
      alert("Please upload at least one Product Image!");
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      mrp: formData.mrp ? parseFloat(formData.mrp) : parseFloat(formData.price), 
      sizes: [...new Set(formData.variants.map(v => v.size))].filter(s => s !== "Default"),
      colors: [...new Set(formData.variants.map(v => v.color))].filter(c => c !== "Default"),
      is_featured: formData.is_featured,
      is_new_arrival: formData.is_new_arrival,
      homepage_section: formData.is_featured ? formData.homepage_section : "None",
      homepage_card_slot: formData.is_featured ? parseInt(formData.homepage_card_slot) : null
    };

    try {
      const url = editingId ? `https://vbaumdstnz.ap-south-1.awsapprunner.com/api/products/${editingId}` : "https://vbaumdstnz.ap-south-1.awsapprunner.com/api/products";
      const method = editingId ? "PUT" : "POST";
      const token = localStorage.getItem("adminToken");

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData(DEFAULT_FORM_STATE);
        setEditingId(null);
        localStorage.removeItem('adminFormDraft');
        localStorage.removeItem('adminEditingId');
        window.scrollTo(0, 0);
        setTimeout(() => {
          setSuccess(false);
          setActiveTab("products"); 
        }, 2000);
      } else {
        alert("Failed to save product. Check backend terminal for errors.");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    let parsedVariants = [];
    try { parsedVariants = typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []); } catch(e) {}
    
    let parsedImages = [];
    try { parsedImages = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : (product.image_urls || []); } catch(e) {}

    setFormData({
      title: product.title || "", price: product.price || "", mrp: product.mrp || "",
      sku: product.sku || "", hsn_code: product.hsn_code || "",
      main_category: product.main_category || "Baby", sub_category: product.sub_category || "Baby Boy", item_type: product.item_type || "Onesies & Rompers",
      fabric: product.fabric || "", pattern: product.pattern || "", neck_type: product.neck_type || "", belt_included: product.belt_included || false,
      image_urls: parsedImages, 
      sizes: [], colors: [], 
      description: product.description || "", manufacturer_details: product.manufacturer_details || "", care_instructions: product.care_instructions || "", origin_country: product.origin_country || "India",
      variants: parsedVariants,
      is_featured: product.is_featured || false, is_new_arrival: product.is_new_arrival || false, homepage_section: product.homepage_section || "None", homepage_card_slot: product.homepage_card_slot ? String(product.homepage_card_slot) : "1",
    });
    setEditingId(product.id);
    setActiveTab("add_product");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(`https://vbaumdstnz.ap-south-1.awsapprunner.com/api/products/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) setAllProducts(allProducts.filter(p => p.id !== id));
      else alert("Failed to delete product.");
    } catch (err) { console.error("Delete error:", err); }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(DEFAULT_FORM_STATE);
    localStorage.removeItem('adminFormDraft');
    localStorage.removeItem('adminEditingId');
    setActiveTab("products");
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Processing": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Shipped": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Delivered": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Cancelled": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const calculateTotalStock = (variants) => {
    if (!variants) return 0;
    try {
      const parsed = typeof variants === 'string' ? JSON.parse(variants) : variants;
      if (!Array.isArray(parsed)) return 0;
      return parsed.reduce((sum, v) => sum + (parseInt(v.stock) || 0), 0);
    } catch (e) {
      return 0;
    }
  };

  const filteredProducts = allProducts.filter(product => 
    product.title.toLowerCase().includes(inventorySearch.toLowerCase()) || 
    (product.sku && product.sku.toLowerCase().includes(inventorySearch.toLowerCase()))
  );

  if (authChecking) return <div className="fixed inset-0 z-[100] bg-[#0f172a] flex items-center justify-center"><span className="text-white/50 animate-pulse tracking-widest text-sm">Verifying Access...</span></div>;

  return (
    <div className="fixed inset-0 z-[100] min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden bg-[#0f172a] text-white p-4 flex justify-between items-center z-30 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldAlert size={16} className="text-white" />
          </div>
          <h2 className="text-sm font-bold tracking-widest uppercase">Workspace</h2>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside className={`absolute md:relative top-0 left-0 h-full w-72 bg-[#0f172a] text-slate-300 flex-shrink-0 flex flex-col overflow-y-auto border-r border-slate-800 shadow-2xl z-40 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="p-8 pb-4">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldAlert size={16} className="text-white" />
            </div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-white">Workspace</h2>
          </div>

          <nav className="flex flex-col gap-2 mt-4 md:mt-0">
            <button onClick={() => handleNavClick("dashboard")} className={`flex items-center gap-3 px-4 py-3.5 text-[12px] font-semibold tracking-wider transition-all rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:text-white hover:bg-white/5'}`}>
              <LayoutDashboard size={18} /> Overview
            </button>
            <button onClick={() => handleNavClick("orders")} className={`flex items-center gap-3 px-4 py-3.5 text-[12px] font-semibold tracking-wider transition-all rounded-xl ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:text-white hover:bg-white/5'}`}>
              <ListOrdered size={18} /> Orders
            </button>
            <button onClick={() => handleNavClick("products")} className={`flex items-center gap-3 px-4 py-3.5 text-[12px] font-semibold tracking-wider transition-all rounded-xl ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:text-white hover:bg-white/5'}`}>
              <Tag size={18} /> Inventory
            </button>
            <button onClick={() => handleNavClick("add_product")} className={`flex items-center gap-3 px-4 py-3.5 text-[12px] font-semibold tracking-wider transition-all rounded-xl ${activeTab === 'add_product' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:text-white hover:bg-white/5'}`}>
              <PackagePlus size={18} /> List Product
            </button>
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 text-[12px] font-semibold tracking-wider text-slate-400 hover:text-white transition-colors w-full">
            <LogOut size={18} /> Secure Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-10 lg:p-12 overflow-y-auto">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-8 tracking-tight">Business Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[12px] font-bold tracking-widest uppercase text-slate-400">Total Revenue</span>
                  <div className="p-2.5 bg-emerald-50 rounded-xl"><TrendingUp size={20} className="text-emerald-600"/></div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">₹{stats.revenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
              </div>
              <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[12px] font-bold tracking-widest uppercase text-slate-400">Active Orders</span>
                  <div className="p-2.5 bg-blue-50 rounded-xl"><Package size={20} className="text-blue-600"/></div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{stats.activeOrders}</h3>
              </div>
              <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[12px] font-bold tracking-widest uppercase text-slate-400">Total Products</span>
                  <div className="p-2.5 bg-purple-50 rounded-xl"><CreditCard size={20} className="text-purple-600"/></div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{stats.totalProducts}</h3>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Order Management</h1>
              <button onClick={fetchAdminOrders} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase hover:bg-slate-50 transition-colors shadow-sm">
                <RefreshCcw size={14} className={isRefreshingOrders ? "animate-spin" : ""} /> Refresh List
              </button>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Order ID</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Date</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Customer</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Amount</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Status</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr><td colSpan="6" className="p-12 text-center text-[13px] text-slate-400 font-medium">No orders yet.</td></tr>
                    ) : (
                      orders.map((order) => (
                        <React.Fragment key={order.id}>
                          <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-5 text-[13px] font-bold text-slate-800">{order.order_number}</td>
                            <td className="p-5 text-[13px] text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                            <td className="p-5 text-[13px] text-slate-700 font-medium">
                              {order.customer_name}
                              <span className="block text-[11px] text-slate-400 font-normal mt-0.5">{order.phone}</span>
                            </td>
                            <td className="p-5 text-[13px] text-slate-800 font-bold">
                              ₹{parseFloat(order.total_amount || 0).toFixed(2)} 
                              <span className="text-[11px] text-slate-400 font-normal ml-1">({order.items_count} items)</span>
                            </td>
                            <td className="p-5">
                              <div className="flex flex-col gap-2">
                                <select 
                                  value={order.status}
                                  onChange={(e) => {
                                    if (e.target.value === 'Shipped') {
                                      const courier = prompt('Courier name (e.g. Delhivery):');
                                      const awb = prompt('AWB / Tracking Number:');
                                      updateOrderStatus(order.id, e.target.value, courier, awb);
                                    } else {
                                      updateOrderStatus(order.id, e.target.value, order.courier_name, order.awb_number);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border outline-none cursor-pointer appearance-none transition-colors ${getStatusColor(order.status)}`}
                                >
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                                {order.awb_number && (
                                  <span className="text-[9px] text-slate-500 font-medium">AWB: {order.awb_number}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-5 text-right">
                              <button 
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                className="text-[11px] font-bold tracking-widest uppercase text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {expandedOrder === order.id ? "Close" : "View"}
                              </button>
                            </td>
                          </tr>

                          <AnimatePresence>
                            {expandedOrder === order.id && (
                              <motion.tr 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: "auto" }} 
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-50 border-b border-slate-200 overflow-hidden"
                              >
                                <td colSpan="6" className="p-0">
                                  <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                      <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3 border-b border-slate-100 pb-2">Shipping Address</h4>
                                      {(() => { const addr = order.shipping_address ? (typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address) : null; return addr ? (
                                        <div className="text-[13px] text-slate-700 leading-relaxed">
                                          <p className="font-bold text-slate-900 mb-1">{addr.fullName || order.customer_name}</p>
                                          <p>{addr.houseNo}, {addr.roadName}</p>
                                          {addr.landmark && <p>Landmark: {addr.landmark}</p>}
                                          <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                                          <p className="mt-2 pt-2 border-t border-slate-100 text-[12px] font-medium">Payment Method: <span className="uppercase text-blue-600 font-bold">{order.payment_method || 'N/A'}</span></p>
                                        </div>
                                      ) : (
                                        <p className="text-[12px] text-slate-400">No address data found.</p>
                                      ); })()}
                                    </div>

                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                      <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-3 border-b border-slate-100 pb-2">Purchased Items</h4>
                                      <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                                        {order.items && (typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, idx) => (
                                          <div key={idx} className="flex gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                            <div className="w-12 h-16 bg-slate-200 rounded overflow-hidden flex-shrink-0">
                                              <img src={item.image || (item.image_urls && item.image_urls[0])} alt="item" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[12px] font-bold text-slate-800 leading-tight mb-1 truncate">{item.title}</p>
                                              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Size: {item.size || item.selectedSize} | Color: {item.color}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                              <p className="text-[13px] font-bold text-slate-800">₹{item.price}</p>
                                              <p className="text-[11px] text-slate-500 mt-1">Qty: {item.quantity || 1}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: MANAGE PRODUCTS */}
        {activeTab === "products" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Inventory Management</h1>
                <p className="text-[13px] text-slate-500">Monitor stock levels, update pricing, and manage your storefront catalog.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by title or SKU..." 
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 text-slate-800 text-[12px] rounded-xl pl-9 pr-4 py-3 outline-none focus:border-blue-500 shadow-sm transition-colors"
                  />
                </div>
                
                <button onClick={() => { setActiveTab("add_product"); setEditingId(null); setFormData(DEFAULT_FORM_STATE); }} className="w-full sm:w-auto flex-shrink-0 bg-blue-600 text-white px-6 py-3 rounded-xl text-[12px] font-bold tracking-wider hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                  + Add New Product
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500 w-20">Preview</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Product Details</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Pricing</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Stock Status</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500">Category</th>
                      <th className="p-5 text-[11px] font-bold tracking-widest uppercase text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-16 text-center">
                          <Package className="mx-auto text-slate-300 mb-4" size={32} />
                          <p className="text-[14px] text-slate-500 font-medium">No products match your search.</p>
                          <p className="text-[12px] text-slate-400 mt-1">Try adjusting your filters or add a new product.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((product) => {
                        const totalStock = calculateTotalStock(product.variants);
                        let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        let statusText = "In Stock";
                        if (totalStock === 0) {
                          statusColor = "bg-red-50 text-red-700 border-red-200";
                          statusText = "Out of Stock";
                        } else if (totalStock < 10) {
                          statusColor = "bg-amber-50 text-amber-700 border-amber-200";
                          statusText = "Low Stock";
                        }

                        return (
                          <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="p-5">
                              <div className="w-14 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm relative">
                                {product.image_urls && product.image_urls.length > 1 && (
                                  <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[8px] px-1 rounded-tl">+{(product.image_urls.length - 1)}</div>
                                )}
                                {product.image_urls && product.image_urls[0] && (
                                  <img src={product.image_urls[0]} alt={product.title} className="w-full h-full object-cover" />
                                )}
                              </div>
                            </td>
                            <td className="p-5">
                              <p className="text-[14px] font-bold text-slate-800">{product.title}</p>
                              <p className="text-[11px] text-slate-400 mt-1 font-medium tracking-wider uppercase">SKU: {product.sku || 'N/A'}</p>
                              <div className="flex gap-2 mt-2">
                                  {product.is_featured && <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded">Homepage</span>}
                                  {product.is_new_arrival && <span className="bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase rounded">New</span>}
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="flex items-baseline gap-2">
                                <span className="text-[15px] text-slate-800 font-bold">₹{parseFloat(product.price).toFixed(2)}</span>
                                {product.mrp && parseFloat(product.mrp) > parseFloat(product.price) && (
                                  <span className="text-[12px] text-slate-400 line-through">₹{parseFloat(product.mrp).toFixed(2)}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-5">
                              <div>
                                <span className={`px-2.5 py-1 text-[9px] font-bold tracking-widest uppercase border rounded-md ${statusColor}`}>{statusText}</span>
                                <p className="text-[11px] text-slate-500 mt-2.5 font-medium">{totalStock} Units Total</p>
                              </div>
                            </td>
                            <td className="p-5">
                              <p className="text-[13px] text-slate-800 font-medium capitalize">{product.main_category}</p>
                              <p className="text-[11px] text-slate-500 capitalize mt-0.5">{product.sub_category}</p>
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={() => handleEdit(product)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100" title="Edit Item">
                                  <Edit size={18} />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete Item">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: ADD/EDIT PRODUCT FORM */}
        {activeTab === "add_product" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
                  {editingId ? "Edit Product" : "List New Product"}
                </h1>
                <p className="text-[13px] text-slate-500">
                  {editingId ? "Update your product details and variations." : "Complete item details, variations, and storefront routing."}
                </p>
              </div>
              {editingId && (
                <button onClick={cancelEdit} className="w-full sm:w-auto text-[12px] font-bold tracking-wider uppercase text-red-500 border border-red-200 bg-red-50 px-6 py-3 rounded-xl hover:bg-red-100 transition-colors">
                  Cancel Edit
                </button>
              )}
            </div>

            <AnimatePresence>
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-bold tracking-wider uppercase flex items-center gap-2 rounded-xl">
                    <CheckCircle2 size={18} /> {editingId ? "Product Successfully Updated!" : "Product Successfully Listed!"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-800 border-b border-slate-100 pb-3">1. Core Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Product Title *</label>
                    <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Noir Velvet Dress" className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Original MRP (₹)</label>
                    <input type="number" step="0.01" name="mrp" value={formData.mrp} onChange={handleChange} placeholder="150.00" className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Selling Price (₹) *</label>
                    <input required type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} placeholder="120.00" className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Base SKU ID *</label>
                    <input required type="text" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. BBY-GRL-DRS" className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">HSN Code</label>
                    <input type="text" name="hsn_code" value={formData.hsn_code} onChange={handleChange} placeholder="e.g. 6111" className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-800 border-b border-slate-100 pb-3">2. Store Routing Path</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Main Category</label>
                    <select name="main_category" value={formData.main_category} onChange={handleChange} className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50 cursor-pointer">
                      {Object.keys(CATEGORY_TREE).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Sub Category</label>
                    <select name="sub_category" value={formData.sub_category} onChange={handleChange} className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50 cursor-pointer">
                      {Object.keys(CATEGORY_TREE[formData.main_category]).map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Item Type</label>
                    <select name="item_type" value={formData.item_type} onChange={handleChange} className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50 cursor-pointer">
                      {CATEGORY_TREE[formData.main_category][formData.sub_category].map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-800 border-b border-slate-100 pb-3">3. Product Attributes</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Fabric Details</label>
                    <input type="text" name="fabric" value={formData.fabric} onChange={handleChange} placeholder="e.g. 100% Cotton" className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Pattern</label>
                    <input type="text" name="pattern" value={formData.pattern} onChange={handleChange} placeholder="e.g. Floral Print" className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Neck Type</label>
                    <input type="text" name="neck_type" value={formData.neck_type} onChange={handleChange} placeholder="e.g. Round Neck" className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50" />
                  </div>
                  <div className="flex items-center gap-3 pt-2 md:pt-8">
                    <input type="checkbox" name="belt_included" checked={formData.belt_included} onChange={handleChange} className="w-5 h-5 accent-blue-600 cursor-pointer rounded" id="beltCheck" />
                    <label htmlFor="beltCheck" className="text-[12px] font-bold tracking-widest uppercase text-slate-700 cursor-pointer">Belt Included?</label>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                  <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-800">4. Inventory Variations Matrix</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Select Sizes</label>
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-wrap gap-2 min-h-[52px]">
                      {ALL_SIZES.map(size => {
                        const selected = formData.sizes.includes(size);
                        return (
                          <button type="button" key={size}
                            onClick={() => setFormData(prev => ({ ...prev, sizes: selected ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size] }))}
                            className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-lg border transition-colors ${selected ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}
                          >{size}</button>
                        );
                      })}
                    </div>
                    {formData.sizes.length > 0 && <p className="text-[10px] text-blue-600 font-medium">{formData.sizes.length} size(s) selected</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Select Colors</label>
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex flex-wrap gap-2 min-h-[52px]">
                      {ALL_COLORS.map(color => {
                        const selected = formData.colors.includes(color.name);
                        return (
                          <button type="button" key={color.name}
                            onClick={() => setFormData(prev => ({ ...prev, colors: selected ? prev.colors.filter(c => c !== color.name) : [...prev.colors, color.name] }))}
                            title={color.name}
                            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-lg border transition-all ${selected ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'}`}
                          >
                            <span className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10" style={{ backgroundColor: color.hex }} />
                            {color.name}
                          </button>
                        );
                      })}
                    </div>
                    {formData.colors.length > 0 && <p className="text-[10px] text-blue-600 font-medium">{formData.colors.length} color(s) selected</p>}
                  </div>
                </div>

                <button type="button" onClick={generateVariants} className="flex items-center justify-center gap-2 bg-slate-800 text-white px-6 py-3.5 rounded-xl text-[11px] font-bold tracking-widest uppercase hover:bg-slate-900 transition-colors w-full md:w-auto shadow-md">
                  <Wand2 size={16} /> Generate Inventory Grid
                </button>

                {formData.variants.length > 0 && (
                  <div className="mt-6 border border-slate-200 rounded-xl overflow-x-auto">
                    <table className="w-full min-w-[500px] text-left bg-white">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="p-4 text-[11px] font-bold tracking-widest uppercase text-slate-500">Color</th>
                          <th className="p-4 text-[11px] font-bold tracking-widest uppercase text-slate-500">Size</th>
                          <th className="p-4 text-[11px] font-bold tracking-widest uppercase text-slate-500">Stock Qty</th>
                          <th className="p-4 text-[11px] font-bold tracking-widest uppercase text-slate-500">Variant SKU</th>
                          <th className="p-4 text-[11px] font-bold tracking-widest uppercase text-slate-500 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {formData.variants.map((variant, index) => (
                            <motion.tr 
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                              key={`${variant.color}-${variant.size}-${index}`} 
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="p-4 text-[13px] font-bold text-slate-800">{variant.color}</td>
                              <td className="p-4 text-[13px] text-slate-600">{variant.size}</td>
                              <td className="p-4">
                                <input type="number" value={variant.stock} onChange={(e) => handleVariantChange(index, "stock", parseInt(e.target.value))} className="border border-slate-300 p-2.5 w-20 md:w-24 rounded-lg text-[13px] outline-none focus:border-blue-500 bg-white" />
                              </td>
                              <td className="p-4">
                                <input type="text" value={variant.sku} onChange={(e) => handleVariantChange(index, "sku", e.target.value)} className="border border-slate-300 p-2.5 w-full rounded-lg text-[13px] outline-none focus:border-blue-500 bg-white text-slate-500" />
                              </td>
                              <td className="p-4 text-center">
                                <button type="button" onClick={() => removeVariant(index)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ================================================== */}
              {/* NEW SECURE UPLOAD BUTTON                           */}
              {/* ================================================== */}
              <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <ImageIcon size={18} /> 5. Product Media Gallery (AWS S3) *
                </h3>
                
                <div className="flex flex-col gap-6">
                  
                  {/* Custom Styled File Input Button */}
                  <label className={`w-full md:w-auto self-start px-8 py-4 rounded-xl text-[12px] font-bold tracking-widest uppercase transition-colors shadow-md cursor-pointer flex items-center justify-center gap-3 ${uploadingImage ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    <UploadCloud size={20} />
                    {uploadingImage ? "Uploading to Cloud..." : "Upload Image from PC"}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                      disabled={uploadingImage}
                    />
                  </label>

                  {formData.image_urls.length === 0 ? (
                    <div className="w-full border-2 border-dashed border-slate-200 rounded-xl p-8 md:p-12 flex flex-col items-center justify-center text-slate-400 text-center">
                      <ImageIcon size={40} className="mb-4 opacity-50" />
                      <p className="text-[13px] font-medium">No images uploaded yet.</p>
                      <p className="text-[11px] uppercase tracking-widest mt-1 opacity-70">Click the button above to upload directly to AWS.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <AnimatePresence>
                        {formData.image_urls.map((url, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            key={idx} 
                            className="relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm group"
                          >
                            <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            
                            <button 
                              type="button"
                              onClick={() => removeImageUrl(idx)}
                              className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"
                            >
                              <X size={14} strokeWidth={2.5} />
                            </button>

                            <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-[9px] font-bold tracking-widest shadow-sm backdrop-blur-md ${idx === 0 ? 'bg-blue-600/90 text-white' : 'bg-black/60 text-white'}`}>
                              {idx === 0 ? "MAIN" : `GAL ${idx}`}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl shadow-sm space-y-6">
                <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-800 border-b border-slate-100 pb-3">6. Description & Manufacturing</h3>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Main Description *</label>
                  <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Enter engaging product description..." className="border border-slate-200 p-4 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50 resize-none"></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Manufacturer Details</label>
                    <textarea name="manufacturer_details" value={formData.manufacturer_details} onChange={handleChange} rows="2" placeholder="Creative Impression..." className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50 resize-none"></textarea>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Care Instructions</label>
                    <textarea name="care_instructions" value={formData.care_instructions} onChange={handleChange} rows="2" placeholder="Machine wash cold..." className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50 resize-none"></textarea>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 shadow-inner">
                <h3 className="text-[13px] font-bold tracking-wider uppercase text-slate-800 border-b border-slate-200 pb-3">7. Storefront & Homepage Controls</h3>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
                  <div>
                    <h3 className="text-[13px] font-bold tracking-wide text-slate-800">Tag as New Arrival</h3>
                    <p className="text-[12px] text-slate-500 mt-1">Show this item inside the "New Arrivals" shop category</p>
                  </div>
                  <button type="button" onClick={() => setFormData({...formData, is_new_arrival: !formData.is_new_arrival})} className={`w-14 h-7 rounded-full transition-colors relative shadow-inner flex-shrink-0 ${formData.is_new_arrival ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${formData.is_new_arrival ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex flex-col bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-[13px] font-bold tracking-wide text-slate-800">Display on Homepage</h3>
                      <p className="text-[12px] text-slate-500 mt-1">Turn this ON to select which grid and card position this product appears in.</p>
                    </div>
                    <button type="button" onClick={() => setFormData({...formData, is_featured: !formData.is_featured})} className={`w-14 h-7 rounded-full transition-colors relative shadow-inner flex-shrink-0 ${formData.is_featured ? 'bg-blue-600' : 'bg-slate-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${formData.is_featured ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {formData.is_featured && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col md:flex-row gap-6">
                          <div className="flex-1">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 block mb-2">Select Section</label>
                            <select name="homepage_section" value={formData.homepage_section} onChange={handleChange} className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50 w-full cursor-pointer">
                              <option value="None">-- Select Section --</option>
                              <option value="New Arrivals">Girl's New Arrivals</option>
                              <option value="Season Bestsellers">Season Bestsellers Grid</option>
                              <option value="Featured Collection">Featured Collection</option>
                            </select>
                          </div>
                          <div className="w-full md:w-56">
                            <label className="text-[11px] font-bold tracking-widest uppercase text-slate-500 block mb-2">Card Position</label>
                            <select name="homepage_card_slot" value={formData.homepage_card_slot} onChange={handleChange} className="border border-slate-200 p-3.5 rounded-xl text-[14px] outline-none focus:border-blue-500 bg-slate-50 w-full cursor-pointer">
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
                <button type="submit" disabled={loading} className="w-full md:w-auto px-16 bg-blue-600 text-white rounded-xl py-4 text-[13px] font-bold tracking-widest uppercase hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50">
                  {loading ? "Saving Data..." : (editingId ? "Update Product" : "Publish to Storefront")}
                </button>
              </div>
            </form>
          </motion.div>
        )}

      </main>
    </div>
  );
}