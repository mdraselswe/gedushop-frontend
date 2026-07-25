"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Eye, X } from "lucide-react";
import type { StoreProduct } from "@/lib/types";
import { discountPercent, formatPrice } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";
import ProductGallery from "./ProductGallery";

/**
 * Quick view: eye button on the product card opens a modal with the product
 * essentials — no page navigation, cart stays one tap away.
 */
export default function QuickView({ product }: { product: StoreProduct }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // drives the enter/leave transition

  useEffect(() => {
    if (!open) return;
    // next frame → transition runs on mount
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      // When the gallery lightbox is open above us, Escape belongs to it.
      if (e.key === "Escape" && !document.querySelector("[data-lightbox]")) close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setShown(false);
    setTimeout(() => setOpen(false), 200); // wait for the leave transition
  }

  const discount = discountPercent(product.prices);

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        aria-label={`Quick view: ${product.name}`}
        className="flex size-8 items-center justify-center rounded-full bg-white/90 text-plum-600 shadow-md backdrop-blur transition-all hover:bg-plum-600 hover:text-white md:opacity-0 md:group-hover:opacity-100"
      >
        <Eye className="size-4" strokeWidth={2.25} />
      </button>

      {open && createPortal(
        // Portal to <body>: the card wraps everything in a <Link>, so rendering
        // the modal in place would make every click inside it navigate.
        <div
          className={`fixed inset-0 z-[60] flex items-end justify-center p-0 transition-opacity duration-200 sm:items-center sm:p-6 ${
            shown ? "opacity-100" : "opacity-0"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={product.name}
          // Portals bubble events through the REACT tree, so without this every
          // click inside the modal still reaches the card's <Link> and navigates.
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 bg-plum-900/40 backdrop-blur-sm" onClick={close} />

          <div
            className={`relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl transition-all duration-200 sm:rounded-3xl ${
              shown ? "translate-y-0 scale-100" : "translate-y-6 scale-95 sm:translate-y-0"
            }`}
          >
            <button
              onClick={close}
              aria-label="Close quick view"
              className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-plum-600 shadow-md backdrop-blur transition-colors hover:bg-plum-600 hover:text-white"
            >
              <X className="size-4.5" strokeWidth={2.5} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="min-w-0 p-4 pb-0 sm:p-5 sm:pb-5">
                <ProductGallery images={product.images} name={product.name} discount={discount} />
              </div>

              <div className="flex min-w-0 flex-col p-5 sm:p-6">
                <h2 className="line-clamp-3 pr-9 font-heading text-base font-semibold leading-snug text-plum-800 sm:text-lg">
                  {product.name}
                </h2>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-plum-700">
                    {formatPrice(product.prices.price, product.prices)}
                  </span>
                  {product.on_sale && (
                    <span className="text-sm text-plum-300 line-through">
                      {formatPrice(product.prices.regular_price, product.prices)}
                    </span>
                  )}
                </div>

                <p className={`mt-1 text-xs font-bold ${product.is_in_stock ? "text-plum-400" : "text-coral-600"}`}>
                  {product.is_in_stock ? "In stock" : "Out of stock"}
                </p>

                {product.short_description && (
                  <div
                    className="mt-3 line-clamp-4 text-xs leading-relaxed text-plum-500 [&_img]:hidden"
                    dangerouslySetInnerHTML={{ __html: product.short_description }}
                  />
                )}

                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <AddToCartButton
                    productId={product.id}
                    disabled={!product.is_purchasable || !product.is_in_stock}
                  />
                  <Link
                    href={`/product/${product.slug}`}
                    onClick={close}
                    className="flex items-center gap-1 text-xs font-extrabold text-coral-500 hover:text-coral-600"
                  >
                    Full details <ArrowRight className="size-3.5" strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
