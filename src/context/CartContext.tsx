"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Cart, CartItem } from "@/lib/types";
import { apiFetch, STORE_API } from "@/lib/api";
import { decodeEntities } from "@/lib/decode";
import { fbTrack } from "@/lib/pixel";
import { useToast } from "./ToastContext";

/** Turn Woo's verbose cart errors into a short, friendly message. */
function friendlyCartError(raw?: string): string {
  const msg = decodeEntities((raw ?? "").replace(/<[^>]+>/g, "")).trim();
  // Pull a remaining-stock number from Woo's various phrasings.
  const stock =
    msg.match(/(\d+)\s*(?:remaining|in stock|left|available)/i) ||
    msg.match(/(?:quantity of|maximum of|max of)\s*(\d+)/i) ||
    msg.match(/(?:have|only|is)\s+(\d+)/i);
  // Woo stock rejections almost always mention "stock" / "quantity" / "maximum".
  if (/stock|quantity|maximum|not enough|cannot add|can'?t add|already have/i.test(msg)) {
    return stock ? `Only ${stock[1]} left in stock` : "Sorry, not enough stock available";
  }
  return msg && msg.length <= 70 ? msg : "Couldn't update cart — please try again";
}

/** Short, friendly coupon errors (Woo messages are verbose + HTML-encoded). */
function friendlyCouponError(raw?: string): string {
  const m = decodeEntities((raw ?? "").replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .replace(/\s+([.!?])/g, "$1")
    // Normalise Woo money strings: "2,200.00৳" → "৳2,200"
    .replace(/([\d,]+(?:\.\d+)?)\s*৳/g, "৳$1")
    .replace(/(৳[\d,]+)\.00\b/g, "$1")
    .trim();
  if (/does not exist|not exist|not valid|invalid|no longer/i.test(m)) return "This coupon code is not valid.";
  if (/expired/i.test(m)) return "This coupon has expired.";
  if (/usage limit|limit has been reached|already been used/i.test(m)) return "This coupon has reached its usage limit.";
  if (/minimum spend/i.test(m)) return m; // keeps the amount, already decoded
  if (/maximum spend/i.test(m)) return "Your cart total is too high for this coupon.";
  if (/already applied/i.test(m)) return "This coupon is already applied.";
  return m && m.length <= 90 ? m : "This coupon can’t be applied.";
}

/**
 * The cart line an add-item call actually touched.
 *
 * Matching on the posted product id is not enough: for a variable product the
 * Store API puts the *variation* id on the cart line, not the parent id we
 * sent. Diffing the cart before and after finds the right line either way —
 * a brand-new key, or an existing line whose quantity went up.
 */
function addedLine(before: Cart | null, after: Cart, productId: number): CartItem | null {
  // No "before" means the initial cart fetch failed, so there is nothing to
  // diff against — every line would look new. Fall back to an id match, which
  // is right for simple products and simply misses for variations.
  if (!before) return after.items.find((i) => i.id === productId) ?? null;
  const prevQty = new Map(before.items.map((i) => [i.key, i.quantity]));
  return after.items.find((i) => i.quantity > (prevQty.get(i.key) ?? 0)) ?? null;
}

/**
 * AddToCart, with the money attached.
 *
 * `value` is what was *just* added (unit price × quantity), not the line's
 * running subtotal — adding a second unit of something already in the cart
 * would otherwise report the whole line again and double-count it.
 *
 * content_ids stays the parent product id, matching ViewContent, so the two
 * events line up against the same catalogue entry.
 */
function trackAddToCart(before: Cart | null, after: Cart, productId: number, quantity: number) {
  const line = addedLine(before, after, productId);
  if (!line) {
    // Line unidentifiable (shouldn't happen) — send the plain event rather
    // than reporting a ৳0 add.
    fbTrack("AddToCart", { content_ids: [productId], content_type: "product", currency: "BDT" });
    return;
  }
  const minor = line.prices.currency_minor_unit ?? 2;
  fbTrack("AddToCart", {
    content_ids: [productId],
    content_type: "product",
    content_name: decodeEntities(line.name),
    currency: "BDT",
    value: (Number(line.prices.price) * quantity) / 10 ** minor,
    contents: [{ id: productId, quantity }],
  });
}

interface ShippingAddress {
  country: string;
  state: string;
  city?: string;
  postcode?: string;
}

const TOKEN_KEY = "gedu-cart-token";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  /** Product ids with an in-flight cart mutation (disables their buttons). */
  pendingIds: Set<number>;
  addItem: (productId: number, quantity?: number, variation?: { attribute: string; value: string }[]) => Promise<boolean>;
  setQuantity: (itemKey: string, quantity: number) => Promise<boolean>;
  removeItem: (itemKey: string) => Promise<boolean>;
  /** Current quantity of a product in the cart (0 if absent). */
  qtyOf: (productId: number) => number;
  /** Right-side cart drawer (desktop). Auto-opens on add-to-cart. */
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  /** Set the shipping location so Woo recalculates the delivery charge. */
  updateShipping: (address: ShippingAddress) => Promise<void>;
  /** True while delivery charge is being recalculated. */
  shippingLoading: boolean;
  /** Apply a coupon code; returns an error message or null on success. */
  applyCoupon: (code: string) => Promise<string | null>;
  removeCoupon: (code: string) => Promise<void>;
  couponLoading: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

async function storeFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await apiFetch(`${STORE_API}/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Cart-Token": token } : {}),
      ...init?.headers,
    },
  });
  const newToken = res.headers.get("Cart-Token");
  if (newToken) localStorage.setItem(TOKEN_KEY, newToken);
  return res;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const keyToProductId = useRef<Map<string, number>>(new Map());
  // Mirrors `cart` outside of render, so addItem can read the pre-mutation cart
  // without taking `cart` as a dependency (which would rebuild the callback on
  // every cart change).
  const cartRef = useRef<Cart | null>(null);
  const { show: showToast } = useToast();

  const syncCart = useCallback((next: Cart) => {
    for (const item of next.items) keyToProductId.current.set(item.key, item.id);
    cartRef.current = next;
    setCart(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    storeFetch("cart")
      .then((res) => res.json())
      .then((data: Cart) => {
        if (!cancelled) syncCart(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [syncCart]);

  // Returns the updated cart on success, null on failure — callers that only
  // need "did it work" coerce it, addItem needs the cart itself to price the
  // line it just added.
  const mutate = useCallback(
    async (productId: number, path: string, body: Record<string, unknown>): Promise<Cart | null> => {
      setPendingIds((prev) => new Set(prev).add(productId));
      try {
        const res = await storeFetch(path, { method: "POST", body: JSON.stringify(body) });
        const data = await res.json().catch(() => null);
        if (res.ok) {
          syncCart(data);
          return data as Cart;
        }
        // Woo rejects e.g. "you already have the max in stock" — surface it briefly.
        showToast(friendlyCartError(data?.message as string | undefined), "error");
        return null;
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }
    },
    [syncCart, showToast],
  );

  const addItem = useCallback(
    async (
      productId: number,
      quantity = 1,
      variation?: { attribute: string; value: string }[],
    ): Promise<boolean> => {
      const body: Record<string, unknown> = { id: productId, quantity };
      if (variation && variation.length) body.variation = variation;
      // Read before awaiting — this is the cart as it was prior to the add.
      const before = cartRef.current;
      const next = await mutate(productId, "cart/add-item", body);
      if (!next) return false; // error toast already shown by mutate
      trackAddToCart(before, next, productId, quantity);
      // Desktop opens the side drawer; mobile has no drawer, so confirm with a toast.
      if (typeof window !== "undefined" && window.innerWidth >= 1024) setDrawerOpen(true);
      else showToast("Added to cart");
      return true;
    },
    [mutate, showToast],
  );

  const setQuantity = useCallback(
    async (itemKey: string, quantity: number): Promise<boolean> => {
      const productId = keyToProductId.current.get(itemKey) ?? -1;
      const path = quantity <= 0 ? "cart/remove-item" : "cart/update-item";
      const body = quantity <= 0 ? { key: itemKey } : { key: itemKey, quantity };
      return (await mutate(productId, path, body)) !== null;
    },
    [mutate],
  );

  const removeItem = useCallback(
    async (itemKey: string): Promise<boolean> => {
      const productId = keyToProductId.current.get(itemKey) ?? -1;
      return (await mutate(productId, "cart/remove-item", { key: itemKey })) !== null;
    },
    [mutate],
  );

  const qtyOf = useCallback(
    (productId: number) => cart?.items.find((i) => i.id === productId)?.quantity ?? 0,
    [cart],
  );

  const updateShipping = useCallback(
    async (address: ShippingAddress) => {
      setShippingLoading(true);
      try {
        const res = await storeFetch("cart/update-customer", {
          method: "POST",
          body: JSON.stringify({ shipping_address: address, billing_address: address }),
        });
        if (!res.ok) return;
        const next: Cart = await res.json();
        syncCart(next);

        // Woo may keep the previously-selected (dearer) rate; force the cheapest
        // so free delivery applies automatically once the cart qualifies.
        for (const pkg of next.shipping_rates ?? []) {
          const rates = pkg.shipping_rates;
          if (rates.length < 2) continue;
          const cheapest = rates.reduce((a, b) => (Number(a.price) <= Number(b.price) ? a : b));
          if (!cheapest.selected) {
            const sel = await storeFetch("cart/select-shipping-rate", {
              method: "POST",
              body: JSON.stringify({ package_id: pkg.package_id, rate_id: cheapest.rate_id }),
            });
            if (sel.ok) syncCart(await sel.json());
          }
        }
      } finally {
        setShippingLoading(false);
      }
    },
    [syncCart],
  );

  const applyCoupon = useCallback(
    async (code: string): Promise<string | null> => {
      setCouponLoading(true);
      try {
        const res = await storeFetch("cart/apply-coupon", {
          method: "POST",
          body: JSON.stringify({ code: code.trim() }),
        });
        const data = await res.json();
        if (!res.ok) return friendlyCouponError(data.message as string | undefined);
        syncCart(data);
        return null;
      } finally {
        setCouponLoading(false);
      }
    },
    [syncCart],
  );

  const removeCoupon = useCallback(
    async (code: string) => {
      setCouponLoading(true);
      try {
        const res = await storeFetch("cart/remove-coupon", {
          method: "POST",
          body: JSON.stringify({ code }),
        });
        if (res.ok) syncCart(await res.json());
      } finally {
        setCouponLoading(false);
      }
    },
    [syncCart],
  );

  const value = useMemo(
    () => ({ cart, loading, pendingIds, addItem, setQuantity, removeItem, qtyOf, drawerOpen, setDrawerOpen, updateShipping, shippingLoading, applyCoupon, removeCoupon, couponLoading }),
    [cart, loading, pendingIds, addItem, setQuantity, removeItem, qtyOf, drawerOpen, updateShipping, shippingLoading, applyCoupon, removeCoupon, couponLoading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
