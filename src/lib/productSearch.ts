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
  if (!search) return apiFetch(`${STORE_API}/products?${params}`, init);

  const smartParams = new URLSearchParams(params);
  smartParams.delete("search");
  smartParams.set("q", search);

  try {
    const smart = await apiFetch(`${GEDU_API}/product-search?${smartParams}`, init, 3);
    if (smart.ok) return smart;
  } catch {
    if (init?.signal?.aborted) throw new DOMException("The operation was aborted", "AbortError");
  }

  const fallbackParams = new URLSearchParams(params);
  if (fallbackParams.get("orderby") === "relevance") {
    fallbackParams.set("orderby", "popularity");
    fallbackParams.set("order", "desc");
  }
  return apiFetch(`${STORE_API}/products?${fallbackParams}`, init);
}
