import ProductClient from "@/components/ProductClient";
import { Suspense } from "react";
import { safeFetch } from "@/lib/safeFetch";

async function getProductData(id) {
  const safeId = parseInt(id, 10);
  if (!safeId || safeId <= 0) return { product: null, relatedProducts: [] };
  try {
    const res = await safeFetch(`/api/products/${safeId}`, { next: { revalidate: 60 } });
    if (!res.ok) return { product: null, relatedProducts: [] };

    const product = await res.json();

    // Safely parse JSON fields
    const parsedData = {
      ...product,
      image_urls: (() => { try { return typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : (product.image_urls || []); } catch { return []; } })(),
      parsedVariants: (() => { try { return typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []); } catch { return []; } })(),
      color_images: (() => { try { return typeof product.color_images === 'string' ? JSON.parse(product.color_images) : (product.color_images || {}); } catch { return {}; } })(),
    };
    
    // Fetch related products
    const relatedRes = await safeFetch(`/api/products?sub_category=${encodeURIComponent(product.sub_category)}&limit=7`, { next: { revalidate: 3600 } });
    let relatedProducts = [];
    if (relatedRes.ok) {
        const allRelated = await relatedRes.json();
        relatedProducts = allRelated
            .filter(p => p.id !== parseInt(id))
            .slice(0, 6)
            .map(p => ({
                ...p,
                image_urls: (() => { try { return typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (p.image_urls || []); } catch { return []; } })()
            }));
    }

    return { product: parsedData, relatedProducts };
  } catch (error) {
    console.error("Failed to fetch product data on server:", error);
    return { product: null, relatedProducts: [] };
  }
}


export default async function ProductPage({ params }) {
  const { id } = await params;
  const { product, relatedProducts } = await getProductData(id);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-20 gap-4">
        <h1 className="text-2xl font-light">Product Not Found</h1>
        <a href="/shop" className="text-[11px] font-bold tracking-widest uppercase border-b border-black">Return to Shop</a>
      </div>
    );
  }

  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center pt-20">
            <span className="text-[11px] tracking-widest uppercase text-black animate-pulse">Loading Product...</span>
        </div>
    }>
      <ProductClient product={product} relatedProducts={relatedProducts} />
    </Suspense>
  );
}
