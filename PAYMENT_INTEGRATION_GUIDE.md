# 💳 PAYMENT GATEWAY INTEGRATION - Razorpay

## 📋 IMPLEMENTATION PLAN

### **STEP 1: Backend Setup**

#### Install Razorpay SDK
```bash
cd creative-kids-backend
npm install razorpay
```

#### Add Environment Variables (.env)
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

#### Add Razorpay Routes (index.js)
1. POST `/api/payment/create-order` - Create Razorpay order
2. POST `/api/payment/verify` - Verify payment signature
3. POST `/api/payment/capture` - Capture payment (optional)

---

### **STEP 2: Frontend Setup**

#### Add Razorpay Script (layout.tsx or checkout page)
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

#### Update Checkout Page
- Add Razorpay initialization
- Handle UPI/Card payment flow
- Verify payment before order creation
- Show payment status

---

### **STEP 3: Payment Flow**

```
1. User selects UPI/Card payment
2. Frontend calls /api/payment/create-order
3. Backend creates Razorpay order, returns order_id
4. Frontend opens Razorpay checkout modal
5. User completes payment
6. Razorpay calls success/failure handler
7. Frontend verifies payment with backend
8. Backend verifies signature, creates order
9. Redirect to success page
```

---

## 🔒 SECURITY CONSIDERATIONS

1. ✅ Never expose Razorpay Key Secret to frontend
2. ✅ Always verify payment signature on backend
3. ✅ Use CSRF tokens for payment endpoints
4. ✅ Validate order amount on backend
5. ✅ Check payment status before order creation
6. ✅ Handle duplicate payment attempts
7. ✅ Log all payment transactions

---

## 📝 TESTING

### Test Mode Credentials
- Key ID: `rzp_test_xxxxx` (from Razorpay Dashboard)
- Key Secret: `xxxxx` (from Razorpay Dashboard)

### Test Cards
- Success: 4111 1111 1111 1111
- Failure: 4111 1111 1111 1112
- CVV: Any 3 digits
- Expiry: Any future date

### Test UPI
- Success: success@razorpay
- Failure: failure@razorpay

---

## 🚀 IMPLEMENTATION

See the following files for complete implementation:
1. Backend: `creative-kids-backend/index.js` (payment routes)
2. Frontend: `creative-kids-frontend/app/checkout/page.jsx` (Razorpay integration)
3. Environment: `.env` files in both projects

---

## 📊 RAZORPAY DASHBOARD

1. Sign up at https://razorpay.com
2. Get API keys from Settings > API Keys
3. Enable payment methods (UPI, Cards, Netbanking)
4. Set webhook URL for payment notifications
5. Configure settlement account

---

## 💰 PRICING

- Domestic Cards: 2% + GST
- UPI: Free (limited time)
- International Cards: 3% + GST
- Netbanking: ₹10 + GST per transaction

---

## 🔗 USEFUL LINKS

- Razorpay Docs: https://razorpay.com/docs/
- Payment Gateway: https://razorpay.com/docs/payments/
- Test Mode: https://razorpay.com/docs/payments/payments/test-card-details/
- Webhooks: https://razorpay.com/docs/webhooks/
