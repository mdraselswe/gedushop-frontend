import type { CartTotals } from "./types";

/**
 * The cart's merchandise total in minor units — items minus discount.
 *
 * Deliberately NOT `totals.total_price`. WooCommerce applies a default
 * flat-rate shipping to every cart, so total_price already carries a delivery
 * charge before the customer has picked a district — an ৳80 cart showed ৳160
 * in the header while the cart page correctly said ৳80.
 *
 * Delivery only becomes a real number on the checkout page, once a district is
 * chosen and Woo has recalculated the rate. Everywhere else — header, dock,
 * mobile bar, cart page, drawer — this is the honest figure to show.
 */
export function cartItemsTotal(
  totals: Pick<CartTotals, "total_items" | "total_discount">,
): string {
  return String(Number(totals.total_items) - Number(totals.total_discount));
}
