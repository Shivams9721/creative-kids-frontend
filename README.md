# Creative Kids — Frontend

Next.js 15 storefront for Creative Kids children's clothing.

## Stack

- Next.js 15 (App Router)
- Tailwind CSS
- Framer Motion
- Razorpay (payments)

## Setup

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
npm run dev
```

## Structure

```
app/
  page.jsx          — Homepage
  shop/             — Product listing
  product/[id]/     — Product detail
  checkout/         — Checkout flow
  login/            — Auth (OTP + password)
  profile/          — Orders, wishlist, returns, settings
  admin/            — Admin panel (protected)
components/
  Navbar.jsx
  CartDrawer.jsx
  ProductClient.jsx
  AddressBook.jsx
lib/
  safeFetch.js      — Authenticated fetch wrapper
  csrf.js           — CSRF token helper
  razorpay.js       — Payment flow
```

## Admin

Visit `/admin/login` with admin credentials. The panel covers orders, products, inventory, coupons, returns, customers, and analytics.
