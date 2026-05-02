"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { useRouter } from "next/navigation";
import { csrfHeaders } from "@/lib/csrf";
import { initializeRazorpay, processRazorpayPayment } from "@/lib/razorpay";
import { safeFetch } from "@/lib/safeFetch";
import AddressBook from "@/components/AddressBook";
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
    const { cart, cartTotal, setCart, clearCart } = useCart();
    const { cod_enabled } = useSettings();
    const router = useRouter();

    // Live COD eligibility from backend (refreshed when pincode changes).
    // Shape: { codEnabled, pincodeServiceable, pincodeReason, maxAmount, isFirstOrder, codFee, phoneVerifyRequired }
    const [codElig, setCodElig] = useState({ codEnabled: true, pincodeServiceable: true, maxAmount: 1999, isFirstOrder: false, codFee: 0, phoneVerifyRequired: false });

    // Phone OTP gate for COD (only used when settings.cod_phone_verify_required is on).
    const [phoneOtp, setPhoneOtp] = useState({ sent: false, code: "", verified: false, token: "", error: "", busy: false });

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
    const [savedAddress, setSavedAddress] = useState(null);
    const [coupon, setCoupon] = useState("");
    const [couponStatus, setCouponStatus] = useState(null); // null | 'checking' | { discount_amount, code } | 'error'
    const [couponError, setCouponError] = useState("");

    // Loyalty Points
    const [loyaltyBalance, setLoyaltyBalance] = useState(0);
    const [loyaltyPointsInput, setLoyaltyPointsInput] = useState("");
    const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
    const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
    const [loyaltyError, setLoyaltyError] = useState("");

    // UI States
    const [showAltPhone, setShowAltPhone] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    // SECURITY CHECK
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/login?redirect=/checkout");
            return;
        }
        setIsCheckingAuth(false);
        // Load saved address from DB
        safeFetch('/api/user/address', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                // Backend returns an array of addresses
                const list = Array.isArray(data) ? data : [];
                const defaultAddr = list.find(a => a.is_default) || list[0];
                if (defaultAddr) {
                    const formatted = {
                        fullName: defaultAddr.full_name, phone: defaultAddr.phone,
                        houseNo: defaultAddr.house_no, roadName: defaultAddr.road_name,
                        city: defaultAddr.city, state: defaultAddr.state,
                        pincode: defaultAddr.pincode, landmark: defaultAddr.landmark || "", altPhone: ""
                    };
                    setAddress(prev => ({ ...prev, ...formatted }));
                    setSavedAddress(formatted);
                }
            })
            .catch(() => {
                // Fallback to localStorage
                try {
                    const a = localStorage.getItem('ck_address');
                    if (a) { const parsed = JSON.parse(a); setAddress(prev => ({ ...prev, ...parsed })); setSavedAddress(parsed); }
                } catch {}
            });
        // Load loyalty points balance
        safeFetch('/api/loyalty/balance', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (typeof data.balance === 'number') setLoyaltyBalance(data.balance); })
            .catch(() => {});
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

                    if (data[0]?.Status === "Success") {
                        const postOffice = data[0]?.PostOffice?.[0];
                        if (postOffice) {
                          setAddress(prev => ({
                              ...prev,
                              city: postOffice.District,
                              state: postOffice.State
                          }));
                          setErrors(prev => ({ ...prev, city: null, state: null, pincode: null }));
                        }
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
            const token = localStorage.getItem("token");
            const res = await safeFetch(`/api/coupons/validate`, {
                method: "POST",
                headers: {
                  ...(await csrfHeaders({ "Content-Type": "application/json" })),
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ code: coupon.trim(), order_total: cartTotal })
            });
            const data = await res.json();
            if (res.ok && data.valid) setCouponStatus(data);
            else { setCouponStatus(null); setCouponError(data.error || "Invalid coupon."); }
        } catch { setCouponStatus(null); setCouponError("Failed to validate coupon."); }
    };

    const applyLoyaltyPoints = async () => {
        setLoyaltyError("");
        const pts = parseInt(loyaltyPointsInput) || 0;
        if (pts <= 0) { setLoyaltyError("Enter a valid number of points"); return; }
        try {
            const token = localStorage.getItem("token");
            const res = await safeFetch('/api/loyalty/validate-redeem', {
                method: 'POST',
                headers: {
                  ...(await csrfHeaders({ 'Content-Type': 'application/json' })),
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ points_to_redeem: pts, order_total: cartTotal }),
            });
            const data = await res.json();
            if (res.ok && data.valid) {
                setLoyaltyDiscount(data.discount_amount);
                setLoyaltyPointsUsed(data.points_used);
            } else {
                setLoyaltyError(data.error || 'Could not apply points');
            }
        } catch { setLoyaltyError('Failed to apply points'); }
    };

    const discountAmount = couponStatus?.discount_amount || 0;
    const subtotalAfterDiscount = Math.max(0, cartTotal - discountAmount - loyaltyDiscount);
    // Shipping: free above ₹499 subtotal-after-discount, else flat ₹99. Mirrors backend.
    const shippingFee = subtotalAfterDiscount >= 499 ? 0 : 99;
    const codFeeApplied = paymentMethod === 'COD' ? Number(codElig.codFee || 0) : 0;
    const finalTotal = subtotalAfterDiscount + shippingFee + codFeeApplied;

    // COD availability: global toggle + threshold + pincode serviceability.
    const codAvailable = !!codElig.codEnabled
        && codElig.pincodeServiceable
        && (finalTotal + (paymentMethod === 'COD' ? 0 : Number(codElig.codFee || 0))) < Number(codElig.maxAmount || 1999);

    // Refetch eligibility whenever pincode changes (debounced) — single source of truth from backend.
    useEffect(() => {
        const pin = (address.pincode || '').trim();
        if (!/^\d{6}$/.test(pin)) return;
        const t = setTimeout(() => {
            const url = `/api/cod/eligibility?pincode=${encodeURIComponent(pin)}`;
            safeFetch(url).then(r => r.json()).then(d => {
                if (d && typeof d === 'object') setCodElig(prev => ({ ...prev, ...d }));
            }).catch(() => {});
        }, 350);
        return () => clearTimeout(t);
    }, [address.pincode]);

    // Auto-switch off COD if it becomes unavailable.
    useEffect(() => {
        if (!codAvailable && paymentMethod === 'COD') setPaymentMethod('UPI');
    }, [codAvailable, paymentMethod]);

    // Reset phone-OTP state if user switches away from COD or changes the delivery phone.
    useEffect(() => {
        setPhoneOtp({ sent: false, code: "", verified: false, token: "", error: "", busy: false });
    }, [paymentMethod, address.phone]);

    // Phone OTP handlers (used only when codElig.phoneVerifyRequired is true).
    const sendPhoneOtp = async () => {
        setPhoneOtp(s => ({ ...s, busy: true, error: "" }));
        try {
            const r = await safeFetch('/api/cod/send-phone-otp', {
                method: 'POST',
                headers: await csrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ phone: address.phone }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d?.error || 'Failed to send OTP');
            setPhoneOtp(s => ({ ...s, sent: true, busy: false }));
        } catch (e) {
            setPhoneOtp(s => ({ ...s, busy: false, error: e.message }));
        }
    };
    const verifyPhoneOtp = async () => {
        setPhoneOtp(s => ({ ...s, busy: true, error: "" }));
        try {
            const r = await safeFetch('/api/cod/verify-phone-otp', {
                method: 'POST',
                headers: await csrfHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ phone: address.phone, code: phoneOtp.code }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d?.error || 'Wrong OTP');
            setPhoneOtp(s => ({ ...s, verified: true, token: d.verifyToken, busy: false }));
        } catch (e) {
            setPhoneOtp(s => ({ ...s, busy: false, error: e.message }));
        }
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            if (!token) { router.replace("/login?redirect=/checkout"); return; }

            if (paymentMethod === 'UPI' || paymentMethod === 'Card') {
                const razorpayLoaded = await initializeRazorpay();
                if (!razorpayLoaded) {
                    alert('Failed to load payment gateway. Please try again.');
                    return;
                }
                // processRazorpayPayment now returns a real Promise.
                // Amount is computed server-side from cartItems + coupon + loyalty + shipping.
                const paymentData = await processRazorpayPayment({
                    cartItems: cart.map(it => ({ id: it.id, quantity: it.quantity || 1 })),
                    couponCode: couponStatus?.code || null,
                    loyaltyPoints: loyaltyPointsUsed || 0,
                    currency: 'INR',
                    name: address.fullName,
                    email: JSON.parse(localStorage.getItem('user') || '{}').email,
                    phone: address.phone,
                    token,
                    csrfHeaders,
                });
                await createOrder(token, paymentData);
            } else {
                await createOrder(token, null);
            }
        } catch (error) {
            const msg = error?.message || '';
            if (msg !== 'Payment cancelled by user') {
                alert(msg || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const createOrder = async (token, paymentData) => {
        try {
            // Send only item IDs + variant selection — backend re-fetches prices from DB
            const safeCartItems = cart.map(({ id, title, image, selectedColor, selectedSize, sku, baseSku, quantity }) => ({
                id,
                title,
                image,
                selectedColor,
                selectedSize,
                sku,
                baseSku,
                quantity: quantity || 1
            }));

            const response = await safeFetch(`/api/orders`, {
                method: "POST",
                headers: await csrfHeaders({ "Content-Type": "application/json", "Authorization": `Bearer ${token}` }),
                credentials: 'include',
                body: JSON.stringify({
                    cartItems: safeCartItems,
                    address,
                    paymentMethod: paymentData ? 'Online' : paymentMethod,
                    paymentId: paymentData?.payment_id || null,
                    razorpayOrderId: paymentData?.order_id || null,
                    couponCode: couponStatus?.code || null,
                    discountAmount,
                    phoneVerifyToken: paymentMethod === 'COD' && codElig.phoneVerifyRequired ? phoneOtp.token : null,
                })
            });

            if (response.status === 401 || response.status === 403) {
                throw new Error('Your session has expired. Please log in again.');
            }

            const data = await response.json();

            if (data.success) {
                // Save address to DB for next time (POST creates if not exists)
                const token2 = localStorage.getItem('token');
                safeFetch('/api/user/address', {
                    method: 'POST',
                    headers: await csrfHeaders({ 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` }),
                    credentials: 'include',
                    body: JSON.stringify({ ...address, is_default: true })
                }).catch(() => {});
                setOrderSuccess(true);
                localStorage.setItem('lastOrder', JSON.stringify({
                  orderNumber: data.order_number,
                  items: cart,
                  total: finalTotal,
                  address,
                  paymentMethod: paymentData ? 'Online' : paymentMethod,
                  date: new Date().toISOString()
                }));
                clearCart();
                setTimeout(() => {
                    router.push('/success');
                }, 4000);
            } else {
                alert("Failed to place order. Please try again.");
                setLoading(false);
            }
        } catch (error) {
            console.error("Order creation error:", error);
            alert("Failed to create order.");
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
                    <p className="text-[13px] text-black/60 mb-8">Thank you for shopping with Creative Kid's. Your order has been placed successfully.</p>
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

                            {/* STEP 1: SELECT / ADD ADDRESS */}
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-6 md:p-10">
                                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-black/5">
                                        <button onClick={() => router.back()} className="text-black/50 hover:text-black transition-colors"><ChevronLeft size={20} /></button>
                                        <h2 className="text-[16px] font-medium tracking-wide text-black">Select Delivery Address</h2>
                                    </div>
                                    <AddressBook
                                        selectable
                                        onSelect={(addr) => setAddress(addr)}
                                    />
                                    <button
                                        onClick={() => {
                                            if (!address.fullName || !address.phone || !address.houseNo || !address.roadName || !address.city || !address.state || !address.pincode) {
                                                alert('Please select or add a delivery address.');
                                                return;
                                            }
                                            setStep(2); window.scrollTo(0, 0);
                                        }}
                                        className="w-full bg-black hover:bg-black/80 text-white font-bold tracking-widest uppercase py-4 mt-6 text-[12px] transition-colors rounded-full">
                                        Continue to Summary
                                    </button>
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
                                        <label className={`flex items-center gap-4 p-5 border rounded-xl cursor-pointer transition-colors ${paymentMethod === 'COD' ? 'border-black bg-[#fcfcfc]' : 'border-black/10 hover:border-black/30'} ${!codAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                            <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="w-4 h-4 accent-black" disabled={!codAvailable} />
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="text-[14px] font-medium text-black">Cash on Delivery</span>
                                                    {Number(codElig.codFee || 0) > 0 && codAvailable && (
                                                        <span className="text-[11px] text-black/60">+ ₹{Number(codElig.codFee).toFixed(0)} fee</span>
                                                    )}
                                                </div>
                                                {!codElig.codEnabled
                                                  ? <span className="text-[11px] text-red-400 mt-1 block">COD is currently unavailable.</span>
                                                  : !codElig.pincodeServiceable
                                                    ? <span className="text-[11px] text-red-400 mt-1 block">COD is not supported on this pincode. Please choose UPI or Card.</span>
                                                    : finalTotal >= Number(codElig.maxAmount || 1999)
                                                      ? <span className="text-[11px] text-red-400 mt-1 block">COD not available for orders ₹{Number(codElig.maxAmount).toFixed(0)} or above{codElig.isFirstOrder ? ' on your first order' : ''}.</span>
                                                      : <span className="text-[11px] text-black/50 mt-1 block">Pay directly to the delivery executive when your order arrives.</span>
                                                }
                                            </div>
                                        </label>

                                        {/* Phone OTP gate — only when admin requires it and COD is selected. */}
                                        {paymentMethod === 'COD' && codElig.phoneVerifyRequired && (
                                            <div className="border border-black/10 rounded-xl p-5 bg-amber-50/40">
                                                <div className="text-[12px] font-bold tracking-widest uppercase text-black mb-1">Verify your phone</div>
                                                <p className="text-[12px] text-black/60 mb-3">For COD orders we send a 6-digit OTP to <span className="font-bold text-black">{address.phone || 'your number'}</span> to confirm it's reachable.</p>
                                                {phoneOtp.error && <div className="mb-3 p-2.5 bg-red-50 text-red-600 text-[12px] rounded-lg">{phoneOtp.error}</div>}
                                                {!phoneOtp.sent ? (
                                                    <button type="button" disabled={phoneOtp.busy || !/^\d{10}$/.test((address.phone || '').replace(/\D/g, '').slice(-10))}
                                                        onClick={sendPhoneOtp}
                                                        className="text-[12px] font-bold tracking-widest uppercase bg-black text-white rounded-full px-5 py-2.5 disabled:opacity-40">
                                                        {phoneOtp.busy ? 'Sending…' : 'Send OTP'}
                                                    </button>
                                                ) : phoneOtp.verified ? (
                                                    <div className="text-[12px] font-bold text-green-700 flex items-center gap-2"><CheckCircle2 size={14} /> Phone verified</div>
                                                ) : (
                                                    <div className="flex gap-2 items-center">
                                                        <input type="text" inputMode="numeric" maxLength={6} placeholder="6-digit OTP"
                                                            value={phoneOtp.code} onChange={e => setPhoneOtp(s => ({ ...s, code: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                                                            className="border border-black/20 rounded-lg px-3 py-2 text-[14px] tracking-widest w-36 outline-none focus:border-black" />
                                                        <button type="button" disabled={phoneOtp.busy || phoneOtp.code.length !== 6}
                                                            onClick={verifyPhoneOtp}
                                                            className="text-[12px] font-bold tracking-widest uppercase bg-black text-white rounded-full px-4 py-2 disabled:opacity-40">
                                                            {phoneOtp.busy ? 'Verifying…' : 'Verify'}
                                                        </button>
                                                        <button type="button" onClick={sendPhoneOtp} disabled={phoneOtp.busy}
                                                            className="text-[11px] text-black/50 hover:text-black hover:underline">Resend</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={handlePlaceOrder}
                                        disabled={loading || (paymentMethod === 'COD' && codElig.phoneVerifyRequired && !phoneOtp.verified)}
                                        className="w-full bg-black hover:bg-black/80 text-white font-bold tracking-widest uppercase py-4 mt-4 text-[12px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 rounded-full">
                                        {loading
                                          ? "Processing Securely..."
                                          : (paymentMethod === 'COD' && codElig.phoneVerifyRequired && !phoneOtp.verified)
                                            ? 'Verify phone to continue'
                                            : `Confirm & Pay ₹${finalTotal.toFixed(2)}`}
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
                                    {loyaltyDiscount > 0 && (
                                        <div className="flex justify-between text-purple-600 font-medium">
                                            <span>Loyalty Points ({loyaltyPointsUsed} pts)</span>
                                            <span>- ₹{loyaltyDiscount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-black/70">
                                        <span>Delivery Charges</span>
                                        {shippingFee === 0 ? (
                                            <span className="text-black font-medium tracking-widest uppercase text-[10px] bg-black/5 px-2 py-1 rounded">Free</span>
                                        ) : (
                                            <span className="text-black">₹{shippingFee.toFixed(2)}</span>
                                        )}
                                    </div>
                                    {codFeeApplied > 0 && (
                                        <div className="flex justify-between text-black/70">
                                            <span>COD Fee</span>
                                            <span className="text-black">₹{codFeeApplied.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <p className="text-[10px] tracking-widest uppercase text-black/40 -mt-2">
                                        Inclusive of 5% GST · Free above ₹499
                                    </p>
                                </div>
                                {/* Coupon Input */}
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-2">Coupon Code</p>
                                    {couponStatus && couponStatus.discount_amount ? (
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
                                {/* Loyalty Points Redemption */}
                                {loyaltyBalance > 0 && (
                                  <div className="mb-6">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-black/50 mb-1">Loyalty Points</p>
                                    <p className="text-[11px] text-purple-600 mb-2">You have <strong>{loyaltyBalance}</strong> pts (≈ ₹{Math.floor(loyaltyBalance / 100)} off). Max 20% of order.</p>
                                    {loyaltyDiscount > 0 ? (
                                      <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
                                        <span className="text-[12px] font-bold text-purple-700">{loyaltyPointsUsed} pts applied — ₹{loyaltyDiscount} off</span>
                                        <button onClick={() => { setLoyaltyDiscount(0); setLoyaltyPointsUsed(0); setLoyaltyPointsInput(""); }} className="text-purple-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <input type="number" min={100} step={100} value={loyaltyPointsInput}
                                          onChange={e => { setLoyaltyPointsInput(e.target.value); setLoyaltyError(""); }}
                                          placeholder="Points to use" className="flex-1 border border-black/20 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-black" />
                                        <button onClick={applyLoyaltyPoints} className="px-4 py-2 bg-purple-700 text-white rounded-lg text-[11px] font-bold tracking-widest uppercase">Apply</button>
                                      </div>
                                    )}
                                    {loyaltyError && <p className="text-[11px] text-red-500 mt-1">{loyaltyError}</p>}
                                  </div>
                                )}
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
