import type { StoreProduct } from "@/lib/types";

/**
 * Collection pages hand their data to a Client Component. Keep only fields
 * used by ProductBrowser/ProductCard/QuickView so long descriptions, combo
 * recipes and variation references are not duplicated into the RSC payload.
 */
export function productCardPayload(product: StoreProduct): StoreProduct {
  return {
    ...product,
    description: "",
    categories: [],
    variations: undefined,
    extensions: product.extensions?.gedushop
      ? {
          gedushop: {
            free_shipping: product.extensions.gedushop.free_shipping,
            video: product.extensions.gedushop.video,
            attribute_colors: product.extensions.gedushop.attribute_colors,
          },
        }
      : undefined,
  };
}

export function productCardPayloads(products: StoreProduct[]): StoreProduct[] {
  return products.map(productCardPayload);
}
