import ProductCardSkeleton from "@/components/ProductCardSkeleton";

/** Mirrors the shop hero, toolbar and grid while the route is being streamed. */
export default function ShopLoading() {
  return (
    <div className="space-y-4 px-4 pt-4" aria-label="Loading products">
      <div className="h-[6.5rem] animate-pulse rounded-2xl bg-gradient-to-r from-plum-100 via-plum-50 to-coral-50" />

      <div className="fancy-surface flex h-12 items-center justify-between gap-3 rounded-xl p-2">
        <div className="h-9 w-24 animate-pulse rounded-full bg-white ring-1 ring-plum-100" />
        <div className="h-9 w-36 animate-pulse rounded-full bg-white ring-1 ring-plum-100" />
      </div>

      <div className="grid grid-cols-1 gap-3 min-[381px]:grid-cols-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 24 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
