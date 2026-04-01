"use server";

import { revalidatePath } from "next/cache";
import { safeFetch } from "./safeFetch";

export async function notifyWhenAvailable(productId, email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { success: false, message: "Invalid email address." };
  if (!productId)
    return { success: false, message: "Invalid product." };
  try {
    const response = await safeFetch('/api/notify-me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, product_id: productId })
    });
    if (!response.ok) return { success: false, message: "Could not save notification request." };
    return { success: true, message: "You will be notified when the product is back in stock." };
  } catch (error) {
    console.error("Server Action Error:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
