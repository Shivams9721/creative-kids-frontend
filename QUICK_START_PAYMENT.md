# 🚀 QUICK START - Payment Gateway

## ⚡ 5-MINUTE SETUP

### **Step 1: Install Razorpay (30 seconds)**
```bash
cd creative-kids-backend
npm install razorpay
```

### **Step 2: Get API Keys (2 minutes)**
1. Go to https://razorpay.com
2. Sign up (use Google for quick signup)
3. Dashboard → Settings → API Keys
4. Click "Generate Test Keys"
5. Copy **Key ID** and **Key Secret**

### **Step 3: Add to Backend .env (30 seconds)**
Open `creative-kids-backend/.env` and add:
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### **Step 4: Restart Backend (30 seconds)**
```bash
cd creative-kids-backend
npm run dev
```

### **Step 5: Test Payment (1 minute)**
1. Open http://localhost:3000
2. Add any product to cart
3. Go to checkout
4. Fill address
5. Select **UPI** or **Card**
6. Click "Confirm & Pay"
7. Use test credentials:
   - **Card:** 4111 1111 1111 1111
   - **Expiry:** Any future date
   - **CVV:** 123
   - **UPI:** success@razorpay
8. Complete payment
9. Order created! ✅

---

## 🧪 TEST CREDENTIALS

### **Cards**
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25 (any future date)
CVV: 123 (any 3 digits)
Name: Test User
```

### **UPI**
```
UPI ID: success@razorpay
```

### **Netbanking**
```
Select any bank
Use credentials shown on test page
```

---

## ✅ VERIFICATION

After payment, check:
1. ✅ Razorpay modal opened
2. ✅ Payment completed
3. ✅ Order created in database
4. ✅ Redirected to success page
5. ✅ Order visible in profile

---

## 🚨 TROUBLESHOOTING

### **"Failed to load payment gateway"**
- Check if Razorpay keys are in `.env`
- Restart backend server
- Check browser console for errors

### **"Payment verification failed"**
- Check if `RAZORPAY_KEY_SECRET` is correct
- Check backend logs for errors

### **"Order not created"**
- Check if payment was actually successful
- Check Razorpay dashboard for payment status
- Check backend logs

---

## 📊 RAZORPAY DASHBOARD

After payment, check dashboard:
1. **Transactions** - See your test payment
2. **Orders** - See Razorpay order created
3. **Settlements** - (Only in live mode)

---

## 🎉 DONE!

Your payment gateway is working! 

**Next:** Complete KYC to go live with real payments.

**Support:** Check `PAYMENT_SETUP_COMPLETE.md` for detailed guide.
