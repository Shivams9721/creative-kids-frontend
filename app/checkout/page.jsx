"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, MapPin, Loader2, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const SmartInput = ({ label, name, value, placeholder, error, type = "text", disabled = false, badge, onChange }) => (
    <div className="w-full relative">
        <div className={`relative border rounded-lg overflow-hidden transition-colors ${error ? 'border-red-500 bg-red-50/30' : 'border-black/20 focus-within:border-black bg-white'}`}>
            <label className="block text-[9px] font-bold tracking-widest uppercase text-black/50 pt-2 px-3">
                {label} {error && <span className="text-red-500 normal-case tracking-normal font-normal">- {error}</span>}
            </label>
            <div className="flex items-center">
                <input
                    type={type} name={name} value={value} onChange={onChange} disabled={disabled}
                    placeholder={placeholder}
                    className="w-full pb-2 px-3 pt-1 text-[14px] text-black outline-none bg-transparent placeholder:text-black/20"
                />
                {badge && <div className="pr-3">{badge}</div>}
            </div>
        </div>
    </div>
);

export default function CheckoutPage() {
    const { cart, cartTotal, setCart } = useCart();
    const router = useRouter();

    // SECURITY STATE
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const [step, setStep] = useState(1); // 1: Address, 2: Summary, 3: Payment
    const [loading, setLoading] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false);

    // Form State
    const [address, setAddress] = useState({
        fullName: "", phone: "", altPhone: "", pincode: "",
        state: "", city: "", houseNo: "", roadName: "", landmark: ""
    });

    const [errors, setErrors] = useState({});
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [coupon, setCoupon] = useState("");
    const [couponStatus, setCouponStatus] = useState(null); // null | 'checking' | { discount, code } | 'error'
    const [couponError, setCouponError] = useState("");

    // UI States
    const [showAltPhone, setShowAltPhone] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    // ==========================================
    // 1. SECURITY CHECK (NEW)
    // ==========================================
    useEffect(() => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            // If they are not logged in, alert them and send them to the login page!
            alert("Please log in or create an account to securely place your order.");
            router.push("/login"); 
        } else {
            // If they are logged in, allow the checkout page to load
            setIsCheckingAuth(false);
        }
    }, [router]);

    // ==========================================
    // 2. SMART PINCODE FETCH
    // ==========================================
    useEffect(() => {
        const fetchLocation = async () => {
            if (address.pincode.length === 6) {
                setIsFetchingLocation(true);
                try {
                    const response = await fetch(`https://api.postalpincode.in/pincode/${address.pincode}`);
                    const data = await response.json();

                    if (data[0].Status === "Success") {
                        const postOffice = data[0].PostOffice[0];
                        setAddress(prev => ({
                            ...prev,
                            city: postOffice.District,
                            state: postOffice.State
                        }));
                        setErrors(prev => ({ ...prev, city: null, state: null, pincode: null }));
                    } else {
                        setErrors(prev => ({ ...prev, pincode: "Invalid Pincode" }));
                    }
                } catch (error) {
                    console.error("Failed to fetch location");
                } finally {
                    setIsFetchingLocation(false);
                }
            }
        };
        fetchLocation();
    }, [address.pincode]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if ((name === "phone" || name === "altPhone" || name === "pincode") && !/^\d*$/.test(value)) return;
        if (name === "pincode" && value.length > 6) return;
        if ((name === "phone" || name === "altPhone") && value.length > 10) return;

        setAddress(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validateAddress = () => {
        const newErrors = {};
        if (!address.fullName.trim()) newErrors.fullName = "Required";
        if (!address.phone.trim() || address.phone.length < 10) newErrors.phone = "Valid 10-digit number required";
        if (!address.pincode.trim() || address.pincode.length < 6) newErrors.pincode = "Valid 6-digit pincode required";
        if (!address.state.trim()) newErrors.state = "Required";
        if (!address.city.trim()) newErrors.city = "Required";
        if (!address.houseNo.trim()) newErrors.houseNo = "Required";
        if (!address.roadName.trim()) newErrors.roadName = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveAddress = () => {
        if (validateAddress()) {
            setStep(2);
            window.scrollTo(0, 0);
        }
    };

    const applyCoupon = async () => {
        if (!coupon.trim()) return;
        setCouponStatus('checking');
        setCouponError("");
        try {
            const res = await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/coupons/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: coupon, orderAmount: cartTotal })
            });
            const data = await res.json();
            if (res.ok) setCouponStatus(data);
            else { setCouponStatus(null); setCouponError(data.error || "Invalid coupon."); }
        } catch { setCouponStatus(null); setCouponError("Failed to validate coupon."); }
    };

    const discountAmount = couponStatus?.discount || 0;
    const finalTotal = Math.max(0, cartTotal - discountAmount);

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem("user");
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const userEmail = currentUser ? currentUser.email : "guest";

            const response = await fetch("https://vbaumdstnz.ap-south-1.awsapprunner.com/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cartItems: cart,
                    totalAmount: cartTotal,
                    address,
                    paymentMethod,
                    userEmail,
                    couponCode: couponStatus?.code || null,
                    discountAmount 
                })
            });

            const data = await response.json();

            if (data.success) {
                setOrderSuccess(true);
                localStorage.setItem('lastOrder', JSON.stringify({
                  orderNumber: data.order_number,
                  items: cart,
                  total: finalTotal,
                  address,
                  paymentMethod,
                  date: new Date().toISOString()
                }));
                clearCart();
                setTimeout(() => {
                    router.push('/success');
                }, 4000);
            } else {
                alert("Failed to place order. Please try again.");
            }
        } catch (error) {
            console.error("Order error:", error);
            alert("Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // RENDER SCREENS
    // ==========================================

    // 1. Show a loading spinner while checking security clearance
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4 bg-white">
                <Loader2 size={40} className="animate-spin text-black/30 mb-4" />
                <p className="text-[11px] font-bold tracking-widest uppercase text-black/50">Securing Checkout...</p>
            </div>
        );
    }

    // 2. Prevent empty checkouts
    if (cart.length === 0 && !orderSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-20 px-4 bg-white">
                <h2 className="text-2xl font-light tracking-widest uppercase mb-4 text-black">Your cart is empty</h2>
                <Link href="/shop" className="bg-black text-white px-8 py-3 text-[11px] font-bold tracking-widest uppercase hover:bg-black/80 transition-colors rounded-full">
                    Return to Shop
                </Link>
            </div>
        );
    }

    // 3. Main Checkout UI
    return (
        <main className="min-h-screen bg-white pt-[64px] md:pt-[72px] pb-24">

            {orderSuccess ? (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto mt-20 p-8 bg-white border border-black/10 rounded-xl text-center shadow-2xl">
                    <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} className="text-black" />
                    </div>
                    <h2 className="text-2xl font-light tracking-widest uppercase text-black mb-4">Order Confirmed!</h2>
                    <p className="text-[13px] text-black/60 mb-8">Thank you for shopping with Creative Kids. Your order has been placed successfully.</p>
                    <p className="text-[10px] tracking-widest uppercase text-black/40 animate-pulse">Redirecting to shop...</p>
                </motion.div>
            ) : (
                <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8">

                    {/* TOP PROGRESS BAR */}
                    <div className="flex items-center justify-center mb-10 md:mb-16">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${step >= 1 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>1</div>
                            <span className={`text-[11px] font-bold tracking-widest uppercase hidden md:block ${step >= 1 ? 'text-black' : 'text-gray-400'}`}>Address</span>
                        </div>
                        <div className={`w-12 md:w-24 h-[1px] mx-4 ${step >= 2 ? 'bg-black' : 'bg-gray-200'}`}></div>
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${step >= 2 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>2</div>
                            <span className={`text-[11px] font-bold tracking-widest uppercase hidden md:block ${step >= 2 ? 'text-black' : 'text-gray-400'}`}>Summary</span>
                        </div>
                        <div className={`w-12 md:w-24 h-[1px] mx-4 ${step >= 3 ? 'bg-black' : 'bg-gray-200'}`}></div>
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${step >= 3 ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>3</div>
                            <span className={`text-[11px] font-bold tracking-widest uppercase hidden md:block ${step >= 3 ? 'text-black' : 'text-gray-400'}`}>Payment</span>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* MAIN CONTENT AREA */}
                        <div className="flex-1 bg-white border border-black/10 rounded-xl shadow-sm overflow-hidden">

                            {/* STEP 1: SMART ADDRESS FORM */}
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 md:p-10">
                                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-black/5">
                                        <button onClick={() => router.back()} className="text-black/50 hover:text-black transition-colors"><ChevronLeft size={20} /></button>
                                        <h2 className="text-[16px] font-medium tracking-wide text-black">Delivery Details</h2>
                                    </div>

                                    <div className="space-y-8">

                                        {/* Contact Block */}
                                        <div>
                                            <h3 className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-3">1. Contact Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <SmartInput label="Full Name *" name="fullName" value={address.fullName} onChange={handleInputChange} error={errors.fullName} placeholder="Jane Doe" />
                                                <SmartInput label="Phone Number *" name="phone" value={address.phone} onChange={handleInputChange} error={errors.phone} placeholder="10-digit mobile number" />
                                            </div>

                                            {/* ALTERNATE PHONE TOGGLE */}
                                            <AnimatePresence>
                                                {!showAltPhone ? (
                                                    <button onClick={() => setShowAltPhone(true)} className="text-[10px] font-bold tracking-widest uppercase text-black/50 hover:text-black mt-3 transition-colors">
                                                        + Add Alternate Phone Number
                                                    </button>
                                                ) : (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="mt-4 w-full md:w-1/2">
                                                        <SmartInput label="Alternate Phone" name="altPhone" value={address.altPhone} onChange={handleInputChange} placeholder="Optional secondary number" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Regional Block */}
                                        <div className="pt-6 border-t border-black/5">
                                            <h3 className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-3 flex items-center gap-2">
                                                2. Regional Details <span className="normal-case tracking-normal text-black/30 font-normal">(Auto-fills via Pincode)</span>
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <SmartInput
                                                    label="Pincode *" name="pincode" value={address.pincode} onChange={handleInputChange} error={errors.pincode} placeholder="e.g. 110001"
                                                    badge={isFetchingLocation ? <Loader2 size={16} className="animate-spin text-black/50" /> : (address.pincode.length === 6 && !errors.pincode ? <CheckCircle2 size={16} className="text-green-500" /> : null)}
                                                />
                                                <SmartInput label="City *" name="city" value={address.city} onChange={handleInputChange} error={errors.city} placeholder="City" disabled={isFetchingLocation} />
                                                <SmartInput label="State *" name="state" value={address.state} onChange={handleInputChange} error={errors.state} placeholder="State" disabled={isFetchingLocation} />
                                            </div>
                                        </div>

                                        {/* Exact Location Block */}
                                        <div className="pt-6 border-t border-black/5">
                                            <h3 className="text-[10px] font-bold tracking-widest uppercase text-black/40 mb-3">3. Exact Location</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <SmartInput label="House No., Building *" name="houseNo" value={address.houseNo} onChange={handleInputChange} error={errors.houseNo} placeholder="Flat/House No." />
                                                <SmartInput label="Road Name, Area *" name="roadName" value={address.roadName} onChange={handleInputChange} error={errors.roadName} placeholder="Street, Sector, Area" />
                                            </div>
                                            <SmartInput label="Landmark (Optional)" name="landmark" value={address.landmark} onChange={handleInputChange} placeholder="e.g. Near Apollo Hospital" />
                                        </div>

                                        <button onClick={handleSaveAddress} className="w-full bg-black hover:bg-black/80 text-white font-bold tracking-widest uppercase py-4 mt-8 text-[12px] transition-colors rounded-full">
                                            Save & Continue to Summary
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 2: ORDER SUMMARY */}
                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 md:p-10">
                                    <div className="flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                                        <button onClick={() => setStep(1)} className="text-black/50 hover:text-black transition-colors"><ChevronLeft size={20} /></button>
                                        <h2 className="text-[16px] font-medium tracking-wide text-black">Order Summary</h2>
                                    </div>

                                    <div className="mb-8 bg-[#fcfcfc] p-6 border border-black/10 rounded-xl flex justify-between items-start">
                                        <div>
                                            <h3 className="text-[14px] font-bold text-black mb-2 flex items-center gap-2">
                                                <MapPin size={16} className="text-black/50" /> Delivering to: {address.fullName}
                                            </h3>
                                            <div className="text-[13px] text-black/70 space-y-1 pl-6">
                                                <p>{address.houseNo}, {address.roadName}</p>
                                                {address.landmark && <p>Landmark: {address.landmark}</p>}
                                                <p>{address.city}, {address.state} - <span className="font-medium text-black">{address.pincode}</span></p>
                                                <p className="pt-2 font-medium text-black">Contact: {address.phone} {address.altPhone && `/ ${address.altPhone}`}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setStep(1)} className="text-[10px] font-bold uppercase tracking-widest text-black/50 hover:text-black border-b border-black/20 hover:border-black transition-all pb-0.5">Edit</button>
                                    </div>

                                    <div className="space-y-6">
                                        {cart.map((item, index) => (
                                            <div key={index} className="flex gap-6 border-b border-black/5 pb-6">
                                                <div className="w-24 h-32 bg-gray-100 flex-shrink-0 rounded-md overflow-hidden">
                                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 flex flex-col justify-center">
                                                    <h3 className="text-[15px] text-black font-medium mb-1">{item.title}</h3>
                                                    <p className="text-[12px] text-black/50 tracking-widest uppercase">Size: {item.selectedSize || item.size} | Color: {item.selectedColor || item.color}</p>
                                                    <div className="flex gap-3 items-center mt-3">
                                                        <span className="text-[15px] font-bold text-black">₹{item.price}</span>
                                                        {item.mrp > item.price && (
                                                            <>
                                                                <span className="text-[12px] text-black/40 line-through">₹{item.mrp}</span>
                                                                <span className="text-[10px] font-bold text-black border border-black/10 px-2 py-0.5 rounded-sm bg-black/5">
                                                                    {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                    <p className="text-[12px] text-black/70 mt-2">Quantity: {item.quantity || 1}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={() => { setStep(3); window.scrollTo(0, 0); }} className="w-full bg-black hover:bg-black/80 text-white font-bold tracking-widest uppercase py-4 mt-8 text-[12px] transition-colors rounded-full">
                                        Continue to Payment
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 3: PAYMENT */}
                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 md:p-10">
                                    <div className="flex items-center gap-3 mb-8 border-b border-black/5 pb-4">
                                        <button onClick={() => setStep(2)} className="text-black/50 hover:text-black transition-colors"><ChevronLeft size={20} /></button>
                                        <h2 className="text-[16px] font-medium tracking-wide text-black">Payment Options</h2>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <label className={`flex items-center gap-4 p-5 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'UPI' ? 'border-black bg-[#fcfcfc]' : 'border-black/10 hover:border-black/30'}`}>
                                            <input type="radio" name="payment" value="UPI" checked={paymentMethod === 'UPI'} onChange={() => setPaymentMethod('UPI')} className="w-4 h-4 accent-black" />
                                            <span className="text-[14px] font-medium text-black">UPI (Google Pay, PhonePe, Paytm)</span>
                                        </label>
                                        <label className={`flex items-center gap-4 p-5 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'Card' ? 'border-black bg-[#fcfcfc]' : 'border-black/10 hover:border-black/30'}`}>
                                            <input type="radio" name="payment" value="Card" checked={paymentMethod === 'Card'} onChange={() => setPaymentMethod('Card')} className="w-4 h-4 accent-black" />
                                            <span className="text-[14px] font-medium text-black">Credit / Debit Card</span>
                                        </label>
                                        <label className={`flex items-center gap-4 p-5 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-black bg-[#fcfcfc]' : 'border-black/10 hover:border-black/30'}`}>
                                            <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="w-4 h-4 accent-black" />
                                            <div>
                                                <span className="text-[14px] font-medium block text-black">Cash on Delivery</span>
                                                <span className="text-[11px] text-black/50 mt-1 block">Pay directly to the delivery executive when your order arrives.</span>
                                            </div>
                                        </label>
                                    </div>

                                    <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-black hover:bg-black/80 text-white font-bold tracking-widest uppercase py-4 mt-4 text-[12px] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 rounded-full">
                                        {loading ? "Processing Securely..." : `Confirm & Pay ₹${finalTotal.toFixed(2)}`}
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* PRICE DETAILS WIDGET */}
                        <div className="w-full lg:w-[340px] flex-shrink-0">
                            <div className="bg-[#fcfcfc] border border-black/10 rounded-xl p-8 sticky top-24 shadow-sm">
                                <h3 className="text-[11px] font-bold tracking-widest uppercase text-black border-b border-black/10 pb-4 mb-6">Price Details</h3>
                                <div className="space-y-4 text-[13px] mb-6 pb-6 border-b border-black/10">
                                    <div className="flex justify-between text-black/70">
                                        <span>Cart Value ({cart.length} items)</span>
                                        <span>₹{cartTotal.toFixed(2)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-green-600 font-medium">
                                            <span>Coupon ({couponStatus.code})</span>
                                            <span>- ₹{discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-black/70">
                                        <span>Delivery Charges</span>
                                        <span className="text-black font-medium tracking-widest uppercase text-[10px] bg-black/5 px-2 py-1 rounded">Free</span>
                                    </div>
                                </div>
                                {/* Coupon Input */}
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">Coupon Code</p>
                                    {couponStatus && couponStatus.discount ? (
                                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                            <span className="text-[12px] font-bold text-green-700">{couponStatus.code} applied — ₹{discountAmount} off</span>
                                            <button onClick={() => { setCouponStatus(null); setCoupon(""); }} className="text-green-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input type="text" value={coupon} onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponError(""); }}
                                                placeholder="Enter code" className="flex-1 border border-black/20 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-black uppercase" />
                                            <button onClick={applyCoupon} disabled={couponStatus === 'checking'}
                                                className="px-4 py-2 bg-black text-white rounded-lg text-[11px] font-bold tracking-widest uppercase disabled:opacity-50">
                                                {couponStatus === 'checking' ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                    )}
                                    {couponError && <p className="text-[11px] text-red-500 mt-1">{couponError}</p>}
                                </div>
                                <div className="flex justify-between text-[16px] font-bold text-black mb-6">
                                    <span>Total Amount</span>
                                    <span>₹{finalTotal.toFixed(2)}</span>
                                </div>

                                <div className="bg-black/5 rounded-lg p-4 flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-black flex-shrink-0 mt-0.5" />
                                    <p className="text-[10px] tracking-widest uppercase text-black/60 leading-relaxed">
                                        Safe and secure payments. 100% Authentic products.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </main>
    );
}