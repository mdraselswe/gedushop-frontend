"use client";

import { useCart } from "@/context/CartContext";
import { MinusIcon, PlusIcon } from "./Icons";

/**
 * Chaldal-style quick add: coral + button; once in cart it becomes a
 * quantity stepper. Works directly from product cards — no page visit needed.
 */
export default function AddToCartButton({ productId, disabled }: { productId: number; disabled?: boolean }) {
  const { cart, addItem, setQuantity, pendingIds, qtyOf } = useCart();
  const qty = qtyOf(productId);
  const busy = pendingIds.has(productId);
  const itemKey = cart?.items.find((i) => i.id === productId)?.key;

  if (qty === 0) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          addItem(productId);
        }}
        disabled={disabled || busy}
        aria-label="Add to cart"
        className="flex size-9 items-center justify-center rounded-full bg-coral-500 text-white shadow-md shadow-coral-500/40 transition-transform hover:bg-coral-600 active:scale-90 disabled:opacity-50"
      >
        <PlusIcon className="size-5" />
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-plum-600 text-white shadow-md shadow-plum-600/30">
      <button
        onClick={(e) => {
          e.preventDefault();
          if (itemKey) setQuantity(itemKey, qty - 1);
        }}
        disabled={busy}
        aria-label="Decrease quantity"
        className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-plum-700 disabled:opacity-50"
      >
        <MinusIcon className="size-4" />
      </button>
      <span className="min-w-4 text-center text-sm font-extrabold tabular-nums">{busy ? "…" : qty}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          addItem(productId);
        }}
        disabled={busy}
        aria-label="Increase quantity"
        className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-plum-700 disabled:opacity-50"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
