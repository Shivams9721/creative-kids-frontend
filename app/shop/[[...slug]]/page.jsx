import { Suspense } from "react";
import ShopClient from "@/components/ShopClient";
import { safeFetch } from "@/lib/safeFetch";

const SITE_URL = "https://www.creativekids.co.in";

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
  'baby':      null,
  'kids-boy':  'Boys clothing',
  'kids-girl': 'Girls clothing',
  'kids':      null,
};

// Human-readable labels for SEO titles
const SLUG_LABELS = {
  'baby-boy':  'Baby Boys',
  'baby-girl': 'Baby Girls',
  'baby':      'Baby',
  'kids-boy':  'Boys Clothing',
  'kids-girl': 'Girls Clothing',
  'kids':      'Kids',
  'new':       'New Arrivals',
  'offers':    'Special Offers',
};

async function getProducts(params, searchParams) {
  const slug = params.slug;
  const slugArray = Array.isArray(slug) ? slug : (slug ? [slug] : []);
  const slug0 = slugArray[0] || '';
  const slug1 = slugArray[1] || '';

  const mainCat = SLUG_TO_MAIN_CAT[slug0] !== undefined ? SLUG_TO_MAIN_CAT[slug0] : null;
  const isBabyAll = slug0 === 'baby';
  const isKidsAll = slug0 === 'kids';
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

  if (slug0 === 'offers') queryParams.offers = 'true';
  if (slug0 === 'new') queryParams.new_arrival = 'true';

  const apiPath = buildApiPath(queryParams);

  try {
    const res = await safeFetch(apiPath, { cache: 'no-store' });
    if (!res.ok) throw new Error("Failed to fetch products");
    const products = await res.json();
    return products.map(p => ({
      ...p,
      image_urls: (() => { try { return typeof p.image_urls === 'string' ? JSON.parse(p.image_urls) : (p.image_urls || []); } catch { return []; } })(),
      variants: (() => { try { return typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []); } catch { return []; } })(),
      extra_categories: (() => { try { return typeof p.extra_categories === 'string' ? JSON.parse(p.extra_categories) : (p.extra_categories || []); } catch { return []; } })(),
    }));
  } catch (error) {
    console.error("Error fetching products on server:", error);
    return [];
  }
}

// ── SEO Metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const slugArray = Array.isArray(slug) ? slug : (slug ? [slug] : []);
  const slug0 = slugArray[0] || '';
  const slug1 = slugArray[1] || '';

  const catLabel = SLUG_LABELS[slug0] || 'Shop';
  const itemLabel = slug1 ? (SLUG_TO_ITEM_TYPE[slug1] || slug1.replace(/-/g, ' ')) : null;

  const title = itemLabel
    ? `Buy ${itemLabel} for ${catLabel} Online India — Creative Kids`
    : `${catLabel} Clothing Online India — Creative Kids`;

  const description = itemLabel
    ? `Shop premium ${itemLabel} for ${catLabel} at Creative Kids. Free shipping above ₹599. Easy returns.`
    : `Explore Creative Kids' ${catLabel} collection. Premium children's clothing in India. Free shipping above ₹599.`;

  const url = `${SITE_URL}/shop${slugArray.length ? '/' + slugArray.join('/') : ''}`;

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website" },
    twitter: { card: "summary", title, description },
    alternates: { canonical: url },
  };
}

export default async function Shop({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const initialProducts = await getProducts(resolvedParams, resolvedSearchParams);

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
