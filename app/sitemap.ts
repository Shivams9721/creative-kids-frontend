import type { MetadataRoute } from "next";

const SITE_URL = "https://www.creativekids.co.in";
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const SHOP_PATHS = [
  "/shop",
  "/shop/new",
  "/shop/offers",
  "/shop/baby",
  "/shop/baby-boy",
  "/shop/baby-girl",
  "/shop/kids",
  "/shop/kids-boy",
  "/shop/kids-girl",
  "/shop/kids-girl/dresses",
  "/shop/kids-girl/tops-tees",
  "/shop/kids-girl/co-ords-jumpsuits",
  "/shop/kids-girl/jeans-joggers-trousers",
  "/shop/kids-girl/shorts-skirts-skorts",
  "/shop/baby-boy/onesies-rompers",
  "/shop/baby-girl/clothing-sets",
];

async function fetchProductIds(): Promise<number[]> {
  try {
    if (!API_BASE) return [];
    const ids: number[] = [];
    let page = 1;
    let hasMore = true;
    const limit = 120;

    while (hasMore && page <= 50) {
      const res = await fetch(`${API_BASE}/api/products?page=${page}&limit=${limit}`, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const payload = await res.json();

      if (Array.isArray(payload)) {
        ids.push(...payload.map((p: any) => Number(p?.id)));
        hasMore = false;
      } else {
        const items: any[] = Array.isArray(payload?.items) ? payload.items : [];
        ids.push(...items.map((p: any) => Number(p?.id)));
        hasMore = !!payload?.hasMore;
      }

      page += 1;
    }

    return ids.filter((id) => Number.isFinite(id) && id > 0);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...SHOP_PATHS.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: path === "/shop" ? 0.9 : 0.8,
    })),
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/shipping-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/refund-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productIds = await fetchProductIds();
  const productRoutes: MetadataRoute.Sitemap = productIds.map((id) => ({
    url: `${SITE_URL}/product/${id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}

