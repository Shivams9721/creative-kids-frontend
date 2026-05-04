import ProductClient from "@/components/product/ProductClient";
import { Suspense } from "react";
import { safeFetch } from "@/lib/safeFetch";

const SITE_URL = "https://www.creativekids.co.in";

async function getProductData(id) {
  const safeId = parseInt(id, 10);
  if (!safeId || safeId <= 0) return { product: null, relatedProducts: [] };
  try {
    const res = await safeFetch(`/api/products/${safeId}`, { cache: 'no-store' });
    if (!res.ok) return { product: null, relatedProducts: [] };

    const product = await res.json();

    const parsedData = {
      ...product,
      image_urls: (() => { try { return typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : (product.image_urls || []); } catch { return []; } })(),
      parsedVariants: (() => { try { return typeof product.variants === 'string' ? JSON.parse(product.variants) : (product.variants || []); } catch { return []; } })(),
      color_images: (() => { try { return typeof product.color_images === 'string' ? JSON.parse(product.color_images) : (product.color_images || {}); } catch { return {}; } })(),
    };

    const relatedRes = await safeFetch(`/api/products?item_type=${encodeURIComponent(product.item_type || product.sub_category || '')}`, { cache: 'no-store' });
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

// ── SEO Metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { id } = await params;
  const { product } = await getProductData(id);
  if (!product) return { title: "Product Not Found — Creative Kid's" };

  const title = `${product.title} | Creative Kid's`;
  const description = product.description
    ? product.description.slice(0, 155).replace(/\n/g, " ")
    : `Buy ${product.title} online at Creative Kid's. Premium children's clothing in India.`;
  const image = product.image_urls?.[0] || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product/${id}`,
      images: image ? [{ url: image, width: 800, height: 1000, alt: product.title }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
    alternates: { canonical: `${SITE_URL}/product/${id}` },
  };
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

  // ── JSON-LD structured data for Google Shopping ───────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || "",
    image: product.image_urls || [],
    sku: product.sku || String(product.id),
    brand: { "@type": "Brand", name: "Creative Kid's" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${id}`,
      priceCurrency: "INR",
      price: parseFloat(product.price).toFixed(2),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Creative Kid's" },
    },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${SITE_URL}/product/${id}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center pt-20">
          <span className="text-[11px] tracking-widest uppercase text-black animate-pulse">Loading Product...</span>
        </div>
      }>
        <ProductClient product={product} relatedProducts={relatedProducts} />
      </Suspense>
    </>
  );
}
