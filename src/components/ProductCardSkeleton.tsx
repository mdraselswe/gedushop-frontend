/** Mirrors ProductCard's geometry so loading content can be replaced in place. */
export default function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-plum-100/70 bg-white shadow-[var(--shadow-soft)]">
      <div className="relative mx-2 mt-2 aspect-square overflow-hidden rounded-xl bg-plum-50">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-plum-50 via-white/70 to-plum-50" />
      </div>
      <div className="flex flex-1 flex-col px-4 pt-3.5">
        <div className="h-4 w-[88%] animate-pulse rounded bg-plum-50" />
        <div className="mt-2 h-4 w-[62%] animate-pulse rounded bg-plum-50" />
        <div className="mt-1.5 h-4 w-20 animate-pulse rounded bg-plum-50" />
      </div>
      <div className="flex items-center justify-between gap-2 px-4 pb-4 pt-2">
        <div className="h-5 w-16 animate-pulse rounded bg-plum-50" />
        <div className="size-9 animate-pulse rounded-full bg-plum-50" />
      </div>
    </div>
  );
}
