/**
 * The customer's own order list, kept on their device.
 *
 * The shop has no accounts, so there is nowhere server-side to hang a history
 * off. What the browser can do is remember the orders it placed itself: the
 * checkout writes one row per order, and /my-orders reads them back and asks
 * the tracker for each one's current status.
 *
 * This is the fast path, not the only one. It is empty on a new device, in a
 * different browser (an order placed inside the Facebook in-app browser is
 * invisible to Chrome), and after iOS clears storage for a site left unvisited
 * for a week. /my-orders falls back to a phone + order-number lookup for all of
 * those, and merges what comes back into this list so the device learns.
 */

export interface StoredOrder {
  id: number | string;
  /** Needed to re-authenticate against /track on every refresh. */
  phone: string;
  /** ISO date the order was placed. */
  date: string;
  /** Already formatted with the currency symbol — the list needs no totals object. */
  total: string;
  /** One line of item names, e.g. "Sunscreen × 2, Face wash". */
  summary: string;
}

const KEY = "gedu_orders";
const MAX = 50;

export function getOrders(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/** Newest first, one row per order id — a success page reopened twice adds nothing. */
function write(list: StoredOrder[]) {
  try {
    const seen = new Set<string>();
    const deduped = list.filter((o) => {
      const id = String(o.id);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(KEY, JSON.stringify(deduped.slice(0, MAX)));
  } catch {
    // storage full / disabled — the lookup form still works
  }
}

export function addOrder(order: StoredOrder) {
  if (typeof window === "undefined") return;
  write([order, ...getOrders()]);
}

/**
 * Fold a phone lookup's results into the list.
 *
 * Existing rows win on nothing — the server's copy is fresher than whatever the
 * checkout wrote months ago — but rows the server didn't return are kept, since
 * a lookup covers one phone number and the device may remember another.
 */
export function mergeOrders(orders: StoredOrder[]) {
  if (typeof window === "undefined") return;
  write([...orders, ...getOrders()]);
}
