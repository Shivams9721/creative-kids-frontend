# 🚀 PAYMENT GATEWAY SETUP - Complete Guide

## ✅ WHAT'S BEEN IMPLEMENTED

### **Backend (creative-kids-backend)**
1. ✅ Razorpay SDK installed and configured
2. ✅ Three payment endpoints created:
   - `POST /api/payment/create-order` - Creates Razorpay order
   - `POST /api/payment/verify` - Verifies payment signature
   - `POST /api/payment/status` - Checks payment status
3. ✅ Secure signature verification
4. ✅ CSRF protection on all payment routes
5. ✅ JWT authentication required

### **Frontend (creative-kids-frontend)**
1. ✅ Razorpay helper functions (`lib/razorpay.js`)
2. ✅ Checkout page integrated with Razorpay
3. ✅ Payment flow: UPI/Card → Razorpay → Verify → Create Order
4. ✅ COD flow remains unchanged
5. ✅ Error handling and user feedback

---

## 📋 SETUP STEPS

### **STEP 1: Install Razorpay SDK (Backend)**

```bash
cd creative-kids-backend
npm install razorpay
```

### **STEP 2: Get Razorpay Credentials**

1. Sign up at https://razorpay.com
2. Go to **Settings** → **API Keys**
3. Generate **Test Mode** keys (for development)
4. Copy **Key ID** and **Key Secret**

### **STEP 3: Add Environment Variables**

**Backend (.env)**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=https://vbaumdstnz.ap-south-1.awsapprunner.com
```

### **STEP 4: Restart Servers**

```bash
# Backend
cd creative-kids-backend
npm run dev

# Frontend
cd creative-kids-frontend
npm run dev
```

---

## 🧪 TESTING

### **Test Mode (Development)**

#### Test Cards
| Card Number | Expiry | CVV | Result |
|-------------|--------|-----|--------|
| 4111 1111 1111 1111 | Any future | Any 3 digits | Success |
| 4111 1111 1111 1112 | Any future | Any 3 digits | Failure |
| 5555 5555 5555 4444 | Any future | Any 3 digits | Success (Mastercard) |

#### Test UPI IDs
- `success@razorpay` - Payment succeeds
- `failure@razorpay` - Payment fails

#### Test Netbanking
- Select any bank
- Use credentials provided on test page

### **Testing Flow**

1. Add products to cart
2. Go to checkout
3. Fill address details
4. Select **UPI** or **Card** payment
5. Click "Confirm & Pay"
6. Razorpay modal opens
7. Use test credentials above
8. Complete payment
9. Order should be created
10. Redirect to success page

---

## 🔒 SECURITY CHECKLIST

- [x] Razorpay Key Secret never exposed to frontend
- [x] Payment signature verified on backend
- [x] CSRF tokens used on all payment endpoints
- [x] JWT authentication required
- [x] Order amount validated on backend
- [x] Payment status checked before order creation

---

## 🚨 TROUBLESHOOTING

### **Issue: "Failed to load payment gateway"**
**Solution:** Check if Razorpay script is loading. Open browser console and look for errors.

### **Issue: "Payment verification failed"**
**Solution:** 
1. Check if `RAZORPAY_KEY_SECRET` is correct in backend `.env`
2. Ensure signature verification logic is correct
3. Check backend logs for detailed error

### **Issue: "Order created but payment not captured"**
**Solution:** 
1. Check Razorpay dashboard for payment status
2. Verify `payment_capture: 1` is set in order creation
3. Check if payment was actually successful

### **Issue: "CORS error on payment endpoints"**
**Solution:** Ensure frontend URL is in backend CORS whitelist

---

## 📊 RAZORPAY DASHBOARD

### **Important Sections**

1. **Transactions** - View all payments
2. **Orders** - View all Razorpay orders
3. **Settlements** - Track money transfers to bank
4. **Refunds** - Process refunds
5. **Webhooks** - Set up payment notifications
6. **Reports** - Download transaction reports

### **Webhook Setup (Optional but Recommended)**

1. Go to **Settings** → **Webhooks**
2. Add webhook URL: `https://your-backend-url.com/api/payment/webhook`
3. Select events: `payment.captured`, `payment.failed`
4. Save webhook secret
5. Implement webhook handler in backend

---

## 💰 GOING LIVE (Production)

### **Checklist**

1. **KYC Verification**
   - Submit business documents
   - Bank account verification
   - Wait for approval (1-2 days)

2. **Switch to Live Mode**
   - Generate **Live API Keys** from dashboard
   - Update `.env` with live keys
   - Test with small real transaction

3. **Enable Payment Methods**
   - Cards (Visa, Mastercard, Amex, RuPay)
   - UPI (Google Pay, PhonePe, Paytm)
   - Netbanking (all major banks)
   - Wallets (Paytm, Mobikwik, etc.)

4. **Configure Settlement**
   - Set settlement schedule (daily/weekly)
   - Add bank account details
   - Set up auto-settlement

5. **Set Up Webhooks**
   - Add production webhook URL
   - Implement webhook handler
   - Test webhook delivery

6. **Update Frontend**
   - Remove test mode indicators
   - Update payment success messages
   - Add customer support contact

---

## 📈 MONITORING

### **Key Metrics to Track**

1. **Payment Success Rate** - Should be > 95%
2. **Average Transaction Value**
3. **Failed Payments** - Investigate reasons
4. **Refund Rate** - Should be < 5%
5. **Settlement Time** - T+2 to T+7 days

### **Alerts to Set Up**

1. Payment failure rate > 10%
2. Webhook delivery failures
3. Unusual transaction patterns
4. High refund requests

---

## 🔗 USEFUL RESOURCES

- **Razorpay Docs:** https://razorpay.com/docs/
- **Payment Gateway:** https://razorpay.com/docs/payments/
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/
- **Webhooks:** https://razorpay.com/docs/webhooks/
- **API Reference:** https://razorpay.com/docs/api/
- **Support:** https://razorpay.com/support/

---

## ✅ FINAL CHECKLIST

### **Development**
- [ ] Razorpay SDK installed
- [ ] Test API keys added to `.env`
- [ ] Backend payment routes working
- [ ] Frontend Razorpay integration working
- [ ] Test payment successful
- [ ] Order created after payment
- [ ] Success page shows correct details

### **Production**
- [ ] KYC completed and approved
- [ ] Live API keys generated
- [ ] Live keys added to production `.env`
- [ ] Test transaction successful
- [ ] Webhooks configured
- [ ] Settlement account verified
- [ ] Customer support ready
- [ ] Monitoring set up

---

## 🎉 YOU'RE READY!

Your payment gateway is now fully integrated. Users can pay via:
- ✅ UPI (Google Pay, PhonePe, Paytm)
- ✅ Credit/Debit Cards (Visa, Mastercard, RuPay)
- ✅ Netbanking (all major banks)
- ✅ Cash on Delivery (COD)

**Next Steps:**
1. Test thoroughly in development
2. Complete Razorpay KYC
3. Switch to live mode
4. Monitor transactions
5. Provide excellent customer support!
