import { apiFetch, GEDU_API, STORE_API } from "./api";

/**
 * Use GeduShop's ranked multi-field search when a query is present. If the WP
 * plugin has not been installed yet or is briefly unavailable, fall back to
 * WooCommerce's original title/SKU search instead of breaking the catalogue.
 */
export async function fetchProductCollection(
  params: URLSearchParams,
  init?: RequestInit,
): Promise<Response> {
  const search = params.get("search")?.trim();
  const advanced =
    params.has("free_shipping") ||
    params.has("min_rating") ||
    params.has("age") ||
    ["rating", "discount_percent", "discount_amount"].includes(params.get("orderby") ?? "");
  if (!search && !advanced) return apiFetch(`${STORE_API}/products?${params}`, init);

  const smartParams = new URLSearchParams(params);
  smartParams.delete("search");
  if (search) smartParams.set("q", search);

  try {
    const smart = await apiFetch(`${GEDU_API}/product-search?${smartParams}`, init, 2);
    if (smart.ok) return smart;
  } catch {
    if (init?.signal?.aborted) throw new DOMException("The operation was aborted", "AbortError");
  }

  // Resilient fallback to standard WooCommerce Store API if custom plugin
  // endpoint fails or is temporarily unavailable. This prevents catastrophic
  // empty / error states on the frontend when backend plugins are updating.
  const fallbackParams = new URLSearchParams(params);
  const orderby = fallbackParams.get("orderby");
  if (orderby === "relevance" || orderby === "discount_percent" || orderby === "discount_amount") {
    fallbackParams.set("orderby", "popularity");
    fallbackParams.set("order", "desc");
  }
  fallbackParams.delete("free_shipping");
  fallbackParams.delete("min_rating");
  fallbackParams.delete("age");

  return apiFetch(`${STORE_API}/products?${fallbackParams}`, init);
}
