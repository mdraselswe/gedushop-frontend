import { decodeEntities } from "./decode";
import type { StoreCategory, StoreProduct } from "./types";

const WP_URL = process.env.WP_URL ?? "https://gedushop.com";
const STORE_API = `${WP_URL}/wp-json/wc/store/v1`;

/**
 * Fetch with retry. Hostinger's hCDN intermittently returns 403/5xx on some
 * edge nodes (~1 in 12), which would otherwise leave a page empty at build.
 */
async function fetchRetry(url: string, init?: RequestInit, attempts = 8): Promise<Response> {
  let last: Response | null = null;
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      last = res;
      if (res.status !== 403 && res.status < 500) return res; // genuine client error — don't retry
    } catch (e) {
      lastErr = e; // network hiccup / socket error — retry
    }
    await new Promise((r) => setTimeout(r, Math.min(500 * (i + 1), 4000)));
  }
  if (last) return last;
  throw lastErr ?? new Error(`fetch failed: ${url}`);
}

async function storeGet<T>(path: string): Promise<T> {
  // No cache override → default (cacheable) so pages can prerender in export.
  const res = await fetchRetry(`${STORE_API}${path}`);
  if (!res.ok) throw new Error(`Store API ${res.status} on ${path}`);
  return res.json();
}

function decodeProduct(p: StoreProduct): StoreProduct {
  return {
    ...p,
    name: decodeEntities(p.name),
    // Embedded category names are HTML-encoded too (used in breadcrumbs / links).
    categories: p.categories?.map((c) => ({ ...c, name: decodeEntities(c.name) })) ?? p.categories,
  };
}

function decodeCategory(c: StoreCategory): StoreCategory {
  return { ...c, name: decodeEntities(c.name) };
}

export async function getProducts(params: {
  perPage?: number;
  page?: number;
  category?: string;
  search?: string;
  orderby?: string;
  onSale?: boolean;
} = {}): Promise<StoreProduct[]> {
  const q = new URLSearchParams();
  q.set("per_page", String(params.perPage ?? 24));
  if (params.page) q.set("page", String(params.page));
  if (params.category) q.set("category", params.category);
  if (params.search) q.set("search", params.search);
  if (params.orderby) q.set("orderby", params.orderby);
  if (params.onSale) q.set("on_sale", "true");
  return (await storeGet<StoreProduct[]>(`/products?${q}`)).map(decodeProduct);
}

/** Like getProducts but also returns pagination info from the response headers. */
export async function getProductsPaged(params: Parameters<typeof getProducts>[0] = {}): Promise<{
  products: StoreProduct[];
  totalPages: number;
  total: number;
}> {
  const q = new URLSearchParams();
  q.set("per_page", String(params.perPage ?? 24));
  if (params.page) q.set("page", String(params.page));
  if (params.category) q.set("category", params.category);
  if (params.search) q.set("search", params.search);
  if (params.orderby) q.set("orderby", params.orderby);
  if (params.onSale) q.set("on_sale", "true");
  const res = await fetchRetry(`${STORE_API}/products?${q}`);
  if (!res.ok) throw new Error(`Store API ${res.status} on /products`);
  return {
    products: ((await res.json()) as StoreProduct[]).map(decodeProduct),
    totalPages: Number(res.headers.get("x-wp-totalpages") ?? 1),
    total: Number(res.headers.get("x-wp-total") ?? 0),
  };
}

// All products fetched once and memoized for the build. Prevents the ~130
// per-page requests (product + related pages) that trip Hostinger's hCDN rate
// limiting and fail the export with socket errors.
let allProductsCache: Promise<StoreProduct[]> | null = null;
async function getAllProducts(): Promise<StoreProduct[]> {
  if (!allProductsCache) {
    allProductsCache = (async () => {
      const all: StoreProduct[] = [];
      let expected: number | null = null;
      for (let page = 1; page <= 20; page++) {
        // The header, not the row count, decides when to stop. A short page
        // used to end the loop, and a short page is exactly what an hCDN blip
        // produces — 81 rows where 82 exist, indistinguishable from the last
        // page. The build then carried on with a product missing: its page
        // never generated, its category counted one short, and nothing failed.
        const res = await fetchRetry(`${STORE_API}/products?per_page=100&page=${page}`);
        if (!res.ok) throw new Error(`Store API ${res.status} on /products page ${page}`);
        const list = (await res.json()) as StoreProduct[];
        all.push(...list.map(decodeProduct));
        if (expected === null) expected = Number(res.headers.get("x-wp-total") ?? 0);
        if (all.length >= expected || list.length === 0) break;
      }
      // Louder than a quietly incomplete catalogue. Everything downstream —
      // product pages, category counts, the sitemap — treats this list as the
      // whole shop, so a build missing rows publishes a site missing products.
      if (expected && all.length < expected) {
        throw new Error(
          `Store API returned ${all.length} of ${expected} products — refusing to build an incomplete catalogue`,
        );
      }
      return all;
    })();
  }
  return allProductsCache;
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

/**
 * Categories, counted from the products themselves rather than from the term
 * count WooCommerce reports.
 *
 * That count is a cached column, and WordPress only refreshes it when terms are
 * assigned through the paths that bother to call wp_update_term_count(). Import
 * a batch of products, or set categories programmatically, and it silently
 * stops matching: Education said 1 with 7 products behind it, Toys said 29 with
 * 36. Every number on the site came from it — the sidebar badges, the category
 * hero, the meta description Google indexes.
 *
 * Worse than any wrong number, `count > 0` is also what decides whether a
 * category exists here at all. A stale zero would have taken the category out
 * of the nav and out of generateStaticParams, so its page would never have been
 * built — a live category, silently gone from the whole site.
 *
 * The product list is already fetched and memoised for the build, so counting
 * it costs nothing and can't drift: the badge and what you find inside come
 * from the same data.
 */
export async function getCategories(): Promise<StoreCategory[]> {
  const [cats, products] = await Promise.all([
    storeGet<StoreCategory[]>(`/products/categories?per_page=50`),
    getAllProducts(),
  ]);
  const real = new Map<number, number>();
  for (const p of products) {
    for (const c of p.categories ?? []) real.set(c.id, (real.get(c.id) ?? 0) + 1);
  }
  return cats
    .map((c) => ({ ...decodeCategory(c), count: real.get(c.id) ?? 0 }))
    .filter((c) => c.count > 0);
}

export async function getCategoryBySlug(slug: string): Promise<StoreCategory | null> {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

/** Products from the same category, excluding the current one. */
export async function getRelatedProducts(
  categoryId: number | undefined,
  excludeId: number,
  limit = 6,
): Promise<StoreProduct[]> {
  if (!categoryId) return [];
  const all = await getAllProducts();
  return all
    .filter((p) => p.id !== excludeId && p.categories?.some((c) => c.id === categoryId))
    .slice(0, limit);
}
