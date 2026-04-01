import { Suspense } from "react";
import ShopClient from "@/components/ShopClient";

const API = process.env.NEXT_PUBLIC_API_URL;

// Helper to construct API URL from search params
const buildApiUrl = (base, params) => {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.append(key, value);
    }
  }
  return url.toString();
};

async function getProducts(params, searchParams) {
  const { slug } = params;
  const slugArray = Array.isArray(slug) ? slug : (slug ? [slug] : []);
  const slug0 = slugArray[0] || '';

  const mainCat = (slug0 === 'baby' || slug0 === 'baby-boy' || slug0 === 'baby-girl') ? 'Baby'
      : (slug0 === 'kids-boy' || slug0 === 'kids-girl') ? 'Kids' : null;
      
  const queryParams = {
    main_category: mainCat,
    item_type: slugArray[1] || null,
    sort: searchParams.sort,
    sizes: searchParams.sizes,
    colors: searchParams.colors,
    fabrics: searchParams.fabrics,
    patterns: searchParams.patterns,
    necks: searchParams.necks,
    price_min: searchParams.price ? searchParams.price.split('-')[0] : null,
    price_max: searchParams.price ? searchParams.price.split('-')[1] : null,
  };

  // Special cases for "offers" and "new"
  if (slug0 === 'offers') queryParams.offers = 'true';
  if (slug0 === 'new') queryParams.new_arrival = 'true';
  
  const apiUrl = buildApiUrl(`${API}/api/products`, queryParams);

  try {
    const res = await fetch(apiUrl, { next: { revalidate: 60 } }); // Revalidate every 60s
    if (!res.ok) throw new Error("Failed to fetch products");
    
    const products = await res.json();
    
    // Safely parse JSON fields inside products
    return products.map(p => ({
      ...p,
      image_urls: (() => { try { return typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (p.image_urls || []); } catch { return []; } })(),
      variants: (() => { try { return typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []); } catch { return []; } })(),
      extra_categories: (() => { try { return typeof p.extra_categories === 'string' ? JSON.parse(p.extra_categories) : (p.extra_categories || []); } catch { return []; } })(),
    }));

  } catch (error) {
    console.error("Error fetching products on server:", error);
    return []; // Return empty array on error
  }
}

export default async function Shop({ params, searchParams }) {
  const initialProducts = await getProducts(params, searchParams);

  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex justify-center items-center">
        <span className="text-xs tracking-widest uppercase text-black animate-pulse">Curating Collection...</span>
      </main>
    }>
      <ShopClient initialProducts={initialProducts} />
    </Suspense>
  );
}
