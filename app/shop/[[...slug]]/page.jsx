import { Suspense } from "react";
import ShopClient from "@/components/ShopClient";
import { safeFetch } from "@/lib/safeFetch";

// Helper to construct safe API path with query params
const buildApiPath = (params) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.append(key, value);
  }
  const qs = query.toString();
  return `/api/products${qs ? `?${qs}` : ''}`;
};

// Maps URL slugs back to the exact item_type values stored in the DB
const SLUG_TO_ITEM_TYPE = {
  'dresses': 'Dresses',
  'tops-tees': 'Tops & Tees',
  'co-ords-jumpsuits': 'Co-ords & Jumpsuits',
  'jeans-joggers-trousers': 'Jeans Joggers & Trousers',
  'shorts-skirts-skorts': 'Shorts, Skirts & Skorts',
  'rompers': 'Rompers',
  'onesies-rompers': 'Onesies & Rompers',
  't-shirts-sweatshirts': 'T-Shirts & Sweatshirts',
  'shirts': 'Shirts',
  'bottomwear': 'Bottomwear',
  'clothing-sets': 'Clothing Sets',
  't-shirts': 'T-Shirts',
  'jeans': 'Jeans',
  'trousers-joggers': 'Trousers & Joggers',
  'shorts': 'Shorts',
  'co-ord-sets': 'Co-ord Sets',
  'sweatshirts': 'Sweatshirts',
};

// Maps slug0 to the exact main_category values stored in DB
const SLUG_TO_MAIN_CAT = {
  'baby-boy':  'Baby boys',
  'baby-girl': 'Baby girls',
  'baby':      null, // both baby boys + baby girls — handled via baby_all param
  'kids-boy':  'Boys clothing',
  'kids-girl': 'Girls clothing',
  'kids':      null, // both boys + girls clothing — handled via kids_all param
};

async function getProducts(params, searchParams) {
  const { slug } = params;
  const slugArray = Array.isArray(slug) ? slug : (slug ? [slug] : []);
  const slug0 = slugArray[0] || '';
  const slug1 = slugArray[1] || '';

  // Convert slug to exact DB main_category value
  const mainCat = SLUG_TO_MAIN_CAT[slug0] !== undefined ? SLUG_TO_MAIN_CAT[slug0] : null;
  const isBabyAll = slug0 === 'baby';
  const isKidsAll = slug0 === 'kids';

  // Convert slug to exact DB item_type value
  const itemType = slug1 ? (SLUG_TO_ITEM_TYPE[slug1] || slug1) : null;
      
  const queryParams = {
    main_category: mainCat,
    baby_all: isBabyAll ? 'true' : null,
    kids_all: isKidsAll ? 'true' : null,
    item_type: itemType,
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
  
  const apiPath = buildApiPath(queryParams);

  try {
    const res = await safeFetch(apiPath, { next: { revalidate: 60 } }); // Revalidate every 60s
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
