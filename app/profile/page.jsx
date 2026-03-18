"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, RefreshCcw, Settings, MapPin, LogOut, CheckCircle2, Circle, X, Heart
} from "lucide-react";

const DEMO_RETURNS = [
  { id: "#RET-0012", orderId: "#ORD-0041", item: "Classic Blue Romper", date: "Aug 15, 2023", status: "Refunded" }
];

// The timeline steps your admin panel uses
const TRACKING_STEPS = ["Processing", "Shipped", "Delivered"];

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Real data states
  const [user, setUser] = useState({ name: "Loading...", email: "...", phone: "", address: "", points: 0 });

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  // Tracking Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);

  // ==========================================
  // 1. DATA FETCHING (ALL HOOKS INSIDE THE COMPONENT)
  // ==========================================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    // If no user data is found, send them to login
    if (!savedUser) {
      window.location.href = "/login";
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(prev => ({ ...prev, name: parsedUser.name, email: parsedUser.email }));

    // Fetch My Orders using the new Advanced Order route
    const fetchMyOrders = async () => {
      try {
        const response = await fetch(`https://vbaumdstnz.ap-south-1.awsapprunner.com/api/orders/user/${parsedUser.email}`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchMyOrders();

    // Fetch My Wishlist
    const fetchMyWishlist = async () => {
      try {
        const response = await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/wishlist", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setWishlist(data);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist", error);
      } finally {
        setLoadingWishlist(false);
      }
    };
    if (token) fetchMyWishlist();

  }, []); 

  // ==========================================
  // 2. HELPER FUNCTIONS
  // ==========================================
  const getInitials = (name) => {
    if (!name || name === "Loading...") return "";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getStepStatus = (currentStatus, stepName) => {
    // If it's cancelled, treat differently
    if (currentStatus === "Cancelled") return "pending";

    const currentIndex = TRACKING_STEPS.indexOf(currentStatus);
    const stepIndex = TRACKING_STEPS.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  // ==========================================
  // 3. RENDER UI
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f6f5f3] flex flex-col md:flex-row pt-[64px] md:pt-[72px]">

      {/* SIDEBAR */}
      <aside className="w-full md:w-72 bg-white border-r border-black/10 flex-shrink-0 md:min-h-[calc(100vh-72px)] flex flex-col overflow-y-auto z-10">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-black/10">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-medium text-black">
              {getInitials(user.name)}
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-black capitalize">{user.name}</h2>
              <p className="text-[11px] text-black/50 tracking-wider">{user.points} Reward Points</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <button onClick={() => setActiveTab("dashboard")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'dashboard' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <User size={16} strokeWidth={1.5} /> Personal Info
            </button>
            <button onClick={() => setActiveTab("orders")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'orders' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <Package size={16} strokeWidth={1.5} /> My Orders
            </button>
            <button onClick={() => setActiveTab("wishlist")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'wishlist' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <Heart size={16} strokeWidth={1.5} /> My Wishlist
            </button>
            <button onClick={() => setActiveTab("returns")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'returns' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <RefreshCcw size={16} strokeWidth={1.5} /> Returns
            </button>
            <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors rounded-md ${activeTab === 'settings' ? 'bg-black text-white' : 'text-black/60 hover:bg-gray-100 hover:text-black'}`}>
              <Settings size={16} strokeWidth={1.5} /> Settings
            </button>

            <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold tracking-widest uppercase text-red-500 hover:bg-red-50 transition-colors rounded-md mt-8 border border-red-100">
              <LogOut size={16} strokeWidth={1.5} /> Sign Out
            </button>
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto relative">

        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">My Profile</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-xl border border-black/10 shadow-sm relative">
                <button onClick={() => setActiveTab("settings")} className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:underline">Edit</button>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black/50 mb-6 flex items-center gap-2"><User size={16} /> Contact Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">Name</p>
                    <p className="text-[14px] text-black font-medium capitalize">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-[14px] text-black font-medium">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-black/10 shadow-sm relative">
                <button onClick={() => setActiveTab("settings")} className="absolute top-6 right-6 text-[10px] font-bold uppercase tracking-widest text-blue-500 hover:underline">Edit</button>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black/50 mb-6 flex items-center gap-2"><MapPin size={16} /> Default Shipping Address</h3>
                <p className="text-[13px] text-black/50 leading-relaxed italic">
                  No address saved yet. Update in settings.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: MY ORDERS */}
        {activeTab === "orders" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">Order History</h1>
            <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-black/10">
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Order ID</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Date</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Total</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Status</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-[12px] text-black/50">Loading your orders...</td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-[13px] text-black/50">You haven't placed any orders yet.</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="border-b border-black/5 hover:bg-gray-50 transition-colors">
                          <td className="p-4 text-[13px] font-bold text-black">{order.order_number}</td>
                          <td className="p-4 text-[13px] text-black/70">{new Date(order.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-[13px] text-black font-bold">₹{parseFloat(order.total_amount).toFixed(2)}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                              <button 
                                onClick={() => setSelectedOrder(order)}
                                className="text-[11px] font-bold tracking-widest uppercase text-black hover:text-black/50 transition-colors border-b border-black pb-0.5"
                              >
                                View
                              </button>
                              {order.status === 'Processing' && (
                                <button
                                  onClick={async () => {
                                    if (!window.confirm('Cancel this order?')) return;
                                    const token = localStorage.getItem('token');
                                    const res = await fetch(`https://vbaumdstnz.ap-south-1.awsapprunner.com/api/orders/${order.id}/cancel`, {
                                      method: 'POST',
                                      headers: { Authorization: `Bearer ${token}` }
                                    });
                                    if (res.ok) setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Cancelled' } : o));
                                    else alert('Could not cancel order.');
                                  }}
                                  className="text-[11px] font-bold tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors border-b border-red-300 pb-0.5"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: MY WISHLIST */}
        {activeTab === "wishlist" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">My Wishlist</h1>

            {loadingWishlist ? (
              <p className="text-[12px] text-black/50">Loading your favorites...</p>
            ) : wishlist.length === 0 ? (
              <div className="bg-white p-12 rounded-xl border border-black/10 text-center flex flex-col items-center">
                <Heart size={40} strokeWidth={1} className="text-black/20 mb-4" />
                <p className="text-[13px] text-black/60 mb-6">You haven't saved any items yet.</p>
                <button onClick={() => window.location.href = '/shop'} className="bg-black text-white px-8 py-3 rounded-full text-[11px] font-bold tracking-widest uppercase">Explore Shop</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {wishlist.map((product) => (
                  <div key={product.id} className="flex flex-col group">
                    <div className="relative w-full aspect-[3/4] bg-[#f6f5f3] overflow-hidden mb-4">
                      <button
                        onClick={async () => {
                          const token = localStorage.getItem("token");
                          await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/wishlist/toggle", {
                            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify({ productId: product.id })
                          });
                          setWishlist(wishlist.filter(p => p.id !== product.id));
                        }}
                        className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full hover:scale-110 transition-transform shadow-sm"
                      >
                        <Heart strokeWidth={1.5} size={18} className="fill-red-500 text-red-500" />
                      </button>
                      <img
                        src={product.image_urls?.[0] || 'https://via.placeholder.com/400x500'}
                        alt={product.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out cursor-pointer"
                        onClick={() => window.location.href = `/product/${product.id}`}
                      />
                    </div>
                    <div className="flex flex-col px-1">
                      <h3 className="text-[13px] text-black mb-1 truncate">{product.title}</h3>
                      <p className="text-[12px] text-black font-medium">₹{parseFloat(product.price).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* TAB 4: RETURNS */}
        {activeTab === "returns" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex justify-between items-end mb-8">
              <h1 className="text-2xl font-light tracking-widest uppercase text-black">Returns & Refunds</h1>
              <button className="text-[11px] font-bold uppercase tracking-widest border border-black px-4 py-2 rounded-full hover:bg-black hover:text-white transition-colors">
                Initiate New Return
              </button>
            </div>
            <div className="bg-white border border-black/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-black/10">
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Return ID</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Original Order</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Item</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Request Date</th>
                      <th className="p-4 text-[10px] font-bold tracking-widest uppercase text-black/60">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEMO_RETURNS.map((ret, idx) => (
                      <tr key={idx} className="border-b border-black/5 hover:bg-gray-50">
                        <td className="p-4 text-[12px] font-medium text-black">{ret.id}</td>
                        <td className="p-4 text-[12px] text-black/70">{ret.orderId}</td>
                        <td className="p-4 text-[12px] text-black">{ret.item}</td>
                        <td className="p-4 text-[12px] text-black/70">{ret.date}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border bg-gray-100 text-gray-700 border-gray-200">
                            {ret.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: SETTINGS */}
        {activeTab === "settings" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <h1 className="text-2xl font-light tracking-widest uppercase text-black mb-8">Account Settings</h1>
            <form className="bg-white p-8 border border-black/10 rounded-xl shadow-sm space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const token = localStorage.getItem('token');
              const name = e.target.name.value;
              const phone = e.target.phone.value;
              try {
                const res = await fetch('https://vbaumdstnz.ap-south-1.awsapprunner.com/api/user/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ name, phone })
                });
                if (res.ok) {
                  const saved = JSON.parse(localStorage.getItem('user') || '{}');
                  localStorage.setItem('user', JSON.stringify({ ...saved, name }));
                  setUser(prev => ({ ...prev, name }));
                  alert('Settings saved!');
                } else { alert('Failed to save. Try again.'); }
              } catch { alert('Network error.'); }
            }}>
              <h3 className="text-[12px] font-bold tracking-widest uppercase text-black border-b border-black/10 pb-2">Edit Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Full Name</label>
                  <input type="text" name="name" defaultValue={user.name} className="border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black transition-colors capitalize" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Phone Number</label>
                  <input type="tel" name="phone" defaultValue={user.phone || ''} placeholder="10-digit mobile number" className="border border-black/20 p-3 rounded-lg text-[13px] outline-none focus:border-black transition-colors" />
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-black/70">Email Address (Cannot be changed)</label>
                  <input type="email" defaultValue={user.email} disabled className="border border-black/10 bg-gray-50 text-black/50 p-3 rounded-lg text-[13px] cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-6 border-t border-black/10 flex justify-end">
                <button type="submit" className="bg-black text-white px-8 py-3.5 rounded-full text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors shadow-lg">
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ========================================== */}
        {/* VISUAL TRACKING TIMELINE MODAL             */}
        {/* ========================================== */}
        <AnimatePresence>
          {selectedOrder && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedOrder(null)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 z-50 border border-black/10"
              >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-xl font-light text-black">Track Package</h2>
                    <p className="text-[12px] text-black/50 font-medium mt-1">Order {selectedOrder.order_number}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} className="text-black/60" />
                  </button>
                </div>

                <div className="relative pl-4 space-y-8">
                  <div className="absolute left-[27px] top-4 bottom-8 w-[2px] bg-gray-100 z-0"></div>
                  
                  {/* Status Cancelled logic */}
                  {selectedOrder.status === "Cancelled" ? (
                    <div className="relative z-10 flex gap-6 items-start">
                      <div className="bg-white py-1">
                        <X size={24} className="text-red-500 bg-red-50 rounded-full p-1" />
                      </div>
                      <div className="pt-1">
                        <h4 className="text-[13px] font-bold tracking-widest uppercase text-red-600">Order Cancelled</h4>
                        <p className="text-[11px] text-gray-500 mt-1">This order has been cancelled.</p>
                      </div>
                    </div>
                  ) : (
                    TRACKING_STEPS.map((stepName) => {
                      const status = getStepStatus(selectedOrder.status, stepName);
                      return (
                        <div key={stepName} className="relative z-10 flex gap-6 items-start">
                          <div className="bg-white py-1">
                            {status === "completed" && <CheckCircle2 size={24} className="text-green-500 fill-green-50" />}
                            {status === "current" && (
                              <div className="relative flex items-center justify-center w-6 h-6">
                                <span className="absolute w-full h-full bg-blue-400 rounded-full animate-ping opacity-30"></span>
                                <Circle size={20} className="text-blue-600 fill-blue-600" />
                              </div>
                            )}
                            {status === "pending" && <Circle size={24} className="text-gray-300" />}
                          </div>
                          <div className="pt-1">
                            <h4 className={`text-[13px] font-bold tracking-widest uppercase ${status === 'pending' ? 'text-gray-400' : 'text-black'}`}>
                              {stepName}
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-1">
                              {status === "completed" && "Completed successfully."}
                              {status === "current" && "Your package is currently in this stage."}
                              {status === "pending" && "Waiting for previous step to complete."}
                            </p>
                            {stepName === "Shipped" && status !== "pending" && selectedOrder.awb_number && (
                              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                                <p className="text-[10px] font-bold tracking-widest uppercase text-blue-600">Courier: {selectedOrder.courier_name}</p>
                                <p className="text-[11px] font-bold text-blue-800 mt-0.5">AWB: {selectedOrder.awb_number}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedOrder.status !== "Cancelled" && (
                  <div className="mt-10 pt-6 border-t border-black/10 flex justify-center">
                    <p className="text-[10px] text-black/50 tracking-widest uppercase font-medium">Estimated Delivery: 3-5 Business Days</p>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}