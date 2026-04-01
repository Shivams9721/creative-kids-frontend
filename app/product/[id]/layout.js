import { safeFetch, safeId } from "@/lib/safeFetch";

export async function generateMetadata({ params }) {
  try {
    const { id } = await params;
    const safeIdVal = safeId(id);
    if (!safeIdVal) return { title: "Creative Kids" };
    const res = await safeFetch(`/api/products/${safeIdVal}`, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const product = await res.json();
    const images = (() => { try { return typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : (product.image_urls || []); } catch { return []; } })();
    const image = images[0] || "";
    const description = `${product.title} — ₹${parseFloat(product.price).toFixed(2)}. Shop kids & baby clothing at Creative Kids.`;

    return {
      title: `${product.title} | Creative Kids`,
      description,
      openGraph: {
        title: product.title,
        description,
        images: image ? [{ url: image, width: 800, height: 1000, alt: product.title }] : [],
        type: "website",
        siteName: "Creative Kids",
      },
      twitter: {
        card: "summary_large_image",
        title: product.title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return { title: "Creative Kids" };
  }
}

export default function ProductLayout({ children }) {
  return children;
}
