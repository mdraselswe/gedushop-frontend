/** Mirrors ProductCard's geometry so loading content can be replaced in place. */
export default function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-plum-100/70 bg-white shadow-[var(--shadow-soft)]">
      <div className="relative mx-1.5 mt-1.5 aspect-square overflow-hidden rounded-xl bg-plum-50 sm:mx-2 sm:mt-2">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-plum-50 via-white/70 to-plum-50" />
      </div>
      <div className="flex flex-1 flex-col px-3 pt-2.5 sm:px-4 sm:pt-3.5">
        <div className="h-4 w-[88%] animate-pulse rounded bg-plum-50" />
        <div className="mt-2 h-4 w-[62%] animate-pulse rounded bg-plum-50" />
        <div className="mt-1.5 h-4 w-20 animate-pulse rounded bg-plum-50" />
      </div>
      <div className="flex items-center justify-between gap-1.5 px-3 pb-3 pt-1.5 sm:gap-2 sm:px-4 sm:pb-4 sm:pt-2">
        <div className="h-5 w-14 animate-pulse rounded bg-plum-50 sm:w-16" />
        <div className="size-8 animate-pulse rounded-full bg-plum-50 sm:size-9" />
      </div>
    </div>
  );
}
