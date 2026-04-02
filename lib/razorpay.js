import { safeFetch } from './safeFetch';

export const initializeRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Returns a Promise that resolves with payment data or rejects with an error
// The entire modal flow is wrapped — no fire-and-forget callbacks
export const processRazorpayPayment = ({ amount, currency = 'INR', name, email, phone, token, csrfHeaders }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await safeFetch(`/api/payment/create-order`, {
        method: 'POST',
        headers: await csrfHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }),
        credentials: 'include',
        body: JSON.stringify({ amount, currency, receipt: `receipt_${Date.now()}` })
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        return reject(new Error(err.error || 'Failed to create payment order'));
      }

      const orderData = await orderRes.json();

      // Step 2: Open Razorpay modal — resolve/reject inside handler & ondismiss
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Creative Kids',
        description: "Premium Children's Clothing",
        order_id: orderData.order_id,
        prefill: { name, email, contact: phone },
        theme: { color: '#000000' },
        handler: async function (response) {
          try {
            // Step 3: Verify signature on backend
            const verifyRes = await safeFetch(`/api/payment/verify`, {
              method: 'POST',
              headers: await csrfHeaders({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }),
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified) {
              resolve({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature
              });
            } else {
              reject(new Error('Payment verification failed'));
            }
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled by user'))
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => reject(new Error(resp.error?.description || 'Payment failed')));
      rzp.open();

    } catch (error) {
      reject(error);
    }
  });
};
