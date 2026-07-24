import Image from "next/image";
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

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-soft)] ring-1 ring-plum-100/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/product/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-plum-50 to-coral-50/40">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt || product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageOff className="size-10 text-plum-200" strokeWidth={1.5} />
            </div>
          )}
          {discount && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-coral-500 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-[var(--shadow-coral)]">
              -{discount}%
            </span>
          )}
          <span className="absolute right-2.5 top-2.5">
            <QuickView product={product} />
          </span>
          <span className="absolute left-2.5" style={{ top: discount ? "2.9rem" : "0.625rem" }}>
            <WishlistButton productId={product.id} />
          </span>
        </div>

        <div className="flex flex-1 flex-col p-3.5">
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
          <div className="mt-auto flex items-baseline gap-1.5 pt-2">
            <span className="text-lg font-extrabold tracking-tight text-plum-700 tabular-nums">
              {formatPrice(product.prices.price, product.prices)}
            </span>
            {product.on_sale && (
              <span className="text-xs text-plum-300 line-through tabular-nums">
                {formatPrice(product.prices.regular_price, product.prices)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="absolute bottom-3.5 right-3">
        <AddToCartButton productId={product.id} disabled={!product.is_purchasable || !product.is_in_stock} />
      </div>
    </article>
  );
}
