import ProductGridSkeleton from "@/components/ProductGridSkeleton";

/** Reserve the category page's real geometry so loading-to-content does not jump. */
export default function CategoryLoading() {
  return (
    <div className="min-h-[100dvh] space-y-4 px-4 pb-8 pt-4" aria-label="Loading category products">
      <div className="h-4 w-40 animate-pulse rounded-full bg-plum-100" />

      <div className="grain flex min-h-24 items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-plum-700 via-plum-600 to-coral-500 p-5 md:min-h-28 md:p-7">
        <div className="size-14 shrink-0 animate-pulse rounded-2xl bg-white/15 md:size-16" />
        <div className="flex-1 space-y-2.5">
          <div className="h-7 w-48 max-w-[70%] animate-pulse rounded-lg bg-white/20" />
          <div className="h-4 w-64 max-w-[85%] animate-pulse rounded bg-white/15" />
        </div>
      </div>

      <div className="fancy-surface flex h-12 items-center justify-between gap-3 rounded-xl p-2">
        <div className="h-9 w-24 animate-pulse rounded-full bg-white ring-1 ring-plum-100" />
        <div className="h-9 w-36 animate-pulse rounded-full bg-white ring-1 ring-plum-100" />
      </div>

      <ProductGridSkeleton count={24} />
    </div>
  );
}
