import ProductCardSkeleton from "@/components/ProductCardSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <div className="h-24 animate-pulse rounded-2xl bg-white md:h-28" />
      <div className="mt-5">
        <div className="grid grid-cols-1 gap-3 min-[381px]:grid-cols-2 sm:grid-cols-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 20 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  );
}
