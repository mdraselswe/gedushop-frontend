/**
 * Woo order status → the customer-facing progress the shop actually runs.
 *
 * Shared by the single-order tracker and the order list so the two never drift
 * into describing the same status differently.
 */

/** COD flow → 3 visible steps. Each Woo status maps to the furthest reached step. */
export const STEPS = ["Order placed", "Confirmed & preparing", "Delivered"] as const;

export const STATUS_STEP: Record<string, number> = {
  pending: 0,
  "on-hold": 0,
  processing: 1,
  completed: 2,
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Order received",
  "on-hold": "On hold",
  processing: "Confirmed — preparing your order",
  completed: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

/** Shorter labels — the list shows one per row and has no space for a sentence. */
export const STATUS_SHORT: Record<string, string> = {
  pending: "Received",
  "on-hold": "On hold",
  processing: "Preparing",
  completed: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
};

export const CANCELLED_STATUSES = ["cancelled", "refunded", "failed"];

export function isCancelled(status: string): boolean {
  return CANCELLED_STATUSES.includes(status);
}

export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
