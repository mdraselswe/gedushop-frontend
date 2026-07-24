"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Cart } from "@/lib/types";
import { apiFetch, STORE_API } from "@/lib/api";
import { decodeEntities } from "@/lib/decode";
import { fbTrack } from "@/lib/pixel";
import { useToast } from "./ToastContext";

/** Turn Woo's verbose cart errors into a short, friendly message. */
function friendlyCartError(raw?: string): string {
  const msg = decodeEntities((raw ?? "").replace(/<[^>]+>/g, "")).trim();
  const stock = msg.match(/(\d+)\s*(?:remaining|in stock)/i);
  if (/not enough stock|cannot add|already have|out of stock/i.test(msg)) {
    return stock ? `Only ${stock[1]} left in stock` : "Not enough stock available";
  }
  return msg && msg.length <= 70 ? msg : "Couldn't update cart — please try again";
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
  addItem: (productId: number, quantity?: number) => Promise<boolean>;
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
  const { show: showToast } = useToast();

  const syncCart = useCallback((next: Cart) => {
    for (const item of next.items) keyToProductId.current.set(item.key, item.id);
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

  const mutate = useCallback(
    async (productId: number, path: string, body: Record<string, unknown>): Promise<boolean> => {
      setPendingIds((prev) => new Set(prev).add(productId));
      try {
        const res = await storeFetch(path, { method: "POST", body: JSON.stringify(body) });
        const data = await res.json().catch(() => null);
        if (res.ok) {
          syncCart(data);
          return true;
        }
        // Woo rejects e.g. "you already have the max in stock" — surface it briefly.
        showToast(friendlyCartError(data?.message as string | undefined), "error");
        return false;
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
    async (productId: number, quantity = 1): Promise<boolean> => {
      const ok = await mutate(productId, "cart/add-item", { id: productId, quantity });
      if (!ok) return false; // error toast already shown by mutate
      fbTrack("AddToCart", { content_ids: [productId], content_type: "product", currency: "BDT" });
      // Desktop opens the side drawer; mobile has no drawer, so confirm with a toast.
      if (typeof window !== "undefined" && window.innerWidth >= 1024) setDrawerOpen(true);
      else showToast("Added to cart");
      return true;
    },
    [mutate, showToast],
  );

  const setQuantity = useCallback(
    (itemKey: string, quantity: number) => {
      const productId = keyToProductId.current.get(itemKey) ?? -1;
      if (quantity <= 0) return mutate(productId, "cart/remove-item", { key: itemKey });
      return mutate(productId, "cart/update-item", { key: itemKey, quantity });
    },
    [mutate],
  );

  const removeItem = useCallback(
    (itemKey: string) => {
      const productId = keyToProductId.current.get(itemKey) ?? -1;
      return mutate(productId, "cart/remove-item", { key: itemKey });
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
        if (!res.ok) return data.message?.replace(/<[^>]+>/g, "") || "Invalid coupon code.";
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
