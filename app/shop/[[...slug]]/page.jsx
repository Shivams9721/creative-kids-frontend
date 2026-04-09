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

const SEO_INTRO_COPY = {
  "shop": "Discover premium kids clothing online in India at Creative Kids. Explore curated baby, toddler, and kids collections with soft fabrics, modern fits, and everyday comfort.",
  "new": "Shop new arrivals in kids wear with fresh seasonal styles for baby boys, baby girls, boys, and girls. Find premium quality outfits designed for comfort and movement.",
  "offers": "Browse special offers on premium children clothing and shop stylish essentials at better prices. Limited-time deals across dresses, co-ords, tops, and everyday wear.",
  "baby": "Explore baby clothing online including rompers, onesies, and comfortable sets made with gentle fabrics suitable for everyday wear and special moments.",
  "baby-boy": "Shop baby boy clothing online with soft rompers, onesies, tees, and coordinated sets crafted for comfort, easy movement, and all-day wear.",
  "baby-girl": "Shop baby girl clothing online with stylish dresses, coordinated sets, and soft essentials made for comfort, easy care, and playful everyday looks.",
  "kids-boy": "Shop boys clothing online in India including shirts, t-shirts, joggers, shorts, and co-ord styles designed for active days and smart casual looks.",
  "kids-girl": "Shop girls clothing online in India including dresses, tops, skirts, shorts, and co-ords tailored for comfort, playful style, and easy everyday wear.",
  "kids-girl/dresses": "Discover girls dresses online in premium fabrics with comfortable fits and modern silhouettes, ideal for daily wear, parties, and festive occasions.",
  "kids-girl/shorts-skirts-skorts": "Shop girls shorts, skirts, and skorts online with breathable fabrics and practical fits for active play, outings, and everyday styling.",
  "baby-boy/onesies-rompers": "Explore baby boy onesies and rompers online made with soft fabrics and easy closures for quick changes, comfort, and all-day movement.",
  "baby-girl/clothing-sets": "Shop baby girl clothing sets online with coordinated tops and bottoms, crafted in premium fabrics for comfort and effortless everyday styling.",
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
  const pathKey = slug1 ? `${slug0}/${slug1}` : (slug0 || "shop");

  const title = itemLabel
    ? `Buy ${itemLabel} for ${catLabel} Online India | Premium Kids Wear`
    : `${catLabel} Clothing Online India | Premium Kids Wear`;

  const fallbackDescription = itemLabel
    ? `Shop premium ${itemLabel} for ${catLabel} at Creative Kids. Free shipping above ₹599. Easy returns.`
    : `Explore Creative Kids' ${catLabel} collection. Premium children's clothing in India. Free shipping above ₹599.`;
  const description = SEO_INTRO_COPY[pathKey] || fallbackDescription;

  const url = `${SITE_URL}/shop${slugArray.length ? '/' + slugArray.join('/') : ''}`;
  const keywords = [
    "kids clothing online india",
    "children clothing online",
    "baby clothing india",
    `${catLabel.toLowerCase()} clothing`,
    itemLabel ? `${itemLabel.toLowerCase()} for kids` : "kids fashion",
  ];

  return {
    title,
    description,
    keywords,
    openGraph: { title, description, url, type: "website", siteName: "Creative Kids" },
    twitter: { card: "summary", title, description },
    alternates: { canonical: url },
  };
}

export default async function Shop({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const initialProducts = await getProducts(resolvedParams, resolvedSearchParams);
  const slugArray = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : (resolvedParams.slug ? [resolvedParams.slug] : []);
  const slug0 = slugArray[0] || "";
  const slug1 = slugArray[1] || "";
  const catLabel = SLUG_LABELS[slug0] || "Shop";
  const itemLabel = slug1 ? (SLUG_TO_ITEM_TYPE[slug1] || slug1.replace(/-/g, " ")) : null;
  const pathKey = slug1 ? `${slug0}/${slug1}` : (slug0 || "shop");
  const seoIntro = SEO_INTRO_COPY[pathKey] || SEO_INTRO_COPY.shop;
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      ...(slug0 ? [{ "@type": "ListItem", position: 3, name: catLabel, item: `${SITE_URL}/shop/${slug0}` }] : []),
      ...(slug1 ? [{ "@type": "ListItem", position: 4, name: itemLabel || "Collection", item: `${SITE_URL}/shop/${slug0}/${slug1}` }] : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense fallback={
        <main className="min-h-screen bg-white flex justify-center items-center">
          <span className="text-xs tracking-widest uppercase text-black animate-pulse">Curating Collection...</span>
        </main>
      }>
        <div style={{ display: 'none' }}>{seoIntro}</div>
        <ShopClient initialProducts={initialProducts} />
      </Suspense>
    </>
  );
}
