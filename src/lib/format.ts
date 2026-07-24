import type { StorePrices } from "./types";

/** Store API sends prices in minor units (e.g. "79900" with minor_unit 2 = 799.00). */
export function formatPrice(raw: string, prices: Pick<StorePrices, "currency_minor_unit">): string {
  const minor = prices.currency_minor_unit ?? 2;
  const value = Number(raw) / 10 ** minor;
  const formatted = value % 1 === 0 ? value.toLocaleString("en-IN") : value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `৳${formatted}`;
}

export function discountPercent(prices: StorePrices): number | null {
  const regular = Number(prices.regular_price);
  const sale = Number(prices.price);
  if (!regular || sale >= regular) return null;
  return Math.round(((regular - sale) / regular) * 100);
}
