// Razorpay Payment Integration Helper
// Add this to your checkout page

import { safeFetch } from './safeFetch';

export const initializeRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const processRazorpayPayment = async ({
  amount,
  currency = 'INR',
  name,
  email,
  phone,
  onSuccess,
  onFailure,
  token,
  csrfHeaders
}) => {
  try {
    const orderRes = await safeFetch(`/api/payment/create-order`, {
      method: 'POST',
      headers: await csrfHeaders({ 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      }),
      credentials: 'include',
      body: JSON.stringify({ 
        amount, 
        currency,
        receipt: `receipt_${Date.now()}`
      })
    });

    if (!orderRes.ok) {
      throw new Error('Failed to create payment order');
    }

    const orderData = await orderRes.json();

    // Step 2: Initialize Razorpay Checkout
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Creative Kids',
      description: 'Premium Children\'s Clothing',
      image: '/logo.png', // Your logo
      order_id: orderData.order_id,
      prefill: {
        name,
        email,
        contact: phone
      },
      theme: {
        color: '#000000'
      },
      handler: async function (response) {
        // Step 3: Verify payment
        try {
          const verifyRes = await safeFetch(`/api/payment/verify`, {
            method: 'POST',
            headers: await csrfHeaders({ 
              'Content-Type': 'application/json', 
              'Authorization': `Bearer ${token}` 
            }),
            credentials: 'include',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json();

          if (verifyData.verified) {
            onSuccess({
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
              ...verifyData
            });
          } else {
            onFailure(new Error('Payment verification failed'));
          }
        } catch (err) {
          onFailure(err);
        }
      },
      modal: {
        ondismiss: function() {
          onFailure(new Error('Payment cancelled by user'));
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();

  } catch (error) {
    onFailure(error);
  }
};
