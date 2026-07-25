import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { StoreProduct } from "@/lib/types";
import { discountPercent, formatPrice } from "@/lib/format";
import AddToCartButton from "./AddToCartButton";
import QuickView from "./QuickView";
import Stars from "./Stars";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product }: { product: StoreProduct }) {
  const image = product.images[0];
  const discount = discountPercent(product.prices);
  const soldOut = !product.is_in_stock || !product.is_purchasable;
  // Sold-out badge takes the top-left slot; discount is moot when unavailable.
  const showDiscount = discount && !soldOut;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/product/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-plum-50 to-coral-50/40">
          {image ? (
            // Plain <img> + WP srcset: static export can't run the Next optimizer,
            // so this lets the browser fetch a sized WebP instead of the full image.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.thumbnail || image.src}
              srcSet={image.srcset}
              sizes={image.srcset ? "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" : undefined}
              alt={image.alt || product.name}
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07] ${
                soldOut ? "grayscale" : ""
              }`}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="size-10 text-plum-200" strokeWidth={1.5} />
            </div>
          )}
          {/* dim the whole image area when sold out */}
          {soldOut && <span className="pointer-events-none absolute inset-0 bg-white/45" aria-hidden />}
          {showDiscount && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-coral-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-[var(--shadow-coral)]">
              -{discount}%
            </span>
          )}
          {soldOut && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-plum-800/90 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm">
              Sold Out
            </span>
          )}
          <span className="absolute right-2.5 top-2.5">
            <QuickView product={product} />
          </span>
          <span className="absolute left-2.5" style={{ top: showDiscount || soldOut ? "2.9rem" : "0.625rem" }}>
            <WishlistButton productId={product.id} />
          </span>
        </div>

        <div className="flex flex-1 flex-col px-3.5 pt-3.5">
          <h3 className="line-clamp-2 min-h-[2.75em] text-sm font-semibold leading-snug text-plum-800">
            {product.name}
          </h3>
          {/* fixed-height rating slot so every card lines up whether rated or not */}
          <div className="mt-1.5 flex h-4 items-center gap-1">
            {product.review_count > 0 && (
              <>
                <Stars value={Number(product.average_rating) || 0} className="size-3" />
                <span className="text-[11px] font-bold text-plum-400">({product.review_count})</span>
              </>
            )}
          </div>
        </div>
      </Link>

      {/* price + control share one row so they never overlap or overflow on narrow cards */}
      <div className="flex items-center justify-between gap-2 px-3.5 pb-3.5 pt-2">
        {/* mobile (2-col) stacks to save width; sm+ shows both prices on one line */}
        <div className="flex min-w-0 flex-col leading-tight sm:flex-row sm:items-baseline sm:gap-1.5">
          <span className="text-lg font-extrabold tracking-tight text-plum-700 tabular-nums">
            {formatPrice(product.prices.price, product.prices)}
          </span>
          {product.on_sale && (
            <span className="text-[11px] text-plum-300 line-through tabular-nums sm:text-xs">
              {formatPrice(product.prices.regular_price, product.prices)}
            </span>
          )}
        </div>
        {soldOut ? (
          <span className="shrink-0 rounded-full bg-plum-100 px-3.5 py-2 text-xs font-extrabold text-plum-400">
            Sold out
          </span>
        ) : (
          <AddToCartButton productId={product.id} disabled={false} />
        )}
      </div>
    </article>
  );
}
