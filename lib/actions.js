"use server";

import { revalidatePath } from "next/cache";

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Server Action to handle the "Notify Me" form submission.
 * This runs securely on the server.
 * @param {number} productId - The ID of the product to be notified about.
 * @param {string} email - The user's email address.
 * @returns {Promise<{success: boolean, message: string}>} - A result object.
 */
export async function notifyWhenAvailable(productId, email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: "Invalid email address." };
  }
  if (!productId) {
    return { success: false, message: "Invalid product." };
  }

  try {
    // This fetch call happens on the server, so it's secure.
    // In a real app, you might directly interact with your database here.
    const response = await fetch(`${API}/api/notify-me`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, product_id: productId })
    });

    if (!response.ok) {
      // It's good practice to handle potential API errors.
      const errorBody = await response.text();
      console.error("API Error in notifyWhenAvailable:", errorBody);
      return { success: false, message: "Could not save notification request." };
    }

    // Optionally revalidate the path if the page data needs to be refreshed.
    // revalidatePath(`/product/${productId}`);

    return { success: true, message: "You will be notified when the product is back in stock." };

  } catch (error) {
    console.error("Server Action Error (notifyWhenAvailable):", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
